import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CardLoader = ({ message = "Processing..." }) => {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-[2px] rounded-2xl"
      >
        <div className="relative w-10 h-10 mb-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="absolute inset-0 rounded-full border-3 border-violet-500/20 border-t-violet-500"
          />
        </div>
        <p className="font-display font-semibold text-xs text-slate-700 dark:text-slate-200 tracking-wider uppercase animate-pulse">
          {message}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default CardLoader;
