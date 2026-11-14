import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { NotificationItem } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load notifications', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      success('Notification Updated', 'Marked as read.');
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Clinical Alert Broadcasts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-400" />
          Operational Alerts & System Broadcasts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time notices for emergency admissions, room status changes, and schedule publications.
        </p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No Operational Notifications"
          description="You are caught up. Any schedule publication or disruption alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all ${
                !n.read
                  ? 'bg-slate-900/90 border-teal-500/40 shadow-lg shadow-teal-950/20'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    {n.notificationType}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">{n.title}</h3>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-teal-400 hover:text-teal-300 font-medium"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>

              {n.referenceType && (
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>
                    Linked Resource: {n.referenceType} #{n.referenceId}
                  </span>
                  {n.referenceType === 'Disruption' && (
                    <button
                      onClick={() => navigate('/reschedule')}
                      className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                    >
                      View in Rescheduling <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
