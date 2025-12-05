import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { EmojiPicker } from '../../components/ui/EmojiPicker';
import classNames from 'classnames';
import { chatService } from '../../services/chatService';
import { projectService } from '../../services/projectService';
import { libraryService } from '../../services/libraryService';
import { feedService } from '../../services/feedService';
import {
  ArrowUpRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  FolderKanban,
  Heart,
  Image,
  Laugh,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Share2,
  Smile,
  Sparkles,
  ThumbsUp,
  Trash2,
  Users,
  Video,
  X
} from 'lucide-react';
import { Chat } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { FeedAttachment, FeedComment, FeedPostAggregate, ReactionType } from '../../types/feed';
import { useLocation, useNavigate } from 'react-router-dom';
import { floatingModalContentClass } from '../../utils/modalStyles';
import { resolveAssetUrl } from '../../utils/media';

interface ChatWindowProps {
  chat: Chat;
  index: number;
  onClose: (chatId: string) => void;
}

const composerIcons = [
  { icon: Image, label: 'Imagen', action: 'image' as const },
  { icon: Video, label: 'Video', action: 'video' as const },
  { icon: Paperclip, label: 'Adjuntar', action: 'document' as const },
  { icon: Smile, label: 'Reacciones', action: 'emoji' as const }
];

type ComposerToolAction = (typeof composerIcons)[number]['action'];

type AttachmentKind = 'image' | 'video' | 'document';

interface ComposerAttachment {
  kind: AttachmentKind;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  id: string;
}

const reactionOptions = [
  { type: 'like' as ReactionType, label: 'Me gusta', icon: ThumbsUp, color: 'text-blue-400' },
  { type: 'love' as ReactionType, label: 'Me encanta', icon: Heart, color: 'text-rose-500' },
  { type: 'insightful' as ReactionType, label: 'Me asombra', icon: Sparkles, color: 'text-amber-500' },
  { type: 'celebrate' as ReactionType, label: 'Me divierte', icon: Laugh, color: 'text-emerald-500' }
];

const reportReasons = [
  'Contenido inapropiado',
  'Informacion falsa',
  'Discurso danino o spam',
  'Violacion de derechos',
  'Otro'
];


const shareAudienceOptions = [
  { id: 'feed', label: 'Tu biografia' },
  { id: 'chat', label: 'Mensaje directo' },
  { id: 'group', label: 'Grupo' }
] as const;

type ShareScope = (typeof shareAudienceOptions)[number]['id'];

const announcementSlides = [
  {
    id: 'ad-1',
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=60',
    alt: 'Equipo creativo colaborando en laptops'
  },
  {
    id: 'ad-2',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60',
    alt: 'Prototipos y dispositivos sobre una mesa'
  },
  {
    id: 'ad-3',
    image:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=60',
    alt: 'Desarrollador trabajando en codigo'
  }
];

const detectMediaType = (value: string): 'image' | 'video' | 'pdf' | 'other' => {
  const lowerValue = value.toLowerCase();
  const mimeMatch = lowerValue.match(/^data:(.*?);/);
  const inferredMime = mimeMatch?.[1] ?? '';
  const sanitizedUrl = lowerValue.split('?')[0] ?? '';
  const extension = sanitizedUrl.includes('.') ? sanitizedUrl.substring(sanitizedUrl.lastIndexOf('.') + 1) : '';
  const ref = inferredMime || extension;

  if (ref.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ref)) {
    return 'image';
  }
  if (ref.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ref)) {
    return 'video';
  }
  if (ref === 'application/pdf' || ref === 'pdf') {
    return 'pdf';
  }
  return 'other';
};

const extractFileName = (value: string): string => {
  if (!value || value.startsWith('data:')) {
    return 'Archivo adjunto';
  }
  try {
    const parsed = new URL(value);
    const name = parsed.pathname.split('/').filter(Boolean).pop();
    return name ?? 'Archivo adjunto';
  } catch {
    const parts = value.split('/').filter(Boolean);
    return parts.pop() ?? 'Archivo adjunto';
  }
};

const createAttachmentId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
};

type AnyAttachment = ComposerAttachment | FeedAttachment;

const getAttachmentUrl = (attachment: AnyAttachment): string => {
  if ('dataUrl' in attachment) {
    return attachment.dataUrl;
  }
  // Resolver la URL del attachment para asegurar que sea una URL completa
  const resolved = resolveAssetUrl(attachment.url);
  return resolved ?? attachment.url;
};

const getAttachmentLabel = (attachment: AnyAttachment): string => {
  if ('fileName' in attachment && attachment.fileName) {
    return attachment.fileName;
  }
  return extractFileName('url' in attachment ? attachment.url : attachment.dataUrl);
};

const renderAttachmentMedia = (attachment: AnyAttachment, className?: string) => {
  const url = getAttachmentUrl(attachment);
  const mediaType = detectMediaType(url);
  if (mediaType === 'image') {
    return <img src={url} alt={getAttachmentLabel(attachment)} className={classNames('h-full w-full object-cover', className)} />;
  }
  if (mediaType === 'video') {
    return (
      <video src={url} className={classNames('h-full w-full bg-black object-cover', className)} controls muted playsInline preload="metadata" />
    );
  }
  const label = mediaType === 'pdf' ? 'Documento PDF' : 'Archivo adjunto';
  return (
    <div
      className={classNames(
        'flex h-full w-full items-center gap-2 rounded-xl bg-white/80 p-3 text-left text-[var(--color-text)] shadow-inner',
        className
      )}
    >
      <FileText className="h-6 w-6 text-sena-green" />
      <div className="min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] text-[var(--color-muted)] truncate">{getAttachmentLabel(attachment)}</p>
      </div>
    </div>
  );
};

type ReportTarget =
  | { type: 'post'; post: FeedPostAggregate }
  | { type: 'comment'; post: FeedPostAggregate; comment: FeedComment };

