'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id?: string;
  message: string;
  type: ToastType;
  onClose: (id?: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const toastId = id || `toast-${Date.now()}-${Math.random()}`;
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toastId);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastId, onClose]);

  const variants = {
    initial: { opacity: 0, y: 50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
  };

  const styles = {
    success: 'bg-white dark:bg-gray-800 border-l-4 border-green-500 text-green-600 dark:text-green-400',
    error: 'bg-white dark:bg-gray-800 border-l-4 border-red-500 text-red-600 dark:text-red-400',
    warning: 'bg-white dark:bg-gray-800 border-l-4 border-yellow-500 text-yellow-600 dark:text-yellow-400',
    info: 'bg-white dark:bg-gray-800 border-l-4 border-blue-500 text-blue-600 dark:text-blue-400',
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <motion.div
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`${styles[type]} p-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px] pointer-events-auto`}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="font-medium text-sm text-gray-800 dark:text-white flex-1">{message}</p>
      <button
        onClick={() => onClose(toastId)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;