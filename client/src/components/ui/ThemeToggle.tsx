import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = () => {
  const { mode, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-2 transition-colors hover:border-sena-green"
      aria-label="Cambiar tema"
    >
      {mode === 'light' ? <Moon className="h-5 w-5 text-[var(--color-text)]" /> : <Sun className="h-5 w-5 text-yellow-400" />}
    </button>
  );
};
