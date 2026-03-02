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
        'fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/8 dark:bg-slate-900/12 backdrop-blur-[12px]',
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
              : contentClassName?.includes('glass-dialog-delete')
                ? `rounded-[32px] p-6`
                : 'rounded-[32px] p-6 glass-liquid-deep',
            frameless ? '' : sizeClasses[size],
            contentClassName,
            motionClassName
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Efectos de luz adicionales para glass-liquid-deep */}
          {(size === 'lg' || size === 'xl') && !frameless && (
            <>
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.25),_transparent_50%)] opacity-60 dark:opacity-20 mix-blend-overlay z-[1]" />
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.15),_transparent_50%)] opacity-50 dark:opacity-12 mix-blend-overlay z-[1]" />
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70 dark:opacity-25 z-[1]" />
            </>
          )}
          <div className="relative z-10 space-y-6">{children}</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

