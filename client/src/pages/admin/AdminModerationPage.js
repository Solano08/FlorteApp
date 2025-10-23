import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
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
export const AdminModerationPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
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
    return (_jsx(DashboardLayout, { title: "Moderacion y roles", subtitle: "Gestiona los accesos de aprendices e instructores para mantener la comunidad segura.", children: _jsxs("div", { className: "space-y-4", children: [_jsx(Card, { padded: false, className: "p-4 md:p-5", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { className: "grid flex-1 gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Total usuarios" }), _jsx("p", { className: "mt-1 text-lg font-semibold", children: stats.total })] }), _jsxs("div", { className: "rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Activos" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-sena-green", children: stats.active })] }), _jsxs("div", { className: "rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: "Suspendidos" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-rose-500", children: stats.suspended })] })] }), _jsxs("div", { className: "grid w-full gap-3 sm:max-w-md sm:grid-cols-2 md:max-w-sm", children: [_jsx(Input, { label: "Buscar usuarios", placeholder: "Nombre, apellido o correo", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), className: "py-1.5 text-xs" }), _jsxs("label", { className: "flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]", children: ["Filtrar por rol", _jsx("select", { className: "rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10", value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), children: roleFilterOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] })] }) }), _jsx(Card, { padded: false, className: "overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-white/10 text-xs text-[var(--color-text)]", children: [_jsx("thead", { className: "bg-white/5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Usuario" }), _jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Correo" }), _jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Rol" }), _jsx("th", { className: "px-3 py-3 text-left font-medium", children: "Estado" }), _jsx("th", { className: "px-3 py-3 text-right font-medium", children: "Acciones" })] }) }), _jsxs("tbody", { className: "divide-y divide-white/10", children: [isLoading && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-3 py-6 text-center text-[var(--color-muted)]", children: "Cargando usuarios..." }) })), !isLoading && filteredUsers.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-3 py-6 text-center text-[var(--color-muted)]", children: "No se encontraron usuarios con los criterios seleccionados." }) })), filteredUsers.map((user) => (_jsxs("tr", { className: "transition hover:bg-white/10", children: [_jsx("td", { className: "px-3 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: user.avatarUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg', alt: user.firstName, className: "h-8 w-8 rounded-full object-cover" }), _jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-sm font-semibold", children: [user.firstName, " ", user.lastName] }), _jsxs("p", { className: "text-[11px] text-[var(--color-muted)]", children: ["Registrado el ", formatDate(user.createdAt)] })] })] }) }), _jsx("td", { className: "px-3 py-3", children: user.email }), _jsx("td", { className: "px-3 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(RoleIcon, { role: user.role }), _jsxs("select", { className: "rounded-lg border border-white/20 bg-white/15 px-2 py-1 text-[11px] text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-1 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10", value: user.role, onChange: (event) => updateRoleMutation.mutate({
                                                                    userId: user.id,
                                                                    role: event.target.value
                                                                }), disabled: updateRoleMutation.isPending, children: [_jsx("option", { value: "admin", children: "Administrador" }), _jsx("option", { value: "instructor", children: "Instructor" }), _jsx("option", { value: "apprentice", children: "Aprendiz" })] })] }) }), _jsx("td", { className: "px-3 py-3", children: _jsx("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusPill(user.isActive)}`, children: user.isActive ? 'Activo' : 'Suspendido' }) }), _jsx("td", { className: "px-3 py-3 text-right", children: _jsx(Button, { size: "sm", variant: user.isActive ? 'secondary' : 'primary', loading: updateStatusMutation.isPending, onClick: () => updateStatusMutation.mutate({
                                                            userId: user.id,
                                                            isActive: !user.isActive
                                                        }), className: "px-2.5 text-[11px]", children: user.isActive ? 'Suspender' : 'Reactivar' }) })] }, user.id)))] })] }) }) })] }) }));
};
