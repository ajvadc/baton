import React, { useState } from 'react';
import { Claim, ClaimCategory, ClaimStatus } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { Cpu, RefreshCw, Filter, Sparkles, AlertTriangle, ExternalLink, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Props {
  claims: Claim[];
  onReconstruct: () => void;
  reconstructing: boolean;
  onSelectClaim: (claim: Claim) => void;
  onProceedToQuestions: () => void;
}

export const ReconstructVerifyTab: React.FC<Props> = ({
  claims,
  onReconstruct,
  reconstructing,
  onSelectClaim,
  onProceedToQuestions,
}) => {
  const safeClaims = Array.isArray(claims) ? claims : [];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredClaims = safeClaims.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  const countsByStatus = {
    Verified: safeClaims.filter((c) => c.status === 'Verified').length,
    Inferred: safeClaims.filter((c) => c.status === 'Inferred').length,
    Conflicting: safeClaims.filter((c) => c.status === 'Conflicting').length,
    Missing: safeClaims.filter((c) => c.status === 'Missing').length,
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'decision', label: 'Decisions & Reasoning' },
    { id: 'ownership', label: 'Ownership' },
    { id: 'risk', label: 'Risks & Recurring Issues' },
    { id: 'dependency', label: 'Hidden Dependencies' },
    { id: 'timeline', label: 'Timeline & Milestones' },
    { id: 'next_action', label: 'Next Actions' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stage Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              STAGE 02 & 03
            </span>
            <h1 className="text-xl font-bold text-white">Reconstruct & Verify Handover State</h1>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Claims extracted with citations. Every claim carries its proof and an evidence status:
            <strong className="text-emerald-400"> Verified</strong>,
            <strong className="text-indigo-400"> Inferred</strong>,
            <strong className="text-amber-400"> Conflicting</strong>, or
            <strong className="text-rose-400"> Missing</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReconstruct}
            disabled={reconstructing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconstructing ? 'animate-spin' : ''}`} />
            <span>{reconstructing ? 'Reconstructing...' : 'Re-run AI Extraction'}</span>
          </button>

          <button
            onClick={onProceedToQuestions}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <span>Resolve Gaps & Conflicts</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedStatus(selectedStatus === 'Verified' ? 'all' : 'Verified')}
          className={`p-4 rounded-xl border text-left transition ${
            selectedStatus === 'Verified'
              ? 'bg-emerald-500/20 border-emerald-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Verified</span>
            <StatusBadge status="Verified" size="sm" showIcon={false} />
          </div>
          <div className="text-2xl font-black text-white">{countsByStatus.Verified}</div>
          <p className="text-[11px] text-slate-400 mt-1">Backed by 2+ agreeing sources</p>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'Inferred' ? 'all' : 'Inferred')}
          className={`p-4 rounded-xl border text-left transition ${
            selectedStatus === 'Inferred'
              ? 'bg-indigo-500/20 border-indigo-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Inferred</span>
            <StatusBadge status="Inferred" size="sm" showIcon={false} />
          </div>
          <div className="text-2xl font-black text-white">{countsByStatus.Inferred}</div>
          <p className="text-[11px] text-slate-400 mt-1">Single source or model inference</p>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'Conflicting' ? 'all' : 'Conflicting')}
          className={`p-4 rounded-xl border text-left transition ${
            selectedStatus === 'Conflicting'
              ? 'bg-amber-500/20 border-amber-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Conflicting</span>
            <StatusBadge status="Conflicting" size="sm" showIcon={false} />
          </div>
          <div className="text-2xl font-black text-white">{countsByStatus.Conflicting}</div>
          <p className="text-[11px] text-slate-400 mt-1">Sources disagree; both shown</p>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'Missing' ? 'all' : 'Missing')}
          className={`p-4 rounded-xl border text-left transition ${
            selectedStatus === 'Missing'
              ? 'bg-rose-500/20 border-rose-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Missing</span>
            <StatusBadge status="Missing" size="sm" showIcon={false} />
          </div>
          <div className="text-2xl font-black text-white">{countsByStatus.Missing}</div>
          <p className="text-[11px] text-slate-400 mt-1">Unresolved gaps in activity</p>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
              selectedCategory === cat.id
                ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-sm">
            No claims found matching the current filters.
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => onSelectClaim(claim)}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {claim.category}
                  </span>
                  <StatusBadge status={claim.status} size="sm" />
                  {claim.action_day && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Day {claim.action_day}
                    </span>
                  )}
                  {claim.area && (
                    <span className="text-[10px] text-slate-400 capitalize hidden sm:inline">
                      • {claim.area}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition mb-1">
                  {claim.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {claim.description}
                </p>

                {claim.conflict_details && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span><strong>Disagreement:</strong> {claim.conflict_details}</span>
                  </div>
                )}

                {/* Citations Snippets */}
                {claim.citations && claim.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Sources:
                    </span>
                    {claim.citations.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700"
                      >
                        {c.source_title || 'Document'} {c.span_identifier ? `(${c.span_identifier})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {Math.round((claim.confidence_score || 0.85) * 100)}% Confidence
                </span>
                <span className="text-xs text-teal-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                  Inspect Evidence <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

