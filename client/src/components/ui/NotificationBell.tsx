import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCircle, MessageSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { Card } from './Card';

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
    if (!isBrowser) return;
    const previousOverflow = document.body.style.overflow;
    if (showAll) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBrowser, showAll]);

  useEffect(() => {
    if (!isBrowser) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowAll(false);
      }
    };

    if (open || showAll) {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isBrowser, open, showAll]);

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
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80"
          >
            <Card className="overflow-hidden border-white/30 bg-white/30 p-0 shadow-[0_20px_40px_rgba(18,55,29,0.18)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
              <div className="flex items-center justify-between border-b border-white/25 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">Notificaciones</p>
                  <p className="text-xs text-[var(--color-muted)]">Mantente al dia con tu comunidad</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-4">
                {notifications.map(({ id, title, description, icon: Icon, time }) => (
                  <div
                    key={id}
                    className="flex gap-3 rounded-2xl border border-white/20 bg-white/25 px-3 py-3 text-left transition hover:border-sena-green/40 hover:bg-white/35"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sena-green/15 text-sena-green">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{description}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/20 px-4 py-3">
                <Button variant="secondary" className="w-full bg-white/40" onClick={handleViewAll}>
                  Ver todas las notificaciones
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isBrowser &&
        createPortal(
          <AnimatePresence>
            {showAll && (
              <motion.div
                key="notifications-dialog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-10 backdrop-blur-[14px]"
                onClick={() => setShowAll(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/25 bg-white/32 p-6 shadow-[0_48px_112px_rgba(15,38,25,0.38)] backdrop-blur-[30px] dark:border-white/10 dark:bg-slate-900/80"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_60%)] opacity-75 dark:opacity-30" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-white/15 to-white/20 dark:from-white/10 dark:via-white/6 dark:to-white/12" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">Centro de notificaciones</h3>
                        <p className="text-sm text-[var(--color-muted)]">
                          Revisa las novedades recientes de tus grupos y proyectos.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setShowAll(false)}
                        className="text-[var(--color-muted)] hover:text-sena-green"
                      >
                        Cerrar
                      </Button>
                    </div>
                    <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                      {notifications.map(({ id, title, description, icon: Icon, time }) => (
                        <div
                          key={`modal-${id}`}
                          className="flex gap-4 rounded-3xl border border-white/25 bg-white/28 px-4 py-4 text-left shadow-[0_24px_54px_rgba(18,55,29,0.22)] transition hover:border-sena-green/40 hover:bg-white/36 dark:border-white/15 dark:bg-white/10"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sena-green/15 text-sena-green">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
                              <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">{time}</span>
                            </div>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

    </div>
  );
};














