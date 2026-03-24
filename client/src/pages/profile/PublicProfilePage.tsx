import { useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../hooks/useAuth';
import { Github, Instagram, Facebook, Mail, Twitter, type LucideIcon } from 'lucide-react';
import { friendService } from '../../services/friendService';
import { chatService } from '../../services/chatService';
import { useToast } from '../../hooks/useToast';

type SocialKey = 'instagramUrl' | 'githubUrl' | 'facebookUrl' | 'xUrl' | 'contactEmail';

const socialIconConfigs: Array<{ key: SocialKey; label: string; icon: LucideIcon }> = [
  { key: 'instagramUrl', label: 'Instagram', icon: Instagram },
  { key: 'githubUrl', label: 'GitHub', icon: Github },
  { key: 'facebookUrl', label: 'Facebook', icon: Facebook },
  { key: 'xUrl', label: 'X (Twitter)', icon: Twitter },
  { key: 'contactEmail', label: 'Correo de contacto', icon: Mail }
];

export const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getPublicProfile(userId ?? ''),
    enabled: Boolean(userId)
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

            <Card className="space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text)]">Actividad</h2>
              <p className="text-sm text-[var(--color-muted)]">
                Proximamente podras ver el historial de publicaciones, colaboraciones y recursos destacados de este
                perfil.
              </p>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
