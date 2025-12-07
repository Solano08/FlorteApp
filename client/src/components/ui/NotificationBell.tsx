import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCircle, MessageSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { GlassDialog } from './GlassDialog';
import { floatingModalContentClass } from '../../utils/modalStyles';

const demoNotifications = [
  {
    id: 'n1',
    title: 'Nuevo comentario en tu proyecto',
    description: 'Laboratorio UX comentó en "SenaConnect".',
    icon: MessageSquare,
    time: 'Hace 5 min'
  },
  {
    id: 'n2',
    title: 'Solicitud para unirse al grupo',
    description: 'Andrea Vargas quiere unirse a Frontend Squad.',
    icon: Users,
    time: 'Hace 18 min'
  },
  {
    id: 'n3',
    title: 'Revisión completada',
    description: 'Carlos aprobó la retro de UI Kit.',
    icon: CheckCircle,
    time: 'Hace 1 h'
  }
];

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    if (!isBrowser || !open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBrowser, open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    setShowAll(false);
  };

  const handleViewAll = () => {
    setOpen(false);
    setShowAll(true);
  };

  const notifications = demoNotifications;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="h-11 w-11 rounded-full text-[var(--color-text)] glass-liquid-strong backdrop-blur-[48px] saturate-[2.2] hover:bg-white/30"
        onClick={handleToggle}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {open && !showAll && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80"
          >
            <div className="p-6 rounded-[32px] glass-frosted relative space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-white/30 pb-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">Notificaciones</p>
                  <p className="text-xs text-[var(--color-muted)]">Mantente al día con tu comunidad</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="rounded-full text-[var(--color-muted)] glass-liquid-strong backdrop-blur-[48px] saturate-[2.2] hover:text-sena-green"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto">
                {notifications.map(({ id, title, description, icon: Icon, time }) => (
                  <div
                    key={id}
                    className="flex gap-3 rounded-2xl px-4 py-3 text-left glass-frosted-card transition hover:opacity-95"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/18 text-sena-green shadow-[0_20px_38px_rgba(18,55,29,0.2)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{description}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">{time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/30 pt-4">
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl py-2.5 text-sm font-semibold text-sena-green glass-liquid-strong backdrop-blur-[48px] saturate-[2.2] hover:bg-white/80 dark:text-white"
                  onClick={handleViewAll}
                >
                  Ver todas las notificaciones
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBrowser &&
        createPortal(
          <GlassDialog
            open={showAll}
            onClose={() => setShowAll(false)}
            size="xl"
            contentClassName={`${floatingModalContentClass} glass-frosted`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Centro de notificaciones</h3>
                <p className="text-sm text-[var(--color-muted)]">Revisa las novedades recientes de tus grupos y proyectos.</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowAll(false)}
                className="self-start rounded-full px-3 py-1 text-xs text-[var(--color-muted)] glass-liquid-strong backdrop-blur-[48px] saturate-[2.2] hover:text-sena-green"
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {notifications.map(({ id, title, description, icon: Icon, time }) => (
                <div
                  key={`modal-${id}`}
                  className="flex gap-4 rounded-[24px] px-4 py-4 text-left glass-frosted-card transition hover:border-sena-green/50 hover:opacity-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sena-green/18 text-sena-green shadow-[0_20px_38px_rgba(18,55,29,0.2)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        {time}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassDialog>,
          document.body
        )}
    </div>
  );
};
