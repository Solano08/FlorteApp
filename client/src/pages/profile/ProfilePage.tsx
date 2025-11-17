import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { AvatarUploader } from '../../components/ui/AvatarUploader';
import { profileService } from '../../services/profileService';
import { feedService } from '../../services/feedService';
import { useAuth } from '../../hooks/useAuth';
import {
  Facebook,
  Flame,
  Github,
  ImageUp,
  Instagram,
  Loader2,
  Mail,
  Plus,
  TrendingUp,
  Twitter,
  Users,
  X as CloseIcon
} from 'lucide-react';
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

type SocialLinkField = keyof Pick<
  ProfileValues,
  'instagramUrl' | 'githubUrl' | 'facebookUrl' | 'contactEmail' | 'xUrl'
>;

const defaultSkills: string[] = ['UI/UX', 'React', 'Innovacion', 'Trabajo colaborativo', 'Aprendiz SENA'];

const socialLinkConfigs: Array<{
  name: SocialLinkField;
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

const WEEKS_TO_SHOW = 5;

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
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeLinkEditors, setActiveLinkEditors] = useState<Record<string, boolean>>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverMenuRef = useRef<HTMLDivElement | null>(null);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isSavedPostsModalOpen, setIsSavedPostsModalOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getProfile
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['profile', 'activity'],
    queryFn: () => profileService.getActivityOverview(WEEKS_TO_SHOW)
  });

  const { data: recentPostsData, isLoading: isRecentPostsLoading } = useQuery({
    queryKey: ['profile', 'recent-posts'],
    queryFn: () => profileService.getRecentPosts(3)
  });

  const { data: savedPosts = [], isLoading: isSavedPostsLoading } = useQuery({
    queryKey: ['profile', 'savedPosts'],
    queryFn: () => feedService.listSavedPosts()
  });

  const recentPosts = recentPostsData ?? [];
  const savedPostsCount = savedPosts.length;
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium'
      }),
    []
  );

  const contributionSummary = activityData?.summary;
  const contributionsThisWeek = contributionSummary?.contributionsThisWeek ?? 0;
  const activeProjects = contributionSummary?.activeProjects ?? 0;
  const streakDays = contributionSummary?.streakDays ?? 0;
  const hasProjectActivity = Boolean(contributionSummary?.hasProjectActivity);
  const profileDisplayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || profile?.email || 'Aprendiz SENA';
  const profileAvatar =
    profile?.avatarUrl ?? `https://avatars.dicebear.com/api/initials/${encodeURIComponent(profileDisplayName)}.svg`;
  const activityCardConfig = [
    {
      key: 'contributions',
      label: 'Contribuciones',
      value: contributionsThisWeek,
      icon: TrendingUp,
      valueActiveClass: 'text-sena-green',
      iconActiveClass: 'bg-sena-green/12 text-sena-green'
    },
    {
      key: 'projects',
      label: 'Proyectos activos',
      value: activeProjects,
      icon: Users,
      valueActiveClass: 'text-[var(--color-text)]',
      iconActiveClass: 'bg-sena-green/10 text-sena-green'
    },
    {
      key: 'streak',
      label: 'Racha activa',
      value: streakDays,
      icon: Flame,
      valueActiveClass: 'text-[var(--color-text)]',
      iconActiveClass: 'bg-sena-green/12 text-sena-green'
    }
  ] as const;

  const contributionsMatrix = useMemo(() => {
    const totalDays = WEEKS_TO_SHOW * 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMap = new Map<string, number>();
    (activityData?.heatmap ?? []).forEach(({ date, contributions }) => {
      dayMap.set(date, contributions);
    });
    return Array.from({ length: WEEKS_TO_SHOW }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const offset = totalDays - 1 - (weekIndex * 7 + dayIndex);
        const current = new Date(today);
        current.setDate(today.getDate() - offset);
        const iso = current.toISOString().slice(0, 10);
        return dayMap.get(iso) ?? 0;
      })
    );
  }, [activityData]);

  const hasHeatmapValues = hasProjectActivity && contributionsMatrix.some((week) => week.some((value) => value > 0));
  const recentPostSkeletons = [0, 1, 2];
  const heatmapSkeletons = Array.from({ length: WEEKS_TO_SHOW }, (_, index) => index);

  const formatPostExcerpt = (content: string) => {
    const normalized = content.trim();
    if (normalized.length <= 160) {
      return normalized;
    }
    return `${normalized.slice(0, 157)}...`;
  };

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
    setIsCoverMenuOpen(false);
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
      const rawValue = profile?.[name] ?? null;
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

  const handleActivateLinkField = (name: SocialLinkField) => {
    setActiveLinkEditors((prev) => ({ ...prev, [name as string]: true }));
  };

  const handleClearLinkField = (name: SocialLinkField) => {
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

  useEffect(() => {
    if (!isCoverMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!coverMenuRef.current?.contains(event.target as Node)) {
        setIsCoverMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCoverMenuOpen]);

  useEffect(() => {
    if (savedPostsCount === 0 && isSavedPostsModalOpen) {
      setIsSavedPostsModalOpen(false);
    }
  }, [savedPostsCount, isSavedPostsModalOpen]);

  return (
    <DashboardLayout
      fluid
      title="Perfil"
      subtitle="Administra tu informacion y mantiene tu presencia actualizada para el resto de la comunidad."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
          <div className="space-y-6">
            <Card className="relative overflow-visible border border-slate-100 bg-white p-0 shadow-[0_26px_60px_rgba(15,38,25,0.12)] dark:border-white/15 dark:bg-white/10">
              <div className="relative px-4 pt-4 sm:px-6">
                <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-white/60 bg-slate-100 shadow-[0_20px_50px_rgba(15,38,25,0.12)] sm:h-40 lg:h-48 dark:border-white/15 dark:bg-white/5">
                  <img
                    src={displayCoverImage}
                    alt="Portada de perfil"
                    className="h-full w-full object-cover"
                  />
                  {(isCoverBusy || isAvatarBusy) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-6 px-4 pb-6 pt-14 sm:flex-row sm:items-end sm:gap-8 sm:px-6">
                <div className="-mt-16 flex-shrink-0 sm:-mt-20">
                  <div className="relative z-10 h-28 w-28 rounded-full border-4 border-white bg-white shadow-[0_20px_50px_rgba(15,38,25,0.35)] dark:border-white/40">
                    <img
                      src={profileAvatar}
                      alt={profileDisplayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
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
                  <div className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      onClick={handleOpenEditor}
                      disabled={isSaving || isMediaBusy}
                      className="w-full bg-white/60 px-6 py-2.5 text-sm font-semibold text-sena-green shadow-[0_20px_34px_rgba(18,55,29,0.18)] backdrop-blur-lg transition hover:bg-white/70 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      Editar perfil
                    </Button>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <div className="flex flex-wrap gap-2 px-4 pb-6 sm:px-6">
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

            <Card className="border border-slate-100 bg-white shadow-[0_20px_42px_rgba(15,38,25,0.12)] dark:border-white/15 dark:bg-white/10">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Acerca de mi</h3>
              <p className="mt-3 text-sm text-[var(--color-text)]">
                {profile?.bio ?? 'Describe tus intereses, experiencias y metas dentro del SENA.'}
              </p>
            </Card>

            <Card className="border border-slate-100 bg-white shadow-[0_20px_42px_rgba(15,38,25,0.12)] dark:border-white/15 dark:bg-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Publicaciones recientes</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  Ver todas
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {isRecentPostsLoading
                  ? recentPostSkeletons.map((index) => (
                      <div
                        key={`recent-post-skeleton-${index}`}
                        className="animate-pulse rounded-2xl border border-white/25 bg-white/25 px-4 py-3 shadow-[0_16px_30px_rgba(18,55,29,0.12)]"
                      >
                        <div className="h-4 w-3/4 rounded-full bg-white/50" />
                        <div className="mt-3 h-3 w-1/2 rounded-full bg-white/30" />
                      </div>
                    ))
                  : recentPosts.length > 0
                    ? recentPosts.map((post) => (
                        <div
                          key={post.id}
                          className="rounded-2xl border border-white/25 bg-white/40 px-4 py-3 shadow-[0_16px_30px_rgba(18,55,29,0.16)] backdrop-blur-[16px] dark:border-white/10 dark:bg-white/10"
                        >
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            {formatPostExcerpt(post.content)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                            <span>{dateFormatter.format(new Date(post.createdAt))}</span>
                            {post.tags?.length ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sena-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sena-green">
                                {post.tags.slice(0, 2).join(' | ')}
                                {post.tags.length > 2 ? ` +${post.tags.length - 2}` : ''}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    : (
                        <p className="rounded-2xl border border-dashed border-white/35 bg-white/20 px-4 py-4 text-sm text-[var(--color-muted)] shadow-[0_16px_34px_rgba(18,55,29,0.12)]">
                          Aun no tienes publicaciones agregadas. Comparte tu primera actualizacion desde el tablero
                          principal.
                        </p>
                      )}
                <Button variant="secondary" className="w-full" onClick={() => navigate('/dashboard')}>
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

            <Card className="border border-white/25 bg-white/55 shadow-[0_18px_40px_rgba(18,55,29,0.16)] backdrop-blur-[16px] dark:border-white/10 dark:bg-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">Publicaciones guardadas</h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Revisa mas tarde los aportes que te llamaron la atencion.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavedPostsModalOpen(true)}
                  disabled={isSavedPostsLoading || savedPostsCount === 0}
                >
                  Ver todas
                </Button>
              </div>

              <p className="mt-4 rounded-2xl border border-dashed border-white/30 bg-white/20 px-4 py-4 text-sm text-[var(--color-muted)]">
                {isSavedPostsLoading
                  ? 'Cargando tus publicaciones guardadas...'
                  : savedPostsCount > 0
                    ? `Tienes ${savedPostsCount} publicaciones guardadas. Haz clic en "Ver todas" para verlas sin salir de tu perfil.`
                    : 'Cuando guardes una publicacion desde el feed, aparecera aqui.'}
              </p>
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
                {activityCardConfig.map(({ key, label, value, icon: StatIcon, valueActiveClass, iconActiveClass }) => {
                  const hasValue = value > 0;
                  const textClass = hasValue ? valueActiveClass : 'text-slate-500';
                  const iconClass = hasValue ? iconActiveClass : 'bg-slate-200 text-slate-500';
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-white/25 bg-white/35 px-4 py-5 text-center shadow-[0_16px_28px_rgba(18,55,29,0.14)]"
                    >
                      <span className="sr-only">{label}</span>
                      <div
                        className="relative flex items-center justify-center"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        <span
                          className={`absolute text-5xl font-semibold opacity-20 blur-sm ${textClass}`}
                          aria-hidden="true"
                        >
                          {isActivityLoading ? '0' : value}
                        </span>
                        <span className={`relative text-3xl font-semibold ${textClass}`}>
                          {isActivityLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : value}
                        </span>
                      </div>
                      <div className="group relative mt-4 flex justify-center">
                        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
                          <StatIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="pointer-events-none absolute bottom-full mb-2 hidden rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-[0_12px_24px_rgba(15,38,25,0.18)] group-hover:flex dark:border-white/15 dark:bg-white/10 dark:text-white">
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Mapa de contribuciones
                </p>
                <div className="mt-3 min-h-[64px]">
                  {isActivityLoading ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {heatmapSkeletons.map((week) => (
                        <div key={`heatmap-skeleton-${week}`} className="grid grid-rows-7 gap-1">
                          {Array.from({ length: 7 }).map((_, index) => (
                            <span
                              key={`heatmap-skeleton-${week}-${index}`}
                              className="h-3 w-3 rounded-md bg-white/30"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : hasHeatmapValues ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {contributionsMatrix.map((week, weekIndex) => (
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
                  ) : (
                    <p className="rounded-2xl border border-dashed border-white/35 bg-white/20 px-4 py-4 text-sm text-[var(--color-muted)] shadow-[0_16px_32px_rgba(18,55,29,0.12)]">
                      Aun no registras actividad en proyectos activos. Sumate a un proyecto para comenzar tu mapa de
                      contribuciones.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <GlassDialog
          open={isSavedPostsModalOpen}
          onClose={() => setIsSavedPostsModalOpen(false)}
          size="lg"
          overlayClassName="!bg-slate-100/70 backdrop-blur-sm dark:!bg-slate-950/65"
          contentClassName="p-0 !overflow-hidden !bg-white/60 !backdrop-blur-[30px] !border-white/60 !shadow-[0_40px_100px_rgba(15,38,25,0.2)] dark:!bg-slate-900/85 dark:!border-white/15"
        >
          <div className="max-h-[80vh] space-y-5 overflow-y-auto p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Publicaciones guardadas</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Selecciona una publicacion para abrirla en el feed principal.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsSavedPostsModalOpen(false)}
                className="h-9 w-9 rounded-full p-0 text-[var(--color-text)]"
              >
                <CloseIcon className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </div>
            <div className="space-y-4">
              {isSavedPostsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`saved-modal-skeleton-${index}`}
                    className="h-20 animate-pulse rounded-2xl border border-white/25 bg-white/40"
                  />
                ))
              ) : savedPostsCount === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/30 bg-white/20 px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                  Aun no tienes publicaciones guardadas.
                </p>
              ) : (
                savedPosts.map((post) => {
                  const formattedDate = dateFormatter.format(new Date(post.createdAt));
                  const authorAvatar =
                    post.author.avatarUrl ??
                    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(post.author.fullName)}.svg`;
                  return (
                    <button
                      key={`saved-modal-${post.id}`}
                      type="button"
                      onClick={() => {
                        setIsSavedPostsModalOpen(false);
                        navigate(`/dashboard?post=${post.id}`);
                      }}
                      className="w-full text-left"
                    >
                      <div className="rounded-2xl border border-white/25 bg-white/50 p-4 text-sm text-[var(--color-text)] shadow-[0_20px_40px_rgba(18,55,29,0.18)] transition hover:border-sena-green/50 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-sena-green/40">
                        <div className="flex items-start gap-3">
                          <img
                            src={authorAvatar}
                            alt={post.author.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{post.author.fullName}</p>
                            <p className="text-[11px] text-[var(--color-muted)]">{formattedDate}</p>
                          </div>
                        </div>
                        {post.content && (
                          <p className="mt-3 line-clamp-3 text-[var(--color-text)]">{post.content}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-[var(--color-muted)]">
                          <span>{post.reactionCount} reacciones</span>
                          <span>{post.commentCount} comentarios</span>
                          <span>{post.shareCount} compartidos</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </GlassDialog>

        <GlassDialog
          open={isEditing}
          onClose={closeEditor}
          size="xl"
          preventCloseOnBackdrop={isSaving}
          overlayClassName="!bg-slate-100/70 backdrop-blur-sm dark:!bg-slate-950/65"
          contentClassName="p-0 !overflow-visible !bg-white/55 !backdrop-blur-[30px] !border-white/60 !shadow-[0_50px_120px_rgba(15,38,25,0.25)] dark:!bg-slate-900/85 dark:!border-white/15"
        >
          <div className="max-h-[85vh] space-y-6 overflow-y-auto p-5 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Editar perfil</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Personaliza tu informacion, portada y enlaces para destacar tu trabajo.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={closeEditor}
                className="self-start rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-[0_12px_30px_rgba(15,38,25,0.12)] backdrop-blur hover:border-sena-green/40 hover:text-sena-green dark:border-white/25 dark:bg-white/15 dark:text-[var(--color-muted)] dark:shadow-[0_10px_20px_rgba(18,55,29,0.18)]"
              >
                <CloseIcon className="mr-1 h-4 w-4" /> Cerrar
              </Button>
            </div>

            <div className="space-y-6">
              <div className="relative h-36 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_24px_60px_rgba(15,38,25,0.18)] dark:border-white/20 dark:bg-white/10">
                <img src={displayCoverImage} alt="Portada actual" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 dark:from-black/22 dark:to-black/8" />
                {isCoverBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute right-10 top-4 sm:right-14" ref={coverMenuRef}>
                  <button
                    type="button"
                    disabled={isCoverBusy}
                    onClick={() => setIsCoverMenuOpen((prev) => !prev)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 text-slate-600 shadow-[0_18px_36px_rgba(15,38,25,0.2)] transition hover:text-sena-green disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-white/15 dark:text-white"
                  >
                    <ImageUp className="h-5 w-5" />
                  </button>
                  {isCoverMenuOpen && (
                    <div className="absolute right-full top-12 z-30 mr-4 w-48 rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-sm text-slate-600 shadow-[0_22px_60px_rgba(15,38,25,0.28)] backdrop-blur dark:border-white/20 dark:bg-slate-900/90 dark:text-white">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-sena-green/10"
                        onClick={() => {
                          setIsCoverMenuOpen(false);
                          handleOpenCoverPicker();
                        }}
                      >
                        Actualizar portada
                      </button>
                      {hasStoredCover && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-50"
                          onClick={() => {
                            setIsCoverMenuOpen(false);
                            handleRemoveCover();
                          }}
                        >
                          Eliminar portada
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                <div className="-mt-14 sm:-mt-16 flex flex-col items-center gap-3">
                  <AvatarUploader
                    imageUrl={profile?.avatarUrl}
                    loading={isAvatarBusy}
                    onRemove={profile?.avatarUrl ? handleRemoveAvatar : undefined}
                    onSelect={(file) => {
                      uploadAvatarMutation.mutate(file);
                    }}
                  />
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
                <div className="grid gap-4 md:grid-cols-2">
                  {socialLinkConfigs.map(({ name, label, icon: Icon, placeholder, type }) => {
                    const currentValue = watch(name) ?? '';
                    const isActive = activeLinkEditors[name as string] || currentValue.trim().length > 0;

                    if (!isActive) {
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleActivateLinkField(name)}
                          className="flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-white/85 text-center text-sm font-semibold text-slate-500 shadow-[0_18px_42px_rgba(18,55,29,0.12)] transition hover:border-sena-green/60 hover:text-sena-green dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-muted)]"
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
                        className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_26px_52px_rgba(18,55,29,0.14)] backdrop-blur-[14px] dark:border-white/10 dark:bg-white/10 dark:shadow-[0_20px_40px_rgba(18,55,29,0.16)]"
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
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-500 transition hover:border-sena-green/60 hover:text-sena-green dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-muted)]"
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
        </GlassDialog>
    </DashboardLayout>
  );
};
