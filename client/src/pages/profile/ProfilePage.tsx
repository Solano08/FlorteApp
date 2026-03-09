import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';

import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { LayoutGroup } from 'framer-motion';

import { DashboardLayout } from '../../components/layout/DashboardLayout';

import { Card } from '../../components/ui/Card';

import { Input } from '../../components/ui/Input';

import { TextArea } from '../../components/ui/TextArea';

import { Button } from '../../components/ui/Button';

import { AvatarUploader, AvatarUploaderHandle } from '../../components/ui/AvatarUploader';

import { UserAvatar } from '../../components/ui/UserAvatar';

import { GlassDialog } from '../../components/ui/GlassDialog';

import { ImageCropper } from '../../components/ui/ImageCropper';

import { profileService } from '../../services/profileService';
import { activityService } from '../../services/activityService';
import { feedService } from '../../services/feedService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import {

  Activity,

  Facebook,

  Flame,

  FolderKanban,

  Github,

  ImageUp,

  Instagram,

  Loader2,

  Mail,

  Plus,

  RefreshCcw,

  Bookmark,

  Heart,

  MessageCircle,

  Share2,

  Trash2,

  Twitter,

  Upload,

  X as CloseIcon

} from 'lucide-react';

import { FeedPostAggregate, ProfileFeedPost } from '../../types/feed';

import { Profile } from '../../types/profile';

import { ActivityOverview } from '../../types/activity';

import { floatingModalContentClass } from '../../utils/modalStyles';



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



