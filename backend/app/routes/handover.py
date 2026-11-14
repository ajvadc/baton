import sqlite3
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.schemas import HandoverPackage, HandoverReceiptRequest, ProjectOut, ClaimOut, QuestionOut
from app.routes.claims import build_claim_out_sqlite
from app.routes.questions import build_question_out
from app.services.permission_filter import filter_claims_by_role
from app.services.audit_service import log_event

router = APIRouter(prefix="/api/projects/{project_id}/handover", tags=["Handover"])

@router.get("", response_model=HandoverPackage)
def get_handover_package(
    project_id: str,
    role: str = Query("Successor", description="Role: Successor, Teammate, Manager, Observer"),
    area: str = Query("all"),
    viewer_name: str = Query("Anonymous Reader"),
    conn: sqlite3.Connection = Depends(get_db)
):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch all claims
    claim_rows = conn.execute("SELECT * FROM claims WHERE project_id = ?", (project_id,)).fetchall()
    claims_out = [build_claim_out_sqlite(r, conn) for r in claim_rows]

    # Convert to dict for permission filtering
    claims_dict_list = [c.dict() for c in claims_out]
    filtered_dicts = filter_claims_by_role(claims_dict_list, role, area_filter=area)

    # Reconstruct categorized lists
    decisions = [ClaimOut(**c) for c in filtered_dicts if c["category"] == "decision"]
    ownership = [ClaimOut(**c) for c in filtered_dicts if c["category"] == "ownership"]
    risks = [ClaimOut(**c) for c in filtered_dicts if c["category"] == "risk"]
    dependencies = [ClaimOut(**c) for c in filtered_dicts if c["category"] == "dependency"]
    timeline = [ClaimOut(**c) for c in filtered_dicts if c["category"] == "timeline"]
    first_week_plan = [ClaimOut(**c) for c in filtered_dicts if c["category"] == "next_action"]

    first_week_plan.sort(key=lambda x: x.action_day or 99)

    # Fetch questions
    q_rows = conn.execute("SELECT * FROM leaver_questions WHERE project_id = ?", (project_id,)).fetchall()
    q_out = [build_question_out(r) for r in q_rows]

    # Fetch latest approval
    latest_appr = conn.execute("SELECT * FROM handover_approvals WHERE project_id = ? ORDER BY approved_at DESC LIMIT 1", (project_id,)).fetchone()
    approval_data = None
    if latest_appr:
        approval_data = {
            "version": latest_appr["version"],
            "reviewer_name": latest_appr["reviewer_name"],
            "reviewer_role": latest_appr["reviewer_role"],
            "approved_at": latest_appr["approved_at"],
            "comments": latest_appr["comments"]
        }

    # Fetch latest receipt
    latest_receipt = conn.execute("SELECT * FROM handover_receipts WHERE project_id = ? ORDER BY acknowledged_at DESC LIMIT 1", (project_id,)).fetchone()
    receipt_data = None
    if latest_receipt:
        receipt_data = {
            "recipient_name": latest_receipt["recipient_name"],
            "recipient_role": latest_receipt["recipient_role"],
            "signature": latest_receipt["sign_off_signature"],
            "acknowledged_at": latest_receipt["acknowledged_at"],
            "checklist": json.loads(latest_receipt["checklist_completed"]) if latest_receipt["checklist_completed"] else []
        }

    summary = {
        "total_claims": len(filtered_dicts),
        "verified_count": sum(1 for c in filtered_dicts if c["status"] == "Verified"),
        "inferred_count": sum(1 for c in filtered_dicts if c["status"] == "Inferred"),
        "conflicting_count": sum(1 for c in filtered_dicts if c["status"] == "Conflicting"),
        "missing_count": sum(1 for c in filtered_dicts if c["status"] == "Missing"),
        "questions_total": len(q_rows),
        "questions_answered": sum(1 for q in q_rows if q["is_answered"])
    }

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name=viewer_name,
        actor_role=role,
        action="HANDOVER_VIEWED",
        details={"role": role, "filtered_claims_count": len(filtered_dicts)}
    )

    proj_out = ProjectOut(
        id=project["id"],
        name=project["name"],
        description=project["description"],
        target_role=project["target_role"],
        leaving_member=project["leaving_member"],
        incoming_member=project["incoming_member"],
        reviewer_name=project["reviewer_name"],
        status=project["status"],
        active_version=project["active_version"],
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )

    return HandoverPackage(
        project=proj_out,
        viewer_role=role,
        is_approved=(project["status"] in ["Approved", "HandedOver"]),
        version=project["active_version"],
        summary=summary,
        decisions=decisions,
        ownership=ownership,
        risks=risks,
        dependencies=dependencies,
        timeline=timeline,
        first_week_plan=first_week_plan,
        unresolved_questions=q_out,
        approval=approval_data,
        receipt=receipt_data
    )

@router.post("/acknowledge")
def acknowledge_handover_receipt(
    project_id: str,
    payload: HandoverReceiptRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rec_id = generate_uuid()
    ack_at = now_iso()
    checklist_str = json.dumps(payload.checklist_completed)

    conn.execute(
        """
        INSERT INTO handover_receipts (id, project_id, recipient_name, recipient_role, checklist_completed, sign_off_signature, acknowledged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (rec_id, project_id, payload.recipient_name, payload.recipient_role, checklist_str, payload.sign_off_signature, ack_at)
    )

    conn.execute("UPDATE projects SET status = 'HandedOver', updated_at = ? WHERE id = ?", (ack_at, project_id))

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name=payload.recipient_name,
        actor_role=payload.recipient_role,
        action="HANDOVER_ACKNOWLEDGED",
        details={
            "recipient_name": payload.recipient_name,
            "signature": payload.sign_off_signature,
            "checklist_count": len(payload.checklist_completed)
        }
    )

    return {
        "status": "success",
        "message": f"Handover acknowledged and signed off by {payload.recipient_name}.",
        "receipt_id": rec_id,
        "acknowledged_at": ack_at
    }
