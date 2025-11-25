import { useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../hooks/useAuth';
import { Github, Instagram, Facebook, Mail, Twitter, type LucideIcon } from 'lucide-react';

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

  useEffect(() => {
    if (userId && user?.id === userId) {
      navigate('/profile', { replace: true });
    }
  }, [userId, user, navigate]);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getPublicProfile(userId ?? ''),
    enabled: Boolean(userId)
  });

  if (!userId) {
    return <Navigate to="/dashboard" replace />;
  }

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
                <img
                  src={
                    profile.avatarUrl ??
                    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(
                      `${profile.firstName} ${profile.lastName}`
                    )}.svg`
                  }
                  alt={profile.firstName}
                  className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-[0_10px_20px_rgba(18,55,29,0.25)]"
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
                <div className="flex flex-1 justify-end">
                  <Button variant="secondary" onClick={() => navigate('/chats')}>
                    Enviar mensaje
                  </Button>
                </div>
              </div>
              {profile.bio && (
                <p className="mt-4 text-sm text-[var(--color-text)] whitespace-pre-line">{profile.bio}</p>
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