export const ProfilePage = () => {

  const queryClient = useQueryClient();

  const { updateUser, user } = useAuth();

  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [inlineFirstName, setInlineFirstName] = useState('');
  const [inlineLastName, setInlineLastName] = useState('');
  const [inlineBio, setInlineBio] = useState('');

  const [activeLinkEditors, setActiveLinkEditors] = useState<Record<string, boolean>>({});

  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [coverCropperSrc, setCoverCropperSrc] = useState<string | null>(null);

  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarUploaderRef = useRef<AvatarUploaderHandle | null>(null);

  const [isCoverEditorMenuOpen, setIsCoverEditorMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const coverEditorMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const [isSavedModalOpen, setSavedModalOpen] = useState(false);
  const [isProfilePostsModalOpen, setProfilePostsModalOpen] = useState(false);
  const [selectedSavedPost, setSelectedSavedPost] = useState<FeedPostAggregate | null>(null);
  const [selectedProfilePost, setSelectedProfilePost] = useState<ProfileFeedPost | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getProfile
  });

  const { data: activityOverview, isLoading: isLoadingActivity } = useQuery<ActivityOverview>({
    queryKey: ['profile', 'activity'],
    queryFn: activityService.getOverview,
    enabled: Boolean(profile)
  });


  const {

    data: savedPosts = [],

    isLoading: isLoadingSaved

  } = useQuery<FeedPostAggregate[]>({

    queryKey: ['feed', 'saved'],

    queryFn: () => feedService.listSavedPosts(24),

    enabled: Boolean(profile)

  });



  const { data: profilePosts = [], isLoading: isLoadingProfilePosts } = useQuery<ProfileFeedPost[]>({

    queryKey: ['profile', 'recent-posts'],

    queryFn: () => feedService.listProfilePosts(12),

    enabled: Boolean(profile)

  });



  const displayedSavedPosts = savedPosts.slice(0, 3);

  const hasMoreSaved = savedPosts.length > 3;

  const previewProfilePosts = profilePosts.slice(0, 3);

  const hasMoreProfilePosts = profilePosts.length > 3;



  const handleOpenProfilePost = (post: ProfileFeedPost) => {
    setSelectedProfilePost(post);
    setProfilePostsModalOpen(false);
  };

  const handleCloseProfilePost = () => setSelectedProfilePost(null);

  const handleOpenSavedPost = (post: FeedPostAggregate, closeSavedList = false) => {
    setSelectedSavedPost(post);
    if (closeSavedList) {
      setSavedModalOpen(false);
    }
  };

  const handleCloseSavedModal = () => {
    setSavedModalOpen(false);
    setSelectedSavedPost(null);
  };

  const handleCloseSavedPost = () => setSelectedSavedPost(null);

  const renderSavedPreview = (
    post: FeedPostAggregate,
    options?: { dense?: boolean; closeModal?: boolean; showMedia?: boolean }
  ) => {
    const dense = options?.dense ?? false;
    const showMedia = options?.showMedia ?? true;
    const snippetLength = dense ? 96 : 140;
    const snippet =
      post.content && post.content.length > snippetLength
        ? `${post.content.slice(0, snippetLength)}...`
        : post.content || 'Sin descripcion disponible.';

    return (
      <button
        key={post.id}
        type="button"
        onClick={() => handleOpenSavedPost(post, options?.closeModal ?? false)}
        className="group w-full text-left"
      >
        <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-sm text-[var(--color-text)] shadow-[0_16px_30px_rgba(18,55,29,0.16)] transition hover:border-sena-green/60 hover:bg-white/40 dark:border-white/15 dark:bg-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[var(--color-text)] line-clamp-1">{post.author.fullName}</p>
            <span className="text-[11px] text-[var(--color-muted)]">
              {new Date(post.createdAt).toLocaleDateString('es-CO')}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-[var(--color-muted)] line-clamp-2">{snippet}</p>
          {showMedia && post.mediaUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/30">
              <img src={post.mediaUrl} alt="Vista previa de la publicacion" className="h-32 w-full object-cover" />
            </div>
          )}
        </div>
      </button>
    );
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



  useEffect(() => {

    if (!profile || !user) return;

    const needsSync =

      profile.avatarUrl !== user.avatarUrl ||

      profile.coverImageUrl !== user.coverImageUrl ||

      profile.firstName !== user.firstName ||

      profile.lastName !== user.lastName ||

      (profile.headline ?? '') !== (user.headline ?? '');

    if (!needsSync) return;

    updateUser((prev) => ({

      ...prev,

      firstName: profile.firstName,

      lastName: profile.lastName,

      avatarUrl: profile.avatarUrl,

      coverImageUrl: profile.coverImageUrl,

      headline: profile.headline ?? prev.headline,

      bio: profile.bio ?? prev.bio,

      instagramUrl: profile.instagramUrl ?? prev.instagramUrl,

      githubUrl: profile.githubUrl ?? prev.githubUrl,

      facebookUrl: profile.facebookUrl ?? prev.facebookUrl,

      contactEmail: profile.contactEmail ?? prev.contactEmail,

      xUrl: profile.xUrl ?? prev.xUrl

    }));

  }, [profile, user, updateUser]);



  const closeEditor = () => {

    setIsEditing(false);

    setActiveLinkEditors({});

    setIsCoverEditorMenuOpen(false);

    setIsAvatarMenuOpen(false);

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

  const formatRelativeTime = (timestamp?: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
    if (diffMinutes < 1) return 'Justo ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getAvatarUrl = (fullName: string, avatarUrl?: string | null) =>
    avatarUrl ?? `https://avatars.dicebear.com/api/initials/${encodeURIComponent(fullName || 'Usuario')}.svg`;



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



  const summaryFallback = {

    contributionsThisWeek: 0,

    activeProjects: 0,

    streakDays: 0,

    hasProjectActivity: false

  };



  const activitySummary = activityOverview?.summary ?? summaryFallback;

  const activityStats: Array<{
    id: string;
    label: string;
    value: number;
    icon: typeof Activity;
    accent?: string;
    isActive: boolean;
    helper: string;
  }> = [
    {
      id: 'contributions',
      label: 'Contribuciones',
      value: activitySummary.contributionsThisWeek,
      icon: Activity,
      accent: 'text-sena-green',
      isActive: activitySummary.contributionsThisWeek > 0 || activitySummary.hasProjectActivity,
      helper:
        activitySummary.contributionsThisWeek > 0
          ? 'Esta semana ya sumaste puntos de contribucion.'
          : 'Aun no registras contribuciones esta semana.'
    },
    {
      id: 'projects',
      label: 'Proyectos activos',
      value: activitySummary.activeProjects,
      icon: FolderKanban,
      isActive: activitySummary.activeProjects > 0,
      helper:
        activitySummary.activeProjects > 0
          ? 'Tienes proyectos con actividad en curso.'
          : 'Unete o reactiva un proyecto para ver progreso.'
    },
    {
      id: 'streak',
      label: 'Racha activa',
      value: activitySummary.streakDays,
      icon: Flame,
      accent: 'text-amber-500',
      isActive: activitySummary.streakDays > 0,
      helper:
        activitySummary.streakDays > 1
          ? `Llevas ${activitySummary.streakDays} dias conectandote sin pausar.`
          : 'Conectate hoy y maniana para iniciar una racha.'
    }
  ];


  type SocialLinkDisplay = {

    id: (typeof socialLinkConfigs)[number]['name'];

    label: string;

    icon: typeof Github;

    href: string;

    rawValue: string;

  };



  const profileSocialLinks = useMemo<SocialLinkDisplay[]>(() => {

    if (!profile) return [];

    return socialLinkConfigs

      .map(({ name, label, icon, type }) => {

        const rawValue = (profile[name as keyof Profile] as string | null | undefined)?.trim() ?? '';

        if (!rawValue) return null;

        const href = type === 'email' ? `mailto:${rawValue}` : rawValue;

        return {

          id: name,

          label,

          icon,

          href,

          rawValue

        };

      })

      .filter((link): link is SocialLinkDisplay => Boolean(link));

  }, [profile]);



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

    setIsCoverEditorMenuOpen(false);

    setIsAvatarMenuOpen(false);

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



  const toggleCoverEditorMenu = () => setIsCoverEditorMenuOpen((previous) => !previous);

  const toggleAvatarMenu = () => setIsAvatarMenuOpen((previous) => !previous);



  const handleActivateLinkField = (name: keyof ProfileValues) => {

    setActiveLinkEditors((prev) => ({ ...prev, [name as string]: true }));

  };



  const handleCollapseLinkField = (name: keyof ProfileValues) => {

    setActiveLinkEditors((prev) => {

      const key = name as string;

      const { [key]: _removed, ...rest } = prev;

      return rest;

    });

  };



  const handleClearLinkField = (name: keyof ProfileValues) => {

    setValue(name, '', { shouldDirty: true });

    handleCollapseLinkField(name);

  };



  const handleOpenCoverPicker = () => {

    if (isCoverBusy) return;

    setIsCoverEditorMenuOpen(false);

    coverFileInputRef.current?.click();

  };



  const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = '';

    const url = URL.createObjectURL(file);

    setCoverCropperSrc(url);

  };

  const handleCoverCropperConfirm = (file: File) => {

    const previewUrl = URL.createObjectURL(file);

    setCoverPreview((previous) => {

      if (previous) URL.revokeObjectURL(previous);

      return previewUrl;

    });

    updateCoverMutation.mutate(file);

    closeCoverCropper();

  };

  const closeCoverCropper = () => {

    setCoverCropperSrc((prev) => {

      if (prev) URL.revokeObjectURL(prev);

      return null;

    });

  };



  const handleRemoveCover = () => {

    if (!hasStoredCover || removeCoverMutation.isPending) return;

    setIsCoverEditorMenuOpen(false);

    removeCoverMutation.mutate();

  };



  const handleRemoveAvatar = () => {

    if (!profile?.avatarUrl || removeAvatarMutation.isPending) return;

    setIsAvatarMenuOpen(false);

    removeAvatarMutation.mutate();

  };



  const handleAvatarPickerTrigger = () => {

    if (isAvatarBusy) return;

    setIsAvatarMenuOpen(false);

    avatarUploaderRef.current?.openPicker();

  };



  const coverMenuItems = [

    {

      id: 'upload',

      label: 'Subir foto',

      icon: Upload,

      disabled: hasStoredCover || isCoverBusy,

      onClick: handleOpenCoverPicker

    },

    {

      id: 'update',

      label: 'Actualizar foto',

      icon: RefreshCcw,

      disabled: !hasStoredCover || isCoverBusy,

      onClick: handleOpenCoverPicker

    },

    {

      id: 'remove',

      label: 'Eliminar foto',

      icon: Trash2,

      disabled: !hasStoredCover || isCoverBusy,

      onClick: handleRemoveCover

    }

  ] as const;



  const avatarMenuItems = [

    {

      id: 'avatar-upload',

      label: 'Actualizar avatar',

      icon: Upload,

      disabled: isAvatarBusy,

      onClick: handleAvatarPickerTrigger

    },

    {

      id: 'avatar-remove',

      label: 'Eliminar avatar',

      icon: Trash2,

      disabled: isAvatarBusy || !profile?.avatarUrl,

      onClick: handleRemoveAvatar

    }

  ] as const;



  useEffect(

    () => () => {

      if (coverPreview) {

        URL.revokeObjectURL(coverPreview);

      }

    },

    [coverPreview]

  );

  useEffect(

    () => () => {

      if (coverCropperSrc) {

        URL.revokeObjectURL(coverCropperSrc);

      }

    },

    [coverCropperSrc]

  );



  useEffect(() => {

    if (!isCoverEditorMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {

      if (coverEditorMenuRef.current && !coverEditorMenuRef.current.contains(event.target as Node)) {

        setIsCoverEditorMenuOpen(false);

      }

    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {

      document.removeEventListener('mousedown', handleClickOutside);

    };

  }, [isCoverEditorMenuOpen]);



  useEffect(() => {

    if (!isAvatarMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {

      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {

        setIsAvatarMenuOpen(false);

      }

    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {

      document.removeEventListener('mousedown', handleClickOutside);

    };

  }, [isAvatarMenuOpen]);



  return (

    <DashboardLayout

      title="Perfil"

      subtitle="Administra tu informacion y mantiene tu presencia actualizada para el resto de la comunidad."

    >

      <LayoutGroup>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">

          <div className="space-y-6">

            <Card className="relative overflow-visible rounded-2xl border border-white/25 bg-white/45 p-0 shadow-[0_14px_30px_rgba(18,55,29,0.12)] backdrop-blur-[14px] dark:border-white/15 dark:bg-white/10">

              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(18,55,29,0.06)_0%,_rgba(18,55,29,0.025)_38%,_transparent_70%)] blur-xl" />

              <div className="relative h-48 w-full overflow-visible rounded-t-2xl sm:h-52 md:h-56">
                <button
                  type="button"
                  onClick={toggleCoverEditorMenu}
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-t-2xl border-0 bg-transparent transition hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-sena-green/50"
                  aria-label="Cambiar portada"
                />
                <div className="relative h-full overflow-hidden rounded-t-2xl border border-white/20 shadow-[0_16px_28px_rgba(18,55,29,0.12)]">
                  <img src={displayCoverImage} alt="Portada de perfil" className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-white/0 dark:from-neutral-900/30 dark:via-neutral-900/10 dark:to-neutral-900/0" />
                </div>
                {isCoverEditorMenuOpen && (
                  <div ref={coverEditorMenuRef} className="absolute right-4 top-4 z-20">
                    <div role="menu" className="rounded-2xl border border-white/40 bg-white/95 p-1.5 text-left text-[var(--color-text)] shadow-xl backdrop-blur">
                      {coverMenuItems.map(({ id, label, icon: Icon, disabled, onClick }) => (
                        <button key={id} type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-1.5 text-left text-xs font-semibold transition hover:bg-sena-green/10 disabled:opacity-60">
                          <Icon className="h-3.5 w-3.5 text-sena-green" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                {(isCoverBusy || isAvatarBusy) && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/35 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute -bottom-16 left-6 z-30">
                  <button
                    type="button"
                    onClick={() => avatarUploaderRef.current?.openPicker()}
                    disabled={isAvatarBusy}
                    className="rounded-full outline-none ring-0 focus:ring-2 focus:ring-sena-green/50 focus:ring-offset-2 disabled:opacity-70"
                    aria-label="Cambiar foto de perfil"
                  >
                    <AvatarUploader
                      imageUrl={profile?.avatarUrl}
                      loading={isAvatarBusy}
                      onSelect={(file: File) => uploadAvatarMutation.mutate(file)}
                      showTriggerButton={false}
                    />
                  </button>
                  <div ref={avatarMenuRef} className="absolute -bottom-1 right-0">
                    <button
                      type="button"
                      onClick={toggleAvatarMenu}
                      aria-haspopup="menu"
                      aria-expanded={isAvatarMenuOpen}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/95 text-sena-green shadow-lg backdrop-blur transition hover:bg-white"
                      aria-label="Opciones de avatar"
                    >
                      <ImageUp className="h-4 w-4" />
                    </button>
                    {isAvatarMenuOpen && (
                      <div role="menu" className="absolute left-full top-0 mt-0 w-48 translate-x-2 rounded-2xl border border-white/40 bg-white/95 p-1.5 text-left shadow-xl backdrop-blur">
                        {avatarMenuItems.map(({ id, label, icon: Icon, disabled, onClick }) => (
                          <button key={id} type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-1.5 text-left text-xs font-semibold text-[var(--color-text)] transition hover:bg-sena-green/10 disabled:opacity-60">
                            <Icon className="h-3.5 w-3.5 text-sena-green" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 px-6 pb-6 pt-20 sm:flex-row sm:items-center sm:gap-8">
                <div className="flex flex-1 flex-col gap-4">
                  {!editingName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingName(true);
                        setInlineFirstName(profile?.firstName ?? '');
                        setInlineLastName(profile?.lastName ?? '');
                      }}
                      className="text-left outline-none focus:ring-2 focus:ring-sena-green/30 focus:ring-offset-2 rounded-2xl px-1 -mx-1"
                    >
                      <p className="text-xl font-semibold text-[var(--color-text)]">
                        {profile?.firstName} {profile?.lastName}
                      </p>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={inlineFirstName}
                        onChange={(e) => setInlineFirstName(e.target.value)}
                        onBlur={() => {
                          if (inlineFirstName.trim() !== (profile?.firstName ?? '') || inlineLastName.trim() !== (profile?.lastName ?? '')) {
                            updateProfileMutation.mutate({ firstName: inlineFirstName.trim(), lastName: inlineLastName.trim() });
                          }
                          setEditingName(false);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        placeholder="Nombre"
                        className="rounded-2xl border border-white/30 bg-white/60 px-2 py-1 text-lg font-semibold text-[var(--color-text)] outline-none focus:border-sena-green focus:ring-1 focus:ring-sena-green/30"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={inlineLastName}
                        onChange={(e) => setInlineLastName(e.target.value)}
                        onBlur={() => {
                          if (inlineFirstName.trim() !== (profile?.firstName ?? '') || inlineLastName.trim() !== (profile?.lastName ?? '')) {
                            updateProfileMutation.mutate({ firstName: inlineFirstName.trim(), lastName: inlineLastName.trim() });
                          }
                          setEditingName(false);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        placeholder="Apellido"
                        className="rounded-2xl border border-white/30 bg-white/60 px-2 py-1 text-lg font-semibold text-[var(--color-text)] outline-none focus:border-sena-green focus:ring-1 focus:ring-sena-green/30"
                      />
                    </div>
                  )}
                  {!editingBio ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBio(true);
                        setInlineBio(profile?.bio ?? '');
                      }}
                      className="text-left outline-none focus:ring-2 focus:ring-sena-green/30 focus:ring-offset-2 rounded-2xl px-1 -mx-1 w-full"
                    >
                      <p className="text-sm text-[var(--color-muted)]">
                        {profile?.bio ?? 'Agrega un titular atractivo para tu perfil.'}
                      </p>
                    </button>
                  ) : (
                    <textarea
                      value={inlineBio}
                      onChange={(e) => setInlineBio(e.target.value)}
                      onBlur={() => {
                        if (inlineBio !== (profile?.bio ?? '')) {
                          updateProfileMutation.mutate({ bio: inlineBio.trim() || null });
                        }
                        setEditingBio(false);
                      }}
                      placeholder="Agrega un titular atractivo para tu perfil."
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-white/30 bg-white/60 px-2 py-1 text-sm text-[var(--color-text)] outline-none focus:border-sena-green focus:ring-1 focus:ring-sena-green/30"
                      autoFocus
                    />
                  )}
                </div>
              </div>

                <div className="flex flex-wrap gap-2 px-6 pb-6">

                  {defaultSkills.map((skill) => (

                    <span

                      key={skill}

                      className="rounded-2xl bg-sena-green/10 px-3 py-1.5 text-xs font-semibold text-sena-green"

                    >

                      {skill}

                    </span>

                  ))}

                </div>

              {profileSocialLinks.length > 0 && (

                <div className="flex flex-wrap gap-2 px-6 pb-6">

                  {profileSocialLinks.map(({ id, label, icon: Icon, href, rawValue }) => (

                    <a

                      key={id}

                      href={href}

                      target={href.startsWith('mailto:') ? undefined : '_blank'}

                      rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}

                      title={rawValue}

                      className="inline-flex items-center gap-2 rounded-2xl bg-sena-green/10 px-3 py-1.5 text-xs font-semibold text-sena-green transition hover:bg-sena-green/20"

                    >

                      <Icon className="h-3.5 w-3.5" />

                      {label}

                    </a>

                  ))}

                </div>

              )}

            </Card>

            <Card className="border border-white/30 bg-white/60 shadow-[0_10px_22px_rgba(18,55,29,0.12)] backdrop-blur-[14px] dark:border-white/15 dark:bg-white/10">

              <div className="flex items-center justify-between">

                <h3 className="text-base font-semibold text-[var(--color-text)]">Publicaciones recientes</h3>

                {hasMoreProfilePosts && (

                  <Button variant="ghost" size="sm" onClick={() => setProfilePostsModalOpen(true)}>

                    Ver todas

                  </Button>

                )}

              </div>

              <div className="mt-4 space-y-3">

                {isLoadingProfilePosts ? (

                  <p className="text-xs text-[var(--color-muted)]">Cargando publicaciones recientes...</p>

                ) : profilePosts.length === 0 ? (

                  <p className="text-xs text-[var(--color-muted)]">Todavia no has compartido ninguna publicacion.</p>

                ) : (

                  previewProfilePosts.map((post) => (

                    <button

                      key={post.id}

                      type="button"

                      onClick={() => setSelectedProfilePost(post)}

                      className="group w-full text-left"

                    >

                      <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-sm text-[var(--color-text)] shadow-[0_16px_30px_rgba(18,55,29,0.16)] transition hover:border-sena-green/60 hover:bg-white/40 dark:border-white/15 dark:bg-white/10">

                        <div className="flex items-center justify-between gap-3">

                          <p className="font-semibold text-[var(--color-text)]">

                            {post.content ? `${post.content.slice(0, 72)}${post.content.length > 72 ? '...' : ''}` : 'Publicacion sin descripcion'}

                          </p>

                          <span className="text-[11px] text-[var(--color-muted)]">

                            {new Date(post.createdAt).toLocaleDateString('es-CO')}

                          </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">

                          <span>{post.source === 'shared' ? 'Compartido' : 'Propio'}</span>

                          {post.shareMessage && (

                            <span className="text-[10px] text-[var(--color-muted)] line-clamp-1">{post.shareMessage}</span>

                          )}

                        </div>

                      </div>

                    </button>

                  ))

                )}

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/dashboard', { state: { openComposer: true } })}
                >
                  Crear una nueva publicacion
                </Button>

              </div>

            </Card>

          </div>



        <div className="space-y-6">

          <Card className="border border-white/30 bg-white/60 shadow-[0_10px_22px_rgba(18,55,29,0.12)] backdrop-blur-[14px] dark:border-white/15 dark:bg-white/10">

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

            <div className="mt-4">
              {isLoadingActivity ? (
                <p className="text-xs text-[var(--color-muted)]">Cargando actividad reciente...</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {activityStats.map(({ id, label, value, icon: Icon, accent }) => (
                    <div
                      key={id}
                      className="group relative flex min-h-[110px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/25 bg-white/35 px-4 py-5 text-center shadow-[0_16px_28px_rgba(18,55,29,0.14)]"
                      role="figure"
                      title={label}
                      aria-label={label}
                    >
                      <p className="text-4xl font-bold text-[var(--color-text)]">{value}</p>
                      <Icon className={`h-7 w-7 ${accent ?? 'text-[var(--color-muted)]'}`} />
                      <span className="pointer-events-none absolute -bottom-8 rounded-2xl bg-neutral-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-[0_8px_16px_rgba(15,23,42,0.35)] transition group-hover:opacity-100">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!isLoadingActivity && !activitySummary.hasProjectActivity && (
              <p className="mt-2 text-[11px] text-[var(--color-muted)]">
                Inicia sesion y participa en proyectos para ver tu actividad reflejada aqui.
              </p>
            )}
          </Card>


          <Card className="border border-white/30 bg-white/60 shadow-[0_10px_22px_rgba(18,55,29,0.12)] backdrop-blur-[14px] dark:border-white/15 dark:bg-white/10">

            <div className="flex items-start justify-between gap-3">

              <div>

                <h3 className="text-base font-semibold text-[var(--color-text)]">Elementos guardados</h3>

                <p className="text-xs text-[var(--color-muted)]">Accede rapidamente a lo que guardaste.</p>

              </div>

            </div>



            <div className="mt-4 space-y-3">
              {isLoadingSaved ? (
                <p className="text-xs text-[var(--color-muted)]">Cargando elementos guardados...</p>
              ) : savedPosts.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No tienes elementos guardados.</p>
              ) : (
                displayedSavedPosts.map((post) => renderSavedPreview(post, { showMedia: false }))
              )}
              {hasMoreSaved && (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => setSavedModalOpen(true)}>
                  Ver todos los elementos guardados
                </Button>
              )}

            </div>

          </Card>

        </div>

        </div>

      <GlassDialog
        open={isSavedModalOpen}
        onClose={handleCloseSavedModal}
        size="lg"
        contentClassName={floatingModalContentClass}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Elementos guardados</h3>
            <p className="text-sm text-[var(--color-muted)]">Revisa todo lo que has guardado en tu perfil.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseSavedModal}
            className="rounded-2xl px-3 py-1 text-xs text-[var(--color-muted)]"
          >
            Cerrar
          </Button>
        </div>
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {savedPosts.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">Aun no tienes publicaciones guardadas.</p>
          ) : (
            savedPosts.map((post) => renderSavedPreview(post, { dense: true, closeModal: true }))
          )}
        </div>
      </GlassDialog>

      {selectedSavedPost && (
        <GlassDialog
          open={Boolean(selectedSavedPost)}
          onClose={handleCloseSavedPost}
          size="lg"
          contentClassName={floatingModalContentClass}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Publicacion guardada</p>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">{selectedSavedPost.author.fullName}</h3>
                <p className="text-xs text-[var(--color-muted)]">
                  {new Date(selectedSavedPost.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseSavedPost} className="text-[var(--color-muted)]">
                Cerrar
              </Button>
            </div>
            {selectedSavedPost.mediaUrl && (
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                <img
                  src={selectedSavedPost.mediaUrl}
                  alt="Vista previa de la publicacion guardada"
                  className="max-h-56 w-full object-cover"
                />
              </div>
            )}
            {selectedSavedPost.content && (
              <p className="text-sm text-[var(--color-text)] whitespace-pre-line">{selectedSavedPost.content}</p>
            )}
            {selectedSavedPost.attachments?.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {selectedSavedPost.attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-2xl border border-white/20 bg-white/10 p-3 text-[11px]">
                    <p className="font-semibold text-[var(--color-text)] truncate">{attachment.url}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">{attachment.mimeType ?? 'Archivo adjunto'}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </GlassDialog>
      )}

      <GlassDialog
        open={isProfilePostsModalOpen}
        onClose={() => setProfilePostsModalOpen(false)}
        size="xl"
        contentClassName={floatingModalContentClass}
      >

        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <h3 className="text-lg font-semibold text-[var(--color-text)]">Todas las publicaciones</h3>

            <p className="text-sm text-[var(--color-muted)]">Explora tus contribuciones mas recientes.</p>

          </div>

          <Button

            variant="ghost"

            size="sm"

            onClick={() => setProfilePostsModalOpen(false)}

            className="rounded-2xl px-3 py-1 text-xs text-[var(--color-muted)]"

          >

            Cerrar

          </Button>

        </div>

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">

          {profilePosts.length === 0 ? (

            <p className="text-xs text-[var(--color-muted)]">No hay publicaciones para mostrar.</p>

          ) : (

            profilePosts.map((post) => (

              <button

                key={post.id}

                type="button"

                onClick={() => handleOpenProfilePost(post)}

                className="group w-full text-left"

              >

                <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-sm text-[var(--color-text)] shadow-[0_16px_30px_rgba(18,55,29,0.16)] transition hover:border-sena-green/60 hover:bg-white/40 dark:border-white/15 dark:bg-white/10">

                  <div className="flex items-center justify-between gap-3">

                    <p className="font-semibold text-[var(--color-text)]">

                      {post.content ? `${post.content.slice(0, 72)}${post.content.length > 72 ? '...' : ''}` : 'Publicacion sin descripcion'}

                    </p>

                    <span className="text-[11px] text-[var(--color-muted)]">

                      {new Date(post.createdAt).toLocaleDateString('es-CO')}

                    </span>

                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">

                    <span>{post.source === 'shared' ? 'Compartido' : 'Propio'}</span>

                    {post.shareMessage && <span className="text-[10px] line-clamp-1">{post.shareMessage}</span>}

                  </div>

                </div>

              </button>

            ))

          )}

        </div>

      </GlassDialog>



      {selectedProfilePost && (

        <GlassDialog

          open={Boolean(selectedProfilePost)}

          onClose={handleCloseProfilePost}

          size="lg"

          contentClassName={floatingModalContentClass}

        >

          <div className="space-y-5">
            {selectedProfilePost.source === 'shared' && (
              <div className="rounded-2xl border border-white/20 bg-white/25 p-3 shadow-[0_16px_30px_rgba(18,55,29,0.18)] backdrop-blur">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    fullName={profile ? `${profile.firstName} ${profile.lastName}` : user ? `${user.firstName} ${user.lastName}` : 'Tu perfil'}
                    avatarUrl={profile?.avatarUrl ?? user?.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      Compartido por {profile ? `${profile.firstName} ${profile.lastName}` : 'tu perfil'}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-sena-green">Compartido</p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {formatRelativeTime(selectedProfilePost.sharedAt ?? selectedProfilePost.createdAt)}
                    </p>
                  </div>
                </div>
                {selectedProfilePost.shareMessage && (
                  <p className="mt-3 text-sm text-[var(--color-text)] whitespace-pre-line">
                    {selectedProfilePost.shareMessage}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4 rounded-2xl border border-white/25 bg-white/40 p-4 text-[var(--color-text)] shadow-[0_24px_45px_rgba(18,55,29,0.2)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
              <div className="flex items-start gap-3">
                <UserAvatar
                  fullName={selectedProfilePost.author.fullName}
                  avatarUrl={selectedProfilePost.author.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {selectedProfilePost.author.fullName}
                  </p>
                  {selectedProfilePost.author.headline && (
                    <p className="text-xs text-[var(--color-muted)] truncate">{selectedProfilePost.author.headline}</p>
                  )}
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {formatRelativeTime(selectedProfilePost.createdAt)}
                  </p>
                </div>
              </div>

              {selectedProfilePost.content && (
                <p className="text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-line">
                  {selectedProfilePost.content}
                </p>
              )}

              {selectedProfilePost.mediaUrl && (
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                  <img
                    src={selectedProfilePost.mediaUrl}
                    alt="Contenido de la publicacion"
                    className="max-h-72 w-full object-cover"
                  />
                </div>
              )}

              {selectedProfilePost.attachments?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedProfilePost.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="rounded-2xl border border-white/20 bg-white/12 p-3 text-[11px] shadow-sm"
                    >
                      <p className="font-semibold text-[var(--color-text)] truncate">{attachment.url}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">
                        {attachment.mimeType ?? 'Archivo adjunto'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button type="button" variant="ghost" disabled className="justify-center gap-2 text-xs sm:text-sm">
                  <Heart className="h-4 w-4 text-rose-500" /> Reaccionar
                </Button>
                <Button type="button" variant="ghost" disabled className="justify-center gap-2 text-xs sm:text-sm">
                  <MessageCircle className="h-4 w-4 text-[var(--color-text)]" /> Comentar
                </Button>
                <Button type="button" variant="ghost" disabled className="justify-center gap-2 text-xs sm:text-sm">
                  <Share2 className="h-4 w-4 text-[var(--color-text)]" /> Compartir
                </Button>
                <Button type="button" variant="ghost" disabled className="justify-center gap-2 text-xs sm:text-sm">
                  <Bookmark className="h-4 w-4 text-[var(--color-text)]" /> Guardar
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={handleCloseProfilePost} className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>

        </GlassDialog>

      )}

      <GlassDialog

        open={Boolean(coverCropperSrc)}

        onClose={closeCoverCropper}

        size="lg"

        contentClassName="max-w-2xl"

      >

        <h3 className="text-lg font-semibold text-[var(--color-text)]">Recortar foto de portada</h3>

        {coverCropperSrc && (

          <ImageCropper

            imageSrc={coverCropperSrc}

            aspectRatio={4}

            outputWidth={1600}

            outputHeight={400}

            outputFileName="cover.jpg"

            onConfirm={handleCoverCropperConfirm}

            onCancel={closeCoverCropper}

            confirmLabel="Aplicar"

            cancelLabel="Cancelar"

          />

        )}

      </GlassDialog>

    </LayoutGroup>

  </DashboardLayout>

);

};

