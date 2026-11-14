import React, { useState } from 'react';
import { Claim, Project } from '@/lib/types';
import { api } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import { ShieldCheck, ShieldAlert, Check, X, Edit3, Lock, Unlock, FileCheck, ExternalLink, ArrowRight } from 'lucide-react';

interface Props {
  project: Project;
  claims: Claim[];
  onReviewCompleted: () => void;
  onSelectClaim: (claim: Claim) => void;
  onProceedToHandover: () => void;
}

export const ReviewGateTab: React.FC<Props> = ({
  project,
  claims,
  onReviewCompleted,
  onSelectClaim,
  onProceedToHandover,
}) => {
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<string>('Verified');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [approvingHandover, setApprovingHandover] = useState(false);
  const [approvalComments, setApprovalComments] = useState(
    'All critical claims, rejected alternatives, and risks reviewed and verified against supporting sources.'
  );

  const isGateCleared = project.status === 'Approved' || project.status === 'HandedOver';

  const handleQuickDecision = async (claimId: string, decision: 'approved' | 'rejected') => {
    try {
      await api.batchReview(project.id, {
        reviewer_name: project.reviewer_name,
        reviewer_role: 'Technical Lead / Reviewer',
        actions: [{ claim_id: claimId, decision }],
      });
      onReviewCompleted();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (claim: Claim) => {
    setEditingClaimId(claim.id);
    setEditTitle(claim.title);
    setEditDescription(claim.description);
    setEditStatus(claim.status);
    setReviewerNotes(claim.reviewer_notes || '');
  };

  const saveEdit = async (claimId: string) => {
    try {
      await api.batchReview(project.id, {
        reviewer_name: project.reviewer_name,
        reviewer_role: 'Technical Lead / Reviewer',
        actions: [
          {
            claim_id: claimId,
            decision: 'edited',
            updated_title: editTitle,
            updated_description: editDescription,
            new_status: editStatus,
            reviewer_notes: reviewerNotes,
          },
        ],
      });
      setEditingClaimId(null);
      onReviewCompleted();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalApproval = async () => {
    setApprovingHandover(true);
    try {
      await api.approveHandover(project.id, {
        reviewer_name: project.reviewer_name,
        reviewer_role: 'Technical Lead / Reviewer',
        comments: approvalComments,
      });
      onReviewCompleted();
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingHandover(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Review Gate Status Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isGateCleared
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40'
            : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isGateCleared
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isGateCleared ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                  isGateCleared
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isGateCleared ? 'REVIEW GATE CLEARED' : 'REVIEW GATE ACTIVE'}
              </span>
              <span className="text-xs text-slate-400">Handover Version v{project.active_version}</span>
            </div>
            <h2 className="text-base font-bold text-white">
              {isGateCleared
                ? 'Handover Approved & Ready for Incoming Member'
                : 'Review Gate: Nothing is shared until approved by a reviewer'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Designated Reviewer: <strong className="text-white">{project.reviewer_name}</strong>.
              Review claims beside their citations, edit phrasing, reject inaccuracies, and sign off.
            </p>
          </div>
        </div>

        {isGateCleared ? (
          <button
            onClick={onProceedToHandover}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 font-bold text-xs transition shadow-lg shadow-teal-500/20 shrink-0"
          >
            <span>View Role-Based Handover</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleFinalApproval}
              disabled={approvingHandover}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{approvingHandover ? 'Signing off...' : 'Sign & Approve Handover'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Claims Review Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Review Claims & Proof ({claims.length} claims)
          </h3>
          <span className="text-[11px] text-slate-400">All edits are tracked in the version audit log</span>
        </div>

        {claims.map((claim) => {
          const isEditing = editingClaimId === claim.id;

          return (
            <div
              key={claim.id}
              className={`p-5 rounded-2xl border transition ${
                claim.reviewer_decision === 'approved'
                  ? 'bg-slate-900/50 border-emerald-500/30'
                  : claim.reviewer_decision === 'rejected'
                  ? 'bg-slate-900/30 border-rose-500/30 opacity-70'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {isEditing ? (
                /* Editing View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-400">Editing Claim Details</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Inferred">Inferred</option>
                      <option value="Conflicting">Conflicting</option>
                      <option value="Missing">Missing</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                  />

                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />

                  <input
                    type="text"
                    placeholder="Reviewer justification notes..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingClaimId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(claim.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-600"
                    >
                      Save Version
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard View */
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {claim.category}
                      </span>
                      <StatusBadge status={claim.status} size="sm" />
                      {claim.reviewer_decision !== 'pending' && (
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            claim.reviewer_decision === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : claim.reviewer_decision === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          Reviewer: {claim.reviewer_decision}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{claim.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{claim.description}</p>

                    {claim.reviewer_notes && (
                      <p className="mt-2 text-xs text-amber-300 italic">
                        Reviewer Note: {claim.reviewer_notes}
                      </p>
                    )}

                    {/* Source citation summary */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => onSelectClaim(claim)}
                        className="text-[11px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition"
                      >
                        <span>View Evidence ({claim.citations?.length || 0} citations)</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQuickDecision(claim.id, 'approved')}
                      title="Approve Claim"
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                        claim.reviewer_decision === 'approved'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-slate-800/80 text-emerald-400 border-slate-700 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleQuickDecision(claim.id, 'rejected')}
                      title="Reject Claim"
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                        claim.reviewer_decision === 'rejected'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-slate-800/80 text-rose-400 border-slate-700 hover:bg-rose-500/20'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => startEditing(claim)}
                      title="Edit Claim"
                      className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 text-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

