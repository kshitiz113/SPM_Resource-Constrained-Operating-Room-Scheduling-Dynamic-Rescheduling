import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { ScheduleVersion, ValidationResult, ScheduleResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Send,
  Calendar,
  Layers,
  FileCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const ScheduleApprovalPage: React.FC = () => {
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ScheduleVersion | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { success, error, info } = useToast();

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await api.schedules.getAll({ page: 0, size: 100, sort: 'id,desc' } as any);
      const list = [...(res.data?.content || [])].sort((a, b) => b.id - a.id);
      setVersions(list);
      setSelectedVersion((prev) => {
        if (prev) {
          return list.find((v) => v.id === prev.id) || list[0] || null;
        }
        return list[0] || null;
      });
    } catch (err: any) {
      error('Failed to load schedule versions', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleValidate = async () => {
    if (!selectedVersion) return;
    setValidating(true);
    try {
      const res = await api.schedules.validate(selectedVersion.id);
      setValidationResult(res.data);
      if (res.data.valid) {
        success('Validation Passed', 'All hard constraints (HC-01 to HC-12) strictly satisfied.');
      } else {
        error('Validation Issues Found', `${res.data.hardViolations?.length || 0} constraint violations.`);
      }
    } catch (err: any) {
      error('Validation Failed', err.response?.data?.message || err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedVersion) return;
    setProcessing(true);
    try {
      const res = await api.schedules.approve(selectedVersion.id);
      success('Schedule Approved', `${selectedVersion.versionLabel} approved by OR Management.`);
      fetchVersions();
    } catch (err: any) {
      error('Approval Failed', err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedVersion) return;
    setProcessing(true);
    try {
      const res = await api.schedules.publish(selectedVersion.id);
      success('Schedule Published', `${selectedVersion.versionLabel} is now the LIVE active schedule.`);
      fetchVersions();
    } catch (err: any) {
      error('Publication Failed', err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersion) return;
    setProcessing(true);
    try {
      await api.schedules.reject(selectedVersion.id, rejectReason);
      success('Schedule Rejected', `${selectedVersion.versionLabel} set to REJECTED.`);
      setRejectModalOpen(false);
      setRejectReason('');
      fetchVersions();
    } catch (err: any) {
      error('Rejection Failed', err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Schedule Version Governance..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-teal-400" />
          Schedule Version Governance & Approvals
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Constraint audit, clinical verification, and official publication of operating room schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Version History List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5 font-mono">
            <Calendar className="w-4 h-4 text-teal-400" /> Schedule Versions ({versions.length})
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => {
                    setSelectedVersion(ver);
                    setValidationResult(null);
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-teal-500/50 shadow-md shadow-teal-950/20'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-slate-100">
                      {ver.versionLabel}
                    </span>
                    <StatusBadge status={ver.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Date: {ver.scheduleDate}</span>
                    <span>Score: {ver.totalScore ? ver.totalScore.toFixed(1) : 'N/A'}</span>
                  </div>
                  {ver.generationNotes && (
                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-1 italic">
                      {ver.generationNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 cols): Selected Version Inspector & Verification Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVersion ? (
            <div className="space-y-6">
              {/* Version Detail Banner */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold font-mono text-slate-100">
                        {selectedVersion.versionLabel}
                      </h2>
                      <StatusBadge status={selectedVersion.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Target Surgical Date: <span className="text-teal-300 font-semibold">{selectedVersion.scheduleDate}</span> | Version #{selectedVersion.versionNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleValidate}
                      disabled={validating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
                      {validating ? 'Auditing...' : 'Validate Constraints'}
                    </button>
                  </div>
                </div>

                {/* Score & Notes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TOTAL PENALTY SCORE</span>
                    <span className="text-base font-bold text-teal-300">
                      {selectedVersion.totalScore ? selectedVersion.totalScore.toFixed(1) : '0.0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CREATED AT</span>
                    <span className="text-slate-300">
                      {new Date(selectedVersion.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">APPROVAL STATE</span>
                    <span className="text-slate-300">
                      {selectedVersion.status}
                    </span>
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {(selectedVersion.status === 'DRAFT' || selectedVersion.status === 'PROPOSED') && (
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Schedule
                      </button>
                    )}

                    {(selectedVersion.status === 'APPROVED' || selectedVersion.status === 'PROPOSED') && (
                      <button
                        onClick={handlePublish}
                        disabled={processing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Publish Schedule Live
                      </button>
                    )}

                    {['DRAFT', 'PROPOSED', 'APPROVED'].includes(selectedVersion.status) && (
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        disabled={processing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedVersion.status === 'PUBLISHED'
                      ? '✓ Actively published for surgical theater operations'
                      : selectedVersion.status === 'SUPERSEDED'
                      ? 'Superseded by a newer published version'
                      : selectedVersion.status === 'REJECTED'
                      ? 'Rejected - no further action available'
                      : 'Pending final sign-off'}
                  </span>
                </div>
              </div>

              {/* Automated Constraint Validation Audit Box */}
              {validationResult && (
                <div
                  className={`rounded-2xl border p-5 backdrop-blur-xl animate-in fade-in duration-200 ${
                    validationResult.valid
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-rose-500/30 bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    <h3 className="text-sm font-semibold text-slate-100">
                      {validationResult.valid
                        ? 'Hard Constraint Audit: 100% Compliant'
                        : `Hard Constraint Violations Detected (${validationResult.hardViolations?.length || 0})`}
                    </h3>
                  </div>

                  {validationResult.hardViolations?.length ? (
                    <div className="space-y-2 mt-2">
                      {validationResult.hardViolations.map((v, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-rose-500/20 text-xs text-rose-300 font-mono"
                        >
                          <span className="font-bold text-rose-400 mr-2">[{v.constraintId}]</span>
                          <span>{v.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>✓ HC-01: Room overlap check</div>
                      <div>✓ HC-02: Staff conflict check</div>
                      <div>✓ HC-03: Equipment check</div>
                      <div>✓ HC-07: Staff on shift check</div>
                      <div>✓ HC-08: Operating hours check</div>
                      <div>✓ HC-09: Qualifications check</div>
                      <div>✓ HC-10: Locked entries check</div>
                      <div>✓ HC-11: Maintenance check</div>
                    </div>
                  )}

                  {validationResult.softObjectiveBreakdown && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                        Soft Objective Penalties Breakdown:
                      </span>
                      <div className="flex flex-wrap gap-3 text-xs font-mono">
                        {Object.entries(validationResult.softObjectiveBreakdown).map(([k, val]) => (
                          <span
                            key={k}
                            className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {k}: <span className="text-teal-400 font-bold">{Number(val).toFixed(1)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              Select a schedule version from the list to audit constraints and approve.
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Schedule Version"
        subtitle="Document the clinical or operational reason for rejecting this schedule candidate."
        maxWidth="md"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rejection Reason & Directives
            </label>
            <textarea
              rows={4}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Excessive turnover delay in OR-2 between neuro cases; re-run with 2.0x idle penalty."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 disabled:opacity-50"
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
