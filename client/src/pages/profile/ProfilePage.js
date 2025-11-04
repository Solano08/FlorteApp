import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { AvatarUploader } from '../../components/ui/AvatarUploader';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../hooks/useAuth';
import { Facebook, Github, GitBranch, GitCommit, Instagram, Mail, Rocket, Twitter } from 'lucide-react';
const optionalUrlField = z
    .union([z.string().trim().url('Ingresa un enlace valido').max(255), z.literal('')])
    .optional()
    .nullable();
const optionalEmailField = z
    .union([z.string().trim().email('Ingresa un correo valido').max(160), z.literal('')])
    .optional()
    .nullable();
const profileSchema = z.object({
    firstName: z.string().min(2, 'Ingresa tu nombre'),
    lastName: z.string().min(2, 'Ingresa tu apellido'),
    headline: z.string().max(160).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    instagramUrl: optionalUrlField,
    githubUrl: optionalUrlField,
    facebookUrl: optionalUrlField,
    contactEmail: optionalEmailField,
    xUrl: optionalUrlField
});
const defaultSkills = ['UI/UX', 'React', 'Innovacion', 'Trabajo colaborativo', 'Aprendiz SENA'];
const socialLinkConfigs = [
    {
        name: 'instagramUrl',
        label: 'Instagram',
        icon: Instagram,
        placeholder: 'https://www.instagram.com/tuusuario',
        type: 'url'
    },
    {
        name: 'githubUrl',
        label: 'GitHub',
        icon: Github,
        placeholder: 'https://github.com/tuusuario',
        type: 'url'
    },
    {
        name: 'facebookUrl',
        label: 'Facebook',
        icon: Facebook,
        placeholder: 'https://www.facebook.com/tuusuario',
        type: 'url'
    },
    {
        name: 'contactEmail',
        label: 'Correo de contacto',
        icon: Mail,
        placeholder: 'usuario@correo.com',
        type: 'email'
    },
    {
        name: 'xUrl',
        label: 'X (Twitter)',
        icon: Twitter,
        placeholder: 'https://x.com/tuusuario',
        type: 'url'
    }
];
const samplePosts = [
    {
        id: 'p1',
        title: 'Bitacora de aprendizaje UX',
        description: 'Un resumen de las metodologias aplicadas durante el sprint de diseno.'
    },
    {
        id: 'p2',
        title: 'Presentacion proyecto SenaConnect',
        description: 'Pitch y maquetas del proyecto colaborativo mas reciente.'
    }
];
const activitySummary = {
    contributionsThisWeek: 18,
    activeProjects: 3,
    streakDays: 5
};
const activityMatrix = [
    [0, 1, 0, 2, 3, 1, 0],
    [1, 2, 1, 3, 4, 2, 1],
    [0, 1, 0, 2, 3, 1, 0],
    [2, 3, 2, 4, 4, 3, 2],
    [1, 2, 1, 2, 3, 1, 0]
];
const activityTimeline = [
    {
        id: 'a1',
        project: 'SenaConnect',
        description: 'Se hizo merge de la rama feature/perfil con 3 commits nuevos.',
        time: 'Hace 2 horas',
        icon: GitBranch
    },
    {
        id: 'a2',
        project: 'FrontLab UI Kit',
        description: 'Registraste 4 contribuciones y cerraste 2 issues abiertos.',
        time: 'Ayer',
        icon: GitCommit
    },
    {
        id: 'a3',
        project: 'Laboratorio de Innovacion',
        description: 'Se programo el lanzamiento interno para el equipo de pruebas.',
        time: 'Hace 3 dias',
        icon: Rocket
    }
];
export const ProfilePage = () => {
    const queryClient = useQueryClient();
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: profileService.getProfile
    });
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            headline: '',
            bio: '',
            instagramUrl: '',
            githubUrl: '',
            facebookUrl: '',
            contactEmail: '',
            xUrl: ''
        }
    });
    useEffect(() => {
        if (profile) {
            reset({
                firstName: profile.firstName,
                lastName: profile.lastName,
                headline: profile.headline ?? '',
                bio: profile.bio ?? '',
                instagramUrl: profile.instagramUrl ?? '',
                githubUrl: profile.githubUrl ?? '',
                facebookUrl: profile.facebookUrl ?? '',
                contactEmail: profile.contactEmail ?? '',
                xUrl: profile.xUrl ?? ''
            });
        }
    }, [profile, reset]);
    const updateProfileMutation = useMutation({
        mutationFn: profileService.updateProfile,
        onSuccess: (updated) => {
            queryClient.setQueryData(['profile', 'me'], updated);
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => { });
            updateUser(() => ({
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                email: updated.email,
                avatarUrl: updated.avatarUrl,
                headline: updated.headline,
                bio: updated.bio,
                instagramUrl: updated.instagramUrl,
                githubUrl: updated.githubUrl,
                facebookUrl: updated.facebookUrl,
                contactEmail: updated.contactEmail,
                xUrl: updated.xUrl,
                role: updated.role,
                isActive: updated.isActive
            }));
            reset({
                firstName: updated.firstName,
                lastName: updated.lastName,
                headline: updated.headline ?? '',
                bio: updated.bio ?? '',
                instagramUrl: updated.instagramUrl ?? '',
                githubUrl: updated.githubUrl ?? '',
                facebookUrl: updated.facebookUrl ?? '',
                contactEmail: updated.contactEmail ?? '',
                xUrl: updated.xUrl ?? ''
            });
            setIsEditing(false);
        }
    });
    const uploadAvatarMutation = useMutation({
        mutationFn: profileService.updateAvatar,
        onSuccess: (updated) => {
            queryClient.setQueryData(['profile', 'me'], updated);
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => { });
            updateUser(() => ({
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                email: updated.email,
                avatarUrl: updated.avatarUrl,
                headline: updated.headline,
                bio: updated.bio,
                instagramUrl: updated.instagramUrl,
                githubUrl: updated.githubUrl,
                facebookUrl: updated.facebookUrl,
                contactEmail: updated.contactEmail,
                xUrl: updated.xUrl,
                role: updated.role,
                isActive: updated.isActive
            }));
        }
    });
    const normalizeOptional = (value) => {
        if (value === undefined || value === null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    };
    const onSubmit = (values) => {
        updateProfileMutation.mutate({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            headline: normalizeOptional(values.headline),
            bio: normalizeOptional(values.bio),
            instagramUrl: normalizeOptional(values.instagramUrl),
            githubUrl: normalizeOptional(values.githubUrl),
            facebookUrl: normalizeOptional(values.facebookUrl),
            contactEmail: normalizeOptional(values.contactEmail),
            xUrl: normalizeOptional(values.xUrl)
        });
    };
    const isSaving = updateProfileMutation.isPending;
    const filledLinks = socialLinkConfigs
        .map(({ name, label, icon, type }) => {
        const rawValue = profile?.[name] ?? null;
        if (!rawValue)
            return null;
        const value = rawValue.trim();
        if (value.length === 0)
            return null;
        const href = type === 'email' ? `mailto:${value}` : value;
        return { label, icon, href, value, type };
    })
        .filter((link) => Boolean(link));
    const hasLinks = filledLinks.length > 0;
    const getErrorMessage = (field) => errors[field]?.message ?? undefined;
    const handleOpenEditor = () => {
        if (profile) {
            reset({
                firstName: profile.firstName,
                lastName: profile.lastName,
                headline: profile.headline ?? '',
                bio: profile.bio ?? '',
                instagramUrl: profile.instagramUrl ?? '',
                githubUrl: profile.githubUrl ?? '',
                facebookUrl: profile.facebookUrl ?? '',
                contactEmail: profile.contactEmail ?? '',
                xUrl: profile.xUrl ?? ''
            });
        }
        setIsEditing(true);
    };
    const coverImageUrl = profile?.coverImageUrl ?? null;
    const formatContributionLabel = (value) => value === 1 ? '1 contribucion' : `${value} contribuciones`;
    const getHeatmapClass = (value) => {
        if (value >= 4)
            return 'bg-sena-green/90';
        if (value === 3)
            return 'bg-sena-green/70';
        if (value === 2)
            return 'bg-sena-green/50';
        if (value === 1)
            return 'bg-sena-green/30';
        return 'bg-white/30 dark:bg-white/10';
    };
    return (_jsx(DashboardLayout, { title: "Perfil", subtitle: "Administra tu informacion y mantiene tu presencia actualizada para el resto de la comunidad.", children: _jsxs(LayoutGroup, { children: [_jsxs("div", { className: "grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "overflow-hidden p-0", children: [_jsxs("div", { className: `relative h-36 w-full overflow-hidden sm:h-44 md:h-52 ${coverImageUrl
                                                ? 'bg-cover bg-center'
                                                : 'bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.34),_rgba(18,55,29,0.65),_transparent_78%)]'}`, style: coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : undefined, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-sena-green/35 via-sena-green/15 to-transparent" }), _jsx("div", { className: "absolute left-6 -bottom-14 z-10 sm:-bottom-16", children: _jsx(AvatarUploader, { imageUrl: profile?.avatarUrl, loading: uploadAvatarMutation.isPending, onSelect: (file) => {
                                                            uploadAvatarMutation.mutate(file);
                                                        } }) })] }), _jsxs("div", { className: "px-6 pb-6 pt-16 text-left sm:pt-20 sm:pl-[152px]", children: [_jsxs("div", { className: "max-w-2xl space-y-1", children: [_jsxs("p", { className: "text-lg font-semibold text-[var(--color-text)]", children: [profile?.firstName, " ", profile?.lastName] }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: profile?.headline ?? 'Agrega un titular atractivo para tu perfil.' })] }), _jsxs("div", { className: "mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsx(motion.div, { layoutId: "profile-edit-launch", className: "w-full sm:max-w-sm lg:max-w-xs", children: _jsx(Button, { variant: "secondary", onClick: handleOpenEditor, disabled: isSaving || uploadAvatarMutation.isPending, className: "w-full bg-white/40 px-6 py-2.5 text-sm font-semibold text-sena-green shadow-[0_20px_34px_rgba(18,55,29,0.18)] backdrop-blur-lg transition hover:bg-white/50 dark:bg-white/10 dark:text-white dark:hover:bg-white/15", children: "Editar perfil" }) }), !isEditing && (_jsx("div", { className: "flex flex-wrap gap-2 lg:justify-end", children: defaultSkills.map((skill) => (_jsx("span", { className: "rounded-full bg-[var(--color-accent-soft)] px-4 py-1 text-xs font-semibold text-sena-green shadow-[0_10px_20px_rgba(18,55,29,0.16)]", children: skill }, skill))) }))] })] })] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Acerca de mi" }), _jsx("p", { className: "mt-3 text-sm text-[var(--color-text)]", children: profile?.bio ?? 'Describe tus intereses, experiencias y metas dentro del SENA.' })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Publicaciones recientes" }), _jsx(Button, { variant: "ghost", size: "sm", children: "Ver todas" })] }), _jsxs("div", { className: "mt-4 space-y-4", children: [samplePosts.map((post) => (_jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: post.title }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: post.description })] }, post.id))), _jsx(Button, { variant: "secondary", className: "w-full", children: "Crear una nueva publicacion" })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Mi actividad" }), _jsx("span", { className: "text-xs text-[var(--color-muted)]", children: "Ultima actualizacion: Hoy" })] }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Sigue tu impacto reciente dentro de los proyectos." })] }), _jsxs("div", { className: "mt-4 space-y-5", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center shadow-[0_10px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]", children: "Contribuciones esta semana" }), _jsx("p", { className: "text-2xl font-bold text-sena-green", children: activitySummary.contributionsThisWeek })] }), _jsxs("div", { className: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center shadow-[0_10px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]", children: "Proyectos activos" }), _jsx("p", { className: "text-2xl font-bold text-[var(--color-text)]", children: activitySummary.activeProjects })] }), _jsxs("div", { className: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center shadow-[0_10px_20px_rgba(18,55,29,0.12)]", children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]", children: "Racha activa" }), _jsxs("p", { className: "text-2xl font-bold text-[var(--color-text)]", children: [activitySummary.streakDays, " ", activitySummary.streakDays === 1 ? 'dia' : 'dias'] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]", children: "Mapa de contribuciones" }), _jsx("div", { className: "mt-3 flex gap-2 overflow-x-auto pb-1", children: activityMatrix.map((week, weekIndex) => (_jsx("div", { className: "grid grid-rows-7 gap-1", children: week.map((value, dayIndex) => {
                                                                    const colorClass = getHeatmapClass(value);
                                                                    return (_jsx("span", { className: `h-3 w-3 rounded-md transition-colors ${colorClass}`, title: formatContributionLabel(value), "aria-label": formatContributionLabel(value) }, `day-${weekIndex}-${dayIndex}`));
                                                                }) }, `week-${weekIndex}`))) })] }), _jsx("div", { className: "space-y-3", children: activityTimeline.map(({ id, project, description, time, icon: Icon }) => (_jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition hover:border-sena-green/45 hover:bg-white/40 hover:text-sena-green/90 dark:hover:bg-white/10", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.18)]", children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: project }), _jsx("span", { className: "text-[10px] uppercase tracking-wide text-[var(--color-muted)]", children: time })] }), _jsx("p", { className: "mt-1 text-xs text-[var(--color-muted)]", children: description })] })] }, id))) })] })] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Mis enlaces" }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-muted)]", children: "Destaca tus redes profesionales para que te contacten facilmente." }), _jsx("div", { className: "mt-4 space-y-3", children: hasLinks ? (filledLinks.map(({ label, icon: Icon, href, value, type }) => {
                                                const prettyValue = type === 'email' ? value : value.replace(/^https?:\/\/(www\.)?/i, '');
                                                const target = type === 'url' ? '_blank' : undefined;
                                                const rel = type === 'url' ? 'noopener noreferrer' : undefined;
                                                return (_jsxs("a", { href: href, target: target, rel: rel, className: "flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-sena-green/60 hover:bg-white/45 hover:text-sena-green", children: [_jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-sena-green/12 text-sena-green shadow-[0_8px_18px_rgba(18,55,29,0.18)]", children: _jsx(Icon, { className: "h-4 w-4" }) }), _jsxs("span", { className: "flex flex-col items-start", children: [_jsx("span", { className: "font-semibold", children: label }), _jsx("span", { className: "text-xs text-[var(--color-muted)] break-all", children: prettyValue })] })] }, label));
                                            })) : (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-muted)]", children: [_jsx("p", { children: "Aun no has agregado enlaces. Completa tus redes sociales desde el formulario de edicion." }), _jsx(Button, { variant: "ghost", size: "sm", className: "self-start px-3", onClick: handleOpenEditor, children: "Agregar enlaces" })] })) })] })] })] }), _jsx(AnimatePresence, { children: isEditing && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[6px]", children: _jsxs(motion.div, { layoutId: "profile-edit-launch", initial: { opacity: 0, y: 38, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 24, scale: 0.94 }, transition: { type: 'spring', stiffness: 170, damping: 24 }, className: "relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/35 bg-white/65 p-6 shadow-[0_40px_90px_rgba(15,38,25,0.28)] backdrop-blur-[28px] dark:border-white/10 dark:bg-slate-900/70", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_55%)] opacity-80 dark:opacity-35" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/10 to-white/15 dark:from-white/5 dark:via-white/3 dark:to-white/6" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Editar perfil" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Actualiza tu informacion y compartela con la comunidad." })] }), _jsx(Button, { variant: "ghost", onClick: () => setIsEditing(false), children: "Cerrar" })] }), _jsxs("form", { className: "mt-6 space-y-5", onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Input, { label: "Nombre", error: errors.firstName?.message, disabled: isLoading || isSaving, ...register('firstName') }), _jsx(Input, { label: "Apellido", error: errors.lastName?.message, disabled: isLoading || isSaving, ...register('lastName') })] }), _jsx(Input, { label: "Titular", hint: "Ejemplo: Desarrollador Front-End | Enfocado en innovacion educativa", error: errors.headline?.message, disabled: isLoading || isSaving, ...register('headline') }), _jsx(TextArea, { label: "Biografia", hint: "Comparte tu experiencia, intereses o habilidades destacadas.", error: errors.bio?.message, rows: 5, disabled: isLoading || isSaving, ...register('bio') }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: socialLinkConfigs.map(({ name, label, placeholder, type }) => (_jsx(Input, { label: label, type: type === 'email' ? 'email' : 'url', placeholder: placeholder, error: getErrorMessage(name), disabled: isLoading || isSaving, autoComplete: type === 'email' ? 'email' : 'url', ...register(name) }, name))) }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => setIsEditing(false), children: "Cancelar" }), _jsx(Button, { type: "submit", disabled: isSaving, loading: isSaving, children: "Guardar cambios" })] })] })] })] }) }, "profile-editor")) })] }) }));
};
