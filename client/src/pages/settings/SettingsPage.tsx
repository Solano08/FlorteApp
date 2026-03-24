import classNames from 'classnames';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Settings, Bell, Lock, Moon, Palette, Sun, User } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <DashboardLayout
      title="Ajustes"
      subtitle="Gestiona tus preferencias y configuración de cuenta"
    >
      <div className="space-y-6">
        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/15 text-sena-green">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/15 text-sena-green">
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sena-green/20 rounded-2xl peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-2xl after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sena-green"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Notificaciones de proyectos</p>
                <p className="text-xs text-[var(--color-muted)]">Recibe actualizaciones de tus proyectos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sena-green/20 rounded-2xl peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-2xl after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sena-green"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/15 text-sena-green">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Apariencia</h3>
              <p className="text-xs text-[var(--color-muted)]">Personaliza la apariencia de la aplicación</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Tema</p>
                <p className="text-xs text-[var(--color-muted)]">Elige entre tema claro u oscuro</p>
              </div>
              <div
                className="inline-flex shrink-0 rounded-2xl border border-white/35 bg-white/45 p-1 dark:border-white/10 dark:bg-neutral-800/50"
                role="group"
                aria-label="Tema de la aplicación"
              >
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={classNames(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition',
                    mode === 'light'
                      ? 'bg-white text-[var(--color-text)] shadow-sm ring-1 ring-black/5 dark:bg-neutral-700 dark:text-white dark:ring-white/10'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  )}
                >
                  <Sun className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={classNames(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition',
                    mode === 'dark'
                      ? 'bg-white text-[var(--color-text)] shadow-sm ring-1 ring-black/5 dark:bg-neutral-700 dark:text-white dark:ring-white/10'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  )}
                >
                  <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Oscuro
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-liquid">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sena-green/15 text-sena-green">
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
































