import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingOverlay = ({ message = "Processing..." }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-8 z-[100] flex justify-center pointer-events-none">
        <motion.div 
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/80 shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-3.5 max-w-sm mx-4"
        >
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            {/* Clockwise rotating ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[2.5px] border-violet-500/20 border-t-violet-550"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 tracking-wide uppercase truncate">
              {message}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              Processing local AI inference task...
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoadingOverlay;
