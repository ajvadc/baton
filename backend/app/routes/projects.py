import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
from app.models import generate_uuid, now_iso
from app.schemas import ProjectCreate, ProjectOut
from app.services.audit_service import log_event

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.post("", response_model=ProjectOut)
def create_project(payload: ProjectCreate, conn: sqlite3.Connection = Depends(get_db)):
    proj_id = generate_uuid()
    created_at = now_iso()
    updated_at = created_at
    
    conn.execute(
        """
        INSERT INTO projects (id, name, description, target_role, leaving_member, incoming_member, reviewer_name, status, active_version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', 1, ?, ?)
        """,
        (proj_id, payload.name, payload.description, payload.target_role, payload.leaving_member, payload.incoming_member, payload.reviewer_name, created_at, updated_at)
    )

    log_event(
        conn=conn,
        project_id=proj_id,
        actor_name=payload.leaving_member,
        actor_role="Outgoing Member",
        action="PROJECT_CREATED",
        details={"name": payload.name, "target_role": payload.target_role}
    )

    return ProjectOut(
        id=proj_id,
        name=payload.name,
        description=payload.description,
        target_role=payload.target_role,
        leaving_member=payload.leaving_member,
        incoming_member=payload.incoming_member,
        reviewer_name=payload.reviewer_name,
        status="Draft",
        active_version=1,
        created_at=created_at,
        updated_at=updated_at,
        sources_count=0,
        claims_count=0,
        unanswered_questions_count=0
    )

@router.get("", response_model=List[ProjectOut])
def list_projects(conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    results = []
    for r in rows:
        p_id = r["id"]
        s_count = conn.execute("SELECT COUNT(*) as c FROM sources WHERE project_id = ?", (p_id,)).fetchone()["c"]
        c_count = conn.execute("SELECT COUNT(*) as c FROM claims WHERE project_id = ?", (p_id,)).fetchone()["c"]
        q_count = conn.execute("SELECT COUNT(*) as c FROM leaver_questions WHERE project_id = ? AND is_answered = 0", (p_id,)).fetchone()["c"]

        results.append(ProjectOut(
            id=r["id"],
            name=r["name"],
            description=r["description"],
            target_role=r["target_role"],
            leaving_member=r["leaving_member"],
            incoming_member=r["incoming_member"],
            reviewer_name=r["reviewer_name"],
            status=r["status"],
            active_version=r["active_version"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            sources_count=s_count,
            claims_count=c_count,
            unanswered_questions_count=q_count
        ))
    return results

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, conn: sqlite3.Connection = Depends(get_db)):
    r = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Project not found")

    p_id = r["id"]
    s_count = conn.execute("SELECT COUNT(*) as c FROM sources WHERE project_id = ?", (p_id,)).fetchone()["c"]
    c_count = conn.execute("SELECT COUNT(*) as c FROM claims WHERE project_id = ?", (p_id,)).fetchone()["c"]
    q_count = conn.execute("SELECT COUNT(*) as c FROM leaver_questions WHERE project_id = ? AND is_answered = 0", (p_id,)).fetchone()["c"]

    return ProjectOut(
        id=r["id"],
        name=r["name"],
        description=r["description"],
        target_role=r["target_role"],
        leaving_member=r["leaving_member"],
        incoming_member=r["incoming_member"],
        reviewer_name=r["reviewer_name"],
        status=r["status"],
        active_version=r["active_version"],
        created_at=r["created_at"],
        updated_at=r["updated_at"],
        sources_count=s_count,
        claims_count=c_count,
        unanswered_questions_count=q_count
    )
