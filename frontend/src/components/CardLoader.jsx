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
        <div className="relative w-10 h-10 mb-3 flex items-center justify-center">
          {/* Clockwise spinner ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="absolute inset-0 rounded-full border-3 border-violet-500/20 border-t-violet-500"
          />
          {/* Inner pulsing core dot */}
          <motion.div 
            animate={{ scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="w-2.5 h-2.5 rounded-full bg-violet-600"
          />
        </div>
        
        <p className="font-display font-semibold text-[10px] text-slate-700 dark:text-slate-200 tracking-wider uppercase animate-pulse px-4 text-center">
          {message}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default CardLoader;
