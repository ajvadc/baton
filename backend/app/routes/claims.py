import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.database import get_db
from app.models import now_iso
from app.schemas import ClaimOut, ClaimUpdate, CitationOut
from app.services.audit_service import log_event

router = APIRouter(tags=["Claims"])

def build_claim_out_sqlite(claim_row: sqlite3.Row, conn: sqlite3.Connection) -> ClaimOut:
    claim_id = claim_row["id"]
    citations_cursor = conn.execute("""
        SELECT cc.id, cc.claim_id, cc.source_chunk_id, cc.quote_span, cc.relevance_explanation,
               s.title as source_title, s.source_type, sc.span_identifier, sc.sensitivity_level
        FROM claim_citations cc
        JOIN source_chunks sc ON cc.source_chunk_id = sc.id
        JOIN sources s ON sc.source_id = s.id
        WHERE cc.claim_id = ?
    """, (claim_id,))
    
    citations = [
        CitationOut(
            id=c["id"],
            claim_id=c["claim_id"],
            source_chunk_id=c["source_chunk_id"],
            quote_span=c["quote_span"],
            relevance_explanation=c["relevance_explanation"],
            source_title=c["source_title"],
            source_type=c["source_type"],
            span_identifier=c["span_identifier"],
            sensitivity_level=c["sensitivity_level"]
        )
        for c in citations_cursor.fetchall()
    ]

    return ClaimOut(
        id=claim_row["id"],
        project_id=claim_row["project_id"],
        category=claim_row["category"],
        title=claim_row["title"],
        description=claim_row["description"],
        alternatives_considered=claim_row["alternatives_considered"],
        status=claim_row["status"],
        confidence_score=claim_row["confidence_score"],
        conflict_details=claim_row["conflict_details"],
        reviewer_decision=claim_row["reviewer_decision"],
        reviewer_notes=claim_row["reviewer_notes"],
        version=claim_row["version"],
        area=claim_row["area"],
        is_confidential=bool(claim_row["is_confidential"]),
        action_day=claim_row["action_day"],
        action_owner=claim_row["action_owner"],
        blockers=claim_row["blockers"],
        contacts=claim_row["contacts"],
        created_at=claim_row["created_at"],
        updated_at=claim_row["updated_at"],
        citations=citations
    )

@router.get("/api/projects/{project_id}/claims", response_model=List[ClaimOut])
def list_claims(
    project_id: str,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    conn: sqlite3.Connection = Depends(get_db)
):
    query = "SELECT * FROM claims WHERE project_id = ?"
    params = [project_id]
    if category:
        query += " AND category = ?"
        params.append(category)
    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY category ASC, action_day ASC, created_at ASC"
    rows = conn.execute(query, params).fetchall()
    return [build_claim_out_sqlite(r, conn) for r in rows]

@router.get("/api/claims/{claim_id}", response_model=ClaimOut)
def get_claim(claim_id: str, conn: sqlite3.Connection = Depends(get_db)):
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Claim not found")
    return build_claim_out_sqlite(row, conn)

@router.put("/api/claims/{claim_id}", response_model=ClaimOut)
def update_claim(claim_id: str, payload: ClaimUpdate, conn: sqlite3.Connection = Depends(get_db)):
    claim = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    update_dict = payload.dict(exclude_unset=True)
    if not update_dict:
        return build_claim_out_sqlite(claim, conn)

    set_clauses = []
    values = []
    for k, v in update_dict.items():
        set_clauses.append(f"{k} = ?")
        values.append(v)

    set_clauses.append("updated_at = ?")
    values.append(now_iso())
    values.append(claim_id)

    conn.execute(f"UPDATE claims SET {', '.join(set_clauses)} WHERE id = ?", values)

    project = conn.execute("SELECT * FROM projects WHERE id = ?", (claim["project_id"],)).fetchone()
    log_event(
        conn=conn,
        project_id=claim["project_id"],
        actor_name=project["reviewer_name"] if project else "Reviewer",
        actor_role="Reviewer",
        action="CLAIM_EDITED",
        details={"claim_id": claim_id, "claim_title": claim["title"], "updates": update_dict}
    )

    updated_row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    return build_claim_out_sqlite(updated_row, conn)
