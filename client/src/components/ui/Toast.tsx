import { useEffect } from 'react';
import classNames from 'classnames';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const toastStyles = {
  success:
    'bg-gradient-to-r from-sena-green to-emerald-500 text-white border-white/25 shadow-[0_12px_30px_rgba(16,185,129,0.35)]',
  error: 'bg-red-500/15 text-red-500 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  info: 'bg-blue-500/15 text-blue-500 border-blue-500/30'
};

export const ToastComponent = ({ toast, onClose }: ToastProps) => {
  const Icon = toastIcons[toast.type];
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onClose]);

  return (
    <div
      className={classNames(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-300 ease-out toast-enter',
        toastStyles[toast.type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

