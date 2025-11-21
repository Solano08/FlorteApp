import { ChangeEvent, useEffect, useRef, useState } from 'react';
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
import { Facebook, Github, ImageUp, Instagram, Loader2, Mail, Plus, Trash2, Twitter, X as CloseIcon } from 'lucide-react';
import { Profile } from '../../types/profile';

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
  bio: z.string().max(500).nullable().optional(),
  instagramUrl: optionalUrlField,
  githubUrl: optionalUrlField,
  facebookUrl: optionalUrlField,
  contactEmail: optionalEmailField,
  xUrl: optionalUrlField
});

type ProfileValues = z.infer<typeof profileSchema>;

const defaultSkills: string[] = ['UI/UX', 'React', 'Innovacion', 'Trabajo colaborativo', 'Aprendiz SENA'];

const socialLinkConfigs: Array<{
  name: keyof ProfileValues;
  label: string;
  icon: typeof Github;
  placeholder: string;
  type: 'url' | 'email';
}> = [
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

const activitySummary = {
  contributionsThisWeek: 18,
  activeProjects: 3,
  streakDays: 5
};

const activityMatrix: number[][] = [
  [0, 1, 0, 2, 3, 1, 0],
  [1, 2, 1, 3, 4, 2, 1],
  [0, 1, 0, 2, 3, 1, 0],
  [2, 3, 2, 4, 4, 3, 2],
  [1, 2, 1, 2, 3, 1, 0]
];

const formatContributionLabel = (value: number) =>
  value === 1 ? '1 contribucion' : `${value} contribuciones`;

const getHeatmapClass = (value: number) => {
  if (value >= 4) return 'bg-sena-green/90';
  if (value === 3) return 'bg-sena-green/70';
  if (value === 2) return 'bg-sena-green/50';
  if (value === 1) return 'bg-sena-green/30';
  return 'bg-white/40 dark:bg-white/10';
};

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeLinkEditors, setActiveLinkEditors] = useState<Record<string, boolean>>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getProfile
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
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
        bio: profile.bio ?? '',
        instagramUrl: profile.instagramUrl ?? '',
        githubUrl: profile.githubUrl ?? '',
        facebookUrl: profile.facebookUrl ?? '',
        contactEmail: profile.contactEmail ?? '',
        xUrl: profile.xUrl ?? ''
      });
    }
  }, [profile, reset]);

  const closeEditor = () => {
    setIsEditing(false);
    setActiveLinkEditors({});
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

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
        coverImageUrl: updated.coverImageUrl,
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
        bio: updated.bio ?? '',
        instagramUrl: updated.instagramUrl ?? '',
        githubUrl: updated.githubUrl ?? '',
        facebookUrl: updated.facebookUrl ?? '',
        contactEmail: updated.contactEmail ?? '',
        xUrl: updated.xUrl ?? ''
      });
      closeEditor();
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
        coverImageUrl: updated.coverImageUrl,
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

  const removeAvatarMutation = useMutation({
    mutationFn: profileService.removeAvatar,
    onSuccess: (updated) => {
      queryClient.setQueryData<Profile>(['profile', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => {});
      updateUser(() => ({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        coverImageUrl: updated.coverImageUrl,
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

  const updateCoverMutation = useMutation({
    mutationFn: profileService.updateCover,
    onSuccess: (updated) => {
      queryClient.setQueryData<Profile>(['profile', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => {});
      setCoverPreview((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
      updateUser(() => ({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        coverImageUrl: updated.coverImageUrl,
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
    },
    onError: () => {
      setCoverPreview((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  });

  const removeCoverMutation = useMutation({
    mutationFn: profileService.removeCover,
    onSuccess: (updated) => {
      queryClient.setQueryData<Profile>(['profile', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }).catch(() => {});
      setCoverPreview((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
      updateUser(() => ({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        coverImageUrl: updated.coverImageUrl,
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

  const normalizeOptional = (value?: string | null) => {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const onSubmit = (values: ProfileValues) => {
    updateProfileMutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      bio: normalizeOptional(values.bio),
      instagramUrl: normalizeOptional(values.instagramUrl),
      githubUrl: normalizeOptional(values.githubUrl),
      facebookUrl: normalizeOptional(values.facebookUrl),
      contactEmail: normalizeOptional(values.contactEmail),
      xUrl: normalizeOptional(values.xUrl)
    });
  };

  const isSaving = updateProfileMutation.isPending;
  const isAvatarBusy = uploadAvatarMutation.isPending || removeAvatarMutation.isPending;
  const isCoverBusy = updateCoverMutation.isPending || removeCoverMutation.isPending;
  const isMediaBusy = isAvatarBusy || isCoverBusy;

  const filledLinks = socialLinkConfigs
    .map(({ name, label, icon, type }) => {
      const rawValue = profile?.[name as keyof Profile] ?? null;
      if (!rawValue) return null;
      const value = rawValue.trim();
      if (value.length === 0) return null;
      const href = type === 'email' ? `mailto:${value}` : value;
      return { label, icon, href, value, type };
    })
    .filter(
      (
        link
      ): link is { label: string; icon: typeof Github; href: string; value: string; type: 'url' | 'email' } =>
        Boolean(link)
    );

  const hasLinks = filledLinks.length > 0;

  const getErrorMessage = (field: keyof ProfileValues) =>
    (errors[field]?.message as string | undefined) ?? undefined;

  const handleOpenEditor = () => {
    if (profile) {
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio ?? '',
        instagramUrl: profile.instagramUrl ?? '',
        githubUrl: profile.githubUrl ?? '',
        facebookUrl: profile.facebookUrl ?? '',
        contactEmail: profile.contactEmail ?? '',
        xUrl: profile.xUrl ?? ''
      });
    }
    setActiveLinkEditors({});
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setIsEditing(true);
  };

  const coverImageUrl = profile?.coverImageUrl ?? null;

  const displayCoverImage =
    coverPreview ??
    coverImageUrl ??
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
  const hasStoredCover = Boolean(coverPreview || coverImageUrl);

  const handleActivateLinkField = (name: keyof ProfileValues) => {
    setActiveLinkEditors((prev) => ({ ...prev, [name as string]: true }));
  };

  const handleClearLinkField = (name: keyof ProfileValues) => {
    setActiveLinkEditors((prev) => {
      const key = name as string;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
    setValue(name, '', { shouldDirty: true });
  };

  const handleOpenCoverPicker = () => {
    if (isCoverBusy) return;
    coverFileInputRef.current?.click();
  };

  const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return previewUrl;
    });
    updateCoverMutation.mutate(file);
  };

  const handleRemoveCover = () => {
    if (!hasStoredCover || removeCoverMutation.isPending) return;
    removeCoverMutation.mutate();
  };

  const handleRemoveAvatar = () => {
    if (!profile?.avatarUrl || removeAvatarMutation.isPending) return;
    removeAvatarMutation.mutate();
  };

  useEffect(
    () => () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    },
    [coverPreview]
  );

  return (
    <DashboardLayout
      title="Perfil"
      subtitle="Administra tu informacion y mantiene tu presencia actualizada para el resto de la comunidad."
    >
      <LayoutGroup>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border border-white/25 bg-white/45 p-0 shadow-[0_34px_70px_rgba(15,38,25,0.22)] backdrop-blur-[18px] dark:border-white/15 dark:bg-white/10">
              <div className="relative h-40 w-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.32),_rgba(18,55,29,0.58),_transparent_80%)]">
                <img
                  src={displayCoverImage}
                  alt="Portada de perfil"
                  className="h-full w-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/45 via-white/10 to-white/5 dark:from-slate-900/40 dark:via-slate-900/30 dark:to-slate-900/20" />
                {(isCoverBusy || isAvatarBusy) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-6 px-6 pb-6 pt-8 sm:flex-row sm:items-end sm:gap-8">
                <div className="-mt-12">
                  <AvatarUploader
                    imageUrl={profile?.avatarUrl}
                    loading={isAvatarBusy}
                    onSelect={(file) => {
                      uploadAvatarMutation.mutate(file);
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-[var(--color-text)]">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-sm text-[var(--color-muted)]">
                      {profile?.headline ?? 'Agrega un titular atractivo para tu perfil.'}
                    </p>
                  </div>
                  <motion.div layoutId="profile-edit-launch" className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      onClick={handleOpenEditor}
                      disabled={isSaving || isMediaBusy}
                      className="w-full bg-white/60 px-6 py-2.5 text-sm font-semibold text-sena-green shadow-[0_20px_34px_rgba(18,55,29,0.18)] backdrop-blur-lg transition hover:bg-white/70 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      Editar perfil
                    </Button>
                  </motion.div>
                </div>
              </div>
              {!isEditing && (
                <div className="flex flex-wrap gap-2 px-6 pb-6">
                  {defaultSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[var(--color-accent-soft)] px-4 py-1 text-xs font-semibold text-sena-green shadow-[0_10px_20px_rgba(18,55,29,0.16)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border border-white/25 bg-white/50 shadow-[0_20px_42px_rgba(18,55,29,0.18)] backdrop-blur-[16px] dark:border-white/15 dark:bg-white/10">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Acerca de mi</h3>
              <p className="mt-3 text-sm text-[var(--color-text)]">
                {profile?.bio ?? 'Describe tus intereses, experiencias y metas dentro del SENA.'}
              </p>
            </Card>

            <Card className="border border-white/25 bg-white/50 shadow-[0_20px_42px_rgba(18,55,29,0.18)] backdrop-blur-[16px] dark:border-white/15 dark:bg-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Publicaciones recientes</h3>
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {samplePosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-white/25 bg-white/40 px-4 py-3 shadow-[0_16px_30px_rgba(18,55,29,0.16)] dark:border-white/10 dark:bg-white/10"
                  >
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
            <Card className="border border-white/25 bg-white/50 shadow-[0_20px_42px_rgba(18,55,29,0.18)] backdrop-blur-[16px] dark:border-white/15 dark:bg-white/10">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Mis enlaces</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Destaca tus redes profesionales para que te contacten facilmente.
              </p>
              <div className="mt-4 space-y-3">
                {hasLinks ? (
                  filledLinks.map(({ label, icon: Icon, href, value, type }) => {
                    const prettyValue =
                      type === 'email' ? value : value.replace(/^https?:\/\/(www\.)?/i, '');
                    const target = type === 'url' ? '_blank' : undefined;
                    const rel = type === 'url' ? 'noopener noreferrer' : undefined;
                    return (
                      <a
                        key={label}
                        href={href}
                        target={target}
                        rel={rel}
                        className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/45 px-4 py-3 text-sm text-[var(--color-text)] shadow-[0_16px_32px_rgba(18,55,29,0.16)] transition hover:border-sena-green/60 hover:bg-white/70 hover:text-sena-green dark:border-white/10 dark:bg-white/10"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sena-green/12 text-sena-green shadow-[0_8px_18px_rgba(18,55,29,0.18)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col items-start">
                          <span className="font-semibold">{label}</span>
                          <span className="text-xs text-[var(--color-muted)] break-all">{prettyValue}</span>
                        </span>
                      </a>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/35 bg-white/30 px-4 py-4 text-sm text-[var(--color-muted)] shadow-[0_16px_32px_rgba(18,55,29,0.12)]">
                    Aun no has agregado enlaces. Completa tus redes sociales desde el formulario de edicion.
                  </p>
                )}
              </div>
            </Card>

            <Card className="border border-white/25 bg-white/50 shadow-[0_20px_42px_rgba(18,55,29,0.18)] backdrop-blur-[16px] dark:border-white/15 dark:bg-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">Mi actividad</h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Visualiza tus contribuciones recientes en proyectos.
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                  Ultimas 5 semanas
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-center shadow-[0_16px_28px_rgba(18,55,29,0.14)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Contribuciones
                  </p>
                  <p className="text-2xl font-bold text-sena-green">
                    {activitySummary.contributionsThisWeek}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-center shadow-[0_16px_28px_rgba(18,55,29,0.14)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Proyectos activos
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {activitySummary.activeProjects}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-center shadow-[0_16px_28px_rgba(18,55,29,0.14)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Racha activa
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {activitySummary.streakDays} {activitySummary.streakDays === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Mapa de contribuciones
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {activityMatrix.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1">
                      {week.map((value, dayIndex) => {
                        const colorClass = getHeatmapClass(value);
                        return (
                          <span
                            key={`day-${weekIndex}-${dayIndex}`}
                            className={`h-3 w-3 rounded-md transition-colors ${colorClass}`}
                            title={formatContributionLabel(value)}
                            aria-label={formatContributionLabel(value)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div
              key="profile-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[10px]"
            >
              <motion.div
                layoutId="profile-edit-launch"
                initial={{ opacity: 0, y: 34, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 170, damping: 24 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/25 bg-white/40 p-5 shadow-[0_44px_110px_rgba(15,38,25,0.33)] backdrop-blur-[28px] dark:border-white/10 dark:bg-slate-900/75"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_62%)] opacity-80 dark:opacity-35" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/12 to-white/18 dark:from-white/8 dark:via-white/5 dark:to-white/10" />
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">Editar perfil</h3>
                      <p className="text-sm text-[var(--color-muted)]">
                        Personaliza tu informacion, portada y enlaces para destacar tu trabajo.
                      </p>
                    </div>
                    <Button variant="ghost" onClick={closeEditor} className="self-start text-[var(--color-muted)] hover:text-sena-green">
                      <CloseIcon className="mr-1 h-4 w-4" /> Cerrar
                    </Button>
                  </div>

                  <div className="rounded-[24px] border border-white/25 bg-white/30 p-4 shadow-[0_26px_56px_rgba(18,55,29,0.18)] backdrop-blur-[20px] dark:border-white/10 dark:bg-white/10">
                    <div className="relative h-36 overflow-hidden rounded-3xl border border-white/25">
                      <img src={displayCoverImage} alt="Portada actual" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-black/8" />
                      {isCoverBusy && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleOpenCoverPicker}
                          disabled={isCoverBusy}
                          className="bg-white/70 text-sena-green hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <ImageUp className="mr-2 h-4 w-4" />
                          Cambiar portada
                        </Button>
                        {hasStoredCover && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCover}
                            disabled={isCoverBusy}
                            className="text-[var(--color-muted)] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar portada
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                      <div className="-mt-14 sm:-mt-16 flex flex-col items-center gap-3">
                        <AvatarUploader
                          imageUrl={profile?.avatarUrl}
                          loading={isAvatarBusy}
                          onSelect={(file) => {
                            uploadAvatarMutation.mutate(file);
                          }}
                        />
                        {profile?.avatarUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={isAvatarBusy}
                            className="text-[var(--color-muted)] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar foto
                          </Button>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {profile?.firstName} {profile?.lastName}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          Sube una imagen panoramica (1600x400 px recomendado) para personalizar tu portada.
                        </p>
                      </div>
                    </div>
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="hidden"
                    />
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
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

                    <TextArea
                      label="Biografia"
                      hint="Comparte tu experiencia, intereses o habilidades destacadas."
                      error={errors.bio?.message}
                      rows={5}
                      disabled={isLoading || isSaving}
                      {...register('bio')}
                    />

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--color-text)]">Enlaces</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        Agrega solo las redes que quieras mostrar. Haz clic en el icono + para desplegar el campo.
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {socialLinkConfigs.map(({ name, label, icon: Icon, placeholder, type }) => {
                          const currentValue = watch(name) ?? '';
                          const isActive =
                            activeLinkEditors[name as string] || currentValue.trim().length > 0;

                          if (!isActive) {
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleActivateLinkField(name)}
                                className="flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/35 bg-white/25 text-center text-sm font-semibold text-[var(--color-muted)] shadow-[0_18px_36px_rgba(18,55,29,0.14)] transition hover:border-sena-green/60 hover:text-sena-green dark:border-white/10 dark:bg-white/10"
                              >
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.18)]">
                                  <Plus className="h-5 w-5" />
                                </span>
                                Agregar {label}
                              </button>
                            );
                          }

                          return (
                            <div
                              key={name}
                              className="rounded-2xl border border-white/30 bg-white/30 p-4 shadow-[0_20px_40px_rgba(18,55,29,0.16)] backdrop-blur-[14px] dark:border-white/10 dark:bg-white/10"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.18)]">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div className="flex-1">
                                  <Input
                                    label={label}
                                    type={type === 'email' ? 'email' : 'url'}
                                    placeholder={placeholder}
                                    error={getErrorMessage(name)}
                                    disabled={isLoading || isSaving}
                                    autoComplete={type === 'email' ? 'email' : 'url'}
                                    {...register(name)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleClearLinkField(name)}
                                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-[var(--color-muted)] transition hover:border-sena-green/60 hover:text-sena-green dark:border-white/10 dark:bg-white/10"
                                  aria-label={`Quitar ${label}`}
                                >
                                  <CloseIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="secondary" onClick={closeEditor}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSaving} loading={isSaving}>
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </DashboardLayout>
  );
};
