import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCircle, MessageSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { Card } from './Card';
const demoNotifications = [
    {
        id: 'n1',
        title: 'Nuevo comentario en tu proyecto',
        description: 'Laboratorio UX comento en "SenaConnect".',
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
        title: 'Revision completada',
        description: 'Carlos aprobo la retro de UI Kit.',
        icon: CheckCircle,
        time: 'Hace 1 h'
    }
];
export const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const isBrowser = typeof window !== 'undefined';
    useEffect(() => {
        if (!isBrowser)
            return;
        const previousOverflow = document.body.style.overflow;
        if (showAll) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isBrowser, showAll]);
    useEffect(() => {
        if (!isBrowser)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                setShowAll(false);
            }
        };
        if (open || showAll) {
            window.addEventListener('keydown', onKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isBrowser, open, showAll]);
    const handleToggle = () => {
        setOpen((prev) => !prev);
        setShowAll(false);
    };
    const handleViewAll = () => {
        setOpen(false);
        setShowAll(true);
    };
    const notifications = demoNotifications;
    return (_jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "ghost", className: "h-11 w-11 rounded-full bg-white/20 text-[var(--color-text)] shadow-[0_12px_24px_rgba(18,55,29,0.18)] backdrop-blur-md hover:bg-white/30", onClick: handleToggle, "aria-label": "Notificaciones", children: _jsx(Bell, { className: "h-5 w-5" }) }), _jsx(AnimatePresence, { children: open && !showAll && (_jsx(motion.div, { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.15 }, className: "absolute right-0 mt-3 w-80", children: _jsxs(Card, { className: "overflow-hidden border-white/30 bg-white/30 p-0 shadow-[0_20px_40px_rgba(18,55,29,0.18)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/25 px-5 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Notificaciones" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Mantente al dia con tu comunidad" })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "max-h-72 space-y-3 overflow-y-auto px-4 py-4", children: notifications.map(({ id, title, description, icon: Icon, time }) => (_jsxs("div", { className: "flex gap-3 rounded-2xl border border-white/20 bg-white/25 px-3 py-3 text-left transition hover:border-sena-green/40 hover:bg-white/35", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-sena-green/15 text-sena-green", children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: title }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: description }), _jsx("p", { className: "mt-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: time })] })] }, id))) }), _jsx("div", { className: "border-t border-white/20 px-4 py-3", children: _jsx(Button, { variant: "secondary", className: "w-full bg-white/40", onClick: handleViewAll, children: "Ver todas las notificaciones" }) })] }) })) }), isBrowser &&
                createPortal(_jsx(AnimatePresence, { children: showAll && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-10 backdrop-blur-lg", onClick: () => setShowAll(false), children: _jsxs(motion.div, { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 24 }, transition: { type: 'spring', stiffness: 160, damping: 22 }, className: "relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/20 bg-white/12 p-6 shadow-[0_48px_96px_rgba(12,32,20,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75", onClick: (event) => event.stopPropagation(), children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)] opacity-70 dark:opacity-25" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-white/4 to-white/10 dark:from-white/5 dark:via-white/2 dark:to-white/4" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Centro de notificaciones" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Revisa las novedades recientes de tus grupos y proyectos." })] }), _jsx(Button, { variant: "ghost", onClick: () => setShowAll(false), children: "Cerrar" })] }), _jsx("div", { className: "mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1", children: notifications.map(({ id, title, description, icon: Icon, time }) => (_jsxs("div", { className: "flex gap-4 rounded-3xl border border-white/25 bg-white/25 px-4 py-4 text-left shadow-[0_18px_38px_rgba(18,55,29,0.2)] transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-sena-green/15 text-sena-green", children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: title }), _jsx("span", { className: "text-[11px] uppercase tracking-wide text-[var(--color-muted)]", children: time })] }), _jsx("p", { className: "mt-1 text-xs text-[var(--color-muted)]", children: description })] })] }, `modal-${id}`))) })] })] }) }, "notifications-dialog")) }), document.body)] }));
};
