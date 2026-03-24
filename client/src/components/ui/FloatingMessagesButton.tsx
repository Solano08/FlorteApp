import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronUp, ArrowLeft, Send } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { friendService } from '../../services/friendService';
import { useAuth } from '../../hooks/useAuth';
import { UserAvatar } from './UserAvatar';
import type { Chat, Message } from '../../types/chat';
import type { Profile } from '../../types/profile';
import {
  UI_DIALOG_CONTENT_TRANSITION,
  UI_MENU_TRANSITION,
  UI_MOTION_DURATION_S
} from '../../utils/transitionConfig';

const floatingMsgsPanelTransition = UI_DIALOG_CONTENT_TRANSITION;

const getChatDisplayName = (
  chat: Chat,
  friends: Profile[],
  currentUserId: string | undefined
): string => {
  if (chat.name?.trim() && chat.name.trim().length > 0) return chat.name.trim();
  if (chat.isGroup) return 'Grupo sin título';
  if (chat.peer) {
    const p = chat.peer;
    return `${p.firstName} ${p.lastName}`.trim() || p.firstName || 'Usuario';
  }
  const otherId = chat.createdBy !== currentUserId ? chat.createdBy : null;
  if (otherId) {
    const friend = friends.find((f) => f.id === otherId);
    if (friend) return `${friend.firstName} ${friend.lastName}`.trim() || friend.firstName || 'Usuario';
  }
  return 'Chat privado';
};

