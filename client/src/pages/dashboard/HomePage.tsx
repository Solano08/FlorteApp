import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { GlassDialog } from '../../components/ui/GlassDialog';
import classNames from 'classnames';
import { chatService } from '../../services/chatService';
import { groupService } from '../../services/groupService';
import { projectService } from '../../services/projectService';
import { libraryService } from '../../services/libraryService';
import { feedService } from '../../services/feedService';
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Image,
  Paperclip,
  Smile,
  Video,
  Plus,
  X
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Chat } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { FeedComment, FeedPostAggregate, ReactionType } from '../../types/feed';

interface ChatWindowProps {
  chat: Chat;
  index: number;
  onClose: (chatId: string) => void;
}

const stories = [
  { id: 'create', name: 'Tu historia', avatar: '', isLive: false },
  { id: '1', name: 'Laboratorio UX', avatar: 'https://i.pravatar.cc/100?img=12', isLive: true },
  { id: '2', name: 'Dev Backend', avatar: 'https://i.pravatar.cc/100?img=25', isLive: false },
  { id: '3', name: 'Talento Verde', avatar: 'https://i.pravatar.cc/100?img=33', isLive: true },
  { id: '4', name: 'MakerLab', avatar: 'https://i.pravatar.cc/100?img=45', isLive: false },
  { id: '5', name: 'Frontend Squad', avatar: 'https://i.pravatar.cc/100?img=18', isLive: false },
  { id: '6', name: 'AI Hub', avatar: 'https://i.pravatar.cc/100?img=52', isLive: true }
];

const composerIcons = [
  { icon: Image, label: 'Imagen' },
  { icon: Video, label: 'Video' },
  { icon: Paperclip, label: 'Adjuntar' },
  { icon: Smile, label: 'Reacciones' }
];

