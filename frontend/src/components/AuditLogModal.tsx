import React, { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';
import { api } from '@/lib/api';
import { X, ShieldCheck, Clock, User, Activity } from 'lucide-react';

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<Props> = ({ projectId, isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      api
        .getAuditLogs(projectId)
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Tamper-Evident Audit Trail</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No audit events recorded yet.</div>
          ) : (
            logs.map((log) => {
              let parsedDetails = null;
              try {
                if (log.details) parsedDetails = JSON.parse(log.details);
              } catch {}

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 uppercase tracking-wide">
                      {formatAction(log.action)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong className="text-white">{log.actor_name}</strong>{' '}
                      <span className="text-slate-400">({log.actor_role})</span>
                    </span>
                  </div>

                  {parsedDetails && (
                    <div className="mt-1 p-2 bg-slate-900/90 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(parsedDetails, null, 2)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
