import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
export const ThemeToggle = () => {
    const { mode, toggle } = useTheme();
    return (_jsx("button", { type: "button", onClick: toggle, className: "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/20 text-[var(--color-text)] shadow-[0_12px_24px_rgba(18,55,29,0.18)] backdrop-blur-md transition-colors hover:border-sena-green/50 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-sena-green/40 focus:ring-offset-2 focus:ring-offset-transparent dark:border-white/15 dark:bg-white/10", "aria-label": "Cambiar aspecto", children: mode === 'light' ? _jsx(Moon, { className: "h-5 w-5 text-[var(--color-text)]" }) : _jsx(Sun, { className: "h-5 w-5 text-yellow-400" }) }));
};
