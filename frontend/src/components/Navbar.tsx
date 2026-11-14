import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, NotificationItem } from '../types';
import { api } from '../api/endpoints';
import {
  Bell,
  Activity,
  AlertTriangle,
  UserCheck,
  LogOut,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenDisruptionModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDisruptionModal }) => {
  const { user, logout, quickLogin } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeScheduleLabel, setActiveScheduleLabel] = useState<string>('Loading...');

  useEffect(() => {
    loadNotifications();
    loadActiveSchedule();
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.data?.content || []);
    } catch {
      // Ignore in mock/disconnected mode
    }
  };

  const loadActiveSchedule = async () => {
    try {
      const res = await api.schedules.getActive();
      if (res.data?.scheduleVersion) {
        setActiveScheduleLabel(`${res.data.scheduleVersion.versionLabel} (${res.data.scheduleVersion.status})`);
      } else {
        setActiveScheduleLabel('SCH-2026-10-20-v1 (ACTIVE)');
      }
    } catch {
      setActiveScheduleLabel('SCH-2026-10-20-v1 (ACTIVE)');
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
    OR_MANAGER: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    SCHEDULER: 'bg-teal-900/60 text-teal-300 border-teal-700/50',
    CLINICAL_STAFF: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Active Schedule */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Activity className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              OR-OptiSched
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                PROD v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Resource-Constrained Operating Room Platform</p>
          </div>
        </div>

        {/* Active Schedule Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-400">Official Schedule:</span>
          <span className="font-semibold text-teal-300">{activeScheduleLabel}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-4">
        {/* Inject Disruption Button */}
        <button
          onClick={onOpenDisruptionModal}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-semibold shadow-sm hover:shadow-amber-500/10"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Report Disruption</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-750 text-slate-300 hover:text-white transition-all relative border border-slate-700/50"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-semibold text-sm text-white">Operational Alerts</span>
                <span className="text-xs text-slate-400 font-mono">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 py-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No active notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`py-2 px-1 cursor-pointer transition-colors ${n.read ? 'opacity-50' : 'bg-slate-800/30'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher & User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">{user?.fullName || 'Clinical Staff'}</p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${roleColors[user?.roles?.[0] || 'OR_MANAGER']}`}>
                {user?.roles?.[0] || 'OR_MANAGER'}
              </span>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative group">
            <button className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px]">Role</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 hidden group-hover:block z-50">
              <p className="text-[10px] text-slate-400 px-2 py-1 uppercase font-mono">Demo Role Switcher</p>
              <button
                onClick={() => quickLogin('ADMIN')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-purple-300 flex items-center justify-between"
              >
                <span>Administrator</span>
                {user?.roles?.includes('ADMIN') && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
              </button>
              <button
                onClick={() => quickLogin('OR_MANAGER')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-emerald-300 flex items-center justify-between"
              >
                <span>OR Manager</span>
                {user?.roles?.includes('OR_MANAGER') && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => quickLogin('SCHEDULER')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-teal-300 flex items-center justify-between"
              >
                <span>Scheduler</span>
                {user?.roles?.includes('SCHEDULER') && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
              </button>
              <button
                onClick={() => quickLogin('CLINICAL_STAFF')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-blue-300 flex items-center justify-between"
              >
                <span>Clinical Staff</span>
                {user?.roles?.includes('CLINICAL_STAFF') && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors border border-slate-700/50"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
