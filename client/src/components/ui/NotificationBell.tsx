import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, MessageSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { GlassDialog } from './GlassDialog';
import { floatingModalContentClass } from '../../utils/modalStyles';
import { useMenuState } from '../../contexts/MenuStateContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type NotificationItem } from '../../services/notificationService';
import { friendService, type FriendRequest } from '../../services/friendService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const NotificationBell = () => {
  const { notificationsOpen, setNotificationsOpen, setMessagesOpen } = useMenuState();
  const [showAll, setShowAll] = useState(false);
  const isBrowser = typeof window !== 'undefined';
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: notificationService.listNotifications,
    refetchInterval: 30_000
  });

  const { data: friendRequests = [] } = useQuery<FriendRequest[]>({
    queryKey: ['friendRequests'],
    queryFn: friendService.listRequests
  });

  const pendingReceivedRequests = useMemo(
    () =>
      friendRequests.filter(
        (req) => req.status === 'pending' && req.receiver?.id && req.receiver.id === user?.id
      ),
    [friendRequests, user?.id]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length + pendingReceivedRequests.length,
    [notifications, pendingReceivedRequests.length]
  );

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (id: string) => friendService.acceptRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      toast.success('Solicitud de amistad aceptada');
    },
    onError: () => {
      toast.error('No se pudo aceptar la solicitud. Intenta nuevamente.');
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (id: string) => friendService.rejectRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      toast.success('Solicitud de amistad rechazada');
    },
    onError: () => {
      toast.error('No se pudo rechazar la solicitud. Intenta nuevamente.');
    }
  });

  useEffect(() => {
    if (!isBrowser || !notificationsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBrowser, notificationsOpen, setNotificationsOpen]);

  const handleToggle = () => {
    setNotificationsOpen(!notificationsOpen);
    setMessagesOpen(false); // Cerrar mensajes si están abiertos
    setShowAll(false);
  };

  const handleViewAll = () => {
    setNotificationsOpen(false);
    setShowAll(true);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="h-11 w-11 rounded-full text-[var(--color-text)] glass-liquid hover:bg-white/30 !focus:ring-0 focus:ring-0 focus:ring-transparent focus:ring-offset-0"
        onClick={handleToggle}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {notificationsOpen && !showAll && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80"
          >
            <div className="p-6 rounded-[32px] glass-notification-dropdown relative space-y-4">
              {/* Efectos de luz adicionales para glass-liquid-deep */}
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.25),_transparent_50%)] opacity-60 dark:opacity-20 mix-blend-overlay z-[1]" />
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.15),_transparent_50%)] opacity-50 dark:opacity-12 mix-blend-overlay z-[1]" />
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70 dark:opacity-25 z-[1]" />
              <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-white/30 dark:border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">Notificaciones</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {unreadCount > 0
                      ? `Tienes ${unreadCount} novedad${unreadCount === 1 ? '' : 'es'} sin leer`
                      : 'No tienes novedades nuevas'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-[10px] text-[var(--color-muted)] glass-liquid hover:text-[var(--color-text)]"
                      onClick={() => markAllAsReadMutation.mutate()}
                    >
                      Marcar leídas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-full text-[var(--color-muted)] glass-liquid hover:text-[var(--color-text)]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto hide-scrollbar">
                {pendingReceivedRequests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Solicitudes de amistad
                    </p>
                    {pendingReceivedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex gap-3 rounded-2xl px-4 py-3 text-left glass-liquid transition hover:bg-white/80 !shadow-none border border-sena-green/40"
                      >
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-sena-green/12 text-sena-green shadow-none">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            {req.sender.firstName} {req.sender.lastName} quiere agregarte como amigo.
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                            Puedes aceptar para iniciar conversaciones privadas y ver su actividad.
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              type="button"
                              size="xs"
                              variant="primary"
                              className="px-3 text-xs"
                              loading={acceptRequestMutation.isPending}
                              onClick={() => acceptRequestMutation.mutate(req.id)}
                            >
                              Aceptar
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="secondary"
                              className="px-3 text-xs"
                              loading={rejectRequestMutation.isPending}
                              onClick={() => rejectRequestMutation.mutate(req.id)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.length === 0 && pendingReceivedRequests.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)]">
                    Aún no tienes notificaciones en tu cuenta.
                  </p>
                ) : (
                  notifications.map((notification) => {
                    const Icon = notification.message.includes('solicitud de amistad')
                      ? Users
                      : MessageSquare;
                    const createdAt = new Date(notification.createdAt);
                    const timeLabel = createdAt.toLocaleString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    });
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        className={`flex w-full gap-3 rounded-2xl px-4 py-3 text-left glass-liquid transition hover:bg-white/80 !shadow-none ${
                          !notification.isRead ? 'border border-sena-green/40' : ''
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/12 text-sena-green shadow-none">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                            {timeLabel}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {notifications.length + pendingReceivedRequests.length > 0 && (
                <div className="border-t border-white/30 dark:border-white/10 pt-4">
                  <Button
                    variant="secondary"
                    className="w-full rounded-2xl py-2.5 text-sm font-semibold text-[var(--color-text)] glass-liquid transition-all duration-500 ease-out hover:bg-white/85 hover:border-white/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.99]"
                    onClick={handleViewAll}
                  >
                    Ver todas las notificaciones
                  </Button>
                </div>
              )}
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
            contentClassName={floatingModalContentClass}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Centro de notificaciones</h3>
                <p className="text-sm text-[var(--color-muted)]">Revisa las novedades recientes de tus grupos y proyectos.</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowAll(false)}
                className="self-start rounded-full px-3 py-1 text-xs text-[var(--color-muted)] glass-liquid hover:text-[var(--color-text)]"
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {pendingReceivedRequests.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Solicitudes de amistad
                  </p>
                  {pendingReceivedRequests.map((req) => {
                    const createdAt = new Date(req.createdAt);
                    const timeLabel = createdAt.toLocaleString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    });
                    return (
                      <div
                        key={`modal-req-${req.id}`}
                        className="flex gap-4 rounded-[24px] px-4 py-4 text-left glass-liquid transition hover:border-sena-green/50 !shadow-none border border-sena-green/40"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sena-green/12 text-sena-green shadow-none">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                              {req.sender.firstName} {req.sender.lastName} quiere agregarte como amigo.
                            </p>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                              {timeLabel}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="xs"
                              variant="primary"
                              className="px-3 text-xs"
                              loading={acceptRequestMutation.isPending}
                              onClick={() => acceptRequestMutation.mutate(req.id)}
                            >
                              Aceptar
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="secondary"
                              className="px-3 text-xs"
                              loading={rejectRequestMutation.isPending}
                              onClick={() => rejectRequestMutation.mutate(req.id)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {notifications.length === 0 && pendingReceivedRequests.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  Aún no tienes notificaciones registradas en tu cuenta.
                </p>
              ) : (
                notifications.map((notification) => {
                  const Icon = notification.message.includes('solicitud de amistad')
                    ? Users
                    : MessageSquare;
                  const createdAt = new Date(notification.createdAt);
                  const timeLabel = createdAt.toLocaleString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short'
                  });
                  return (
                    <div
                      key={`modal-${notification.id}`}
                      className="flex gap-4 rounded-[24px] px-4 py-4 text-left glass-liquid transition hover:border-sena-green/50 !shadow-none"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sena-green/12 text-sena-green shadow-none">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            {notification.message}
                          </p>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                            {timeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassDialog>,
          document.body
        )}
    </div>
  );
};
