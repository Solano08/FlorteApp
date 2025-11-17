import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  Plus,
  X,
  ThumbsUp,
  Trash2,
  MoreHorizontal,
  FileText,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  Shield
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Chat } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { FeedComment, FeedPostAggregate, ReactionType } from '../../types/feed';
import { resolveAssetUrl } from '../../utils/media';

interface ChatWindowProps {
  chat: Chat;
  index: number;
  onClose: (chatId: string) => void;
}

interface ComposerAttachment {
  id: string;
  url: string;
  fileName?: string | null;
  fileType?: string | null;
}

type AttachmentPayload = {
  url: string;
  fileName?: string | null;
  fileType?: string | null;
};

const generateClientId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

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
  { icon: Image, label: 'Multimedia', action: 'media' as const },
  { icon: Paperclip, label: 'Adjuntar archivos', action: 'attachments' as const },
  { icon: Smile, label: 'Emojis', action: 'emoji' as const }
];
type ComposerAction = (typeof composerIcons)[number]['action'];

const reactionOptions: Array<{ type: ReactionType; label: string; icon: typeof Heart; accent: string }> = [
  { type: 'like', label: 'Me gusta', icon: ThumbsUp, accent: 'text-sena-green' },
  { type: 'love', label: 'Me encanta', icon: Heart, accent: 'text-rose-500' },
  { type: 'wow', label: 'Me asombra', icon: Sparkles, accent: 'text-amber-500' }
];

const iosEmojiPalette = [
  '😀',
  '😄',
  '😁',
  '😎',
  '😍',
  '🥰',
  '😘',
  '🤩',
  '🤗',
  '🤔',
  '🤯',
  '😴',
  '😇',
  '🤠',
  '😻',
  '🙌',
  '👏',
  '🫶',
  '🔥',
  '✨',
  '🌟',
  '🎉',
  '🚀',
  '🌈',
  '💡'
];

const isVideoAsset = (url: string) => /\.(mp4|mov|webm|ogg)$/i.test(url);
const getExtension = (fileName?: string | null) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
};

