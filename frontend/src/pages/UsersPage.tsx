import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { User, UserRole } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { UserCog, Plus } from 'lucide-react';

const ALL_ROLES: UserRole[] = ['ADMIN', 'OR_MANAGER', 'SCHEDULER', 'CLINICAL_STAFF'];

export const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRole[]>(['CLINICAL_STAFF']);
  const [active, setActive] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.users.getAll({ page: 0, size: 200 });
      setUsers(res.data?.content || []);
    } catch (err: any) {
      error('Failed to load users', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRoles(['CLINICAL_STAFF']);
    setActive(true);
    setIsOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setEmail(u.email);
    setPassword('');
    setRoles(u.roles);
    setActive(u.active);
    setIsOpen(true);
  };

  const toggleRole = (r: UserRole) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roles.length === 0) {
      error('Role required', 'Assign at least one role.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.users.update(editing.id, {
          username,
          fullName,
          email,
          password: password || undefined,
          roles,
          active,
        });
        success('User Updated', `${username} saved.`);
      } else {
        await api.users.create({ username, fullName, email, password, roles, active });
        success('User Created', `${username} can now sign in.`);
      }
      setIsOpen(false);
      fetchUsers();
    } catch (err: any) {
      const fe = err.response?.data?.fieldErrors;
      error(
        'Save failed',
        (fe && Object.values(fe).join(', ')) || err.response?.data?.message || err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (u: User) => {
    if (!confirm(`Deactivate ${u.username}? They will no longer be able to sign in.`)) return;
    try {
      await api.users.delete(u.id);
      success('User Deactivated', `${u.username} can no longer sign in.`);
      fetchUsers();
    } catch (err: any) {
      error('Action failed', err.response?.data?.message || err.message);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none';

  if (loading) return <LoadingSpinner label="Loading User Directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-teal-400" />
            User Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create accounts, assign roles and deactivate access. Administrator only.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Roles</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/20">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-100">{u.fullName}</div>
                  <div className="font-mono text-[11px] text-slate-400">@{u.username}</div>
                </td>
                <td className="py-3 px-4 text-slate-300">{u.email}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      u.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {u.active ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  {u.active && u.username !== me?.username && (
                    <button
                      onClick={() => handleDeactivate(u)}
                      className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-[11px] text-rose-400 hover:bg-rose-500/10"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? `Edit ${editing.username}` : 'Create User Account'}
        subtitle="Roles control which pages and actions the user can access."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
              <input
                className={inputCls}
                required
                minLength={3}
                disabled={!!editing}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full name</label>
              <input className={inputCls} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                className={inputCls}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {editing ? 'New password (optional)' : 'Password'}
              </label>
              <input
                className={inputCls}
                type="password"
                minLength={6}
                required={!editing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
                    roles.includes(r)
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Account active
            </label>
          )}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
