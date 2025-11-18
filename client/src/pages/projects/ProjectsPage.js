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

/* -------------------------
   Validación del formulario
   ------------------------- */
const projectSchema = z.object({
    title: z.string().min(3, 'El título es obligatorio'),
    description: z.string().max(600).optional(),
    repositoryUrl: z.string().url('Ingresa un repositorio válido').optional(),
    status: z.enum(['draft', 'in_progress', 'completed']).optional()
});

/* Etiquetas visibles de estado */
const statusLabels = {
    draft: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completado'
};

/* Orden visual de los estados */
const statusOrder = ['draft', 'in_progress', 'completed'];

/* Consejos de hitos sugeridos */
const milestoneTips = [
    'Define un objetivo claro y entregables medibles.',
    'Comparte avances con tu grupo al menos una vez por semana.',
    'Documenta aprendizajes clave en la biblioteca del proyecto.'
];

export const ProjectsPage = () => {

    const queryClient = useQueryClient();

    // Filtro actual de estado
    const [statusFilter, setStatusFilter] = useState('all');

    /* ---------------
       Cargar proyectos 
       --------------- */
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.listProjects
    });

    /* -----------------------------
       Crear un nuevo proyecto
       ----------------------------- */
    const createProjectMutation = useMutation({
        mutationFn: projectService.createProject,
        onSuccess: () => {
            // Refresca la lista en cache
            queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => { });
            queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => { });
        }
    });

    /* -----------------------------
       Actualizar estado del proyecto
       ----------------------------- */
    const updateProjectMutation = useMutation({
        mutationFn: ({ id, status }) => projectService.updateProject(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => { });
        }
    });

    /* ---------------------------------------------
       Formulario controlado + validación Zod
       --------------------------------------------- */
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: '',
            description: '',
            repositoryUrl: '',
            status: 'draft'
        }
    });

    /* -------------------------------
       Filtra proyectos según el estado
       ------------------------------- */
    const filteredProjects = useMemo(() => {
        if (statusFilter === 'all') return projects;
        return projects.filter((project) => project.status === statusFilter);
    }, [projects, statusFilter]);

    /* -------------------------------
       Estadísticas por estado
       ------------------------------- */
    const stats = useMemo(() => {
        return statusOrder.reduce((acc, status) => ({
            ...acc,
            [status]: projects.filter((project) => project.status === status).length
        }), { draft: 0, in_progress: 0, completed: 0 });
    }, [projects]);

    /* -------------------------------
       Render principal de la página
       ------------------------------- */
    return (_jsx(DashboardLayout, {
        title: "Proyectos",
        subtitle: "Gestiona tus iniciativas, conecta repositorios y da seguimiento a su progreso.",
        children: _jsxs("div", {
            className: "space-y-6",
            children: [

                /* -----------------------------
                   HEADER PRINCIPAL con filtros
                   ----------------------------- */
                _jsx(Card, {
                    className: "p-6 shadow-lg rounded-2xl",
                    children: _jsxs("div", {
                        className: "flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between",
                        children: [

                            /* Descripción general del módulo */
                            _jsxs("div", {
                                children: [
                                    _jsxs("p", {
                                        className: "inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green",
                                        children: [
                                            _jsx(Rocket, { className: "h-4 w-4" }),
                                            " Laboratorio de proyectos"
                                        ]
                                    }),
                                    _jsx("h2", {
                                        className: "mt-3 text-3xl font-semibold text-[var(--color-text)]",
                                        children: "Impulsa tu proyecto de idea a demo final"
                                    }),
                                    _jsx("p", {
                                        className: "mt-2 text-sm text-[var(--color-muted)]",
                                        children: "Gestiona tareas, documentación y repositorios en un solo espacio."
                                    })
                                ]
                            }),

                            /* Filtros de estado */
                            _jsx("div", {
                                className: "grid w-full max-w-xl gap-4 sm:grid-cols-3",
                                children: statusOrder.map((status) => (
                                    _jsxs("button", {
                                        type: "button",
                                        onClick: () => setStatusFilter(statusFilter === status ? 'all' : status),
                                        className: `rounded-2xl p-4 transition shadow-md border text-left ${
                                            statusFilter === status
                                                ? 'border-sena-green bg-sena-green/10 text-sena-green'
                                                : 'border-[var(--color-border)] hover:border-sena-green/40 text-[var(--color-text)]'
                                        }`,
                                        children: [
                                            _jsx("p", {
                                                className: "text-xs uppercase tracking-wide",
                                                children: statusLabels[status]
                                            }),
                                            _jsx("p", {
                                                className: "mt-1 text-2xl font-bold",
                                                children: stats[status]
                                            })
                                        ]
                                    }, status)
                                ))
                            })
                        ]
                    })
                }),

                /* ----------------------------------------
                   GRID PRINCIPAL (Lista + Panel Lateral)
                   ---------------------------------------- */
                _jsxs("div", {
                    className: "grid gap-6 xl:grid-cols-[2fr_1.1fr]",
                    children: [

                        /* --- LISTA DE PROYECTOS --- */
                        _jsxs("div", {
                            className: "space-y-4",
                            children: [

                                /* Loading */
                                isLoading && _jsx("p", {
                                    className: "text-sm text-[var(--color-muted)]",
                                    children: "Cargando proyectos..."
                                }),

                                /* Sin proyectos */
                                !isLoading && filteredProjects.length === 0 && (
                                    _jsx(Card, {
                                        className: "p-4",
                                        children: _jsx("p", {
                                            className: "text-sm text-[var(--color-muted)]",
                                            children: "No hay proyectos en este estado."
                                        })
                                    })
                                ),

                                /* Lista dinámica de cards */
                                filteredProjects.map((project) => (
                                    _jsxs(Card, {
                                        className: "p-6 space-y-4 rounded-2xl shadow-md hover:shadow-lg transition",
                                        children: [

                                            /* Encabezado del proyecto */
                                            _jsxs("div", {
                                                className: "flex items-start gap-3",
                                                children: [

                                                    /* Icono */
                                                    _jsx("div", {
                                                        className: "rounded-full bg-sena-green/10 p-2 text-sena-green",
                                                        children: _jsx(FolderKanban, { className: "h-5 w-5" })
                                                    }),

                                                    /* Título + fecha */
                                                    _jsxs("div", {
                                                        children: [
                                                            _jsx("h3", {
                                                                className: "text-lg font-semibold text-[var(--color-text)]",
                                                                children: project.title
                                                            }),
                                                            _jsxs("p", {
                                                                className: "text-xs text-[var(--color-muted)]",
                                                                children: [
                                                                    "Actualizado el ",
                                                                    new Date(project.updatedAt).toLocaleDateString('es-CO')
                                                                ]
                                                            })
                                                        ]
                                                    }),

                                                    /* Estado visual */
                                                    _jsx("span", {
                                                        className: "ml-auto rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green",
                                                        children: statusLabels[project.status]
                                                    })
                                                ]
                                            }),

                                            /* Descripción */
                                            _jsx("p", {
                                                className: "text-sm text-[var(--color-muted)]",
                                                children: project.description ?? 'Describe el objetivo del proyecto.'
                                            }),

                                            /* Link al repositorio */
                                            project.repositoryUrl && (
                                                _jsxs("a", {
                                                    href: project.repositoryUrl,
                                                    target: "_blank",
                                                    rel: "noopener noreferrer",
                                                    className: "inline-flex items-center gap-2 text-sm font-medium text-sena-green hover:underline",
                                                    children: [
                                                        _jsx(GitBranch, { className: "h-4 w-4" }),
                                                        "Ver repositorio"
                                                    ]
                                                })
                                            ),

                                            /* Botones de cambio de estado */
                                            _jsx("div", {
                                                className: "flex flex-wrap gap-2 pt-2",
                                                children: statusOrder.map((status) => (
                                                    _jsx(Button, {
                                                        variant: project.status === status ? 'primary' : 'secondary',
                                                        size: "sm",
                                                        onClick: () => updateProjectMutation.mutate({
                                                            id: project.id,
                                                            status
                                                        }),
                                                        children: statusLabels[status]
                                                    }, status)
                                                ))
                                            })
                                        ]
                                    }, project.id)
                                ))
                            ]
                        }),

                        /* --- PANEL LATERAL (Formulario + Tips + Eventos) --- */
                        _jsxs("div", {
                            className: "space-y-4",
                            children: [

                                /* Crear proyecto */
                                _jsxs(Card, {
                                    className: "p-6 rounded-2xl shadow-md",
                                    children: [

                                        _jsx("h2", {
                                            className: "text-base font-semibold text-[var(--color-text)]",
                                            children: "Registrar nuevo proyecto"
                                        }),

                                        /* Formulario */
                                        _jsxs("form", {
                                            className: "mt-4 space-y-4",
                                            onSubmit: handleSubmit((values) => {
                                                createProjectMutation.mutate(values, {
                                                    onSuccess: () => reset()
                                                });
                                            }),
                                            children: [

                                                _jsx(Input, {
                                                    label: "Título",
                                                    error: errors.title?.message,
                                                    ...register('title')
                                                }),

                                                _jsx(TextArea, {
                                                    label: "Descripción",
                                                    rows: 4,
                                                    error: errors.description?.message,
                                                    ...register('description')
                                                }),

                                                _jsx(Input, {
                                                    label: "Repositorio",
                                                    placeholder: "https://github.com/...",
                                                    error: errors.repositoryUrl?.message,
                                                    ...register('repositoryUrl')
                                                }),

                                                /* Selector de estado inicial */
                                                _jsxs("label", {
                                                    className: "flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]",
                                                    children: [
                                                        "Estado inicial",
                                                        _jsxs("select", {
