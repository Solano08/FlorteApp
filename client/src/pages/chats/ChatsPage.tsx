import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { chatService } from '../../services/chatService';
import { Button } from '../../components/ui/Button';
import { GlassDialog } from '../../components/ui/GlassDialog';
import {
  MessageCirclePlus,
  Send,
  Smile,
  Users as UsersIcon,
  User as UserIcon,
  Paperclip,
  Search,
  Phone,
  Video,
  Info,
  MoreHorizontal,
  Settings2,
  Star,
  ArrowLeft,
  UserPlus,
  Users
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';

type ChatFilter = 'all' | 'unread' | 'favorites' | 'groups';

const filterTabs: Array<{ value: ChatFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'No leidos' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'groups', label: 'Grupos' }
];

const createChatSchema = z
  .object({
    chatType: z.enum(['direct', 'group']),
    name: z.string().trim().optional(),
    memberIds: z.string().optional()
  })
  .superRefine((values, ctx) => {
    const members = values.memberIds
      ? values.memberIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    // Si no hay miembros, se creará un chat de prueba (no validamos)
    if (members.length === 0) {
      return; // Permitir crear chat sin IDs
    }

    if (values.chatType === 'direct' && members.length !== 1) {
      ctx.addIssue({
        path: ['memberIds'],
        code: 'custom',
        message: 'Los chats privados requieren exactamente un destinatario'
      });
    }

    if (values.chatType === 'group') {
      const name = values.name?.trim();
      if (!name || name.length < 3) {
        ctx.addIssue({
          path: ['name'],
          code: 'custom',
          message: 'Define un nombre para el grupo (minimo 3 caracteres)'
        });
      }
    }
  });

type CreateChatValues = z.infer<typeof createChatSchema>;

const initialCreateChatValues: CreateChatValues = {
  chatType: 'direct',
  name: '',
  memberIds: ''
};

const formatLastActivity = (iso: string) => {
  const target = new Date(iso);
  const now = new Date();
  const isSameDay = target.toDateString() === now.toDateString();

  if (isSameDay) {
    return target.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return target.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short'
  });
};

const getChatName = (name: string | null | undefined, isGroup: boolean) =>
  name?.trim() && name.trim().length > 0 ? name.trim() : isGroup ? 'Grupo sin titulo' : 'Chat privado';

const avatarGradientPalette = [
  'from-sena-green/90 to-emerald-400/80',
  'from-blue-400/75 to-cyan-300/70',
  'from-amber-500/90 to-orange-400/80',
  'from-purple-500/90 to-indigo-400/80'
];

const getAvatarGradient = (seed: string) => {
  if (!seed) {
    return `bg-gradient-to-br ${avatarGradientPalette[0]}`;
  }

  let hash = 0;
  for (const char of seed) {
    hash = (hash + char.charCodeAt(0) * 17) % 2048;
  }

  return `bg-gradient-to-br ${avatarGradientPalette[hash % avatarGradientPalette.length]}`;
};

const getInitialsFromLabel = (label: string | null | undefined) => {
  const cleaned = label?.trim();
  if (!cleaned) return 'FL';

  const parts = cleaned.split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials || cleaned.slice(0, 2).toUpperCase();
};

