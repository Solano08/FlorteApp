import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import classNames from 'classnames';

type GlassDialogSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<GlassDialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl'
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
}

export const GlassDialog = ({
  open,
  onClose,
  children,
  size = 'lg',
  overlayClassName,
  contentClassName,
  preventCloseOnBackdrop = false,
  contentMotionProps
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
            'fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-10 backdrop-blur-[18px]',
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
              'relative w-full overflow-hidden rounded-[32px] border border-white/25 bg-white/36 p-6 shadow-[0_44px_110px_rgba(15,38,25,0.33)] backdrop-blur-[28px] dark:border-white/10 dark:bg-slate-900/80',
              sizeClasses[size],
              contentClassName,
              motionClassName
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.52),_transparent_58%)] opacity-80 dark:opacity-35" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/28 via-white/14 to-white/20 dark:from-white/10 dark:via-white/6 dark:to-white/14" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/24 via-transparent to-transparent opacity-40 dark:from-white/8" />
            <div className="relative z-10 space-y-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

