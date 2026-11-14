import React from 'react';
import { Project } from '@/lib/types';
import { ShieldCheck, History, Sparkles, FolderSync, PlusCircle } from 'lucide-react';

interface Props {
  project: Project | null;
  onOpenAudit: () => void;
  onLoadDemo: () => void;
  onNewProject: () => void;
  loadingDemo: boolean;
}

export const Navbar: React.FC<Props> = ({
  project,
  onOpenAudit,
  onLoadDemo,
  onNewProject,
  loadingDemo,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            {/* Baton diagonal stripes symbol from pitch deck */}
            <div className="w-6 h-6 relative flex flex-col justify-center items-center gap-1.5 rotate-[-35deg]">
              <span className="w-6 h-1.5 rounded-full bg-amber-400 block shadow-sm shadow-amber-500/50"></span>
              <span className="w-5 h-1.5 rounded-full bg-teal-400 block shadow-sm shadow-teal-500/50 ml-1"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white font-sans">Baton</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Evidence Handover
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Knowledge that outlasts the person who held it</p>
          </div>
        </div>

        {/* Project Context & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {project && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-white truncate max-w-[180px]">{project.name}</span>
              <span className="text-slate-400 font-mono">v{project.active_version}</span>
            </div>
          )}

          <button
            onClick={onLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Demo:</span> Events App
          </button>

          {project && (
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition"
              title="View Tamper-Evident Audit Trail"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Audit Trail</span>
            </button>
          )}

          <button
            onClick={onNewProject}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">New Handover</span>
          </button>
        </div>
      </div>
    </header>
  );
};

