import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { defaultScheduleDate } from '../utils/dates';
import { SurgeryRequest, ScheduleResponse } from '../types';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

export const ScheduleGeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { hasRole } = useAuth();

  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate());
  const [requests, setRequests] = useState<SurgeryRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ScheduleResponse | null>(null);

  // Soft objective weights
  const [waitingPenalty, setWaitingPenalty] = useState(1.0);
  const [idlePenalty, setIdlePenalty] = useState(1.0);
  const [overtimePenalty, setOvertimePenalty] = useState(1.0);
  const [deferralPenalty, setDeferralPenalty] = useState(3.0);
  const [utilWeight, setUtilWeight] = useState(1.0);

  useEffect(() => {
    const fetchIntake = async () => {
      setLoading(true);
      try {
        const res = await api.surgery.getAll({ status: 'REQUESTED' as any, page: 0, size: 50 });
        const list = res.data?.content || [];
        setRequests(list);
        // By default select all requested
        setSelectedIds(list.map((r) => r.id));
      } catch (err: any) {
        error('Failed to load pending requests', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntake();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const payload = {
        scheduleDate,
        surgeryRequestIds: selectedIds.length ? selectedIds : undefined,
        objectiveWeights: {
          waitingTimePenalty: Number(waitingPenalty),
          idleTimePenalty: Number(idlePenalty),
          overtimePenalty: Number(overtimePenalty),
          deferralPenalty: Number(deferralPenalty),
          utilizationWeight: Number(utilWeight),
        },
      };

      const res = await api.schedules.generate(payload);
      setResult(res.data);
      const label = res.data.scheduleVersion?.versionLabel || res.data.versionLabel;
      const score = (res.data.scheduleVersion?.totalScore ?? res.data.totalScore)?.toFixed(1) || '0.0';
      success(
        'Deterministic Schedule Generated',
        `Version ${label} generated with score ${score}`
      );
    } catch (err: any) {
      error(
        'Scheduling Generation Failed',
        err.response?.data?.message || 'Could not resolve feasible schedule'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Initializing Deterministic Scheduling Engine..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-teal-400" />
          Deterministic Constraint-Based Scheduling Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Strictly verifies HC-01 through HC-12 constraints. Configures soft objective penalty weights for candidate slot evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Objective Weights & Execution Controls */}
        <div className="space-y-6">
          {/* Target Date Picker */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" /> Target Surgical Date
            </h3>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs font-mono text-teal-300 focus:border-teal-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Evaluates staff shifts, room operating hours (07:00-19:00), and equipment availability for this day.
            </p>
          </div>

          {/* Soft Objective Weights Sliders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-teal-400" /> Objective Penalty Weights
              </h3>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                Configurable
              </span>
            </div>

            {/* Waiting Time Penalty */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Wait Time Penalty:</span>
                <span className="text-teal-400 font-bold">{waitingPenalty.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={waitingPenalty}
                onChange={(e) => setWaitingPenalty(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="text-[10px] text-slate-400 block">Minimizes request-to-incision gap</span>
            </div>

            {/* Idle Time Penalty */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Room Idle Penalty:</span>
                <span className="text-teal-400 font-bold">{idlePenalty.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={idlePenalty}
                onChange={(e) => setIdlePenalty(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="text-[10px] text-slate-400 block">Reduces idle gaps between procedures</span>
            </div>

            {/* Staff Overtime Penalty */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Staff Overtime Penalty:</span>
                <span className="text-teal-400 font-bold">{overtimePenalty.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={overtimePenalty}
                onChange={(e) => setOvertimePenalty(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="text-[10px] text-slate-400 block">Penalizes cases exceeding scheduled shifts</span>
            </div>

            {/* Deferral Penalty */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Deferral Penalty:</span>
                <span className="text-teal-400 font-bold">{deferralPenalty.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={deferralPenalty}
                onChange={(e) => setDeferralPenalty(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="text-[10px] text-slate-400 block">Heavily penalizes unscheduled urgent cases</span>
            </div>

            {/* Room Utilization Weight */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Utilization Multiplier:</span>
                <span className="text-teal-400 font-bold">{utilWeight.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={utilWeight}
                onChange={(e) => setUtilWeight(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="text-[10px] text-slate-400 block">Maximizes operating theater occupancy</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white py-3 text-xs font-bold tracking-wide shadow-xl shadow-teal-950/60 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                {generating ? 'Executing Optimization Engine...' : 'Run Deterministic Optimizer'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Surgery Request Candidates Selection or Result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidates Selection Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Intake Candidates for Optimization ({selectedIds.length} of {requests.length} selected)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The engine ranks requests by priority (Emergency &gt; Urgent &gt; Elective) and earliest eligible window.
                </p>
              </div>

              <button
                onClick={toggleSelectAll}
                className="text-xs font-mono text-teal-400 hover:text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg bg-teal-500/10"
              >
                {selectedIds.length === requests.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No REQUESTED cases pending. All surgeries are either already scheduled or completed.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {requests.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleSelect(r.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-800/80 border-teal-500/40'
                          : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 h-4 w-4 bg-slate-950"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">
                              {r.surgeryCode}
                            </span>
                            <span className="text-slate-400 font-sans">
                              {r.procedureName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            Duration: {r.estimatedDurationMinutes}m | Prep/Cleanup: {r.preparationTimeMinutes}m / {r.cleaningTimeMinutes}m
                          </span>
                        </div>
                      </div>

                      <PriorityBadge priority={r.priority} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result Inspection Card (if generated) */}
          {result && (
            <div className="rounded-2xl border border-teal-500/40 bg-slate-900/90 p-5 backdrop-blur-xl animate-in fade-in duration-300 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    Optimization Result: {result.scheduleVersion?.status || result.status || 'DRAFT'}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-1 font-mono">
                    {result.scheduleVersion?.versionLabel || result.versionLabel}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {result.scheduleVersion?.generationNotes || result.generationNotes || 'Feasible schedule resolved without hard constraint violations.'}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">TOTAL PENALTY SCORE</span>
                  <span className="text-xl font-bold text-teal-300">
                    {(result.scheduleVersion?.totalScore ?? result.totalScore)?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>

              {/* Metrics preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">SCHEDULED</span>
                  <span className="font-bold text-slate-200">
                    {result.metrics?.scheduledCount ?? result.scheduleVersion?.entries?.length ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">UNSCHEDULED</span>
                  <span className="font-bold text-rose-400">
                    {result.metrics?.unscheduledCount ?? result.unscheduledCases?.length ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">UTILIZATION</span>
                  <span className="font-bold text-teal-300">
                    {`${Math.round((result.metrics?.overallUtilization || 0) * 100)}%`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">AVG WAIT</span>
                  <span className="font-bold text-slate-200">
                    {`${(result.metrics?.avgWaitingHours || 0).toFixed(1)}h`}
                  </span>
                </div>
              </div>

              {/* Forward Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono">
                  Status: <StatusBadge status={result.scheduleVersion?.status || result.status || 'DRAFT'} size="sm" />
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/schedule/gantt')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    Inspect Gantt
                  </button>
                  {hasRole(['ADMIN', 'OR_MANAGER']) && (
                  <button
                    onClick={() => navigate('/schedule/approve')}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors"
                  >
                    Proceed to Approval
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
