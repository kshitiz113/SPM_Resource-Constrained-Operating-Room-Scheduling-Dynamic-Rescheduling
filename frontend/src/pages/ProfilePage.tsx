import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../api/endpoints';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  Save,
  HelpCircle,
  FileCheck,
  Stethoscope
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Surgical Services / General Surgery');
  const [pager, setPager] = useState('555-0144');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');

      const metaKey = `staff_profile_meta_${user.id || user.username}`;
      const savedMeta = localStorage.getItem(metaKey);
      if (savedMeta) {
        try {
          const parsed = JSON.parse(savedMeta);
          if (parsed.department) setDepartment(parsed.department);
          if (parsed.pager) setPager(parsed.pager);
        } catch (_) {}
      } else {
        // Defaults based on role
        if (user.roles?.includes('ADMIN')) {
          setDepartment('Hospital Information Systems & IT Governance');
          setPager('555-0100');
        } else if (user.roles?.includes('OR_MANAGER')) {
          setDepartment('Perioperative Suite Administration');
          setPager('555-0102');
        } else if (user.roles?.includes('SCHEDULER')) {
          setDepartment('Central Surgical Operations & Optimization');
          setPager('555-0105');
        } else {
          setDepartment('Cardiothoracic & General Surgery');
          setPager('555-0144');
        }
      }
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password.length < 6) {
      error('Password Too Short', 'New password must be at least 6 characters.');
      return;
    }

    if (password && password !== confirmPassword) {
      error('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName,
        email,
      };
      if (password) {
        payload.password = password;
      }

      const res = await api.auth.updateProfile(payload);
      updateUser(res.data);

      // Save local profile meta
      const metaKey = `staff_profile_meta_${user?.id || user?.username}`;
      localStorage.setItem(metaKey, JSON.stringify({ department, pager }));

      setPassword('');
      setConfirmPassword('');
      success('Profile Updated', 'Your personal and clinical profile was successfully updated.');
    } catch (err: any) {
      error(
        'Update Failed',
        err.response?.data?.message || err.message || 'Could not update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'OR_MANAGER':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'SCHEDULER':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      default:
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-teal-400" />
          Clinical Staff Profile & Credentials
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your hospital user account, clinical credentials, notifications, and security keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Badge Card & Quick Guide */}
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-800 text-2xl font-bold font-mono text-white shadow-xl shadow-teal-950/60 border border-teal-400/30">
              {user?.fullName?.charAt(0) || 'U'}
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-100">{user?.fullName}</h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">@{user?.username}</p>
              <p className="text-xs text-teal-400 mt-1 font-mono truncate">{user?.email}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-2 border-t border-slate-800/80">
              {user?.roles?.map((r) => (
                <span
                  key={r}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border ${getRoleBadgeStyle(r)}`}
                >
                  {r}
                </span>
              ))}
            </div>

            <div className="pt-2 text-xs text-slate-400 text-left border-t border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-200 font-medium truncate max-w-[150px]">{department}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Direct Pager:</span>
                <span className="text-slate-200 font-mono">{pager}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Account Status:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active Verified
                </span>
              </div>
            </div>
          </div>

          {/* Guide: How to Make & Manage a Profile */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
              <HelpCircle className="w-4 h-4 text-teal-400" /> How to Set Up Your Profile
            </h3>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-200">1. Account Registration:</strong> New clinical accounts can self-register at the <span className="text-teal-400">/signup</span> page or be provisioned directly by an Institutional Admin.
              </p>
              <p>
                <strong className="text-slate-200">2. Fixed Username:</strong> Institutional user handles are locked to your medical record identity and cannot be altered without IT clearance.
              </p>
              <p>
                <strong className="text-slate-200">3. Role Assignments:</strong> Your permissions (<code className="text-teal-300">ADMIN</code>, <code className="text-teal-300">OR_MANAGER</code>, <code className="text-teal-300">SCHEDULER</code>, or <code className="text-teal-300">CLINICAL_STAFF</code>) govern access to deterministic optimization, schedule publishing, and theater governance.
              </p>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-400" />
              Personal & Institutional Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Hospital Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username (read only) */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Institutional Username (Fixed)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400 font-mono cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Username is managed by hospital IT</span>
                </div>

                {/* Clearance Roles (read only) */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Security Clearance Roles (Fixed)
                  </label>
                  <div className="flex flex-wrap gap-1.5 py-1.5">
                    {user?.roles?.map((r) => (
                      <span
                        key={r}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getRoleBadgeStyle(r)}`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Assigned by institutional administration</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Clinical Department / Division
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Cardiothoracic Surgery"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                {/* Pager / Direct Ext */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Emergency Pager / Hospital Extension
                  </label>
                  <input
                    type="text"
                    value={pager}
                    onChange={(e) => setPager(e.target.value)}
                    placeholder="e.g. 555-0144"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5 font-mono">
                  <Key className="w-4 h-4 text-teal-400" /> Change Security Password
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  All profile updates are recorded in the institutional audit log.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
