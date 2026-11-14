import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { defaultScheduleDate } from '../utils/dates';
import { SurgeryRequest, Priority, SurgeryStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  Wrench,
  XCircle,
  CheckCircle2
} from 'lucide-react';

export const SurgeryRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<SurgeryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SurgeryRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'OR_MANAGER', 'SCHEDULER']);

  // Create Form fields
  const [surgeryCode, setSurgeryCode] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [priority, setPriority] = useState<Priority>('ELECTIVE');
  const [estimatedDuration, setEstimatedDuration] = useState(90);
  const [prepDuration, setPrepDuration] = useState(20);
  const [cleanupDuration, setCleanupDuration] = useState(15);
  const [earliestTime, setEarliestTime] = useState(defaultScheduleDate() + 'T08:00');
  const [deadlineTime, setDeadlineTime] = useState(defaultScheduleDate() + 'T18:00');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page: 0, size: 50 };
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.surgery.getAll(params);
      setRequests(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load surgery requests', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [priorityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const openCreateModal = () => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    setSurgeryCode(`SURG-${codeNum}`);
    setProcedureName('');
    setPatientId(`PT-${Math.floor(10000 + Math.random() * 90000)}`);
    setPriority('ELECTIVE');
    setEstimatedDuration(90);
    setPrepDuration(20);
    setCleanupDuration(15);
    setEarliestTime(defaultScheduleDate() + 'T08:00');
    setDeadlineTime(defaultScheduleDate() + 'T18:00');
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.surgery.create({
        surgeryCode,
        procedureName,
        priority,
        estimatedDurationMinutes: Number(estimatedDuration),
        preparationTimeMinutes: Number(prepDuration),
        cleaningTimeMinutes: Number(cleanupDuration),
        earliestStart: `${earliestTime}:00`,
        schedulingDeadline: `${deadlineTime}:00`,
        notes: patientId ? `Patient: ${patientId}` : undefined,
        requiredStaff: [
          { staffRole: 'SURGEON', mandatory: true },
          { staffRole: 'ANESTHETIST', mandatory: true },
          { staffRole: 'NURSE', mandatory: true },
        ],
      });
      success('Surgery Request Created', `${surgeryCode} filed for scheduling pipeline.`);
      setIsCreateModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this surgery request?')) return;
    try {
      await api.surgery.cancel(id);
      success('Request Cancelled', 'Surgery case status updated to CANCELLED.');
      fetchRequests();
    } catch (err: any) {
      error('Cancellation Failed', err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Surgical Intake Pipeline..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Surgery Intake & Case Triage
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-operative case registration with estimated durations, buffers, and time window constraints.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Surgery Request
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 px-2 text-[10px]">PRIORITY:</span>
            {['ALL', 'EMERGENCY', 'URGENT', 'ELECTIVE'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                  priorityFilter === p
                    ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 px-2 text-[10px]">STATUS:</span>
            {['ALL', 'REQUESTED', 'SCHEDULED', 'DEFERRED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                  statusFilter === s
                    ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or procedure..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {requests.length === 0 ? (
          <EmptyState
            title="No Surgery Requests Matching Criteria"
            description="Adjust your search criteria or create a new surgical request to feed the deterministic scheduling engine."
            action={{
              label: 'Create Request',
              onClick: openCreateModal,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Case Code</th>
                  <th className="py-3 px-4">Procedure & Patient</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Duration & Buffers</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {r.surgeryCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-slate-200">
                        {r.procedureName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Patient ID: {r.notes?.replace('Patient: ', '') || 'PT-SYNTH'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-semibold text-slate-100">{r.estimatedDurationMinutes}m</span>
                        <span className="text-slate-400 text-[11px]">
                          (+{r.preparationTimeMinutes}m / +{r.cleaningTimeMinutes}m)
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <div>
                        Earliest: {r.earliestStart ? new Date(r.earliestStart).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'}
                      </div>
                      <div>
                        Deadline: {r.schedulingDeadline ? new Date(r.schedulingDeadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canManage && ['REQUESTED', 'DEFERRED', 'SCHEDULED'].includes(r.status) && (
                        <button
                          onClick={() => handleCancelRequest(r.id)}
                          className="px-2.5 py-1 text-[11px] font-sans font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Surgery Request"
        subtitle="Submit a surgical case into the deterministic scheduling pool."
        maxWidth="xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Case Code</label>
              <input
                type="text"
                required
                value={surgeryCode}
                onChange={(e) => setSurgeryCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Patient Identifier</label>
              <input
                type="text"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Procedure Description</label>
            <input
              type="text"
              required
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="e.g. Laparoscopic Cholecystectomy"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Triage Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="EMERGENCY">EMERGENCY (Immediate)</option>
                <option value="URGENT">URGENT (24-48h)</option>
                <option value="ELECTIVE">ELECTIVE (Scheduled)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Surgery Duration (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                required
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Turnover Buffer (min)</label>
              <input
                type="number"
                min="10"
                step="5"
                required
                value={cleanupDuration}
                onChange={(e) => setCleanupDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Earliest Eligible Time</label>
              <input
                type="datetime-local"
                required
                value={earliestTime}
                onChange={(e) => setEarliestTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Deadline</label>
              <input
                type="datetime-local"
                required
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Submit to Engine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
