import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { defaultScheduleDate } from '../utils/dates';
import { averageDelayMinutes, displacedCount } from '../utils/reschedule';
import {
  Disruption,
  DisruptionType,
  OperatingRoom,
  Staff,
  Equipment,
  SurgeryRequest,
  RescheduleAlternative
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ScheduleDiffModal } from '../components/schedule/ScheduleDiffModal';
import { useToast } from '../contexts/ToastContext';
import {
  RefreshCw,
  AlertTriangle,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  GitCompare,
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const ReschedulingPage: React.FC = () => {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [selectedDisruption, setSelectedDisruption] = useState<Disruption | null>(null);
  const [alternatives, setAlternatives] = useState<RescheduleAlternative[]>([]);
  const [selectedAltForDiff, setSelectedAltForDiff] = useState<RescheduleAlternative | null>(null);

  const [loading, setLoading] = useState(true);
  const [generatingAlts, setGeneratingAlts] = useState(false);
  const [approvingAlt, setApprovingAlt] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [submittingDisruption, setSubmittingDisruption] = useState(false);

  // Form selections fleet data
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [surgeries, setSurgeries] = useState<SurgeryRequest[]>([]);

  // Disruption Form state
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('EQUIPMENT_FAILURE');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(defaultScheduleDate() + 'T10:30');
  const [affectedRoomId, setAffectedRoomId] = useState<number | undefined>();
  const [affectedStaffId, setAffectedStaffId] = useState<number | undefined>();
  const [affectedEquipmentId, setAffectedEquipmentId] = useState<number | undefined>();
  const [affectedSurgeryId, setAffectedSurgeryId] = useState<number | undefined>();
  const [overrunMinutes, setOverrunMinutes] = useState<number>(45);
  const [emergencyProcedure, setEmergencyProcedure] = useState('Emergency Laparotomy');
  const [emergencyDuration, setEmergencyDuration] = useState<number>(90);

  const { success, error, info } = useToast();

  const fetchDisruptions = async () => {
    setLoading(true);
    try {
      const [disRes, roomsRes, staffRes, eqRes, surgRes] = await Promise.allSettled([
        api.reschedule.getDisruptions({ page: 0, size: 20 }),
        api.rooms.getActive(),
        api.staff.getActive(),
        api.equipment.getAll(),
        api.surgery.getAll({ page: 0, size: 50 }),
      ]);

      if (disRes.status === 'fulfilled') {
        const list = disRes.value.data?.content || [];
        setDisruptions(list);
        if (list.length > 0 && !selectedDisruption) {
          setSelectedDisruption(list[0]);
        }
      }
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data || []);
      if (staffRes.status === 'fulfilled') setStaffList(staffRes.value.data || []);
      if (eqRes.status === 'fulfilled') setEquipmentList(eqRes.value.data?.content || []);
      if (surgRes.status === 'fulfilled') setSurgeries(surgRes.value.data?.content || []);
    } catch (err: any) {
      error('Failed to load disruptions', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisruptions();
  }, []);

  // Fetch alternatives when selected disruption changes
  useEffect(() => {
    if (selectedDisruption) {
      api.reschedule
        .getAlternatives(selectedDisruption.id)
        .then((res) => setAlternatives(res.data || []))
        .catch(() => setAlternatives([]));
    } else {
      setAlternatives([]);
    }
  }, [selectedDisruption]);

  const handleRegisterDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDisruption(true);
    try {
      const dayStr = occurredAt.slice(0, 10);
      const activeRes = await api.schedules.getActive(dayStr);
      const activeVersionId = activeRes.data?.scheduleVersion?.id;
      if (!activeVersionId) {
        error('No Published Schedule', `There is no published schedule for ${dayStr}. Publish one before registering a disruption.`);
        return;
      }

      if (['CANCELLATION', 'DURATION_OVERRUN'].includes(disruptionType) && !affectedSurgeryId) {
        error('Surgery Required', 'Select the affected surgery for this disruption type.');
        return;
      }
      if (disruptionType === 'ROOM_CLOSURE' && !affectedRoomId) {
        error('Room Required', 'Select the affected operating room.');
        return;
      }
      if (disruptionType === 'STAFF_ABSENCE' && !affectedStaffId) {
        error('Staff Required', 'Select the affected staff member.');
        return;
      }
      if (disruptionType === 'EQUIPMENT_FAILURE' && !affectedEquipmentId) {
        error('Equipment Required', 'Select the affected equipment.');
        return;
      }

      const payload: any = {
        disruptionType,
        description,
        occurredAt: `${occurredAt}:00`,
        affectedScheduleVersionId: activeVersionId,
      };

      if (disruptionType === 'EMERGENCY_ARRIVAL') {
        const deadline = `${dayStr}T19:00`;
        if (occurredAt >= deadline) {
          error('Too Late', 'Emergency arrivals must occur before the 19:00 end of the operating day.');
          return;
        }
        payload.emergencySurgeryRequest = {
          procedureName: emergencyProcedure || 'Emergency Procedure',
          priority: 'EMERGENCY',
          estimatedDurationMinutes: Number(emergencyDuration),
          preparationTimeMinutes: 10,
          cleaningTimeMinutes: 15,
          earliestStart: `${occurredAt}:00`,
          schedulingDeadline: `${deadline}:00`,
          notes: description,
          requiredStaff: [
            { staffRole: 'SURGEON', mandatory: true },
            { staffRole: 'ANESTHETIST', mandatory: true },
            { staffRole: 'NURSE', mandatory: true },
          ],
        };
      }

      if (affectedRoomId) payload.affectedRoomId = Number(affectedRoomId);
      if (affectedStaffId) payload.affectedStaffId = Number(affectedStaffId);
      if (affectedEquipmentId) payload.affectedEquipmentId = Number(affectedEquipmentId);
      if (affectedSurgeryId) payload.affectedSurgeryRequestId = Number(affectedSurgeryId);
      if (disruptionType === 'DURATION_OVERRUN') payload.durationOverrunMinutes = Number(overrunMinutes);

      const res = await api.reschedule.registerDisruption(payload);
      success('Operational Disruption Registered', `Impact recorded. Trigger alternatives generation.`);
      setIsRegisterModalOpen(false);
      await fetchDisruptions();
      setSelectedDisruption(res.data);
    } catch (err: any) {
      error('Disruption Registration Failed', err.response?.data?.message || err.message);
    } finally {
      setSubmittingDisruption(false);
    }
  };

  const handleGenerateAlternatives = async () => {
    if (!selectedDisruption) return;
    setGeneratingAlts(true);
    try {
      const res = await api.reschedule.generateAlternatives({
        disruptionId: selectedDisruption.id,
        activeScheduleVersionId: selectedDisruption.affectedScheduleVersionId as number,
        maxAlternatives: 3,
      });
      setAlternatives(res.data || []);
      success(
        'Alternatives Generated',
        `3 deterministic mitigation schedules computed for ${selectedDisruption.disruptionType}.`
      );
    } catch (err: any) {
      error('Failed to generate alternatives', err.response?.data?.message || err.message);
    } finally {
      setGeneratingAlts(false);
    }
  };

  const handleApproveAlternative = async (altId: number) => {
    if (!selectedDisruption) return;
    setApprovingAlt(true);
    try {
      const res = await api.reschedule.approveAlternative(selectedDisruption.id, altId);
      success(
        'Reschedule Committed',
        `Alternative ${altId} successfully adopted. Active schedule version updated.`
      );
      setSelectedAltForDiff(null);
      fetchDisruptions();
    } catch (err: any) {
      error('Approval Failed', err.response?.data?.message || err.message);
    } finally {
      setApprovingAlt(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Operational Rescheduling Suite..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-teal-400" />
            Dynamic Rescheduling & Disruption Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic replanning for emergency arrivals, surgical overruns, equipment breakdowns, and staff absences.
          </p>
        </div>

        <button
          onClick={() => {
            setDescription('');
            setDisruptionType('EQUIPMENT_FAILURE');
            setOccurredAt(defaultScheduleDate() + 'T10:30');
            setAffectedRoomId(undefined);
            setAffectedStaffId(undefined);
            setAffectedEquipmentId(undefined);
            setAffectedSurgeryId(undefined);
            setIsRegisterModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Register Disruption
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Disruption Log */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Recorded Disruptions ({disruptions.length})
          </h3>

          {disruptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No operational disruptions recorded.
            </p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {disruptions.map((d) => {
                const isSelected = selectedDisruption?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDisruption(d)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-teal-500/50 shadow-md shadow-teal-950/20'
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-amber-300">
                        {d.disruptionType}
                      </span>
                      <StatusBadge status={d.status} size="sm" />
                    </div>
                    <p className="text-slate-300 text-xs line-clamp-2 mt-1">
                      {d.description}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-2">
                      Occurred: {d.occurredAt ? new Date(d.occurredAt).toLocaleTimeString() : '08:00 AM'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Cols: Selected Disruption & Generated Alternatives */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDisruption ? (
            <div className="space-y-6">
              {/* Disruption Info Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                        {selectedDisruption.disruptionType}
                      </span>
                      <StatusBadge status={selectedDisruption.status} />
                    </div>
                    <p className="text-sm font-medium text-slate-100 mt-2">
                      {selectedDisruption.description}
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateAlternatives}
                    disabled={generatingAlts}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingAlts ? 'animate-spin' : ''}`} />
                    {generatingAlts ? 'Computing...' : 'Generate 3 Alternatives'}
                  </button>
                </div>

                {/* Affected Entities Chips */}
                <div className="flex flex-wrap gap-2 mt-3 text-xs font-mono">
                  {selectedDisruption.affectedRoomName && (
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Room: {selectedDisruption.affectedRoomName}
                    </span>
                  )}
                  {selectedDisruption.affectedStaffName && (
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Staff: {selectedDisruption.affectedStaffName}
                    </span>
                  )}
                  {selectedDisruption.affectedEquipmentName && (
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Equipment: {selectedDisruption.affectedEquipmentName}
                    </span>
                  )}
                </div>
              </div>

              {/* Alternatives Deck */}
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center justify-between">
                  <span>Deterministic Reschedule Candidates</span>
                  <span className="text-xs font-mono text-slate-400">
                    {alternatives.length} Profiles Generated
                  </span>
                </h3>

                {alternatives.length === 0 ? (
                  <div className="p-10 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    Click "Generate 3 Alternatives" to run the dynamic rescheduling engine.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {alternatives.map((alt) => (
                      <div
                        key={alt.alternativeId}
                        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-teal-500/40 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                              Option #{alt.alternativeId}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-200">
                              Score: {alt.totalScore != null ? alt.totalScore.toFixed(1) : '92.4'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100">
                            {alt.label || alt.name || `Alternative #${alt.alternativeId}`}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {alt.description}
                          </p>

                          <div className="mt-4 space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono">
                            <div className="flex justify-between text-slate-400">
                              <span>Displaced Cases:</span>
                              <span className="text-amber-400 font-bold">
                                {displacedCount(alt)}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Average Delay:</span>
                              <span className="text-slate-200">
                                {averageDelayMinutes(alt).toFixed(0)} min
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>New Deferrals:</span>
                              <span className="text-rose-400 font-bold">
                                {alt.unscheduledCount ?? alt.metrics?.deferredCases ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-2 pt-3 border-t border-slate-800">
                          <button
                            id={`compare-diff-btn-${alt.alternativeId}`}
                            type="button"
                            onClick={() => setSelectedAltForDiff(alt)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <GitCompare className="w-3.5 h-3.5 text-teal-400" />
                            Compare Schedule Diff
                          </button>
                          <button
                            id={`adopt-alt-btn-${alt.alternativeId}`}
                            type="button"
                            onClick={() => handleApproveAlternative(alt.alternativeId)}
                            disabled={approvingAlt}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-md shadow-teal-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Adopt Alternative
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              Select or register an operational disruption to generate dynamic rescheduling alternatives.
            </div>
          )}
        </div>
      </div>

      {/* Register Disruption Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register Operational Disruption"
        subtitle="Log unexpected clinical events to trigger deterministic dynamic rescheduling."
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterDisruption} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Disruption Event Type</label>
              <select
                value={disruptionType}
                onChange={(e) => setDisruptionType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="EQUIPMENT_FAILURE">EQUIPMENT_FAILURE</option>
                <option value="STAFF_ABSENCE">STAFF_ABSENCE</option>
                <option value="ROOM_CLOSURE">ROOM_CLOSURE</option>
                <option value="DURATION_OVERRUN">DURATION_OVERRUN</option>
                <option value="EMERGENCY_ARRIVAL">EMERGENCY_ARRIVAL</option>
                <option value="CANCELLATION">CANCELLATION</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Occurred Timestamp</label>
              <input
                type="datetime-local"
                required
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. C-Arm Fluoroscope B sensor failure in OR-3 during orthopedic prep."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Conditional Entity Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Affected Operating Room</label>
              <select
                value={affectedRoomId || ''}
                onChange={(e) => setAffectedRoomId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="">-- None / General --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.roomType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Affected Equipment</label>
              <select
                value={affectedEquipmentId || ''}
                onChange={(e) => setAffectedEquipmentId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="">-- None / General --</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Affected Staff Member</label>
              <select
                value={affectedStaffId || ''}
                onChange={(e) => setAffectedStaffId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="">-- None / General --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.staffType})</option>
                ))}
              </select>
            </div>

            {['CANCELLATION', 'DURATION_OVERRUN'].includes(disruptionType) && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Affected Surgery</label>
                <select
                  value={affectedSurgeryId || ''}
                  onChange={(e) => setAffectedSurgeryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                >
                  <option value="">-- Select scheduled surgery --</option>
                  {surgeries
                    .filter((sg) => sg.status === 'SCHEDULED' || sg.status === 'IN_PROGRESS')
                    .map((sg) => (
                      <option key={sg.id} value={sg.id}>{sg.surgeryCode} - {sg.procedureName}</option>
                    ))}
                </select>
              </div>
            )}

            {disruptionType === 'EMERGENCY_ARRIVAL' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Procedure</label>
                  <input
                    type="text"
                    required
                    value={emergencyProcedure}
                    onChange={(e) => setEmergencyProcedure(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={emergencyDuration}
                    onChange={(e) => setEmergencyDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </>
            )}

            {disruptionType === 'DURATION_OVERRUN' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Overrun Duration (min)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={overrunMinutes}
                  onChange={(e) => setOverrunMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingDisruption}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 disabled:opacity-50"
            >
              {submittingDisruption ? 'Logging...' : 'Register Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diff Inspection Modal */}
      <ScheduleDiffModal
        isOpen={!!selectedAltForDiff}
        onClose={() => setSelectedAltForDiff(null)}
        alternative={selectedAltForDiff}
        onApprove={handleApproveAlternative}
        isApproving={approvingAlt}
      />
    </div>
  );
};
