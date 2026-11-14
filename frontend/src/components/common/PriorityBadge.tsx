import React from 'react';
import { Priority } from '../../types';
import { AlertCircle, Clock, Zap } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority | string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  const p = (priority || '').toUpperCase();

  if (p === 'EMERGENCY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse font-mono tracking-wide">
        {showIcon && <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
        EMERGENCY
      </span>
    );
  }

  if (p === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono tracking-wide">
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        URGENT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono tracking-wide">
      {showIcon && <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
      ELECTIVE
    </span>
  );
};
