import React from 'react';
import { motion } from 'framer-motion';

const LoadingOverlay = ({ message = "Processing..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-premium rounded-2xl p-8 max-w-sm flex flex-col items-center border border-white/10 dark:border-white/5"
      >
        <div className="relative w-16 h-16 mb-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500"
          />
        </div>
        <p className="font-display font-medium text-slate-800 dark:text-slate-100 text-center text-lg">{message}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">Local model running inference. Please be patient.</p>
      </motion.div>
    </div>
  );
};

export default LoadingOverlay;
