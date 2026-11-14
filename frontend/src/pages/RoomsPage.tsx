import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { OperatingRoom } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Edit2,
  Trash2,
  Filter
} from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<OperatingRoom | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'OR_MANAGER']);

  // Form fields
  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('GENERAL');
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED' | 'MAINTENANCE'>('ACTIVE');
  const [capacity, setCapacity] = useState(1);
  const [description, setDescription] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.rooms.getAll();
      setRooms(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load rooms', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openCreateModal = () => {
    setSelectedRoom(null);
    setName('');
    setRoomType('GENERAL');
    setStatus('ACTIVE');
    setCapacity(1);
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: OperatingRoom) => {
    setSelectedRoom(room);
    setName(room.name);
    setRoomType(room.roomType);
    setStatus(room.status);
    setCapacity(room.capacity);
    setDescription(room.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        roomType,
        status,
        capacity,
        description,
      };

      if (selectedRoom) {
        await api.rooms.update(selectedRoom.id, payload);
        success('Operating Room Updated', `${name} updated successfully.`);
      } else {
        await api.rooms.create(payload);
        success('Operating Room Created', `${name} registered into hospital fleet.`);
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      error('Operation Failed', err.response?.data?.message || 'Could not save operating room');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Operating Suite Catalog..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            Operating Suite Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure surgical suites, designated specialties, and baseline operating windows.
          </p>
        </div>

        {canManage && (
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Operating Room
        </button>
        )}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-slate-700 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                  {room.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">{room.roomType}</span>
              </div>
              <StatusBadge status={room.status} size="sm" />
            </div>

            <p className="text-xs text-slate-400 mt-3 line-clamp-2 min-h-[32px]">
              {room.description || 'Standard high-containment sterile surgical theater.'}
            </p>

            {/* Operating Hours Info */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" /> Operational Hours:
                </span>
                <span className="text-slate-200">07:00 - 19:00</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Concurrent Capacity:</span>
                <span className="text-slate-200">{room.capacity} patient</span>
              </div>
            </div>

            {/* Actions */}
            {canManage && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(room)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                Configure
              </button>
            </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? `Configure ${selectedRoom.name}` : 'Register New Operating Room'}
        subtitle="Manage suite capabilities and active surgical readiness status."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Room Identifier / Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OR-6 (Trauma Suite)"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Specialty / Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="ORTHOPEDIC">ORTHOPEDIC</option>
                <option value="NEUROSURGERY">NEUROSURGERY</option>
                <option value="CARDIAC">CARDIAC</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="ROBOTIC">ROBOTIC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operational Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Room Description & Features</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Equipped with ceiling laminar air flow, dual surgical boom, and digital video integration."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
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
              {submitting ? 'Saving...' : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
