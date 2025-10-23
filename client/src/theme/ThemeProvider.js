import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const ThemeContext = createContext(undefined);
const THEME_KEY = 'florte:theme';
const getSystemPreference = () => {
    if (typeof window === 'undefined')
        return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
const getInitialTheme = () => {
    if (typeof window === 'undefined')
        return 'light';
    const saved = localStorage.getItem(THEME_KEY);
    return saved ?? getSystemPreference();
};
export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(getInitialTheme);
    useEffect(() => {
        const root = document.documentElement;
        if (mode === 'dark') {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        localStorage.setItem(THEME_KEY, mode);
    }, [mode]);
    const value = useMemo(() => ({
        mode,
        toggle: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
        setMode
    }), [mode]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe usarse dentro de un ThemeProvider');
    }
    return context;
};
