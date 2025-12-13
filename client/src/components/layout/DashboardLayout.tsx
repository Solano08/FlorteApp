import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { GlassDialog } from '../ui/GlassDialog';
import { Home, Library, Users, FolderKanban, LogOut, Shield, MessageCircle, Settings, User, X } from 'lucide-react';
import classNames from 'classnames';
import { UserRole } from '../../types/auth';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../ui/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  fluid?: boolean;
  contentClassName?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const baseNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/chats', label: 'Chats', icon: MessageCircle },
  { to: '/groups', label: 'Grupos', icon: Users },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/library', label: 'Biblioteca', icon: Library }
];

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  instructor: 'Instructor',
  apprentice: 'Aprendiz'
};

export const DashboardLayout = ({
  children,
  title,
  subtitle,
  fluid = false,
  contentClassName
}: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const navigation = useMemo(() => {
    if (!user) return baseNavItems;
    if (user.role === 'admin') {
      return [
        ...baseNavItems,
        { to: '/admin', label: 'Moderacion', icon: Shield }
      ];
    }
    return baseNavItems;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNavigateProfile = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  const handleNavigateSettings = () => {
    setIsProfileMenuOpen(false);
    navigate('/settings');
  };

  const handleViewUserInfo = () => {
    setIsProfileMenuOpen(false);
    setIsUserInfoModalOpen(true);
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    void logout();
  };

  return (
    <div className={classNames("flex bg-[var(--color-background)]", contentClassName?.includes('h-full') ? 'h-screen' : 'min-h-screen')}>
      <div className={classNames("flex flex-1 flex-col", contentClassName?.includes('h-full') ? 'h-screen' : 'min-h-screen')}>
        <header className="sticky top-0 z-40 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 glass-liquid transition-[padding] duration-150 md:px-5">
          <div className="flex items-center gap-2">
            <img
              src="/logoFlorte.png"
              alt="Florte"
              className="h-9 w-9 object-cover md:h-10 md:w-10"
            />
            <span className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text)] md:text-base">
              Florte
            </span>
          </div>
          <nav className="flex justify-center">
            <div className="flex items-center gap-1 overflow-x-auto rounded-full px-2.5 py-3 sm:gap-1.5 sm:px-3 sm:py-3.5 hide-scrollbar">
              {navigation.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
                return (
                  <NavLink
                    key={`nav-${to}`}
                    to={to}
                    className={classNames(
                      'flex items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px]',
                      isActive
                        ? 'bg-white text-sena-green shadow-[0_4px_12px_rgba(57,169,0,0.3)] dark:bg-[var(--color-accent-soft)] dark:text-sena-dark dark:shadow-[0_4px_12px_rgba(57,169,0,0.2)]'
                        : 'text-[var(--color-muted)] hover:bg-white/60 hover:text-sena-green dark:text-[var(--color-text)] dark:hover:bg-white/15'
                    )}
                  >
                    <span
                      className={classNames(
                        'flex h-6 w-6 items-center justify-center rounded-2xl shadow-[0_4px_8px_rgba(18,55,29,0.2)] sm:h-7 sm:w-7',
                        isActive
                          ? 'bg-white/40 text-sena-green dark:bg-sena-green/20 dark:text-sena-green'
                          : 'bg-white/40 text-sena-green dark:bg-[var(--color-accent-soft)] dark:text-sena-dark'
                      )}
                    >
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
          <div className="flex items-center justify-end gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="relative hidden lg:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2.5 rounded-2xl px-2.5 py-1.5 text-left transition hover:bg-white/20 glass-liquid"
              >
                <div className="flex flex-1 flex-col items-start justify-center">
                  <p className="text-xs font-semibold text-[var(--color-text)] leading-tight md:text-sm">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <img
                  src={user?.avatarUrl ?? 'https://avatars.dicebear.com/api/initials/SENA.svg'}
                  alt={user?.firstName}
                  className="h-7 w-7 rounded-full object-cover shadow-[0_6px_14px_rgba(18,55,29,0.14)] md:h-8 md:w-8"
                />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[190px] rounded-2xl p-2.5 text-sm text-[var(--color-text)] glass-frosted">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 hover:text-sena-green dark:hover:bg-slate-800"
                    onClick={handleNavigateProfile}
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Perfil
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 hover:text-sena-green dark:hover:bg-slate-800"
                    onClick={handleViewUserInfo}
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Ver información
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 hover:text-sena-green dark:hover:bg-slate-800"
                    onClick={handleNavigateSettings}
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Ajustes
                    </span>
                  </button>
                  <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-slate-800"
                    onClick={handleLogout}
                  >
                    <span>Cerrar sesion</span>
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden min-h-0">
          <div
            className={classNames(
              'h-full w-full',
              // Si hay contentClassName personalizado, no aplicar estilos por defecto
              contentClassName
                ? contentClassName
                : classNames(
                    'overflow-y-auto py-4',
                    fluid
                      ? 'mx-0 px-4 sm:px-6 lg:px-10 xl:px-16'
                      : 'mx-auto max-w-5xl px-4 sm:px-6'
                  )
            )}
          >
            {(title || subtitle) && (
              <div className="mb-3 space-y-1">
                {title && <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">{title}</h2>}
                {subtitle && <p className="text-xs text-[var(--color-muted)] sm:text-sm">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </main>

        <footer className="flex flex-col items-center gap-3 px-6 py-5 text-xs text-[var(--color-muted)] glass-liquid lg:hidden">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex w-full items-center justify-between gap-3 rounded-2xl glass-liquid px-3 py-2 text-left transition hover:border-sena-green/40 hover:bg-white/30"
          >
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-[var(--color-text)] leading-tight md:text-base">
                {user?.firstName} {user?.lastName}
              </p>
              {user && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sena-green">
                  {roleLabels[user.role]}
                </span>
              )}
            </div>
            <img
              src={user?.avatarUrl ?? 'https://avatars.dicebear.com/api/initials/SENA.svg'}
              alt={user?.firstName}
              className="h-9 w-9 rounded-full object-cover"
            />
          </button>
          <Button
            variant="ghost"
            className="w-full justify-center gap-2 text-sm text-red-400 hover:text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Cerrar sesion
          </Button>
        </footer>
      </div>

      <GlassDialog
        open={isUserInfoModalOpen}
        onClose={() => setIsUserInfoModalOpen(false)}
        size="md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Información del usuario</h3>
            <p className="text-sm text-[var(--color-muted)]">Detalles de tu cuenta</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsUserInfoModalOpen(false)}
            className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
          >
            <X className="h-4 w-4" /> Cerrar
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl ?? 'https://avatars.dicebear.com/api/initials/SENA.svg'}
              alt={user?.firstName}
              className="h-16 w-16 rounded-full object-cover shadow-lg"
            />
            <div>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-[var(--color-muted)]">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl glass-liquid p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text)]">Rol</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                {roleLabels[user?.role ?? 'apprentice']}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text)]">Estado</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                user?.isActive 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {user?.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {user?.headline && (
              <div>
                <span className="text-sm font-medium text-[var(--color-text)]">Titular</span>
                <p className="text-sm text-[var(--color-muted)] mt-1">{user.headline}</p>
              </div>
            )}
            {user?.bio && (
              <div>
                <span className="text-sm font-medium text-[var(--color-text)]">Biografía</span>
                <p className="text-sm text-[var(--color-muted)] mt-1">{user.bio}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsUserInfoModalOpen(false);
                navigate('/profile');
              }}
            >
              Editar perfil
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setIsUserInfoModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </GlassDialog>
    </div>
  );
};

