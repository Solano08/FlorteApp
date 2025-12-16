import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import { Users, Hash, Send, MoreVertical, CheckCircle2, Plus, Smile } from 'lucide-react';
import { ChannelMessage } from '../../types/channel';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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

  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    <section className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-white/40 via-white/20 to-white/40 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/40 backdrop-blur-xl">
      {/* Header del canal */}
      <header className="flex items-center gap-3 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 backdrop-blur-xl px-4 py-3 shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
        <Hash className="h-5 w-5 text-[var(--color-muted)]" />
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{channelName}</h2>
          {channelDescription && (
            <p className="text-[11px] text-[var(--color-muted)]">{channelDescription}</p>
          )}
        </div>
      </header>

      {/* Área de mensajes + input inferior */}
      <div className="flex flex-1 min-h-0 flex-col">
        {/* Mensajes */}
        <div className="flex-1 min-h-0 px-4 py-3">
          <div className="flex h-full flex-col items-end space-y-4 overflow-y-auto pr-2">
          {isLoadingMessages ? (
            <p className="text-[13px] text-[var(--color-muted)]">Cargando mensajes...</p>
          ) : messages.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)]">
              No hay mensajes aún. Sé el primero en escribir.
            </p>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;

              return (
                <div
                  key={message.id}
                  className={`group flex gap-3 px-2 py-1.5 rounded-lg transition-colors duration-150 ${
                    isOwn
                      ? 'ml-auto max-w-[80%] flex-row-reverse bg-gradient-to-r from-sena-green/15 to-emerald-500/15 dark:from-sena-green/25 dark:to-emerald-500/25'
                      : 'hover:bg-white/30 dark:hover:bg-slate-800/30'
                  }`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {message.sender?.avatarUrl ? (
                    <img
                      src={resolveAssetUrl(message.sender.avatarUrl) ?? ''}
                      alt={message.sender.firstName}
                      className="h-9 w-9 rounded-full ring-2 ring-white/20 dark:ring-white/10 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/20 to-emerald-500/20 text-sena-green ring-2 ring-white/20 dark:ring-white/10 shadow-sm">
                      <Users className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 ${isOwn ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`flex items-center gap-2 mb-0.5 ${
                        isOwn ? 'justify-end flex-row-reverse' : ''
                      }`}
                    >
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {message.sender?.firstName} {message.sender?.lastName}
                        {isOwn && (
                          <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-normal text-sena-green">
                            <CheckCircle2 className="h-3 w-3" />
                            Tú
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)]">
                        {new Date(message.createdAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <p
                      className={`inline-block rounded-2xl px-3 py-1.5 text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-gradient-to-r from-sena-green/80 to-emerald-500/80 text-white shadow-sm'
                          : 'bg-white/80 dark:bg-slate-800/80 text-[var(--color-text)] shadow-sm'
                      }`}
                    >
                      {message.content}
                    </p>
                    {message.attachmentUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden shadow-md">
                        <img
                          src={resolveAssetUrl(message.attachmentUrl) ?? ''}
                          alt="Adjunto"
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  {hoveredMessageId === message.id && (
                    <button
                      type="button"
                      className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/80 text-[var(--color-muted)] hover:text-[var(--color-text)] shadow-sm"
                      onClick={() => {
                        if (message.content) {
                          void navigator.clipboard.writeText(message.content);
                        }
                      }}
                      aria-label="Opciones del mensaje"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input de mensaje pegado abajo y ocupando todo el ancho */}
        <div className="px-4 pb-4">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-3xl border border-white/40 bg-gradient-to-r from-white/90 via-white/75 to-white/90 px-3 py-2.5 shadow-[0_-1px_0_0_rgba(255,255,255,0.18)_inset,0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-gradient-to-r dark:from-slate-900/85 dark:via-slate-900/75 dark:to-slate-900/85 dark:shadow-[0_-1px_0_0_rgba(15,23,42,0.9)_inset,0_22px_55px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[var(--color-muted)] shadow-sm transition-all duration-150 hover:scale-110 hover:bg-white hover:text-sena-green dark:bg-slate-800/80 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
              <Input
                placeholder={`Enviar mensaje a #${channelName}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 border-none bg-transparent px-0 py-1 text-sm shadow-none focus:ring-0 focus:outline-none"
              />
              <button
                type="button"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[var(--color-muted)] shadow-sm transition-all duration-150 hover:scale-110 hover:bg-white hover:text-sena-green dark:bg-slate-800/80 dark:hover:bg-slate-800"
              >
                <Smile className="h-4 w-4" />
              </button>
              <Button
                type="submit"
                size="sm"
                className="h-9 w-9 rounded-2xl px-0 bg-gradient-to-r from-sena-green to-emerald-600 hover:from-sena-green/95 hover:to-emerald-600/95 shadow-[0_4px_12px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.45)]"
                loading={sending}
                disabled={!content.trim()}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
