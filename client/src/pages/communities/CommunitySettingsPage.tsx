import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { groupService } from '../../services/groupService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { Group } from '../../types/group';
import { CommunitySidebar } from '../../components/communities/CommunitySidebar';

type CommunitySection = 'general' | 'privacy' | 'members' | 'danger';

export const CommunitySettingsPage = () => {
  const { communityId } = useParams<{ communityId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState<CommunitySection>('general');
  const [password, setPassword] = useState('');

  const {
    data: community,
    isLoading
  } = useQuery<Group | undefined>({
    queryKey: ['groups', communityId],
    queryFn: () => groupService.getGroup(communityId!),
    enabled: !!communityId
  });

  const {
    data: myCommunities = [],
    isLoading: isLoadingMyCommunities
  } = useQuery({
    queryKey: ['myGroups'],
    queryFn: groupService.listMyGroups
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const descriptionMaxLength = 180;

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description ?? '');
    }
  }, [community]);

  const updateCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!communityId) throw new Error('No se ha seleccionado una comunidad');
      const payload: Partial<Group> = {
        name,
        description
      };
      await groupService.updateGroup(communityId, {
        name: payload.name ?? community?.name ?? '',
        description: payload.description ?? community?.description ?? undefined
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['groups', communityId] }),
        queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      ]);
      toast.success('Ajustes de la comunidad actualizados');
    },
    onError: () => {
      toast.error('No se pudieron guardar los cambios de la comunidad');
    }
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!communityId) throw new Error('No se ha seleccionado una comunidad');
      await groupService.deleteGroup(communityId, password);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Comunidad eliminada correctamente');
      navigate('/communities', { replace: true });
    },
    onError: (error: any) => {
      const message =
        error?.message ??
        'No se pudo eliminar la comunidad. Verifica tu contraseña e inténtalo nuevamente.';
      toast.error(message);
    }
  });

  const handleBack = () => {
    if (!communityId) {
      navigate('/communities');
      return;
    }
    navigate(`/communities/${communityId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
        <div className="flex h-full w-full items-center justify-center">
          <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
            Cargando comunidad...
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!community) {
    return (
      <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
        <div className="flex h-full w-full items-center justify-center">
          <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
            Comunidad no encontrada
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
      <div className="flex h-full w-full min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
          <div className="flex h-full w-full">
            <CommunitySidebar
              communities={myCommunities}
              isLoading={isLoadingMyCommunities}
              onCreateCommunity={() => navigate('/communities')}
              onExploreCommunities={() =>
                toast.info('Explorar comunidades estará disponible próximamente')
              }
            />

            {/* Sidebar ajustes comunidad */}
            <aside className="flex w-72 flex-col border-r border-white/10 dark:border-white/5 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[12px_0_40px_rgba(15,23,42,0.04)] dark:shadow-[12px_0_40px_rgba(0,0,0,0.6)]">
              <div className="px-4 py-4 border-b border-white/10 dark:border-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Ajustes de la comunidad
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text)] truncate">
                  {community.name}
                </p>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveSection('general')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'general'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>General</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('privacy')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'privacy'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>Privacidad y seguridad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('members')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'members'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>Miembros</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('danger')}
                  className={`mt-4 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'danger'
                      ? 'bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400 font-medium'
                      : 'text-red-500 dark:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10'
                  }`}
                >
                  <span>Eliminar comunidad</span>
                </button>
              </nav>

              <div className="px-2 py-4 border-t border-white/10 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neutral-900/5 via-neutral-900/3 to-neutral-900/5 px-3 py-2 text-[13px] text-[var(--color-text)] shadow-sm hover:shadow-md hover:bg-white/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a la comunidad</span>
                </button>
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex flex-1 flex-col min-h-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    {activeSection === 'general' && 'Ajustes generales'}
                    {activeSection === 'privacy' && 'Privacidad y seguridad'}
                    {activeSection === 'members' && 'Miembros de la comunidad'}
                    {activeSection === 'danger' && 'Eliminar comunidad'}
                  </h2>
                  <p className="text-[12px] text-[var(--color-muted)]">
                    Personaliza cómo se ve y funciona tu comunidad.
                  </p>
                </div>
                {(community.memberCount || community.onlineCount) && (
                  <div className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-[var(--color-muted)] shadow-sm dark:bg-neutral-800/80">
                    {typeof community.memberCount === 'number' && (
                      <span>{community.memberCount} miembros</span>
                    )}
                    {typeof community.onlineCount === 'number' && (
                      <span>
                        {' '}
                        · {community.onlineCount} en línea
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {activeSection === 'general' && (
                  <div className="max-w-2xl space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Nombre de la comunidad
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre de la comunidad"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Descripción
                      </label>
                      <TextArea
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value.slice(0, descriptionMaxLength))
                        }
                        rows={4}
                        placeholder="Describe brevemente de qué trata esta comunidad."
                      />
                      <div className="mt-1 flex justify-end text-[11px] text-[var(--color-muted)]">
                        {description.length}/{descriptionMaxLength}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        disabled={updateCommunityMutation.isPending}
                        loading={updateCommunityMutation.isPending}
                        onClick={() => updateCommunityMutation.mutate()}
                      >
                        Confirmar cambios
                      </Button>
                    </div>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="max-w-2xl space-y-6">
                    <p className="text-sm text-[var(--color-muted)]">
                      En próximas versiones podrás definir si tu comunidad es pública o privada, controlar
                      cómo se aceptan nuevos miembros y configurar opciones avanzadas de seguridad.
                    </p>
                  </div>
                )}

                {activeSection === 'members' && (
                  <div className="max-w-2xl space-y-4">
                    <p className="text-sm text-[var(--color-muted)]">
                      Aquí verás un resumen de los miembros y roles (Dueño / Miembro) de tu comunidad.
                      Esta sección se completará cuando el backend exponga los datos de miembros.
                    </p>
                  </div>
                )}

                {activeSection === 'danger' && (
                  <div className="max-w-2xl space-y-6">
                    <div className="rounded-2xl border border-red-200/70 dark:border-red-500/30 bg-red-50/70 dark:bg-red-950/30 px-5 py-4">
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                        Eliminar comunidad
                      </h3>
                      <p className="mt-1 text-sm text-red-700/90 dark:text-red-200/80">
                        Esta acción es <span className="font-semibold">irreversible</span>. Se eliminarán
                        todos los canales, mensajes y configuraciones asociadas a esta comunidad.
                      </p>
                      <p className="mt-2 text-xs text-red-700/80 dark:text-red-200/70">
                        Para confirmar, escribe la contraseña de tu cuenta. Sólo el dueño de la comunidad
                        puede realizar esta acción.
                      </p>

                      <div className="mt-4 space-y-3">
                        <Input
                          type="password"
                          label="Contraseña de tu cuenta"
                          placeholder="Ingresa tu contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={!password || deleteCommunityMutation.isPending}
                            loading={deleteCommunityMutation.isPending}
                            onClick={() => deleteCommunityMutation.mutate()}
                          >
                            Eliminar comunidad
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


