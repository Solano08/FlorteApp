import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Bell, CheckCircle, MessageSquare, Users, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
const demoNotifications = [
    {
        id: 'n1',
        title: 'Nuevo comentario en tu proyecto',
        description: 'Laboratorio UX comentó en “SenaConnect”.',
        icon: MessageSquare,
        time: 'Hace 5 min'
    },
    {
        id: 'n2',
        title: 'Solicitud para unirse al grupo',
        description: 'Andrea Vargas quiere unirse a Frontend Squad.',
        icon: Users,
        time: 'Hace 18 min'
    },
    {
        id: 'n3',
        title: 'Revisión completada',
        description: 'Carlos aprobó la retro de UI Kit.',
        icon: CheckCircle,
        time: 'Hace 1 h'
    }
];
export const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "ghost", className: "h-11 w-11 rounded-full bg-white/20 text-[var(--color-text)] shadow-[0_12px_24px_rgba(18,55,29,0.18)] backdrop-blur-md hover:bg-white/30", onClick: () => setOpen((prev) => !prev), "aria-label": "Notificaciones", children: _jsx(Bell, { className: "h-5 w-5" }) }), open && (_jsx("div", { className: "absolute right-0 mt-3 w-80", children: _jsxs(Card, { className: "overflow-hidden border-white/30 bg-white/25 p-0 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/20 px-5 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Notificaciones" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Mantente al d\u00EDa con tu comunidad" })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "max-h-72 space-y-3 overflow-y-auto px-4 py-4", children: demoNotifications.map(({ id, title, description, icon: Icon, time }) => (_jsxs("div", { className: "flex gap-3 rounded-2xl border border-white/20 bg-white/20 px-3 py-3 transition hover:border-sena-green/40 hover:bg-white/30", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-sena-green/15 text-sena-green", children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: title }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: description }), _jsx("p", { className: "mt-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: time })] })] }, id))) }), _jsx("div", { className: "border-t border-white/20 px-4 py-3", children: _jsx(Button, { variant: "secondary", className: "w-full bg-white/30", children: "Ver todas las notificaciones" }) })] }) }))] }));
};
