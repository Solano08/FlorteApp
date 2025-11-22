import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCircle, MessageSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { GlassDialog } from './GlassDialog';

const demoNotifications = [
  {
    id: 'n1',
    title: 'Nuevo comentario en tu proyecto',
    description: 'Laboratorio UX comento en "SenaConnect".',
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
    title: 'Revision completada',
    description: 'Carlos aprobo la retro de UI Kit.',
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
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
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
        className="h-11 w-11 rounded-full bg-white/20 text-[var(--color-text)] shadow-[0_12px_24px_rgba(18,55,29,0.18)] backdrop-blur-md hover:bg-white/30"
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
            <div className="relative overflow-hidden rounded-[32px] border border-white/35 bg-white/55 p-5 shadow-[0_36px_80px_rgba(15,38,25,0.25)] backdrop-blur-[30px] dark:border-white/10 dark:bg-slate-900/70">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_62%)] opacity-85 dark:opacity-40" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-white/16 to-white/10 dark:from-white/10 dark:via-white/6 dark:to-white/12" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-white/30 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Notificaciones</p>
                    <p className="text-xs text-[var(--color-muted)]">Mantente al dia con tu comunidad</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white/30 text-[var(--color-muted)] backdrop-blur hover:text-sena-green"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {notifications.map(({ id, title, description, icon: Icon, time }) => (
                    <div
                      key={id}
                      className="relative flex gap-3 rounded-2xl border border-white/45 bg-white/65 px-4 py-3 text-left shadow-[0_20px_42px_rgba(18,55,29,0.18)] backdrop-blur-[20px] transition hover:border-sena-green/60 hover:bg-white/80 dark:border-white/15 dark:bg-white/10"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/18 text-sena-green shadow-[0_16px_26px_rgba(18,55,29,0.22)]">
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
                    className="w-full rounded-2xl bg-white/60 py-2.5 text-sm font-semibold text-sena-green shadow-[0_18px_30px_rgba(18,55,29,0.25)] backdrop-blur hover:bg-white/80 dark:bg-white/10 dark:text-white"
                    onClick={handleViewAll}
                  >
                    Ver todas las notificaciones
                  </Button>
                </div>
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
            contentClassName="p-7"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Centro de notificaciones</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Revisa las novedades recientes de tus grupos y proyectos.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowAll(false)}
                className="self-start rounded-full bg-white/15 px-3 py-1 text-xs text-[var(--color-muted)] shadow-[0_10px_24px_rgba(18,55,29,0.18)] backdrop-blur hover:text-sena-green"
              >
                Cerrar
              </Button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {notifications.map(({ id, title, description, icon: Icon, time }) => (
                <div
                  key={`modal-${id}`}
                  className="flex gap-4 rounded-[24px] border border-white/25 bg-white/40 px-4 py-4 text-left shadow-[0_28px_60px_rgba(18,55,29,0.22)] backdrop-blur transition hover:border-sena-green/50 dark:border-white/15 dark:bg-white/10"
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














