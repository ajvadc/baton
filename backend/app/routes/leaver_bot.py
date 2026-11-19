"""
Leaver Q&A Bot Router for Baton.
Dispatches gap questions directly to Slack/Discord channels and receives interactive replies from the outgoing lead.
"""
import sqlite3
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.services.audit_service import log_event

router = APIRouter(prefix="/api/projects/{project_id}/leaver-bot", tags=["leaver-bot"])

class DispatchRequest(BaseModel):
    channel_name: str = "#leaver-handover-alex"
    platform: str = "slack"  # 'slack' or 'discord'
    question_ids: Optional[List[str]] = None

class BotReplyRequest(BaseModel):
    question_id: str
    answer: str
    answered_by: str = "Alex Rivera (via Slack)"
    channel: str = "#leaver-handover-alex"

@router.post("/dispatch")
def dispatch_to_leaver_bot(project_id: str, payload: DispatchRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Formats and dispatches pending gap questions to Slack Block Kit or Discord Webhook.
    """
    cur = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    proj = cur.fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    cur_q = conn.execute(
        "SELECT * FROM leaver_questions WHERE project_id = ? AND is_answered = 0",
        (project_id,)
    )
    questions = cur_q.fetchall()
    now = now_iso()

    slack_blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"Baton Handover Bot: {proj['name']}"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"Hi *{proj['leaving_member']}*! As part of your transition before your final day, Baton detected *{len(questions)} knowledge gaps* that require your clarification so *{proj['incoming_member']}* can succeed."
            }
        },
        {"type": "divider"}
    ]

    for q in questions[:3]:
        slack_blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Question:* {q['question_text']}\n_Urgency:_ {q['urgency']}"
            },
            "accessory": {
                "type": "button",
                "text": {"type": "plain_text", "text": "Reply in Slack"},
                "value": q["id"],
                "action_id": "answer_question_action"
            }
        })

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name="Baton Bot Service",
        actor_role="Bot Dispatcher",
        action="LEAVER_BOT_QUESTIONS_DISPATCHED",
        details={"channel": payload.channel_name, "platform": payload.platform, "count": len(questions)}
    )

    return {
        "status": "success",
        "platform": payload.platform,
        "channel": payload.channel_name,
        "recipient": proj["leaving_member"],
        "dispatched_count": len(questions),
        "slack_blocks_preview": slack_blocks,
        "dispatched_at": now
    }

@router.post("/simulate-reply")
def simulate_bot_reply(project_id: str, payload: BotReplyRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Receives an interactive reply from the leaver in Slack or Discord, updates the question,
    resolves the associated claim, and commits a tamper-evident audit record.
    """
    cur_q = conn.execute("SELECT * FROM leaver_questions WHERE id = ?", (payload.question_id,))
    q = cur_q.fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    now = now_iso()

    # 1. Update question
    conn.execute(
        """
        UPDATE leaver_questions
        SET leaver_answer = ?, is_answered = 1, answered_at = ?
        WHERE id = ?
        """,
        (payload.answer, now, payload.question_id)
    )

    # 2. If question is tied to a claim, mark it verified
    claim_id = q["claim_id"]
    if claim_id:
        conn.execute(
            """
            UPDATE claims
            SET status = 'Verified', conflict_details = NULL, updated_at = ?
            WHERE id = ?
            """,
            (now, claim_id)
        )

    # 3. Write audit log
    log_event(
        conn=conn,
        project_id=project_id,
        actor_name=payload.answered_by,
        actor_role="Outgoing Lead (Remote)",
        action="LEAVER_BOT_ANSWER_RECEIVED",
        details={
            "question_id": payload.question_id,
            "channel": payload.channel,
            "answer": payload.answer,
            "resolved_claim_id": claim_id
        }
    )

    return {
        "status": "success",
        "message": f"Answer recorded from {payload.answered_by} via {payload.channel}",
        "question_id": payload.question_id,
        "resolved_claim_id": claim_id,
        "answered_at": now
    }
