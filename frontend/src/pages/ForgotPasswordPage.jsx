import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { forgotPassword } from '../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ForgotPasswordPage = () => {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Please enter your email address.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSuccessState(true);
      showToast("If registered, a recovery link has been outputted to the server logs.", "success");
    } catch (err) {
      showToast("Failed to initiate password reset.", "error");
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
            Reset password
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            We will simulate sending a password recovery link to your inbox.
          </p>
        </div>

        <GlassCard className="p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50">
          {!successState ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-violet-600 hover:bg-violet-500 shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Request...' : 'Send Recovery Link'}</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Link simulated!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Please check the terminal console logs of your backend server for the simulated password reset URL token!
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <NavLink
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </NavLink>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
