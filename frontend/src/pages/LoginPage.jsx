import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const LoginPage = () => {
  const { handleLogin, isAuthenticated, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If session expired notice exists
    if (searchParams.get('expired')) {
      showToast("Your session has expired. Please log in again.", "info");
    }
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please fill in all credentials.", "error");
      return;
    }
    
    setIsSubmitting(true);
    const success = await handleLogin(email, password, rememberMe);
    setIsSubmitting(false);
    
    if (success) {
      navigate('/dashboard');
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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to access your dashboard and study materials.
          </p>
        </div>

        <GlassCard className="p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
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

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <NavLink
                  to="/forgot-password"
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline focus:outline-none focus:ring-1 focus:ring-violet-500 rounded"
                >
                  Forgot password?
                </NavLink>
              </div>
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

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  disabled={isSubmitting}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 bg-white dark:bg-slate-900 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Remember me for 7 days
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-violet-600 hover:bg-violet-500 shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors disabled:opacity-50 cursor-pointer group"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          {/* Registration Footer */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Don't have an account yet?{' '}
              <NavLink
                to="/register"
                className="text-violet-600 dark:text-violet-400 hover:underline font-bold"
              >
                Sign up free
              </NavLink>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;
