import {
  Project,
  Source,
  SourceChunk,
  Claim,
  LeaverQuestion,
  HandoverPackage,
  AuditLog,
  UserRole,
  PRAnalysisResult,
  LeaverBotDispatchResult,
} from './types';
import {
  INITIAL_DEMO_PROJECT,
  INITIAL_DEMO_SOURCES,
  INITIAL_DEMO_CLAIMS,
  INITIAL_DEMO_QUESTIONS,
  INITIAL_DEMO_AUDIT_LOGS,
} from './demo-data';

// Use relative URL if NEXT_PUBLIC_API_URL is not provided so it never triggers mixed content errors on HTTPS deployments
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// In-browser fallback state store for Vercel preview or offline mode
class BrowserFallbackStore {
  private get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = localStorage.getItem(`baton_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`baton_${key}`, JSON.stringify(value));
    } catch {}
  }

  getProjects(): Project[] {
    return this.get<Project[]>('projects', [INITIAL_DEMO_PROJECT]);
  }

  getProject(id: string): Project {
    const list = this.getProjects();
    return list.find((p) => p.id === id) || INITIAL_DEMO_PROJECT;
  }

  saveProject(project: Project): void {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.unshift(project);
    }
    this.set('projects', list);
  }

  getSources(projectId: string): Source[] {
    return this.get<Source[]>(`sources_${projectId}`, INITIAL_DEMO_SOURCES);
  }

  getClaims(projectId: string, category?: string, status?: string): Claim[] {
    let claims = this.get<Claim[]>(`claims_${projectId}`, INITIAL_DEMO_CLAIMS);
    if (!Array.isArray(claims)) claims = INITIAL_DEMO_CLAIMS;
    if (category && category !== 'all') claims = claims.filter((c) => c.category === category);
    if (status && status !== 'all') claims = claims.filter((c) => c.status === status);
    return claims;
  }

  updateClaim(claimId: string, updates: Partial<Claim>): Claim {
    const proj = this.getProjects()[0];
    const projId = proj?.id || 'events-app-demo-01';
    let claims = this.get<Claim[]>(`claims_${projId}`, INITIAL_DEMO_CLAIMS);
    if (!Array.isArray(claims)) claims = [...INITIAL_DEMO_CLAIMS];
    const idx = claims.findIndex((c) => c.id === claimId);
    if (idx >= 0) {
      claims[idx] = { ...claims[idx], ...updates, updated_at: new Date().toISOString() };
      this.set(`claims_${projId}`, claims);
      return claims[idx];
    }
    throw new Error('Claim not found');
  }

  getQuestions(projectId: string): LeaverQuestion[] {
    const qList = this.get<LeaverQuestion[]>(`questions_${projectId}`, INITIAL_DEMO_QUESTIONS);
    return Array.isArray(qList) ? qList : INITIAL_DEMO_QUESTIONS;
  }

  answerQuestion(questionId: string, answer: string): LeaverQuestion {
    const proj = this.getProjects()[0];
    const projId = proj?.id || 'events-app-demo-01';
    let qList = this.getQuestions(projId);
    if (!Array.isArray(qList)) qList = [...INITIAL_DEMO_QUESTIONS];
    const idx = qList.findIndex((q) => q.id === questionId);
    if (idx >= 0) {
      qList[idx].leaver_answer = answer;
      qList[idx].is_answered = true;
      qList[idx].answered_at = new Date().toISOString();
      this.set(`questions_${projId}`, qList);

      if (qList[idx].claim_id) {
        try {
          this.updateClaim(qList[idx].claim_id!, {
            status: 'Verified',
            conflict_details: null,
          });
        } catch {}
      }

      this.addAuditLog(projId, {
        actor_name: proj?.leaving_member || 'Outgoing Lead',
        actor_role: 'Outgoing Lead',
        action: 'QUESTION_ANSWERED',
        details: JSON.stringify({ question_id: questionId, answer }),
      });

      return qList[idx];
    }
    throw new Error('Question not found');
  }

  getAuditLogs(projectId: string): AuditLog[] {
    const logs = this.get<AuditLog[]>(`audit_${projectId}`, INITIAL_DEMO_AUDIT_LOGS);
    return Array.isArray(logs) ? logs : INITIAL_DEMO_AUDIT_LOGS;
  }

  addAuditLog(projectId: string, log: Omit<AuditLog, 'id' | 'project_id' | 'timestamp'>): void {
    const list = this.getAuditLogs(projectId);
    list.unshift({
      id: `log-${Date.now()}`,
      project_id: projectId,
      actor_name: log.actor_name,
      actor_role: log.actor_role,
      action: log.action,
      details: log.details,
      timestamp: new Date().toISOString(),
    });
    this.set(`audit_${projectId}`, list);
  }
}

const fallbackStore = new BrowserFallbackStore();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If no external API base URL is defined, run directly with fallbackStore
  if (!API_BASE_URL) {
    return handleFallback<T>(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch {
    return handleFallback<T>(endpoint, options);
  }
}

function handleFallback<T>(endpoint: string, options: RequestInit): T {
  const cleanPath = endpoint.split('?')[0];
  const parts = cleanPath.split('/').filter(Boolean); // e.g. ['api', 'projects', '123', 'sources']
  const method = (options.method || 'GET').toUpperCase();

  // 1. /api/projects
  if (parts.length === 2 && parts[0] === 'api' && parts[1] === 'projects') {
    if (method === 'GET') {
      return fallbackStore.getProjects() as T;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body as string);
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: body.name,
        description: body.description,
        target_role: body.target_role || 'Backend Lead',
        leaving_member: body.leaving_member || 'Alex Rivera (Outgoing Lead)',
        incoming_member: body.incoming_member || 'Sam Chen (Incoming Successor)',
        reviewer_name: body.reviewer_name || 'Priya Sharma (Tech Lead / Reviewer)',
        status: 'Draft',
        active_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sources_count: 0,
        claims_count: 0,
        unanswered_questions_count: 0,
      };
      fallbackStore.saveProject(newProj);
      return newProj as T;
    }
  }

  // 2. /api/projects/:id (EXACT single project)
  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'projects') {
    const id = parts[2];
    return fallbackStore.getProject(id) as T;
  }

  // 3. /api/demo/load-events-app
  if (parts[0] === 'api' && parts[1] === 'demo' && parts[2] === 'load-events-app') {
    fallbackStore.saveProject(INITIAL_DEMO_PROJECT);
    return {
      status: 'success',
      message: 'Events App demo scenario initialized.',
      project_id: INITIAL_DEMO_PROJECT.id,
      project_name: INITIAL_DEMO_PROJECT.name,
    } as T;
  }

  // 4. /api/projects/:id/sources
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'sources') {
    const projId = parts[2];
    return fallbackStore.getSources(projId) as T;
  }

  // 5. /api/projects/:id/claims
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'claims') {
    const projId = parts[2];
    const params = new URLSearchParams(endpoint.split('?')[1] || '');
    return fallbackStore.getClaims(projId, params.get('category') || undefined, params.get('status') || undefined) as T;
  }

  // 6. /api/claims/:claimId
  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'claims') {
    const claimId = parts[2];
    if (method === 'PUT') {
      const body = JSON.parse(options.body as string);
      return fallbackStore.updateClaim(claimId, body) as T;
    }
    const claims = fallbackStore.getClaims('events-app-demo-01');
    const found = claims.find((c) => c.id === claimId);
    return (found || claims[0]) as T;
  }

  // 7. /api/projects/:id/questions
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'questions') {
    const projId = parts[2];
    return fallbackStore.getQuestions(projId) as T;
  }

  // 8. /api/questions/:questionId/answer
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'questions' && parts[3] === 'answer') {
    const questionId = parts[2];
    const body = JSON.parse(options.body as string);
    return fallbackStore.answerQuestion(questionId, body.leaver_answer) as T;
  }

  // 9. /api/projects/:id/review/batch
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'review' && parts[4] === 'batch') {
    const projId = parts[2];
    const body = JSON.parse(options.body as string);
    for (const act of body.actions || []) {
      fallbackStore.updateClaim(act.claim_id, {
        reviewer_decision: act.decision,
        ...(act.updated_title ? { title: act.updated_title } : {}),
        ...(act.updated_description ? { description: act.updated_description } : {}),
        ...(act.new_status ? { status: act.new_status } : {}),
        ...(act.reviewer_notes ? { reviewer_notes: act.reviewer_notes } : {}),
      });
    }
    fallbackStore.addAuditLog(projId, {
      actor_name: body.reviewer_name,
      actor_role: body.reviewer_role || 'Reviewer',
      action: 'BATCH_REVIEW_SUBMITTED',
      details: JSON.stringify(body.actions),
    });
    return { status: 'success', processed_claims: (body.actions || []).length } as T;
  }

  // 10. /api/projects/:id/review/approve-handover
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'review' && parts[4] === 'approve-handover') {
    const projId = parts[2];
    const body = JSON.parse(options.body as string);
    const proj = fallbackStore.getProject(projId);
    proj.status = 'Approved';
    proj.active_version += 1;
    fallbackStore.saveProject(proj);
    fallbackStore.addAuditLog(projId, {
      actor_name: body.reviewer_name,
      actor_role: body.reviewer_role || 'Technical Lead',
      action: 'HANDOVER_APPROVED',
      details: JSON.stringify({ comments: body.comments, version: proj.active_version - 1 }),
    });
    return {
      status: 'success',
      message: 'Handover cleared review gate.',
      approval_id: `appr-${Date.now()}`,
      approved_version: proj.active_version - 1,
    } as T;
  }

  // 11. /api/projects/:id/handover
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'handover') {
    const projId = parts[2];
    const params = new URLSearchParams(endpoint.split('?')[1] || '');
    const role = (params.get('role') as UserRole) || 'Successor';

    const proj = fallbackStore.getProject(projId);
    let allClaims = fallbackStore.getClaims(projId);

    if (role === 'Observer') {
      allClaims = allClaims.filter((c) => !c.is_confidential && ['timeline', 'decision'].includes(c.category));
    } else if (role === 'Manager') {
      allClaims = allClaims.filter((c) => ['risk', 'ownership', 'decision', 'timeline', 'next_action'].includes(c.category));
    } else if (role === 'Teammate') {
      allClaims = allClaims.filter((c) => !c.is_confidential && ['ownership', 'dependency', 'next_action', 'risk'].includes(c.category));
    }

    const pkg: HandoverPackage = {
      project: proj,
      viewer_role: role,
      is_approved: proj.status === 'Approved' || proj.status === 'HandedOver',
      version: proj.active_version,
      summary: {
        total_claims: allClaims.length,
        verified_count: allClaims.filter((c) => c.status === 'Verified').length,
        inferred_count: allClaims.filter((c) => c.status === 'Inferred').length,
        conflicting_count: allClaims.filter((c) => c.status === 'Conflicting').length,
        missing_count: allClaims.filter((c) => c.status === 'Missing').length,
        questions_total: fallbackStore.getQuestions(projId).length,
        questions_answered: fallbackStore.getQuestions(projId).filter((q) => q.is_answered).length,
      },
      decisions: allClaims.filter((c) => c.category === 'decision'),
      ownership: allClaims.filter((c) => c.category === 'ownership'),
      risks: allClaims.filter((c) => c.category === 'risk'),
      dependencies: allClaims.filter((c) => c.category === 'dependency'),
      timeline: allClaims.filter((c) => c.category === 'timeline'),
      first_week_plan: allClaims.filter((c) => c.category === 'next_action').sort((a, b) => (a.action_day || 99) - (b.action_day || 99)),
      unresolved_questions: fallbackStore.getQuestions(projId),
      approval:
        proj.status === 'Approved' || proj.status === 'HandedOver'
          ? {
              id: 'appr-01',
              project_id: projId,
              version: proj.active_version - 1,
              reviewer_name: proj.reviewer_name,
              reviewer_role: 'Technical Lead',
              comments: 'Verified claims against source evidence and approved for incoming successor.',
              approved_at: new Date().toISOString(),
            }
          : null,
      receipt:
        proj.status === 'HandedOver'
          ? {
              recipient_name: proj.incoming_member,
              recipient_role: 'Successor',
              signature: proj.incoming_member.split(' ')[0],
              acknowledged_at: new Date().toISOString(),
              checklist: ['access', 'decisions', 'first_week'],
            }
          : null,
    };
    return pkg as T;
  }

  // 12. /api/projects/:id/handover/acknowledge
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'handover' && parts[4] === 'acknowledge') {
    const projId = parts[2];
    const body = JSON.parse(options.body as string);
    const proj = fallbackStore.getProject(projId);
    proj.status = 'HandedOver';
    fallbackStore.saveProject(proj);
    fallbackStore.addAuditLog(projId, {
      actor_name: body.recipient_name,
      actor_role: body.recipient_role || 'Successor',
      action: 'HANDOVER_ACKNOWLEDGED',
      details: JSON.stringify({ signature: body.sign_off_signature, checklist: body.checklist_completed }),
    });
    return {
      status: 'success',
      message: `Handover signed and acknowledged by ${body.recipient_name}.`,
      receipt_id: `rec-${Date.now()}`,
      acknowledged_at: new Date().toISOString(),
    } as T;
  }

  // 13. /api/projects/:id/audit
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'audit') {
    const projId = parts[2];
    return fallbackStore.getAuditLogs(projId) as T;
  }

  // 14. /api/projects/:id/reconstruct
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'reconstruct') {
    return {
      status: 'success',
      message: 'Reconstructed 11 claims across decisions, ownership, risks, dependencies, timeline and next actions.',
      claims_count: 11,
      questions_generated: 4,
    } as T;
  }

  // 15. /api/projects/:id/github/analyze-pr
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'github' && parts[4] === 'analyze-pr') {
    return {
      pr_number: 42,
      pr_title: 'feat(billing): Stripe webhook idempotency key & payment intent lifecycle',
      author: 'alex.rivera',
      source_branch: 'feature/webhook-retry',
      target_branch: 'main',
      state: 'OPEN (Unmerged Work)',
      additions: 342,
      deletions: 48,
      changed_files_count: 3,
      analyzed_at: new Date().toISOString(),
      files: [
        {
          path: 'alembic/versions/3a98c_stripe.py',
          status: 'modified',
          hunk: '@@ -14,6 +14,14 @@ def upgrade():\n+    op.add_column(\'transactions\', sa.Column(\'stripe_charge_id\', sa.String(64), nullable=True))\n+    op.create_index(\'ix_tx_stripe_id\', \'transactions\', [\'stripe_charge_id\'])\n\ndef downgrade():\n-    pass\n+    # TODO: implement rollback dropping column and index\n+    pass',
          issue: 'Missing downgrade() migration script. Rollback in production will fail or leave orphaned schema.',
          severity: 'CRITICAL',
        },
        {
          path: 'src/services/billing.ts',
          status: 'modified',
          hunk: '@@ -88,6 +88,12 @@ export async function handleWebhookEvent(event: StripeEvent) {\n+  // TODO: Add distributed redis lock to prevent duplicate execution during concurrent retries\n+  const processed = await db.transactions.findUnique({ where: { stripe_charge_id: event.id } });',
          issue: 'Concurrency race hazard: missing distributed Redis lock for webhook deduplication.',
          severity: 'HIGH',
        },
        {
          path: '.env.example',
          status: 'unmodified',
          hunk: 'MISSING_KEY: STRIPE_WEBHOOK_SECRET_LIVE is required by src/services/billing.ts but absent in .env.example',
          issue: 'Undocumented secret key dependency required for production operation.',
          severity: 'MEDIUM',
        },
      ],
      summary: 'Found 3 structural risks in open PR #42. The migration lacks a rollback downgrade function, the billing service contains an unmerged concurrency hazard, and a required environment variable is undocumented.',
      recommended_action: 'Block merge until downgrade() script is provided and add concurrency lock to the first-week priority queue.',
    } as T;
  }

  // 16. /api/projects/:id/github/convert-pr-risk-to-claim
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'github' && parts[4] === 'convert-pr-risk-to-claim') {
    const projId = parts[2];
    const body = JSON.parse(options.body as string);
    const newClaim: Claim = {
      id: `claim-pr-${Date.now().toString().slice(-6)}`,
      project_id: projId,
      category: 'risk',
      title: body.risk_title,
      description: body.risk_description,
      status: 'Verified',
      confidence_score: 0.98,
      reviewer_decision: 'approved',
      reviewer_notes: 'Auto-approved risk identified during GitHub PR Diff Analysis',
      version: 1,
      area: 'backend',
      is_confidential: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      citations: [
        {
          id: `cit-pr-${Date.now().toString().slice(-4)}`,
          claim_id: `claim-pr-${Date.now().toString().slice(-6)}`,
          source_chunk_id: 'chunk-pr-42',
          quote_span: 'def downgrade():\n    # TODO: implement rollback dropping column\n    pass',
          relevance_explanation: 'Directly extracted from PR #42 diff analysis',
          source_title: 'PR #42 (feature/webhook-retry)',
          source_type: 'git_repo',
          span_identifier: body.source_reference || 'PR #42 (commit 8f2a9c1)',
          sensitivity_level: 'internal',
        },
      ],
    };

    let claims = fallbackStore.getClaims(projId);
    if (!Array.isArray(claims)) claims = [];
    claims.unshift(newClaim);
    try {
      localStorage.setItem(`baton_claims_${projId}`, JSON.stringify(claims));
    } catch {}

    fallbackStore.addAuditLog(projId, {
      actor_name: 'GitHub Analyzer Bot',
      actor_role: 'Automated Verifier',
      action: 'GITHUB_PR_RISK_IMPORTED',
      details: JSON.stringify({ claim_id: newClaim.id, title: newClaim.title }),
    });

    return { status: 'success', claim_id: newClaim.id, message: 'PR risk converted to verified handover claim' } as T;
  }

  // 17. /api/projects/:id/leaver-bot/dispatch
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'leaver-bot' && parts[4] === 'dispatch') {
    const projId = parts[2];
    const body = JSON.parse(options.body as string);
    const questions = fallbackStore.getQuestions(projId).filter((q) => !q.is_answered);
    const proj = fallbackStore.getProject(projId);

    fallbackStore.addAuditLog(projId, {
      actor_name: 'Baton Bot Service',
      actor_role: 'Bot Dispatcher',
      action: 'LEAVER_BOT_QUESTIONS_DISPATCHED',
      details: JSON.stringify({ channel: body.channel_name, platform: body.platform, count: questions.length }),
    });

    return {
      status: 'success',
      platform: body.platform || 'slack',
      channel: body.channel_name || '#leaver-handover-alex',
      recipient: proj.leaving_member,
      dispatched_count: questions.length,
      slack_blocks_preview: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `Baton Handover Bot: ${proj.name}` },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hi *${proj.leaving_member}*! As part of your transition before your final day, Baton detected *${questions.length} knowledge gaps* requiring your context so *${proj.incoming_member}* can succeed.`,
          },
        },
      ],
      dispatched_at: new Date().toISOString(),
    } as T;
  }

  // 18. /api/projects/:id/leaver-bot/simulate-reply
  if (parts.length === 5 && parts[0] === 'api' && parts[1] === 'projects' && parts[3] === 'leaver-bot' && parts[4] === 'simulate-reply') {
    const projId = parts[2];
    const body = JSON.parse(options.body as string);
    fallbackStore.answerQuestion(body.question_id, body.answer);

    fallbackStore.addAuditLog(projId, {
      actor_name: body.answered_by || 'Alex Rivera (via Slack)',
      actor_role: 'Outgoing Lead (Remote)',
      action: 'LEAVER_BOT_ANSWER_RECEIVED',
      details: JSON.stringify({
        question_id: body.question_id,
        channel: body.channel || '#leaver-handover-alex',
        answer: body.answer,
      }),
    });

    return {
      status: 'success',
      message: `Answer recorded from ${body.answered_by || 'Alex Rivera'} via ${body.channel || 'Slack'}`,
      question_id: body.question_id,
      answered_at: new Date().toISOString(),
    } as T;
  }

  return {} as T;
}

