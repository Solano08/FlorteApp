import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { AvatarUploader } from '../../components/ui/AvatarUploader';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../hooks/useAuth';
import { Github, Globe2, Linkedin, Twitter } from 'lucide-react';
const profileSchema = z.object({
    firstName: z.string().min(2, 'Ingresa tu nombre'),
    lastName: z.string().min(2, 'Ingresa tu apellido'),
    headline: z.string().max(160).nullable().optional(),
    bio: z.string().max(500).nullable().optional()
});
const defaultSkills = ['UI/UX', 'React', 'Innovacion', 'Trabajo colaborativo', 'Aprendiz SENA'];
const portfolioLinks = [
    { label: 'GitHub', icon: Github, href: 'https://github.com' },
    { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com' },
    { label: 'Behance', icon: Globe2, href: 'https://www.behance.net' },
    { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' }
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
export const ProfilePage = () => {
    const queryClient = useQueryClient();
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: profileService.getProfile
    });
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            headline: '',
            bio: ''
        }
    });
    useEffect(() => {
        if (profile) {
            reset({
                firstName: profile.firstName,
                lastName: profile.lastName,
                headline: profile.headline ?? '',
                bio: profile.bio ?? ''
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
                role: updated.role,
                isActive: updated.isActive
            }));
            reset({
                firstName: updated.firstName,
                lastName: updated.lastName,
                headline: updated.headline ?? '',
                bio: updated.bio ?? ''
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
                role: updated.role,
                isActive: updated.isActive
            }));
        }
    });
    const onSubmit = (values) => {
        updateProfileMutation.mutate({
            firstName: values.firstName,
            lastName: values.lastName,
            headline: values.headline ?? null,
            bio: values.bio ?? null
        });
    };
    const isSaving = updateProfileMutation.isPending;
    const handleOpenEditor = () => {
        if (profile) {
            reset({
                firstName: profile.firstName,
                lastName: profile.lastName,
                headline: profile.headline ?? '',
                bio: profile.bio ?? ''
            });
        }
        setIsEditing(true);
    };
    return (_jsxs(DashboardLayout, { title: "Perfil", subtitle: "Administra tu informacion y mantiene tu presencia actualizada para el resto de la comunidad.", children: [_jsxs("div", { className: "grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col items-center gap-4 text-center", children: [_jsx(AvatarUploader, { imageUrl: profile?.avatarUrl, loading: uploadAvatarMutation.isPending, onSelect: (file) => {
                                                    uploadAvatarMutation.mutate(file);
                                                } }), _jsxs("div", { children: [_jsxs("p", { className: "text-lg font-semibold text-[var(--color-text)]", children: [profile?.firstName, " ", profile?.lastName] }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: profile?.headline ?? 'Agrega un titular atractivo para tu perfil.' })] }), _jsx(Button, { variant: "secondary", onClick: handleOpenEditor, disabled: isLoading, children: "Editar perfil" })] }), !isEditing && (_jsx("div", { className: "flex flex-wrap justify-center gap-3", children: defaultSkills.map((skill) => (_jsx("span", { className: "rounded-full bg-[var(--color-accent-soft)] px-4 py-1 text-xs font-semibold text-sena-green", children: skill }, skill))) }))] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Acerca de mi" }), _jsx("p", { className: "mt-3 text-sm text-[var(--color-text)]", children: profile?.bio ?? 'Describe tus intereses, experiencias y metas dentro del SENA.' })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Publicaciones recientes" }), _jsx(Button, { variant: "ghost", size: "sm", children: "Ver todas" })] }), _jsxs("div", { className: "mt-4 space-y-4", children: [samplePosts.map((post) => (_jsxs("div", { className: "rounded-xl border border-[var(--color-border)] px-4 py-3", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: post.title }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: post.description })] }, post.id))), _jsx(Button, { variant: "secondary", className: "w-full", children: "Crear una nueva publicacion" })] })] })] }), _jsx("div", { className: "space-y-6", children: _jsxs(Card, { children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: "Mis enlaces" }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-muted)]", children: "Destaca tus redes profesionales para que te contacten facilmente." }), _jsx("div", { className: "mt-4 grid gap-3", children: portfolioLinks.map(({ label, icon: Icon, href }) => (_jsxs("a", { href: href, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-sena-green/60 hover:text-sena-green", children: [_jsx(Icon, { className: "h-4 w-4" }), label] }, label))) })] }) })] }), _jsx(AnimatePresence, { children: isEditing && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 }, className: "w-full max-w-xl rounded-3xl border border-white/25 bg-white/20 p-6 shadow-[0_28px_60px_rgba(18,55,29,0.22)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Editar perfil" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Actualiza tu informacion y compartela con la comunidad." })] }), _jsx(Button, { variant: "ghost", onClick: () => setIsEditing(false), children: "Cerrar" })] }), _jsxs("form", { className: "mt-6 space-y-5", onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Input, { label: "Nombre", error: errors.firstName?.message, disabled: isLoading || isSaving, ...register('firstName') }), _jsx(Input, { label: "Apellido", error: errors.lastName?.message, disabled: isLoading || isSaving, ...register('lastName') })] }), _jsx(Input, { label: "Titular", hint: "Ejemplo: Desarrollador Front-End | Enfocado en innovacion educativa", error: errors.headline?.message, disabled: isLoading || isSaving, ...register('headline') }), _jsx(TextArea, { label: "Biografia", hint: "Comparte tu experiencia, intereses o habilidades destacadas.", error: errors.bio?.message, rows: 5, disabled: isLoading || isSaving, ...register('bio') }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => setIsEditing(false), children: "Cancelar" }), _jsx(Button, { type: "submit", disabled: !isDirty, loading: isSaving, children: "Guardar cambios" })] })] })] }) })) })] }));
};
