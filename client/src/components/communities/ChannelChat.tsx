import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Hash, Send, MoreVertical, Plus, Smile, Info, Users, Pin, X, Reply, Copy, Forward, Star, Flag, Trash2 } from 'lucide-react';
import { ChannelMessage } from '../../types/channel';
import { Button } from '../ui/Button';
import { GlassDialog } from '../ui/GlassDialog';
import { EmojiPicker } from '../ui/EmojiPicker';
import { resolveAssetUrl } from '../../utils/media';
import { useAuthContext } from '../../contexts/AuthContext';

interface ChannelChatProps {
  channelName: string;
  channelDescription?: string | null;
  messages: ChannelMessage[];
  isLoadingMessages?: boolean;
  onSendMessage: (payload: { content?: string; attachmentUrl?: string }) => Promise<void> | void;
}

export const ChannelChat: FC<ChannelChatProps> = ({
  channelName,
  channelDescription,
  messages,
  isLoadingMessages,
  onSendMessage
}) => {
  const { user } = useAuthContext();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [pinnedMenuOpen, setPinnedMenuOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollVotes, setPollVotes] = useState<Record<string, string | null>>({});
  const pinnedMenuRef = useRef<HTMLDivElement | null>(null);
  const membersPanelRef = useRef<HTMLElement | null>(null);
  const messageMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);

  // Cerrar menú de mensajes fijados al hacer clic fuera
  useEffect(() => {
    if (!pinnedMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pinnedMenuRef.current && !pinnedMenuRef.current.contains(event.target as Node)) {
        setPinnedMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pinnedMenuOpen]);

  // Cerrar panel de miembros al hacer clic fuera
  useEffect(() => {
    if (!membersOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (membersPanelRef.current && !membersPanelRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Solo cerrar si no se hace clic en el overlay
        if (target.classList.contains('backdrop-blur-[2px]')) {
          setMembersOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [membersOpen]);

  // Cerrar menú de mensajes al hacer clic fuera
  useEffect(() => {
    if (!openMessageMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const menuRef = messageMenuRefs.current[openMessageMenuId];
      if (menuRef && !menuRef.contains(event.target as Node)) {
        setOpenMessageMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMessageMenuId]);

  // Cerrar emoji picker al hacer clic fuera
  useEffect(() => {
    if (!emojiPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target)
      ) {
        setEmojiPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emojiPickerOpen]);

  const getAvatarColorClasses = (id?: string | null) => {
    const palette = [
      'bg-sena-green/15 text-sena-green',
      'bg-sky-500/15 text-sky-500',
      'bg-amber-500/15 text-amber-500',
      'bg-fuchsia-500/15 text-fuchsia-500',
      'bg-emerald-500/15 text-emerald-500'
    ];
    if (!id) return palette[0];
    let sum = 0;
    for (let i = 0; i < id.length; i += 1) {
      sum += id.charCodeAt(i);
    }
    return palette[sum % palette.length];
  };

  const previousChannelNameRef = useRef<string>('');
  useEffect(() => {
    const channelChanged = previousChannelNameRef.current !== channelName;
    previousChannelNameRef.current = channelName;
    
    // Siempre hacer scroll al final cuando:
    // 1. Cambia el canal (entrar a un nuevo canal)
    // 2. Se cargan mensajes por primera vez
    // 3. Hay nuevos mensajes
    if (channelChanged || (!isLoadingMessages && messages.length > 0)) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: channelChanged ? 'auto' : 'smooth' });
          }
        });
      });
    }
  }, [messages, channelName, isLoadingMessages]);

  const activeMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl?: string | null }>();
    messages.forEach((m) => {
      if (m.sender) {
        const name = `${m.sender.firstName} ${m.sender.lastName}`.trim();
        if (!map.has(m.sender.id)) {
          map.set(m.sender.id, { id: m.sender.id, name, avatarUrl: m.sender.avatarUrl });
        }
      }
    });
    return Array.from(map.values());
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    try {
      setSending(true);
      await onSendMessage({ content: content.trim() });
      setContent('');
    } finally {
      setSending(false);
    }
  };

  const handleAttachFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;
      try {
        setSending(true);
        await onSendMessage({ attachmentUrl: result, content: content.trim() || undefined });
        setContent('');
      } finally {
        setSending(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const POLL_PREFIX = '__POLL__:';

  const parsePollContent = (raw?: string | null) => {
    if (!raw || !raw.startsWith(POLL_PREFIX)) return null;
    try {
      const json = raw.slice(POLL_PREFIX.length);
      const parsed = JSON.parse(json) as { title: string; options: string[] };
      if (!parsed.title || !Array.isArray(parsed.options) || parsed.options.length < 2) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const openPollDialog = () => {
    setPollTitle('');
    setPollOptions(['', '']);
    setPollDialogOpen(true);
    setPlusMenuOpen(false);
  };

  const handleCreatePoll = async (e: FormEvent) => {
    e.preventDefault();
    const title = pollTitle.trim();
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!title || options.length < 2) return;

    const payload = {
      title,
      options
    };

    try {
      setPollSubmitting(true);
      await onSendMessage({
        content: `${POLL_PREFIX}${JSON.stringify(payload)}`
      });
      setPollDialogOpen(false);
      setPollTitle('');
      setPollOptions(['', '']);
    } finally {
      setPollSubmitting(false);
    }
  };

  const handleVote = (messageId: string, option: string) => {
    setPollVotes((prev) => ({
      ...prev,
      [messageId]: option
    }));
  };

  return (
    <section className="chat-ios flex h-full min-h-0 flex-1 flex-col bg-gradient-to-br from-white/50 via-white/30 to-white/50 dark:from-slate-900/50 dark:via-slate-900/30 dark:to-slate-900/50 backdrop-blur-xl">
      {/* Header del canal */}
      <header className="flex items-center gap-3 border-b border-white/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-5 py-3.5 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sena-green/10 dark:bg-sena-green/20">
          <Hash className="h-4.5 w-4.5 text-sena-green dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[var(--color-text)] truncate">{channelName}</h2>
          {channelDescription && (
            <p className="text-[11px] text-[var(--color-muted)] truncate">{channelDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Botón y menú de mensajes fijados */}
          <div className="relative">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-[var(--color-muted)] shadow-sm transition-all duration-150 hover:bg-white hover:text-sena-green dark:bg-slate-800/70 dark:hover:bg-slate-700"
              onClick={() => setPinnedMenuOpen((prev) => !prev)}
              aria-label="Ver mensajes fijados"
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            {pinnedMenuOpen && (
              <div
                ref={pinnedMenuRef}
                className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3 text-sm text-[var(--color-text)] shadow-[0_18px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Mensajes fijados
                  </span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[var(--color-muted)] hover:text-sena-green dark:bg-slate-800/80 transition-colors"
                    onClick={() => setPinnedMenuOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {/* Por ahora no hay soporte para mensajes fijados en el backend */}
                  <p className="text-xs text-[var(--color-muted)] py-2">
                    Aún no hay mensajes fijados en este canal.
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-[var(--color-muted)] shadow-sm transition-all duration-150 hover:bg-white hover:text-sena-green dark:bg-slate-800/70 dark:hover:bg-slate-700"
            onClick={() => setMembersOpen(true)}
            aria-label="Ver miembros del canal"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-[var(--color-muted)] shadow-sm transition-all duration-150 hover:bg-white hover:text-sena-green dark:bg-slate-800/70 dark:hover:bg-slate-700"
            onClick={() => setInfoOpen(true)}
            aria-label="Información del canal"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Área de mensajes + input inferior */}
      <div className="flex flex-1 min-h-0 flex-col">
        {/* Mensajes */}
        <div className="flex-1 min-h-0 px-5 py-4 overflow-y-auto">
          <div className="flex h-full flex-col space-y-3">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-[var(--color-muted)]">Cargando mensajes...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-sm text-[var(--color-muted)] mb-1">
                  No hay mensajes aún
                </p>
                <p className="text-xs text-[var(--color-muted)] opacity-75">
                  Sé el primero en escribir en este canal
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const initials = `${message.sender?.firstName?.[0] ?? ''}${
                message.sender?.lastName?.[0] ?? ''
              }`.trim() || 'U';
              const isLast = index === messages.length - 1;

              return (
                <div
                  key={message.id}
                  className={`group flex gap-3 w-full transition-all duration-200 ${
                    isOwn ? 'justify-end' : 'justify-start'
                  } ${isLast ? 'chat-message-enter' : ''}`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {!isOwn && (
                    message.sender?.avatarUrl ? (
                      <img
                        src={resolveAssetUrl(message.sender.avatarUrl) ?? ''}
                        alt={message.sender.firstName}
                        className="h-10 w-10 flex-shrink-0 rounded-2xl object-cover ring-1 ring-white/40 dark:ring-white/15 shadow-sm"
                      />
                    ) : (
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/40 dark:ring-white/15 shadow-sm ${getAvatarColorClasses(
                          message.sender?.id
                        )}`}
                      >
                        <span className="text-[11px] font-semibold">
                          {initials.length > 2 ? initials.slice(0, 2) : initials}
                        </span>
                      </div>
                    )
                  )}
                  <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <div className="mb-1 flex items-center gap-2 px-1">
                        <span className="text-xs font-semibold text-[var(--color-text)]">
                          {message.sender?.firstName} {message.sender?.lastName}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {new Date(message.createdAt).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {parsePollContent(message.content) ? (
                      (() => {
                        const poll = parsePollContent(message.content)!;
                        const currentVote = pollVotes[message.id] ?? null;
                        const counts = poll.options.reduce<Record<string, number>>((acc, opt) => {
                          acc[opt] = 0;
                          return acc;
                        }, {});
                        Object.entries(pollVotes).forEach(([msgId, opt]) => {
                          if (msgId === message.id && opt && counts[opt] !== undefined) {
                            counts[opt] += 1;
                          }
                        });
                        const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

                        return (
                          <div className="inline-flex max-w-full flex-col rounded-2xl bg-white/95 px-3.5 py-3 text-[13px] leading-relaxed tracking-tight text-[var(--color-text)] shadow-sm ring-1 ring-white/40 dark:bg-slate-800/95 dark:ring-white/10">
                            <p className="text-xs font-semibold text-[var(--color-text)] mb-2">
                              Encuesta: {poll.title}
                            </p>
                            <div className="space-y-1.5">
                              {poll.options.map((opt) => {
                                const isSelected = currentVote === opt;
                                const count = counts[opt] ?? 0;
                                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleVote(message.id, opt)}
                                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] transition-all duration-150 border ${
                                      isSelected
                                        ? 'border-sena-green/70 bg-sena-green/10 text-sena-green'
                                        : 'border-white/60 bg-white/60 text-[var(--color-text)] hover:border-sena-green/40 hover:bg-sena-green/5 dark:border-white/10 dark:bg-slate-800/80'
                                    }`}
                                  >
                                    <span className="truncate text-left flex-1">{opt}</span>
                                    <span className="ml-2 flex items-center gap-1 text-[10px] text-[var(--color-muted)]">
                                      {totalVotes > 0 && <span>{percentage}%</span>}
                                      <span>{count}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {totalVotes > 0 && (
                              <p className="mt-2 text-[10px] text-[var(--color-muted)]">
                                {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
                              </p>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="relative inline-flex max-w-full flex-col rounded-2xl bg-white/95 px-3.5 py-2.5 text-[13px] leading-relaxed tracking-tight text-[var(--color-text)] shadow-sm ring-1 ring-white/40 dark:bg-slate-800/95 dark:ring-white/10">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 break-words">
                            {message.content}
                          </p>
                          <div className="relative">
                            <button
                              type="button"
                              className={`ml-2 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-all duration-150 hover:bg-white/70 hover:text-[var(--color-text)] dark:hover:bg-slate-700/80 ${
                                hoveredMessageId === message.id || openMessageMenuId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMessageMenuId(openMessageMenuId === message.id ? null : message.id);
                              }}
                              aria-label="Opciones del mensaje"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            {openMessageMenuId === message.id && (
                              <div
                                ref={(el) => {
                                  messageMenuRefs.current[message.id] = el;
                                }}
                                className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-8 z-50 w-48 rounded-2xl glass-frosted p-2 text-sm text-[var(--color-text)]`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setContent(`@${message.sender?.firstName || 'Usuario'} `);
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                >
                                  <Reply className="h-4 w-4 text-sena-green" /> Responder
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (message.content) {
                                      void navigator.clipboard.writeText(message.content);
                                    }
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                >
                                  <Copy className="h-4 w-4 text-sena-green" /> Copiar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (message.content) {
                                      setContent(message.content);
                                    }
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                >
                                  <Forward className="h-4 w-4 text-sena-green" /> Reenviar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // TODO: Implementar fijar mensaje
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                >
                                  <Pin className="h-4 w-4 text-sena-green" /> Fijar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // TODO: Implementar destacar mensaje
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                >
                                  <Star className="h-4 w-4 text-sena-green" /> Destacar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // TODO: Implementar reportar mensaje
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-rose-50/80"
                                >
                                  <Flag className="h-4 w-4 text-rose-500" /> Reportar
                                </button>
                                {isOwn && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // TODO: Implementar eliminar mensaje
                                      setOpenMessageMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-rose-50/80"
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500" /> Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`mt-1 flex items-center text-[10px] text-[var(--color-muted)] ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                    {message.attachmentUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden shadow-md border border-white/30 dark:border-white/10">
                        <img
                          src={resolveAssetUrl(message.attachmentUrl) ?? ''}
                          alt="Adjunto"
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input de mensaje pegado abajo y ocupando todo el ancho */}
        <div className="px-5 pb-5 pt-3 border-t border-white/20 dark:border-white/5">
          <form
            onSubmit={handleSubmit}
            className="w-full h-16 rounded-2xl border border-white/50 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 shadow-[0_4px_20px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 focus-within:border-sena-green/40 dark:focus-within:border-sena-green/30 focus-within:shadow-[0_4px_24px_rgba(57,169,0,0.15)] dark:focus-within:shadow-[0_4px_24px_rgba(57,169,0,0.25)]"
          >
            <div className="relative flex h-full items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 text-[var(--color-muted)] transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:text-sena-green hover:scale-105"
                  onClick={() => setPlusMenuOpen((prev) => !prev)}
                  aria-label="Más opciones"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {plusMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 z-30 w-52 rounded-2xl border border-white/40 bg-white/98 p-2 text-[12px] text-[var(--color-text)] shadow-[0_18px_40px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-slate-900/98">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      onClick={handleAttachFileClick}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        📎
                      </span>
                      <span className="text-left">Adjuntar archivo</span>
                    </button>
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      onClick={openPollDialog}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        📊
                      </span>
                      <span className="text-left">Crear encuesta</span>
                    </button>
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        // Hilo simple: solo etiqueta el mensaje como inicio de hilo
                        if (!content.trim()) {
                          setContent('[HILO] ');
                        } else if (!content.startsWith('[HILO]')) {
                          setContent((prev) => `[HILO] ${prev}`);
                        }
                      }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        🧵
                      </span>
                      <span className="text-left">Crear hilo</span>
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
              <input
                placeholder={`Escribe un mensaje en #${channelName}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 h-full border-none bg-transparent px-0 text-sm leading-snug placeholder:text-[var(--color-muted)] text-[var(--color-text)] outline-none focus:ring-0 focus:outline-none"
              />
              <div className="relative">
                <button
                  type="button"
                  ref={emojiButtonRef}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 text-[var(--color-muted)] transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:text-sena-green hover:scale-105"
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                >
                  <Smile className="h-4 w-4" />
                </button>
                {emojiPickerOpen && (
                  <div className="absolute bottom-full mb-2 right-0 z-50" ref={emojiPickerRef}>
                    <EmojiPicker
                      onEmojiSelect={(emoji) => {
                        setContent((prev) => prev + emoji);
                        setEmojiPickerOpen(false);
                      }}
                      onClose={() => setEmojiPickerOpen(false)}
                    />
                  </div>
                )}
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-11 w-11 rounded-xl px-0 bg-gradient-to-br from-sena-green to-emerald-600 hover:from-sena-green/95 hover:to-emerald-600/95 shadow-[0_4px_12px_rgba(57,169,0,0.3)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                loading={sending}
                disabled={!content.trim()}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Diálogo información del canal */}
      <GlassDialog open={infoOpen} onClose={() => setInfoOpen(false)} size="sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Información del canal</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Detalles rápidos del canal y su actividad reciente.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl bg-white/80 p-4 text-sm text-[var(--color-text)] shadow-sm dark:bg-slate-900/80">
            <p className="font-semibold">#{channelName}</p>
            {channelDescription && (
              <p className="text-[13px] text-[var(--color-muted)]">{channelDescription}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-[var(--color-muted)]">
              <span>
                {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
              </span>
              <span>
                {activeMembers.length} {activeMembers.length === 1 ? 'miembro activo' : 'miembros activos'}
              </span>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="button" variant="ghost" onClick={() => setInfoOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </GlassDialog>

      {/* Panel lateral de miembros (dashboard derecho) */}
      {membersOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-slate-950/20"
            onClick={() => setMembersOpen(false)}
          />
          <aside
            ref={membersPanelRef}
            className="fixed right-0 top-0 z-[101] flex h-full w-72 flex-col border-l border-white/20 bg-white/96 dark:bg-slate-950/95 backdrop-blur-xl shadow-[0_0_40px_rgba(15,23,42,0.25)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Miembros del canal</p>
                <p className="text-[11px] text-[var(--color-muted)]">
                  {activeMembers.length} {activeMembers.length === 1 ? 'miembro' : 'miembros'}
                </p>
              </div>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[var(--color-muted)] hover:text-sena-green dark:bg-slate-800/80 transition-colors"
                onClick={() => setMembersOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {activeMembers.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] py-4 text-center">
                  Aún no hay miembros activos en este canal.
                </p>
              ) : (
                activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-xl bg-white/90 dark:bg-slate-900/90 px-2.5 py-2 text-sm text-[var(--color-text)] shadow-sm ring-1 ring-white/40 dark:ring-white/10 transition-all hover:bg-white dark:hover:bg-slate-800/90"
                  >
                    {member.avatarUrl ? (
                      <img
                        src={resolveAssetUrl(member.avatarUrl) ?? ''}
                        alt={member.name}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-white/40 dark:ring-white/15"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sena-green/15 text-[11px] font-semibold text-sena-green ring-1 ring-white/40 dark:ring-white/15">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate flex-1">{member.name}</span>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}

    </section>
  );
};
