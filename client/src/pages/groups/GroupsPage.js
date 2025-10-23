import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { groupService } from '../../services/groupService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Users, Compass } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const groupSchema = z.object({
    name: z.string().min(3, 'El nombre es obligatorio'),
    description: z.string().max(400).optional(),
    coverImage: z.string().url('Ingresa una URL válida').optional()
});
export const GroupsPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['groups'],
        queryFn: groupService.listGroups
    });
    const createGroupMutation = useMutation({
        mutationFn: groupService.createGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(() => { });
            queryClient.invalidateQueries({ queryKey: ['groups', 'me'] }).catch(() => { });
        }
    });
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            name: '',
            description: '',
            coverImage: ''
        }
    });
    const [searchTerm, setSearchTerm] = useState('');
    const activeGroups = useMemo(() => groups.slice(0, 6), [groups]);
    const filteredGroups = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (query.length === 0)
            return groups;
        return groups.filter((group) => {
            const name = group.name.toLowerCase();
            const description = (group.description ?? '').toLowerCase();
            return name.includes(query) || description.includes(query);
        });
    }, [groups, searchTerm]);
    return (_jsx(DashboardLayout, { title: "Grupos", subtitle: "Organiza comunidades y grupos de estudio para aprender juntos.", children: _jsxs("div", { className: "grid w-full gap-5 pb-16 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]", children: [_jsxs("aside", { className: "hidden flex-col gap-4 lg:flex", children: [_jsxs(Card, { className: "h-full bg-white/20 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(18,55,29,0.15)] dark:bg-white/10", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Mis grupos" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Accede r\u00E1pido a tus comunidades activas." })] }), _jsxs("div", { className: "mt-3 space-y-3 overflow-y-auto pr-1", children: [activeGroups.length === 0 && (_jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "A\u00FAn no te has unido a ning\u00FAn grupo. Explora la comunidad para descubrir nuevas oportunidades." })), activeGroups.map((group) => (_jsxs("div", { className: "rounded-2xl border border-white/20 bg-white/15 px-3 py-2", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: group.name }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: ["Desde ", new Date(group.createdAt).toLocaleDateString('es-CO')] })] }, group.id)))] }), _jsx(Button, { variant: "secondary", className: "mt-4 w-full", leftIcon: _jsx(Compass, { className: "h-4 w-4" }), onClick: () => navigate('/explore'), children: "Explorar grupos" })] }), _jsxs(Card, { className: "bg-white/20 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(18,55,29,0.15)] dark:bg-white/10", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Consejos r\u00E1pidos" }), _jsxs("ul", { className: "mt-3 space-y-2 text-xs text-[var(--color-muted)]", children: [_jsx("li", { children: "\u2022 Define un objetivo claro para tu comunidad." }), _jsx("li", { children: "\u2022 Comparte recursos \u00FAtiles y mant\u00E9n las actualizaciones activas." }), _jsx("li", { children: "\u2022 Invita a instructores para fortalecer la mentor\u00EDa." })] })] })] }), _jsxs("section", { className: "flex flex-col gap-5", children: [_jsxs(Card, { className: "bg-white/25 p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(18,55,29,0.15)] dark:bg-white/10", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { className: "max-w-xl space-y-1", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Crear un nuevo grupo" }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Ideal para coordinar proyectos, mentor\u00EDas o comunidades tem\u00E1ticas dentro del SENA." })] }), _jsx("div", { className: "flex w-full max-w-sm items-end gap-2", children: _jsx(Input, { label: "Buscar grupos", placeholder: "Nombre o tem\u00E1tica", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) }) })] }), _jsxs("form", { className: "mt-4 grid gap-3 md:grid-cols-2", onSubmit: handleSubmit((values) => {
                                        createGroupMutation.mutate({
                                            name: values.name,
                                            description: values.description,
                                            coverImage: values.coverImage
                                        }, {
                                            onSuccess: () => reset()
                                        });
                                    }), children: [_jsx(Input, { label: "Nombre", error: errors.name?.message, ...register('name') }), _jsx(Input, { label: "Imagen de portada (URL)", placeholder: "https://...", error: errors.coverImage?.message, ...register('coverImage') }), _jsx(TextArea, { label: "Descripci\u00F3n", rows: 4, error: errors.description?.message, ...register('description'), className: "md:col-span-2" }), _jsx("div", { className: "md:col-span-2", children: _jsx(Button, { type: "submit", className: "w-full", loading: isSubmitting || createGroupMutation.isPending, children: "Crear grupo" }) })] })] }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Explora la comunidad" }), _jsxs("span", { className: "text-xs text-[var(--color-muted)]", children: [filteredGroups.length, " resultados"] })] }), isLoading ? (_jsx(Card, { className: "bg-white/20 p-6 text-sm text-[var(--color-muted)] backdrop-blur-xl", children: "Cargando grupos..." })) : filteredGroups.length === 0 ? (_jsx(Card, { className: "bg-white/20 p-6 text-sm text-[var(--color-muted)] backdrop-blur-xl", children: "No se encontraron grupos. Intenta con otra palabra clave o crea uno nuevo." })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: filteredGroups.map((group) => (_jsxs(Card, { className: "flex h-full flex-col gap-3 bg-white/20 p-4 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)]", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-sena-green/15 text-sena-green shadow-[0_10px_20px_rgba(18,55,29,0.12)]", children: _jsx(Users, { className: "h-6 w-6" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "text-sm font-semibold text-[var(--color-text)]", children: group.name }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: ["Creado el ", new Date(group.createdAt).toLocaleDateString('es-CO')] })] })] }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: group.description ?? 'Grupo sin descripción. Comparte tu experiencia y únete a la conversación.' }), _jsxs("div", { className: "mt-auto flex gap-2", children: [_jsx(Button, { variant: "primary", size: "sm", className: "flex-1", children: "Ver grupo" }), _jsx(Button, { variant: "secondary", size: "sm", className: "flex-1", children: "Compartir" })] })] }, group.id))) }))] })] })] }) }));
};