export const HomePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerMediaUrl, setComposerMediaUrl] = useState('');
  const [composerTags, setComposerTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsCache, setCommentsCache] = useState<Record<string, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [shareTarget, setShareTarget] = useState<FeedPostAggregate | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const mediaUrlInputRef = useRef<HTMLInputElement | null>(null);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: chatService.listChats
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups', 'me'],
    queryFn: groupService.listMyGroups
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'me'],
    queryFn: projectService.listMyProjects
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['library', 'latest'],
    queryFn: libraryService.listResources
  });

  const feedQueryKey = ['feed', 'posts'] as const;
  const { data: feedPosts = [], isFetching: isLoadingFeed } = useQuery({
    queryKey: feedQueryKey,
    queryFn: () => feedService.listPosts()
  });

  const friendSuggestions = groups.slice(0, 3);
  const learningHighlights = projects.slice(0, 3);

  const updatePostInCache = (postId: string, updater: (post: FeedPostAggregate) => FeedPostAggregate) => {
    queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) => {
      if (!existing) return existing;
      return existing.map((post) => (post.id === postId ? updater(post) : post));
    });
  };

  const handleOpenChat = (chatId: string) => {
    setOpenChatIds((prev) => {
      if (prev.includes(chatId)) return prev;
      const next = [...prev, chatId];
      return next.slice(-3);
    });
    setMessagesOpen(false);
  };

  const handleCloseChat = (chatId: string) => {
    setOpenChatIds((prev) => prev.filter((id) => id !== chatId));
  };

  const createPostMutation = useMutation({
    mutationFn: (payload: { content: string; mediaUrl?: string | null; tags?: string[] }) =>
      feedService.createPost(payload),
    onSuccess: (post) => {
      queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) =>
        existing ? [post, ...existing] : [post]
      );
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
      setComposerContent('');
      setComposerMediaUrl('');
      setComposerTags([]);
      setTagInput('');
    },
    onError: (error) => {
      console.error('No fue posible publicar el contenido', error);
    }
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) =>
      feedService.react(postId, reactionType),
    onSuccess: (metrics, { postId }) => {
      updatePostInCache(postId, (post) => ({
        ...post,
        reactionCount: metrics.reactionCount,
        commentCount: metrics.commentCount,
        shareCount: metrics.shareCount,
        viewerReaction: metrics.viewerReaction,
        isSaved: metrics.isSaved
      }));
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible actualizar la reaccion', error);
    }
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) => feedService.toggleSave(postId),
    onSuccess: (metrics, postId) => {
      updatePostInCache(postId, (post) => ({
        ...post,
        reactionCount: metrics.reactionCount,
        commentCount: metrics.commentCount,
        shareCount: metrics.shareCount,
        viewerReaction: metrics.viewerReaction,
        isSaved: metrics.isSaved
      }));
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible actualizar el guardado', error);
    }
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => feedService.comment(postId, content),
    onSuccess: (data, { postId }) => {
      updatePostInCache(postId, (post) => {
        const merged = [...post.latestComments.filter((comment) => comment.id !== data.comment.id), data.comment];
        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return {
          ...post,
          reactionCount: data.reactionCount,
          commentCount: data.commentCount,
          shareCount: data.shareCount,
          viewerReaction: data.viewerReaction,
          isSaved: data.isSaved,
          latestComments: merged.slice(-3)
        };
      });
      setCommentsCache((prev) => {
        const existing = prev[postId] ?? [];
        const updated = [...existing.filter((comment) => comment.id !== data.comment.id), data.comment];
        updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return { ...prev, [postId]: updated };
      });
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible enviar el comentario', error);
    }
  });

  const shareMutation = useMutation({
    mutationFn: ({ postId, message }: { postId: string; message?: string }) => feedService.share(postId, message),
    onSuccess: (result, { postId }) => {
      updatePostInCache(postId, (post) => ({
        ...post,
        reactionCount: result.reactionCount,
        commentCount: result.commentCount,
        shareCount: result.shareCount,
        viewerReaction: result.viewerReaction,
        isSaved: result.isSaved
      }));
      setShareTarget(null);
      setShareMessage('');
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible compartir la publicacion', error);
    }
  });

  const handleComposerSubmit = () => {
    const trimmedContent = composerContent.trim();
    if (!trimmedContent || createPostMutation.isPending) return;
    createPostMutation.mutate({
      content: trimmedContent,
      mediaUrl: composerMediaUrl.trim() ? composerMediaUrl.trim() : undefined,
      tags: composerTags
    });
  };

  const handleTagCommit = () => {
    const normalized = tagInput.trim().replace(/\s+/g, '');
    if (!normalized || composerTags.length >= 5) {
      setTagInput('');
      return;
    }
    const formatted = normalized.startsWith('#') ? normalized : `#${normalized}`;
    if (composerTags.includes(formatted)) {
      setTagInput('');
      return;
    }
    setComposerTags((prev) => [...prev, formatted]);
    setTagInput('');
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleTagCommit();
    } else if (event.key === 'Backspace' && tagInput === '' && composerTags.length > 0) {
      event.preventDefault();
      setComposerTags((prev) => prev.slice(0, -1));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setComposerTags((prev) => prev.filter((item) => item !== tag));
  };

  const handleToggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));
    if (nextState && !commentsCache[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const comments = await feedService.listComments(postId);
        comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setCommentsCache((prev) => ({ ...prev, [postId]: comments }));
      } catch {
        // noop - UI can remain with latest comments
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = (postId: string) => {
    const content = (commentInputs[postId] ?? '').trim();
    if (!content) return;
    commentMutation.mutate({ postId, content });
  };

  const handleShareSubmit = () => {
    if (!shareTarget || shareMutation.isPending) return;
    shareMutation.mutate({
      postId: shareTarget.id,
      message: shareMessage.trim() ? shareMessage.trim() : undefined
    });
  };

  const isPublishing = createPostMutation.isPending;
  const isSharing = shareMutation.isPending;

  const handleComposerToolClick = (label: string) => {
    if (label === 'Imagen' || label === 'Video' || label === 'Adjuntar') {
      mediaUrlInputRef.current?.focus();
      return;
    }
    if (label === 'Reacciones') {
      setComposerContent((prev) => (prev ? `${prev} :)` : ':)'));
    }
  };

  const handleOpenShare = (post: FeedPostAggregate) => {
    setShareTarget(post);
    setShareMessage('');
  };

  const handleCloseShareModal = () => {
    if (shareMutation.isPending) return;
    setShareTarget(null);
    setShareMessage('');
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
    if (diffMinutes < 1) return 'Justo ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short'
    });
  };

  const storiesWithAvatars = useMemo(() => {
    return stories.map((story) =>
      story.id === 'create'
        ? {
            ...story,
            avatar: user?.avatarUrl ?? 'https://i.pravatar.cc/100?img=5'
          }
        : story
    );
  }, [user]);

  return (
    <DashboardLayout
      fluid
      contentClassName="px-2 sm:px-6 lg:px-10 xl:px-16"
    >
      <div className="mx-auto grid w-full gap-4 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,260px)] xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)_minmax(0,300px)]">
        <aside className="hidden max-w-[220px] flex-col gap-3 lg:flex">
          <Card className="bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Sugerencias</h3>
              <Sparkles className="h-3.5 w-3.5 text-sena-green" />
            </div>
            <div className="mt-2 space-y-2.5">
              {friendSuggestions.length === 0 && (
                <p className="text-xs text-[var(--color-muted)]">
                  Unete a grupos para recibir recomendaciones personalizadas.
                </p>
              )}
              {friendSuggestions.map((group) => (
                <div
                  key={group.id}
                  className="rounded-xl border border-white/30 bg-white/25 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10"
                >
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate">{group.name}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Grupo - {new Date(group.createdAt ?? '').toLocaleDateString('es-CO')}
                  </p>
                  <Button size="sm" className="mt-2 w-full text-xs">
                    Conectar
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Avances destacados</h3>
              <Sparkles className="h-3.5 w-3.5 text-sena-green" />
            </div>
            <div className="mt-2 space-y-2.5">
              {learningHighlights.length === 0 && (
                <p className="text-xs text-[var(--color-muted)]">
                  Registra tus proyectos para seguir tu progreso.
                </p>
              )}
              {learningHighlights.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-white/30 bg-white/20 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/30 dark:border-white/15 dark:bg-white/10"
                >
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate">{project.title}</p>
                  <p className="text-[11px] text-[var(--color-muted)] capitalize">{project.status}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>



        <section className="mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-5">
          <Card className="overflow-hidden bg-white/30 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)] dark:bg-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text)] sm:text-base">Historias</h2>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 py-1 text-xs text-[var(--color-muted)] hover:text-sena-green"
                onClick={() => setShowStoryModal(true)}
              >
                Crear
              </Button>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {storiesWithAvatars.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => story.id === 'create' && setShowStoryModal(true)}
                  className="flex w-20 flex-col items-center gap-2.5 text-xs"
                >
                  <div
                    className={`relative h-16 w-16 rounded-full p-[3px] ${
                      story.id === 'create'
                        ? 'bg-gradient-to-tr from-sena-green via-sena-light to-emerald-500'
                        : 'bg-sena-green/20'
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full border border-[var(--color-surface)] bg-[var(--color-surface)]">
                      {story.id === 'create' ? (
                        <Plus className="h-5 w-5 text-sena-green" />
                      ) : (
                        <img src={story.avatar} alt={story.name} className="h-full w-full rounded-full object-cover" />
                      )}
                    </div>
                    {story.isLive && (
                      <span className="absolute -bottom-1 right-1 rounded-full bg-red-500 px-1.5 py-[1px] text-[9px] font-semibold text-white">
                        Live
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--color-text)] text-center leading-tight">
                    {story.id === 'create' ? 'Crear historia' : story.name}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-white/30 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)] dark:bg-white/10">
            <div className="flex items-start gap-3">
              <img
                src={user?.avatarUrl ?? 'https://i.pravatar.cc/100?img=60'}
                alt="composer"
                className="h-10 w-10 rounded-full object-cover shadow-[0_10px_18px_rgba(18,55,29,0.14)]"
              />
              <div className="flex-1 space-y-3">
                <TextArea
                  placeholder="Comparte un nuevo avance, recurso o proyecto..."
                  rows={3}
                  value={composerContent}
                  onChange={(event) => setComposerContent(event.target.value)}
                  disabled={isPublishing}
                />

                {composerTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {composerTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs text-[var(--color-text)] transition hover:border-sena-green/60 hover:bg-white/30"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isPublishing}
                      >
                        <span>{tag}</span>
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-3 py-2 text-xs text-[var(--color-text)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30">
                  <input
                    ref={mediaUrlInputRef}
                    type="url"
                    value={composerMediaUrl}
                    onChange={(event) => setComposerMediaUrl(event.target.value)}
                    placeholder="Enlace multimedia (opcional)"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
                    disabled={isPublishing}
                  />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-white/25 bg-white/10 px-3 py-2 text-xs text-[var(--color-text)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={composerTags.length >= 5 ? 'Limite de 5 etiquetas alcanzado' : 'Agrega etiquetas y presiona Enter'}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
                    disabled={composerTags.length >= 5 || isPublishing}
                  />
                  <button
                    type="button"
                    onClick={handleTagCommit}
                    className="text-xs font-semibold text-sena-green transition hover:text-sena-green/80 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={composerTags.length >= 5 || !tagInput.trim() || isPublishing}
                  >
                    Agregar
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {composerIcons.map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/35 text-sena-green transition hover:shadow-[0_0_18px_rgba(57,169,0,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={label}
                        onClick={() => handleComposerToolClick(label)}
                        disabled={isPublishing}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    className="px-3 py-2 text-xs"
                    loading={isPublishing}
                    disabled={isPublishing || !composerContent.trim()}
                    onClick={handleComposerSubmit}
                  >
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {isLoadingFeed && (
            <Card className="bg-white/25 p-4 text-sm text-[var(--color-muted)] backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10">
              Cargando publicaciones...
            </Card>
          )}

          {!isLoadingFeed && feedPosts.length === 0 && (
            <Card className="bg-white/25 p-4 text-sm text-[var(--color-muted)] backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10">
              Aun no hay publicaciones en tu comunidad. Comparte la primera para iniciar la conversacion.
            </Card>
          )}

          {feedPosts.map((post) => {
            const comments = commentsCache[post.id] ?? post.latestComments;
            const isCommentsOpen = !!expandedComments[post.id];
            const isReacting =
              reactionMutation.isPending && reactionMutation.variables?.postId === post.id;
            const isSavingPost = saveMutation.isPending && saveMutation.variables === post.id;
            const isCommenting =
              commentMutation.isPending && commentMutation.variables?.postId === post.id;
            const viewerHasReaction = Boolean(post.viewerReaction);
            const formattedTime = formatTimeAgo(post.createdAt);
            const authorAvatar =
              post.author.avatarUrl ??
              `https://avatars.dicebear.com/api/initials/${encodeURIComponent(post.author.fullName)}.svg`;
            const reactionLabel = post.reactionCount === 1 ? 'reaccion' : 'reacciones';
            const commentLabel = post.commentCount === 1 ? 'comentario' : 'comentarios';
            const shareLabel = post.shareCount === 1 ? 'compartido' : 'compartidos';

            return (
              <Card
                key={post.id}
                className="space-y-4 bg-white/30 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.16)] dark:bg-white/10"
              >
                <div className="flex items-start gap-3">
                  <img src={authorAvatar} alt={post.author.fullName} className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{post.author.fullName}</p>
                    {post.author.headline && (
                      <p className="text-xs text-[var(--color-muted)] truncate">{post.author.headline}</p>
                    )}
                    <p className="text-[11px] text-[var(--color-muted)]">{formattedTime}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden px-2 py-1 text-xs text-[var(--color-muted)] hover:text-sena-green sm:inline-flex"
                    onClick={() => handleOpenShare(post)}
                  >
                    Compartir
                  </Button>
                </div>

                {post.content && (
                  <p className="whitespace-pre-line text-sm text-[var(--color-text)]">{post.content}</p>
                )}

                {post.mediaUrl && (
                  <div className="overflow-hidden rounded-3xl border border-white/15">
                    <img src={post.mediaUrl} alt="Contenido compartido" className="w-full object-cover" />
                  </div>
                )}

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={`${post.id}-${tag}`}
                        className="rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold text-sena-green"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)] sm:text-sm">
                  <div className="flex items-center gap-2 text-[var(--color-text)]">
                    <Heart
                      className={classNames('h-4 w-4', viewerHasReaction ? 'text-sena-green' : 'text-rose-500')}
                    />
                    <span>
                      {post.reactionCount} {reactionLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>
                      {post.commentCount} {commentLabel}
                    </span>
                    <span>
                      {post.shareCount} {shareLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
                  <Button
                    variant="ghost"
                    className={classNames(
                      'justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm',
                      viewerHasReaction && 'text-sena-green'
                    )}
                    onClick={() => reactionMutation.mutate({ postId: post.id, reactionType: 'like' })}
                    disabled={isReacting}
                    loading={isReacting}
                  >
                    <Heart className="h-4 w-4" /> {viewerHasReaction ? 'Reaccionaste' : 'Reaccionar'}
                  </Button>
                  <Button
                    variant="ghost"
                    className={classNames(
                      'justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm',
                      isCommentsOpen && 'text-sena-green'
                    )}
                    onClick={() => handleToggleComments(post.id)}
                  >
                    <MessageCircle className="h-4 w-4" /> Comentar
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm"
                    onClick={() => handleOpenShare(post)}
                  >
                    <Share2 className="h-4 w-4" /> Compartir
                  </Button>
                  <Button
                    variant="ghost"
                    className={classNames(
                      'justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm',
                      post.isSaved && 'text-sena-green'
                    )}
                    onClick={() => saveMutation.mutate(post.id)}
                    disabled={isSavingPost}
                    loading={isSavingPost}
                  >
                    <Bookmark className="h-4 w-4" /> {post.isSaved ? 'Guardado' : 'Guardar'}
                  </Button>
                </div>

                {isCommentsOpen && (
                  <div className="space-y-3 rounded-2xl border border-white/15 bg-white/12 px-3 py-3">
                    {loadingComments[post.id] ? (
                      <p className="text-xs text-[var(--color-muted)]">Cargando comentarios...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-[var(--color-muted)]">
                        Aun no hay comentarios. Se el primero en opinar.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => {
                          const commentAvatar =
                            comment.author.avatarUrl ??
                            `https://avatars.dicebear.com/api/initials/${encodeURIComponent(comment.author.fullName)}.svg`;
                          return (
                            <div key={comment.id} className="flex items-start gap-2">
                              <img
                                src={commentAvatar}
                                alt={comment.author.fullName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="flex-1 rounded-2xl bg-white/18 px-3 py-2 text-xs text-[var(--color-text)]">
                                <p className="font-semibold">{comment.author.fullName}</p>
                                <p className="mt-1 leading-relaxed">{comment.content}</p>
                                <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                  {formatTimeAgo(comment.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <textarea
                        rows={2}
                        value={commentInputs[post.id] ?? ''}
                        onChange={(event) => handleCommentInputChange(post.id, event.target.value)}
                        placeholder="Escribe un comentario..."
                        className="flex-1 resize-none rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                        disabled={isCommenting}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={isCommenting || !(commentInputs[post.id] ?? '').trim()}
                        loading={isCommenting}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </section>



        <aside className="hidden flex-col gap-4 md:flex">
          <Card className="bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Tendencias</h3>
              <Button variant="ghost" size="sm" className="px-2 py-1 text-xs">
                Ver todo
              </Button>
            </div>
            <div className="mt-2 space-y-2.5">
              {resources.slice(0, 5).map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-xl border border-white/30 bg-white/25 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10"
                >
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate">{resource.title}</p>
                  <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wide">
                    {resource.resourceType}
                  </p>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-xs text-[var(--color-muted)]">An no hay recursos recientes.</p>
              )}
            </div>
          </Card>

          <Card className="bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Actividad rpida</h3>
              <Sparkles className="h-3.5 w-3.5 text-sena-green" />
            </div>
            <div className="mt-3 space-y-2 text-xs text-[var(--color-muted)] sm:text-sm">
              <p>Explora proyectos destacados y sigue a tus instructores favoritos.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" className="px-3 py-1.5 text-xs">
                  Explorar proyectos
                </Button>
                <Button size="sm" variant="ghost" className="px-3 py-1.5 text-xs">
                  Invitar amigos
                </Button>
              </div>
            </div>
          </Card>
        </aside>




      
      <Button
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-[0_18px_30px_rgba(57,169,0,0.3)]"
        variant="primary"
        onClick={() => setMessagesOpen((prev) => !prev)}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {messagesOpen && (
          <motion.div
            key="message-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-80"
          >
            <Card padded={false} className="overflow-hidden rounded-3xl border-white/30 bg-white/25 shadow-[0_25px_45px_rgba(18,55,29,0.25)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10">
              <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">Mensajes</p>
                  <p className="text-xs text-[var(--color-muted)]">{chats.length} conversaciones activas</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMessagesOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3">
                {chats.length === 0 && (
                  <p className="text-sm text-[var(--color-muted)]">An no tienes conversaciones activas.</p>
                )}
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleOpenChat(chat.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-sena-green/50 hover:bg-white/30 dark:hover:bg-white/15"
                  >
                    <img
                      src={`https://avatars.dicebear.com/api/initials/${encodeURIComponent(chat.name ?? 'Chat')}.svg`}
                      alt={chat.name ?? 'Chat'}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{chat.name ?? 'Chat sin ttulo'}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {chat.lastMessageAt
                          ? new Date(chat.lastMessageAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Sin mensajes'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openChatIds.map((chatId, index) => {
          const chat = chats.find((c) => c.id === chatId);
          if (!chat) return null;
          return <ChatWindow key={chat.id} chat={chat} index={index} onClose={handleCloseChat} />;
        })}
      </AnimatePresence>

      {showStoryModal && (
        <GlassDialog open={showStoryModal} onClose={() => setShowStoryModal(false)} size="md" contentClassName="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Crear historia</h3>
              <p className="text-sm text-[var(--color-muted)]">Comparte un momento con tu comunidad.</p>
            </div>
            <Button variant="ghost" onClick={() => setShowStoryModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-4">
            <Input type="file" accept="image/*,video/*" />
            <TextArea rows={4} placeholder="Escribe una descripcion..." />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowStoryModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowStoryModal(false)}>Publicar historia</Button>
            </div>
          </div>
        </GlassDialog>
      )}

      {shareTarget && (
        <GlassDialog
          open={Boolean(shareTarget)}
          onClose={handleCloseShareModal}
          size="lg"
          preventCloseOnBackdrop={isSharing}
          contentClassName="p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Compartir publicacion</h3>
              <p className="text-sm text-[var(--color-muted)]">Agrega un mensaje personal para tu comunidad.</p>
            </div>
            <Button variant="ghost" onClick={handleCloseShareModal} disabled={isSharing}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-4 text-sm text-[var(--color-text)]">
              <div className="flex items-start gap-3">
                <img
                  src={
                    shareTarget.author.avatarUrl ??
                    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(shareTarget.author.fullName)}.svg`
                  }
                  alt={shareTarget.author.fullName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold">{shareTarget.author.fullName}</p>
                  <p className="text-xs text-[var(--color-muted)]">{formatTimeAgo(shareTarget.createdAt)}</p>
                </div>
              </div>
              {shareTarget.content && (
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]">{shareTarget.content}</p>
              )}
              {shareTarget.mediaUrl && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/15">
                  <img src={shareTarget.mediaUrl} alt="Vista previa" className="w-full object-cover" />
                </div>
              )}
            </div>

            <TextArea
              rows={4}
              placeholder="Agrega un mensaje para tus contactos (opcional)"
              value={shareMessage}
              onChange={(event) => setShareMessage(event.target.value)}
              disabled={isSharing}
            />

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleCloseShareModal} disabled={isSharing}>
                Cancelar
              </Button>
              <Button onClick={handleShareSubmit} loading={isSharing} disabled={isSharing}>
                Compartir
              </Button>
            </div>
          </div>
        </GlassDialog>
      )}
      </div>
    </DashboardLayout>
  );
};

const ChatWindow = ({ chat, index, onClose }: ChatWindowProps) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['home', 'chat', chat.id],
    queryFn: async () => await chatService.listMessages(chat.id),
    enabled: Boolean(chat.id)
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(chat.id, { content }),
    onSuccess: async () => {
      setMessage('');
      await queryClient.invalidateQueries({ queryKey: ['home', 'chat', chat.id] });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-28 z-50 w-80"
      style={{ right: 24 + index * 320 }}
    >
      <Card padded={false} className="flex h-96 flex-col overflow-hidden rounded-3xl border-white/30 bg-white/20 shadow-[0_25px_45px_rgba(18,55,29,0.28)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10">
        <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={`https://avatars.dicebear.com/api/initials/${encodeURIComponent(chat.name ?? 'Chat')}.svg`}
              alt={chat.name ?? 'Chat'}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{chat.name ?? 'Chat sin ttulo'}</p>
              <p className="text-xs text-[var(--color-muted)]">Activo ahora</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onClose(chat.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {isLoading && <p className="text-xs text-[var(--color-muted)]">Cargando mensajes...</p>}
          {!isLoading && messages.length === 0 && (
            <p className="text-xs text-[var(--color-muted)]">An no hay mensajes en este chat.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl bg-white/30 px-3 py-2 text-sm text-[var(--color-text)] dark:bg-white/10">
              <p>{msg.content}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {new Date(msg.createdAt).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
        <form
          className="border-t border-white/20 px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!message.trim()) return;
            sendMessageMutation.mutate(message.trim());
          }}
        >
          <div className="flex items-center gap-2">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-2xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
            />
            <Button type="submit" size="sm" loading={sendMessageMutation.isPending}>
              Enviar
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};









