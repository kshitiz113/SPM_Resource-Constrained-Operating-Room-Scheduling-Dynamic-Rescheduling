import React from 'react';
import { SurgeryStatus, ScheduleStatus } from '../../types';

interface StatusBadgeProps {
  status: SurgeryStatus | ScheduleStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const label = status ? String(status) : 'UNKNOWN';
  const getStyle = (s: string) => {
    switch (s.toUpperCase()) {
      // Surgery Statuses
      case 'REQUESTED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'SCHEDULED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DEFERRED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';

      // Schedule Statuses
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      case 'PROPOSED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'APPROVED':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'PUBLISHED':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10';
      case 'SUPERSEDED':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-600/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      // General / Room / Equipment
      case 'ACTIVE':
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MAINTENANCE':
      case 'CLOSED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'IN_USE':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'DECOMMISSIONED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border tracking-wide uppercase font-mono ${pad} ${getStyle(
        label
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label.replace(/_/g, ' ')}
    </span>
  );
};
