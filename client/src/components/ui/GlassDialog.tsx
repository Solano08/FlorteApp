import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import classNames from 'classnames';

type GlassDialogSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<GlassDialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

interface GlassDialogProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  size?: GlassDialogSize;
  overlayClassName?: string;
  contentClassName?: string;
  preventCloseOnBackdrop?: boolean;
  contentMotionProps?: HTMLMotionProps<'div'>;
  frameless?: boolean;
}

export const GlassDialog = ({
  open,
  onClose,
  children,
  size = 'lg',
  overlayClassName,
  contentClassName,
  preventCloseOnBackdrop = false,
  contentMotionProps,
  frameless = false
}: GlassDialogProps) => {
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const handleOverlayClick = () => {
    if (preventCloseOnBackdrop) return;
    onClose?.();
  };

  const { className: motionClassName, ...motionRest } = contentMotionProps ?? {};

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={classNames(
            'fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/30 px-4 py-10 backdrop-blur-[28px]',
            overlayClassName
          )}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 28 }}
            transition={{ type: 'spring', stiffness: 170, damping: 24 }}
            {...motionRest}
            className={classNames(
              'relative w-full',
              frameless
                ? 'rounded-none border-none bg-transparent p-0 shadow-none backdrop-blur-none'
                : 'rounded-[32px] glass-liquid-strong p-6',
              frameless ? '' : sizeClasses[size],
              contentClassName,
              motionClassName
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {!frameless && (
              <>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.3),_transparent_60%)] opacity-70 dark:opacity-20 mix-blend-overlay" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.2),_transparent_60%)] opacity-60 dark:opacity-10 mix-blend-overlay" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 dark:from-white/5 dark:to-transparent opacity-50" />
              </>
            )}
            <div className="relative z-10 space-y-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

