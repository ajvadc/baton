import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional
from app.models import generate_uuid, now_iso

def log_event(
    conn: sqlite3.Connection,
    project_id: str,
    actor_name: str,
    actor_role: str,
    action: str,
    details: Optional[Dict[str, Any]] = None
) -> str:
    """Creates a tamper-evident audit log record."""
    log_id = generate_uuid()
    details_str = json.dumps(details) if details else "{}"
    ts = now_iso()
    conn.execute(
        """
        INSERT INTO audit_logs (id, project_id, actor_name, actor_role, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (log_id, project_id, actor_name, actor_role, action, details_str, ts)
    )
    return log_id
