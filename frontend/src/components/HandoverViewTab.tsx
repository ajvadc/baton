import React, { useState, useEffect } from 'react';
import { HandoverPackage, UserRole, Claim } from '@/lib/types';
import { api } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import {
  ShieldCheck,
  UserCheck,
  Calendar,
  AlertTriangle,
  GitBranch,
  Layers,
  Send,
  Lock,
  CheckCircle2,
  FileSignature,
  ExternalLink,
  Users,
  Shield,
} from 'lucide-react';

interface Props {
  projectId: string;
  onSelectClaim: (claim: Claim) => void;
  onReceiptSigned: () => void;
}

export const HandoverViewTab: React.FC<Props> = ({
  projectId,
  onSelectClaim,
  onReceiptSigned,
}) => {
  const [role, setRole] = useState<UserRole>('Successor');
  const [data, setData] = useState<HandoverPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [recipientName, setRecipientName] = useState('Sam Chen (Successor)');
  const [signatureText, setSignatureText] = useState('Sam Chen');
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});
  const [signing, setSigning] = useState(false);

  const fetchHandover = async () => {
    setLoading(true);
    try {
      const res = await api.getHandoverPackage(projectId, role);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandover();
  }, [projectId, role]);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureText) return;

    setSigning(true);
    try {
      const completedList = Object.keys(checkedItems).filter((k) => checkedItems[k]);
      await api.acknowledgeReceipt(projectId, {
        recipient_name: recipientName,
        recipient_role: role,
        checklist_completed: completedList,
        sign_off_signature: signatureText,
      });
      setShowSignModal(false);
      onReceiptSigned();
      fetchHandover();
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  const roleDescriptions: Record<UserRole, { includes: string; hides: string }> = {
    Successor: {
      includes: 'Full project state, decisions & rejected alternatives, risks, day 1-5 plan',
      hides: 'Secrets, personal messages, and HR data (redacted)',
    },
    Teammate: {
      includes: 'Tasks, owners, and dependencies in their own area',
      hides: 'Other areas’ decisions and contacts',
    },
    Manager: {
      includes: 'Risk, ownership, and open-decision executive summary',
      hides: 'Raw chat excerpts and technical code diffs',
    },
    Observer: {
      includes: 'Read-only status and project milestones timeline',
      hides: 'Anything marked confidential or unverified',
    },
  };

  if (loading && !data) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading handover package...</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-rose-400 text-sm">Failed to load handover view.</div>;
  }

  const isReceiptAcknowledged = !!data.receipt;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Role Switcher & Security Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                ROLE-BASED VIEW
              </span>
              <span className="text-xs text-slate-400">Enforced before retrieval</span>
            </div>
            <h1 className="text-xl font-bold text-white">Filtered Handover Package</h1>
            <p className="text-xs text-slate-300 mt-1">
              Currently viewing as <strong className="text-teal-400 font-bold">{role}</strong>.
              Restricted text never reaches the summary.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              {(['Successor', 'Teammate', 'Manager', 'Observer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    role === r
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSignModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition shadow-lg shrink-0 ${
                isReceiptAcknowledged
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 shadow-teal-500/20'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>{isReceiptAcknowledged ? 'Receipt Signed & Logged' : 'Acknowledge Receipt'}</span>
            </button>
          </div>
        </div>

        {/* Role Security Matrix Preview */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
          <div>
            <span className="text-teal-400 font-semibold">Included in {role} view: </span>
            {roleDescriptions[role].includes}
          </div>
          <div>
            <span className="text-slate-400 font-semibold">Hidden / Masked: </span>
            {roleDescriptions[role].hides}
          </div>
        </div>
      </div>

      {/* Handover Approval Stamp & Receipt Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reviewer Stamp */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white mb-0.5">Review Gate Verification</div>
            {data.approval ? (
              <p className="text-slate-300">
                Approved by <strong>{data.approval.reviewer_name}</strong> (v{data.approval.version}) on{' '}
                {new Date(data.approval.approved_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-amber-300">Pending final reviewer approval in Stage 04.</p>
            )}
          </div>
        </div>

        {/* Receipt Stamp */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white mb-0.5">Successor Acknowledgement</div>
            {data.receipt ? (
              <p className="text-slate-300">
                Acknowledged by <strong>{data.receipt.recipient_name}</strong>. Digital signature:{' '}
                <span className="font-mono text-teal-300 font-bold">&quot;{data.receipt.signature}&quot;</span>
              </p>
            ) : (
              <p className="text-slate-400">Incoming successor has not yet acknowledged receipt.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: First-Week Plan (Tactical Onboarding) */}
      {data.first_week_plan && data.first_week_plan.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">First-Week Tactical Onboarding Plan</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Ordered next actions with assigned owners, blockers, and first people to contact.
          </p>

          <div className="space-y-3">
            {data.first_week_plan.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectClaim(item)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    D{item.action_day || 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition mb-0.5">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    {item.blockers && (
                      <p className="text-[11px] text-rose-300 mt-1 font-medium">
                        Blocker: {item.blockers}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {item.contacts && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Contact: <strong className="text-slate-200">{item.contacts}</strong>
                    </span>
                  )}
                  <StatusBadge status={item.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Decisions & Reasoning (With Rejected Alternatives) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-base font-bold text-white mb-1">Decisions & Reasoning</h2>
        <p className="text-xs text-slate-400 mb-4">
          Why an option was chosen, and which alternatives were rejected.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.decisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => onSelectClaim(dec)}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={dec.status} size="sm" />
                  <span className="text-[10px] text-slate-400">{dec.citations.length} sources</span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1.5">{dec.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{dec.description}</p>

                {dec.alternatives_considered && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                    <strong className="text-amber-300">Rejected alternative: </strong>
                    {dec.alternatives_considered}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-teal-400 flex items-center justify-between font-medium">
                <span>View evidence</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Ownership & Hidden Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ownership */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-1">Ownership & Mandates</h2>
          <p className="text-xs text-slate-400 mb-4">Who owns what, including conflicting mandates</p>

          <div className="space-y-3">
            {data.ownership.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectClaim(item)}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <StatusBadge status={item.status} size="sm" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                {item.conflict_details && (
                  <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    {item.conflict_details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hidden Dependencies & Risks */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-1">Risks & Hidden Dependencies</h2>
          <p className="text-xs text-slate-400 mb-4">Known failure patterns, workarounds, external renewals</p>

          <div className="space-y-3">
            {[...data.risks, ...data.dependencies].map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectClaim(item)}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <StatusBadge status={item.status} size="sm" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acknowledgement Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Digital Acknowledgement of Receipt</h3>
            <p className="text-xs text-slate-300 mb-4">
              By submitting this acknowledgement, you confirm receipt of the verified project state,
              decisions, and first-week tasks.
            </p>

            <form onSubmit={handleAcknowledge} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Digital Sign-off Signature
                </label>
                <input
                  type="text"
                  placeholder="Type your full legal name..."
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-white block mb-1">Checklist confirmation:</span>
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={checkedItems['access'] || false}
                    onChange={(e) =>
                      setCheckedItems({ ...checkedItems, access: e.target.checked })
                    }
                  />
                  <span>I have received repo and IAM credentials</span>
                </label>
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={checkedItems['decisions'] || false}
                    onChange={(e) =>
                      setCheckedItems({ ...checkedItems, decisions: e.target.checked })
                    }
                  />
                  <span>I have reviewed the architecture decisions and rejected options</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkedItems['first_week'] || false}
                    onChange={(e) =>
                      setCheckedItems({ ...checkedItems, first_week: e.target.checked })
                    }
                  />
                  <span>I have scheduled Day 1-3 onboarding action items</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signing || !signatureText}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {signing ? 'Signing...' : 'Sign & Complete Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

