import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { ProfileActivitySection } from '../../components/profile/ProfileActivitySection';
import { profileService } from '../../services/profileService';
import { activityService } from '../../services/activityService';
import { feedService } from '../../services/feedService';
import { useAuth } from '../../hooks/useAuth';
import { Github, Instagram, Facebook, Mail, Twitter, type LucideIcon } from 'lucide-react';
import { friendService } from '../../services/friendService';
import { chatService } from '../../services/chatService';
import { useToast } from '../../hooks/useToast';
import type { ProfileFeedPost } from '../../types/feed';
import { floatingModalContentClass } from '../../utils/modalStyles';

type SocialKey = 'instagramUrl' | 'githubUrl' | 'facebookUrl' | 'xUrl' | 'contactEmail';

const socialIconConfigs: Array<{ key: SocialKey; label: string; icon: LucideIcon }> = [
  { key: 'instagramUrl', label: 'Instagram', icon: Instagram },
  { key: 'githubUrl', label: 'GitHub', icon: Github },
  { key: 'facebookUrl', label: 'Facebook', icon: Facebook },
  { key: 'xUrl', label: 'X (Twitter)', icon: Twitter },
  { key: 'contactEmail', label: 'Correo de contacto', icon: Mail }
];

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
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [selectedPost, setSelectedPost] = useState<ProfileFeedPost | null>(null);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getPublicProfile(userId ?? ''),
    enabled: Boolean(userId)
  });

  const { data: activityOverview, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['profile', userId, 'activity'],
    queryFn: () => activityService.getOverviewForUser(userId ?? ''),
    enabled: Boolean(userId && profile)
  });

  const { data: profilePosts = [], isLoading: isLoadingProfilePosts } = useQuery({
    queryKey: ['profile', userId, 'posts'],
    queryFn: () => feedService.listProfilePostsForUser(userId ?? '', 12),
    enabled: Boolean(userId && profile)
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: friendService.listRequests,
    enabled: Boolean(userId)
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => friendService.sendRequest(userId ?? ''),
    onSuccess: () => {
      toast.success('Solicitud de amistad enviada');
    },
    onError: () => {
      toast.error('No se pudo enviar la solicitud. Intenta nuevamente.');
    }
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendService.cancelRequest(requestId),
    onSuccess: () => {
      toast.success('Solicitud de amistad cancelada');
    },
    onError: () => {
      toast.error('No se pudo cancelar la solicitud. Intenta nuevamente.');
    }
  });

  const startChatMutation = useMutation({
    mutationFn: async () =>
      await chatService.createChat({
        isGroup: false,
        memberIds: [userId ?? ''],
        name: profile ? `${profile.firstName} ${profile.lastName}` : undefined
      }),
    onSuccess: (chat) => {
      navigate(`/chats?chatId=${chat.id}`);
    },
    onError: () => {
      toast.error('No se pudo iniciar el chat. Intenta nuevamente.');
    }
  });

  useEffect(() => {
    if (userId && user?.id === userId) {
      navigate('/profile', { replace: true });
    }
  }, [userId, user, navigate]);

  if (!userId) {
    return <Navigate to="/dashboard" replace />;
  }

  const existingRequest = friendRequests.find((req) => {
    if (!user) return false;
    return (
      (req.sender.id === user.id && req.receiver.id === userId) ||
      (req.sender.id === userId && req.receiver.id === user.id)
    );
  });

  const isOwnPendingRequest =
    !!existingRequest && existingRequest.sender.id === user?.id && existingRequest.status === 'pending';
  const isFriend =
    !!existingRequest && existingRequest.status === 'accepted';

  return (
    <DashboardLayout
      title="Perfil"
      subtitle="Descubre mas informacion sobre miembros de tu comunidad."
    >
      {isLoading && (
        <Card className="p-6 text-sm text-[var(--color-muted)]">Cargando perfil...</Card>
      )}

      {!isLoading && isError && (
        <Card className="p-6 text-sm text-rose-600">
          No fue posible cargar este perfil. Intenta nuevamente mas tarde.
        </Card>
      )}

      {!isLoading && profile && (
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div
              className="h-40 w-full bg-[var(--color-border)]"
              style={
                profile.coverImageUrl
                  ? { backgroundImage: `url(${profile.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : undefined
              }
            />
            <div className="-mt-14 px-6 pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <UserAvatar
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  avatarUrl={profile.avatarUrl}
                  size="xl"
                  className="shadow-[0_10px_20px_rgba(18,55,29,0.25)]"
                />
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold text-[var(--color-text)]">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.headline && (
                    <p className="text-sm text-[var(--color-muted)]">{profile.headline}</p>
                  )}
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                    {profile.role === 'admin' ? 'Administrador' : profile.role === 'instructor' ? 'Instructor' : 'Aprendiz'}
                  </p>
                </div>
                <div className="flex flex-1 justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => startChatMutation.mutate()}
                    loading={startChatMutation.isPending}
                    disabled={startChatMutation.isPending || user?.id === profile.id}
                  >
                    Enviar mensaje
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (isOwnPendingRequest && existingRequest) {
                        cancelRequestMutation.mutate(existingRequest.id);
                      } else {
                        sendRequestMutation.mutate();
                      }
                    }}
                    loading={sendRequestMutation.isPending || cancelRequestMutation.isPending}
                    disabled={user?.id === profile.id || isFriend}
                  >
                    {isFriend
                      ? 'Ya son amigos'
                      : isOwnPendingRequest
                        ? 'Solicitud enviada'
                        : 'Enviar solicitud'}
                  </Button>
                </div>
              </div>
              {profile.bio && (
                <p className="mt-4 text-sm text-[var(--color-text)] whitespace-pre-line">{profile.bio}</p>
              )}
              {profile.profileSkills && profile.profileSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.profileSkills.map((skill, index) => (
                    <span
                      key={`pub-skill-${index}`}
                      className="rounded-2xl bg-sena-green/10 px-3 py-1.5 text-xs font-semibold text-sena-green"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text)]">Contacto</h2>
              <div className="space-y-3">
                {socialIconConfigs.map(({ key, label, icon: Icon }) => {
                  const value = profile[key];
                  if (!value) return null;
                  const isEmail = key === 'contactEmail';
                  const href = isEmail ? `mailto:${value}` : value;
                  return (
                    <a
                      key={key}
                      href={href}
                      target={isEmail ? undefined : '_blank'}
                      rel={isEmail ? undefined : 'noopener noreferrer'}
                      className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-sm text-[var(--color-text)] transition hover:border-sena-green/50 hover:bg-white/25"
                    >
                      <Icon className="h-4 w-4 text-sena-green" />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
                        <p className="truncate">{value}</p>
                      </div>
                    </a>
                  );
                })}
                {socialIconConfigs.every(({ key }) => !profile[key]) && (
                  <p className="text-sm text-[var(--color-muted)]">
                    Este usuario aun no ha compartido enlaces de contacto.
                  </p>
                )}
              </div>
            </Card>

            <ProfileActivitySection
              overview={activityOverview}
              isLoading={isLoadingActivity}
              perspective="other"
            />
          </div>

          <Card className="border border-white/30 bg-white/60 shadow-[0_10px_28px_-4px_rgba(0,0,0,0.2)] backdrop-blur-[14px] dark:border-white/15 dark:bg-white/10 dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.48)]">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Publicaciones recientes</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Contenido propio y compartido visible segun las reglas del feed.
            </p>
            <div className="mt-4 space-y-3">
              {isLoadingProfilePosts ? (
                <p className="text-xs text-[var(--color-muted)]">Cargando publicaciones...</p>
              ) : profilePosts.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No hay publicaciones para mostrar.</p>
              ) : (
                profilePosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="group w-full text-left"
                  >
                    <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-sm text-[var(--color-text)] transition hover:bg-white/40 dark:border-white/15 dark:bg-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[var(--color-text)] line-clamp-2">
                          {post.content
                            ? `${post.content.slice(0, 72)}${post.content.length > 72 ? '...' : ''}`
                            : 'Publicacion sin descripcion'}
                        </p>
                        <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                          {new Date(post.createdAt).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                        <span>{post.source === 'shared' ? 'Compartido' : 'Propio'}</span>
                        {post.shareMessage && (
                          <span className="line-clamp-1 text-[10px] text-[var(--color-muted)]">{post.shareMessage}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {selectedPost && (
        <GlassDialog
          open={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          size="lg"
          contentClassName={floatingModalContentClass}
        >
          <div className="space-y-5">
            {selectedPost.source === 'shared' && (
              <div className="rounded-2xl border border-white/20 bg-white/25 p-3 backdrop-blur">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    firstName={profile?.firstName}
                    lastName={profile?.lastName}
                    avatarUrl={profile?.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      Compartido por {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-sena-green">Compartido</p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {formatRelativeTime(selectedPost.sharedAt ?? selectedPost.createdAt)}
                    </p>
                  </div>
                </div>
                {selectedPost.shareMessage && (
                  <p className="mt-3 whitespace-pre-line text-sm text-[var(--color-text)]">{selectedPost.shareMessage}</p>
                )}
              </div>
            )}

            <div className="space-y-4 rounded-2xl border border-white/25 bg-white/40 p-4 text-[var(--color-text)] shadow-[0_24px_45px_rgba(18,55,29,0.2)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
              <div className="flex items-start gap-3">
                <UserAvatar
                  fullName={selectedPost.author.fullName}
                  avatarUrl={selectedPost.author.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{selectedPost.author.fullName}</p>
                  {selectedPost.author.headline && (
                    <p className="truncate text-xs text-[var(--color-muted)]">{selectedPost.author.headline}</p>
                  )}
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {formatRelativeTime(selectedPost.createdAt)}
                  </p>
                </div>
              </div>
              {selectedPost.content && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text)]">
                  {selectedPost.content}
                </p>
              )}
              {selectedPost.mediaUrl && (
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                  <img
                    src={selectedPost.mediaUrl}
                    alt="Contenido de la publicacion"
                    className="max-h-72 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setSelectedPost(null)} className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        </GlassDialog>
      )}
    </DashboardLayout>
  );
};
