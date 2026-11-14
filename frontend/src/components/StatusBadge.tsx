import React from 'react';
import { ClaimStatus } from '@/lib/types';
import { ShieldCheck, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  status: ClaimStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md', showIcon = true }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const config = {
    Verified: {
      label: 'Verified',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: ShieldCheck,
      description: 'Backed by authoritative source or multiple agreeing sources',
    },
    Inferred: {
      label: 'Inferred',
      badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: Sparkles,
      description: 'Drawn by AI model; requires human verification',
    },
    Conflicting: {
      label: 'Conflicting',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: AlertTriangle,
      description: 'Sources disagree; all versions shown, none chosen',
    },
    Missing: {
      label: 'Missing',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: HelpCircle,
      description: 'Expected information missing; flagged rather than invented',
    },
  }[status] || {
    label: status,
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Sparkles,
    description: '',
  };

  const IconComponent = config.icon;

  return (
    <span
      title={config.description}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.badgeClass} ${sizeClasses[size]}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};

