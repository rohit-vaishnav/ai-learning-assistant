import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const NotFoundPage = () => {
  return (
    <div className="px-6 py-20 max-w-md mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-82px)] flex flex-col justify-center text-center">
      <GlassCard className="border border-violet-500/10">
        <h1 className="font-display font-extrabold text-7xl text-violet-500 mb-4">404</h1>
        <h2 className="font-display font-bold text-2xl mb-3">Page Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
          The educational path you are searching for does not exist or has been moved elsewhere.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <NavLink 
            to="/" 
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:opacity-90"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Home</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard" 
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-violet-500 transition-all shadow-md cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </NavLink>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotFoundPage;
