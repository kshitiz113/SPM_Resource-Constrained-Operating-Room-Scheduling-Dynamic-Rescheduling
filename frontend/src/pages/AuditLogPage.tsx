import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { AuditLogItem } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import {
  ShieldCheck,
  Search,
  Calendar,
  Clock,
  User,
  Activity,
  FileText
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { error } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.audit.getAll({ page: 0, size: 50 });
      setLogs(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load audit logs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner label="Auditing Hospital Compliance Records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            Clinical Compliance & Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident system activity logging for schedule approvals, disruptions, and modifications.
          </p>
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, or entity..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No Matching Audit Records"
            description="No audit events matched your search term or no activity has been logged yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.performedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-semibold">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-slate-400 ml-1">#{log.entityId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.username || 'System'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                      {log.details || 'System operation executed.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
