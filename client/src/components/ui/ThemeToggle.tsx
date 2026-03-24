import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = () => {
  const { mode, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--color-text)] transition-all duration-ui hover:bg-white/60 hover:shadow-sm dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sena-green/30 sm:h-9 sm:w-9"
      aria-label="Cambiar aspecto"
    >
      {mode === 'light' ? <Moon className="h-4 w-4 text-[var(--color-text)]" /> : <Sun className="h-4 w-4 text-yellow-400" />}
    </button>
  );
};
