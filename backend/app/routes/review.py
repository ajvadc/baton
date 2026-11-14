import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.schemas import BatchReviewRequest, HandoverApprovalRequest
from app.services.audit_service import log_event

router = APIRouter(prefix="/api/projects/{project_id}/review", tags=["Review Gate"])

@router.post("/batch")
def batch_review_claims(project_id: str, payload: BatchReviewRequest, conn: sqlite3.Connection = Depends(get_db)):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    processed = []
    ts = now_iso()
    for action in payload.actions:
        claim = conn.execute("SELECT * FROM claims WHERE id = ? AND project_id = ?", (action.claim_id, project_id)).fetchone()
        if not claim:
            continue

        set_clauses = ["reviewer_decision = ?", "updated_at = ?"]
        values = [action.decision, ts]

        if action.reviewer_notes:
            set_clauses.append("reviewer_notes = ?")
            values.append(action.reviewer_notes)
        if action.updated_title:
            set_clauses.append("title = ?")
            values.append(action.updated_title)
        if action.updated_description:
            set_clauses.append("description = ?")
            values.append(action.updated_description)
        if action.new_status:
            set_clauses.append("status = ?")
            values.append(action.new_status)

        values.append(action.claim_id)
        conn.execute(f"UPDATE claims SET {', '.join(set_clauses)} WHERE id = ?", values)

        processed.append({
            "claim_id": action.claim_id,
            "decision": action.decision,
            "title": action.updated_title or claim["title"]
        })

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name=payload.reviewer_name,
        actor_role=payload.reviewer_role,
        action="BATCH_REVIEW_SUBMITTED",
        details={"reviewed_claims_count": len(processed), "actions": processed}
    )

    return {"status": "success", "processed_claims": len(processed)}

@router.post("/approve-handover")
def approve_handover(project_id: str, payload: HandoverApprovalRequest, conn: sqlite3.Connection = Depends(get_db)):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    appr_id = generate_uuid()
    approved_at = now_iso()
    curr_version = project["active_version"]

    conn.execute(
        """
        INSERT INTO handover_approvals (id, project_id, version, reviewer_name, reviewer_role, comments, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (appr_id, project_id, curr_version, payload.reviewer_name, payload.reviewer_role, payload.comments, approved_at)
    )

    conn.execute(
        """
        UPDATE projects
        SET status = 'Approved', active_version = active_version + 1, updated_at = ?
        WHERE id = ?
        """,
        (approved_at, project_id)
    )

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name=payload.reviewer_name,
        actor_role=payload.reviewer_role,
        action="HANDOVER_APPROVED",
        details={
            "approved_version": curr_version,
            "comments": payload.comments
        }
    )

    return {
        "status": "success",
        "message": f"Handover version v{curr_version} approved by {payload.reviewer_name}. Review Gate cleared.",
        "approval_id": appr_id,
        "approved_version": curr_version
    }

@router.get("/approvals")
def get_approvals(project_id: str, conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute("SELECT * FROM handover_approvals WHERE project_id = ? ORDER BY approved_at DESC", (project_id,)).fetchall()
    return [dict(r) for r in rows]
