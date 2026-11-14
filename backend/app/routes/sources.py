import sqlite3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.schemas import SourceOut, SourceChunkOut
from app.services.ingestion import parse_markdown_or_text, parse_task_csv, parse_chat_export
from app.services.git_service import fetch_github_repo_activity
from app.services.audit_service import log_event

router = APIRouter(prefix="/api/projects/{project_id}/sources", tags=["Sources"])

class GitHubImportRequest(BaseModel):
    repository_url: str

@router.post("/upload", response_model=SourceOut)
async def upload_source_file(
    project_id: str,
    file: UploadFile = File(...),
    source_type: str = Form("doc"),
    conn: sqlite3.Connection = Depends(get_db)
):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1", errors="replace")

    title = file.filename or "Uploaded Document"

    if source_type == "task_board" or title.endswith(".csv"):
        parsed_chunks = parse_task_csv(content_str, title)
        source_type = "task_board"
    elif source_type == "chat" or (title.endswith(".json") and "chat" in title.lower()):
        parsed_chunks = parse_chat_export(content_str, title)
        source_type = "chat"
    else:
        parsed_chunks = parse_markdown_or_text(content_str, title)
        source_type = "doc"

    source_id = generate_uuid()
    created_at = now_iso()
    summary = f"Parsed {len(parsed_chunks)} contextual chunks with secret & PII masking applied."

    conn.execute(
        """
        INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (source_id, project_id, title, source_type, None, summary, content_str[:50000], len(parsed_chunks), created_at)
    )

    for idx, c in enumerate(parsed_chunks):
        chunk_id = generate_uuid()
        conn.execute(
            """
            INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (chunk_id, source_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at)
        )

    conn.execute("UPDATE projects SET status = 'Ingested', updated_at = ? WHERE id = ?", (now_iso(), project_id))

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name=project["leaving_member"],
        actor_role="Outgoing Lead",
        action="SOURCE_UPLOADED",
        details={"source_title": title, "source_type": source_type, "chunks": len(parsed_chunks)}
    )

    return SourceOut(
        id=source_id,
        project_id=project_id,
        title=title,
        source_type=source_type,
        uri=None,
        summary=summary,
        chunk_count=len(parsed_chunks),
        created_at=created_at
    )

@router.post("/github", response_model=SourceOut)
async def import_github_repository(
    project_id: str,
    payload: GitHubImportRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo_url = payload.repository_url.strip()
    parsed_chunks = await fetch_github_repo_activity(repo_url)

    source_id = generate_uuid()
    created_at = now_iso()
    repo_name = repo_url.split("/")[-1]
    title = f"GitHub: {repo_name}"
    summary = f"Synced commits, open PRs, and repository metadata ({len(parsed_chunks)} items)."

    conn.execute(
        """
        INSERT INTO sources (id, project_id, title, source_type, uri, summary, raw_content, chunk_count, created_at)
        VALUES (?, ?, ?, 'git_repo', ?, ?, ?, ?, ?)
        """,
        (source_id, project_id, title, repo_url, summary, "", len(parsed_chunks), created_at)
    )

    for idx, c in enumerate(parsed_chunks):
        chunk_id = generate_uuid()
        conn.execute(
            """
            INSERT INTO source_chunks (id, source_id, chunk_index, original_text, redacted_text, span_identifier, sensitivity_level, has_redactions, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (chunk_id, source_id, idx, c["original_text"], c["redacted_text"], c["span_identifier"], c["sensitivity_level"], 1 if c["has_redactions"] else 0, created_at)
        )

    conn.execute("UPDATE projects SET status = 'Ingested', updated_at = ? WHERE id = ?", (now_iso(), project_id))

    log_event(
        conn=conn,
        project_id=project_id,
        actor_name="System",
        actor_role="Integrator",
        action="GITHUB_SYNCED",
        details={"repo_url": repo_url, "chunks": len(parsed_chunks)}
    )

    return SourceOut(
        id=source_id,
        project_id=project_id,
        title=title,
        source_type="git_repo",
        uri=repo_url,
        summary=summary,
        chunk_count=len(parsed_chunks),
        created_at=created_at
    )

@router.get("", response_model=List[SourceOut])
def list_project_sources(project_id: str, conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute("SELECT * FROM sources WHERE project_id = ? ORDER BY created_at ASC", (project_id,)).fetchall()
    return [
        SourceOut(
            id=r["id"],
            project_id=r["project_id"],
            title=r["title"],
            source_type=r["source_type"],
            uri=r["uri"],
            summary=r["summary"],
            chunk_count=r["chunk_count"],
            created_at=r["created_at"]
        )
        for r in rows
    ]

@router.get("/{source_id}/chunks", response_model=List[SourceChunkOut])
def get_source_chunks(project_id: str, source_id: str, conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute("SELECT * FROM source_chunks WHERE source_id = ? ORDER BY chunk_index ASC", (source_id,)).fetchall()
    return [
        SourceChunkOut(
            id=r["id"],
            source_id=r["source_id"],
            chunk_index=r["chunk_index"],
            redacted_text=r["redacted_text"],
            span_identifier=r["span_identifier"],
            sensitivity_level=r["sensitivity_level"],
            has_redactions=bool(r["has_redactions"])
        )
        for r in rows
    ]
