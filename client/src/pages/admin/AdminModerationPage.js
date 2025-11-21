import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Shield, ShieldCheck, ShieldHalf } from 'lucide-react';
const roleFilterOptions = [
    { value: 'all', label: 'Todos los roles' },
    { value: 'admin', label: 'Administradores' },
    { value: 'instructor', label: 'Instructores' },
    { value: 'apprentice', label: 'Aprendices' }
];
const RoleIcon = ({ role }) => {
    if (role === 'admin')
        return _jsx(Shield, { className: "h-4 w-4 text-sena-green" });
    if (role === 'instructor')
        return _jsx(ShieldCheck, { className: "h-4 w-4 text-blue-500" });
    return _jsx(ShieldHalf, { className: "h-4 w-4 text-amber-500" });
};
const formatDate = (iso) => new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
});
const statusPill = (isActive) => isActive ? 'bg-emerald-100/80 text-emerald-600 border border-emerald-200/70' : 'bg-rose-100 text-rose-500 border border-rose-200/80';
const optionalUrlField = z
    .union([z.string().trim().url('Ingresa un enlace valido').max(255), z.literal('')])
    .optional()
    .nullable();
const optionalEmailField = z
    .union([z.string().trim().email('Ingresa un correo valido').max(160), z.literal('')])
    .optional()
    .nullable();
