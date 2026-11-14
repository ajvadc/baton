import os
import json
import sqlite3
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.services.ingestion import parse_markdown_or_text, parse_task_csv, parse_chat_export
from app.services.ai_extractor import extract_claims_fallback
from app.services.verification import evaluate_claim_evidence
from app.services.gap_analysis import generate_leaver_questions_from_claims
from app.services.audit_service import log_event

router = APIRouter(prefix="/api/demo", tags=["Demo"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "synthetic_events_app"

@router.post("/load-events-app")
def load_events_app_demo(conn: sqlite3.Connection = Depends(get_db)):
    proj_id = generate_uuid()
    created_at = now_iso()

    # 1. Insert Project
    conn.execute("""
        INSERT INTO projects (id, name, description, target_role, leaving_member, incoming_member, reviewer_name, status, active_version, created_at, updated_at)
        VALUES (?, 'Events App (Student Club)', 'Campus student club''s ticket reservation & event coordination platform. Handover generated as Backend Lead Alex Rivera graduates and steps down.', 'Backend Lead', 'Alex Rivera (Outgoing Lead)', 'Sam Chen (Incoming Successor)', 'Priya Sharma (Tech Lead / Reviewer)', 'ReviewPending', 1, ?, ?)
    """, (proj_id, created_at, created_at))

    # 2. Ingest Architecture Decision Record (Doc)
    adr_file = DATA_DIR / "architecture_decision_record.md"
    if adr_file.exists():
        adr_content = adr_file.read_text(encoding="utf-8")
        adr_chunks = parse_markdown_or_text(adr_content, "Architecture Decision Record")
        s_adr_id = generate_uuid()
        conn.execute("""
            INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
            VALUES (?, ?, 'Architecture Decision Record (ADR 01 & 02)', 'doc', NULL, 'Technical decisions on Firebase Auth, Redis concurrency locks, and Cloud SQL backup schedules.', ?, ?, ?)
        """, (s_adr_id, proj_id, adr_content, len(adr_chunks), created_at))

        for idx, c in enumerate(adr_chunks):
            conn.execute("""
                INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (generate_uuid(), s_adr_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at))

    # 3. Ingest Engineering Sync Notes (Doc)
    notes_file = DATA_DIR / "meeting_notes.md"
    if notes_file.exists():
        notes_content = notes_file.read_text(encoding="utf-8")
        notes_chunks = parse_markdown_or_text(notes_content, "Engineering Sync Notes")
        s_notes_id = generate_uuid()
        conn.execute("""
            INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
            VALUES (?, ?, 'Engineering Sync Notes (Sep - Oct 2026)', 'doc', NULL, 'Meeting minutes covering auth consensus, payment gateway renewal debate, and Redis lock timeout workarounds.', ?, ?, ?)
        """, (s_notes_id, proj_id, notes_content, len(notes_chunks), created_at))

        for idx, c in enumerate(notes_chunks):
            conn.execute("""
                INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (generate_uuid(), s_notes_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at))

    # 4. Ingest Slack Chat Export (Chat)
    chat_file = DATA_DIR / "slack_backend_channel_export.json"
    if chat_file.exists():
        chat_content = chat_file.read_text(encoding="utf-8")
        chat_chunks = parse_chat_export(chat_content, "Slack #backend-dev")
        s_chat_id = generate_uuid()
        conn.execute("""
            INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
            VALUES (?, ?, 'Slack #backend-dev Export', 'chat', NULL, 'Team discussions regarding Firebase auth selection, Stripe burst webhook crashes, and personal Twilio credentials.', ?, ?, ?)
        """, (s_chat_id, proj_id, chat_content, len(chat_chunks), created_at))

        for idx, c in enumerate(chat_chunks):
            conn.execute("""
                INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (generate_uuid(), s_chat_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at))

    # 5. Ingest Sprint Task Board (Task CSV)
    csv_file = DATA_DIR / "sprint_task_board.csv"
    if csv_file.exists():
        csv_content = csv_file.read_text(encoding="utf-8")
        csv_chunks = parse_task_csv(csv_content, "Sprint Board CSV")
        s_csv_id = generate_uuid()
        conn.execute("""
            INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
            VALUES (?, ?, 'Sprint Task Board (EV-101 to EV-106)', 'task_board', NULL, 'CSV export of sprint tasks, assignees, and dependencies.', ?, ?, ?)
        """, (s_csv_id, proj_id, csv_content, len(csv_chunks), created_at))

        for idx, c in enumerate(csv_chunks):
            conn.execute("""
                INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (generate_uuid(), s_csv_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at))

    # 6. Ingest Git Activity
    git_file = DATA_DIR / "git_commits.json"
    if git_file.exists():
        git_content = git_file.read_text(encoding="utf-8")
        git_data = json.loads(git_content)
        git_chunks = []
        for c in git_data.get("commits", []):
            text = f"Git Commit {c['sha']} by {c['author']}: {c['message']}"
            git_chunks.append({
                "original_text": text,
                "redacted_text": text,
                "span_identifier": f"Commit {c['sha']}",
                "sensitivity_level": "public",
                "has_redactions": False
            })
        for pr in git_data.get("open_pull_requests", []):
            text = f"Open PR #{pr['number']}: {pr['title']} by {pr['author']}\nNotes: {pr['notes']}"
            git_chunks.append({
                "original_text": text,
                "redacted_text": text,
                "span_identifier": f"PR #{pr['number']}",
                "sensitivity_level": "public",
                "has_redactions": False
            })
        s_git_id = generate_uuid()
        conn.execute("""
            INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
            VALUES (?, ?, 'GitHub: events-app-backend (Commits & PRs)', 'git_repo', 'https://github.com/campus-student-club/events-app-backend', 'Repository commit history and open PR #42 for distributed seat locking.', ?, ?, ?)
        """, (s_git_id, proj_id, git_content, len(git_chunks), created_at))

        for idx, c in enumerate(git_chunks):
            conn.execute("""
                INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (generate_uuid(), s_git_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at))

    # 7. Pull all created chunks and run Reconstruction
    all_chunks = conn.execute("""
        SELECT sc.id, sc.source_id, sc.span_identifier, sc.redacted_text, sc.sensitivity_level
        FROM source_chunks sc
        JOIN sources s ON sc.source_id = s.id
        WHERE s.project_id = ?
        ORDER BY sc.chunk_index ASC
    """, (proj_id,)).fetchall()

    chunks_data = [dict(c) for c in all_chunks]
    extracted_claims = extract_claims_fallback(chunks_data)

    for c_data in extracted_claims:
        claim_id = generate_uuid()
        cited_indices = c_data.get("cited_chunk_indices", [])
        is_confidential = 1 if (c_data.get("category") == "risk" and "signing secret" in c_data.get("title", "").lower()) else 0

        conn.execute("""
            INSERT INTO claims (id, project_id, category, title, description, alternatives_considered, status, confidence_score, conflict_details, reviewer_decision, reviewer_notes, version, area, is_confidential, action_day, action_owner, blockers, contacts, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0.85, ?, 'pending', NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            claim_id,
            proj_id,
            c_data["category"],
            c_data["title"],
            c_data["description"],
            c_data.get("alternatives_considered"),
            c_data["status"],
            c_data.get("conflict_details"),
            c_data.get("area", "backend"),
            is_confidential,
            c_data.get("action_day"),
            c_data.get("action_owner"),
            c_data.get("blockers"),
            c_data.get("contacts"),
            created_at,
            created_at
        ))

        citations_for_eval = []
        for idx in cited_indices:
            if 0 <= idx < len(all_chunks):
                target_chunk = all_chunks[idx]
                cit_id = generate_uuid()
                quote_text = target_chunk["redacted_text"][:280]
                conn.execute("""
                    INSERT INTO claim_citations (id, claim_id, source_chunk_id, quote_span, relevance_explanation)
                    VALUES (?, ?, ?, ?, ?)
                """, (cit_id, claim_id, target_chunk["id"], quote_text, f"Direct evidence from {target_chunk['span_identifier']}"))

                citations_for_eval.append({
                    "source_title": target_chunk["span_identifier"],
                    "quote_span": quote_text
                })

        eval_result = evaluate_claim_evidence(c_data, citations_for_eval)
        conn.execute("UPDATE claims SET status = ?, confidence_score = ? WHERE id = ?", (eval_result["status"], eval_result["confidence_score"], claim_id))

    # 8. Create Leaver Questions
    auto_questions = generate_leaver_questions_from_claims(extracted_claims)
    for q in auto_questions:
        q_id = generate_uuid()
        conn.execute("""
            INSERT INTO leaver_questions (id, project_id, claim_id, context_type, question_text, urgency, leaver_answer, is_answered, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?)
        """, (q_id, proj_id, q["claim_id"], q["context_type"], q["question_text"], q["urgency"], created_at))

    # 9. Audit event
    log_event(
        conn=conn,
        project_id=proj_id,
        actor_name="Demo Seeder",
        actor_role="Administrator",
        action="DEMO_EVENTS_APP_INITIALIZED",
        details={
            "scenario": "Student Club Events App",
            "sources_loaded": 5,
            "claims_generated": len(extracted_claims),
            "questions_generated": len(auto_questions)
        }
    )

    return {
        "status": "success",
        "message": "Loaded Events App demo scenario with 5 sources, evidence-linked claims, and leaver questions.",
        "project_id": proj_id,
        "project_name": "Events App (Student Club)"
    }
