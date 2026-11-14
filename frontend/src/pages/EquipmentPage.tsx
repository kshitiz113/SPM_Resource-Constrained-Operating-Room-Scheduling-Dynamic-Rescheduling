import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { toDateTimeInput } from '../utils/dates';
import { Equipment, EquipmentStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Wrench,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const EquipmentPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'OR_MANAGER']);

  const changeStatus = async (eq: Equipment, status: EquipmentStatus) => {
    try {
      await api.equipment.update(eq.id, {
        name: eq.name,
        equipmentType: eq.equipmentType,
        serialNumber: eq.serialNumber,
        description: eq.description,
        status,
      });
      success('Equipment Updated', `${eq.name} is now ${status}.`);
      fetchEquipment();
    } catch (err: any) {
      error('Update Failed', err.response?.data?.message || err.message);
    }
  };

  // Maintenance form
  const [unavailableFrom, setUnavailableFrom] = useState('');
  const [unavailableTo, setUnavailableTo] = useState('');
  const [reason, setReason] = useState('');

  // Add equipment form
  const [name, setName] = useState('');
  const [equipmentType, setEquipmentType] = useState('IMAGING');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.equipment.getAll();
      setEquipmentList(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load equipment catalog', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const openMaintenanceModal = (eq: Equipment) => {
    setSelectedEq(eq);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const later = new Date(now.getTime() + 4 * 3600000);
    setUnavailableFrom(toDateTimeInput(now));
    setUnavailableTo(toDateTimeInput(later));
    setReason('Sterilization cycle and calibration check');
    setIsMaintenanceModalOpen(true);
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) return;
    setSubmitting(true);
    try {
      await api.equipment.scheduleMaintenance(selectedEq.id, {
        unavailableFrom: `${unavailableFrom}:00`,
        unavailableTo: `${unavailableTo}:00`,
        reason,
      });
      success('Maintenance Scheduled', `Booked maintenance downtime for ${selectedEq.name}.`);
      setIsMaintenanceModalOpen(false);
      fetchEquipment();
    } catch (err: any) {
      error('Maintenance Scheduling Failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.equipment.create({
        name,
        equipmentType,
        serialNumber,
        model,
        status: 'AVAILABLE',
      });
      success('Equipment Added', `${name} cataloged into hospital inventory.`);
      setIsAddModalOpen(false);
      fetchEquipment();
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Surgical Technology Catalog..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-400" />
            Surgical Technology & Equipment Fleet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic hard constraint tracking for fluoroscopy, robotics, anesthesia, and bypass units.
          </p>
        </div>

        {canManage && (
        <button
          onClick={() => {
            setName('');
            setEquipmentType('IMAGING');
            setSerialNumber(`EQ-${Math.floor(10000 + Math.random() * 90000)}`);
            setModel('Model X-200');
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Technology
        </button>
        )}
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipmentList.map((eq) => (
          <div
            key={eq.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-slate-700 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                  {eq.name}
                </h3>
                <span className="text-xs font-mono text-teal-400 font-semibold">{eq.equipmentType}</span>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  SN: {eq.serialNumber || 'N/A'}
                </span>
              </div>
              <StatusBadge status={eq.status} size="sm" />
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Model Specification:</span>
                <span className="text-slate-200">{eq.model || 'Standard Unit'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>HC-03 Constraint:</span>
                <span className="text-teal-300">No Double-Booking</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {eq.status === 'AVAILABLE' ? 'Ready for procedure' : 'Unavailable for scheduling'}
              </span>
              {canManage && (
              <div className="flex items-center gap-2">
                <select
                  value={eq.status}
                  onChange={(e) => changeStatus(eq, e.target.value as EquipmentStatus)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200 font-mono"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_USE">IN_USE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                </select>
              <button
                onClick={() => openMaintenanceModal(eq)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-amber-300 hover:bg-slate-800 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Downtime
              </button>
              </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Maintenance Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title={`Schedule Maintenance: ${selectedEq?.name}`}
        subtitle="Blackout this equipment from scheduling engine availability (HC-11)."
        maxWidth="md"
      >
        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Downtime Starts</label>
            <input
              type="datetime-local"
              required
              value={unavailableFrom}
              onChange={(e) => setUnavailableFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Downtime Ends</label>
            <input
              type="datetime-local"
              required
              value={unavailableTo}
              onChange={(e) => setUnavailableTo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Maintenance / Calibration Reason</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mandatory sterile gas cycle and laser calibration."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-950/40 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Schedule Downtime'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Equipment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Surgical Equipment"
        subtitle="Catalog a clinical device for deterministic constraint tracking."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Device Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. C-Arm Fluoroscope B"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Device Category</label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="IMAGING">IMAGING</option>
                <option value="ROBOTIC">ROBOTIC</option>
                <option value="CARDIAC">CARDIAC</option>
                <option value="ANESTHESIA">ANESTHESIA</option>
                <option value="SURGICAL_TOOL">SURGICAL_TOOL</option>
                <option value="STERILIZATION">STERILIZATION</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Serial Number</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Model & Specs</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Siemens Cios Alpha 25kW"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 disabled:opacity-50"
            >
              {submitting ? 'Cataloging...' : 'Catalog Device'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
