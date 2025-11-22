import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { projectService } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { FolderKanban, GitBranch, Sparkles, Milestone, Rocket } from 'lucide-react';
const projectSchema = z.object({
    title: z.string().min(3, 'El título es obligatorio'),
    description: z.string().max(600).optional(),
    repositoryUrl: z.string().url('Ingresa un repositorio válido').optional(),
    status: z.enum(['draft', 'in_progress', 'completed']).optional()
});
const statusLabels = {
    draft: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completado'
};
const statusOrder = ['draft', 'in_progress', 'completed'];
const milestoneTips = [
    'Define un objetivo claro y entregables medibles.',
    'Comparte avances con tu grupo al menos una vez por semana.',
    'Documenta aprendizajes clave en la biblioteca del proyecto.'
];
export const ProjectsPage = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('all');
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.listProjects
    });
    const createProjectMutation = useMutation({
        mutationFn: projectService.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => { });
            queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => { });
        }
    });
    const updateProjectMutation = useMutation({
        mutationFn: ({ id, status }) => projectService.updateProject(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => { });
        }
    });
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: '',
            description: '',
            repositoryUrl: '',
            status: 'draft'
        }
    });
    const filteredProjects = useMemo(() => {
        if (statusFilter === 'all')
            return projects;
        return projects.filter((project) => project.status === statusFilter);
    }, [projects, statusFilter]);
    const stats = useMemo(() => {
        return statusOrder.reduce((acc, status) => ({
            ...acc,
            [status]: projects.filter((project) => project.status === status).length
        }), { draft: 0, in_progress: 0, completed: 0 });
    }, [projects]);
    return (_jsx(DashboardLayout, { title: "Proyectos", subtitle: "Gestiona tus iniciativas, conecta repositorios y da seguimiento a su progreso.", children: _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green", children: [_jsx(Rocket, { className: "h-4 w-4" }), " Laboratorio de proyectos"] }), _jsx("h2", { className: "mt-3 text-2xl font-semibold text-[var(--color-text)]", children: "Impulsa tu proyecto desde la idea hasta la demo final" }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-muted)]", children: "Centraliza requerimientos, tareas y repositorios para trabajar con tu equipo de forma \u00E1gil." })] }), _jsx("div", { className: "grid w-full max-w-xl gap-4 sm:grid-cols-3", children: statusOrder.map((status) => (_jsxs("button", { type: "button", onClick: () => setStatusFilter((prev) => (prev === status ? 'all' : status)), className: `rounded-2xl border px-4 py-3 text-left transition ${statusFilter === status
                                        ? 'border-sena-green bg-sena-green/10 text-sena-green'
                                        : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-sena-green/50'}`, children: [_jsx("p", { className: "text-xs uppercase tracking-wide", children: statusLabels[status] }), _jsx("p", { className: "mt-1 text-2xl font-semibold", children: stats[status] })] }, status))) })] }) }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[2fr_1.1fr]", children: [_jsxs("div", { className: "space-y-4", children: [isLoading && _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Cargando proyectos..." }), !isLoading && filteredProjects.length === 0 && (_jsx(Card, { children: _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "No hay proyectos en este estado todav\u00EDa. Crea uno nuevo o cambia el filtro." }) })), filteredProjects.map((project) => (_jsxs(Card, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "rounded-full bg-sena-green/10 p-2 text-sena-green", children: _jsx(FolderKanban, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: project.title }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: ["Actualizado el ", new Date(project.updatedAt).toLocaleDateString('es-CO')] })] }), _jsx("span", { className: "ml-auto rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green", children: statusLabels[project.status] })] }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: project.description ?? 'Describe el objetivo y el alcance del proyecto para alinear a tu equipo.' }), project.repositoryUrl && (_jsxs("a", { href: project.repositoryUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 text-sm font-medium text-sena-green hover:underline", children: [_jsx(GitBranch, { className: "h-4 w-4" }), "Ver repositorio"] })), _jsx("div", { className: "flex flex-wrap gap-2", children: statusOrder.map((status) => (_jsx(Button, { variant: project.status === status ? 'primary' : 'secondary', size: "sm", onClick: () => updateProjectMutation.mutate({
                                                    id: project.id,
                                                    status
                                                }), children: statusLabels[status] }, status))) })] }, project.id)))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx("h2", { className: "text-base font-semibold text-[var(--color-text)]", children: "Registrar nuevo proyecto" }), _jsx("p", { className: "mt-1 text-sm text-[var(--color-muted)]", children: "Define objetivos, repositorio y estado para mantener a tu equipo enfocado." }), _jsxs("form", { className: "mt-4 space-y-4", onSubmit: handleSubmit((values) => {
                                                createProjectMutation.mutate({
                                                    title: values.title,
                                                    description: values.description,
                                                    repositoryUrl: values.repositoryUrl,
                                                    status: values.status
                                                }, {
                                                    onSuccess: () => reset()
                                                });
                                            }), children: [_jsx(Input, { label: "T\u00EDtulo", error: errors.title?.message, ...register('title') }), _jsx(TextArea, { label: "Descripci\u00F3n", rows: 4, error: errors.description?.message, ...register('description') }), _jsx(Input, { label: "Repositorio", placeholder: "https://github.com/...", error: errors.repositoryUrl?.message, ...register('repositoryUrl') }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]", children: ["Estado inicial", _jsxs("select", { className: "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm", ...register('status'), children: [_jsx("option", { value: "draft", children: "Planificaci\u00F3n" }), _jsx("option", { value: "in_progress", children: "En progreso" }), _jsx("option", { value: "completed", children: "Completado" })] })] }), _jsx(Button, { type: "submit", className: "w-full", loading: isSubmitting || createProjectMutation.isPending, children: "Registrar proyecto" })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Hitos recomendados" }), _jsx(Milestone, { className: "h-4 w-4 text-sena-green" })] }), _jsx("div", { className: "mt-4 space-y-3", children: milestoneTips.map((tip, index) => (_jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text)]", children: [_jsxs("span", { className: "mr-2 rounded-full bg-sena-green/10 px-2 py-0.5 text-xs font-semibold text-sena-green", children: ["Hito ", index + 1] }), tip] }, tip))) })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Eventos del proyecto" }), _jsx(Sparkles, { className: "h-4 w-4 text-sena-green" })] }), _jsxs("div", { className: "mt-4 space-y-3 text-sm text-[var(--color-muted)]", children: [_jsx("p", { children: "\uD83D\uDCC5 Demo Day proyectos SENA \u00B7 05 Nov \u00B7 5:00 PM" }), _jsx("p", { children: "\uD83E\uDDEA Testing colaborativo \u00B7 12 Nov \u00B7 3:00 PM" }), _jsx("p", { children: "\uD83C\uDFAF Retrospectiva de aprendizajes \u00B7 22 Nov \u00B7 10:00 AM" })] })] })] })] })] }) }));
};