const getInitials = (label: string) => {
  const parts = (label || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '??';
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export const FloatingMessagesButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  /** Tras la entrada del panel (0.62s), activa el backdrop-filter para evitar glitches en Chrome. */
  const [menuGlassBlurActive, setMenuGlassBlurActive] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: chatService.listChats
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.listFriends
  });

  const sortedChats = [...chats].sort((a, b) => {
    const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
    const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
    return bT - aT;
  });

  const selectedChat = useMemo(
    () => sortedChats.find((chat) => chat.id === selectedChatId) ?? null,
    [sortedChats, selectedChatId]
  );

  const { data: selectedMessages = [] } = useQuery<Message[]>({
    enabled: Boolean(open && selectedChatId),
    queryKey: ['floating-chat-messages', selectedChatId],
    queryFn: async () => {
      if (!selectedChatId) return [];
      const list = await chatService.listMessages(selectedChatId);
      return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    refetchOnWindowFocus: true,
    refetchInterval: 3000,
    staleTime: 1500
  });

  const selectedChatTargetId = useMemo(() => {
    if (!selectedChat) return null;
    if (!selectedChat.isGroup && selectedChat.peer?.id) {
      return selectedChat.peer.id;
    }
    if (selectedChat.createdBy && selectedChat.createdBy !== user?.id) {
      return selectedChat.createdBy;
    }
    const otherSender = [...selectedMessages].reverse().find((msg) => msg.senderId !== user?.id);
    return otherSender?.senderId ?? null;
  }, [selectedChat, selectedMessages, user?.id]);

  const selectedChatTargetProfile = useMemo(() => {
    if (!selectedChat) return null;
    if (selectedChat.isGroup) {
      return friends.find((friend) => friend.id === selectedChatTargetId) ?? null;
    }
    if (selectedChat.peer) {
      return {
        firstName: selectedChat.peer.firstName,
        lastName: selectedChat.peer.lastName,
        avatarUrl: selectedChat.peer.avatarUrl ?? null
      };
    }
    return friends.find((friend) => friend.id === selectedChatTargetId) ?? null;
  }, [friends, selectedChat, selectedChatTargetId]);

  const lastIncomingMessageIdBySender = useMemo(() => {
    const lastBySender: Record<string, string> = {};
    selectedMessages.forEach((msg) => {
      if (msg.senderId !== user?.id) {
        lastBySender[msg.senderId] = msg.id;
      }
    });
    return lastBySender;
  }, [selectedMessages, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { chatId: string; content: string }) => {
      return await chatService.sendMessage(payload.chatId, { content: payload.content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['floating-chat-messages', variables.chatId] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => {});
      setDraftMessage('');
      requestAnimationFrame(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      });
    }
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(t)) {
        const menu = document.querySelector('[data-floating-messages-menu]');
        if (menu && !menu.contains(t)) setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedChatId(null);
      setDraftMessage('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMenuGlassBlurActive(false);
      return;
    }
    setMenuGlassBlurActive(false);
    const delayMs = UI_MOTION_DURATION_S * 1000;
    const id = window.setTimeout(() => setMenuGlassBlurActive(true), delayMs);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (selectedChatId && messageListRef.current) {
      requestAnimationFrame(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      });
    }
  }, [selectedChatId, selectedMessages.length]);

  const handleChatClick = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setDraftMessage('');
  };

  const handleNavigateProfile = (targetUserId: string) => {
    setOpen(false);
    setSelectedChatId(null);
    if (targetUserId === user?.id) {
      navigate('/profile');
      return;
    }
    navigate(`/profile/${targetUserId}`);
  };

  /** Abre la misma conversación en la vista Chats (desde inicio / menú flotante). */
  const handleOpenChatInChatsPage = () => {
    if (!selectedChat) return;
    setOpen(false);
    setSelectedChatId(null);
    setDraftMessage('');
    navigate(`/chats?chatId=${encodeURIComponent(selectedChat.id)}`);
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) {
      const ownName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
      return ownName || 'Tú';
    }
    const friend = friends.find((f) => f.id === senderId);
    if (friend) return `${friend.firstName} ${friend.lastName}`.trim() || friend.firstName || 'Usuario';
    return 'Usuario';
  };

  const submitFloatingMessage = () => {
    if (!selectedChatId || !draftMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ chatId: selectedChatId, content: draftMessage.trim() });
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitFloatingMessage();
  };

  const isBrowser = typeof document !== 'undefined';
  const [menuPosition, setMenuPosition] = useState({ bottom: 104, right: 32 });

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({
      bottom: window.innerHeight - rect.top + 8,
      right: window.innerWidth - rect.right
    });
  }, [open]);

  const menuContent = open && (
    <AnimatePresence>
      <motion.div
        data-floating-messages-menu
        data-floating-glass-phase={menuGlassBlurActive ? 'ready' : 'entering'}
        key="messages-menu"
        initial={{ bottom: menuPosition.bottom - 10 }}
        animate={{ bottom: menuPosition.bottom }}
        exit={{ bottom: menuPosition.bottom - 10 }}
        transition={UI_MENU_TRANSITION.bottom}
        className="fixed z-[9999] flex h-[min(60vh,400px)] w-[320px] max-w-[calc(100vw-32px)] flex-col"
        style={{
          right: menuPosition.right,
          left: 'auto',
          ['--ui-motion-duration' as string]: `${UI_MOTION_DURATION_S}s`
        }}
      >
        <div
          className={`floating-messages-menu-shadow flex min-h-0 flex-1 flex-col rounded-2xl${
            menuGlassBlurActive ? ' floating-messages-menu-shadow--glass-active' : ''
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
          <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {!selectedChat ? (
              <motion.div
                key="floating-msgs-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={floatingMsgsPanelTransition}
                className="absolute inset-0 flex min-h-0 flex-col bg-white/[0.06] dark:bg-black/[0.1]"
              >
                <div className="floating-messages-submenu-blur flex shrink-0 items-center justify-between gap-2 border-b border-white/35 px-4 py-3 dark:border-white/10 bg-white/25 dark:bg-white/[0.06]">
                  <h3 className="min-w-0 flex-1 text-sm font-semibold text-[var(--color-text)]">Mensajes</h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl p-1.5 text-[var(--color-muted)] transition-colors hover:bg-white/45 hover:text-[var(--color-text)] dark:hover:bg-white/10"
                    aria-label="Cerrar"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 [overflow-anchor:none]"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {sortedChats.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-[var(--color-muted)] text-center">
                      Aún no tienes conversaciones
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {sortedChats.map((chat) => {
                        const label = getChatDisplayName(chat, friends, user?.id);
                        const chatProfile = chat.isGroup
                          ? null
                          : chat.peer
                            ? {
                                firstName: chat.peer.firstName,
                                lastName: chat.peer.lastName,
                                avatarUrl: chat.peer.avatarUrl ?? null
                              }
                            : friends.find((friend) => {
                                if (friend.id === chat.createdBy && friend.id !== user?.id) return true;
                                const fullName = `${friend.firstName} ${friend.lastName}`.trim().toLowerCase();
                                return fullName.length > 0 && fullName === label.trim().toLowerCase();
                              }) ?? null;
                        const initials = getInitials(label);
                        const time = formatTime(chat.lastMessageAt ?? chat.createdAt);

                        return (
                          <li key={chat.id}>
                            <button
                              type="button"
                              onClick={() => handleChatClick(chat.id)}
                              className="mx-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/40 dark:hover:bg-white/[0.08]"
                            >
                              {chatProfile ? (
                                <UserAvatar
                                  firstName={chatProfile.firstName}
                                  lastName={chatProfile.lastName}
                                  avatarUrl={chatProfile.avatarUrl}
                                  size="sm"
                                />
                              ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white bg-sena-green">
                                  {initials}
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[var(--color-text)]">{label}</p>
                                {chat.lastMessage && (
                                  <p className="truncate text-xs text-[var(--color-muted)]">
                                    {chat.lastMessage}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-[10px] font-medium text-[var(--color-muted)]">
                                {time}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`floating-msgs-chat-${selectedChat.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={floatingMsgsPanelTransition}
                className="absolute inset-0 flex min-h-0 flex-col overflow-hidden [overflow-anchor:none]"
              >
                <div className="floating-messages-submenu-blur flex shrink-0 items-center justify-between gap-2 border-b border-white/35 px-4 py-3 dark:border-white/10 bg-white/25 dark:bg-white/[0.06]">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    {selectedChat.isGroup ? (
                      <button
                        type="button"
                        onClick={handleOpenChatInChatsPage}
                        className="flex min-w-0 w-full items-center gap-2 rounded-xl px-1 py-0.5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/10"
                        aria-label="Abrir grupo en Chats"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sena-green/90 text-[10px] font-bold text-white">
                          {getInitials(getChatDisplayName(selectedChat, friends, user?.id))}
                        </span>
                        <span className="truncate text-sm font-semibold text-[var(--color-text)] hover:text-sena-green">
                          {getChatDisplayName(selectedChat, friends, user?.id)}
                        </span>
                      </button>
                    ) : (
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={handleOpenChatInChatsPage}
                          className="flex min-w-0 w-full items-center gap-2 rounded-xl px-1 py-0.5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/10"
                          aria-label="Abrir conversación en Chats"
                        >
                          {selectedChatTargetProfile ? (
                            <UserAvatar
                              firstName={selectedChatTargetProfile.firstName}
                              lastName={selectedChatTargetProfile.lastName}
                              avatarUrl={selectedChatTargetProfile.avatarUrl}
                              size="xs"
                            />
                          ) : (
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sena-green/90 text-[10px] font-bold text-white">
                              {getInitials(getChatDisplayName(selectedChat, friends, user?.id))}
                            </span>
                          )}
                          <span className="truncate text-sm font-semibold text-[var(--color-text)] hover:text-sena-green">
                            {selectedChatTargetProfile
                              ? `${selectedChatTargetProfile.firstName} ${selectedChatTargetProfile.lastName}`.trim()
                              : getChatDisplayName(selectedChat, friends, user?.id)}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="rounded-xl p-1.5 text-[var(--color-muted)] transition-colors hover:bg-white/45 hover:text-[var(--color-text)] dark:hover:bg-white/10"
                    aria-label="Volver al menú de mensajes"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
                <div
                  ref={messageListRef}
                  className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden bg-white/[0.08] px-3 py-2 dark:bg-black/[0.12]"
                >
                  {selectedMessages.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-[var(--color-muted)]">
                      Aún no hay mensajes en este chat.
                    </p>
                  ) : (
                    selectedMessages.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      const senderProfile = friends.find((friend) => friend.id === message.senderId) ?? null;
                      const showIncomingAvatar =
                        !isOwn && lastIncomingMessageIdBySender[message.senderId] === message.id;

                      return (
                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {isOwn ? (
                            <div className="max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed bg-sena-green text-white">
                              {message.content || '...'}
                            </div>
                          ) : (
                            <div className="flex items-end gap-2 max-w-[90%]">
                              {showIncomingAvatar ? (
                                senderProfile ? (
                                  <button
                                    type="button"
                                    onClick={() => handleNavigateProfile(message.senderId)}
                                    className="mb-0.5"
                                    aria-label="Ver perfil del usuario"
                                  >
                                    <UserAvatar
                                      firstName={senderProfile.firstName}
                                      lastName={senderProfile.lastName}
                                      avatarUrl={senderProfile.avatarUrl}
                                      size="xs"
                                    />
                                  </button>
                                ) : (
                                  <span className="mb-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sena-green/90 text-[10px] font-bold text-white">
                                    {getInitials(getSenderName(message.senderId))}
                                  </span>
                                )
                              ) : (
                                <span className="inline-block w-7" />
                              )}
                              <div className="flex flex-col gap-0.5">
                                {showIncomingAvatar && senderProfile && (
                                  <button
                                    type="button"
                                    onClick={() => handleNavigateProfile(message.senderId)}
                                    className="-ml-8 truncate text-[10px] font-semibold text-[var(--color-muted)] hover:text-sena-green text-left"
                                  >
                                    {`${senderProfile.firstName} ${senderProfile.lastName}`.trim()}
                                  </button>
                                )}
                                <div className="floating-messages-submenu-blur-sm rounded-2xl border border-white/35 bg-white/50 px-3 py-2 text-xs leading-relaxed text-[var(--color-text)] dark:border-white/10 dark:bg-neutral-800/55">
                                  {message.content || '...'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <form
                  onSubmit={handleSendMessage}
                  className="floating-messages-submenu-blur shrink-0 border-t border-white/35 bg-white/25 p-3 dark:border-white/10 dark:bg-white/[0.06]"
                >
                  <div className="flex items-end gap-2">
                    <div className="chat-message-compose-glass min-w-0 flex-1 rounded-2xl glass-liquid px-3 py-1.5 transition-shadow duration-ui">
                      <textarea
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        rows={2}
                        placeholder="Escribe un mensaje..."
                        className="max-h-24 min-h-[40px] w-full resize-none bg-transparent text-xs leading-snug text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitFloatingMessage();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!draftMessage.trim() || sendMessageMutation.isPending}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sena-green text-white transition hover:bg-sena-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Enviar mensaje"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  const buttonElement = (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setOpen(!open)}
      className="floating-messages-btn fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2.5 rounded-2xl px-4 text-[var(--color-text)] transition-all hover:scale-[1.02] hover:text-sena-green active:scale-[0.98] lg:bottom-8 lg:right-8 xl:right-12 2xl:right-16"
      aria-label={open ? 'Cerrar mensajes' : 'Abrir mensajes'}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="font-medium">Mensajes</span>
    </button>
  );

  if (!isBrowser) return null;

  return createPortal(
    <>
      {buttonElement}
      {open && menuContent}
    </>,
    document.body
  );
};
