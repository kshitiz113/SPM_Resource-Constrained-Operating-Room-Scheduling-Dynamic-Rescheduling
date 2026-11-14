import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';
import {
  HeartPulse,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  Activity,
  Check
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('ormanager');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { login, quickLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      success('Authentication Successful', `Welcome back to OR Operations Control`);
      navigate('/');
    } catch (err: any) {
      error(
        'Authentication Failed',
        err.response?.data?.message || 'Invalid username or password'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      await quickLogin(role);
      success('Logged In', `Switched session to ${role}`);
      navigate('/');
    } catch (err: any) {
      error('Sign-in Error', err.response?.data?.message || 'Could not log in');
    } finally {
      setLoading(false);
    }
  };

  const rolesList: { role: UserRole; name: string; desc: string; user: string }[] = [
    {
      role: 'ADMIN',
      name: 'System Admin',
      desc: 'Full governance, user management, audit logs',
      user: 'admin',
    },
    {
      role: 'OR_MANAGER',
      name: 'OR Manager',
      desc: 'Approve & publish schedules, manage disruptions',
      user: 'ormanager',
    },
    {
      role: 'SCHEDULER',
      name: 'Lead Scheduler',
      desc: 'Generate deterministic schedules, register events',
      user: 'scheduler1',
    },
    {
      role: 'CLINICAL_STAFF',
      name: 'Chief Surgeon',
      desc: 'View schedules, surgical cases, request surgeries',
      user: 'dr.alice',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-teal-500/30">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-800 flex items-center justify-center shadow-xl shadow-teal-950/60 border border-teal-400/30">
            <HeartPulse className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-100">
          OR-SCHEDULER
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">
          Resource-Constrained Operating Room Scheduling Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Quick Demo Sign In Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Quick Role Demo Access
              </span>
              <span className="text-[11px] text-slate-400">One-click instant login</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickLogin(item.role)}
                  disabled={loading}
                  className="flex flex-col text-left p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-teal-500/40 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-teal-400">
                      {item.user}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-1 leading-tight">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-400 font-mono text-[10px]">
                or credentials login
              </span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Staff Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ormanager or admin"
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Access Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 hover:bg-teal-500 focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Surgery Suite'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-5 text-center text-xs text-slate-400">
            Need institutional access?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              Register Clinical Account
            </button>
          </div>

          {/* Engine Specs */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              JWT Auth 256-bit
            </span>
            <span>HC-01 ~ HC-12 Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
