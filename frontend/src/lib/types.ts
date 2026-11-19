export type ClaimStatus = 'Verified' | 'Inferred' | 'Conflicting' | 'Missing';
export type ClaimCategory = 'decision' | 'ownership' | 'risk' | 'dependency' | 'timeline' | 'next_action';
export type ReviewDecision = 'pending' | 'approved' | 'rejected' | 'edited';
export type UserRole = 'Successor' | 'Teammate' | 'Manager' | 'Observer';

export interface Citation {
  id: string;
  claim_id: string;
  source_chunk_id: string;
  quote_span: string;
  relevance_explanation?: string;
  source_title?: string;
  source_type?: string;
  span_identifier?: string;
  sensitivity_level?: string;
}

export interface Claim {
  id: string;
  project_id: string;
  category: ClaimCategory;
  title: string;
  description: string;
  alternatives_considered?: string | null;
  status: ClaimStatus;
  confidence_score: number;
  conflict_details?: string | null;
  reviewer_decision: ReviewDecision;
  reviewer_notes?: string | null;
  version: number;
  area: string;
  is_confidential: boolean;
  action_day?: number | null;
  action_owner?: string | null;
  blockers?: string | null;
  contacts?: string | null;
  created_at: string;
  updated_at: string;
  citations: Citation[];
}

export interface SourceChunk {
  id: string;
  source_id: string;
  chunk_index: number;
  redacted_text: string;
  span_identifier: string;
  sensitivity_level: string;
  has_redactions: boolean;
}

export interface Source {
  id: string;
  project_id: string;
  title: string;
  source_type: 'doc' | 'chat' | 'task_board' | 'git_repo';
  uri?: string | null;
  summary?: string | null;
  chunk_count: number;
  created_at: string;
}

export interface LeaverQuestion {
  id: string;
  project_id: string;
  claim_id?: string | null;
  context_type: 'missing_fact' | 'conflict_resolution' | 'risk_mitigation';
  question_text: string;
  urgency: 'high' | 'medium' | 'low';
  leaver_answer?: string | null;
  is_answered: boolean;
  answered_at?: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  target_role: string;
  leaving_member: string;
  incoming_member: string;
  reviewer_name: string;
  status: string;
  active_version: number;
  created_at: string;
  updated_at: string;
  sources_count?: number;
  claims_count?: number;
  unanswered_questions_count?: number;
}

export interface HandoverApproval {
  id: string;
  project_id: string;
  version: number;
  reviewer_name: string;
  reviewer_role: string;
  comments?: string;
  approved_at: string;
}

export interface HandoverReceipt {
  recipient_name: string;
  recipient_role: string;
  signature: string;
  acknowledged_at: string;
  checklist: string[];
}

export interface HandoverPackage {
  project: Project;
  viewer_role: UserRole;
  is_approved: boolean;
  version: number;
  summary: {
    total_claims: number;
    verified_count: number;
    inferred_count: number;
    conflicting_count: number;
    missing_count: number;
    questions_total: number;
    questions_answered: number;
  };
  decisions: Claim[];
  ownership: Claim[];
  risks: Claim[];
  dependencies: Claim[];
  timeline: Claim[];
  first_week_plan: Claim[];
  unresolved_questions: LeaverQuestion[];
  approval?: HandoverApproval | null;
  receipt?: HandoverReceipt | null;
}

export interface AuditLog {
  id: string;
  project_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  details?: string | null;
  timestamp: string;
}

// Improvement 1: GitHub PR & Diff Analysis Types
export interface PRFileRisk {
  path: string;
  status: string;
  hunk: string;
  issue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PRAnalysisResult {
  pr_number: number;
  pr_title: string;
  author: string;
  source_branch: string;
  target_branch: string;
  state: string;
  additions: number;
  deletions: number;
  changed_files_count: number;
  analyzed_at: string;
  files: PRFileRisk[];
  summary: string;
  recommended_action: string;
}

// Improvement 2: Slack/Discord Leaver Bot Types
export interface LeaverBotDispatchResult {
  status: string;
  platform: 'slack' | 'discord';
  channel: string;
  recipient: string;
  dispatched_count: number;
  slack_blocks_preview: any[];
  dispatched_at: string;
}

// Improvement 3: Cryptographic Handover Audit Types
export interface CryptographicHandoverCertificate {
  certificate_id: string;
  project_id: string;
  project_name: string;
  version: number;
  sha256_root_hash: string;
  claims_merkle_digest: string;
  sources_digest: string;
  reviewer_signature_digest: string;
  successor_receipt_digest: string;
  timestamp: string;
  compliance_standard: string;
  verification_status: 'VERIFIED' | 'TAMPERED';
}


