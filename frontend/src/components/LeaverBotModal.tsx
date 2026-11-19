'use client';

import React, { useState } from 'react';
import { Project, LeaverQuestion } from '@/lib/types';
import { api } from '@/lib/api';
import {
  MessageSquare,
  Bot,
  Send,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  Hash,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  project: Project;
  questions: LeaverQuestion[];
  isOpen: boolean;
  onClose: () => void;
  onQuestionsUpdated: () => void;
}

export const LeaverBotModal: React.FC<Props> = ({
  project,
  questions,
  isOpen,
  onClose,
  onQuestionsUpdated,
}) => {
  const [platform, setPlatform] = useState<'slack' | 'discord'>('slack');
  const [channel, setChannel] = useState('#leaver-handover-alex');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [answeredToast, setAnsweredToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const unansweredQuestions = questions.filter((q) => !q.is_answered);

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      await api.dispatchLeaverBot(project.id, {
        channel_name: channel,
        platform,
      });
      setDispatchedSuccess(true);
    } catch (err) {
      console.error('Error dispatching bot questions:', err);
    } finally {
      setDispatching(false);
    }
  };

  const handleSimulateReply = async (q: LeaverQuestion) => {
    setReplyingId(q.id);
    setAnsweredToast(null);
    try {
      let automatedAnswer = '';
      if (q.question_text.includes('SQLite') || q.question_text.includes('Postgres')) {
        automatedAnswer = 'SQLite is used ONLY for offline unit testing without Docker. Production and Staging strictly use PostgreSQL with pgvector. Downgrade scripts are included in PR #42.';
      } else if (q.question_text.includes('rollback') || q.question_text.includes('migration')) {
        automatedAnswer = 'Alembic revision 3a98c_stripe downgrade() script has been committed to feature/webhook-retry branch. It safely drops the stripe_charge_id index and column.';
      } else {
        automatedAnswer = 'Clarified with the infrastructure team: environment variables are stored in AWS Secrets Manager under /production/events-app/.';
      }

      await api.simulateBotReply(project.id, {
        question_id: q.id,
        answer: automatedAnswer,
        answered_by: `${project.leaving_member} (via Slack)`,
        channel,
      });

      setAnsweredToast(`Answer received from ${project.leaving_member} via ${channel}! Linked claim verified.`);
      onQuestionsUpdated();
    } catch (err) {
      console.error('Error simulating bot reply:', err);
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Automated Slack / Discord Leaver Q&A Bot</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Improvement 2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispatch gap questions to the outgoing lead’s chat and capture replies with zero friction
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Dispatch Setup */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
                <button
                  onClick={() => setPlatform('slack')}
                  className={`px-3 py-1 rounded-md transition ${
                    platform === 'slack' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slack
                </button>
                <button
                  onClick={() => setPlatform('discord')}
                  className={`px-3 py-1 rounded-md transition ${
                    platform === 'discord' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Discord
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none w-44"
                />
              </div>
            </div>

            <button
              onClick={handleDispatch}
              disabled={dispatching}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {dispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Webhook...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch to {platform === 'slack' ? 'Slack' : 'Discord'}</span>
                </>
              )}
            </button>
          </div>

          {answeredToast && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{answeredToast}</span>
            </div>
          )}

          {/* Interactive Chat Channel Simulator */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner font-sans">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-white font-bold">{channel}</span>
                <span className="text-[11px] text-slate-400">| Baton Bot Active Webhook</span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-teal-400">Live Simulation</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Bot Post */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow">
                  B
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">Baton Handover Bot</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                      APP
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 space-y-3">
                    <p>
                      👋 Hi <strong className="text-amber-400">{project.leaving_member}</strong>! Baton
                      analyzed project activity and detected <strong>{unansweredQuestions.length} knowledge gaps</strong>{' '}
                      before your transition. Please review and answer below so{' '}
                      <strong className="text-teal-400">{project.incoming_member}</strong> has a complete handover:
                    </p>

                    {/* Question items */}
                    <div className="space-y-3 pt-2">
                      {questions.map((q) => (
                        <div
                          key={q.id}
                          className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-white text-xs">
                              {q.question_text}
                            </span>
                            {q.is_answered ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                Answered
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSimulateReply(q)}
                                disabled={replyingId === q.id}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 text-[11px] font-bold transition shadow shrink-0 disabled:opacity-50"
                              >
                                {replyingId === q.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Posting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3" />
                                    <span>Reply as Alex in Slack</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {q.is_answered && q.leaver_answer && (
                            <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed">
                              <span className="font-bold text-white block mb-0.5">
                                {project.leaving_member} replied:
                              </span>
                              {q.leaver_answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
          <span>Replies immediately update claims and are cryptographically logged in the audit trail</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

