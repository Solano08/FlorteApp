import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BadgePlus, CalendarRange, Compass, Filter, Users } from 'lucide-react';
const trendingTopics = [
    { tag: '#InnovaciónSENA', posts: 128 },
    { tag: '#TalentoVerde', posts: 96 },
    { tag: '#FrontendChallenge', posts: 74 },
    { tag: '#AIHub', posts: 51 }
];
const recommendedGroups = [
    {
        name: 'Laboratorio de Innovación',
        members: 48,
        description: 'Experimenta con prototipos y comparte tus ideas con mentores.'
    },
    {
        name: 'Front-End Lovers',
        members: 63,
        description: 'Retos semanales, revisiones de código y mentorías 1:1.'
    },
    {
        name: 'Talento Verde',
        members: 32,
        description: 'Proyectos sostenibles y comunidades de impacto ambiental.'
    }
];
const recommendedProjects = [
    {
        title: 'SenaConnect',
        status: 'En progreso',
        description: 'Aplicación móvil para conectar aprendices con instructores.'
    },
    {
        title: 'GreenLab',
        status: 'Buscando colaboradores',
        description: 'Plataforma para monitorear huertas urbanas en tiempo real.'
    },
    {
        title: 'VR Workshop',
        status: 'Recién iniciado',
        description: 'Experiencias inmersivas para el aula de formación.'
    }
];
export const ExplorePage = () => {
    return (_jsx(DashboardLayout, { title: "Explorar", subtitle: "Descubre nuevas tendencias, grupos y proyectos para inspirarte.", children: _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "flex flex-col gap-6 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green", children: [_jsx(Compass, { className: "h-4 w-4" }), " Tendencias"] }), _jsx("h2", { className: "mt-3 text-2xl font-semibold text-[var(--color-text)]", children: "Encuentra lo pr\u00F3ximo que quieres aprender" }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-muted)]", children: "Explora cursos, comunidades, retos y nuevos proyectos impulsados por aprendices SENA." })] }), _jsxs("div", { className: "flex w-full flex-col gap-3 md:max-w-sm", children: [_jsx(Input, { placeholder: "Buscar proyectos, grupos o temas..." }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "secondary", className: "flex-1", leftIcon: _jsx(Filter, { className: "h-4 w-4" }), children: "Filtros" }), _jsx(Button, { className: "flex-1", leftIcon: _jsx(BadgePlus, { className: "h-4 w-4" }), children: "Crear publicaci\u00F3n" })] })] })] }) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-[2fr_1fr]", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Tendencias de hoy" }), _jsx("span", { className: "text-xs uppercase tracking-wide text-[var(--color-muted)]", children: "Actualizado cada 10 minutos" })] }), _jsx("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: trendingTopics.map((topic) => (_jsxs("button", { className: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition hover:border-sena-green/50 hover:bg-[var(--color-accent-soft)]", children: [_jsx("p", { className: "text-sm font-semibold text-sena-green", children: topic.tag }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: [topic.posts, " publicaciones"] })] }, topic.tag))) })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Proyectos recomendados" }), _jsx(Button, { variant: "ghost", size: "sm", children: "Ver todos" })] }), _jsx("div", { className: "mt-4 space-y-4", children: recommendedProjects.map((project) => (_jsxs("div", { className: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("p", { className: "text-base font-semibold text-[var(--color-text)]", children: project.title }), _jsx("span", { className: "rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green", children: project.status })] }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-muted)]", children: project.description }), _jsxs("div", { className: "mt-4 flex gap-3", children: [_jsx(Button, { size: "sm", variant: "primary", children: "Ver detalles" }), _jsx(Button, { size: "sm", variant: "secondary", children: "Guardar" })] })] }, project.title))) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Eventos destacados" }), _jsx(CalendarRange, { className: "h-4 w-4 text-sena-green" })] }), _jsxs("div", { className: "mt-4 space-y-4 text-sm", children: [_jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: "Bootcamp de innovaci\u00F3n digital" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "25 de Octubre \u00B7 9:00 AM" })] }), _jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: "Taller de UI Design con Figma" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "28 de Octubre \u00B7 2:00 PM" })] }), _jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: "Demo Day proyectos SENA" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "2 de Noviembre \u00B7 4:30 PM" })] })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Grupos que te pueden gustar" }), _jsx(Users, { className: "h-4 w-4 text-sena-green" })] }), _jsx("div", { className: "mt-4 space-y-4", children: recommendedGroups.map((group) => (_jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: group.name }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: [group.members, " miembros \u00B7 Activo ahora"] }), _jsx("p", { className: "mt-2 text-xs text-[var(--color-text)]", children: group.description }), _jsx(Button, { size: "sm", className: "mt-3 w-full", children: "Solicitar acceso" })] }, group.name))) })] })] })] })] }) }));
};
