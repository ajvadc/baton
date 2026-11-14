import sqlite3
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.schemas import QuestionOut, QuestionAnswer, QuestionCreate
from app.services.audit_service import log_event

router = APIRouter(tags=["Questions"])

def build_question_out(r: sqlite3.Row) -> QuestionOut:
    return QuestionOut(
        id=r["id"],
        project_id=r["project_id"],
        claim_id=r["claim_id"],
        context_type=r["context_type"],
        question_text=r["question_text"],
        urgency=r["urgency"],
        leaver_answer=r["leaver_answer"],
        is_answered=bool(r["is_answered"]),
        answered_at=r["answered_at"],
        created_at=r["created_at"]
    )

@router.get("/api/projects/{project_id}/questions", response_model=List[QuestionOut])
def list_questions(project_id: str, conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute("SELECT * FROM leaver_questions WHERE project_id = ? ORDER BY is_answered ASC, created_at ASC", (project_id,)).fetchall()
    return [build_question_out(r) for r in rows]

@router.post("/api/projects/{project_id}/questions", response_model=QuestionOut)
def create_question(project_id: str, payload: QuestionCreate, conn: sqlite3.Connection = Depends(get_db)):
    q_id = generate_uuid()
    created_at = now_iso()
    conn.execute(
        """
        INSERT INTO leaver_questions (id, project_id, claim_id, context_type, question_text, urgency, leaver_answer, is_answered, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?)
        """,
        (q_id, project_id, payload.claim_id, payload.context_type, payload.question_text, payload.urgency, created_at)
    )

    r = conn.execute("SELECT * FROM leaver_questions WHERE id = ?", (q_id,)).fetchone()
    return build_question_out(r)

@router.post("/api/questions/{question_id}/answer", response_model=QuestionOut)
def answer_question(question_id: str, payload: QuestionAnswer, conn: sqlite3.Connection = Depends(get_db)):
    q = conn.execute("SELECT * FROM leaver_questions WHERE id = ?", (question_id,)).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    answered_at = now_iso()
    conn.execute(
        """
        UPDATE leaver_questions
        SET leaver_answer = ?, is_answered = 1, answered_at = ?
        WHERE id = ?
        """,
        (payload.leaver_answer, answered_at, question_id)
    )

    project = conn.execute("SELECT * FROM projects WHERE id = ?", (q["project_id"],)).fetchone()

    # If linked to a claim, resolve conflict or fill gap
    if q["claim_id"]:
        claim = conn.execute("SELECT * FROM claims WHERE id = ?", (q["claim_id"],)).fetchone()
        if claim:
            new_desc = claim["description"] + f"\n\n[Leaver Clarification]: {payload.leaver_answer}"
            conn.execute(
                """
                UPDATE claims
                SET status = 'Verified', description = ?, conflict_details = NULL, updated_at = ?
                WHERE id = ?
                """,
                (new_desc, answered_at, q["claim_id"])
            )

    log_event(
        conn=conn,
        project_id=q["project_id"],
        actor_name=project["leaving_member"] if project else "Outgoing Member",
        actor_role="Outgoing Member",
        action="QUESTION_ANSWERED",
        details={
            "question_id": question_id,
            "question_text": q["question_text"],
            "answer": payload.leaver_answer,
            "claim_id": q["claim_id"]
        }
    )

    r = conn.execute("SELECT * FROM leaver_questions WHERE id = ?", (question_id,)).fetchone()
    return build_question_out(r)