export const HomePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [storyMediaUrls, setStoryMediaUrls] = useState<string[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isStoryMenuOpen, setIsStoryMenuOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [composerSuccessMessage, setComposerSuccessMessage] = useState<string | null>(null);
  const [commentsCache, setCommentsCache] = useState<Record<string, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [shareTarget, setShareTarget] = useState<FeedPostAggregate | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [shareScope, setShareScope] = useState<ShareScope>('feed');
  const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null);
  const [commentMenuOpenId, setCommentMenuOpenId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<FeedPostAggregate | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [reactionPickerPost, setReactionPickerPost] = useState<string | null>(null);
  const reactionPickerTimeout = useRef<number | null>(null);
  const [commentAttachments, setCommentAttachments] = useState<Record<string, ComposerAttachment | null>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<{ type: 'composer' } | { type: 'comment'; postId: string } | null>(null);
  const [commentModalPost, setCommentModalPost] = useState<FeedPostAggregate | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);
  const storyUrlsRef = useRef<string[]>([]);
  const postMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentFileInputsRef = useRef<Record<string, Partial<Record<AttachmentKind, HTMLInputElement | null>>>>({});
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userDisplayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'FlorteApp';
  const composerAvatarUrl =
    resolveAssetUrl(user?.avatarUrl) ??
    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(userDisplayName)}.svg`;

  const appendEmoji = (value: string, emoji: string) => {
    const trimmed = value.trimEnd();
    return trimmed ? `${trimmed} ${emoji} ` : `${emoji} `;
  };

  const handleClearAttachments = () => {
    setComposerAttachments([]);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setComposerAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const handleOpenStoryPicker = () => {
    storyFileInputRef.current?.click();
  };

  const handleStoryFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setStoryMediaUrls((previous) => {
      const next = [...previous, nextUrl];
      setCurrentStoryIndex(next.length - 1);
      return next;
    });
    event.target.value = '';
    setIsStoryViewerOpen(true);
    setIsStoryMenuOpen(false);
  };

  const handleStoryClick = () => {
    if (!storyMediaUrls.length) {
      handleOpenStoryPicker();
      return;
    }
    setIsStoryViewerOpen(true);
    setIsStoryMenuOpen(false);
  };

  const handleDeleteStory = () => {
    setIsStoryViewerOpen(false);
    setIsStoryMenuOpen(false);
    setStoryMediaUrls((previous) => {
      const toRemove = previous[currentStoryIndex];
      if (toRemove?.startsWith('blob:')) {
        URL.revokeObjectURL(toRemove);
      }
      const next = previous.filter((_, index) => index !== currentStoryIndex);
      const nextIndex = Math.max(0, Math.min(currentStoryIndex, next.length - 1));
      setCurrentStoryIndex(nextIndex);
      if (!next.length) {
        setIsStoryViewerOpen(false);
      }
      return next;
    });
  };

  const triggerCommentFileInput = (postId: string, kind: AttachmentKind) => {
    commentFileInputsRef.current[postId]?.[kind]?.click();
  };

  const handleCommentToolClick = (postId: string, action: ComposerToolAction) => {
    if (action === 'image') {
      triggerCommentFileInput(postId, 'image');
      return;
    }
    if (action === 'video') {
      triggerCommentFileInput(postId, 'video');
      return;
    }
    if (action === 'document') {
      triggerCommentFileInput(postId, 'document');
      return;
    }
    if (action === 'emoji') {
      setEmojiPickerTarget((current) =>
        current?.type === 'comment' && current.postId === postId ? null : { type: 'comment', postId }
      );
    }
  };

  const handleNavigateToProfile = (targetUserId: string) => {
    if (!targetUserId) return;
    if (user?.id === targetUserId) {
      navigate('/profile');
      return;
    }
    navigate(`/profile/${targetUserId}`);
  };

  const closeEmojiPicker = () => setEmojiPickerTarget(null);

  const handleEmojiSelect = (emoji: string) => {
    if (!emojiPickerTarget) return;
    if (emojiPickerTarget.type === 'composer') {
      setComposerContent((prev) => appendEmoji(prev, emoji));
    } else {
      setCommentInputs((prev) => {
        const current = prev[emojiPickerTarget.postId] ?? '';
        return { ...prev, [emojiPickerTarget.postId]: appendEmoji(current, emoji) };
      });
    }
    closeEmojiPicker();
  };

  const handleReactionHover = (postId: string) => {
    if (reactionPickerTimeout.current) {
      window.clearTimeout(reactionPickerTimeout.current);
    }
    setReactionPickerPost(postId);
  };

  const handleReactionPickerLeave = () => {
    if (reactionPickerTimeout.current) {
      window.clearTimeout(reactionPickerTimeout.current);
    }
    reactionPickerTimeout.current = window.setTimeout(() => setReactionPickerPost(null), 200);
  };

  const handleReactionSelect = (postId: string, reactionType: ReactionType) => {
    reactionMutation.mutate({ postId, reactionType });
    setReactionPickerPost(null);
  };

  useEffect(() => {
    storyUrlsRef.current = storyMediaUrls;
  }, [storyMediaUrls]);

  useEffect(() => {
    return () => {
      storyUrlsRef.current.forEach((url) => {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!composerSuccessMessage) return;
    const timeout = window.setTimeout(() => setComposerSuccessMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [composerSuccessMessage]);

  useEffect(() => {
    if (announcementSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcementSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!emojiPickerTarget) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current?.contains(event.target as Node)) {
        return;
      }
      setEmojiPickerTarget(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emojiPickerTarget]);

  useEffect(() => {
    if (emojiPickerTarget?.type !== 'comment') return;
    if (!commentModalPost || commentModalPost.id !== emojiPickerTarget.postId) {
      setEmojiPickerTarget(null);
    }
  }, [emojiPickerTarget, commentModalPost]);

  useEffect(() => {
    const state = location.state as { openComposer?: boolean } | null;
    if (state?.openComposer) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => composerInputRef.current?.focus(), 120);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const registerPostMenuRef = (postId: string, element: HTMLDivElement | null) => {
    postMenuRefs.current[postId] = element;
  };

  const registerCommentMenuRef = (commentId: string, element: HTMLDivElement | null) => {
    commentMenuRefs.current[commentId] = element;
  };

  useEffect(() => {
    if (!postMenuOpenId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (postMenuRefs.current[postMenuOpenId]?.contains(event.target as Node)) {
        return;
      }
      setPostMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [postMenuOpenId]);

  useEffect(() => {
    if (!commentMenuOpenId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (commentMenuRefs.current[commentMenuOpenId]?.contains(event.target as Node)) {
        return;
      }
      setCommentMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [commentMenuOpenId]);

  const registerCommentFileInput = (postId: string, kind: AttachmentKind, element: HTMLInputElement | null) => {
    if (!commentFileInputsRef.current[postId]) {
      commentFileInputsRef.current[postId] = {};
    }
    commentFileInputsRef.current[postId][kind] = element;
  };

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: chatService.listChats
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

  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
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
    mutationFn: (payload: {
      content: string;
      mediaUrl?: string | null;
      tags?: string[];
      attachments?: Array<{ url: string; mimeType?: string | null }>;
    }) => feedService.createPost(payload),
    onSuccess: (post) => {
      queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) =>
        existing ? [post, ...existing] : [post]
      );
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'recent-posts'] });
      setComposerContent('');
      handleClearAttachments();
      setComposerSuccessMessage('Tu publicacion se ha subido correctamente.');
    },
    onError: (error) => {
      console.error('No fue posible publicar el contenido', error);
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, payload }: { postId: string; payload: { content?: string; mediaUrl?: string | null; tags?: string[] } }) =>
      feedService.updatePost(postId, payload),
    onSuccess: (post) => {
      updatePostInCache(post.id, () => post);
      setEditingPost(null);
      setEditingPostContent('');
      setComposerSuccessMessage('Tu publicacion se actualizo correctamente.');
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible actualizar la publicacion', error);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => feedService.deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) =>
        existing ? existing.filter((post) => post.id !== postId) : []
      );
      setComposerSuccessMessage('Publicacion eliminada correctamente.');
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible eliminar la publicacion', error);
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
      setComposerSuccessMessage(
        metrics.isSaved ? 'Publicacion guardada en tu coleccion.' : 'Publicacion removida de tus guardados.'
      );
    },
    onError: (error) => {
      console.error('No fue posible actualizar el guardado', error);
    }
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content, attachmentUrl }: { postId: string; content: string; attachmentUrl?: string | null }) =>
      feedService.comment(postId, { content, attachmentUrl }),
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
      setCommentAttachments((prev) => ({ ...prev, [postId]: null }));
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible enviar el comentario', error);
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ postId, commentId, content }: { postId: string; commentId: string; content: string }) =>
      feedService.updateComment(postId, commentId, content),
    onSuccess: (comment, { postId }) => {
      setCommentsCache((prev) => {
        const existing = prev[postId] ?? [];
        const updated = existing.map((entry) => (entry.id === comment.id ? comment : entry));
        return { ...prev, [postId]: updated };
      });
      updatePostInCache(postId, (post) => ({
        ...post,
        latestComments: post.latestComments.map((entry) => (entry.id === comment.id ? comment : entry))
      }));
      setEditingCommentId(null);
      setEditingCommentContent('');
      setCommentMenuOpenId(null);
    },
    onError: (error) => {
      console.error('No fue posible actualizar el comentario', error);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      feedService.deleteComment(postId, commentId),
    onSuccess: (metrics, { postId, commentId }) => {
      setCommentsCache((prev) => {
        const existing = prev[postId] ?? [];
        return { ...prev, [postId]: existing.filter((comment) => comment.id !== commentId) };
      });
      updatePostInCache(postId, (post) => ({
        ...post,
        reactionCount: metrics.reactionCount,
        commentCount: metrics.commentCount,
        shareCount: metrics.shareCount,
        viewerReaction: metrics.viewerReaction,
        isSaved: metrics.isSaved,
        latestComments: post.latestComments.filter((comment) => comment.id !== commentId)
      }));
      setEditingCommentId(null);
      setEditingCommentContent('');
      setCommentMenuOpenId(null);
    },
    onError: (error) => {
      console.error('No fue posible eliminar el comentario', error);
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
      setShareScope('feed');
      setComposerSuccessMessage('La publicacion se compartio con tu comunidad.');
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      console.error('No fue posible compartir la publicacion', error);
    }
  });

  const reportMutation = useMutation({
    mutationFn: (payload: { postId: string; reason: string; details?: string; commentId?: string }) =>
      feedService.report(payload.postId, {
        reason: payload.reason,
        details: payload.details,
        commentId: payload.commentId
      }),
    onSuccess: () => {
      setComposerSuccessMessage('Tu reporte fue enviado al equipo de moderacion.');
      setReportTarget(null);
      setReportDetails('');
      setReportReason(reportReasons[0]);
      setReportError(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }).catch(() => { });
    },
    onError: (error) => {
      console.error('No fue posible enviar el reporte', error);
      setReportError('No fue posible enviar el reporte. Intentalo nuevamente.');
    }
  });

  const handleComposerSubmit = () => {
    const trimmedContent = composerContent.trim();
    if (createPostMutation.isPending) return;
    const hasAttachments = composerAttachments.length > 0;
    if (!trimmedContent && !hasAttachments) return;
    createPostMutation.mutate({
      content: trimmedContent || 'Adjunto multimedia',
      mediaUrl: composerAttachments[0]?.dataUrl ?? undefined,
      attachments: composerAttachments.length
        ? composerAttachments.map(({ dataUrl, mimeType }) => ({ url: dataUrl, mimeType }))
        : undefined
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>, kind: AttachmentKind) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') return;
        setComposerAttachments((prev) => [
          ...prev,
          {
            id: createAttachmentId(),
            kind,
            dataUrl,
            fileName: file.name,
            mimeType: file.type
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleCommentFileChange = (postId: string, event: ChangeEvent<HTMLInputElement>, kind: AttachmentKind) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      setCommentAttachments((prev) => ({
        ...prev,
        [postId]: {
          id: createAttachmentId(),
          kind,
          dataUrl,
          fileName: file.name,
          mimeType: file.type
        }
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleClearCommentAttachment = (postId: string) => {
    setCommentAttachments((prev) => ({ ...prev, [postId]: null }));
    const refs = commentFileInputsRef.current[postId];
    if (refs) {
      Object.values(refs).forEach((input) => {
        if (input) input.value = '';
      });
    }
  };

  const ensureCommentsLoaded = async (postId: string) => {
    if (commentsCache[postId]) return;
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const comments = await feedService.listComments(postId);
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setCommentsCache((prev) => ({ ...prev, [postId]: comments }));
    } catch {
      // ignore - keep fallback comments
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleOpenCommentsModal = async (post: FeedPostAggregate) => {
    await ensureCommentsLoaded(post.id);
    setCommentModalPost(post);
  };

  const handleCloseCommentsModal = () => {
    setCommentModalPost(null);
    setEmojiPickerTarget((current) => (current?.type === 'comment' ? null : current));
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = (postId: string) => {
    const rawContent = (commentInputs[postId] ?? '').trim();
    const attachment = commentAttachments[postId] ?? null;
    const content = rawContent || (attachment ? 'Adjunto multimedia' : '');
    if (!content) return;
    commentMutation.mutate({ postId, content, attachmentUrl: attachment?.dataUrl });
  };

  const handleShareSubmit = () => {
    if (!shareTarget || shareMutation.isPending) return;
    shareMutation.mutate({
      postId: shareTarget.id,
      message: shareMessage.trim() ? shareMessage.trim() : undefined
    });
  };

  const handlePostMenuToggle = (postId: string) => {
    setPostMenuOpenId((previous) => (previous === postId ? null : postId));
  };

  const openReportModal = (target: ReportTarget) => {
    setReportTarget(target);
    setReportReason(reportReasons[0]);
    setReportDetails('');
    setReportError(null);
    setPostMenuOpenId(null);
    setCommentMenuOpenId(null);
  };

  const handleOpenReportForPost = (post: FeedPostAggregate) => {
    openReportModal({ type: 'post', post });
  };

  const handleOpenReportForComment = (post: FeedPostAggregate, comment: FeedComment) => {
    openReportModal({ type: 'comment', post, comment });
  };

  const handleCloseReportModal = () => {
    if (reportMutation.isPending) return;
    setReportTarget(null);
    setReportDetails('');
    setReportReason(reportReasons[0]);
    setReportError(null);
  };

  const handleSubmitReport = () => {
    if (!reportTarget || reportMutation.isPending) return;
    if (!reportReason.trim()) {
      setReportError('Selecciona un motivo para continuar.');
      return;
    }
    setReportError(null);
    reportMutation.mutate({
      postId: reportTarget.post.id,
      reason: reportReason,
      details: reportDetails.trim() ? reportDetails.trim() : undefined,
      commentId: reportTarget.type === 'comment' ? reportTarget.comment.id : undefined
    });
  };

  const handleStartEditPost = (post: FeedPostAggregate) => {
    setEditingPost(post);
    setEditingPostContent(post.content);
    setPostMenuOpenId(null);
  };

  const handleCancelEditPost = () => {
    setEditingPost(null);
    setEditingPostContent('');
  };

  const handleConfirmEditPost = () => {
    if (!editingPost) return;
    const trimmed = editingPostContent.trim();
    if (!trimmed) return;
    updatePostMutation.mutate({ postId: editingPost.id, payload: { content: trimmed } });
  };

  const handleDeletePost = (post: FeedPostAggregate) => {
    if (!window.confirm('¿Deseas eliminar esta publicación?')) return;
    deletePostMutation.mutate(post.id);
    setPostMenuOpenId(null);
  };

  const handleStartEditComment = (postId: string, comment: FeedComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    setCommentMenuOpenId(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleConfirmEditComment = (postId: string) => {
    if (!editingCommentId) return;
    const trimmed = editingCommentContent.trim();
    if (!trimmed) return;
    updateCommentMutation.mutate({ postId, commentId: editingCommentId, content: trimmed });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (!window.confirm('¿Deseas eliminar este comentario?')) return;
    deleteCommentMutation.mutate({ postId, commentId });
  };

  const handleCopyPostLink = async (post: FeedPostAggregate) => {
    const url = `${window.location.origin}/dashboard?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setComposerSuccessMessage('Enlace copiado al portapapeles.');
    } catch {
      setComposerSuccessMessage('No fue posible copiar el enlace.');
    } finally {
      setPostMenuOpenId(null);
    }
  };

  const isPublishing = createPostMutation.isPending;
  const isSharing = shareMutation.isPending;

  const handleComposerToolClick = (action: ComposerToolAction) => {
    if (action === 'image') {
      imageInputRef.current?.click();
      return;
    }
    if (action === 'video') {
      videoInputRef.current?.click();
      return;
    }
    if (action === 'document') {
      documentInputRef.current?.click();
      return;
    }
    if (action === 'emoji') {
      setEmojiPickerTarget((current) => (current?.type === 'composer' ? null : { type: 'composer' }));
    }
  };

  const handleOpenShare = (post: FeedPostAggregate) => {
    setShareTarget(post);
    setShareMessage('');
    setShareScope('feed');
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

  const renderPostCard = (post: FeedPostAggregate, context: 'list' | 'modal' = 'list') => {
    const comments = commentsCache[post.id] ?? post.latestComments;
    const isReacting = reactionMutation.isPending && reactionMutation.variables?.postId === post.id;
    const isSavingPost = saveMutation.isPending && saveMutation.variables === post.id;
    const isCommenting = commentMutation.isPending && commentMutation.variables?.postId === post.id;
    const viewerHasReaction = Boolean(post.viewerReaction);
    const formattedTime = formatTimeAgo(post.createdAt);
    const authorAvatar =
      resolveAssetUrl(post.author.avatarUrl) ??
      `https://avatars.dicebear.com/api/initials/${encodeURIComponent(post.author.fullName)}.svg`;
    const reactionLabel = post.reactionCount === 1 ? 'reaccion' : 'reacciones';
    const commentLabel = post.commentCount === 1 ? 'comentario' : 'comentarios';
    const shareLabel = post.shareCount === 1 ? 'compartido' : 'compartidos';
    const attachmentsFromPost =
      post.attachments?.length
        ? post.attachments
        : post.mediaUrl
          ? [
            {
              id: `${post.id}-legacy`,
              postId: post.id,
              url: post.mediaUrl,
              mimeType: null,
              createdAt: post.createdAt
            }
          ]
          : [];
    const canManagePost = user?.role === 'admin' || user?.id === post.authorId;
    const viewerReactionType = post.viewerReaction === 'support' ? 'celebrate' : post.viewerReaction;
    const selectedReaction = reactionOptions.find((option) => option.type === viewerReactionType);
    const ReactionIconComponent = selectedReaction?.icon ?? Heart;
    const reactionButtonLabel = selectedReaction?.label ?? 'Reaccionar';
    const wasEdited = post.updatedAt && post.updatedAt !== post.createdAt;
    const commentAttachment = commentAttachments[post.id] ?? null;
    const commentInputValue = commentInputs[post.id] ?? '';
    const canSendComment = Boolean(commentInputValue.trim()) || Boolean(commentAttachment);
    const isModal = context === 'modal';
    const hasReactions = post.reactionCount > 0;
    const hasComments = post.commentCount > 0;
    const hasShares = post.shareCount > 0;
    const showStatsRow = hasReactions || hasComments || hasShares;

    return (
      <Card
        key={`${context}-${post.id}`}
        className="relative overflow-visible space-y-4 glass-liquid"
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => handleNavigateToProfile(post.authorId)}
            className="h-11 w-11 overflow-hidden rounded-full glass-liquid p-[1px] transition hover:border-sena-green/50"
          >
            <img src={authorAvatar} alt={post.author.fullName} className="h-full w-full rounded-full object-cover" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigateToProfile(post.authorId)}
                className="text-left text-sm font-semibold text-[var(--color-text)] transition hover:text-sena-green"
              >
                {post.author.fullName}
              </button>
              {wasEdited && <span className="text-[11px] text-[var(--color-muted)]">(Editado)</span>}
            </div>
            {post.author.headline && (
              <p className="text-xs text-[var(--color-muted)] truncate">{post.author.headline}</p>
            )}
            <p className="text-[11px] text-[var(--color-muted)]">{formattedTime}</p>
          </div>
          <div className="relative" ref={(element) => registerPostMenuRef(post.id, element)}>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/30 hover:text-sena-green"
              aria-haspopup="true"
              aria-expanded={postMenuOpenId === post.id}
              onClick={() => handlePostMenuToggle(post.id)}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {postMenuOpenId === post.id && (
              <div className="absolute right-0 top-9 z-20 w-48 rounded-2xl glass-liquid-strong p-2 text-sm text-[var(--color-text)]">
                {canManagePost && (
                  <button
                    type="button"
                    onClick={() => handleStartEditPost(post)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                  >
                    <FileText className="h-4 w-4 text-sena-green" /> Editar publicacion
                  </button>
                )}
                {canManagePost && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-rose-50/80"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" /> Eliminar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenReportForPost(post)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                >
                  <Flag className="h-4 w-4 text-rose-500" /> Reportar publicacion
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyPostLink(post)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                >
                  <Share2 className="h-4 w-4 text-sena-green" /> Copiar enlace
                </button>
              </div>
            )}
          </div>
        </div>

        {post.content && (
          <p className="whitespace-pre-line text-sm text-[var(--color-text)]">{post.content}</p>
        )}

        {attachmentsFromPost.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachmentsFromPost.map((attachment) => (
              <div
                key={attachment.id}
                className={classNames(
                  'relative overflow-hidden rounded-2xl glass-liquid',
                  attachmentsFromPost.length === 1 ? 'w-full' : 'w-full sm:w-[calc(50%-4px)]'
                )}
              >
                {renderAttachmentMedia(attachment, 'h-full w-full')}
              </div>
            ))}
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

        {showStatsRow && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)] sm:text-sm">
            {hasReactions && (
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <Heart
                  className={classNames('h-4 w-4', viewerHasReaction ? 'text-sena-green' : 'text-rose-500')}
                />
                <span>
                  {post.reactionCount} {reactionLabel}
                </span>
              </div>
            )}
            {(hasComments || hasShares) && (
              <div className="ml-auto flex items-center gap-4 text-[var(--color-text)]">
                {hasComments && (
                  <button
                    type="button"
                    onClick={() => void handleOpenCommentsModal(post)}
                    className={classNames(
                      'text-left underline-offset-2 transition hover:text-sena-green',
                      isModal && 'cursor-default text-sena-green'
                    )}
                    disabled={isModal}
                  >
                    {post.commentCount} {commentLabel}
                  </button>
                )}
                {hasShares && (
                  <span>
                    {post.shareCount} {shareLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <div className="relative sm:flex-1" onMouseLeave={handleReactionPickerLeave}>
            <Button
              variant="ghost"
              className={classNames(
                'w-full justify-center gap-2 text-xs sm:text-sm min-h-[38px] min-w-[110px]',
                viewerHasReaction && 'text-sena-green'
              )}
              onMouseEnter={() => handleReactionHover(post.id)}
              onClick={() => reactionMutation.mutate({ postId: post.id, reactionType: 'like' })}
              disabled={isReacting}
              loading={isReacting}
            >
              <ReactionIconComponent
                className={classNames(
                  'h-4 w-4',
                  selectedReaction?.color ?? (viewerHasReaction ? 'text-sena-green' : 'text-rose-500')
                )}
              />
              {reactionButtonLabel}
            </Button>
            {reactionPickerPost === post.id && (
              <div
                className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 translate-y-2 rounded-2xl glass-liquid-strong px-4 py-3"
                onMouseEnter={() => handleReactionHover(post.id)}
              >
                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap sm:gap-3 hide-scrollbar">
                  {reactionOptions.map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-white/50 bg-white px-3 py-1 text-xs font-semibold text-[var(--color-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-sena-green/60 dark:bg-slate-900/90"
                      onClick={() => handleReactionSelect(post.id, type)}
                    >
                      <Icon className={classNames('h-4 w-4', color)} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={classNames(
              'justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm',
              isModal && 'cursor-default text-sena-green'
            )}
            onClick={() => {
              if (isModal) return;
              void handleOpenCommentsModal(post);
            }}
            disabled={isModal}
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
              'justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm min-h-[38px] min-w-[110px]',
              post.isSaved && 'text-sena-green'
            )}
            onClick={() => saveMutation.mutate(post.id)}
            disabled={isSavingPost}
            loading={isSavingPost}
          >
            <Bookmark className="h-4 w-4" /> {post.isSaved ? 'Guardado' : 'Guardar'}
          </Button>
        </div>

        {isModal && (
          <div className="space-y-3 rounded-2xl glass-liquid px-3 py-3">
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
                    resolveAssetUrl(comment.author.avatarUrl) ??
                    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(comment.author.fullName)}.svg`;
                  const resolvedCommentAttachmentUrl = comment.attachmentUrl ? resolveAssetUrl(comment.attachmentUrl) : null;
                  const commentAttachmentType = resolvedCommentAttachmentUrl ? detectMediaType(resolvedCommentAttachmentUrl) : null;
                  const commentAttachmentName = resolvedCommentAttachmentUrl ? extractFileName(resolvedCommentAttachmentUrl) : '';
                  const isEditingComment = editingCommentId === comment.id;
                  const canManageComment = user?.role === 'admin' || user?.id === comment.userId;
                  return (
                    <div key={comment.id} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleNavigateToProfile(comment.userId)}
                        className="h-8 w-8 overflow-hidden rounded-full glass-liquid p-[1px] transition hover:border-sena-green/50"
                      >
                        <img src={commentAvatar} alt={comment.author.fullName} className="h-full w-full rounded-full object-cover" />
                      </button>
                      <div className="relative flex-1 rounded-2xl glass-liquid px-3 py-2 text-xs text-[var(--color-text)]">
                        {isEditingComment ? (
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              value={editingCommentContent}
                              onChange={(event) => setEditingCommentContent(event.target.value)}
                              className="w-full resize-none rounded-xl glass-liquid px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleConfirmEditComment(post.id)}
                                loading={updateCommentMutation.isPending}
                                disabled={updateCommentMutation.isPending}
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEditComment}
                                disabled={updateCommentMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => handleNavigateToProfile(comment.userId)}
                                className="text-left font-semibold text-[var(--color-text)] transition hover:text-sena-green"
                              >
                                {comment.author.fullName}
                              </button>
                              <div
                                className="absolute right-3 top-3"
                                ref={(element) => registerCommentMenuRef(comment.id, element)}
                              >
                                <button
                                  type="button"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/30 hover:text-sena-green"
                                  aria-haspopup="true"
                                  aria-expanded={commentMenuOpenId === comment.id}
                                  onClick={() =>
                                    setCommentMenuOpenId((previous) => (previous === comment.id ? null : comment.id))
                                  }
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                                {commentMenuOpenId === comment.id && (
                                  <div className="absolute right-0 top-8 z-20 w-48 rounded-2xl glass-liquid-strong p-2 text-sm text-[var(--color-text)]">
                                    {canManageComment && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditComment(post.id, comment)}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                      >
                                        <FileText className="h-4 w-4 text-sena-green" /> Editar comentario
                                      </button>
                                    )}
                                    {canManageComment && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-rose-50/80"
                                      >
                                        <Trash2 className="h-4 w-4 text-rose-500" /> Eliminar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReportForComment(post, comment)}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                                    >
                                      <Flag className="h-4 w-4 text-rose-500" /> Reportar comentario
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 leading-relaxed">{comment.content}</p>
                            {resolvedCommentAttachmentUrl && (
                              <div className="mt-2 overflow-hidden rounded-xl glass-liquid">
                                {commentAttachmentType === 'image' && (
                                  <img
                                    src={resolvedCommentAttachmentUrl}
                                    alt="Adjunto del comentario"
                                    className="max-h-32 w-full object-cover"
                                  />
                                )}
                                {commentAttachmentType === 'video' && (
                                  <video
                                    src={resolvedCommentAttachmentUrl}
                                    controls
                                    className="max-h-32 w-full bg-black"
                                    preload="metadata"
                                  />
                                )}
                                {commentAttachmentType === 'pdf' && (
                                  <div className="flex flex-col gap-1 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-sena-green" />
                                      <p className="text-xs font-semibold">{commentAttachmentName}</p>
                                    </div>
                                    <a
                                      href={comment.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-semibold text-sena-green underline-offset-2 hover:underline"
                                    >
                                      Ver documento
                                    </a>
                                  </div>
                                )}
                                {commentAttachmentType === 'other' && (
                                  <div className="flex flex-col gap-1 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-sena-green" />
                                      <p className="text-xs font-semibold">{commentAttachmentName}</p>
                                    </div>
                                    <a
                                      href={comment.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-semibold text-sena-green underline-offset-2 hover:underline"
                                    >
                                      Abrir adjunto
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                              {formatTimeAgo(comment.createdAt)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              {commentAttachment && (
                <div className="space-y-2 rounded-2xl glass-liquid px-3 py-2 text-xs text-[var(--color-text)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                        Adjunto en comentario
                      </p>
                      <p className="truncate text-sm font-semibold">{commentAttachment.fileName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClearCommentAttachment(post.id)}
                      className="rounded-full bg-white/40 p-1 text-[var(--color-text)] hover:bg-white/60"
                      aria-label="Quitar adjunto del comentario"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {commentAttachment.kind === 'image' && (
                    <img
                      src={commentAttachment.dataUrl}
                      alt={commentAttachment.fileName}
                      className="max-h-32 w-full rounded-xl object-cover"
                    />
                  )}
                  {commentAttachment.kind === 'video' && (
                    <video
                      src={commentAttachment.dataUrl}
                      controls
                      className="max-h-32 w-full rounded-xl bg-black"
                      preload="metadata"
                    />
                  )}
                  {commentAttachment.kind === 'document' && (
                    <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[var(--color-text)]">
                      <FileText className="h-5 w-5 text-sena-green" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {commentAttachment.fileName.toLowerCase().endsWith('.pdf')
                            ? 'Documento PDF'
                            : 'Archivo adjunto'}
                        </p>
                        <p className="text-[11px] text-[var(--color-muted)] truncate">
                          {commentAttachment.fileName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={commentInputValue}
                  onChange={(event) => handleCommentInputChange(post.id, event.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 resize-none rounded-2xl glass-liquid px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                  disabled={isCommenting}
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmitComment(post.id)}
                  disabled={isCommenting || !canSendComment}
                  loading={isCommenting}
                >
                  Enviar
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex gap-2">
                  {composerIcons.map(({ icon: Icon, label, action }) => {
                    const isEmojiAction = action === 'emoji';
                    const isEmojiOpen =
                      emojiPickerTarget?.type === 'comment' &&
                      emojiPickerTarget.postId === post.id &&
                      isEmojiAction;
                    return (
                      <div
                        key={`${post.id}-${action}`}
                        className={classNames('relative overflow-visible', isEmojiAction && 'z-30')}
                      >
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sena-green transition hover:bg-white/40"
                          aria-label={`${label} comentario`}
                          onClick={() => handleCommentToolClick(post.id, action)}
                          disabled={isCommenting}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                        {isEmojiAction && isEmojiOpen && (
                          <div className="absolute right-0 top-full z-50 mt-2" ref={emojiPickerRef}>
                            <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={closeEmojiPicker} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] text-[var(--color-muted)]">
                  Puedes agregar fotos, videos o emojis.
                </span>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={(element) => registerCommentFileInput(post.id, 'image', element)}
              onChange={(event) => handleCommentFileChange(post.id, event, 'image')}
            />
            <input
              type="file"
              accept="video/*"
              className="hidden"
              ref={(element) => registerCommentFileInput(post.id, 'video', element)}
              onChange={(event) => handleCommentFileChange(post.id, event, 'video')}
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              ref={(element) => registerCommentFileInput(post.id, 'document', element)}
              onChange={(event) => handleCommentFileChange(post.id, event, 'document')}
            />
          </div>
        )}
      </Card>
    );
  };

  const storiesWithAvatars = useMemo(() => {
    if (storyMediaUrls.length) {
      return [
        {
          id: 'uploaded',
          name: userDisplayName || 'Tu historia',
          avatar: storyMediaUrls[0]
        }
      ];
    }
    return [
      {
        id: 'create',
        name: 'Tu historia',
        avatar: resolveAssetUrl(user?.avatarUrl) ?? 'https://i.pravatar.cc/100?img=5'
      }
    ];
  }, [storyMediaUrls, user?.avatarUrl, userDisplayName]);

  const activeModalPost = commentModalPost
    ? feedPosts.find((post) => post.id === commentModalPost.id) ?? commentModalPost
    : null;

  return (
    <DashboardLayout
      fluid
      contentClassName="px-2 sm:px-6 lg:px-10 xl:px-16"
    >
      <AnimatePresence>
        {composerSuccessMessage && (
          <motion.div
            key={composerSuccessMessage}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto fixed inset-x-0 top-24 z-40 mx-auto w-[min(88vw,360px)] rounded-2xl glass-liquid-strong px-5 pb-4 pt-5 text-center text-sm text-[var(--color-text)]"
          >
            <button
              type="button"
              onClick={() => setComposerSuccessMessage(null)}
              className="absolute right-3 top-3 rounded-full bg-slate-900/5 p-1 text-[var(--color-text)] transition hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20"
              aria-label="Cerrar notificacion"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-base font-semibold tracking-wide text-[var(--color-text)]">{composerSuccessMessage}</p>
            <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-2xl bg-transparent">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 2, ease: 'linear' }}
                className="h-full bg-sena-green"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto grid w-full gap-4 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,360px)]">
        <aside className="hidden w-full flex-col gap-5 lg:flex">
          <Card className="glass-liquid p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Actividad rapida</h3>
              <Sparkles className="h-4 w-4 text-sena-green" />
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Accede en segundos a proyectos, grupos y espacios clave de tu comunidad.
            </p>
            <div className="mt-5 space-y-3">
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-between px-4 py-2.5"
                onClick={() => navigate('/explore')}
              >
                Explorar proyectos
                <ArrowUpRight className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between px-4 py-2.5"
                onClick={() => navigate('/groups')}
              >
                Encontrar grupos
                <Users className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between px-4 py-2.5"
                onClick={() => navigate('/projects')}
              >
                Revisar mis proyectos
                <FolderKanban className="h-5 w-5" />
              </Button>
            </div>
          </Card>

          <Card className="glass-liquid p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Avances destacados</h3>
              <Sparkles className="h-4 w-4 text-sena-green" />
            </div>
            <div className="mt-4 space-y-3">
              {learningHighlights.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  Registra tus proyectos para seguir tu progreso.
                </p>
              )}
              {learningHighlights.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl glass-liquid px-4 py-3 transition hover:border-sena-green/40 hover:bg-white/30 dark:hover:bg-white/10"
                >
                  <p className="text-base font-semibold text-[var(--color-text)] truncate">{project.title}</p>
                  <p className="text-xs text-[var(--color-muted)] capitalize mt-1">{project.status}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>



        <section className="mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-5">
          <Card className="overflow-hidden glass-liquid">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text)] sm:text-base">Historias</h2>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 py-1 text-xs text-[var(--color-muted)] hover:text-sena-green"
                onClick={handleOpenStoryPicker}
              >
                Subir
              </Button>
            </div>
            <input
              ref={storyFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleStoryFileChange}
            />
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {storiesWithAvatars.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={handleStoryClick}
                  className="flex w-20 flex-col items-center gap-2.5 text-xs"
                >
                  <div
                    className={`relative h-16 w-16 rounded-full p-[3px] ${storyMediaUrls.length
                      ? 'bg-gradient-to-tr from-sena-green via-sena-light to-emerald-500'
                      : 'bg-gradient-to-tr from-sena-green via-sena-light to-emerald-500'
                      }`}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full border border-[var(--color-surface)] bg-[var(--color-surface)]">
                      {storyMediaUrls.length ? (
                        <img src={story.avatar} alt={story.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <Plus className="h-5 w-5 text-sena-green" />
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--color-text)] text-center leading-tight">
                    {storyMediaUrls.length ? 'Tus historias' : 'Crear historia'}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="relative z-30 overflow-visible glass-liquid">
            <div className="flex items-start gap-3">
              <img
                src={composerAvatarUrl}
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
                  ref={composerInputRef}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {composerIcons.map(({ icon: Icon, label, action }) => {
                      const isEmojiAction = action === 'emoji';
                      const isEmojiOpen = emojiPickerTarget?.type === 'composer' && isEmojiAction;
                      return (
                        <div key={action} className={classNames('relative overflow-visible', isEmojiAction && 'z-30')}>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-sena-green transition hover:shadow-[0_0_18px_rgba(57,169,0,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={label}
                            onClick={() => handleComposerToolClick(action)}
                            disabled={isPublishing}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                          {isEmojiAction && isEmojiOpen && (
                            <div className="absolute right-0 top-full z-[80] mt-3" ref={emojiPickerRef}>
                              <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={closeEmojiPicker} />
                            </div>
                          )}
                        </div>
                      );
                    })}
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

                {composerAttachments.length > 0 && (
                  <div className="space-y-3 rounded-2xl glass-liquid p-3 text-sm text-[var(--color-text)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                          {composerAttachments.length} adjunto{composerAttachments.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm font-semibold text-[var(--color-text)]">Vista previa</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAttachments}
                        className="rounded-full bg-white/40 p-1 text-[var(--color-text)] hover:bg-white/60"
                        aria-label="Quitar adjuntos"
                        disabled={isPublishing}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto px-1 hide-scrollbar">
                      {composerAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative flex h-24 w-24 flex-col overflow-hidden rounded-2xl glass-liquid text-[var(--color-text)]"
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            className="absolute right-1 top-1 z-10 rounded-full bg-white/60 p-0.5 text-[var(--color-muted)] shadow hover:bg-white"
                            aria-label="Eliminar adjunto"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="mx-auto mt-2 h-16 w-16 overflow-hidden rounded-xl">
                            {renderAttachmentMedia(attachment, 'h-full w-full')}
                          </div>
                          <p className="mx-2 mt-1 truncate text-[10px] text-[var(--color-muted)]">
                            {getAttachmentLabel(attachment)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFileInputChange(event, 'image')}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  multiple
                  onChange={(event) => handleFileInputChange(event, 'video')}
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => handleFileInputChange(event, 'document')}
                  multiple
                />
              </div>
            </div>
          </Card>

          {isLoadingFeed && (
            <Card className="glass-liquid p-4 text-sm text-[var(--color-muted)]">
              Cargando publicaciones...
            </Card>
          )}

          {!isLoadingFeed && feedPosts.length === 0 && (
            <Card className="glass-liquid p-4 text-sm text-[var(--color-muted)]">
              Aun no hay publicaciones en tu comunidad. Comparte la primera para iniciar la conversacion.
            </Card>
          )}

          {feedPosts.map((post) => renderPostCard(post, 'list'))}
        </section>

        <aside className="hidden flex-col gap-5 md:flex">
          <Card className="glass-liquid p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Tendencias</h3>
              <Button variant="ghost" size="sm" className="px-3 py-1.5 text-sm">
                Ver todo
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {resources.slice(0, 5).map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-xl glass-liquid px-4 py-3 transition hover:border-sena-green/40 hover:bg-white/35 dark:hover:bg-white/10"
                >
                  <p className="text-base font-semibold text-[var(--color-text)] truncate">{resource.title}</p>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mt-1">
                    {resource.resourceType}
                  </p>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">An no hay recursos recientes.</p>
              )}
            </div>
          </Card>

          <Card className="glass-liquid p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Anuncios</h3>
              <Sparkles className="h-4 w-4 text-sena-green" />
            </div>
            <div className="mt-5 h-80 overflow-hidden rounded-3xl">
              <AnimatePresence initial={false} mode="wait">
                {announcementSlides.map(
                  (slide, index) =>
                    index === activeAnnouncement && (
                      <motion.div
                        key={slide.id}
                        className="h-full w-full"
                        initial={{ opacity: 0.2, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                      >
                        <img
                          src={slide.image}
                          alt={slide.alt}
                          className="h-full w-full rounded-3xl object-cover"
                          loading="lazy"
                        />
                      </motion.div>
                    )
                )}
              </AnimatePresence>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              {announcementSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveAnnouncement(index)}
                  className={classNames(
                    'h-2.5 w-8 rounded-full transition',
                    index === activeAnnouncement ? 'bg-sena-green' : 'glass-liquid'
                  )}
                  aria-label={`Mostrar anuncio ${index + 1}`}
                />
              ))}
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
              <Card padded={false} className="overflow-hidden rounded-3xl glass-liquid-strong">
                <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Mensajes</p>
                    <p className="text-xs text-[var(--color-muted)]">{chats.length} conversaciones activas</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setMessagesOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3 hide-scrollbar">
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

        {isStoryViewerOpen && storyMediaUrls.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => {
              setIsStoryViewerOpen(false);
              setIsStoryMenuOpen(false);
            }}
          >
            <div className="relative flex items-center gap-4" onClick={(event) => event.stopPropagation()}>
              {storyMediaUrls.length > 1 && (
                <button
                  type="button"
                  className="absolute -left-14 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65"
                  onClick={() =>
                    setCurrentStoryIndex((index) => (index - 1 + storyMediaUrls.length) % storyMediaUrls.length)
                  }
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              <div className="relative">
                <img
                  src={storyMediaUrls[currentStoryIndex]}
                  alt="Historia subida"
                  className="max-h-[80vh] max-w-[90vw] rounded-3xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                />
                <button
                  type="button"
                  className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black/80"
                  onClick={handleOpenStoryPicker}
                >
                  <Image className="h-4 w-4" /> Agregar
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-black/70"
                  onClick={() => setIsStoryMenuOpen((prev) => !prev)}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {isStoryMenuOpen && (
                  <div className="absolute right-3 top-14 z-10 w-44 rounded-2xl glass-liquid-strong px-3 py-2 text-sm text-white">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white/10"
                      onClick={handleDeleteStory}
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" /> Eliminar historia
                    </button>
                  </div>
                )}
                {storyMediaUrls.length > 1 && (
                  <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-2">
                    {storyMediaUrls.map((_, index) => (
                      <span
                        key={`story-dot-${index}`}
                        className={classNames(
                          'h-1.5 w-8 rounded-full transition',
                          index === currentStoryIndex ? 'bg-white' : 'bg-white/40'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
              {storyMediaUrls.length > 1 && (
                <button
                  type="button"
                  className="absolute -right-14 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65"
                  onClick={() => setCurrentStoryIndex((index) => (index + 1) % storyMediaUrls.length)}
                  aria-label="Siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
              <button
                type="button"
                className="absolute -top-12 right-0 text-sm text-white/70 underline-offset-4 hover:text-white"
                onClick={() => {
                  setIsStoryViewerOpen(false);
                  setIsStoryMenuOpen(false);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {shareTarget && (
          <GlassDialog
            open={Boolean(shareTarget)}
            onClose={handleCloseShareModal}
            size="lg"
            preventCloseOnBackdrop={isSharing}
            contentClassName={floatingModalContentClass}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Compartir publicacion</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Comparte como en Facebook: elige donde quieres que la vean y añade tu mensaje personal.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleCloseShareModal}
                disabled={isSharing}
                className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
              >
                <X className="h-4 w-4" /> Cerrar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {shareAudienceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setShareScope(option.id)}
                    className={classNames(
                      'rounded-full px-3 py-1 text-xs font-semibold transition',
                      shareScope === option.id
                        ? 'bg-sena-green text-white shadow-[0_10px_20px_rgba(57,169,0,0.25)]'
                        : 'glass-liquid text-[var(--color-text)]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl glass-liquid px-4 py-4 text-sm text-[var(--color-text)]">
                <div className="flex items-start gap-3">
                  <img
                    src={
                      resolveAssetUrl(shareTarget.author.avatarUrl) ??
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
                  <div className="mt-3 overflow-hidden rounded-2xl glass-liquid">
                    <img src={shareTarget.mediaUrl} alt="Vista previa" className="max-h-40 w-full object-cover" />
                  </div>
                )}
              </div>

              <TextArea
                rows={4}
                placeholder={
                  shareScope === 'feed'
                    ? 'Di algo a tu comunidad...'
                    : shareScope === 'chat'
                      ? 'Escribe un mensaje para tus amigos...'
                      : 'Comparte un mensaje con tu grupo...'
                }
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

        {reportTarget && (
          <GlassDialog
            open={Boolean(reportTarget)}
            onClose={handleCloseReportModal}
            size="md"
            preventCloseOnBackdrop={reportMutation.isPending}
            contentClassName={floatingModalContentClass}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Reportar publicacion</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Cuéntanos qué sucede para alertar al equipo de moderacion.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleCloseReportModal}
                disabled={reportMutation.isPending}
                className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
              >
                <X className="h-4 w-4" /> Cerrar
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl glass-liquid border-rose-200/40 bg-rose-50/80 px-3 py-3 text-xs text-rose-900 dark:border-rose-500/20 dark:bg-rose-900/20">
                <p className="text-sm font-semibold text-rose-600">
                  {reportTarget?.type === 'comment' ? 'Estás reportando un comentario de' : 'Estás reportando una publicación de'}
                </p>
                <p className="mt-1 text-base text-rose-900">
                  {reportTarget?.type === 'comment'
                    ? reportTarget.comment.author.fullName
                    : reportTarget?.post.author.fullName}
                </p>
                <p className="text-[11px] text-rose-500">
                  {(reportTarget?.type === 'comment' ? reportTarget.comment.content : reportTarget?.post.content ?? '')
                    .slice(0, 120)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setReportReason(reason);
                      setReportError(null);
                    }}
                    className={classNames(
                      'rounded-full px-3 py-1 text-xs font-semibold transition',
                      reportReason === reason ? 'bg-rose-500 text-white' : 'glass-liquid text-[var(--color-text)]'
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <TextArea
                rows={3}
                placeholder="Describe por que consideras que infringe las normas (opcional)"
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                disabled={reportMutation.isPending}
              />
              {reportError && <p className="text-xs font-semibold text-rose-500">{reportError}</p>}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCloseReportModal} disabled={reportMutation.isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitReport} loading={reportMutation.isPending} disabled={reportMutation.isPending}>
                  Enviar reporte
                </Button>
              </div>
            </div>
          </GlassDialog>
        )}

        {activeModalPost && (
          <GlassDialog
            open={Boolean(activeModalPost)}
            onClose={handleCloseCommentsModal}
            size="xl"
            frameless
            contentClassName="relative mx-auto max-w-5xl overflow-visible border-none bg-transparent p-0 shadow-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 28 }}
              transition={{ type: 'spring', stiffness: 170, damping: 24 }}
              className="relative mx-auto w-full max-w-3xl overflow-visible rounded-[36px] glass-liquid-strong p-6"
            >
              <div className="relative flex flex-col items-center gap-1 pb-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseCommentsModal}
                  className="absolute right-0 top-0"
                  aria-label="Cerrar comentarios"
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-sm uppercase tracking-[0.35em] text-sena-green">Comentarios</p>
                <h3 className="text-xl font-semibold text-[var(--color-text)]">{activeModalPost.author.fullName}</h3>
              </div>
              {renderPostCard(activeModalPost, 'modal')}
            </motion.div>
          </GlassDialog>
        )}

        {editingPost && (
          <GlassDialog
            open={Boolean(editingPost)}
            onClose={handleCancelEditPost}
            size="md"
            preventCloseOnBackdrop={updatePostMutation.isPending}
            contentClassName={floatingModalContentClass}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Editar publicación</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Ajusta el contenido antes de compartir el cambio con tu comunidad.
                </p>
              </div>
              <TextArea
                rows={4}
                value={editingPostContent}
                onChange={(event) => setEditingPostContent(event.target.value)}
                disabled={updatePostMutation.isPending}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCancelEditPost} disabled={updatePostMutation.isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmEditPost} loading={updatePostMutation.isPending} disabled={updatePostMutation.isPending}>
                  Guardar cambios
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
      <Card padded={false} className="flex h-96 flex-col overflow-hidden rounded-3xl glass-liquid-strong">
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
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 hide-scrollbar">
          {isLoading && <p className="text-xs text-[var(--color-muted)]">Cargando mensajes...</p>}
          {!isLoading && messages.length === 0 && (
            <p className="text-xs text-[var(--color-muted)]">An no hay mensajes en este chat.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl glass-liquid px-3 py-2 text-sm text-[var(--color-text)]">
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
              className="flex-1 rounded-2xl glass-liquid px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
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










