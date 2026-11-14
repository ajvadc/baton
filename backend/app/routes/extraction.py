import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.services.ai_extractor import extract_claims_with_gemini, extract_claims_fallback
from app.services.verification import evaluate_claim_evidence
from app.services.gap_analysis import generate_leaver_questions_from_claims
from app.services.audit_service import log_event
from app.config import settings

router = APIRouter(prefix="/api/projects/{project_id}/reconstruct", tags=["Reconstruction"])

@router.post("")
async def reconstruct_and_verify_project(project_id: str, conn: sqlite3.Connection = Depends(get_db)):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch all chunks for this project
    chunks_rows = conn.execute("""
        SELECT sc.id, sc.source_id, sc.span_identifier, sc.redacted_text, sc.sensitivity_level
        FROM source_chunks sc
        JOIN sources s ON sc.source_id = s.id
        WHERE s.project_id = ?
        ORDER BY sc.chunk_index ASC
    """, (project_id,)).fetchall()

    if not chunks_rows:
        raise HTTPException(status_code=400, detail="No sources or chunks available to reconstruct. Please upload documents first.")

    chunks_data = [dict(c) for c in chunks_rows]

    # Try Gemini API structured output first
    raw_claims = await extract_claims_with_gemini(chunks_data)
    if not raw_claims:
        raw_claims = extract_claims_fallback(chunks_data)

    # Clear previous claims and leaver questions if re-running
    conn.execute("DELETE FROM claims WHERE project_id = ?", (project_id,))
    conn.execute("DELETE FROM leaver_questions WHERE project_id = ?", (project_id,))

    created_claims = []
    ts = now_iso()

    for c_data in raw_claims:
        claim_id = generate_uuid()
        cited_indices = c_data.get("cited_chunk_indices", [])
        is_confidential = 1 if (c_data.get("category") == "risk" and "signing secret" in c_data.get("title", "").lower()) else 0

        conn.execute("""
            INSERT INTO claims (id, project_id, category, title, description, alternatives_considered, status, confidence_score, conflict_details, reviewer_decision, reviewer_notes, version, area, is_confidential, action_day, action_owner, blockers, contacts, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0.85, ?, 'pending', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            claim_id,
            project_id,
            c_data.get("category", "decision"),
            c_data.get("title", "Untitled Claim"),
            c_data.get("description", ""),
            c_data.get("alternatives_considered"),
            c_data.get("status", "Inferred"),
            c_data.get("conflict_details"),
            project["active_version"],
            c_data.get("area", "backend"),
            is_confidential,
            c_data.get("action_day"),
            c_data.get("action_owner"),
            c_data.get("blockers"),
            c_data.get("contacts"),
            ts,
            ts
        ))

        citations_for_eval = []
        for idx in cited_indices:
            if 0 <= idx < len(chunks_rows):
                target_chunk = chunks_rows[idx]
                quote_text = target_chunk["redacted_text"][:280]
                cit_id = generate_uuid()
                conn.execute("""
                    INSERT INTO claim_citations (id, claim_id, source_chunk_id, quote_span, relevance_explanation)
                    VALUES (?, ?, ?, ?, ?)
                """, (cit_id, claim_id, target_chunk["id"], quote_text, f"Matches claim context in {target_chunk['span_identifier']}"))

                citations_for_eval.append({
                    "source_title": target_chunk["span_identifier"],
                    "quote_span": quote_text
                })

        eval_result = evaluate_claim_evidence(c_data, citations_for_eval)
        conn.execute("UPDATE claims SET status = ?, confidence_score = ? WHERE id = ?", (eval_result["status"], eval_result["confidence_score"], claim_id))

        created_claims.append({
            "id": claim_id,
            "category": c_data.get("category"),
            "title": c_data.get("title"),
            "description": c_data.get("description"),
            "status": eval_result["status"],
            "conflict_details": c_data.get("conflict_details")
        })

    # Gap Analysis: Convert gaps and conflicts into leaver questions
    auto_questions = generate_leaver_questions_from_claims(created_claims)
    for q in auto_questions:
        q_id = generate_uuid()
        conn.execute("""
            INSERT INTO leaver_questions (id, project_id, claim_id, context_type, question_text, urgency, leaver_answer, is_answered, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?)
        """, (q_id, project_id, q["claim_id"], q["context_type"], q["question_text"], q["urgency"], ts))

    conn.execute("UPDATE projects SET status = 'ReviewPending', updated_at = ? WHERE id = ?", (ts, project_id))

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name="Baton AI Engine",
        actor_role="Reconstruction Engine",
        action="CLAIMS_RECONSTRUCTED",
        details={
            "claims_extracted": len(created_claims),
            "questions_generated": len(auto_questions),
            "model_used": settings.GEMINI_MODEL if settings.GEMINI_API_KEY else "deterministic_extractor"
        }
    )

    return {
        "status": "success",
        "message": f"Reconstructed {len(created_claims)} claims across decisions, owners, risks, dependencies, timeline and next actions.",
        "claims_count": len(created_claims),
        "questions_generated": len(auto_questions)
    }
