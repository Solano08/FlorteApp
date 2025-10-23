import { useState } from 'react';
import { Bell, CheckCircle, MessageSquare, Users, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

const demoNotifications = [
  {
    id: 'n1',
    title: 'Nuevo comentario en tu proyecto',
    description: 'Laboratorio UX comentó en “SenaConnect”.',
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

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="h-11 w-11 rounded-full bg-white/20 text-[var(--color-text)] shadow-[0_12px_24px_rgba(18,55,29,0.18)] backdrop-blur-md hover:bg-white/30"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-3 w-80">
          <Card className="overflow-hidden border-white/30 bg-white/25 p-0 dark:bg-white/10">
            <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Notificaciones</p>
                <p className="text-xs text-[var(--color-muted)]">Mantente al día con tu comunidad</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-4">
              {demoNotifications.map(({ id, title, description, icon: Icon, time }) => (
                <div
                  key={id}
                  className="flex gap-3 rounded-2xl border border-white/20 bg-white/20 px-3 py-3 transition hover:border-sena-green/40 hover:bg-white/30"
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
              <Button variant="secondary" className="w-full bg-white/30">
                Ver todas las notificaciones
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
