import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Hash, Send, MoreVertical, Plus, Smile, Info, Users, Pin } from 'lucide-react';
import { ChannelMessage } from '../../types/channel';
import { Button } from '../ui/Button';
import { GlassDialog } from '../ui/GlassDialog';
import { resolveAssetUrl } from '../../utils/media';
import { useAuthContext } from '../../contexts/AuthContext';

interface ChannelChatProps {
  channelName: string;
  channelDescription?: string | null;
  messages: ChannelMessage[];
  isLoadingMessages?: boolean;
  onSendMessage: (content: string) => Promise<void> | void;
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [pinnedMenuOpen, setPinnedMenuOpen] = useState(false);

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

  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      await onSendMessage(content.trim());
      setContent('');
    } finally {
      setSending(false);
    }
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
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-white/30 bg-white/95 p-3 text-sm text-[var(--color-text)] shadow-[0_18px_40px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-900/95">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Mensajes fijados
                  </span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[var(--color-muted)] hover:text-sena-green dark:bg-slate-800/80"
                    onClick={() => setPinnedMenuOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Aún no hay mensajes fijados en este canal.
                </p>
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
                    <div className="relative inline-flex max-w-full flex-col rounded-2xl bg-white/95 px-3.5 py-2.5 text-[13px] leading-relaxed tracking-tight text-[var(--color-text)] shadow-sm ring-1 ring-white/40 dark:bg-slate-800/95 dark:ring-white/10">
                      <div className="flex items-start gap-2">
                        <p className="flex-1 break-words">
                          {message.content}
                        </p>
                        <button
                          type="button"
                          className={`ml-2 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-all duration-150 hover:bg-white/70 hover:text-[var(--color-text)] dark:hover:bg-slate-700/80 ${
                            hoveredMessageId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          onClick={() => {
                            if (message.content) {
                              void navigator.clipboard.writeText(message.content);
                            }
                          }}
                          aria-label="Opciones del mensaje"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
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
            <div className="flex h-full items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 text-[var(--color-muted)] transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:text-sena-green hover:scale-105"
              >
                <Plus className="h-4 w-4" />
              </button>
              <input
                placeholder={`Escribe un mensaje en #${channelName}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 h-full border-none bg-transparent px-0 text-sm leading-snug placeholder:text-[var(--color-muted)] text-[var(--color-text)] outline-none focus:ring-0 focus:outline-none"
              />
              <button
                type="button"
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 text-[var(--color-muted)] transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:text-sena-green hover:scale-105"
              >
                <Smile className="h-4 w-4" />
              </button>
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
            className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[2px]"
            onClick={() => setMembersOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-72 flex-col border-l border-white/20 bg-white/96 shadow-[0_0_40px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Miembros del canal</p>
                <p className="text-[11px] text-[var(--color-muted)]">
                  {activeMembers.length} {activeMembers.length === 1 ? 'miembro' : 'miembros'}
                </p>
              </div>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[var(--color-muted)] hover:text-sena-green dark:bg-slate-800/80"
                onClick={() => setMembersOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {activeMembers.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  Aún no hay miembros activos en este canal.
                </p>
              ) : (
                activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-xl bg-white/90 px-2.5 py-2 text-sm text-[var(--color-text)] shadow-sm ring-1 ring-white/40 dark:bg-slate-900/90 dark:ring-white/10"
                  >
                    {member.avatarUrl ? (
                      <img
                        src={resolveAssetUrl(member.avatarUrl) ?? ''}
                        alt={member.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sena-green/15 text-[11px] font-semibold text-sena-green">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{member.name}</span>
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
