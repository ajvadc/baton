import React, { useState } from 'react';
import { LeaverQuestion, Project } from '@/lib/types';
import { api } from '@/lib/api';
import { HelpCircle, CheckCircle2, Clock, AlertTriangle, Send, User, ChevronRight } from 'lucide-react';

interface Props {
  project: Project;
  questions: LeaverQuestion[];
  onQuestionsUpdated: () => void;
  onProceedToReview: () => void;
}

export const QuestionsForLeaverTab: React.FC<Props> = ({
  project,
  questions,
  onQuestionsUpdated,
  onProceedToReview,
}) => {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const [activeAnswers, setActiveAnswers] = useState<{ [id: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const answeredCount = safeQuestions.filter((q) => q.is_answered).length;
  const totalCount = safeQuestions.length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const handleAnswerSubmit = async (questionId: string) => {
    const text = activeAnswers[questionId];
    if (!text || !text.trim()) return;

    setSubmittingId(questionId);
    try {
      await api.answerQuestion(questionId, text.trim());
      setActiveAnswers((prev) => ({ ...prev, [questionId]: '' }));
      onQuestionsUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              GAPS BECOME QUESTIONS
            </span>
            <h1 className="text-xl font-bold text-white">Questions for the Departing Lead</h1>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Missing facts or conflicting claims automatically turn into actionable questions for{' '}
            <strong className="text-white">{project.leaving_member}</strong> to answer before departure.
            Answering resolves the gap and updates the claim with first-party testimony.
          </p>
        </div>

        <button
          onClick={onProceedToReview}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <span>Proceed to Review Gate</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Resolution Progress Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
            {answeredCount}/{totalCount}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Knowledge Gap Resolution Progress</h4>
            <p className="text-[11px] text-slate-400">
              {totalCount - answeredCount === 0
                ? 'All leaver questions answered! Handover is complete.'
                : `${totalCount - answeredCount} critical gaps awaiting leaver response.`}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Progress: {progressPercent}%</span>
            <span>{totalCount - answeredCount} Open</span>
          </div>
        </div>
      </div>

      {/* Questions Feed */}
      <div className="space-y-4">
        {safeQuestions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-sm">
            No gaps or conflicting claims detected!
          </div>
        ) : (
          safeQuestions.map((q, idx) => (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition ${
                q.is_answered
                  ? 'bg-slate-900/40 border-slate-800/80'
                  : 'bg-slate-900/80 border-slate-700/80 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-bold">Q{idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full uppercase font-bold text-[10px] ${
                      q.context_type === 'conflict_resolution'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {q.context_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Priority: {q.urgency}
                  </span>
                </div>

                {q.is_answered ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved by Leaver
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 animate-spin" /> Awaiting Answer
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mb-3 leading-relaxed">
                {q.question_text}
              </h3>

              {q.is_answered ? (
                <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{project.leaving_member} stated:</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">
                      {q.answered_at ? new Date(q.answered_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{q.leaver_answer}</p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    placeholder={`Answer as ${project.leaving_member}... (e.g. "Rohan Patel holds the club treasury credit card; secret is in GSM secret-prod-key")`}
                    value={activeAnswers[q.id] || ''}
                    onChange={(e) =>
                      setActiveAnswers({ ...activeAnswers, [q.id]: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleAnswerSubmit(q.id)}
                      disabled={submittingId === q.id || !activeAnswers[q.id]?.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingId === q.id ? 'Submitting...' : 'Submit Leaver Answer'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

