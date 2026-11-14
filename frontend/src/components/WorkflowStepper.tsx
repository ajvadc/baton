import React from 'react';
import { Database, Cpu, HelpCircle, ShieldCheck, Send, Check } from 'lucide-react';

export type StepKey = 'connect' | 'reconstruct' | 'questions' | 'review' | 'handover';

interface Step {
  key: StepKey;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    key: 'connect',
    number: '01',
    title: 'Connect',
    subtitle: 'Docs, Git, Tasks & Chat',
    icon: Database,
  },
  {
    key: 'reconstruct',
    number: '02',
    title: 'Reconstruct',
    subtitle: 'Claims & Citations',
    icon: Cpu,
  },
  {
    key: 'questions',
    number: '03',
    title: 'Leaver Q&A',
    subtitle: 'Gaps & Conflict Fixes',
    icon: HelpCircle,
  },
  {
    key: 'review',
    number: '04',
    title: 'Review Gate',
    subtitle: 'Human Verification',
    icon: ShieldCheck,
  },
  {
    key: 'handover',
    number: '05',
    title: 'Handover & Receipt',
    subtitle: 'Role Views & Sign-off',
    icon: Send,
  },
];

interface Props {
  currentStep: StepKey;
  onSelectStep: (step: StepKey) => void;
  unansweredQuestionsCount?: number;
  isApproved?: boolean;
}

export const WorkflowStepper: React.FC<Props> = ({
  currentStep,
  onSelectStep,
  unansweredQuestionsCount = 0,
  isApproved = false,
}) => {
  return (
    <div className="w-full bg-slate-950/60 border-b border-slate-800/80 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Progress">
          <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {STEPS.map((step) => {
              const isActive = currentStep === step.key;
              const Icon = step.icon;

              return (
                <li key={step.key}>
                  <button
                    onClick={() => onSelectStep(step.key)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-slate-900 border-teal-500/50 shadow-md shadow-teal-500/10'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">{step.number}</span>
                        <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {step.title}
                        </span>
                        {step.key === 'questions' && unansweredQuestionsCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-rose-500/20 text-rose-400 rounded-full font-bold">
                            {unansweredQuestionsCount}
                          </span>
                        )}
                        {step.key === 'review' && isApproved && (
                          <span className="p-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate hidden md:block">{step.subtitle}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
