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

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={classNames(
        'fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/35 dark:bg-slate-900/55 backdrop-blur-[28px]',
        overlayClassName
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0
      }}
      onClick={handleOverlayClick}
    >
      <div className="overflow-y-auto w-full h-full flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 170, damping: 24 }}
          {...motionRest}
          className={classNames(
            'relative w-full overflow-hidden',
            frameless
              ? 'rounded-none border-none bg-transparent p-0 shadow-none backdrop-blur-none'
              : `rounded-[32px] p-6 ${(size === 'lg' || size === 'xl') ? 'glass-liquid-deep' : 'glass-liquid-strong'}`,
            frameless ? '' : sizeClasses[size],
            contentClassName,
            motionClassName
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative z-10 space-y-6">{children}</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

