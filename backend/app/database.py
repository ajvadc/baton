import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

DB_PATH = os.getenv("SQLITE_DB_PATH", str(Path(__file__).resolve().parent.parent / "baton.db"))

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    conn = get_connection()
    try:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            target_role TEXT DEFAULT 'Backend Lead',
            leaving_member TEXT DEFAULT 'Alex Rivera (Outgoing Lead)',
            incoming_member TEXT DEFAULT 'Sam Chen (Successor)',
            reviewer_name TEXT DEFAULT 'Priya Sharma (Tech Lead / Reviewer)',
            status TEXT DEFAULT 'Draft',
            active_version INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            title TEXT NOT NULL,
            source_type TEXT NOT NULL,
            uri TEXT,
            summary TEXT,
            raw_content TEXT,
            chunk_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS source_chunks (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            chunk_index INTEGER DEFAULT 0,
            original_text TEXT NOT NULL,
            redacted_text TEXT NOT NULL,
            span_identifier TEXT NOT NULL,
            sensitivity_level TEXT DEFAULT 'internal',
            has_redactions INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS claims (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            alternatives_considered TEXT,
            status TEXT DEFAULT 'Inferred',
            confidence_score REAL DEFAULT 0.85,
            conflict_details TEXT,
            reviewer_decision TEXT DEFAULT 'pending',
            reviewer_notes TEXT,
            version INTEGER DEFAULT 1,
            area TEXT DEFAULT 'backend',
            is_confidential INTEGER DEFAULT 0,
            action_day INTEGER,
            action_owner TEXT,
            blockers TEXT,
            contacts TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS claim_citations (
            id TEXT PRIMARY KEY,
            claim_id TEXT NOT NULL,
            source_chunk_id TEXT NOT NULL,
            quote_span TEXT NOT NULL,
            relevance_explanation TEXT,
            FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
            FOREIGN KEY (source_chunk_id) REFERENCES source_chunks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS leaver_questions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            claim_id TEXT,
            context_type TEXT DEFAULT 'missing_fact',
            question_text TEXT NOT NULL,
            urgency TEXT DEFAULT 'high',
            leaver_answer TEXT,
            is_answered INTEGER DEFAULT 0,
            answered_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS handover_approvals (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            reviewer_name TEXT NOT NULL,
            reviewer_role TEXT DEFAULT 'Technical Lead',
            comments TEXT,
            approved_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS handover_receipts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            recipient_name TEXT NOT NULL,
            recipient_role TEXT DEFAULT 'Successor',
            checklist_completed TEXT,
            sign_off_signature TEXT NOT NULL,
            acknowledged_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        """)
        conn.commit()
    finally:
        conn.close()
