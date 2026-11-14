import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  HeartPulse,
  User,
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordLengthValid = password.length >= 6;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedFullName || !trimmedUsername || !trimmedEmail) {
      error('Missing Information', 'Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      error('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      error('Password Mismatch', 'Password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: trimmedUsername,
        password,
        fullName: trimmedFullName,
        email: trimmedEmail,
      });
      success('Account Created', `Welcome to OR Operations, ${trimmedFullName}! Your clinical profile is ready.`);
      navigate('/profile');
    } catch (err: any) {
      error(
        'Registration Failed',
        err.response?.data?.message || err.message || 'Could not register user account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-y-auto selection:bg-teal-500/30">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-800 flex items-center justify-center shadow-xl shadow-teal-950/60 border border-teal-400/30">
            <HeartPulse className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-100">
          Clinical Staff Registration
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Create an operating room scheduling account & credentials profile
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl">
          <form className="space-y-4" onSubmit={handleSignUp} id="signup-form">
            {/* Full Name */}
            <div>
              <label htmlFor="signup-fullname" className="block text-xs font-medium text-slate-300 mb-1">
                Full Legal & Professional Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="signup-fullname"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Emily Chen, MD"
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Username */}
              <div>
                <label htmlFor="signup-username" className="block text-xs font-medium text-slate-300 mb-1">
                  Staff Username
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. echen"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-slate-300 mb-1">
                  Hospital Email
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.chen@hospital.org"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
              New accounts start with clinical staff access (view schedules, file surgery requests). An administrator can
              grant scheduler, manager or admin permissions after registration.
            </p>

            {/* Password and Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-password" className="block text-xs font-medium text-slate-300 mb-1">
                  Password (min 6 chars)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic password validation hints */}
            {password.length > 0 && (
              <div className="text-[11px] flex items-center gap-3 pt-1">
                <span className={`flex items-center gap-1 ${passwordLengthValid ? 'text-teal-400' : 'text-slate-400'}`}>
                  {passwordLengthValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  At least 6 characters
                </span>
                {confirmPassword.length > 0 && (
                  <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-teal-400' : 'text-rose-400'}`}>
                    {passwordsMatch ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                id="signup-submit-button"
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 px-4 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 hover:bg-teal-500 focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Profile...' : 'Create Account & Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Link back to login */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have hospital credentials?{' '}
              <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
