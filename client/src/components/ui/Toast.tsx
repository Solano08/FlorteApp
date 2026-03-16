import { useEffect } from 'react';
import { motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastComponent = ({ toast, onClose }: ToastProps) => {
  const duration = toast.duration ?? 3000;
  const offscreenSlideX = 420;
  const isDeleteNotification = /elimin/i.test(toast.message);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ x: offscreenSlideX, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: offscreenSlideX, opacity: 1 }}
      transition={{
        layout: { duration: 0.28, ease: [0.2, 0.9, 0.2, 1] },
        x: { duration: 0.62, ease: [0.22, 0.61, 0.36, 1] },
        opacity: { duration: 0.62, ease: [0.22, 0.61, 0.36, 1] }
      }}
      className="relative flex items-center justify-center rounded-2xl bg-white dark:bg-neutral-800 text-[var(--color-text)] px-4 py-3 overflow-hidden max-w-[320px] shadow-[0_10px_24px_rgba(15,23,42,0.16)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
      style={{ transformOrigin: 'right center', willChange: 'transform, opacity' }}
    >
      <p
        className={`text-sm font-medium text-center leading-tight translate-y-[1px] relative z-10 ${
          isDeleteNotification ? 'text-red-600 dark:text-red-400' : 'text-[var(--color-text)]'
        }`}
      >
        {toast.message}
      </p>
    </motion.div>
  );
};

