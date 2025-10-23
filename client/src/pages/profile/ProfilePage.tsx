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
import { Profile } from '../../types/profile';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Ingresa tu nombre'),
  lastName: z.string().min(2, 'Ingresa tu apellido'),
  headline: z.string().max(160).nullable().optional(),
  bio: z.string().max(500).nullable().optional()
});

type ProfileValues = z.infer<typeof profileSchema>;

const defaultSkills: string[] = ['UI/UX', 'React', 'Innovacion', 'Trabajo colaborativo', 'Aprendiz SENA'];

const portfolioLinks: Array<{ label: string; icon: typeof Github; href: string }> = [
  { label: 'GitHub', icon: Github, href: 'https://github.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com' },
  { label: 'Behance', icon: Globe2, href: 'https://www.behance.net' },
  { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' }
];

const samplePosts: Array<{ id: string; title: string; description: string }> = [
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileValues>({
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
      queryClient.setQueryData<Profile>(['profile', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => {});
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
      queryClient.setQueryData<Profile>(['profile', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => {});
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

  const onSubmit = (values: ProfileValues) => {
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

  return (
    <DashboardLayout
      title="Perfil"
      subtitle="Administra tu informacion y mantiene tu presencia actualizada para el resto de la comunidad."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <AvatarUploader
                imageUrl={profile?.avatarUrl}
                loading={uploadAvatarMutation.isPending}
                onSelect={(file) => {
                  uploadAvatarMutation.mutate(file);
                }}
              />
              <div>
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {profile?.headline ?? 'Agrega un titular atractivo para tu perfil.'}
                </p>
              </div>
              <Button variant="secondary" onClick={handleOpenEditor} disabled={isLoading}>
                Editar perfil
              </Button>
            </div>
            {!isEditing && (
              <div className="flex flex-wrap justify-center gap-3">
                {defaultSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[var(--color-accent-soft)] px-4 py-1 text-xs font-semibold text-sena-green"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Acerca de mi</h3>
            <p className="mt-3 text-sm text-[var(--color-text)]">
              {profile?.bio ?? 'Describe tus intereses, experiencias y metas dentro del SENA.'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Publicaciones recientes</h3>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {samplePosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{post.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">{post.description}</p>
                </div>
              ))}
              <Button variant="secondary" className="w-full">
                Crear una nueva publicacion
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Mis enlaces</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Destaca tus redes profesionales para que te contacten facilmente.
            </p>
            <div className="mt-4 grid gap-3">
              {portfolioLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-sena-green/60 hover:text-sena-green"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl rounded-3xl border border-white/25 bg-white/20 p-6 shadow-[0_28px_60px_rgba(18,55,29,0.22)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">Editar perfil</h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    Actualiza tu informacion y compartela con la comunidad.
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cerrar
                </Button>
              </div>
              <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Nombre"
                    error={errors.firstName?.message}
                    disabled={isLoading || isSaving}
                    {...register('firstName')}
                  />
                  <Input
                    label="Apellido"
                    error={errors.lastName?.message}
                    disabled={isLoading || isSaving}
                    {...register('lastName')}
                  />
                </div>
                <Input
                  label="Titular"
                  hint="Ejemplo: Desarrollador Front-End | Enfocado en innovacion educativa"
                  error={errors.headline?.message}
                  disabled={isLoading || isSaving}
                  {...register('headline')}
                />
                <TextArea
                  label="Biografia"
                  hint="Comparte tu experiencia, intereses o habilidades destacadas."
                  error={errors.bio?.message}
                  rows={5}
                  disabled={isLoading || isSaving}
                  {...register('bio')}
                />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!isDirty} loading={isSaving}>
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
