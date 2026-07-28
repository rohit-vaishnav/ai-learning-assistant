import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resetPassword } from '../services/api';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ResetPasswordPage = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!token) {
      showToast("Reset token is missing from your link.", "error");
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) {
      showToast("Please fill in both password fields.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccessState(true);
      showToast("Password reset successfully. Please log in.", "success");
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to reset password. Link might be expired.";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-violet-600/10 text-violet-600 dark:text-violet-400 rounded-2xl mb-4 font-display font-bold text-2xl">
            🎓
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Set new password
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Please enter your new student account password.
          </p>
        </div>

        <GlassCard className="p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50">
          {!successState ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-violet-600 hover:bg-violet-500 shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors disabled:opacity-50 cursor-pointer mt-2"
              >
                <span>{isSubmitting ? 'Updating password...' : 'Update Password'}</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Password Updated</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Your password has been successfully changed.
              </p>
              <NavLink
                to="/login"
                className="w-full block text-center py-3 px-4 rounded-xl text-white font-semibold text-sm bg-violet-600 hover:bg-violet-500 shadow-md transition-colors"
              >
                Go to Login
              </NavLink>
            </div>
          )}

          {!successState && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <NavLink
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </NavLink>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
