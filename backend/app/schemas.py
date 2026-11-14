from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Citation & Source Schemas ---
class CitationBase(BaseModel):
    source_chunk_id: str
    quote_span: str
    relevance_explanation: Optional[str] = None

class CitationOut(CitationBase):
    id: str
    claim_id: str
    source_title: Optional[str] = None
    source_type: Optional[str] = None
    span_identifier: Optional[str] = None
    sensitivity_level: Optional[str] = None

    class Config:
        from_attributes = True

class SourceChunkOut(BaseModel):
    id: str
    source_id: str
    chunk_index: int
    redacted_text: str
    span_identifier: str
    sensitivity_level: str
    has_redactions: bool

    class Config:
        from_attributes = True

class SourceOut(BaseModel):
    id: str
    project_id: str
    title: str
    source_type: str
    uri: Optional[str] = None
    summary: Optional[str] = None
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Claim Schemas ---
class ClaimBase(BaseModel):
    category: str # decision, ownership, risk, dependency, timeline, next_action
    title: str
    description: str
    alternatives_considered: Optional[str] = None
    status: str = "Inferred" # Verified, Inferred, Conflicting, Missing
    confidence_score: float = 0.85
    conflict_details: Optional[str] = None
    area: str = "backend"
    is_confidential: bool = False
    action_day: Optional[int] = None
    action_owner: Optional[str] = None
    blockers: Optional[str] = None
    contacts: Optional[str] = None

class ClaimCreate(ClaimBase):
    citations: List[CitationBase] = []

class ClaimUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    alternatives_considered: Optional[str] = None
    status: Optional[str] = None
    reviewer_decision: Optional[str] = None
    reviewer_notes: Optional[str] = None
    conflict_details: Optional[str] = None
    action_day: Optional[int] = None
    action_owner: Optional[str] = None
    blockers: Optional[str] = None
    contacts: Optional[str] = None

class ClaimOut(ClaimBase):
    id: str
    project_id: str
    reviewer_decision: str
    reviewer_notes: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime
    citations: List[CitationOut] = []

    class Config:
        from_attributes = True

# --- Leaver Question Schemas ---
class QuestionCreate(BaseModel):
    claim_id: Optional[str] = None
    context_type: str = "missing_fact"
    question_text: str
    urgency: str = "high"

class QuestionAnswer(BaseModel):
    leaver_answer: str

class QuestionOut(BaseModel):
    id: str
    project_id: str
    claim_id: Optional[str] = None
    context_type: str
    question_text: str
    urgency: str
    leaver_answer: Optional[str] = None
    is_answered: bool
    answered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_role: Optional[str] = "Backend Lead"
    leaving_member: Optional[str] = "Alex Rivera (Outgoing Lead)"
    incoming_member: Optional[str] = "Sam Chen (Successor)"
    reviewer_name: Optional[str] = "Priya Sharma (Tech Lead / Reviewer)"

class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    target_role: str
    leaving_member: str
    incoming_member: str
    reviewer_name: str
    status: str
    active_version: int
    created_at: datetime
    updated_at: datetime
    sources_count: Optional[int] = 0
    claims_count: Optional[int] = 0
    unanswered_questions_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Review & Handover Schemas ---
class ReviewAction(BaseModel):
    claim_id: str
    decision: str # approved, rejected, edited
    reviewer_notes: Optional[str] = None
    updated_title: Optional[str] = None
    updated_description: Optional[str] = None
    new_status: Optional[str] = None

class BatchReviewRequest(BaseModel):
    reviewer_name: str
    reviewer_role: str = "Technical Lead"
    actions: List[ReviewAction]

class HandoverApprovalRequest(BaseModel):
    reviewer_name: str
    reviewer_role: str = "Technical Lead"
    comments: Optional[str] = "Handover claims and evidence verified and approved for incoming successor."

class HandoverReceiptRequest(BaseModel):
    recipient_name: str
    recipient_role: str = "Successor"
    checklist_completed: List[str] = []
    sign_off_signature: str

class HandoverViewRole(BaseModel):
    role: str # Successor, Teammate, Manager, Observer

class HandoverPackage(BaseModel):
    project: ProjectOut
    viewer_role: str
    is_approved: bool
    version: int
    summary: Dict[str, Any]
    decisions: List[ClaimOut]
    ownership: List[ClaimOut]
    risks: List[ClaimOut]
    dependencies: List[ClaimOut]
    timeline: List[ClaimOut]
    first_week_plan: List[ClaimOut]
    unresolved_questions: List[QuestionOut]
    approval: Optional[Dict[str, Any]] = None
    receipt: Optional[Dict[str, Any]] = None

# --- Audit Log Schema ---
class AuditLogOut(BaseModel):
    id: str
    project_id: str
    actor_name: str
    actor_role: str
    action: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
