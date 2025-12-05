import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = () => {
  const { mode, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--color-text)] glass-liquid transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-sena-green/40 focus:ring-offset-2 focus:ring-offset-transparent"
      aria-label="Cambiar aspecto"
    >
      {mode === 'light' ? <Moon className="h-5 w-5 text-[var(--color-text)]" /> : <Sun className="h-5 w-5 text-yellow-400" />}
    </button>
  );
};
