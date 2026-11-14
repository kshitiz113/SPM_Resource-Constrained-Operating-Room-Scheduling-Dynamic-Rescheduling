import React, { useState, useEffect } from 'react';
import { DisruptionType, OperatingRoom, Staff, Equipment, SurgeryRequest } from '../types';
import { api } from '../api/endpoints';
import {
  AlertTriangle,
  X,
  Clock,
  User,
  Wrench,
  DoorClosed,
  Siren,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface DisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisruptionRegistered: (disruptionId: number) => void;
}

export const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  onClose,
  onDisruptionRegistered,
}) => {
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('EMERGENCY_ARRIVAL');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [surgeryList, setSurgeryList] = useState<SurgeryRequest[]>([]);

  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | undefined>();
  const [selectedSurgeryId, setSelectedSurgeryId] = useState<number | undefined>();
  const [overrunMinutes, setOverrunMinutes] = useState<number>(45);

  // Emergency fields
  const [emergencyProcedure, setEmergencyProcedure] = useState('Emergency Exploratory Laparotomy');
  const [emergencyDuration, setEmergencyDuration] = useState(120);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadResources();
    }
  }, [isOpen]);

  const loadResources = async () => {
    try {
      const [rRes, sRes, eRes, surgRes] = await Promise.all([
        api.rooms.getActive(),
        api.staff.getActive(),
        api.equipment.getAvailable(),
        api.surgery.getAll({ status: 'SCHEDULED' }),
      ]);
      setRooms(rRes.data || []);
      setStaffList(sRes.data || []);
      setEquipmentList(eRes.data || []);
      setSurgeryList(surgRes.data?.content || []);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        disruptionType,
        description: description || `Operational disruption: ${disruptionType}`,
        occurredAt: `${occurredAt}:00`,
        affectedRoomId: selectedRoomId,
        affectedStaffId: selectedStaffId,
        affectedEquipmentId: selectedEquipmentId,
        affectedSurgeryRequestId: selectedSurgeryId,
        durationOverrunMinutes: disruptionType === 'DURATION_OVERRUN' ? overrunMinutes : undefined,
      };

      if (disruptionType === 'EMERGENCY_ARRIVAL') {
        payload.emergencySurgeryRequest = {
          procedureName: emergencyProcedure,
          priority: 'EMERGENCY',
          estimatedDurationMinutes: emergencyDuration,
          preparationTimeMinutes: 10,
          cleaningTimeMinutes: 20,
          earliestStart: `${new Date().toISOString().slice(0, 10)}T08:00:00`,
          schedulingDeadline: `${new Date().toISOString().slice(0, 10)}T22:00:00`,
          requiredStaff: [
            { staffRole: 'SURGEON', mandatory: true },
            { staffRole: 'ANESTHETIST', mandatory: true },
            { staffRole: 'NURSE', mandatory: true },
          ],
        };
      }

      const res = await api.reschedule.registerDisruption(payload);
      onDisruptionRegistered(res.data.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register disruption');
    } finally {
      setLoading(false);
    }
  };

  const disruptionTypes: { type: DisruptionType; label: string; icon: React.ElementType; desc: string }[] = [
    {
      type: 'EMERGENCY_ARRIVAL',
      label: 'Emergency Patient Arrival',
      icon: Siren,
      desc: 'Immediate surgery needed, highest priority slot required',
    },
    {
      type: 'STAFF_ABSENCE',
      label: 'Staff Member Absence / Sickness',
      icon: User,
      desc: 'Surgeon or anesthetist suddenly unavailable for shifts',
    },
    {
      type: 'DURATION_OVERRUN',
      label: 'Surgery Duration Overrun',
      icon: Clock,
      desc: 'Current procedure extending significantly beyond schedule',
    },
    {
      type: 'EQUIPMENT_FAILURE',
      label: 'Equipment Failure',
      icon: Wrench,
      desc: 'Critical device/tower malfunction requires replacement',
    },
    {
      type: 'ROOM_CLOSURE',
      label: 'Operating Suite Closure',
      icon: DoorClosed,
      desc: 'Sterilization breakdown, decontamination, or maintenance',
    },
    {
      type: 'CANCELLATION',
      label: 'Patient / Case Cancellation',
      icon: AlertTriangle,
      desc: 'Case cancelled creating empty gap for rescheduling',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Register Operational Disruption</h2>
              <p className="text-xs text-slate-400">Trigger deterministic constraint evaluation and alternative rescheduling</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Select Disruption Type Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Disruption Category</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {disruptionTypes.map((dt) => {
                const Icon = dt.icon;
                const isSelected = disruptionType === dt.type;
                return (
                  <button
                    key={dt.type}
                    type="button"
                    onClick={() => setDisruptionType(dt.type)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm shadow-amber-500/10'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-semibold">{dt.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{dt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic contextual inputs based on disruption type */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
            {disruptionType === 'EMERGENCY_ARRIVAL' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                  <Siren className="w-3.5 h-3.5" />
                  <span>Emergency Procedure Specifications</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Procedure Title</label>
                    <input
                      type="text"
                      value={emergencyProcedure}
                      onChange={(e) => setEmergencyProcedure(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Est. Duration (Minutes)</label>
                    <input
                      type="number"
                      value={emergencyDuration}
                      onChange={(e) => setEmergencyDuration(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                      min={15}
                      max={480}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {disruptionType === 'STAFF_ABSENCE' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Absent Clinical Staff</label>
                <select
                  value={selectedStaffId || ''}
                  onChange={(e) => setSelectedStaffId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">-- Choose Surgeon / Anesthetist / Nurse --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.staffType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {disruptionType === 'EQUIPMENT_FAILURE' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Malfunctioning Equipment</label>
                <select
                  value={selectedEquipmentId || ''}
                  onChange={(e) => setSelectedEquipmentId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">-- Choose Equipment / Tower --</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.serialNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {disruptionType === 'ROOM_CLOSURE' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Closed Operating Suite</label>
                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">-- Choose Operating Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.roomType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {disruptionType === 'DURATION_OVERRUN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Select Overrunning Procedure</label>
                  <select
                    value={selectedSurgeryId || ''}
                    onChange={(e) => setSelectedSurgeryId(Number(e.target.value) || undefined)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                    required
                  >
                    <option value="">-- Choose Surgery Request --</option>
                    {surgeryList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.surgeryCode}: {s.procedureName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Overrun Duration (Minutes)</label>
                  <input
                    type="number"
                    value={overrunMinutes}
                    onChange={(e) => setOverrunMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                    min={15}
                    max={240}
                    required
                  />
                </div>
              </div>
            )}

            {disruptionType === 'CANCELLATION' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Cancelled Case</label>
                <select
                  value={selectedSurgeryId || ''}
                  onChange={(e) => setSelectedSurgeryId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">-- Choose Surgery to Cancel --</option>
                  {surgeryList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.surgeryCode}: {s.procedureName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description & Timestamp */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Incident Notes / Cause</label>
                <input
                  type="text"
                  placeholder="e.g., Acute appendiceal rupture incoming via ambulance"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Timestamp Occurred</label>
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : 'Register & Trigger Rescheduling'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
