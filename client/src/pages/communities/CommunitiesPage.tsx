import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { groupService } from '../../services/groupService';
import { channelService } from '../../services/channelService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CommunitySidebar } from '../../components/communities/CommunitySidebar';
import { ChannelSidebar } from '../../components/communities/ChannelSidebar';
import { ChannelChat } from '../../components/communities/ChannelChat';
import { EmptyCommunitiesView } from '../../components/communities/EmptyCommunitiesView';
import { CreateChannelMessagePayload } from '../../types/channel';
import { useToast } from '../../hooks/useToast';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { Button as UIButton } from '../../components/ui/Button';
import { CreateCommunityDialog } from '../../components/communities/CreateCommunityDialog';
import { ExploreCommunitiesView } from '../../components/communities/ExploreCommunitiesView';
import type { Group } from '../../types/group';

export const CommunitiesPage = () => {
  const { communityId, channelId } = useParams<{ communityId?: string; channelId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [exploreSearch, setExploreSearch] = useState('');
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Comunidades del usuario (sidebar tipo Discord)
  const { data: myCommunities = [], isLoading: isLoadingMyCommunities } = useQuery({
    queryKey: ['myGroups'],
    queryFn: groupService.listMyGroups
  });

  const {
    data: exploreCommunities = [],
    isLoading: isLoadingExplore
  } = useQuery({
    queryKey: ['exploreGroups'],
    queryFn: groupService.listGroups,
    enabled: isExploring
  });


  // Query para obtener comunidad específica
  const { data: community, isLoading: isLoadingCommunity } = useQuery({
    queryKey: ['groups', communityId],
    queryFn: () => groupService.getGroup(communityId!),
    enabled: !!communityId
  });

  // Query para listar canales de una comunidad
  const { data: channels = [], isLoading: isLoadingChannels } = useQuery({
    queryKey: ['channels', communityId],
    queryFn: () => channelService.listChannels(communityId!),
    enabled: !!communityId
  });

  // Query para listar mensajes de un canal
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['channelMessages', channelId],
    queryFn: () => channelService.listMessages(channelId!),
    enabled: !!channelId
  });

  // Mutación para crear canal
  const createChannelMutation = useMutation({
    mutationFn: channelService.createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', communityId] }).catch(() => {});
    },
    onError: (error) => {
      console.error('Error al crear canal:', error);
      toast.error('No se pudo crear el canal. Por favor, intenta nuevamente.');
    }
  });

  // Mutación para crear comunidad
  const createCommunityMutation = useMutation<Group, unknown, { name: string; iconFile?: File | null }>({
    mutationFn: async ({ name, iconFile }) => {
      const group = await groupService.createGroup({ name });
      if (iconFile) {
        await groupService.uploadCommunityIcon(group.id, iconFile);
      }
      return group;
    },
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Tu nueva comunidad está lista ✨');
      setCreateDialogOpen(false);
      setIsExploring(false);
      navigate(`/communities/${group.id}`);
    },
    onError: () => {
      toast.error('No se pudo crear la comunidad. Por favor, intenta nuevamente.');
    }
  });

  // Mutación para unirse / ingresar a comunidad desde explorar
  const joinCommunityMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await groupService.joinGroup(groupId);
      return groupId;
    },
    onSuccess: async (groupId) => {
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Te uniste a la comunidad ✨');
      setIsExploring(false);
      navigate(`/communities/${groupId}`);
    },
    onError: () => {
      toast.error('No se pudo ingresar a la comunidad. Intenta más tarde.');
    }
  });

  // Mutación para crear mensaje
  const createMessageMutation = useMutation({
    mutationFn: (payload: CreateChannelMessagePayload) => {
      if (!channelId) {
        throw new Error('No se ha seleccionado un canal');
      }
      return channelService.createMessage(channelId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelMessages', channelId] }).catch(() => {});
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    onError: (error) => {
      console.error('Error al enviar mensaje:', error);
      toast.error('No se pudo enviar el mensaje. Por favor, intenta nuevamente.');
    }
  });

  const isSubmittingChannel = createChannelMutation.isPending;

  // Scroll automático a mensajes nuevos
  useEffect(() => {
    if (channelId && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, channelId]);

  // Redirigir a la primera comunidad si no hay communityId pero el usuario tiene comunidades
  useEffect(() => {
    if (!communityId && !isLoadingMyCommunities && myCommunities.length > 0 && !isExploring) {
      navigate(`/communities/${myCommunities[0].id}`, { replace: true });
    }
  }, [communityId, isLoadingMyCommunities, myCommunities, isExploring, navigate]);


  // Acciones layout tipo Discord
  const handleCreateCommunity = () => {
    setCreateDialogOpen(true);
  };

  const handleExploreCommunities = () => {
    setIsExploring(true);
  };

  const handleInviteFriends = () => {
    if (!communityId) return;
    const link = `${window.location.origin}/communities/${communityId}`;
    setInviteLink(link);
    setInviteDialogOpen(true);
  };

  const handleCommunitySettings = () => {
    if (!communityId) return;
    navigate(`/communities/${communityId}/settings`);
  };

  const handleLeaveCommunity = () => {
    if (!communityId) return;
    setLeaveDialogOpen(true);
  };

  const confirmLeaveCommunity = async () => {
    if (!communityId || isLeaving) return;
    try {
      setIsLeaving(true);
      await groupService.leaveGroup(communityId);
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Has abandonado la comunidad');

      // Navegar a otra comunidad si existe, o a /communities
      if (myCommunities.length > 0) {
        const remaining = myCommunities.filter((c) => c.id !== communityId);
        if (remaining.length > 0) {
          navigate(`/communities/${remaining[0].id}`, { replace: true });
        } else {
          navigate('/communities', { replace: true });
        }
      } else {
        navigate('/communities', { replace: true });
      }
    } catch (error: any) {
      // Si el backend indica que es dueño y no puede abandonar, mostrar mensaje amigable
      const message =
        error?.message ||
        'No se pudo abandonar la comunidad. Si eres el dueño, elimínala desde los ajustes.';
      toast.error(message);
    } finally {
      setIsLeaving(false);
      setLeaveDialogOpen(false);
    }
  };

  const handleCreateCategory = (name: string) => {
    // TODO: Implementar creación de categoría
    toast.info('Funcionalidad de crear categoría próximamente');
  };

  // Mostrar vista de estado vacío sólo cuando no se está explorando
  if (!communityId && !isExploring && !isLoadingMyCommunities && myCommunities.length === 0) {
    return (
      <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
        <EmptyCommunitiesView
          onCreateCommunity={handleCreateCommunity}
          onExploreCommunities={handleExploreCommunities}
        />
      </DashboardLayout>
    );
  }

  // Si está cargando o redirigiendo, mostrar loading
  if (!communityId && (isLoadingMyCommunities || myCommunities.length > 0)) {
    return (
      <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
        <div className="flex h-full w-full items-center justify-center">
          <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
            Cargando...
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Vista: Comunidad seleccionada con layout tipo Discord
  const selectedChannel = channels.find((c) => c.id === channelId);
  const filteredExploreCommunities =
    exploreCommunities?.filter((group) => {
      const term = exploreSearch.toLowerCase().trim();
      if (!term) return true;
      return (
        group.name.toLowerCase().includes(term) ||
        (group.description ?? '').toLowerCase().includes(term)
      );
    }) ?? [];

  return (
    <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
      {isExploring ? (
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
            {myCommunities.length > 0 && (
              <CommunitySidebar
                communities={myCommunities}
                isLoading={isLoadingMyCommunities}
                onCreateCommunity={handleCreateCommunity}
                onExploreCommunities={handleExploreCommunities}
              />
            )}
            <ExploreCommunitiesView
              communities={filteredExploreCommunities}
              isLoading={isLoadingExplore}
              searchTerm={exploreSearch}
              onSearchTermChange={setExploreSearch}
              onSelectCommunity={(id) => joinCommunityMutation.mutate(id)}
            />
          </div>
        </div>
      ) : isLoadingCommunity ? (
        <div className="flex h-full w-full items-center justify-center">
          <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
            Cargando comunidad...
          </Card>
        </div>
      ) : !community ? (
        <div className="flex h-full w-full items-center justify-center">
          <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
            Comunidad no encontrada
          </Card>
        </div>
      ) : (
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
            <CommunitySidebar
              communities={myCommunities}
              isLoading={isLoadingMyCommunities}
              onCreateCommunity={handleCreateCommunity}
              onExploreCommunities={handleExploreCommunities}
            />

            {/* Zona principal: canales + chat */}
            <div className="flex flex-1 min-h-0">
                <ChannelSidebar
                  channels={channels}
                  community={community}
                  isLoadingChannels={isLoadingChannels}
                  onCreateChannel={(values) => {
                    return new Promise<void>((resolve, reject) => {
                      createChannelMutation.mutate(
                        {
                          communityId: communityId!,
                          name: values.name,
                          description: values.description,
                          type: 'text'
                        },
                        {
                          onSuccess: () => resolve(),
                          onError: (error) => reject(error)
                        }
                      );
                    });
                  }}
                  onCreateCategory={handleCreateCategory}
                  onInviteFriends={handleInviteFriends}
                  onCommunitySettings={handleCommunitySettings}
                  onLeaveCommunity={handleLeaveCommunity}
                  isSubmitting={isSubmittingChannel || createChannelMutation.isPending}
                />

                {channelId && selectedChannel ? (
                  <ChannelChat
                    channelName={selectedChannel.name}
                    channelDescription={selectedChannel.description}
                    messages={messages}
                    isLoadingMessages={isLoadingMessages}
                    onSendMessage={(content) =>
                      new Promise<void>((resolve, reject) => {
                        createMessageMutation.mutate(
                          { content },
                          {
                            onSuccess: () => {
                              resolve();
                            },
                            onError: (error) => {
                              reject(error);
                            }
                          }
                        );
                      })
                    }
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <Card className="glass-liquid max-w-md p-6 text-center">
                      <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Selecciona un canal
                      </h2>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        Elige uno de los canales del panel izquierdo para comenzar a chatear o crea un
                        nuevo canal.
                      </p>
                      <Button
                        variant="primary"
                        className="mt-4"
                        onClick={() => {
                          const form = document.getElementById('create-channel-form');
                          form?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Crear canal
                      </Button>
                    </Card>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

      {/* Diálogo para abandonar comunidad */}
      <GlassDialog open={leaveDialogOpen} onClose={() => (!isLeaving ? setLeaveDialogOpen(false) : undefined)} size="sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Abandonar comunidad
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              ¿Seguro que quieres abandonar <span className="font-semibold">{community?.name}</span>? 
              Dejarás de ver sus canales y mensajes hasta que alguien te vuelva a invitar.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <UIButton
              type="button"
              variant="ghost"
              onClick={() => setLeaveDialogOpen(false)}
              disabled={isLeaving}
            >
              Cancelar
            </UIButton>
            <UIButton
              type="button"
              variant="destructive"
              onClick={() => void confirmLeaveCommunity()}
              loading={isLeaving}
            >
              Abandonar comunidad
            </UIButton>
          </div>
          <p className="text-[11px] text-[var(--color-muted)]">
            Si eres el dueño de la comunidad, primero debes eliminarla desde los ajustes de la comunidad.
          </p>
        </div>
      </GlassDialog>

      {/* Diálogo para invitar amigos */}
      <GlassDialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} size="sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Invitar amigos
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Comparte este enlace para que tus amigos se unan rápidamente a{' '}
              <span className="font-semibold">{community?.name}</span>.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--color-muted)]">
              Enlace de invitación
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-xs text-[var(--color-text)] shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <span className="flex-1 truncate">{inviteLink}</span>
              <UIButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    toast.success('Link copiado al portapapeles');
                  } catch (error) {
                    console.error('Error al copiar link:', error);
                    toast.error('No se pudo copiar el link. Por favor, intenta nuevamente.');
                  }
                }}
              >
                Copiar
              </UIButton>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <UIButton type="button" variant="ghost" onClick={() => setInviteDialogOpen(false)}>
              Cerrar
            </UIButton>
          </div>
        </div>
      </GlassDialog>
    </DashboardLayout>
  );
};