export const api = {
  getProjects: () => request<Project[]>('/api/projects'),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string; target_role?: string; leaving_member?: string; incoming_member?: string; reviewer_name?: string }) =>
    request<Project>('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  loadEventsAppDemo: () =>
    request<{ status: string; message: string; project_id: string; project_name: string }>('/api/demo/load-events-app', {
      method: 'POST',
    }),

  getSources: (projectId: string) => request<Source[]>(`/api/projects/${projectId}/sources`),
  uploadSourceFile: (projectId: string, file: File, sourceType: string = 'doc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    return request<Source>(`/api/projects/${projectId}/sources/upload`, {
      method: 'POST',
      body: formData,
    });
  },
  importGitHub: (projectId: string, repositoryUrl: string) =>
    request<Source>(`/api/projects/${projectId}/sources/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repository_url: repositoryUrl }),
    }),
  getSourceChunks: (projectId: string, sourceId: string) =>
    request<SourceChunk[]>(`/api/projects/${projectId}/sources/${sourceId}/chunks`),

  // Improvement 1: Live GitHub Webhook & PR Diff Analysis
  analyzePullRequest: (projectId: string, prNumber: number = 42, repositoryUrl?: string) =>
    request<PRAnalysisResult>(`/api/projects/${projectId}/github/analyze-pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pr_number: prNumber, repository_url: repositoryUrl }),
    }),
  convertPrRiskToClaim: (projectId: string, data: { risk_title: string; risk_description: string; severity?: string; source_reference?: string }) =>
    request<{ status: string; claim_id: string; message: string }>(`/api/projects/${projectId}/github/convert-pr-risk-to-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  reconstruct: (projectId: string) =>
    request<{ status: string; message: string; claims_count: number; questions_generated: number }>(`/api/projects/${projectId}/reconstruct`, {
      method: 'POST',
    }),

  getClaims: (projectId: string, category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request<Claim[]>(`/api/projects/${projectId}/claims${q}`);
  },
  getClaim: (claimId: string) => request<Claim>(`/api/claims/${claimId}`),
  updateClaim: (claimId: string, data: Partial<Claim>) =>
    request<Claim>(`/api/claims/${claimId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getQuestions: (projectId: string) => request<LeaverQuestion[]>(`/api/projects/${projectId}/questions`),
  answerQuestion: (questionId: string, answer: string) =>
    request<LeaverQuestion>(`/api/questions/${questionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaver_answer: answer }),
    }),

  // Improvement 2: Automated Slack/Discord Bot for Leaver Q&A
  dispatchLeaverBot: (projectId: string, data: { channel_name: string; platform: 'slack' | 'discord' }) =>
    request<LeaverBotDispatchResult>(`/api/projects/${projectId}/leaver-bot/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  simulateBotReply: (projectId: string, data: { question_id: string; answer: string; answered_by?: string; channel?: string }) =>
    request<{ status: string; message: string; question_id: string; answered_at: string }>(`/api/projects/${projectId}/leaver-bot/simulate-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  batchReview: (projectId: string, data: { reviewer_name: string; reviewer_role?: string; actions: any[] }) =>
    request<{ status: string; processed_claims: number }>(`/api/projects/${projectId}/review/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  approveHandover: (projectId: string, data: { reviewer_name: string; reviewer_role?: string; comments?: string }) =>
    request<{ status: string; message: string; approval_id: string; approved_version: number }>(`/api/projects/${projectId}/review/approve-handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getHandoverPackage: (projectId: string, role: string = 'Successor', area: string = 'all') =>
    request<HandoverPackage>(`/api/projects/${projectId}/handover?role=${role}&area=${area}`),
  acknowledgeReceipt: (projectId: string, data: { recipient_name: string; recipient_role?: string; checklist_completed: string[]; sign_off_signature: string }) =>
    request<{ status: string; message: string; receipt_id: string; acknowledged_at: string }>(`/api/projects/${projectId}/handover/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getAuditLogs: (projectId: string) => request<AuditLog[]>(`/api/projects/${projectId}/audit`),
};
