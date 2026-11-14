import sqlite3
from fastapi import APIRouter, Depends
from typing import List
from app.database import get_db
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api/projects/{project_id}/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogOut])
def get_project_audit_trail(project_id: str, conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute("SELECT * FROM audit_logs WHERE project_id = ? ORDER BY timestamp DESC", (project_id,)).fetchall()
    return [
        AuditLogOut(
            id=r["id"],
            project_id=r["project_id"],
            actor_name=r["actor_name"],
            actor_role=r["actor_role"],
            action=r["action"],
            details=r["details"],
            timestamp=r["timestamp"]
        )
        for r in rows
    ]
