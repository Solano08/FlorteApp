import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { groupService } from '../../services/groupService';
import { channelService } from '../../services/channelService';
import { friendService } from '../../services/friendService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CommunitySidebar } from '../../components/communities/CommunitySidebar';
import { ChannelSidebar } from '../../components/communities/ChannelSidebar';
import { ChannelChat } from '../../components/communities/ChannelChat';
import { EmptyCommunitiesView } from '../../components/communities/EmptyCommunitiesView';
import { CreateChannelMessagePayload } from '../../types/channel';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { CreateCommunityDialog } from '../../components/communities/CreateCommunityDialog';
import { ExploreCommunitiesView } from '../../components/communities/ExploreCommunitiesView';
import { resolveAssetUrl } from '../../utils/media';
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
  const { user } = useAuth();
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

  // Lista de amigos para invitar
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.listFriends
  });

  // Mutación para crear canal
  const createChannelMutation = useMutation({
    mutationFn: channelService.createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', communityId] }).catch(() => {});
    },
    onError: () => {
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
    onError: () => {
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

  // Redirigir al primer canal disponible cuando se entra a una comunidad sin canal seleccionado
  useEffect(() => {
    if (
      communityId &&
      !channelId &&
      !isLoadingChannels &&
      channels.length > 0 &&
      !isExploring
    ) {
      const firstChannel = channels.sort((a, b) => a.position - b.position)[0];
      if (firstChannel) {
        navigate(`/communities/${communityId}/${firstChannel.id}`, { replace: true });
      }
    }
  }, [communityId, channelId, isLoadingChannels, channels, isExploring, navigate]);


  // Acciones layout tipo Discord
  const handleCreateCommunity = () => {
    setCreateDialogOpen(true);
  };

  const handleExploreCommunities = () => {
    setIsExploring(true);
  };

  const handleSelectCommunityFromSidebar = (id: string) => {
    setIsExploring(false);
    navigate(`/communities/${id}`);
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
    const isOwner = Boolean(user?.id && community?.createdBy && community.createdBy === user.id);
    if (isOwner) {
      navigate(`/communities/${communityId}/settings#eliminar-comunidad`);
      return;
    }
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

  const joinedCommunityIds = useMemo(
    () => new Set(myCommunities.map((g) => g.id)),
    [myCommunities]
  );

  let content: ReactElement;

  // Mostrar vista de estado vacío sólo cuando no se está explorando
  if (!communityId && !isExploring && !isLoadingMyCommunities && myCommunities.length === 0) {
    content = (
      <EmptyCommunitiesView
        onCreateCommunity={handleCreateCommunity}
        onExploreCommunities={handleExploreCommunities}
      />
    );
  } else if (!communityId && (isLoadingMyCommunities || myCommunities.length > 0)) {
    // Si está cargando o redirigiendo, mostrar loading
    content = (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">Cargando...</Card>
      </div>
    );
  } else if (isExploring) {
    content = (
      <div className="flex h-full w-full min-h-0 overflow-hidden communities-shell">
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
          {myCommunities.length > 0 && (
            <CommunitySidebar
              communities={myCommunities}
              isLoading={isLoadingMyCommunities}
              onCreateCommunity={handleCreateCommunity}
              onExploreCommunities={handleExploreCommunities}
              onSelectCommunity={handleSelectCommunityFromSidebar}
            />
          )}
          <ExploreCommunitiesView
            communities={filteredExploreCommunities}
            isLoading={isLoadingExplore}
            searchTerm={exploreSearch}
            onSearchTermChange={setExploreSearch}
            joinedCommunityIds={joinedCommunityIds}
            onSelectCommunity={(id) => {
              if (joinedCommunityIds.has(id)) {
                handleSelectCommunityFromSidebar(id);
              } else {
                joinCommunityMutation.mutate(id);
              }
            }}
            onCreateCommunity={handleCreateCommunity}
          />
        </div>
      </div>
    );
  } else if (isLoadingCommunity) {
    content = (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
          Cargando comunidad...
        </Card>
      </div>
    );
  } else if (!community) {
    content = (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="glass-liquid p-6 text-sm text-[var(--color-muted)]">
          Comunidad no encontrada
        </Card>
      </div>
    );
  } else {
    content = (
      <div className="flex h-full w-full min-h-0 overflow-hidden communities-shell">
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
          <CommunitySidebar
            communities={myCommunities}
            isLoading={isLoadingMyCommunities}
            onCreateCommunity={handleCreateCommunity}
            onExploreCommunities={handleExploreCommunities}
            onSelectCommunity={handleSelectCommunityFromSidebar}
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
                      onSuccess: (channel) => {
                        // Guardar relación canal-categoría si se especificó
                        if (values.categoryId && communityId) {
                          const stored = localStorage.getItem(`channelCategories_${communityId}`);
                          const relations = stored ? JSON.parse(stored) : {};
                          relations[channel.id] = values.categoryId;
                          localStorage.setItem(`channelCategories_${communityId}`, JSON.stringify(relations));
                        }
                        resolve();
                      },
                      onError: (error) => reject(error)
                    }
                  );
                });
              }}
              onInviteFriends={handleInviteFriends}
              onCommunitySettings={handleCommunitySettings}
              onLeaveCommunity={handleLeaveCommunity}
              isSubmitting={isSubmittingChannel || createChannelMutation.isPending}
            />

            {channelId && selectedChannel ? (
              <ChannelChat
                channelId={channelId}
                channelName={selectedChannel.name}
                channelDescription={selectedChannel.description}
                messages={messages}
                isLoadingMessages={isLoadingMessages}
                onSendMessage={(payload) =>
                  new Promise<void>((resolve, reject) => {
                    createMessageMutation.mutate(
                      { content: payload.content, attachmentUrl: payload.attachmentUrl },
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
              <div className="flex flex-1 items-center justify-center px-4">
                <Card className="glass-liquid relative max-w-lg overflow-hidden rounded-2xl border border-white/35 bg-white/90 p-7 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/90">
                  <div className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-2xl bg-sena-green/10 blur-3xl dark:bg-sena-green/20" />
                  <div className="pointer-events-none absolute -left-16 bottom-[-40px] h-36 w-36 rounded-2xl bg-emerald-500/8 blur-3xl dark:bg-emerald-500/15" />

                  <div className="relative flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sena-green/12 text-sena-green shadow-[0_10px_30px_rgba(18,55,29,0.35)]">
                      <span className="text-xl">💬</span>
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                      Elige un canal para comenzar
                    </h2>
                    <p className="max-w-md text-sm text-[var(--color-muted)]">
                      Selecciona uno de los canales del panel izquierdo para ver los mensajes de tu
                      comunidad o crea un nuevo canal para iniciar una conversación.
                    </p>
                  </div>

                  <div className="relative mt-5 flex justify-center">
                    <Button
                      variant="primary"
                      className="px-5"
                      onClick={() => {
                        const form = document.getElementById('create-channel-form');
                        form?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Crear nuevo canal
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0 communities-shell">
      {content}

      {/* Diálogo para abandonar comunidad */}
      <GlassDialog
        open={leaveDialogOpen}
        onClose={() => (!isLeaving ? setLeaveDialogOpen(false) : undefined)}
        size="sm"
        preventCloseOnBackdrop={isLeaving}
        overlayClassName="delete-post-overlay-warning"
        contentClassName="glass-dialog-delete"
      >
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLeaveDialogOpen(false)}
              disabled={isLeaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-500/90 hover:bg-red-600/90 text-white border-red-400/30 focus:ring-red-400/35"
              onClick={() => void confirmLeaveCommunity()}
              loading={isLeaving}
            >
              Abandonar comunidad
            </Button>
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
              Invita a tus amigos a unirse rápidamente a{' '}
              <span className="font-semibold">{community?.name}</span>.
            </p>
          </div>

          {/* Lista de amigos */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Tus amigos
            </p>
            {isLoadingFriends ? (
              <p className="text-xs text-[var(--color-muted)]">Cargando amigos...</p>
            ) : friends.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Aún no tienes amigos agregados. Comparte el enlace de invitación directamente.
              </p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 text-sm text-[var(--color-text)] shadow-sm dark:bg-neutral-900/80"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-sena-green/10 text-xs font-semibold text-sena-green overflow-hidden">
                    {friend.avatarUrl ? (
                      <img
                        src={resolveAssetUrl(friend.avatarUrl) ?? ''}
                        alt={friend.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (friend.fullName || friend.firstName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{friend.fullName || `${friend.firstName} ${friend.lastName}`}</p>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        toast.success(`Enlace copiado para invitar a ${friend.fullName || friend.firstName}`);
                      } catch {
                        toast.error('No se pudo copiar el link. Por favor, intenta nuevamente.');
                      }
                    }}
                    className="text-[11px] px-2 py-1"
                  >
                    + Invitar
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Enlace de invitación */}
          <div className="space-y-2 pt-1 border-t border-white/30 dark:border-white/10">
            <label className="block text-xs font-medium text-[var(--color-muted)]">
              Enlace de invitación
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/80 px-3 py-2 text-xs text-[var(--color-text)] shadow-sm dark:border-white/10 dark:bg-neutral-900/80">
              <span className="flex-1 truncate">{inviteLink}</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    toast.success('Link copiado al portapapeles');
                  } catch {
                    toast.error('No se pudo copiar el link. Por favor, intenta nuevamente.');
                  }
                }}
              >
                Copiar
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setInviteDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </GlassDialog>

      {/* Diálogo para crear comunidad */}
      <CreateCommunityDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={async ({ name, iconFile }) => {
          const group = await groupService.createGroup({ name });
          if (iconFile) {
            await groupService.uploadCommunityIcon(group.id, iconFile);
          }
          await queryClient.invalidateQueries({ queryKey: ['myGroups'] });
          toast.success('Tu nueva comunidad está lista ✨');
          setCreateDialogOpen(false);
          setIsExploring(false);
          navigate(`/communities/${group.id}`);
        }}
        isLoading={createCommunityMutation.isPending}
      />

    </DashboardLayout>
  );
};

