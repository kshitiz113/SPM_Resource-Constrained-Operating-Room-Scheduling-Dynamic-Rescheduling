import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/endpoints';
import { NotificationItem, UserRole } from '../../types';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  ShieldCheck,
  Activity,
  ChevronDown,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'System Admin',
        badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        dotClass: 'bg-purple-400',
      };
    case 'OR_MANAGER':
      return {
        label: 'OR Manager',
        badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
    case 'SCHEDULER':
      return {
        label: 'Lead Scheduler',
        badgeClass: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
        dotClass: 'bg-teal-400',
      };
    case 'CLINICAL_STAFF':
      return {
        label: 'Chief Surgeon / Staff',
        badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
      };
    default:
      return {
        label: 'Clinical User',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        dotClass: 'bg-slate-400',
      };
  }
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      const list = res.data?.content || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // Ignore background notification failure
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const isManagerOrAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'OR_MANAGER');
  const isSchedulerOrAbove = user?.roles?.some((r) => r === 'ADMIN' || r === 'OR_MANAGER' || r === 'SCHEDULER');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-xl">
      {/* Left: Operational status indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          <Activity className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
          <span className="text-slate-400">SYSTEM CLOCK:</span>
          <span className="font-semibold text-teal-300">{currentTime || 'LIVE'}</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span>Database Connected</span>
          <span className="text-slate-700">|</span>
          <span>Deterministic Engine Ready</span>
        </div>
      </div>

      {/* Right: Clearance Badge, Notifications, User profile */}
      <div className="flex items-center gap-3">
        {/* Active Clearance Badge (Read-only security badge) */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 shadow-sm text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">Clearance:</span>
          <div className="flex items-center gap-1.5">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map((r) => {
                const info = getRoleBadge(r);
                return (
                  <span
                    key={r}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide border ${info.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass}`} />
                    {info.label}
                  </span>
                );
              })
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Active Staff
              </span>
            )}
          </div>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Operational Notifications"
            aria-label="Operational Notifications"
            aria-expanded={isNotifOpen}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md shadow-rose-950">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 px-1">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Operational Alerts ({notifications.length})
                </span>
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No recent notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`cursor-pointer rounded-lg p-2.5 transition-colors border ${
                        !n.read
                          ? 'bg-slate-800/80 border-teal-500/30 hover:bg-slate-800'
                          : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100">{n.title}</span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                      <span className="mt-1 block text-[10px] font-mono text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-left text-sm hover:bg-slate-800 transition-colors"
            aria-label="User Profile Menu"
            aria-expanded={isUserMenuOpen}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-teal-500 to-teal-700 text-white font-semibold text-xs font-mono shadow-sm">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-slate-200 leading-tight">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] text-teal-400/90 font-mono leading-tight">
                {user?.roles?.[0] || 'GUEST'}
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* User Identity Header */}
              <div className="border-b border-slate-800 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-teal-500 to-teal-800 text-white font-bold text-sm font-mono shadow-md border border-teal-400/20">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-100 truncate">{user?.fullName}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">@{user?.username}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-1.5 font-mono">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => {
                    const info = getRoleBadge(r);
                    return (
                      <span
                        key={r}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${info.badgeClass}`}
                      >
                        <span className={`w-1 h-1 rounded-full ${info.dotClass}`} />
                        {info.label}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Authenticated Session Active</span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors font-medium"
                >
                  <UserIcon className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  My Profile & Credentials
                </button>

                {isSchedulerOrAbove && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/schedule/generate');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    Scheduling Workspace
                  </button>
                )}

                {isManagerOrAdmin && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/audit');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Audit & Compliance Log
                  </button>
                )}
              </div>

              {/* Sign Out Action */}
              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

