import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { libraryService } from '../../services/libraryService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Library, BookOpen, Layers } from 'lucide-react';
const resourceSchema = z.object({
    title: z.string().min(3, 'El título es obligatorio'),
    description: z.string().max(500).optional(),
    resourceType: z.enum(['document', 'video', 'link', 'course', 'other']),
    url: z.string().url('Ingresa un enlace válido').optional(),
    tags: z.string().optional()
});
const resourceTypeLabels = {
    document: 'Documento',
    video: 'Video',
    link: 'Enlace',
    course: 'Curso',
    other: 'Otro'
};
const curatedCollections = [
    { id: 'col-1', title: 'Recursos para diseño UX', items: 24 },
    { id: 'col-2', title: 'Aprendizajes de IA aplicada', items: 18 },
    { id: 'col-3', title: 'Plantillas de pitch y demo day', items: 12 }
];
export const LibraryPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const { data: resources = [], isLoading } = useQuery({
        queryKey: ['library', search],
        queryFn: async () => {
            if (!search) {
                return await libraryService.listResources();
            }
            return await libraryService.searchResources(search);
        }
    });
    const createResourceMutation = useMutation({
        mutationFn: libraryService.createResource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => { });
        }
    });
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(resourceSchema),
        defaultValues: {
            title: '',
            description: '',
            resourceType: 'document',
            url: '',
            tags: ''
        }
    });
    const filteredResources = useMemo(() => {
        if (typeFilter === 'all')
            return resources;
        return resources.filter((resource) => resource.resourceType === typeFilter);
    }, [resources, typeFilter]);
    return (_jsx(DashboardLayout, { title: "Biblioteca", subtitle: "Comparte y descubre materiales de aprendizaje seleccionados por la comunidad.", children: _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green", children: [_jsx(BookOpen, { className: "h-4 w-4" }), " Curadur\u00EDa colaborativa"] }), _jsx("h2", { className: "mt-3 text-2xl font-semibold text-[var(--color-text)]", children: "Elige tu siguiente recurso para aprender o ense\u00F1ar" }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-muted)]", children: "Encuentra presentaciones, gu\u00EDas, grabaciones de clases y plantillas listas para tus proyectos." })] }), _jsxs("div", { className: "flex w-full max-w-xl flex-col gap-3", children: [_jsx(Input, { placeholder: "Buscar por t\u00EDtulo, descripci\u00F3n o etiqueta...", value: search, onChange: (event) => setSearch(event.target.value) }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['all', ...Object.keys(resourceTypeLabels)].map((type) => (_jsx("button", { type: "button", onClick: () => setTypeFilter(type), className: `rounded-full px-3 py-1 text-xs font-semibold transition ${typeFilter === type
                                                ? 'bg-sena-green text-white'
                                                : 'bg-[var(--color-accent-soft)] text-sena-green hover:bg-sena-green/15'}`, children: type === 'all' ? 'Todos' : resourceTypeLabels[type] }, type))) })] })] }) }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[2fr_1.1fr]", children: [_jsxs("div", { className: "space-y-4", children: [isLoading && _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Cargando recursos..." }), !isLoading && filteredResources.length === 0 && (_jsx(Card, { children: _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "No se encontraron recursos con esos criterios. Comparte uno nuevo para inspirar a otros." }) })), filteredResources.map((resource) => (_jsxs(Card, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: resource.title }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: ["Publicado el ", new Date(resource.createdAt).toLocaleDateString('es-CO')] })] }), _jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green", children: [_jsx(Library, { className: "h-4 w-4" }), resourceTypeLabels[resource.resourceType]] })] }), _jsx("p", { className: "text-sm text-[var(--color-text)]", children: resource.description ?? 'Este recurso aún no tiene descripción detallada.' }), resource.tags && resource.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: resource.tags.map((tag) => (_jsxs("span", { className: "rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs text-sena-green", children: ["#", tag] }, tag))) })), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [resource.url ? (_jsx("a", { href: resource.url, target: "_blank", rel: "noopener noreferrer", className: "text-sm font-medium text-sena-green hover:underline", children: "Abrir recurso" })) : (_jsx("span", { className: "text-sm text-[var(--color-muted)]", children: "Recurso sin enlace p\u00FAblico." })), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", children: "Guardar" }), _jsx(Button, { size: "sm", children: "Compartir" })] })] })] }, resource.id)))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx("h2", { className: "text-base font-semibold text-[var(--color-text)]", children: "Agregar recurso" }), _jsx("p", { className: "mt-1 text-sm text-[var(--color-muted)]", children: "Comparte documentos, videos, cursos y enlaces relevantes con la comunidad." }), _jsxs("form", { className: "mt-4 space-y-4", onSubmit: handleSubmit((values) => {
                                                createResourceMutation.mutate({
                                                    title: values.title,
                                                    description: values.description,
                                                    resourceType: values.resourceType,
                                                    url: values.url,
                                                    tags: values.tags
                                                        ? values.tags
                                                            .split(',')
                                                            .map((tag) => tag.trim())
                                                            .filter(Boolean)
                                                        : undefined
                                                }, {
                                                    onSuccess: () => reset()
                                                });
                                            }), children: [_jsx(Input, { label: "T\u00EDtulo", error: errors.title?.message, ...register('title') }), _jsx(TextArea, { label: "Descripci\u00F3n", error: errors.description?.message, rows: 4, ...register('description') }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]", children: ["Tipo de recurso", _jsx("select", { className: "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm", ...register('resourceType'), children: Object.entries(resourceTypeLabels).map(([value, label]) => (_jsx("option", { value: value, children: label }, value))) })] }), _jsx(Input, { label: "URL", placeholder: "https://...", error: errors.url?.message, ...register('url') }), _jsx(Input, { label: "Etiquetas", placeholder: "sena, innovaci\u00F3n, programaci\u00F3n", hint: "Separa con comas", ...register('tags') }), _jsx(Button, { type: "submit", className: "w-full", loading: isSubmitting || createResourceMutation.isPending, children: "Publicar recurso" })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Colecciones destacadas" }), _jsx(Layers, { className: "h-4 w-4 text-sena-green" })] }), _jsx("div", { className: "mt-4 space-y-3", children: curatedCollections.map((collection) => (_jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: collection.title }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: [collection.items, " recursos seleccionados"] })] }, collection.id))) })] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Consejos de curadur\u00EDa" }), _jsxs("div", { className: "mt-3 space-y-3 text-sm text-[var(--color-muted)]", children: [_jsx("p", { children: "\u2022 Prefiere enlaces permanentes y con acceso abierto para toda la comunidad." }), _jsx("p", { children: "\u2022 Describe brevemente por qu\u00E9 el recurso es valioso para tu grupo o proyecto." }), _jsx("p", { children: "\u2022 Usa etiquetas cortas y espec\u00EDficas: ejemplo, \u201Cfrontend\u201D, \u201Cpitch\u201D, \u201Cux research\u201D." })] })] })] })] })] }) }));
};
