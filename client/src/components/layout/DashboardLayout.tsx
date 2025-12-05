import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Home, Library, Users, FolderKanban, LogOut, Shield, Compass, MessageCircle } from 'lucide-react';
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
  { to: '/explore', label: 'Explorar', icon: Compass },
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    void logout();
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <div className="flex min-h-screen flex-1 flex-col">
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
              {navigation.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={`nav-${to}`}
                  to={to}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px]',
                      isActive
                        ? 'bg-white text-sena-green shadow-[0_4px_12px_rgba(57,169,0,0.3)]'
                        : 'text-[var(--color-muted)] hover:bg-white/60 hover:text-sena-green dark:hover:bg-white/15'
                    )
                  }
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-2xl bg-white/40 text-sena-green shadow-[0_4px_8px_rgba(18,55,29,0.2)] sm:h-7 sm:w-7">
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span>{label}</span>
                </NavLink>
              ))}
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
                <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[190px] rounded-2xl p-2.5 text-sm text-[var(--color-text)] glass-liquid-strong">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 hover:text-sena-green dark:hover:bg-slate-800"
                    onClick={handleNavigateProfile}
                  >
                    Perfil
                  </button>
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

        <main className="flex-1 overflow-hidden">
          <div
            className={classNames(
              'h-full w-full',
              // Si hay contentClassName personalizado, no aplicar estilos por defecto
              contentClassName
                ? contentClassName
                : classNames(
                    'overflow-y-auto py-4 hide-scrollbar',
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
    </div>
  );
};

