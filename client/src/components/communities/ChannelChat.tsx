import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Hash,
  Send,
  MoreVertical,
  Plus,
  Smile,
  Info,
  Users,
  Pin,
  X,
  Reply,
  Copy,
  Forward,
  Star,
  Flag,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChannelMessage } from '../../types/channel';
import { channelService } from '../../services/channelService';
import { Button } from '../ui/Button';
import { GlassDialog } from '../ui/GlassDialog';
import { EmojiPicker } from '../ui/EmojiPicker';
import { resolveAssetUrl } from '../../utils/media';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  UI_MENU_TRANSITION,
  UI_MOTION_SLIDE_TWEEN,
  UI_OVERLAY_TRANSITION,
  UI_MOTION_DURATION_S,
  UI_MOTION_EASE
} from '../../utils/transitionConfig';

interface ChannelChatProps {
  channelId: string;
  channelName: string;
  channelDescription?: string | null;
  messages: ChannelMessage[];
  isLoadingMessages?: boolean;
  onSendMessage: (payload: {
    content?: string;
    attachmentUrl?: string;
    threadRootId?: string;
    threadTitle?: string;
  }) => Promise<void> | void;
}

export const ChannelChat: FC<ChannelChatProps> = ({
  channelId,
  channelName,
  channelDescription,
  messages,
  isLoadingMessages,
  onSendMessage
}) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<ChannelMessage | null>(null);
  const [reportTarget, setReportTarget] = useState<ChannelMessage | null>(null);
  const [reportReason, setReportReason] = useState('Contenido inapropiado');
  const [reportDetails, setReportDetails] = useState('');

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => channelService.deleteMessage(messageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channelMessages', channelId] });
      setDeleteTarget(null);
      toast.success('Mensaje eliminado');
    },
    onError: () => {
      toast.error('No se pudo eliminar el mensaje');
    }
  });

  const reportReasons = [
    'Contenido inapropiado',
    'Informacion falsa',
    'Discurso danino o spam',
    'Violacion de derechos',
    'Otro'
  ];

  const reportMessageMutation = useMutation({
    mutationFn: ({ messageId, reason, details }: { messageId: string; reason: string; details?: string }) =>
      channelService.reportMessage(messageId, { reason, details: details || undefined }),
    onSuccess: () => {
      setReportTarget(null);
      setReportDetails('');
      toast.success('Reporte enviado');
    },
    onError: () => {
      toast.error('No se pudo enviar el reporte');
    }
  });

  const starMessageMutation = useMutation({
    mutationFn: (messageId: string) => channelService.toggleStarMessage(messageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channelMessages', channelId] });
      toast.success('Mensaje actualizado');
    },
    onError: () => {
      toast.error('No se pudo actualizar el mensaje');
    }
  });

  const pinMessageMutation = useMutation({
    mutationFn: (messageId: string) => channelService.togglePinMessage(messageId),
    onSuccess: (updated) => {
      queryClient.setQueryData<ChannelMessage[]>(['channelMessages', channelId], (old) => {
        if (!old) return old;
        const next = old.map((m) => {
          if (m.id === updated.id) {
            return { ...m, ...updated };
          }
          if (updated.isPinned && m.isPinned) {
            return { ...m, isPinned: false, pinnedAt: undefined, pinnedBy: undefined };
          }
          return m;
        });
        return next.sort((a, b) => {
          if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      });
      void queryClient.invalidateQueries({ queryKey: ['channelMessages', channelId] });
      toast.success('Mensaje actualizado');
    },
    onError: () => {
      toast.error('No se pudo actualizar el mensaje');
    }
  });

  const votePollMutation = useMutation({
    mutationFn: ({ messageId, optionIndex }: { messageId: string; optionIndex: number }) =>
      channelService.voteChannelPoll(messageId, optionIndex),
    onSuccess: (poll, { messageId }) => {
      queryClient.setQueryData<ChannelMessage[]>(['channelMessages', channelId], (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === messageId ? { ...m, poll } : m));
      });
    },
    onError: () => {
      toast.error('No se pudo registrar el voto');
    }
  });
  const navigate = useNavigate();
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
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [threadFormTitle, setThreadFormTitle] = useState('');
  const [threadFormBody, setThreadFormBody] = useState('');
  const [threadSubmitting, setThreadSubmitting] = useState(false);
  const [replyingThreadRootId, setReplyingThreadRootId] = useState<string | null>(null);
  const [replyingThreadTitle, setReplyingThreadTitle] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const messageMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const plusMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!plusMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [plusMenuOpen]);

  const getAvatarColorClasses = (id?: string | null) => {
    const palette = [
      'bg-sena-green/15 text-sena-green',
      'bg-sena-green/20 text-sena-green',
      'bg-emerald-500/15 text-sena-green',
      'bg-sena-green/25 text-sena-green',
      'bg-emerald-500/20 text-sena-green'
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

  useEffect(() => {
    if (!infoOpen && !membersOpen && !pinnedMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pinnedMenuOpen) setPinnedMenuOpen(false);
      else if (membersOpen) setMembersOpen(false);
      else if (infoOpen) setInfoOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [infoOpen, membersOpen, pinnedMenuOpen]);

  useEffect(() => {
    setInfoOpen(false);
    setMembersOpen(false);
    setPinnedMenuOpen(false);
  }, [channelId]);

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

  const pinnedMessages = useMemo(() => messages.filter((m) => m.isPinned), [messages]);

  const repliesByRoot = useMemo(() => {
    const map = new Map<string, ChannelMessage[]>();
    messages.forEach((m) => {
      if (!m.threadRootId) return;
      const arr = map.get(m.threadRootId) ?? [];
      arr.push(m);
      map.set(m.threadRootId, arr);
    });
    map.forEach((arr) => {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return map;
  }, [messages]);

  const timelineMessages = useMemo(() => messages.filter((m) => !m.threadRootId), [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    try {
      setSending(true);
      await onSendMessage({
        content: content.trim(),
        threadRootId: replyingThreadRootId ?? undefined
      });
      setContent('');
      setReplyingThreadRootId(null);
      setReplyingThreadTitle('');
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
        await onSendMessage({
          attachmentUrl: result,
          content: content.trim() || undefined,
          threadRootId: replyingThreadRootId ?? undefined
        });
        setContent('');
        setReplyingThreadRootId(null);
        setReplyingThreadTitle('');
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
      toast.success('Encuesta publicada');
    } catch {
      toast.error('No se pudo publicar la encuesta');
    } finally {
      setPollSubmitting(false);
    }
  };

  const handleCreateThread = async (e: FormEvent) => {
    e.preventDefault();
    const title = threadFormTitle.trim() || 'Nuevo hilo';
    const body = threadFormBody.trim();
    if (!body || threadSubmitting) return;
    try {
      setThreadSubmitting(true);
      await onSendMessage({ content: body, threadTitle: title });
      setThreadDialogOpen(false);
      setThreadFormTitle('');
      setThreadFormBody('');
      setPlusMenuOpen(false);
      toast.success('Hilo publicado');
    } catch {
      toast.error('No se pudo crear el hilo');
    } finally {
      setThreadSubmitting(false);
    }
  };

  const openThreadDialog = () => {
    setThreadFormTitle('');
    setThreadFormBody('');
    setThreadDialogOpen(true);
    setPlusMenuOpen(false);
  };

  const pollBarTransition = { duration: UI_MOTION_DURATION_S, ease: UI_MOTION_EASE };

  return (
    <section className="chat-ios flex h-full min-h-0 flex-1 flex-col glass-liquid">
      {/* Header del canal */}
      <header className="flex items-center gap-3 border-b border-white/20 dark:border-white/5 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-5 py-3.5 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl">
          <Hash className="h-4 w-4 text-[var(--color-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[var(--color-text)] truncate">{channelName}</h2>
          {channelDescription && (
            <p className="text-[11px] text-[var(--color-muted)] truncate">{channelDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] transition-all duration-ui ease-ui hover:text-sena-green"
            onClick={() => setPinnedMenuOpen(true)}
            aria-label="Ver mensajes fijados"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] transition-all duration-ui ease-ui hover:text-sena-green"
            onClick={() => setMembersOpen(true)}
            aria-label="Ver miembros del canal"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] transition-all duration-ui ease-ui hover:text-sena-green"
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
            timelineMessages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const initials = `${message.sender?.firstName?.[0] ?? ''}${
                message.sender?.lastName?.[0] ?? ''
              }`.trim() || 'U';
              const isLast = index === timelineMessages.length - 1;

              return (
                <div
                  key={message.id}
                  className={`group flex gap-3 w-full transition-all duration-ui ease-ui ${
                    isOwn ? 'justify-end' : 'justify-start'
                  } ${isLast ? 'chat-message-enter' : ''}`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {!isOwn && (
                    message.sender?.avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => message.sender?.id && navigate(`/profile/${message.sender.id}`)}
                        className="h-10 w-10 flex-shrink-0 rounded-2xl ring-1 ring-white/40 dark:ring-white/15 shadow-sm overflow-hidden transition-transform duration-ui ease-ui hover:scale-110 cursor-pointer"
                      >
                        <img
                          src={resolveAssetUrl(message.sender.avatarUrl) ?? ''}
                          alt={message.sender.firstName}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => message.sender?.id && navigate(`/profile/${message.sender.id}`)}
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/40 dark:ring-white/15 shadow-sm transition-transform duration-ui ease-ui hover:scale-110 cursor-pointer ${getAvatarColorClasses(
                          message.sender?.id
                        )}`}
                      >
                        <span className="text-[11px] font-semibold">
                          {initials.length > 2 ? initials.slice(0, 2) : initials}
                        </span>
                      </button>
                    )
                  )}
                  <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <div className="mb-1 flex items-center gap-2 px-1">
                        <button
                          type="button"
                          onClick={() => message.sender?.id && navigate(`/profile/${message.sender.id}`)}
                          className="text-xs font-semibold text-[var(--color-text)] hover:text-sena-green transition-colors duration-ui ease-ui cursor-pointer"
                        >
                          {message.sender?.firstName} {message.sender?.lastName}
                        </button>
                        {message.isPinned && (
                          <Pin className="h-3 w-3 text-sena-green flex-shrink-0" aria-label="Mensaje fijado" />
                        )}
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
                        const summary = message.poll;
                        const tallies =
                          summary?.tallies && summary.tallies.length === poll.options.length
                            ? summary.tallies
                            : poll.options.map(() => 0);
                        const totalVotes = summary?.totalVotes ?? tallies.reduce((a, b) => a + b, 0);
                        const viewerIdx = summary?.viewerVoteIndex ?? null;
                        const votingThis =
                          votePollMutation.isPending && votePollMutation.variables?.messageId === message.id;

                        return (
                          <motion.div
                            layout
                            className="inline-flex max-w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-white/98 to-white/90 px-3.5 py-3 text-[13px] leading-relaxed tracking-tight text-[var(--color-text)] shadow-md ring-1 ring-white/50 dark:from-neutral-800/98 dark:to-neutral-900/90 dark:ring-white/10"
                            transition={pollBarTransition}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sena-green">
                                Encuesta
                              </span>
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-sena-green/80 shadow-[0_0_8px_rgba(57,169,0,0.6)]"
                                aria-hidden
                              />
                              <span className="text-[10px] text-[var(--color-muted)]">En vivo</span>
                            </div>
                            <p className="text-sm font-semibold text-[var(--color-text)]">{poll.title}</p>
                            <div className="mt-2.5 space-y-2">
                              {poll.options.map((opt, idx) => {
                                const count = tallies[idx] ?? 0;
                                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                const isSelected = viewerIdx === idx;
                                return (
                                  <motion.button
                                    key={`${message.id}-opt-${idx}`}
                                    type="button"
                                    layout
                                    disabled={votingThis}
                                    onClick={() =>
                                      votePollMutation.mutate({ messageId: message.id, optionIndex: idx })
                                    }
                                    whileTap={{ scale: 0.98 }}
                                    transition={pollBarTransition}
                                    className={`relative w-full overflow-hidden rounded-2xl border px-2.5 py-2 text-left text-[11px] transition-all duration-ui ease-ui disabled:opacity-60 ${
                                      isSelected
                                        ? 'border-sena-green/60 bg-sena-green/8 text-sena-green ring-1 ring-sena-green/25'
                                        : 'border-white/55 bg-white/50 text-[var(--color-text)] hover:border-sena-green/35 hover:bg-sena-green/5 dark:border-white/10 dark:bg-neutral-800/70 dark:hover:bg-neutral-800'
                                    }`}
                                  >
                                    <div className="relative min-h-[1.25rem]">
                                      <motion.div
                                        className="absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-sena-green/30 via-sena-green/15 to-transparent dark:from-sena-green/25 dark:via-sena-green/10"
                                        initial={false}
                                        animate={{ width: `${percentage}%` }}
                                        transition={pollBarTransition}
                                      />
                                      <div className="relative z-10 flex items-center justify-between gap-2">
                                        <span className="truncate font-medium">{opt}</span>
                                        <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
                                          {totalVotes > 0 ? (
                                            <span className="tabular-nums">{percentage}%</span>
                                          ) : null}
                                          <span className="tabular-nums font-semibold text-[var(--color-text)]">
                                            {count}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                            {totalVotes > 0 ? (
                              <motion.p
                                className="mt-2 text-[10px] text-[var(--color-muted)]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={pollBarTransition}
                              >
                                {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} en la comunidad
                              </motion.p>
                            ) : (
                              <p className="mt-2 text-[10px] text-[var(--color-muted)]">Sé el primero en votar</p>
                            )}
                          </motion.div>
                        );
                      })()
                    ) : (
                      <>
                      <div className="relative inline-flex max-w-full flex-col rounded-2xl bg-white/95 px-3.5 py-2.5 text-[13px] leading-relaxed tracking-tight text-[var(--color-text)] shadow-sm ring-1 ring-white/40 dark:bg-neutral-800/95 dark:ring-white/10">
                        {message.threadTitle ? (
                          <div className="mb-2 flex min-w-0 items-center gap-2">
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sena-green/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sena-green">
                              <MessageCircle className="h-3 w-3" aria-hidden />
                              Hilo
                            </span>
                            <span className="truncate text-[11px] font-semibold text-[var(--color-muted)]">
                              {message.threadTitle}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-2">
                          <p className="flex-1 break-words">
                            {message.content}
                          </p>
                          <div className="relative">
                            <button
                              type="button"
                              className={`ml-2 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-2xl text-[var(--color-muted)] transition-all duration-ui ease-ui hover:bg-white/70 hover:text-[var(--color-text)] dark:hover:bg-neutral-700/80 ${
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
                                className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full z-50 mt-0.5 w-48 rounded-2xl glass-frosted p-2 text-sm text-[var(--color-text)]`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setContent(`@${message.sender?.firstName || 'Usuario'} `);
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-sena-green/10"
                                >
                                  <Reply className="h-4 w-4 text-sena-green" /> Responder
                                </button>
                                {message.threadTitle ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingThreadRootId(message.id);
                                      setReplyingThreadTitle(message.threadTitle || 'Hilo');
                                      setOpenMessageMenuId(null);
                                      setExpandedThreads((prev) => ({ ...prev, [message.id]: true }));
                                    }}
                                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-sena-green/10"
                                  >
                                    <MessageCircle className="h-4 w-4 text-sena-green" /> Responder en el hilo
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (message.content) {
                                      void navigator.clipboard.writeText(message.content);
                                    }
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-sena-green/10"
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
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-sena-green/10"
                                >
                                  <Forward className="h-4 w-4 text-sena-green" /> Reenviar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    pinMessageMutation.mutate(message.id);
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-sena-green/10"
                                >
                                  <Pin className="h-4 w-4 text-sena-green" /> {message.isPinned ? 'Desfijar' : 'Fijar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    starMessageMutation.mutate(message.id);
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-sena-green/10"
                                >
                                  <Star className={`h-4 w-4 ${message.viewerStarred ? 'fill-amber-400 text-amber-500' : 'text-sena-green'}`} /> {message.viewerStarred ? 'Quitar destacado' : 'Destacar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReportTarget(message);
                                    setReportReason('Contenido inapropiado');
                                    setReportDetails('');
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-rose-50/80"
                                >
                                  <Flag className="h-4 w-4 text-rose-500" /> Reportar
                                </button>
                                {isOwn && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget(message);
                                      setOpenMessageMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui ease-ui hover:bg-rose-50/80"
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500" /> Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`mt-1 flex items-center text-[10px] text-[var(--color-muted)] ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                          {message.isPinned && isOwn && (
                            <Pin className="h-3 w-3 text-sena-green flex-shrink-0" aria-label="Mensaje fijado" />
                          )}
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      {message.threadTitle ? (
                        <div className="mt-2 w-full max-w-[min(100%,420px)]">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedThreads((prev) => ({
                                ...prev,
                                [message.id]: !prev[message.id]
                              }))
                            }
                            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/35 bg-white/55 px-3 py-2 text-left text-[11px] font-medium text-[var(--color-text)] shadow-sm transition-all duration-ui ease-ui hover:bg-white/75 dark:border-white/10 dark:bg-neutral-800/60 dark:hover:bg-neutral-800/85"
                          >
                            <span className="flex items-center gap-2 text-[var(--color-muted)]">
                              <MessageCircle className="h-3.5 w-3.5 text-sena-green" />
                              {(repliesByRoot.get(message.id) ?? []).length}{' '}
                              {(repliesByRoot.get(message.id) ?? []).length === 1 ? 'respuesta' : 'respuestas'}
                            </span>
                            {expandedThreads[message.id] ? (
                              <ChevronUp className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                            )}
                          </button>
                          <AnimatePresence initial={false}>
                            {expandedThreads[message.id] ? (
                              <motion.div
                                key={`thread-${message.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={pollBarTransition}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 space-y-2 rounded-2xl border border-white/25 bg-white/40 px-2.5 py-2 dark:border-white/10 dark:bg-neutral-900/40">
                                  {(repliesByRoot.get(message.id) ?? []).length === 0 ? (
                                    <p className="px-1 py-2 text-center text-[11px] text-[var(--color-muted)]">
                                      Aún no hay respuestas. ¡Sé el primero!
                                    </p>
                                  ) : (
                                    (repliesByRoot.get(message.id) ?? []).map((reply) => {
                                      const rInitials = `${reply.sender?.firstName?.[0] ?? ''}${
                                        reply.sender?.lastName?.[0] ?? ''
                                      }`.trim() || 'U';
                                      return (
                                        <div
                                          key={reply.id}
                                          className="flex gap-2 rounded-xl bg-white/70 px-2 py-1.5 dark:bg-neutral-800/70"
                                        >
                                          {reply.sender?.avatarUrl ? (
                                            <img
                                              src={resolveAssetUrl(reply.sender.avatarUrl) ?? ''}
                                              alt=""
                                              className="h-7 w-7 shrink-0 rounded-lg object-cover"
                                            />
                                          ) : (
                                            <div
                                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-semibold ${getAvatarColorClasses(
                                                reply.sender?.id
                                              )}`}
                                            >
                                              {rInitials.slice(0, 2)}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold text-[var(--color-text)]">
                                              {reply.sender?.firstName} {reply.sender?.lastName}
                                            </p>
                                            <p className="text-[11px] leading-snug text-[var(--color-text)] break-words">
                                              {reply.content}
                                            </p>
                                            <p className="mt-0.5 text-[9px] text-[var(--color-muted)]">
                                              {new Date(reply.createdAt).toLocaleTimeString('es-CO', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingThreadRootId(message.id);
                                      setReplyingThreadTitle(message.threadTitle || 'Hilo');
                                    }}
                                    className="mt-1 w-full rounded-xl bg-sena-green/12 py-2 text-center text-[11px] font-semibold text-sena-green transition-all duration-ui ease-ui hover:bg-sena-green/18"
                                  >
                                    Responder en el hilo
                                  </button>
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      ) : null}
                      </>
                    )}
                    {message.attachmentUrl && (
                      <div className="mt-2 rounded-2xl overflow-hidden shadow-md border border-white/30 dark:border-white/10">
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
          {replyingThreadRootId ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-sena-green/35 bg-sena-green/10 px-3 py-2 text-[11px] text-sena-green dark:bg-sena-green/15">
              <span className="min-w-0 truncate">
                En el hilo: <span className="font-semibold">{replyingThreadTitle}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyingThreadRootId(null);
                  setReplyingThreadTitle('');
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-sena-green transition-all duration-ui ease-ui hover:bg-sena-green/20"
                aria-label="Dejar de responder en el hilo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          <form
            onSubmit={handleSubmit}
            className="w-full h-16 rounded-2xl border border-white/50 dark:border-white/15 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl px-4 shadow-[0_4px_20px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-ui ease-ui focus-within:border-sena-green/40 dark:focus-within:border-sena-green/30 focus-within:shadow-[0_4px_24px_rgba(57,169,0,0.15)] dark:focus-within:shadow-[0_4px_24px_rgba(57,169,0,0.25)]"
          >
            <div className="relative flex h-full items-center gap-3">
              <div className="relative" ref={plusMenuRef}>
                <button
                  type="button"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-neutral-800/70 text-[var(--color-muted)] transition-all duration-ui ease-ui hover:bg-white/90 dark:hover:bg-neutral-700/90 hover:text-sena-green hover:scale-105"
                  onClick={() => setPlusMenuOpen((prev) => !prev)}
                  aria-label="Más opciones"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {plusMenuOpen && (
                    <motion.div
                      key="channel-plus-menu"
                      role="menu"
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={UI_MENU_TRANSITION}
                      className="absolute bottom-full mb-2 left-0 z-30 w-52 origin-bottom-left rounded-2xl border border-white/40 bg-white/98 p-2 text-[12px] text-[var(--color-text)] shadow-[0_18px_40px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-neutral-900/98"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-1.5 transition-colors duration-ui ease-ui hover:bg-slate-50 dark:hover:bg-neutral-800/80"
                        onClick={handleAttachFileClick}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-slate-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                          📎
                        </span>
                        <span className="text-left">Adjuntar archivo</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="mt-1 flex w-full items-center gap-2 rounded-2xl px-2.5 py-1.5 transition-colors duration-ui ease-ui hover:bg-slate-50 dark:hover:bg-neutral-800/80"
                        onClick={openPollDialog}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-slate-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                          📊
                        </span>
                        <span className="text-left">Crear encuesta</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="mt-1 flex w-full items-center gap-2 rounded-2xl px-2.5 py-1.5 transition-colors duration-ui ease-ui hover:bg-slate-50 dark:hover:bg-neutral-800/80"
                        onClick={openThreadDialog}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-slate-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                          🧵
                        </span>
                        <span className="text-left">Crear hilo</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-neutral-800/70 text-[var(--color-muted)] transition-all duration-ui ease-ui hover:bg-white/90 dark:hover:bg-neutral-700/90 hover:text-sena-green hover:scale-105"
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                >
                  <Smile className="h-4 w-4" />
                </button>
                {emojiPickerOpen && (
                  <div className="absolute bottom-full mb-2 right-0 z-50">
                    <EmojiPicker
                      ref={emojiPickerRef}
                      compactBounds
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
                className="h-11 w-11 rounded-2xl px-0 bg-gradient-to-br from-sena-green to-emerald-600 hover:from-sena-green/95 hover:to-emerald-600/95 shadow-[0_4px_12px_rgba(57,169,0,0.3)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.4)] transition-all duration-ui ease-ui disabled:opacity-50 disabled:cursor-not-allowed"
                loading={sending}
                disabled={!content.trim()}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel lateral información del canal (misma apariencia que Chats) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {infoOpen && (
              <>
                <motion.div
                  key="channel-info-backdrop"
                  role="presentation"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={UI_OVERLAY_TRANSITION}
                  className="fixed inset-0 z-[10050] bg-black/45 backdrop-blur-[2px] dark:bg-black/55"
                  onClick={() => setInfoOpen(false)}
                />
                <motion.aside
                  key="channel-info-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="channel-info-panel-title"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={UI_MOTION_SLIDE_TWEEN}
                  className="fixed right-0 top-0 z-[10051] flex h-full w-full max-w-[min(100vw,420px)] flex-col border-l border-neutral-200/80 bg-[#f0f2f5] shadow-[-12px_0_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1a1d21] dark:shadow-[-12px_0_48px_rgba(0,0,0,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200/90 bg-white/90 px-3 py-3.5 dark:border-white/10 dark:bg-[#1e2125]/95">
                    <button
                      type="button"
                      onClick={() => setInfoOpen(false)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors duration-ui ease-ui hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                      aria-label="Cerrar panel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2
                      id="channel-info-panel-title"
                      className="flex-1 text-center text-[15px] font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                      Info. del canal
                    </h2>
                    <span className="h-10 w-10 shrink-0" aria-hidden />
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/20 to-emerald-500/15 shadow-md ring-2 ring-white/50 dark:ring-white/10">
                        <Hash className="h-16 w-16 text-sena-green" />
                      </span>
                      <p className="mt-5 max-w-[280px] text-xl font-semibold leading-snug text-neutral-900 dark:text-white">
                        #{channelName}
                      </p>
                      <p className="mt-1.5 max-w-[280px] text-sm text-neutral-500 line-clamp-4 dark:text-neutral-400">
                        {channelDescription?.trim() || 'Canal de la comunidad'}
                      </p>
                    </div>

                    <p className="mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      Información
                    </p>
                    <div className="mt-2 divide-y divide-neutral-200/90 rounded-xl border border-neutral-200/80 bg-white/90 text-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#252a31]/90">
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-neutral-500 dark:text-neutral-400">Tipo</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                          <Hash className="h-4 w-4 text-sena-green" />
                          Canal
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-neutral-500 dark:text-neutral-400">Mensajes</span>
                        <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                          {messages.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-neutral-500 dark:text-neutral-400">Miembros activos</span>
                        <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                          {activeMembers.length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 divide-y divide-neutral-200/90 overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90 dark:divide-white/10 dark:border-white/10 dark:bg-[#252a31]/90">
                      <button
                        type="button"
                        onClick={() => {
                          setInfoOpen(false);
                          setMembersOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-neutral-800 transition-colors duration-ui ease-ui hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-white/5"
                      >
                        <Users className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
                        Ver miembros del canal
                      </button>
                    </div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Panel lateral miembros del canal (misma apariencia que info del canal) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {membersOpen && (
              <>
                <motion.div
                  key="channel-members-backdrop"
                  role="presentation"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={UI_OVERLAY_TRANSITION}
                  className="fixed inset-0 z-[10050] bg-black/45 backdrop-blur-[2px] dark:bg-black/55"
                  onClick={() => setMembersOpen(false)}
                />
                <motion.aside
                  key="channel-members-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="channel-members-panel-title"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={UI_MOTION_SLIDE_TWEEN}
                  className="fixed right-0 top-0 z-[10051] flex h-full w-full max-w-[min(100vw,420px)] flex-col border-l border-neutral-200/80 bg-[#f0f2f5] shadow-[-12px_0_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1a1d21] dark:shadow-[-12px_0_48px_rgba(0,0,0,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200/90 bg-white/90 px-3 py-3.5 dark:border-white/10 dark:bg-[#1e2125]/95">
                    <button
                      type="button"
                      onClick={() => setMembersOpen(false)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors duration-ui ease-ui hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                      aria-label="Cerrar panel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2
                      id="channel-members-panel-title"
                      className="flex-1 text-center text-[15px] font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                      Miembros del canal
                    </h2>
                    <span className="h-10 w-10 shrink-0" aria-hidden />
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/20 to-emerald-500/15 shadow-md ring-2 ring-white/50 dark:ring-white/10">
                        <Users className="h-16 w-16 text-sena-green" />
                      </span>
                      <p className="mt-5 max-w-[280px] text-xl font-semibold leading-snug text-neutral-900 dark:text-white">
                        #{channelName}
                      </p>
                      <p className="mt-1.5 max-w-[280px] text-sm text-neutral-500 dark:text-neutral-400">
                        {activeMembers.length === 0
                          ? 'Nadie ha escrito aún en este canal'
                          : `${activeMembers.length} ${activeMembers.length === 1 ? 'miembro activo' : 'miembros activos'}`}
                      </p>
                    </div>

                    <p className="mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      Participantes
                    </p>
                    {activeMembers.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-[#252a31]/90 dark:text-neutral-400">
                        Aún no hay miembros activos en este canal.
                      </div>
                    ) : (
                      <div className="mt-2 divide-y divide-neutral-200/90 overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90 dark:divide-white/10 dark:border-white/10 dark:bg-[#252a31]/90">
                        {activeMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 px-4 py-3.5 text-left text-sm text-neutral-800 dark:text-neutral-100"
                          >
                            {member.avatarUrl ? (
                              <img
                                src={resolveAssetUrl(member.avatarUrl) ?? ''}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/50 dark:ring-white/10"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/25 to-emerald-500/15 text-sm font-semibold text-sena-green ring-2 ring-white/50 dark:ring-white/10">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Panel lateral mensajes fijados (misma apariencia que info / miembros) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {pinnedMenuOpen && (
              <>
                <motion.div
                  key="channel-pinned-backdrop"
                  role="presentation"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={UI_OVERLAY_TRANSITION}
                  className="fixed inset-0 z-[10050] bg-black/45 backdrop-blur-[2px] dark:bg-black/55"
                  onClick={() => setPinnedMenuOpen(false)}
                />
                <motion.aside
                  key="channel-pinned-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="channel-pinned-panel-title"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={UI_MOTION_SLIDE_TWEEN}
                  className="fixed right-0 top-0 z-[10051] flex h-full w-full max-w-[min(100vw,420px)] flex-col border-l border-neutral-200/80 bg-[#f0f2f5] shadow-[-12px_0_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1a1d21] dark:shadow-[-12px_0_48px_rgba(0,0,0,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200/90 bg-white/90 px-3 py-3.5 dark:border-white/10 dark:bg-[#1e2125]/95">
                    <button
                      type="button"
                      onClick={() => setPinnedMenuOpen(false)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors duration-ui ease-ui hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                      aria-label="Cerrar panel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2
                      id="channel-pinned-panel-title"
                      className="flex-1 text-center text-[15px] font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                      Mensajes fijados
                    </h2>
                    <span className="h-10 w-10 shrink-0" aria-hidden />
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/20 to-emerald-500/15 shadow-md ring-2 ring-white/50 dark:ring-white/10">
                        <Pin className="h-16 w-16 text-sena-green" />
                      </span>
                      <p className="mt-5 max-w-[280px] text-xl font-semibold leading-snug text-neutral-900 dark:text-white">
                        #{channelName}
                      </p>
                      <p className="mt-1.5 max-w-[280px] text-sm text-neutral-500 dark:text-neutral-400">
                        {pinnedMessages.length === 0
                          ? 'Ningún mensaje fijado por ahora'
                          : `${pinnedMessages.length} ${pinnedMessages.length === 1 ? 'mensaje fijado' : 'mensajes fijados'}`}
                      </p>
                    </div>

                    <p className="mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      Lista
                    </p>
                    {pinnedMessages.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-[#252a31]/90 dark:text-neutral-400">
                        Aún no hay mensajes fijados en este canal.
                      </div>
                    ) : (
                      <div className="mt-2 divide-y divide-neutral-200/90 overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90 dark:divide-white/10 dark:border-white/10 dark:bg-[#252a31]/90">
                        {pinnedMessages.map((message) => {
                          const poll = parsePollContent(message.content);
                          const preview = poll
                            ? `Encuesta: ${poll.title}`
                            : message.threadTitle
                              ? `Hilo: ${message.threadTitle}`
                              : message.content?.trim() ||
                                (message.attachmentUrl ? 'Archivo adjunto' : 'Sin texto');
                          const sender = message.sender
                            ? `${message.sender.firstName} ${message.sender.lastName}`.trim()
                            : 'Usuario';
                          return (
                            <div
                              key={message.id}
                              className="px-4 py-3.5 text-left text-sm text-neutral-800 dark:text-neutral-100"
                            >
                              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{sender}</p>
                              <p className="mt-1 line-clamp-4 whitespace-pre-wrap break-words text-neutral-800 dark:text-neutral-200">
                                {preview}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      <GlassDialog
        open={pollDialogOpen}
        onClose={() => (!pollSubmitting ? setPollDialogOpen(false) : undefined)}
        size="md"
        preventCloseOnBackdrop={pollSubmitting}
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Nueva encuesta</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Los votos se guardan en el servidor y se actualizan en tiempo casi real para todos.
            </p>
          </div>
          <div>
            <label htmlFor="poll-question" className="text-xs font-semibold text-[var(--color-muted)]">
              Pregunta
            </label>
            <input
              id="poll-question"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              placeholder="¿Qué quieres preguntar al canal?"
              className="mt-1 w-full rounded-2xl border border-white/30 bg-white/80 px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-ui ease-ui focus:border-sena-green/50 dark:border-white/10 dark:bg-neutral-900/80"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-2">Opciones (mínimo 2, máximo 6)</p>
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={`poll-opt-${i}`} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Opción ${i + 1}`}
                    className="min-w-0 flex-1 rounded-2xl border border-white/30 bg-white/80 px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-all duration-ui ease-ui focus:border-sena-green/50 dark:border-white/10 dark:bg-neutral-900/80"
                  />
                  {pollOptions.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--color-muted)] transition-all duration-ui ease-ui hover:bg-rose-500/10 hover:text-rose-600"
                      aria-label="Quitar opción"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {pollOptions.length < 6 ? (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="mt-2 text-xs font-semibold text-sena-green transition-colors duration-ui ease-ui hover:underline"
              >
                + Añadir opción
              </button>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPollDialogOpen(false)}
              disabled={pollSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={pollSubmitting}
              disabled={!pollTitle.trim() || pollOptions.filter((o) => o.trim()).length < 2}
            >
              Publicar encuesta
            </Button>
          </div>
        </form>
      </GlassDialog>

      <GlassDialog
        open={threadDialogOpen}
        onClose={() => (!threadSubmitting ? setThreadDialogOpen(false) : undefined)}
        size="md"
        preventCloseOnBackdrop={threadSubmitting}
      >
        <form onSubmit={handleCreateThread} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Nuevo hilo</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Publica un tema y las respuestas se agrupan aquí. El canal sigue ordenado por mensajes raíz.
            </p>
          </div>
          <div>
            <label htmlFor="thread-title" className="text-xs font-semibold text-[var(--color-muted)]">
              Título del hilo (opcional)
            </label>
            <input
              id="thread-title"
              value={threadFormTitle}
              onChange={(e) => setThreadFormTitle(e.target.value)}
              placeholder="Ej. Ideas para el proyecto"
              className="mt-1 w-full rounded-2xl border border-white/30 bg-white/80 px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-ui ease-ui focus:border-sena-green/50 dark:border-white/10 dark:bg-neutral-900/80"
            />
          </div>
          <div>
            <label htmlFor="thread-body" className="text-xs font-semibold text-[var(--color-muted)]">
              Primer mensaje
            </label>
            <textarea
              id="thread-body"
              value={threadFormBody}
              onChange={(e) => setThreadFormBody(e.target.value)}
              placeholder="Escribe el primer mensaje del hilo…"
              rows={4}
              className="mt-1 w-full resize-none rounded-2xl border border-white/30 bg-white/80 px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-ui ease-ui focus:border-sena-green/50 dark:border-white/10 dark:bg-neutral-900/80"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setThreadDialogOpen(false)}
              disabled={threadSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={threadSubmitting} disabled={!threadFormBody.trim()}>
              Publicar hilo
            </Button>
          </div>
        </form>
      </GlassDialog>

      {/* Diálogo reportar mensaje */}
      <GlassDialog
        open={!!reportTarget}
        onClose={() => (!reportMessageMutation.isPending ? setReportTarget(null) : undefined)}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Reportar mensaje</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Indica el motivo del reporte. Un moderador revisará el mensaje.
            </p>
            {reportTarget && (
              <div className="mt-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 px-3 py-2 text-sm text-[var(--color-text)] border border-white/30 dark:border-white/10">
                {reportTarget.content ? (
                  <p className="line-clamp-3">{reportTarget.content}</p>
                ) : (
                  <p className="text-[var(--color-muted)] italic">Mensaje con adjunto</p>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-2">Motivo</p>
            <div className="flex flex-wrap gap-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReportReason(reason)}
                  className={`rounded-2xl px-3 py-1.5 text-xs transition-all duration-ui ease-ui ${
                    reportReason === reason
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-400/40'
                      : 'bg-white/60 dark:bg-neutral-800/60 text-[var(--color-text)] hover:bg-white/80 dark:hover:bg-neutral-700/80'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Detalles adicionales (opcional)</p>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Explica brevemente..."
              rows={2}
              className="w-full rounded-2xl border border-white/30 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none transition-colors duration-ui ease-ui focus:border-sena-green/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReportTarget(null)}
              disabled={reportMessageMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-rose-500/90 hover:bg-rose-600/90 text-white"
              onClick={() =>
                reportTarget &&
                reportMessageMutation.mutate({ messageId: reportTarget.id, reason: reportReason, details: reportDetails })
              }
              loading={reportMessageMutation.isPending}
            >
              Enviar reporte
            </Button>
          </div>
        </div>
      </GlassDialog>

      {/* Diálogo confirmar eliminar mensaje */}
      <GlassDialog
        open={!!deleteTarget}
        onClose={() => (!deleteMessageMutation.isPending ? setDeleteTarget(null) : undefined)}
        size="sm"
        preventCloseOnBackdrop={deleteMessageMutation.isPending}
        overlayClassName="delete-post-overlay-warning"
        contentClassName="glass-dialog-delete"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Eliminar mensaje</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              ¿Seguro que quieres eliminar este mensaje? Esta acción no se puede deshacer.
            </p>
            {deleteTarget && (
              <div className="mt-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 px-3 py-2 text-sm text-[var(--color-text)] border border-white/30 dark:border-white/10">
                {deleteTarget.content ? (
                  <p className="line-clamp-3">{deleteTarget.content}</p>
                ) : (
                  <p className="text-[var(--color-muted)] italic">Mensaje con adjunto</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMessageMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="!bg-red-500 !text-white !border-red-500/60 !shadow-[0_2px_8px_rgba(0,0,0,0.14)] hover:!bg-red-600 hover:!shadow-[0_4px_14px_rgba(0,0,0,0.2)] focus:!ring-red-400/60"
              onClick={() => deleteTarget && deleteMessageMutation.mutate(deleteTarget.id)}
              loading={deleteMessageMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </GlassDialog>

    </section>
  );
};