export const ChatsPage = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'group' | 'direct' | 'community' | null>(null);
  const [message, setMessage] = useState('');
  const [favoriteChats, setFavoriteChats] = useState<Set<string>>(new Set());

  const messageListRef = useRef<HTMLDivElement | null>(null);

  const { data: chats = [], isLoading: isLoadingChats } = useQuery({
    queryKey: ['chats'],
    queryFn: chatService.listChats
  });

  useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const { data: messages = [], isFetching: isFetchingMessages } = useQuery({
    enabled: Boolean(selectedChatId),
    queryKey: ['chats', selectedChatId, 'messages'],
    queryFn: async () => {
      if (!selectedChatId) return [];
      return await chatService.listMessages(selectedChatId);
    }
  });

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const createChatMutation = useMutation({
    mutationFn: chatService.createChat,
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => { });
      setSelectedChatId(chat.id);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { chatId: string; content: string }) =>
      chatService.sendMessage(payload.chatId, { content: payload.content }),
    onSuccess: () => {
      if (!selectedChatId) return;
      queryClient.invalidateQueries({ queryKey: ['chats', selectedChatId, 'messages'] }).catch(() => { });
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<CreateChatValues>({
    resolver: zodResolver(createChatSchema),
    defaultValues: initialCreateChatValues
  });

  const chatType = watch('chatType');

  useEffect(() => {
    if (chatType === 'direct') {
      setValue('name', '');
    }
  }, [chatType, setValue]);

  const filteredChats = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return chats.filter((chat) => {
      if (activeFilter === 'groups' && !chat.isGroup) return false;
      if (activeFilter === 'unread' && chat.lastMessageAt) return false;
      if (activeFilter === 'favorites' && !favoriteChats.has(chat.id)) return false;

      if (!normalized) return true;

      const name = getChatName(chat.name, chat.isGroup).toLowerCase();
      return name.includes(normalized) || chat.id.toLowerCase().includes(normalized);
    });
  }, [chats, activeFilter, searchTerm, favoriteChats]);

  const tabStats = useMemo<Record<ChatFilter, number>>(
    () => ({
      all: chats.length,
      unread: chats.filter((chat) => !chat.lastMessageAt).length,
      favorites: chats.filter((chat) => favoriteChats.has(chat.id)).length,
      groups: chats.filter((chat) => chat.isGroup).length
    }),
    [chats, favoriteChats]
  );

  const toggleFavorite = (chatId: string) => {
    setFavoriteChats((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  };

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const handleCreateChat = handleSubmit((values) => {
    const members = values.memberIds
      ? values.memberIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    // Si no hay miembros, usar el ID del usuario actual para crear un chat de prueba
    const finalMemberIds = members.length > 0 ? members : [authUser?.id || 'test-user-id'];

    createChatMutation.mutate(
      {
        name: values.chatType === 'group' ? values.name?.trim() || 'Mi nuevo grupo' : undefined,
        isGroup: values.chatType === 'group',
        memberIds: finalMemberIds
      },
      {
        onSuccess: () => {
          reset(initialCreateChatValues);
          setShowNewChatModal(false);
          setNewChatType(null);
        }
      }
    );
  });

  const handleQuickCreateChat = (type: 'group' | 'direct') => {
    // Crear un chat de prueba sin IDs
    const testMemberId = authUser?.id || 'test-user-id';
    createChatMutation.mutate(
      {
        name: type === 'group' ? 'Mi nuevo grupo' : undefined,
        isGroup: type === 'group',
        memberIds: [testMemberId]
      },
      {
        onSuccess: () => {
          setShowNewChatModal(false);
          setNewChatType(null);
        }
      }
    );
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedChatId || !message.trim()) return;

    sendMessageMutation.mutate(
      { chatId: selectedChatId, content: message.trim() },
      {
        onSuccess: () => {
          setMessage('');
        }
      }
    );
  };

  const activeChatName = activeChat ? getChatName(activeChat.name, activeChat.isGroup) : '';
  const activeChatInitials = activeChat ? getInitialsFromLabel(activeChatName) : '';
  const activeChatGradient = activeChat ? getAvatarGradient(activeChat.id) : '';
  const activeChatLastActivity = activeChat
    ? formatLastActivity(activeChat.lastMessageAt ?? activeChat.createdAt)
    : '';

  return (
    <DashboardLayout 
      fluid
      contentClassName="h-full p-0 overflow-hidden"
    >
      <div className="flex h-full w-full overflow-hidden bg-[var(--color-background)]">
        {/* Columna izquierda - Lista de chats */}
        <div className="flex w-[420px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {/* Header de la lista de chats */}
          <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 glass-liquid">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Chats</h2>
            </div>
            <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
              aria-label="Preferencias de chat"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
              aria-label="Mas opciones"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 px-3 text-xs"
              onClick={() => setShowNewChatModal(true)}
            >
              <MessageCirclePlus className="h-4 w-4" />
            </Button>
            </div>
          </header>

          {/* Barra de búsqueda y filtros */}
          <div className="space-y-3 border-b border-[var(--color-border)] px-4 py-4">
            <div className="flex items-center gap-2 rounded-xl glass-liquid px-3 py-2.5 transition focus-within:border-sena-green/50">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
            <input
              type="text"
              placeholder="Buscar un chat o iniciar uno nuevo"
              className="flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            </div>

            <div className="flex items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={classNames(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  activeFilter === tab.value
                    ? 'bg-sena-green text-white shadow-[0_4px_12px_rgba(57,169,0,0.3)]'
                    : 'glass-liquid text-[var(--color-muted)] hover:text-[var(--color-text)]'
                )}
              >
                {tab.value === 'favorites' && <Star className="h-3.5 w-3.5" />}
                <span>{tab.label}</span>
                {tabStats[tab.value] > 0 && (
                  <span
                    className={classNames(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      activeFilter === tab.value ? 'bg-white/20 text-white' : 'bg-white/10 text-[var(--color-muted)]'
                    )}
                  >
                    {tabStats[tab.value]}
                  </span>
                )}
              </button>
            ))}
            </div>
          </div>

          {/* Lista de chats */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {isLoadingChats ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              Cargando conversaciones...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4">
              <div className="rounded-xl glass-liquid border-dashed px-6 py-8 text-center text-sm text-[var(--color-muted)]">
                No hay conversaciones en esta vista.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {filteredChats.map((chat) => {
                const isActive = chat.id === selectedChatId;
                const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);
                const chatLabel = getChatName(chat.name, chat.isGroup);
                const initials = getInitialsFromLabel(chatLabel);
                const gradient = getAvatarGradient(chat.id);
                const hasUnread = !chat.lastMessageAt;
                const isFavorite = favoriteChats.has(chat.id);

                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(chat.id)}
                      className={classNames(
                        'group flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[var(--color-surface)]',
                        isActive && 'bg-[var(--color-surface)] border-l-4 border-sena-green'
                      )}
                    >
                      <span className="relative inline-flex shrink-0">
                        <span
                          className={classNames(
                            'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
                            gradient
                          )}
                        >
                          {initials}
                        </span>
                        {hasUnread && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sena-green ring-2 ring-[var(--color-background)]" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={classNames('truncate text-sm font-semibold', isActive && 'text-sena-green')}>
                            {chatLabel}
                          </p>
                          <div className="flex items-center gap-2">
                            {isFavorite && (
                              <Star className="h-3.5 w-3.5 fill-sena-green text-sena-green" />
                            )}
                            <span className="text-[11px] text-[var(--color-muted)] whitespace-nowrap">
                              {lastActivity}
                            </span>
                          </div>
                        </div>
                        <p className={classNames('mt-0.5 truncate text-xs', hasUnread ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-muted)]')}>
                          {chat.isGroup ? 'Grupo colaborativo' : hasUnread ? 'Nuevo mensaje' : 'Mensaje directo'}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
        </div>

        {/* Columna derecha - Chat activo */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
          {activeChat ? (
            <>
              {/* Header del chat activo */}
              <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4 glass-liquid">
                <div className="flex items-center gap-3">
                <span
                  className={classNames(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white',
                    activeChatGradient
                  )}
                >
                  {activeChatInitials}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{activeChatName}</h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    {activeChat.isGroup ? 'Chat grupal' : 'Chat privado'} • {activeChatLastActivity}
                  </p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(activeChat.id);
                  }}
                  className={classNames(
                    'flex h-9 w-9 items-center justify-center rounded-full glass-liquid transition',
                    favoriteChats.has(activeChat.id)
                      ? 'text-sena-green'
                      : 'text-[var(--color-muted)] hover:text-sena-green'
                  )}
                  aria-label="Marcar como favorito"
                >
                  <Star className={classNames('h-4 w-4', favoriteChats.has(activeChat.id) && 'fill-current')} />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
                  aria-label="Llamada de voz"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
                  aria-label="Videollamada"
                >
                  <Video className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
                  aria-label="Detalles del chat"
                >
                  <Info className="h-4 w-4" />
                </button>
                </div>
              </header>

              {/* Área de mensajes */}
              <div ref={messageListRef} className="flex-1 overflow-y-auto bg-[var(--color-background)] px-6 py-6 hide-scrollbar">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                {isFetchingMessages ? (
                  <div className="py-8 text-center text-sm text-[var(--color-muted)]">Sincronizando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="flex flex-col items-center gap-3 rounded-2xl glass-liquid px-8 py-8 text-center">
                      <span
                        className={classNames(
                          'flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white',
                          activeChatGradient
                        )}
                      >
                        {activeChatInitials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">{activeChatName}</p>
                        <p className="text-xs text-[var(--color-muted)]">Última actividad {activeChatLastActivity}</p>
                      </div>
                      <p className="max-w-md text-xs text-[var(--color-muted)]">
                        Los mensajes están protegidos con cifrado de extremo a extremo. Solo las personas de este chat pueden leerlos.
                      </p>
                    </div>
                    <div className="rounded-xl glass-liquid border-dashed px-6 py-6 text-center text-sm text-[var(--color-muted)]">
                      Aún no hay mensajes en este chat. ¡Escribe el primero!
                    </div>
                  </div>
                ) : (
                  messages.map((entry) => {
                    const isOwn = authUser?.id === entry.senderId;
                    const timestamp = new Date(entry.createdAt).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={entry.id}
                        className={classNames('flex gap-3', isOwn ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={classNames(
                            'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                            isOwn
                              ? 'bg-sena-green text-white'
                              : 'glass-liquid text-[var(--color-text)]'
                          )}
                        >
                          {!isOwn && (
                            <p className="mb-1 text-[11px] font-semibold text-[var(--color-muted)]">
                              {entry.senderId}
                            </p>
                          )}
                          <p className="leading-relaxed">{entry.content}</p>
                          <p
                            className={classNames(
                              'mt-1.5 text-[10px]',
                              isOwn ? 'text-white/70' : 'text-[var(--color-muted)]'
                            )}
                          >
                            {timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>

              {/* Input de mensaje */}
              <form className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4" onSubmit={handleSendMessage}>
                <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
                  aria-label="Adjuntar archivo"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <div className="flex-1 rounded-2xl glass-liquid px-4 py-2.5 transition focus-within:border-sena-green/50">
                  <textarea
                    rows={1}
                    placeholder="Escribe un mensaje..."
                    className="w-full resize-none bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (message.trim()) {
                          handleSendMessage(e as any);
                        }
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl glass-liquid text-[var(--color-muted)] transition hover:text-sena-green"
                  aria-label="Insertar emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!message.trim()}
                  loading={sendMessageMutation.isPending}
                  className="h-10 w-10 rounded-xl px-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-2xl glass-liquid p-8">
              <MessageCirclePlus className="mx-auto h-12 w-12 text-sena-green/80" />
              <div className="mt-4 space-y-2">
                <p className="text-base font-semibold text-[var(--color-text)]">Selecciona una conversación</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Elige un chat de la lista o crea uno nuevo para comenzar
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="mt-6"
                onClick={() => setShowNewChatModal(true)}
              >
                <MessageCirclePlus className="h-4 w-4" />
                Nuevo chat
              </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nuevo Chat estilo WhatsApp */}
      <GlassDialog
        open={showNewChatModal}
        onClose={() => {
          setShowNewChatModal(false);
          setNewChatType(null);
          reset(initialCreateChatValues);
        }}
        size="md"
      >
        {!newChatType ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewChatModal(false)}
                className="h-9 w-9 rounded-full p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Nuevo chat</h3>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleQuickCreateChat('group')}
                className="flex w-full items-center gap-4 rounded-xl glass-liquid p-4 text-left transition hover:opacity-80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sena-green/20 text-sena-green">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">Nuevo grupo</p>
                  <p className="text-sm text-[var(--color-muted)]">Crea un grupo para coordinar con tu equipo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickCreateChat('direct')}
                className="flex w-full items-center gap-4 rounded-xl glass-liquid p-4 text-left transition hover:opacity-80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sena-green/20 text-sena-green">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">Nuevo contacto</p>
                  <p className="text-sm text-[var(--color-muted)]">Inicia una conversación privada</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNewChatType('community')}
                className="flex w-full items-center gap-4 rounded-xl glass-liquid p-4 text-left transition hover:opacity-80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sena-green/20 text-sena-green">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">Nueva comunidad</p>
                  <p className="text-sm text-[var(--color-muted)]">Crea una comunidad para conectar personas</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewChatType(null)}
                className="h-9 w-9 rounded-full p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {newChatType === 'group' ? 'Nuevo grupo' : newChatType === 'direct' ? 'Nuevo contacto' : 'Nueva comunidad'}
              </h3>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-4">
              {(newChatType === 'group' || newChatType === 'community') && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--color-text)]">
                    Nombre {newChatType === 'community' ? 'de la comunidad' : 'del grupo'}
                  </label>
                  <input
                    type="text"
                    placeholder={newChatType === 'community' ? 'Mi comunidad' : 'Mi grupo'}
                    className="rounded-xl glass-liquid px-4 py-3 text-sm outline-none transition focus:border-sena-green/50"
                    {...register('name')}
                  />
                  {errors.name && <span className="text-xs text-rose-400">{errors.name.message}</span>}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {newChatType === 'group' || newChatType === 'community' ? 'Integrantes (opcional)' : 'ID del destinatario (opcional)'}
                </label>
                <textarea
                  rows={newChatType === 'group' || newChatType === 'community' ? 3 : 2}
                  placeholder={
                    newChatType === 'group' || newChatType === 'community'
                      ? 'ID1, ID2, ID3... (Deja vacío para crear un chat de prueba)'
                      : 'ID del destinatario (Deja vacío para crear un chat de prueba)'
                  }
                  className="resize-none rounded-xl glass-liquid px-4 py-3 text-sm outline-none transition focus:border-sena-green/50"
                  {...register('memberIds')}
                />
                {errors.memberIds && <span className="text-xs text-rose-400">{errors.memberIds.message}</span>}
                <p className="text-xs text-[var(--color-muted)]">
                  Si no ingresas IDs, se creará un chat de prueba automáticamente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setNewChatType(null);
                    reset(initialCreateChatValues);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={createChatMutation.isPending}
                  onClick={() => {
                    setValue('chatType', newChatType === 'group' || newChatType === 'community' ? 'group' : 'direct');
                  }}
                >
                  Crear
                </Button>
              </div>
            </form>
          </div>
        )}
      </GlassDialog>
    </DashboardLayout>
  );
};
