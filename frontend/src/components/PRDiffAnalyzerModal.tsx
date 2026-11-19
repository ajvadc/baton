'use client';

import React, { useState } from 'react';
import { PRAnalysisResult, PRFileRisk } from '@/lib/types';
import { api } from '@/lib/api';
import {
  GitPullRequest,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  FileCode2,
  PlusCircle,
  ExternalLink,
  Loader2,
  GitBranch,
} from 'lucide-react';

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onRiskImported: () => void;
}

export const PRDiffAnalyzerModal: React.FC<Props> = ({
  projectId,
  isOpen,
  onClose,
  onRiskImported,
}) => {
  const [prNumber, setPrNumber] = useState(42);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PRAnalysisResult | null>(null);
  const [importingPath, setImportingPath] = useState<string | null>(null);
  const [importedSuccess, setImportedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setLoading(true);
    setImportedSuccess(null);
    try {
      const res = await api.analyzePullRequest(projectId, prNumber);
      setAnalysis(res);
    } catch (err) {
      console.error('Error analyzing PR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportRiskAsClaim = async (fileRisk: PRFileRisk) => {
    setImportingPath(fileRisk.path);
    try {
      await api.convertPrRiskToClaim(projectId, {
        risk_title: `Unmerged PR #${prNumber} Risk: ${fileRisk.issue}`,
        risk_description: `Detected in ${fileRisk.path}. Hunk:\n${fileRisk.hunk}\nSeverity: ${fileRisk.severity}`,
        severity: fileRisk.severity,
        source_reference: `PR #${prNumber} (${fileRisk.path})`,
      });
      setImportedSuccess(`Successfully converted risk in ${fileRisk.path} into an approved Handover Claim!`);
      onRiskImported();
    } catch (err) {
      console.error('Error importing risk:', err);
    } finally {
      setImportingPath(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Live GitHub Webhook & PR Diff Analyzer</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Improvement 1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan open PR diffs, detect missing rollback migrations, uncommitted work, and convert risks to verifiable claims
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Pull Request #:</label>
              <input
                type="number"
                value={prNumber}
                onChange={(e) => setPrNumber(parseInt(e.target.value) || 42)}
                className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
              />
              <span className="text-xs text-slate-400 hidden sm:inline">
                (Default: PR #42 &quot;Stripe Idempotency & Lifecycle&quot;)
              </span>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning Diffs & Commits...</span>
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  <span>Run PR Diff Analysis</span>
                </>
              )}
            </button>
          </div>

          {importedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importedSuccess}</span>
            </div>
          )}

          {/* Analysis Results View */}
          {analysis ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-purple-500/30 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      PR #{analysis.pr_number}
                    </span>
                    <h3 className="text-sm font-bold text-white">{analysis.pr_title}</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                    {analysis.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 mb-4 border-y border-slate-800/80 py-3 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">AUTHOR</span>
                    <span className="text-white font-bold">{analysis.author}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">BRANCH</span>
                    <span className="text-purple-400">{analysis.source_branch} &rarr; {analysis.target_branch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CHANGES</span>
                    <span className="text-emerald-400">+{analysis.additions}</span>{' '}
                    <span className="text-rose-400">-{analysis.deletions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">AFFECTED FILES</span>
                    <span className="text-slate-200">{analysis.changed_files_count} files</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-purple-300">Automated Audit Finding: </strong>
                  {analysis.summary}
                </p>
              </div>

              {/* Flagged File Risks */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Flagged Structural & Migration Risks ({analysis.files.length})
                </h4>

                <div className="space-y-4">
                  {analysis.files.map((file, idx) => {
                    const isCritical = file.severity === 'CRITICAL';
                    const isHigh = file.severity === 'HIGH';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          isCritical
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : isHigh
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isCritical ? (
                              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : isHigh ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Info className="w-4 h-4 text-teal-400 shrink-0" />
                            )}
                            <span className="font-mono text-xs font-bold text-white">{file.path}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                                isCritical
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : isHigh
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {file.severity}
                            </span>
                          </div>

                          <button
                            onClick={() => handleImportRiskAsClaim(file)}
                            disabled={importingPath === file.path}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow disabled:opacity-50 self-start sm:self-auto"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>
                              {importingPath === file.path ? 'Importing...' : 'Add as Handover Risk'}
                            </span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 mb-3">{file.issue}</p>

                        {/* Diff Hunk snippet */}
                        <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
                          <pre className="text-slate-300">
                            {file.hunk.split('\n').map((line, lIdx) => {
                              const isAdd = line.startsWith('+');
                              const isDel = line.startsWith('-');
                              return (
                                <div
                                  key={lIdx}
                                  className={
                                    isAdd
                                      ? 'text-emerald-400 bg-emerald-950/30 px-1'
                                      : isDel
                                      ? 'text-rose-400 bg-rose-950/30 px-1'
                                      : 'text-slate-400'
                                  }
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              Click <strong>&quot;Run PR Diff Analysis&quot;</strong> above to scan open PR #42 for missing migrations and unmerged risks.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
          <span>Continuous Integration: Webhook trigger enabled for all Git PR updates</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close Analyzer
          </button>
        </div>
      </div>
    </div>
  );
};
