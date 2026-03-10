import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PAGE_TRANSITION } from '../../utils/transitionConfig';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { GlassDialog } from '../ui/GlassDialog';
import { UserAvatar } from '../ui/UserAvatar';
import { Home, Library, FolderKanban, LogOut, Shield, MessageCircle, Settings, User, Users, X } from 'lucide-react';
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
  { to: '/communities', label: 'Comunidades', icon: Users },
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
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const navigation = useMemo(() => {
    if (!user) return baseNavItems;
    if (user.role === 'admin') {
      return [
        ...baseNavItems,
        { to: '/admin', label: 'Moderación', icon: Shield }
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

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    void logout();
  };

  const isChatsPage = location.pathname.startsWith('/chats');

  return (
    <div
      className={classNames(
        'flex bg-[var(--color-background)]',
        contentClassName?.includes('h-full') ? 'h-screen' : 'min-h-screen'
      )}
      data-page={isChatsPage ? 'chats' : undefined}
    >
      <div className={classNames("flex flex-1 flex-col", contentClassName?.includes('h-full') ? 'h-screen' : 'min-h-screen')}>
        <header className="nav-glass sticky top-0 z-40 w-full transition-[padding] duration-150">
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 overflow-visible px-4 py-2.5 sm:px-6 lg:px-8">
            {/* Izquierda: logo Florte */}
            <NavLink
              to="/dashboard"
              className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-white/30 dark:hover:bg-white/5"
              aria-label="Ir a inicio"
            >
              <img
                src="/logoFlorte.png"
                alt="Florte"
                className="h-7 w-7 shrink-0 rounded-md object-cover sm:h-8 sm:w-8"
              />
              <span className="hidden truncate text-xs font-semibold uppercase tracking-wide text-[var(--color-text)] sm:inline md:text-sm">
                Florte
              </span>
            </NavLink>
            {/* Centro: botones de navegación centrados y compactos */}
            <nav className="relative z-10 flex shrink-0 items-center justify-center gap-1 overflow-x-auto overflow-y-visible hide-scrollbar sm:gap-1.5 min-w-0 py-3 px-4" aria-label="Navegación principal">
              {navigation.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
                return (
                  <NavLink
                    key={`nav-${to}`}
                    to={to}
                    className={classNames(
                      'nav-btn relative flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] transition-colors duration-200 sm:gap-2 sm:px-3 sm:py-2 sm:text-[11px] whitespace-nowrap',
                      isActive
                        ? 'nav-btn-active text-sena-green font-semibold dark:text-sena-green'
                        : 'text-neutral-600 font-medium hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        layout
                        className="nav-btn-indicator absolute inset-0 rounded-full z-0"
                        transition={{
                          type: 'tween',
                          duration: PAGE_TRANSITION.duration,
                          ease: PAGE_TRANSITION.ease
                        }}
                      />
                    )}
                    <span
                      className={classNames(
                        'relative z-10',
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sena-green transition-colors sm:h-7 sm:w-7',
                        isActive ? 'nav-btn-icon-active' : 'nav-btn-icon'
                      )}
                    >
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                    <span className="relative z-10">{label}</span>
                  </NavLink>
                );
              })}
            </nav>
            {/* Derecha: notificaciones, tema y perfil */}
            <div className="relative flex shrink-0 items-center justify-end gap-2 overflow-visible sm:gap-3 justify-self-end">
            <NotificationBell />
            <ThemeToggle />
            <div className="relative hidden lg:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1.5 text-left transition-all duration-200 hover:bg-white/60 hover:shadow-sm dark:hover:bg-white/10"
              >
                {user && (
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    avatarUrl={user.avatarUrl}
                    size="xs"
                  />
                )}
                <div className="flex min-w-0 flex-col items-start justify-center overflow-hidden">
                  <p className="truncate max-w-[120px] text-[11px] font-semibold text-[var(--color-text)] leading-tight md:text-xs">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {user && (
                    <span className="truncate max-w-[120px] text-[9px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                      {roleLabels[user.role]}
                    </span>
                  )}
                </div>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[190px] rounded-2xl p-2.5 text-sm text-[var(--color-text)] glass-frosted">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left transition hover:bg-slate-50 hover:text-sena-green dark:hover:bg-neutral-800"
                    onClick={handleNavigateProfile}
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Perfil
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left transition hover:bg-slate-50 hover:text-sena-green dark:hover:bg-neutral-800"
                    onClick={handleNavigateSettings}
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Ajustes
                    </span>
                  </button>
                  <div className="my-1 h-px bg-slate-200 dark:bg-neutral-700" />
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-neutral-800"
                    onClick={handleLogout}
                  >
                    <span>Cerrar sesión</span>
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </header>

        <main className="app-main -mt-px flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-h-[50vh] border-t-0" style={{ boxShadow: 'none', WebkitBoxShadow: 'none' }}>
          <div
            className={classNames(
              'h-full min-h-0 w-full',
              // Si hay contentClassName personalizado, no aplicar estilos por defecto
              contentClassName
                ? contentClassName
                : classNames(
                    'overflow-hidden py-4',
                    fluid
                      ? 'mx-0 px-4 sm:px-6 lg:px-10 xl:px-16'
                      : 'mx-auto max-w-5xl px-4 sm:px-6'
                  )
            )}
            style={{ boxShadow: 'none', WebkitBoxShadow: 'none' }}
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
                <span className="mt-2 inline-flex items-center gap-1 rounded-2xl bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sena-green">
                  {roleLabels[user.role]}
                </span>
              )}
            </div>
            {user && (
              <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
                size="md"
              />
            )}
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
    </div>
  );
};