const getAttachmentMeta = (fileName?: string | null, fileType?: string | null) => {
  const extension = getExtension(fileName);
  const normalizedType = (fileType ?? '').toLowerCase();
  if (normalizedType.includes('pdf') || extension === 'pdf') {
    return { Icon: FileText, color: 'text-rose-500', label: 'PDF' };
  }
  if (normalizedType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return { Icon: FileImage, color: 'text-sena-green', label: 'Imagen' };
  }
  if (normalizedType.startsWith('video/') || ['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
    return { Icon: FileVideo, color: 'text-blue-500', label: 'Video' };
  }
  if (normalizedType.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac'].includes(extension)) {
    return { Icon: FileAudio, color: 'text-violet-500', label: 'Audio' };
  }
  if (['zip', 'rar', '7z'].includes(extension) || normalizedType.includes('zip')) {
    return { Icon: FileArchive, color: 'text-amber-500', label: 'Comprimido' };
  }
  if (['js', 'ts', 'json', 'html', 'css'].includes(extension)) {
    return { Icon: FileCode, color: 'text-cyan-500', label: 'Codigo' };
  }
  return { Icon: FileText, color: 'text-slate-500', label: extension ? extension.toUpperCase() : 'Archivo' };
};

export const HomePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isComposerDialogOpen, setComposerDialogOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerMedia, setComposerMedia] = useState<{ url: string; mimeType?: string } | null>(null);
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsCache, setCommentsCache] = useState<Record<string, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentUploadStatus, setCommentUploadStatus] = useState<Record<string, { media?: boolean; file?: boolean }>>({});
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<
    { type: 'composer' } | { type: 'comment'; postId: string } | null
  >(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [reactionPickerPostId, setReactionPickerPostId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<FeedPostAggregate | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [reportTarget, setReportTarget] = useState<FeedPostAggregate | null>(null);
  const [reportMessage, setReportMessage] = useState('');
  const [actionMenuPostId, setActionMenuPostId] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const mediaUploadContext = useRef<{ type: 'composer' | 'comment'; postId?: string } | null>(null);
  const attachmentUploadContext = useRef<{ type: 'composer' | 'comment'; postId?: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!activeEmojiPicker) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-emoji-panel="true"]') || target?.closest('[data-emoji-trigger="true"]')) {
        return;
      }
      setActiveEmojiPicker(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeEmojiPicker]);

  useEffect(() => {
    if (!actionMenuPostId) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-post-menu="true"]') || target?.closest('[data-post-menu-trigger="true"]')) {
        return;
      }
      setActionMenuPostId(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [actionMenuPostId]);

  const userNameFromProfile = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const userDisplayName = userNameFromProfile || user?.email || 'Aprendiz SENA';
  const fallbackAvatar = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(userDisplayName)}.svg`;
  const userAvatar = user?.avatarUrl ?? fallbackAvatar;
  const composerMediaPreview = composerMedia ? resolveAssetUrl(composerMedia.url) ?? composerMedia.url : null;
  const maxAttachmentsReached = composerAttachments.length >= 5;

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
    mutationFn: (payload: { content: string; mediaUrl?: string | null; attachments?: AttachmentPayload[] }) =>
      feedService.createPost(payload),
    onSuccess: (post) => {
      queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) =>
        existing ? [post, ...existing] : [post]
      );
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
      setComposerContent('');
      setComposerMedia(null);
      setComposerAttachments([]);
      setComposerDialogOpen(false);
      setActiveEmojiPicker(null);
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
      void queryClient.invalidateQueries({ queryKey: ['profile', 'savedPosts'] });
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
      showToast('Publicacion compartida con exito');
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible compartir la publicacion', error);
      showToast('No fue posible compartir la publicacion');
    }
  });

  const reportMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string | null }) =>
      feedService.reportPost(postId, reason),
    onSuccess: () => {
      showToast('Reporte enviado al equipo de moderacion');
      setReportTarget(null);
      setReportMessage('');
    },
    onError: (error) => {
      console.error('No fue posible enviar el reporte', error);
      showToast('No fue posible enviar el reporte');
    }
  });

  const handleComposerSubmit = () => {
    const trimmedContent = composerContent.trim();
    if (!trimmedContent || createPostMutation.isPending || isUploadingMedia || isUploadingAttachment) return;
    createPostMutation.mutate({
      content: trimmedContent,
      mediaUrl: composerMedia?.url ?? undefined,
      attachments:
        composerAttachments.length > 0
          ? composerAttachments.map((attachment) => ({
              url: attachment.url,
              fileName: attachment.fileName,
              fileType: attachment.fileType
            }))
          : undefined
    });
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

  const triggerMediaPicker = (context: { type: 'composer' | 'comment'; postId?: string }) => {
    mediaUploadContext.current = context;
    mediaInputRef.current?.click();
  };

  const triggerAttachmentPicker = (context: { type: 'composer' | 'comment'; postId?: string }) => {
    attachmentUploadContext.current = context;
    attachmentInputRef.current?.click();
  };

  const appendToCommentInput = (postId: string, value: string) => {
    setCommentInputs((prev) => {
      const current = prev[postId] ?? '';
      const next = current ? `${current}\n${value}` : value;
      return { ...prev, [postId]: next };
    });
  };

  const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const context = mediaUploadContext.current ?? { type: 'composer' };
    if (context.type === 'comment' && context.postId) {
      const targetPostId = context.postId;
      setCommentUploadStatus((prev) => ({
        ...prev,
        [targetPostId]: { ...(prev[targetPostId] ?? {}), media: true }
      }));
    } else {
      setIsUploadingMedia(true);
    }

    try {
      const upload = await feedService.uploadMedia(file);
      if (context.type === 'composer') {
        setComposerMedia({ url: upload.url, mimeType: upload.mimeType });
        showToast('Multimedia agregada correctamente');
      } else if (context.postId) {
        const finalUrl = resolveAssetUrl(upload.url) ?? upload.url;
        appendToCommentInput(context.postId, finalUrl);
        showToast('Multimedia agregada al comentario');
      }
    } catch (error) {
      console.error('No fue posible cargar la multimedia', error);
      showToast('No fue posible cargar la multimedia');
    } finally {
      if (context.type === 'comment' && context.postId) {
        const targetPostId = context.postId;
        setCommentUploadStatus((prev) => ({
          ...prev,
          [targetPostId]: { ...(prev[targetPostId] ?? {}), media: false }
        }));
      } else {
        setIsUploadingMedia(false);
      }
      if (event.target) {
        event.target.value = '';
      }
      mediaUploadContext.current = null;
    }
  };

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const context = attachmentUploadContext.current ?? { type: 'composer' };
    if (context.type === 'composer' && maxAttachmentsReached) {
      showToast('Alcanzaste el limite de adjuntos');
      if (event.target) {
        event.target.value = '';
      }
      attachmentUploadContext.current = null;
      return;
    }
    if (context.type === 'comment' && context.postId) {
      const targetPostId = context.postId;
      setCommentUploadStatus((prev) => ({
        ...prev,
        [targetPostId]: { ...(prev[targetPostId] ?? {}), file: true }
      }));
    } else {
      setIsUploadingAttachment(true);
    }

    try {
      const upload = await feedService.uploadAttachment(file);
      if (context.type === 'composer') {
        setComposerAttachments((prev) => [
          ...prev,
          {
            id: generateClientId(),
            url: upload.url,
            fileName: upload.fileName ?? file.name,
            fileType: upload.mimeType ?? file.type
          }
        ]);
        showToast('Adjunto agregado');
      } else if (context.postId) {
        const finalUrl = resolveAssetUrl(upload.url) ?? upload.url;
        appendToCommentInput(
          context.postId,
          `${upload.fileName ?? file.name}: ${finalUrl}`
        );
        showToast('Adjunto agregado al comentario');
      }
    } catch (error) {
      console.error('No fue posible cargar el adjunto', error);
      showToast('No fue posible cargar el adjunto');
    } finally {
      if (context.type === 'comment' && context.postId) {
        const targetPostId = context.postId;
        setCommentUploadStatus((prev) => ({
          ...prev,
          [targetPostId]: { ...(prev[targetPostId] ?? {}), file: false }
        }));
      } else {
        setIsUploadingAttachment(false);
      }
      if (event.target) {
        event.target.value = '';
      }
      attachmentUploadContext.current = null;
    }
  };

  const handleRemoveComposerAttachment = (attachmentId: string) => {
    setComposerAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const handleRemoveComposerMedia = () => {
    setComposerMedia(null);
  };

  const toggleEmojiPicker = (nextTarget: { type: 'composer' } | { type: 'comment'; postId: string }) => {
    setActiveEmojiPicker((prev) => {
      if (!prev) return nextTarget;
      if (prev.type === 'composer' && nextTarget.type === 'composer') {
        return null;
      }
      if (prev.type === 'comment' && nextTarget.type === 'comment' && prev.postId === nextTarget.postId) {
        return null;
      }
      return nextTarget;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!activeEmojiPicker) return;
    if (activeEmojiPicker.type === 'composer') {
      setComposerContent((prev) => `${prev}${emoji}`);
    } else {
      const postId = activeEmojiPicker.postId;
      setCommentInputs((prev) => {
        const current = prev[postId] ?? '';
        return { ...prev, [postId]: `${current}${emoji}` };
      });
    }
    setActiveEmojiPicker(null);
  };

  const handleInlineComposerAction = (action: ComposerAction) => {
    if (action === 'attachments' && maxAttachmentsReached) {
      showToast('Alcanzaste el limite de adjuntos');
      return;
    }
    openComposerDialog();
    if (action === 'emoji') {
      toggleEmojiPicker({ type: 'composer' });
      return;
    }
    window.setTimeout(() => {
      if (action === 'media') {
        triggerMediaPicker({ type: 'composer' });
      } else if (action === 'attachments') {
        triggerAttachmentPicker({ type: 'composer' });
      }
    }, 150);
  };

  const isPublishing = createPostMutation.isPending;
  const isSharing = shareMutation.isPending;

  const openComposerDialog = () => setComposerDialogOpen(true);
  const closeComposerDialog = () => {
    if (isPublishing) return;
    setComposerDialogOpen(false);
  };

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
  };

  const copyToClipboard = async (value: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // fallback below
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleReactionSelect = (postId: string, reaction: ReactionType) => {
    reactionMutation.mutate({ postId, reactionType: reaction });
    setReactionPickerPostId(null);
  };

  const handleShareLink = async (post: FeedPostAggregate) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/feed/${post.id}`;
    const copied = await copyToClipboard(link);
    showToast(
      copied ? 'El enlace de la publicacion se copio correctamente' : 'No fue posible copiar el enlace automaticamente'
    );
    setActionMenuPostId(null);
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

  const handleShareSubmit = () => {
    if (!shareTarget || shareMutation.isPending) return;
    shareMutation.mutate({
      postId: shareTarget.id,
      message: shareMessage.trim() ? shareMessage.trim() : undefined
    });
  };

  const handleOpenReport = (post: FeedPostAggregate) => {
    setReportTarget(post);
    setReportMessage('');
    setActionMenuPostId(null);
  };

  const handleSubmitReport = () => {
    if (!reportTarget || reportMutation.isPending) return;
    reportMutation.mutate({
      postId: reportTarget.id,
      reason: reportMessage.trim() ? reportMessage.trim() : undefined
    });
  };

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => feedService.deletePost(postId),
    onSuccess: (_result, postId) => {
      queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) =>
        existing ? existing.filter((post) => post.id !== postId) : existing
      );
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
      showToast('La publicacion se elimino correctamente');
    },
    onError: (error) => {
      console.error('No fue posible eliminar la publicacion', error);
      showToast('No fue posible eliminar la publicacion');
    }
  });

  const handleDeletePost = (postId: string) => {
    if (deletePostMutation.isPending) return;
    const confirmed = window.confirm('¿Seguro que deseas eliminar esta publicacion?');
    if (!confirmed) return;
    deletePostMutation.mutate(postId);
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
            avatar: userAvatar
          }
        : story
    );
  }, [userAvatar]);

  return (
    <DashboardLayout
      fluid
      contentClassName="px-2 sm:px-6 lg:px-10 xl:px-16"
    >
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaChange}
        aria-hidden="true"
      />
      <input
        ref={attachmentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,application/*"
        className="hidden"
        onChange={handleAttachmentChange}
        aria-hidden="true"
      />
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_16px_40px_rgba(18,55,29,0.18)] backdrop-blur dark:border-white/20 dark:bg-slate-900/85 dark:text-white"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={userAvatar}
                  alt="composer"
                  className="h-10 w-10 rounded-full object-cover shadow-[0_10px_18px_rgba(18,55,29,0.14)]"
                />
                <div className="flex-1">
                  <TextArea
                    placeholder="Comparte un nuevo avance, recurso o proyecto..."
                    rows={2}
                    value={composerContent}
                    readOnly
                    onClick={openComposerDialog}
                    onFocus={openComposerDialog}
                    className="cursor-pointer bg-white/90 text-sm placeholder:text-[var(--color-muted)] dark:bg-white/10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {composerIcons.map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    type="button"
                    title={label}
                    aria-label={label}
                    data-emoji-trigger={action === 'emoji' ? 'true' : undefined}
                    onClick={() => handleInlineComposerAction(action)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/35 bg-white/20 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.12)] transition hover:border-sena-green/60 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sena-green/50 dark:border-white/15 dark:bg-white/10 dark:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
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
            const isCommenting =
              commentMutation.isPending && commentMutation.variables?.postId === post.id;
            const viewerHasReaction = Boolean(post.viewerReaction);
            const viewerReactionOption = reactionOptions.find((option) => option.type === post.viewerReaction);
            const formattedTime = formatTimeAgo(post.createdAt);
            const authorAvatar =
              post.author.avatarUrl ??
              `https://avatars.dicebear.com/api/initials/${encodeURIComponent(post.author.fullName)}.svg`;
            const reactionLabel = post.reactionCount === 1 ? 'reaccion' : 'reacciones';
            const commentLabel = post.commentCount === 1 ? 'comentario' : 'comentarios';
            const shareLabel = post.shareCount === 1 ? 'compartido' : 'compartidos';
            const commentUploads = commentUploadStatus[post.id] ?? {};
            const isCommentUploading = Boolean(commentUploads.media || commentUploads.file);
            const isSharingPost = isSharing && shareMutation.variables?.postId === post.id;
            const ReactionIcon = viewerReactionOption?.icon ?? ThumbsUp;
            const reactionAccent = viewerReactionOption?.accent ?? '';

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
                  <div className="relative">
                    <button
                      type="button"
                      data-post-menu-trigger="true"
                      className="rounded-full p-2 text-[var(--color-muted)] transition hover:text-sena-green"
                      aria-label="Acciones de publicacion"
                      onClick={() => setActionMenuPostId((prev) => (prev === post.id ? null : post.id))}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <AnimatePresence>
                      {actionMenuPostId === post.id && (
                        <motion.div
                          data-post-menu="true"
                          initial={{ opacity: 0, scale: 0.9, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -6 }}
                          className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-white/30 bg-white/95 p-2 text-sm text-slate-700 shadow-[0_20px_45px_rgba(18,55,29,0.22)] dark:border-white/15 dark:bg-slate-900/90 dark:text-white"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sena-green/10"
                            onClick={() => {
                              setActionMenuPostId(null);
                              saveMutation.mutate(post.id);
                            }}
                          >
                            {post.isSaved ? 'Quitar de guardados' : 'Guardar publicacion'}
                            <Bookmark className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sena-green/10"
                            onClick={() => {
                              setActionMenuPostId(null);
                              void handleShareLink(post);
                            }}
                          >
                            Copiar enlace
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sena-green/10"
                            onClick={() => handleOpenReport(post)}
                          >
                            Reportar publicacion
                            <Shield className="h-4 w-4" />
                          </button>
                          {post.authorId === user?.id && (
                            <button
                              type="button"
                              className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-500/10"
                              onClick={() => {
                                setActionMenuPostId(null);
                                handleDeletePost(post.id);
                              }}
                            >
                              Eliminar
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {post.content && (
                  <p className="whitespace-pre-line text-sm text-[var(--color-text)]">{post.content}</p>
                )}

                {post.mediaUrl && (
                  <div className="overflow-hidden rounded-3xl border border-white/15">
                    {isVideoAsset(post.mediaUrl) ? (
                      <video src={post.mediaUrl} controls className="w-full object-cover" />
                    ) : (
                      <img src={post.mediaUrl} alt="Contenido compartido" className="w-full object-cover" />
                    )}
                  </div>
                )}

                {post.attachments?.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-white/20 bg-white/15 p-3">
                    {post.attachments.map((attachment) => {
                      const meta = getAttachmentMeta(attachment.fileName, attachment.fileType);
                      const Icon = meta.Icon;
                      return (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl bg-white/30 px-3 py-2 text-xs font-medium text-[var(--color-text)] transition hover:text-sena-green"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                            {attachment.fileName ?? 'Archivo adjunto'}
                          </span>
                          <span className="text-[10px] text-[var(--color-muted)]">{meta.label}</span>
                        </a>
                      );
                    })}
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
                    <ThumbsUp
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
                  <div
                    className="relative flex-1"
                    data-reaction-zone="true"
                    onMouseEnter={() => setReactionPickerPostId(post.id)}
                    onMouseLeave={() => setReactionPickerPostId((prev) => (prev === post.id ? null : prev))}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setReactionPickerPostId((prev) => (prev === post.id ? null : prev));
                      }
                    }}
                  >
                    <Button
                      variant="ghost"
                      className={classNames(
                        'w-full justify-center gap-2 text-xs sm:text-sm',
                        viewerHasReaction && 'text-sena-green'
                      )}
                      onFocus={() => setReactionPickerPostId(post.id)}
                      onClick={() => handleReactionSelect(post.id, 'like')}
                      disabled={isReacting}
                      loading={isReacting}
                    >
                      <ReactionIcon className={classNames('h-4 w-4', reactionAccent || undefined)} />
                      {viewerReactionOption ? viewerReactionOption.label : viewerHasReaction ? 'Reaccionaste' : 'Reaccionar'}
                    </Button>
                    <AnimatePresence>
                      {reactionPickerPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-2 shadow-[0_15px_30px_rgba(18,55,29,0.2)] dark:border-white/20 dark:bg-slate-900/95"
                        >
                          {reactionOptions.map(({ type, label, icon: Icon, accent }) => (
                            <button
                              key={`${post.id}-${type}`}
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-700 transition hover:scale-110 dark:bg-white/15 dark:text-white"
                              onClick={() => handleReactionSelect(post.id, type)}
                              aria-label={label}
                            >
                              <Icon className={classNames('h-4 w-4', accent)} />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
                    disabled={isSharingPost}
                    loading={isSharingPost}
                  >
                    <Share2 className="h-4 w-4" /> Compartir
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

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {composerIcons.map(({ icon: Icon, label, action }) => (
                          <button
                            key={`${post.id}-${label}`}
                            type="button"
                            title={label}
                            aria-label={label}
                            data-emoji-trigger={action === 'emoji' ? 'true' : undefined}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-sena-green transition hover:border-sena-green/50 hover:bg-white/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
                            onClick={() => {
                              if (action === 'media') {
                                triggerMediaPicker({ type: 'comment', postId: post.id });
                              } else if (action === 'attachments') {
                                triggerAttachmentPicker({ type: 'comment', postId: post.id });
                              } else {
                                toggleEmojiPicker({ type: 'comment', postId: post.id });
                              }
                            }}
                            disabled={
                              (action === 'media' && commentUploads.media) ||
                              (action === 'attachments' && commentUploads.file)
                            }
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        ))}
                        {isCommentUploading && (
                          <span className="text-[11px] text-[var(--color-muted)]">Adjuntando archivo...</span>
                        )}
                      </div>
                      {activeEmojiPicker?.type === 'comment' && activeEmojiPicker.postId === post.id && (
                        <div
                          data-emoji-panel="true"
                          className="flex flex-wrap gap-1 rounded-2xl border border-white/20 bg-white/80 p-2 text-xl shadow-[0_12px_24px_rgba(18,55,29,0.18)] dark:border-white/15 dark:bg-slate-900/90"
                        >
                          {iosEmojiPalette.map((emoji) => (
                            <button
                              key={`${post.id}-emoji-${emoji}`}
                              type="button"
                              className="h-8 w-8 text-center"
                              onClick={() => handleEmojiSelect(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <textarea
                          rows={2}
                          value={commentInputs[post.id] ?? ''}
                          onChange={(event) => handleCommentInputChange(post.id, event.target.value)}
                          placeholder="Escribe un comentario..."
                          className="flex-1 resize-none rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                          disabled={isCommenting || isCommentUploading}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitComment(post.id)}
                          disabled={isCommenting || isCommentUploading || !(commentInputs[post.id] ?? '').trim()}
                          loading={isCommenting}
                        >
                          Enviar
                        </Button>
                      </div>
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

      {isComposerDialogOpen && (
        <GlassDialog
          open={isComposerDialogOpen}
          onClose={closeComposerDialog}
          size="lg"
          preventCloseOnBackdrop={isPublishing}
          overlayClassName="!bg-slate-100/70 backdrop-blur-sm dark:!bg-slate-950/65"
          contentClassName="p-0 !overflow-visible !bg-white/55 !backdrop-blur-[30px] !border-white/60 !shadow-[0_50px_120px_rgba(15,38,25,0.25)] dark:!bg-slate-900/85 dark:!border-white/15"
        >
          <div className="w-full max-w-2xl space-y-5 p-5 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Crear publicacion</h3>
                <p className="text-sm text-[var(--color-muted)]">Comparte avances, anuncios o recursos con tu red.</p>
              </div>
              <Button
                variant="ghost"
                onClick={closeComposerDialog}
                disabled={isPublishing}
                className="self-start rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-[0_12px_30px_rgba(15,38,25,0.12)] backdrop-blur hover:border-sena-green/40 hover:text-sena-green disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25 dark:bg-white/15 dark:text-[var(--color-muted)]"
              >
                <X className="mr-1 h-4 w-4" /> Cerrar
              </Button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/40 p-3 shadow-[0_12px_28px_rgba(18,55,29,0.12)] dark:border-white/10 dark:bg-white/5">
              <img src={userAvatar} alt={userDisplayName} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{userDisplayName}</p>
              </div>
            </div>

            <TextArea
              rows={5}
              autoFocus
              placeholder="Que estas pensando hoy?"
              value={composerContent}
              onChange={(event) => setComposerContent(event.target.value)}
              disabled={isPublishing}
              className="bg-white/90 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] dark:bg-white/10"
            />

            {composerMedia && composerMediaPreview && (
              <div className="space-y-3 rounded-2xl border border-white/20 bg-white/60 p-3 shadow-[0_12px_30px_rgba(18,55,29,0.1)] dark:border-white/15 dark:bg-white/5 w-full max-w-xs">
                <div className="flex items-center justify-between text-sm font-semibold text-[var(--color-text)]">
                  <span>Multimedia seleccionada</span>
                  <button
                    type="button"
                    className="text-xs text-rose-500 hover:text-rose-600"
                    onClick={handleRemoveComposerMedia}
                  >
                    Eliminar
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/40">
                  {isVideoAsset(composerMediaPreview) ? (
                    <video src={composerMediaPreview} controls className="h-32 w-full object-cover" />
                  ) : (
                    <img src={composerMediaPreview} alt="Vista previa" className="h-32 w-full object-cover" />
                  )}
                </div>
              </div>
            )}

                {composerAttachments.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-white/20 bg-white/50 p-3 shadow-[0_12px_30px_rgba(18,55,29,0.1)] dark:border-white/15 dark:bg-white/5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">Archivos adjuntos</p>
                    {composerAttachments.map((attachment) => {
                      const meta = getAttachmentMeta(attachment.fileName, attachment.fileType);
                      const Icon = meta.Icon;
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs text-[var(--color-text)] dark:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                            {attachment.fileName ?? 'Archivo'}
                            <span className="text-[10px] text-[var(--color-muted)]">({meta.label})</span>
                          </span>
                          <button
                            type="button"
                            className="text-rose-500 hover:text-rose-600"
                            onClick={() => handleRemoveComposerAttachment(attachment.id)}
                          >
                            Quitar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

            <div className="rounded-2xl border border-dashed border-white/40 bg-white/25 px-4 py-4 shadow-[0_12px_30px_rgba(18,55,29,0.1)] dark:border-white/15 dark:bg-white/5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Agregar a tu publicacion</p>
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {composerIcons.map(({ icon: Icon, label, action }) => (
                    <button
                      key={`modal-${label}`}
                      type="button"
                      title={label}
                      aria-label={label}
                      data-emoji-trigger={action === 'emoji' ? 'true' : undefined}
                      onClick={() => {
                        if (action === 'media') {
                          triggerMediaPicker({ type: 'composer' });
                        } else if (action === 'attachments') {
                          if (!maxAttachmentsReached) {
                            triggerAttachmentPicker({ type: 'composer' });
                          }
                        } else {
                          toggleEmojiPicker({ type: 'composer' });
                        }
                      }}
                      className={classNames(
                        'flex min-w-[140px] flex-1 items-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-3 py-2 text-left text-xs font-semibold text-[var(--color-text)] transition hover:border-sena-green/40 hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sena-green/40 dark:border-white/15 dark:bg-white/10',
                        action === 'attachments' && maxAttachmentsReached && 'opacity-50'
                      )}
                      disabled={action === 'attachments' && maxAttachmentsReached}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-sena-green shadow-[0_6px_16px_rgba(18,55,29,0.15)] dark:bg-white/15 dark:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[13px]">
                        {label}
                        {action === 'attachments' && maxAttachmentsReached ? ' (limite)' : ''}
                      </span>
                    </button>
                  ))}
                </div>
                {activeEmojiPicker?.type === 'composer' && (
                  <div
                    data-emoji-panel="true"
                    className="flex flex-wrap gap-1 rounded-2xl border border-white/30 bg-white/80 p-2 text-xl shadow-[0_12px_24px_rgba(18,55,29,0.18)] dark:border-white/15 dark:bg-slate-900/85"
                  >
                    {iosEmojiPalette.map((emoji) => (
                      <button key={`composer-emoji-${emoji}`} type="button" className="h-8 w-8 text-center" onClick={() => handleEmojiSelect(emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeComposerDialog} disabled={isPublishing}>
                Cancelar
              </Button>
              <Button
                onClick={handleComposerSubmit}
                loading={isPublishing}
                disabled={isPublishing || isUploadingMedia || isUploadingAttachment || !composerContent.trim()}
                className="min-w-[120px]"
              >
                Publicar
              </Button>
            </div>
          </div>
        </GlassDialog>
      )}

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
              <p className="text-sm text-[var(--color-muted)]">
                Agrega un mensaje y compartelo con tu comunidad.
              </p>
            </div>
            <Button variant="ghost" onClick={handleCloseShareModal} disabled={isSharing}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <TextArea
              rows={4}
              placeholder="Que piensas sobre esta publicacion?"
              value={shareMessage}
              onChange={(event) => setShareMessage(event.target.value)}
              disabled={isSharing}
            />

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
                  {isVideoAsset(shareTarget.mediaUrl) ? (
                    <video src={shareTarget.mediaUrl} controls className="w-full object-cover" />
                  ) : (
                    <img src={shareTarget.mediaUrl} alt="Vista previa" className="w-full object-cover" />
                  )}
                </div>
              )}
              {shareTarget.attachments?.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/15 bg-white/20 p-3">
                  {shareTarget.attachments.map((attachment) => {
                    const meta = getAttachmentMeta(attachment.fileName, attachment.fileType);
                    const Icon = meta.Icon;
                    return (
                      <div key={attachment.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          {attachment.fileName ?? 'Archivo'}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)]">{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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

      {reportTarget && (
        <GlassDialog
          open={Boolean(reportTarget)}
          onClose={() => {
            if (reportMutation.isPending) return;
            setReportTarget(null);
            setReportMessage('');
          }}
          size="md"
          preventCloseOnBackdrop={reportMutation.isPending}
          contentClassName="p-0 !overflow-visible !bg-white/55 !backdrop-blur-[30px] !border-white/60 !shadow-[0_50px_120px_rgba(15,38,25,0.25)] dark:!bg-slate-900/85 dark:!border-white/15"
        >
          <div className="max-h-[70vh] space-y-5 overflow-y-auto rounded-[32px] border border-white/60 bg-white/45 p-5 shadow-[0_28px_70px_rgba(15,38,25,0.2)] backdrop-blur-[22px] dark:border-white/15 dark:bg-white/5 dark:shadow-[0_28px_60px_rgba(10,22,15,0.45)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Reportar publicacion</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Describe el motivo para que el equipo de moderacion pueda revisarla.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  if (reportMutation.isPending) return;
                  setReportTarget(null);
                  setReportMessage('');
                }}
                className="self-start rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs text-[var(--color-muted)] shadow-[0_10px_24px_rgba(18,55,29,0.18)] backdrop-blur hover:text-sena-green dark:border-white/20 dark:bg-white/10"
                disabled={reportMutation.isPending}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <TextArea
              rows={4}
              placeholder="Contenido falso, spam, lenguaje inapropiado, etc."
              value={reportMessage}
              onChange={(event) => setReportMessage(event.target.value)}
              disabled={reportMutation.isPending}
              className="bg-white/80 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] dark:bg-white/10"
            />

            <div className="rounded-[24px] border border-white/25 bg-white/35 p-4 text-sm text-[var(--color-text)] shadow-[0_20px_40px_rgba(18,55,29,0.18)] dark:border-white/10 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={
                    reportTarget.author.avatarUrl ??
                    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(reportTarget.author.fullName)}.svg`
                  }
                  alt={reportTarget.author.fullName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{reportTarget.author.fullName}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{formatTimeAgo(reportTarget.createdAt)}</p>
                </div>
              </div>
              {reportTarget.content && (
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]">{reportTarget.content}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (reportMutation.isPending) return;
                  setReportTarget(null);
                  setReportMessage('');
                }}
                disabled={reportMutation.isPending}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmitReport} loading={reportMutation.isPending} disabled={reportMutation.isPending}>
                Enviar reporte
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









