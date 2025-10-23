import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { chatService } from '../../services/chatService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import {
  MessageCirclePlus,
  Send,
  Smile,
  MessageCircle,
  Users as UsersIcon,
  User as UserIcon,
  Paperclip
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';

type ChatFilter = 'all' | 'direct' | 'groups';

const filterTabs: Array<{ value: ChatFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'direct', label: 'Privados' },
  { value: 'groups', label: 'Grupos' }
];

const createChatSchema = z
  .object({
    chatType: z.enum(['direct', 'group']),
    name: z.string().trim().optional(),
    memberIds: z.string().min(1, 'Ingresa al menos un identificador')
  })
  .superRefine((values, ctx) => {
    const members = values.memberIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (members.length === 0) {
      ctx.addIssue({
        path: ['memberIds'],
        code: 'custom',
        message: 'Ingresa al menos un identificador valido'
      });
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

export const ChatsPage = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [message, setMessage] = useState('');

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
      queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => {});
      setSelectedChatId(chat.id);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { chatId: string; content: string }) =>
      chatService.sendMessage(payload.chatId, { content: payload.content }),
    onSuccess: () => {
      if (!selectedChatId) return;
      queryClient.invalidateQueries({ queryKey: ['chats', selectedChatId, 'messages'] }).catch(() => {});
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
      if (activeFilter === 'direct' && chat.isGroup) return false;

      if (!normalized) return true;

      const name = getChatName(chat.name, chat.isGroup).toLowerCase();
      return name.includes(normalized) || chat.id.toLowerCase().includes(normalized);
    });
  }, [chats, activeFilter, searchTerm]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const handleCreateChat = handleSubmit((values) => {
    const members = values.memberIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    createChatMutation.mutate(
      {
        name: values.chatType === 'group' ? values.name?.trim() || undefined : undefined,
        isGroup: values.chatType === 'group',
        memberIds: members
      },
      {
        onSuccess: () => {
          reset(initialCreateChatValues);
          setShowNewChat(false);
        }
      }
    );
  });

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

  return (
    <DashboardLayout title="Chats" subtitle="Mantente en contacto con tus equipos y grupos de estudio.">
      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card padded={false} className="flex flex-col overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-4 py-3 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Conversaciones</h2>
                <p className="text-[11px] text-[var(--color-muted)]">Chats privados y grupos activos.</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="px-2.5 text-[11px]"
                onClick={() => setShowNewChat((prev) => !prev)}
              >
                <MessageCirclePlus className="h-4 w-4" />
                Nuevo chat
              </Button>
            </div>
          </div>

          <div className="space-y-3 px-4 py-3">
            <div className="flex items-center gap-1 rounded-full bg-white/10 p-1 text-[11px] text-[var(--color-muted)]">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveFilter(tab.value)}
                  className={classNames(
                    'flex-1 rounded-full px-2.5 py-1 transition-all',
                    activeFilter === tab.value
                      ? 'bg-white text-sena-green shadow-[0_8px_16px_rgba(57,169,0,0.20)]'
                      : 'hover:text-[var(--color-text)]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Input
              label="Buscar chat"
              placeholder="Nombre o identificador"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="py-1.5 text-xs"
            />

            {showNewChat && (
              <form
                className="space-y-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-xs"
                onSubmit={handleCreateChat}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Tipo de chat
                  <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
                    <label
                      className={classNames(
                        'flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 transition',
                        chatType === 'direct' ? 'bg-white text-sena-green' : 'text-[var(--color-muted)]'
                      )}
                    >
                      <input
                        type="radio"
                        value="direct"
                        className="hidden"
                        {...register('chatType')}
                        checked={chatType === 'direct'}
                      />
                      Privado
                    </label>
                    <label
                      className={classNames(
                        'flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 transition',
                        chatType === 'group' ? 'bg-white text-sena-green' : 'text-[var(--color-muted)]'
                      )}
                    >
                      <input
                        type="radio"
                        value="group"
                        className="hidden"
                        {...register('chatType')}
                        checked={chatType === 'group'}
                      />
                      Grupo
                    </label>
                  </div>
                </div>

                {chatType === 'group' && (
                  <div className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text)]">
                    <span>Nombre del grupo</span>
                    <input
                      type="text"
                      placeholder="Proyecto de innovacion"
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                      {...register('name')}
                    />
                    {errors.name && <span className="text-[11px] text-rose-400">{errors.name.message}</span>}
                  </div>
                )}

                <div className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text)]">
                  <span>{chatType === 'group' ? 'Integrantes' : 'Destinatario'}</span>
                  <textarea
                    rows={chatType === 'group' ? 3 : 2}
                    placeholder={chatType === 'group' ? 'ID1, ID2, ID3...' : 'ID del destinatario'}
                    className="resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                    {...register('memberIds')}
                  />
                  {errors.memberIds && (
                    <span className="text-[11px] text-rose-400">{errors.memberIds.message}</span>
                  )}
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Separa cada identificador con una coma.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="px-2.5 text-[11px]"
                    onClick={() => {
                      reset(initialCreateChatValues);
                      setShowNewChat(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="px-3 text-[11px]"
                    loading={createChatMutation.isPending}
                  >
                    Crear chat
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {isLoadingChats ? (
              <div className="mt-8 text-center text-xs text-[var(--color-muted)]">Cargando conversaciones...</div>
            ) : filteredChats.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center text-xs text-[var(--color-muted)]">
                No hay conversaciones en esta vista.
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredChats.map((chat) => {
                  const isActive = chat.id === selectedChatId;
                  const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);

                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedChatId(chat.id)}
                        className={classNames(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all',
                          isActive
                            ? 'bg-white/20 text-sena-green shadow-[0_10px_20px_rgba(57,169,0,0.16)]'
                            : 'text-[var(--color-text)] hover:bg-white/10'
                        )}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shadow-[0_6px_12px_rgba(18,55,29,0.14)]">
                          {chat.isGroup ? (
                            <UsersIcon className="h-4 w-4 text-sena-green" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-sena-green" />
                          )}
                        </span>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{getChatName(chat.name, chat.isGroup)}</p>
                            <span className="whitespace-nowrap text-[10px] text-[var(--color-muted)]">
                              {lastActivity}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                            {chat.isGroup ? 'Grupo colaborativo' : 'Mensaje directo'}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card padded={false} className="flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4 text-sm text-[var(--color-text)] dark:border-white/5 dark:bg-white/5">
                <div>
                  <h3 className="text-base font-semibold">{getChatName(activeChat.name, activeChat.isGroup)}</h3>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {activeChat.isGroup ? 'Chat grupal' : 'Chat privado'} - Ultima actividad{' '}
                    {formatLastActivity(activeChat.lastMessageAt ?? activeChat.createdAt)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] text-[var(--color-muted)]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {messages.length} mensajes
                </span>
              </div>

              <div
                ref={messageListRef}
                className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
              >
                {isFetchingMessages ? (
                  <div className="text-center text-xs text-[var(--color-muted)]">Sincronizando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                    Aun no hay mensajes en este chat. Escribe el primero!
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
                        className={classNames('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={classNames(
                            'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-[0_8px_16px_rgba(18,55,29,0.12)]',
                            isOwn
                              ? 'bg-sena-green/90 text-white'
                              : 'bg-white/15 text-[var(--color-text)] dark:bg-white/10'
                          )}
                        >
                          <p className="text-[11px] font-semibold opacity-80">
                            {isOwn ? 'Tu' : entry.senderId}
                          </p>
                          <p className="mt-1 leading-relaxed">{entry.content}</p>
                          <p className={classNames('mt-2 text-[10px]', isOwn ? 'text-white/70' : 'text-[var(--color-muted)]')}>
                            {timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                className="border-t border-white/10 bg-white/5 px-5 py-3 dark:border-white/5 dark:bg-white/5"
                onSubmit={handleSendMessage}
              >
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[var(--color-muted)] transition hover:text-sena-green"
                    aria-label="Adjuntar archivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 shadow-[0_10px_20px_rgba(18,55,29,0.12)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30">
                    <textarea
                      rows={2}
                      placeholder="Escribe un mensaje..."
                      className="w-full resize-none bg-transparent text-sm text-[var(--color-text)] outline-none"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!message.trim()}
                    loading={sendMessageMutation.isPending}
                    className="px-3 text-[11px]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[var(--color-muted)] transition hover:text-sena-green"
                    aria-label="Insertar emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-sm text-[var(--color-muted)]">
              <MessageCirclePlus className="h-8 w-8 text-sena-green/70" />
              <p>Selecciona una conversacion para comenzar a chatear o crea un nuevo chat.</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};
