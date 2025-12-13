import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { Settings, Bell, Lock, Palette, Shield, User } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Ajustes"
      subtitle="Gestiona tus preferencias y configuración de cuenta"
    >
      <div className="space-y-6">
        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Información de cuenta</h3>
              <p className="text-xs text-[var(--color-muted)]">Gestiona tu información personal</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Nombre completo</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/profile'}>
                Editar
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Correo electrónico</p>
                <p className="text-xs text-[var(--color-muted)]">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/profile'}>
                Editar
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Rol</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {user?.role === 'admin' ? 'Administrador' : user?.role === 'instructor' ? 'Instructor' : 'Aprendiz'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Notificaciones</h3>
              <p className="text-xs text-[var(--color-muted)]">Controla cómo y cuándo recibes notificaciones</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Notificaciones de chat</p>
                <p className="text-xs text-[var(--color-muted)]">Recibe notificaciones de nuevos mensajes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sena-green/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sena-green"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Notificaciones de proyectos</p>
                <p className="text-xs text-[var(--color-muted)]">Recibe actualizaciones de tus proyectos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sena-green/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sena-green"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Apariencia</h3>
              <p className="text-xs text-[var(--color-muted)]">Personaliza la apariencia de la aplicación</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Tema</p>
                <p className="text-xs text-[var(--color-muted)]">Elige entre tema claro u oscuro</p>
              </div>
              <p className="text-xs text-[var(--color-muted)]">Usa el botón de tema en la barra superior</p>
            </div>
          </div>
        </Card>

        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Seguridad</h3>
              <p className="text-xs text-[var(--color-muted)]">Gestiona la seguridad de tu cuenta</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Cambiar contraseña</p>
                <p className="text-xs text-[var(--color-muted)]">Actualiza tu contraseña regularmente</p>
              </div>
              <Button variant="ghost" size="sm">
                Cambiar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};














