import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
export const ThemeToggle = () => {
    const { mode, toggle } = useTheme();
    return (_jsx("button", { type: "button", onClick: toggle, className: "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-2 transition-colors hover:border-sena-green", "aria-label": "Cambiar tema", children: mode === 'light' ? _jsx(Moon, { className: "h-5 w-5 text-[var(--color-text)]" }) : _jsx(Sun, { className: "h-5 w-5 text-yellow-400" }) }));
};
