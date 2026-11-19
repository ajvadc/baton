import React, { useState } from 'react';
import { Source, Project } from '@/lib/types';
import { api } from '@/lib/api';
import { Upload, GitBranch, FileText, MessageSquare, CheckSquare, Sparkles, Shield, ArrowRight, CheckCircle2, GitPullRequest } from 'lucide-react';
import { PRDiffAnalyzerModal } from './PRDiffAnalyzerModal';

interface Props {
  project: Project;
  sources: Source[];
  onSourcesUpdated: () => void;
  onProceedToReconstruct: () => void;
}

export const ConnectSourcesTab: React.FC<Props> = ({
  project,
  sources,
  onSourcesUpdated,
  onProceedToReconstruct,
}) => {
  const safeSources = Array.isArray(sources) ? sources : [];
  const [uploading, setUploading] = useState(false);
  const [sourceType, setSourceType] = useState('doc');
  const [repoUrl, setRepoUrl] = useState('');
  const [syncingGit, setSyncingGit] = useState(false);
  const [gitSuccess, setGitSuccess] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    try {
      await api.uploadSourceFile(project.id, file, sourceType);
      onSourcesUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGitSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setSyncingGit(true);
    setErrorMsg('');
    try {
      await api.importGitHub(project.id, repoUrl);
      setGitSuccess(true);
      setRepoUrl('');
      onSourcesUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'GitHub import failed');
    } finally {
      setSyncingGit(false);
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-sky-400" />;
      case 'task_board':
        return <CheckSquare className="w-5 h-5 text-emerald-400" />;
      case 'git_repo':
        return <GitBranch className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Intro Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              STAGE 01
            </span>
            <h1 className="text-xl font-bold text-white">Connect Authorised Sources</h1>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Import docs, task boards, git repos, and chat exports. Each chunk keeps its source ID, span tracking, and permission tags. Passwords, tokens, API keys, and personal contact details are redacted automatically before AI reasoning.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Grid: Upload & Git Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Ingestion Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Upload Documents & Data</h3>
                  <p className="text-xs text-slate-400">Markdown, Notes, Task CSV, Chat JSON</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Shield className="w-3 h-3" /> Auto-Masking
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Source Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'doc', label: 'Docs / Notes', icon: FileText },
                  { id: 'task_board', label: 'Task Board', icon: CheckSquare },
                  { id: 'chat', label: 'Chat Export', icon: MessageSquare },
                ].map((st) => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSourceType(st.id)}
                      className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                        sourceType === st.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center transition bg-slate-950/40">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                {uploading ? 'Processing & Redacting...' : 'Click or drag file to upload'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">.md, .txt, .csv, .json, .pdf</p>
            </div>
          </div>
        </div>

        {/* GitHub Repository Connector */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Connect Public Git Repository</h3>
                <p className="text-xs text-slate-400">Syncs commits, open PRs, and commit reasoning</p>
              </div>
            </div>

            <form onSubmit={handleGitSync} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400">
                <p className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Commit reasoning extraction
                </p>
                Baton scans commit messages and open PR diffs for half-done tasks and unmerged rollback scripts.
              </div>

              <button
                type="submit"
                disabled={syncingGit || !repoUrl}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {syncingGit ? 'Syncing GitHub Repo...' : 'Sync Repository Activity'}
              </button>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-purple-300 font-medium">PR Diff & Risk Scanner:</span>
                <button
                  type="button"
                  onClick={() => setShowPRModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Scan PR #42 Diffs</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Connected Sources List */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Ingested Source Activity ({safeSources.length})</h2>
            <p className="text-xs text-slate-400">Chunks indexed, redacted, and ready for claim reconstruction</p>
          </div>
          {safeSources.length > 0 && (
            <button
              onClick={onProceedToReconstruct}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 font-bold text-xs transition shadow-lg shadow-teal-500/20"
            >
              <span>Reconstruct Claims</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {safeSources.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            No sources connected yet. Upload files above or click <strong>&quot;Load Demo: Events App&quot;</strong> in the top header.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {safeSources.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700/80 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                      {getSourceTypeIcon(s.source_type)}
                      <span className="capitalize">{s.source_type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">
                      {s.chunk_count} chunks
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 truncate" title={s.title}>
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {s.summary || 'Contextual chunks indexed and masked.'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Masked: Secrets & PII</span>
                  <span>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GitHub PR Diff Analyzer Modal (Improvement 1) */}
      <PRDiffAnalyzerModal
        projectId={project.id}
        isOpen={showPRModal}
        onClose={() => setShowPRModal(false)}
        onRiskImported={() => {
          onSourcesUpdated();
        }}
      />
    </div>
  );
};

