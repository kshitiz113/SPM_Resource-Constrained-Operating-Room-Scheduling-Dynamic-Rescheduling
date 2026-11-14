import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { Staff, StaffType } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Award,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'OR_MANAGER']);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [allQuals, setAllQuals] = useState<{ id: number; name: string; category: string }[]>([]);
  const [selectedQuals, setSelectedQuals] = useState<number[]>([]);
  const [shiftStaff, setShiftStaff] = useState<Staff | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [shiftMode, setShiftMode] = useState<'RECURRING' | 'LEAVE'>('RECURRING');
  const [shiftDay, setShiftDay] = useState(1);
  const [shiftStart, setShiftStart] = useState('07:00');
  const [shiftEnd, setShiftEnd] = useState('19:00');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    api.staff.getQualifications().then((r) => setAllQuals(r.data || [])).catch(() => setAllQuals([]));
  }, []);

  const loadShifts = async (member: Staff) => {
    try {
      const res = await api.staff.getShifts(member.id);
      setShifts(res.data || []);
    } catch (err: any) {
      error('Failed to load shifts', err.response?.data?.message || err.message);
    }
  };

  const openShifts = (member: Staff) => {
    setShiftStaff(member);
    setShiftMode('RECURRING');
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
    loadShifts(member);
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftStaff) return;
    setSubmitting(true);
    try {
      if (shiftMode === 'RECURRING') {
        await api.staff.addShift(shiftStaff.id, {
          dayOfWeek: shiftDay,
          startTime: shiftStart,
          endTime: shiftEnd,
          isRecurring: true,
          isLeave: false,
        });
      } else {
        if (!leaveFrom) {
          error('Start date required', 'Choose the first day of leave.');
          return;
        }
        if (leaveTo && leaveTo < leaveFrom) {
          error('Invalid range', 'Leave end date must not be before the start date.');
          return;
        }
        await api.staff.addShift(shiftStaff.id, {
          startTime: '00:00',
          endTime: '23:59',
          effectiveFrom: leaveFrom,
          effectiveTo: leaveTo || leaveFrom,
          isRecurring: false,
          isLeave: true,
          leaveReason: leaveReason || 'Leave of absence',
        });
      }
      success('Roster Updated', `Saved for ${shiftStaff.fullName}.`);
      loadShifts(shiftStaff);
    } catch (err: any) {
      error('Could not save shift', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!shiftStaff) return;
    try {
      await api.staff.deleteShift(shiftStaff.id, shiftId);
      loadShifts(shiftStaff);
    } catch (err: any) {
      error('Could not remove entry', err.response?.data?.message || err.message);
    }
  };

  const toggleActive = async (member: Staff) => {
    try {
      if (member.active) {
        if (!confirm(`Deactivate ${member.fullName}? They will no longer be assigned to new schedules.`)) return;
        await api.staff.delete(member.id);
        success('Staff Deactivated', `${member.fullName} removed from active rosters.`);
      } else {
        await api.staff.reactivate(member.id);
        success('Staff Reactivated', `${member.fullName} is active again.`);
      }
      fetchStaff();
    } catch (err: any) {
      error('Action failed', err.response?.data?.message || err.message);
    }
  };

  const openEdit = (member: Staff) => {
    setEditing(member);
    setFullName(member.fullName);
    setEmployeeId(member.employeeId);
    setStaffType(member.staffType);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setSelectedQuals((member.qualifications || []).map((q) => q.id));
    setIsModalOpen(true);
  };

  // Form
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [staffType, setStaffType] = useState<StaffType>('SURGEON');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'ALL') params.staffType = filterType;
      if (search) params.search = search;
      const res = await api.staff.getAll(params);
      setStaffList(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load staff roster', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        fullName,
        employeeId,
        staffType,
        email: email || undefined,
        phone: phone || undefined,
        qualifications: selectedQuals.map((qualificationId) => ({ qualificationId })),
      };
      if (editing) {
        await api.staff.update(editing.id, payload);
        success('Staff Updated', `${fullName} saved.`);
      } else {
        await api.staff.create(payload);
        success('Staff Enrolled', `${fullName} added to clinical staff directory.`);
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.message || 'Could not enroll staff member');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Clinical Staff Directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            Surgical Roster & Qualifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Surgeons, anesthetists, scrub nurses, and perfusionists mapped to clinical credentials.
          </p>
        </div>

        {canManage && (
        <button
          onClick={() => {
            setEditing(null);
            setSelectedQuals([]);
            setFullName('');
            setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
            setStaffType('SURGEON');
            setEmail('');
            setPhone('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enroll Clinical Staff
        </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 backdrop-blur-xl">
        {/* Role Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'SURGEON', 'ANESTHETIST', 'NURSE', 'TECHNICIAN'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                filterType === type
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffList.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{member.fullName}</h3>
                <span className="text-[11px] font-mono text-teal-400 font-semibold">
                  {member.staffType}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  ID: {member.employeeId}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded ${
                  member.active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {member.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            {/* Qualifications */}
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                <Award className="w-3 h-3 text-teal-400" />
                Verified Qualifications
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                {member.qualifications?.length ? (
                  member.qualifications.map((q) => (
                    <span
                      key={q.id}
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      title={q.description}
                    >
                      {q.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">General practice credentials</span>
                )}
              </div>
            </div>

            {canManage && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(member)}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => openShifts(member)}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  Shifts &amp; Leave
                </button>
                <button
                  onClick={() => toggleActive(member)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] ${
                    member.active
                      ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                      : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {member.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            )}

            {/* Contact details */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              {member.email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Enroll Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Edit Clinical Staff Member' : 'Enroll Clinical Staff Member'}
        subtitle="Add a physician, anesthetist, or nursing specialist to the active roster."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Marcus Vance, MD"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID</label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Role</label>
              <select
                value={staffType}
                onChange={(e) => setStaffType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="SURGEON">SURGEON</option>
                <option value="ANESTHETIST">ANESTHETIST</option>
                <option value="NURSE">NURSE</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hospital Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m.vance@hospital.org"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Pager / Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-0192"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Qualifications</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {allQuals.map((q) => {
                const on = selectedQuals.includes(q.id);
                return (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() =>
                      setSelectedQuals((prev) => (on ? prev.filter((i) => i !== q.id) : [...prev, q.id]))
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      on
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {q.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Enroll Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Shifts & Leave Modal */}
      <Modal
        isOpen={!!shiftStaff}
        onClose={() => setShiftStaff(null)}
        title={`Shifts & Leave: ${shiftStaff?.fullName || ''}`}
        subtitle="Recurring weekly shifts and leave periods are enforced by the scheduling engine (HC-07)."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {shifts.length === 0 && (
              <p className="text-xs text-slate-400 italic">No shifts or leave recorded.</p>
            )}
            {shifts.map((sh) => (
              <div
                key={sh.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-mono"
              >
                <span className={sh.isLeave ? 'text-amber-300' : 'text-slate-200'}>
                  {sh.isLeave
                    ? `LEAVE ${sh.effectiveFrom} to ${sh.effectiveTo || sh.effectiveFrom}${sh.leaveReason ? ' - ' + sh.leaveReason : ''}`
                    : `${DAYS[sh.dayOfWeek] || 'Dated'} ${sh.startTime} - ${sh.endTime}`}
                </span>
                <button
                  onClick={() => handleDeleteShift(sh.id)}
                  className="text-rose-400 hover:text-rose-300 text-[11px]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddShift} className="space-y-3 border-t border-slate-800 pt-3">
            <div className="flex gap-2">
              {(['RECURRING', 'LEAVE'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setShiftMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono border ${
                    shiftMode === m
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {m === 'RECURRING' ? 'Weekly shift' : 'Leave / absence'}
                </button>
              ))}
            </div>

            {shiftMode === 'RECURRING' ? (
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={shiftDay}
                  onChange={(e) => setShiftDay(Number(e.target.value))}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                >
                  {DAYS.slice(1).map((d, i) => (
                    <option key={d} value={i + 1}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  value={leaveFrom}
                  onChange={(e) => setLeaveFrom(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
                <input
                  type="date"
                  value={leaveTo}
                  onChange={(e) => setLeaveTo(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Reason"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Saving...' : shiftMode === 'RECURRING' ? 'Add Shift' : 'Add Leave'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
