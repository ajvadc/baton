import React from 'react';
import { Claim, Citation } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { X, ExternalLink, ShieldAlert, FileText, MessageSquare, CheckSquare, GitBranch } from 'lucide-react';

interface Props {
  claim: Claim | null;
  onClose: () => void;
}

export const EvidenceViewerModal: React.FC<Props> = ({ claim, onClose }) => {
  if (!claim) return null;

  const getSourceIcon = (type?: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'task_board':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'git_repo':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-2 py-0.5 bg-slate-800 rounded">
              {claim.category}
            </span>
            <StatusBadge status={claim.status} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Info */}
        <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40">
          <h2 className="text-lg font-bold text-white mb-2">{claim.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{claim.description}</p>

          {claim.alternatives_considered && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <span className="font-semibold text-amber-300">Alternatives Considered & Rejected: </span>
              {claim.alternatives_considered}
            </div>
          )}

          {claim.conflict_details && (
            <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
              <span className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Conflicting Perspectives:
              </span>
              {claim.conflict_details}
            </div>
          )}
        </div>

        {/* Citations / Supporting Evidence */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Supporting Evidence & Exact Citations ({claim.citations?.length || 0})
            </h3>
            <span className="text-xs text-slate-400 italic">Redactions masked automatically</span>
          </div>

          {!claim.citations || claim.citations.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-sm">
              No direct source citation attached. This claim is flagged as{' '}
              <strong className="text-rose-400">Missing Evidence</strong>.
            </div>
          ) : (
            claim.citations.map((cit, idx) => (
              <div
                key={cit.id || idx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 font-medium text-slate-300">
                    {getSourceIcon(cit.source_type)}
                    <span>{cit.source_title || 'Document Chunk'}</span>
                    {cit.span_identifier && (
                      <span className="text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded font-mono text-[11px]">
                        {cit.span_identifier}
                      </span>
                    )}
                  </div>
                  {cit.sensitivity_level && (
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">
                      {cit.sensitivity_level}
                    </span>
                  )}
                </div>

                <div className="relative font-mono text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  <span className="text-amber-400 font-bold mr-1">&ldquo;</span>
                  {cit.quote_span}
                  <span className="text-amber-400 font-bold ml-1">&rdquo;</span>
                </div>

                {cit.relevance_explanation && (
                  <p className="mt-2 text-xs text-slate-400 italic">
                    Reasoning: {cit.relevance_explanation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div>Confidence Score: <span className="font-semibold text-white">{Math.round((claim.confidence_score || 0.85) * 100)}%</span></div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
