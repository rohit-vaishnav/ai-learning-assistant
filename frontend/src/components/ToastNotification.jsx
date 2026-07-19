import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
  };

  const bgMap = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-100',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-100',
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-900 dark:text-sky-100'
  };

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
          className={`pointer-events-auto relative flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg max-w-sm ${bgMap[toast.type]}`}
        >
          {iconMap[toast.type]}
          <span className="text-sm font-medium pr-6">{toast.message}</span>
          <button 
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;