const editUserSchema = z.object({
    firstName: z.string().trim().min(2, 'Ingresa el nombre'),
    lastName: z.string().trim().min(2, 'Ingresa el apellido'),
    email: z.string().trim().email('Ingresa un correo valido'),
    role: z.enum(['admin', 'instructor', 'apprentice']),
    isActive: z.boolean(),
    password: z.union([z.string().trim().min(6, 'La contrasena debe tener al menos 6 caracteres'), z.literal('')]).optional(),
    headline: z
        .union([z.string().trim().max(160, 'Maximo 160 caracteres'), z.literal('')])
        .optional()
        .nullable(),
    bio: z
        .union([z.string().trim().max(500, 'Maximo 500 caracteres'), z.literal('')])
        .optional()
        .nullable(),
    avatarUrl: optionalUrlField,
    instagramUrl: optionalUrlField,
    githubUrl: optionalUrlField,
    facebookUrl: optionalUrlField,
    contactEmail: optionalEmailField,
    xUrl: optionalUrlField
});
export const AdminModerationPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [editingUser, setEditingUser] = useState(null);
    const [formError, setFormError] = useState(null);
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: adminService.listUsers
    });
    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }) => adminService.updateRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }).catch(() => { });
        }
    });
    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, isActive }) => adminService.updateStatus(userId, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }).catch(() => { });
        }
    });
    const updateUserMutation = useMutation({
        mutationFn: ({ userId, payload }) => adminService.updateUser(userId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }).catch(() => { });
            setEditingUser(null);
        },
        onError: () => {
            setFormError('No se pudo actualizar el usuario. Intenta nuevamente.');
        }
    });
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            role: 'apprentice',
            isActive: true,
            password: '',
            headline: '',
            bio: '',
            avatarUrl: '',
            instagramUrl: '',
            githubUrl: '',
            facebookUrl: '',
            contactEmail: '',
            xUrl: ''
        }
    });
    const isActiveValue = watch('isActive');
    const isSaving = updateUserMutation.isPending;
    const filteredUsers = useMemo(() => {
        if (!users.length)
            return [];
        const term = searchTerm.trim().toLowerCase();
        return users.filter((user) => {
            const matchesSearch = term.length === 0 ||
                user.firstName.toLowerCase().includes(term) ||
                user.lastName.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term);
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter((user) => user.isActive).length;
        const suspended = total - active;
        return { total, active, suspended };
    }, [users]);
    useEffect(() => {
        if (editingUser) {
            reset({
                firstName: editingUser.firstName,
                lastName: editingUser.lastName,
                email: editingUser.email,
                role: editingUser.role,
                isActive: editingUser.isActive,
                password: '',
                headline: editingUser.headline ?? '',
                bio: editingUser.bio ?? '',
                avatarUrl: editingUser.avatarUrl ?? '',
                instagramUrl: editingUser.instagramUrl ?? '',
                githubUrl: editingUser.githubUrl ?? '',
                facebookUrl: editingUser.facebookUrl ?? '',
                contactEmail: editingUser.contactEmail ?? '',
                xUrl: editingUser.xUrl ?? ''
            });
            setFormError(null);
        }
    }, [editingUser, reset]);
    const normalizeOptional = (value) => {
        if (value === undefined || value === null)
            return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    };
    const onSubmit = (values) => {
        if (!editingUser)
            return;
        setFormError(null);
        const payload = {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            role: values.role,
            isActive: values.isActive,
            headline: normalizeOptional(values.headline),
            bio: normalizeOptional(values.bio),
            avatarUrl: normalizeOptional(values.avatarUrl),
            instagramUrl: normalizeOptional(values.instagramUrl),
            githubUrl: normalizeOptional(values.githubUrl),
            facebookUrl: normalizeOptional(values.facebookUrl),
            contactEmail: normalizeOptional(values.contactEmail),
            xUrl: normalizeOptional(values.xUrl)
        };
        const passwordValue = values.password?.trim();
        if (passwordValue) {
            payload.password = passwordValue;
        }
        updateUserMutation.mutate({ userId: editingUser.id, payload });
    };
    return (_jsxs(DashboardLayout, { title: "Moderacion y roles", subtitle: "Gestiona los accesos de aprendices e instructores para mantener la comunidad segura.", children: [_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { padded: false, className: "p-4 md:p-5", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { className: "grid flex-1 gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Total usuarios" }), _jsx("p", { className: "mt-1 text-lg font-semibold", children: stats.total })] }), _jsxs("div", { className: "rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Activos" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-sena-green", children: stats.active })] }), _jsxs("div", { className: "rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Suspendidos" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-rose-500", children: stats.suspended })] })] }), _jsxs("div", { className: "grid w-full gap-3 sm:max-w-md sm:grid-cols-2 md:max-w-sm", children: [_jsx(Input, { label: "Buscar usuarios", placeholder: "Nombre, apellido o correo", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), className: "py-1.5 text-xs" }), _jsxs("label", { className: "flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]", children: ["Filtrar por rol", _jsx("select", { className: "rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10", value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), children: roleFilterOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] })] }) }), _jsx(Card, { padded: false, className: "overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-white/10 text-xs text-[var(--color-text)]", children: [_jsx("thead", { className: "bg-white/5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Usuario" }), _jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Correo" }), _jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Rol" }), _jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Estado" }), _jsx("th", { className: "px-3 py-3 text-right font-medium", children: "Acciones" })] }) }), _jsxs("tbody", { className: "divide-y divide-white/10", children: [isLoading && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-3 py-6 text-center text-[var(--color-muted)]", children: "Cargando usuarios..." }) })), !isLoading && filteredUsers.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-3 py-6 text-center text-[var(--color-muted)]", children: "No se encontraron usuarios con los criterios seleccionados." }) })), filteredUsers.map((user) => (_jsxs("tr", { className: "transition hover:bg-white/10", children: [_jsx("td", { className: "px-3 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: user.avatarUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg', alt: user.firstName, className: "h-8 w-8 rounded-full object-cover" }), _jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-sm font-semibold", children: [user.firstName, " ", user.lastName] }), _jsxs("p", { className: "text-[11px] text-[var(--color-muted)]", children: ["Registrado el ", formatDate(user.createdAt)] })] })] }) }), _jsx("td", { className: "px-3 py-3", children: user.email }), _jsx("td", { className: "px-3 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(RoleIcon, { role: user.role }), _jsxs("select", { className: "rounded-lg border border-white/20 bg-white/15 px-2 py-1 text-[11px] text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-1 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10", value: user.role, onChange: (event) => updateRoleMutation.mutate({
                                                                        userId: user.id,
                                                                        role: event.target.value
                                                                    }), disabled: updateRoleMutation.isPending, children: [_jsx("option", { value: "admin", children: "Administrador" }), _jsx("option", { value: "instructor", children: "Instructor" }), _jsx("option", { value: "apprentice", children: "Aprendiz" })] })] }) }), _jsx("td", { className: "px-3 py-3", children: _jsx("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusPill(user.isActive)}`, children: user.isActive ? 'Activo' : 'Suspendido' }) }), _jsx("td", { className: "px-3 py-3 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", className: "px-2.5 text-[11px] shadow-[0_10px_20px_rgba(18,55,29,0.18)] backdrop-blur", onClick: () => setEditingUser(user), children: "Editar perfil" }), _jsx(Button, { size: "sm", variant: user.isActive ? 'secondary' : 'primary', loading: updateStatusMutation.isPending, onClick: () => updateStatusMutation.mutate({
                                                                        userId: user.id,
                                                                        isActive: !user.isActive
                                                                    }), className: "px-2.5 text-[11px]", children: user.isActive ? 'Suspender' : 'Reactivar' })] }) })] }, user.id)))] })] }) }) })] }), _jsx(AnimatePresence, { children: editingUser && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-md", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.94 }, className: "w-full max-w-3xl rounded-3xl border border-white/25 bg-white/20 p-6 shadow-[0_32px_70px_rgba(18,55,29,0.25)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/80", children: [_jsxs("div", { className: "flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: ["Editar perfil de ", editingUser.firstName, " ", editingUser.lastName] }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Ajusta la informacion personal, el rol y el estado de la cuenta." })] }), _jsx(Button, { variant: "ghost", onClick: () => setEditingUser(null), children: "Cerrar" })] }), _jsxs("form", { className: "mt-6 space-y-5", onSubmit: handleSubmit(onSubmit), noValidate: true, children: [formError && (_jsx("div", { className: "rounded-2xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm text-rose-700", children: formError })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Input, { label: "Nombre", disabled: isSaving, error: errors.firstName?.message, ...register('firstName') }), _jsx(Input, { label: "Apellido", disabled: isSaving, error: errors.lastName?.message, ...register('lastName') })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-[2fr_1fr]", children: [_jsx(Input, { label: "Correo", type: "email", disabled: isSaving, error: errors.email?.message, ...register('email') }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]", children: ["Rol", _jsxs("select", { className: "rounded-xl border border-white/25 bg-white/20 px-3 py-2 text-xs text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/15 dark:bg-white/10", disabled: isSaving, ...register('role'), children: [_jsx("option", { value: "admin", children: "Administrador" }), _jsx("option", { value: "instructor", children: "Instructor" }), _jsx("option", { value: "apprentice", children: "Aprendiz" })] }), errors.role && _jsx("span", { className: "text-xs text-red-400", children: errors.role.message })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-white/25 bg-white/15 px-3 py-3 text-xs text-[var(--color-text)] shadow-[0_16px_30px_rgba(18,55,29,0.18)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Estado de la cuenta" }), _jsx("p", { className: "mt-1 text-sm font-semibold", children: isActiveValue ? 'Activo' : 'Suspendido' }), _jsx("p", { className: "mt-1 text-[11px] text-[var(--color-muted)]", children: isActiveValue
                                                            ? 'El usuario puede iniciar sesion y acceder al contenido.'
                                                            : 'El usuario quedara bloqueado hasta que lo reactives.' }), _jsx(Button, { type: "button", size: "sm", variant: isActiveValue ? 'secondary' : 'primary', className: "mt-3 w-full", onClick: () => setValue('isActive', !isActiveValue), disabled: isSaving, children: isActiveValue ? 'Marcar como suspendido' : 'Reactivar usuario' })] }), _jsx(Input, { label: "Nueva contrasena (opcional)", type: "password", placeholder: "Dejar en blanco para mantenerla", disabled: isSaving, error: errors.password?.message, ...register('password') })] }), _jsx(Input, { label: "Titular", disabled: isSaving, error: errors.headline?.message, ...register('headline'), hint: "Maximo 160 caracteres" }), _jsx(TextArea, { label: "Biografia", rows: 4, disabled: isSaving, error: errors.bio?.message, ...register('bio'), hint: "Comparte una descripcion breve del usuario." }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Input, { label: "Avatar (URL)", disabled: isSaving, error: errors.avatarUrl?.message, placeholder: "https://...", ...register('avatarUrl') }), _jsx(Input, { label: "Instagram", disabled: isSaving, error: errors.instagramUrl?.message, placeholder: "https://www.instagram.com/usuario", ...register('instagramUrl') }), _jsx(Input, { label: "GitHub", disabled: isSaving, error: errors.githubUrl?.message, placeholder: "https://github.com/usuario", ...register('githubUrl') }), _jsx(Input, { label: "Facebook", disabled: isSaving, error: errors.facebookUrl?.message, placeholder: "https://www.facebook.com/usuario", ...register('facebookUrl') }), _jsx(Input, { label: "Correo de contacto", type: "email", disabled: isSaving, error: errors.contactEmail?.message, placeholder: "usuario@correo.com", ...register('contactEmail') }), _jsx(Input, { label: "X (Twitter)", disabled: isSaving, error: errors.xUrl?.message, placeholder: "https://x.com/usuario", ...register('xUrl') })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => setEditingUser(null), disabled: isSaving, children: "Cancelar" }), _jsx(Button, { type: "submit", loading: isSaving, disabled: isSaving, children: "Guardar cambios" })] })] })] }) })) })] }));
};
