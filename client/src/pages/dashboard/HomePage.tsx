import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useMenuState } from '../../contexts/MenuStateContext';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { EmojiPicker } from '../../components/ui/EmojiPicker';
import { UserAvatar } from '../../components/ui/UserAvatar';
import classNames from 'classnames';
import { chatService } from '../../services/chatService';
import { projectService } from '../../services/projectService';
import { libraryService } from '../../services/libraryService';
import { feedService } from '../../services/feedService';
import { friendService } from '../../services/friendService';
import { storyService } from '../../services/storyService';
import { userService } from '../../services/userService';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Flag,
  FolderKanban,
  Heart,
  Image,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Share2,
  Smile,
  Sparkles,
  Trash2,
  Video,
  X,
  Users,
  Users as UsersIcon
} from 'lucide-react';
import { Chat } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
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
  { type: 'like' as ReactionType, label: 'Me gusta', emoji: '👍', color: 'text-sena-green' },
  { type: 'love' as ReactionType, label: 'Me encanta', emoji: '❤️', color: 'text-rose-500' },
  { type: 'insightful' as ReactionType, label: 'Me asombra', emoji: '✨', color: 'text-amber-500' },
  { type: 'celebrate' as ReactionType, label: 'Me divierte', emoji: '🎉', color: 'text-emerald-500' },
  { type: 'support' as ReactionType, label: 'Apoyar', emoji: '💪', color: 'text-indigo-500' }
];

const reportReasons = [
  'Contenido inapropiado',
  'Informacion falsa',
  'Discurso danino o spam',
  'Violacion de derechos',
  'Otro'
];


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
  const toast = useToast();
  const { messagesOpen, setMessagesOpen, setNotificationsOpen } = useMenuState();
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isStoryMenuOpen, setIsStoryMenuOpen] = useState(false);
  const [isStoryViewersOpen, setIsStoryViewersOpen] = useState(false);
  const [storyViewersData, setStoryViewersData] = useState<Record<string, Array<{ id: string; firstName: string; lastName: string; avatarUrl: string | null }>>>({});
  const [viewedStoryUserIds, setViewedStoryUserIds] = useState<Set<string>>(new Set());
  const storyCarouselIntervalRef = useRef<number | null>(null);
  const storyViewsButtonRef = useRef<HTMLButtonElement | null>(null);
  const storyImageContainerRef = useRef<HTMLDivElement | null>(null);
  const storyPanelOriginRef = useRef<{ x: number; y: number }>({ x: 50, y: 100 });
  const [composerContent, setComposerContent] = useState('');
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [composerSuccessMessage, setComposerSuccessMessage] = useState<string | null>(null);
  const [commentsCache, setCommentsCache] = useState<Record<string, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [shareTarget, setShareTarget] = useState<FeedPostAggregate | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [shareToFriendId, setShareToFriendId] = useState<string | null>(null);
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
  const feedSectionRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const [commentAttachments, setCommentAttachments] = useState<Record<string, ComposerAttachment | null>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<{ type: 'composer' } | { type: 'comment'; postId: string } | null>(null);
  const [deletePostTarget, setDeletePostTarget] = useState<FeedPostAggregate | null>(null);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{ postId: string; commentId: string } | null>(null);
  const [commentModalPost, setCommentModalPost] = useState<FeedPostAggregate | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);
  const postMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentFileInputsRef = useRef<Record<string, Partial<Record<AttachmentKind, HTMLInputElement | null>>>>({});
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userDisplayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'FlorteApp';

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
    setIsStoryViewersOpen(false);
    storyFileInputRef.current?.click();
  };

  const createStoryMutation = useMutation({
    mutationFn: (mediaUrl: string) => storyService.createStory(mediaUrl),
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setSelectedStoryUser({ userId: user!.id, stories: [newStory] });
      setCurrentStoryIndex(0);
      setIsStoryViewerOpen(true);
      setIsStoryMenuOpen(false);
      toast.success('Historia publicada');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'No se pudo subir la historia');
    }
  });

  const handleStoryFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      createStoryMutation.mutate(base64String);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const [selectedStoryUser, setSelectedStoryUser] = useState<{ userId: string; stories: StoryData[] } | null>(null);

  const handleStoryClick = (storyItem?: typeof storiesWithAvatars[0]) => {
    if (storyItem?.id === 'create') {
      // Si tiene historias, mostrarlas; si no, abrir el selector de archivos
      if (storyItem.stories && storyItem.stories.length > 0) {
        setSelectedStoryUser({ userId: storyItem.userId!, stories: storyItem.stories });
        setCurrentStoryIndex(0);
        setIsStoryViewerOpen(true);
        setIsStoryMenuOpen(false);
      } else {
        handleOpenStoryPicker();
      }
      return;
    }
    
    if (storyItem?.userId && storyItem.stories && storyItem.stories.length > 0) {
      setSelectedStoryUser({ userId: storyItem.userId, stories: storyItem.stories });
      setCurrentStoryIndex(0);
      setIsStoryViewerOpen(true);
      setIsStoryMenuOpen(false);
    }
  };

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: string) => storyService.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    }
  });

  const handleDeleteStory = () => {
    if (!user?.id || !selectedStoryUser || !selectedStoryUser.stories[currentStoryIndex]) {
      setIsStoryViewerOpen(false);
      setIsStoryMenuOpen(false);
      setSelectedStoryUser(null);
      return;
    }
    const storyToDelete = selectedStoryUser.stories[currentStoryIndex];
    deleteStoryMutation.mutate(storyToDelete.id);
    const updatedStories = selectedStoryUser.stories.filter((s) => s.id !== storyToDelete.id);
    const nextIndex = Math.max(0, Math.min(currentStoryIndex, updatedStories.length - 1));
    if (updatedStories.length > 0) {
      setSelectedStoryUser({ userId: user.id, stories: updatedStories });
      setCurrentStoryIndex(nextIndex);
    } else {
      setIsStoryViewerOpen(false);
      setIsStoryMenuOpen(false);
      setSelectedStoryUser(null);
    }
  };

  const goToNextStory = () => {
    if (!selectedStoryUser?.stories?.length) return;
    setIsStoryViewersOpen(false);
    const next = (currentStoryIndex + 1) % selectedStoryUser.stories.length;
    setCurrentStoryIndex(next);
  };

  const goToPrevStory = () => {
    if (!selectedStoryUser?.stories?.length) return;
    setIsStoryViewersOpen(false);
    setCurrentStoryIndex((i) => (i - 1 + selectedStoryUser.stories.length) % selectedStoryUser.stories.length);
  };

  const STORY_DURATION_MS = 5000;

  useEffect(() => {
    if (!isStoryViewerOpen || !selectedStoryUser?.stories?.length) return;
    const story = selectedStoryUser.stories[currentStoryIndex];
    if (!story) return;
    if (selectedStoryUser.userId !== user?.id) {
      storyService.recordView(story.id).catch(() => {});
    }
    if (selectedStoryUser.userId === user?.id) {
      storyService.getStoryViewers(story.id).then((viewers) => {
        setStoryViewersData((prev) => ({ ...prev, [story.id]: viewers }));
      }).catch(() => {});
    }
    if (selectedStoryUser.stories.length > 1) {
      storyCarouselIntervalRef.current = window.setInterval(goToNextStory, STORY_DURATION_MS);
    }
    return () => {
      if (storyCarouselIntervalRef.current) {
        clearInterval(storyCarouselIntervalRef.current);
        storyCarouselIntervalRef.current = null;
      }
    };
  }, [isStoryViewerOpen, selectedStoryUser?.userId, selectedStoryUser?.stories, currentStoryIndex]);

  const triggerCommentFileInput = (postId: string, kind: AttachmentKind) => {
    commentFileInputsRef.current[postId]?.[kind]?.click();
  };

  const handleCommentToolClick = (postId: string, action: ComposerToolAction, event?: React.MouseEvent) => {
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
      event?.stopPropagation();
      event?.preventDefault();
      // Si ya está abierto para este post, cerrarlo
      if (emojiPickerTarget?.type === 'comment' && emojiPickerTarget.postId === postId) {
        // Usar setTimeout para evitar conflictos con handleClickOutside
        setTimeout(() => setEmojiPickerTarget(null), 0);
      } else {
        // Abrirlo para este post, cerrando cualquier otro
        setEmojiPickerTarget({ type: 'comment', postId });
      }
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

  const handleReactionSelect = (postId: string, reactionType: ReactionType, currentReaction: ReactionType | null) => {
    reactionMutation.mutate({ postId, reactionType });
    setReactionPickerPost(null);
  };

  // Prevenir salto visual al cargar la página
  useEffect(() => {
    // Asegurar que la página inicie en la parte superior sin animación
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, []);


  useEffect(() => {
    if (!composerSuccessMessage) return;
    const timeout = window.setTimeout(() => setComposerSuccessMessage(null), 1500);
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
      const target = event.target as Node;
      // No cerrar si el click es en el emoji picker
      if (emojiPickerRef.current?.contains(target)) {
        return;
      }
      // No cerrar si el click es en el botón del emoji que lo abrió
      if (emojiPickerTarget.type === 'comment') {
        const emojiButton = emojiButtonRefs.current[emojiPickerTarget.postId];
        if (emojiButton?.contains(target)) {
          // Si el click es en el botón, dejar que el onClick del botón maneje el cierre
          return;
        }
      }
      setEmojiPickerTarget(null);
    };
    // Usar un pequeño delay para evitar conflictos con el onClick del botón
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 150);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
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

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.listProjects
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
  const topProjects = useMemo(() => {
    // Obtener los 3 mejores proyectos (por ahora los primeros 3, ordenados por fecha de actualización)
    return [...allProjects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [allProjects]);

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
      // Agregar el post sin ajustar el scroll para evitar cualquier movimiento
      queryClient.setQueryData<FeedPostAggregate[]>(feedQueryKey, (existing) =>
        existing ? [post, ...existing] : [post]
      );

      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'recent-posts'] });
      setComposerContent('');
      handleClearAttachments();
      
      // Mostrar mensaje de éxito
      setComposerSuccessMessage('Tu publicacion se ha subido correctamente.');
    },
    onError: (error) => {
      toast.error('No fue posible publicar el contenido');
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
      toast.error('No fue posible actualizar la publicación');
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
      toast.error('No fue posible eliminar la publicación');
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
        isSaved: metrics.isSaved,
        reactionBreakdown: metrics.reactionBreakdown
      }));
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (error) => {
      toast.error('No fue posible actualizar la reacción');
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
      toast.error('No fue posible actualizar el guardado');
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
      toast.error('No fue posible enviar el comentario');
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
      toast.error('No fue posible actualizar el comentario');
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
      toast.error('No fue posible eliminar el comentario');
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
      setShareToFriendId(null);
      setComposerSuccessMessage('La publicacion se compartio con tu comunidad.');
      void queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: () => {
      toast.error('No fue posible compartir la publicación');
    }
  });

  const shareToChatMutation = useMutation({
    mutationFn: async ({
      friendId,
      message,
      postId
    }: {
      friendId: string;
      message: string;
      postId: string;
    }) => {
      const chat = await chatService.createChat({
        isGroup: false,
        memberIds: [friendId]
      });
      await chatService.sendMessage(chat.id, {
        content: message.trim() || '',
        sharedPostId: postId
      });
      return chat;
    },
    onSuccess: () => {
      setShareTarget(null);
      setShareMessage('');
      setShareToFriendId(null);
      toast.success('Publicación compartida en el chat');
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
      void queryClient.invalidateQueries({ queryKey: ['home', 'chat'] });
    },
    onError: () => {
      toast.error('No fue posible enviar al chat');
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
      toast.error('No fue posible enviar el reporte');
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
    if (!shareTarget || shareToChatMutation.isPending) return;
    if (!shareToFriendId) {
      toast.error('Selecciona un amigo para compartir');
      return;
    }
    shareToChatMutation.mutate({
      friendId: shareToFriendId,
      message: shareMessage.trim(),
      postId: shareTarget.id
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
    setDeletePostTarget(post);
    setPostMenuOpenId(null);
  };

  const handleConfirmDeletePost = () => {
    if (!deletePostTarget) return;
    deletePostMutation.mutate(deletePostTarget.id);
    setDeletePostTarget(null);
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
    setDeleteCommentTarget({ postId, commentId });
    setCommentMenuOpenId(null);
  };

  const handleConfirmDeleteComment = () => {
    if (!deleteCommentTarget) return;
    deleteCommentMutation.mutate(deleteCommentTarget);
    setDeleteCommentTarget(null);
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
  const isSharing = shareMutation.isPending || shareToChatMutation.isPending;

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
    setShareToFriendId(null);
  };

  const handleCloseShareModal = () => {
    if (shareMutation.isPending || shareToChatMutation.isPending) return;
    setShareTarget(null);
    setShareMessage('');
    setShareToFriendId(null);
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
    const selectedReaction = reactionOptions.find((option) => option.type === (post.viewerReaction ?? viewerReactionType));
    const reactionEmoji = selectedReaction?.emoji ?? '❤️';
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
        data-post-id={post.id}
        className="relative overflow-visible space-y-3 glass-liquid p-4 sm:space-y-4 sm:p-5 lg:p-6 post-card-shadow"
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleNavigateToProfile(post.authorId)}
            className="flex-shrink-0 overflow-visible transition hover:scale-105 sm:h-11 sm:w-11"
          >
            <UserAvatar
              fullName={post.author.fullName}
              avatarUrl={post.author.avatarUrl}
              size="md"
            />
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
              <div className="absolute right-0 top-9 z-20 w-48 rounded-2xl glass-frosted p-2 text-sm text-[var(--color-text)]">
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
                {post.reactionBreakdown && post.reactionBreakdown.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {post.reactionBreakdown.slice(0, 3).map((reaction) => {
                      const reactionOption = reactionOptions.find(opt => opt.type === reaction.type);
                      const emoji = reactionOption?.emoji ?? '❤️';
                      return (
                        <div key={reaction.type} className="flex items-center gap-1" title={reactionOption?.label}>
                          <span className="text-base leading-none" aria-hidden>{emoji}</span>
                        </div>
                      );
                    })}
                    <span className="ml-0.5">
                      {post.reactionCount} {reactionLabel}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-base leading-none" aria-hidden>❤️</span>
                    <span>
                      {post.reactionCount} {reactionLabel}
                    </span>
                  </>
                )}
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
                'post-action-btn w-full justify-center gap-2 text-xs sm:text-sm min-h-[38px] min-w-[110px] transition-colors',
                viewerHasReaction && 'text-sena-green hover:text-sena-green hover:bg-sena-green/10'
              )}
              onMouseEnter={() => handleReactionHover(post.id)}
              onClick={() => {
                if (viewerHasReaction) {
                  reactionMutation.mutate({ postId: post.id, reactionType: post.viewerReaction! });
                }
              }}
              disabled={isReacting}
              loading={isReacting}
            >
              {viewerHasReaction ? (
                <span
                  className={classNames(
                    'text-base leading-none transition-colors',
                    selectedReaction?.color ?? 'text-sena-green'
                  )}
                  aria-hidden
                >
                  {reactionEmoji}
                </span>
              ) : (
                <Heart className="h-4 w-4 text-[var(--color-text)]" aria-hidden />
              )}
              <span
                className={classNames(
                  viewerHasReaction
                    ? (selectedReaction?.color ?? 'text-sena-green')
                    : 'text-[var(--color-text)]'
                )}
              >
                {reactionButtonLabel}
              </span>
            </Button>
            {reactionPickerPost === post.id && (
              <div
                className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 translate-y-2 rounded-xl glass-frosted px-2 py-2"
                onMouseEnter={() => handleReactionHover(post.id)}
              >
                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
                  {reactionOptions.filter(ro => ro.type !== 'support').map(({ type, label, emoji }) => (
                    <button
                      key={type}
                      type="button"
                      className="flex items-center justify-center rounded-full border border-white/50 bg-white h-8 w-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 dark:bg-slate-900/90"
                      onClick={() => handleReactionSelect(post.id, type, post.viewerReaction)}
                      title={label}
                    >
                      <span className="text-lg leading-none" aria-hidden>{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={classNames(
              'post-action-btn justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm',
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
            className="post-action-btn justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm"
            onClick={() => handleOpenShare(post)}
          >
            <Share2 className="h-4 w-4" /> Compartir
          </Button>
          <Button
            variant="ghost"
            className={classNames(
              'post-action-btn justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm min-h-[38px] min-w-[110px] transition-all duration-300',
              post.isSaved 
                ? 'text-sena-green hover:text-sena-green/90 hover:shadow-[0_4px_12px_rgba(57,169,0,0.2)]' 
                : ''
            )}
            onClick={() => saveMutation.mutate(post.id)}
            disabled={isSavingPost}
            loading={isSavingPost}
          >
            <Bookmark 
              className={classNames(
                'h-4 w-4 transition-all duration-300',
                post.isSaved && 'fill-sena-green text-sena-green drop-shadow-[0_2px_4px_rgba(57,169,0,0.3)]'
              )} 
            /> 
            <span className={post.isSaved ? 'font-semibold' : ''}>
              {post.isSaved ? 'Guardado' : 'Guardar'}
            </span>
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
                        className="overflow-visible transition hover:scale-105"
                      >
                        <UserAvatar
                          fullName={comment.author.fullName}
                          avatarUrl={comment.author.avatarUrl}
                          size="sm"
                        />
                      </button>
                      <div className="relative flex-1 rounded-2xl glass-liquid px-3 py-2 text-xs text-[var(--color-text)]">
                        {isEditingComment ? (
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              value={editingCommentContent}
                              onChange={(event) => setEditingCommentContent(event.target.value)}
                              className="w-full resize-none rounded-xl glass-liquid px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:ring-0 focus:border-white/25"
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
                                  <div className="absolute right-0 top-8 z-[200] w-48 rounded-2xl glass-frosted p-2 text-sm text-[var(--color-text)]">
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
                                      href={comment.attachmentUrl ?? undefined}
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
                                      href={comment.attachmentUrl ?? undefined}
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
                  className="flex-1 resize-none rounded-2xl glass-liquid px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:ring-0 focus:border-white/25"
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
                          ref={(el) => {
                            if (isEmojiAction) {
                              emojiButtonRefs.current[post.id] = el;
                            }
                          }}
                          className={classNames(
                            "inline-flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-sena-green transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
                            isEmojiAction && isEmojiOpen && "ring-2 ring-sena-green/50 ring-offset-2 ring-offset-[var(--color-background)]"
                          )}
                          aria-label={`${label} comentario`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommentToolClick(post.id, action, e);
                          }}
                          disabled={isCommenting}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                        {isEmojiAction && isEmojiOpen && (
                          <div className="absolute right-0 bottom-full z-50 mb-2" ref={emojiPickerRef}>
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

  type StoryData = {
    id: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string | null;
    mediaUrl: string;
    createdAt: string;
  };

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.listFriends
  });

  const { data: allStories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: storyService.listStories,
    enabled: !!user?.id
  });

  // Agrupar historias por usuario
  const storiesByUser = useMemo(() => {
    const grouped = new Map<string, StoryData[]>();
    allStories.forEach((story) => {
      if (!grouped.has(story.userId)) {
        grouped.set(story.userId, []);
      }
      grouped.get(story.userId)!.push(story);
    });
    return Array.from(grouped.entries()).map(([userId, stories]) => ({
      userId,
      userName: stories[0].userName,
      userAvatarUrl: stories[0].userAvatarUrl,
      stories: stories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      latestStory: stories[stories.length - 1]
    }));
  }, [allStories]);

  // Obtener historias del usuario actual
  const currentUserStories = useMemo(() => {
    if (!user?.id) return [];
    return allStories.filter((story) => story.userId === user.id);
  }, [allStories, user?.id]);

  const storiesWithAvatars = useMemo(() => {
    const result: Array<{ id: string; name: string; avatar: string; userId?: string; stories?: StoryData[] }> = [];
    
    // Agregar botón para crear historia (con las historias del usuario actual)
    result.push({
      id: 'create',
      name: 'Tu historia',
      avatar: resolveAssetUrl(user?.avatarUrl) || '',
      userId: user?.id,
      stories: currentUserStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    });
    
    // Agregar historias de OTROS usuarios (excluir el usuario actual)
    storiesByUser.forEach((userStories) => {
      // Excluir historias del usuario actual porque ya están en el botón "Crear historia"
      if (userStories.userId !== user?.id) {
        result.push({
          id: userStories.userId,
          name: userStories.userName,
          avatar: resolveAssetUrl(userStories.userAvatarUrl) || '',
          userId: userStories.userId,
          stories: userStories.stories
        });
      }
    });
    
    return result;
  }, [storiesByUser, user?.avatarUrl, user?.id, currentUserStories]);

  const activeModalPost = commentModalPost
    ? feedPosts.find((post) => post.id === commentModalPost.id) ?? commentModalPost
    : null;

  return (
    <DashboardLayout
      fluid
      contentClassName="h-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 !pt-0"
    >

      <div className="mx-auto grid w-full max-w-[1920px] items-start gap-3 pt-2 sm:gap-4 md:grid-cols-[1fr_320px] md:gap-4 lg:grid-cols-[280px_1fr_300px] lg:gap-5 xl:grid-cols-[320px_1fr_360px] xl:gap-6 2xl:max-w-[2560px]" style={{ minHeight: 'calc(100vh - 56px)', boxShadow: 'none', WebkitBoxShadow: 'none' }}>
        <aside className="hidden w-full flex-col lg:flex lg:z-10" style={{ position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)' }}>
          <div className="flex flex-col space-y-6 py-4">
            {/* Top Projects */}
            <div className="space-y-3">
              <div className="px-2">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Top projects</h3>
              </div>
              <div className="space-y-1.5">
                {topProjects.length === 0 ? (
                  <p className="px-2 text-xs text-[var(--color-muted)]">
                    Aún no hay proyectos destacados.
                  </p>
                ) : (
                  topProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left glass-liquid transition-all duration-300 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(57,169,0,0.15)] active:scale-[0.98]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 dark:bg-white/10 text-sena-green transition-all duration-300 group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{project.title}</p>
                        <p className="text-xs text-[var(--color-muted)] capitalize">{project.status}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Avances Destacados */}
            <div className="space-y-3">
              <div className="px-2">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Avances destacados</h3>
              </div>
              <div className="space-y-1.5">
                {learningHighlights.length === 0 ? (
                  <p className="px-2 text-xs text-[var(--color-muted)]">
                    Registra tus proyectos para seguir tu progreso.
                  </p>
                ) : (
                  learningHighlights.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left glass-liquid transition-all duration-300 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(57,169,0,0.15)] active:scale-[0.98]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 dark:bg-white/10 text-sena-green transition-all duration-300 group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{project.title}</p>
                        <p className="text-xs text-[var(--color-muted)] capitalize">{project.status}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>        </aside>



        <section 
          ref={feedSectionRef}
          className="feed-section mx-auto flex min-w-0 w-full flex-col gap-3 sm:gap-4 lg:gap-5 pb-16 sm:pb-20 px-3 sm:px-4 relative z-10" 
          style={{ width: '100%', maxWidth: '100%', overflowX: 'visible', boxShadow: 'none', WebkitBoxShadow: 'none' }}
        >
          <Card padded={false} className="overflow-visible glass-liquid p-3 sm:p-4 lg:p-5 mt-0" style={{ boxShadow: 'none' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-[var(--color-text)] sm:text-sm">Historias</h2>
              <Button
                variant="ghost"
                size="sm"
                className="!bg-transparent !text-slate-500 px-2 py-0.5 text-[10px] hover:!text-sena-green hover:shadow-[0_0_12px_rgba(57,169,0,0.25)] transition !border-transparent"
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
            <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1" style={{ overflow: 'visible' }}>
              {storiesWithAvatars.map((story) => {
                const hasStories = story.stories && story.stories.length > 0;
                const storyPreview = story.stories && story.stories.length > 0 
                  ? story.stories[story.stories.length - 1].mediaUrl 
                  : null;
                const isViewed = story.userId && story.id !== 'create' && viewedStoryUserIds.has(story.userId);
                
                return (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => handleStoryClick(story)}
                    className={classNames(
                      'group relative z-[60] flex w-16 flex-shrink-0 flex-col items-center gap-1.5 transition-all duration-300 active:scale-[0.98]',
                      story.id === 'create' && 'hover:scale-[1.02]'
                    )}
                    style={{ zIndex: 60, position: 'relative' }}
                  >
                    <div
                      className={classNames(
                        'relative h-12 w-12 rounded-full transition-all duration-300',
                        isViewed
                          ? 'border border-black/70 p-0'
                          : story.id === 'create'
                            ? 'story-create-wave group-hover:scale-[1.02]'
                            : isViewed
                              ? 'border border-black/70 p-0'
                              : 'story-create-wave-static'
                      )}
                      style={{ zIndex: 61, position: 'relative' }}
                    >
                      <div className={classNames(
                        'relative flex h-full w-full items-center justify-center rounded-full transition-all duration-300 overflow-hidden',
                        story.id === 'create' || !isViewed
                          ? 'bg-white dark:bg-slate-900'
                          : 'border-0 bg-[var(--color-surface)]'
                      )} style={{ zIndex: 62 }}>
                        {story.id === 'create' ? (
                          storyPreview ? (
                            <img
                              src={storyPreview}
                              alt="Vista previa"
                              className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Plus className="h-5 w-5 text-sena-green transition-all duration-300 group-hover:scale-110 group-hover:rotate-45 drop-shadow-[0_1px_2px_rgba(57,169,0,0.06)]" />
                          )
                        ) : storyPreview ? (
                          <img
                            src={storyPreview}
                            alt={story.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <UserAvatar
                            firstName={story.name.split(' ')[0] || ''}
                            lastName={story.name.split(' ').slice(1).join(' ') || ''}
                            avatarUrl={story.userId === user?.id ? user?.avatarUrl : undefined}
                            size="sm"
                            className="h-full w-full"
                          />
                        )}
                      </div>
                    </div>
                    <span className={classNames(
                      'text-[10px] font-medium text-[var(--color-text)] text-center leading-tight max-w-[64px] truncate transition-colors duration-300',
                      story.id === 'create' && 'group-hover:text-sena-green/80'
                    )}>
                      {story.id === 'create' 
                        ? (hasStories ? 'Tus historias' : 'Crear historia')
                        : story.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="relative z-30 overflow-visible glass-liquid p-4 sm:p-5 lg:p-6 mt-0" style={{ boxShadow: 'none' }}>
            <div className="flex items-start gap-2 sm:gap-3">
              {user && (
                <UserAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  avatarUrl={user.avatarUrl}
                  size="md"
                />
              )}
              <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                <TextArea
                  placeholder="Comparte un nuevo avance, recurso o proyecto..."
                  rows={3}
                  value={composerContent}
                  onChange={(event) => setComposerContent(event.target.value)}
                  disabled={isPublishing}
                  ref={composerInputRef}
                  className="focus:!border-white/25 focus:!ring-0"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="flex gap-1.5 sm:gap-2">
                    {composerIcons.map(({ icon: Icon, label, action }) => {
                      const isEmojiAction = action === 'emoji';
                      const isEmojiOpen = emojiPickerTarget?.type === 'composer' && isEmojiAction;
                      return (
                        <div key={action} className={classNames('relative overflow-visible', isEmojiAction && 'z-30')}>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full glass-liquid text-sena-green transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
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
                    variant="primary"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    className="!bg-sena-light !text-white !border-sena-light/30 hover:!bg-sena-light hover:!text-white hover:!border-sena-light disabled:!bg-white disabled:!text-slate-700 disabled:!border-slate-200 disabled:hover:!bg-white disabled:hover:!text-slate-700 disabled:hover:!border-slate-200 px-3 py-2 text-xs"
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
            <Card className="glass-liquid p-4 text-sm text-[var(--color-muted)] sm:p-5" style={{ boxShadow: 'none' }}>
              Cargando publicaciones...
            </Card>
          )}

          {!isLoadingFeed && feedPosts.length === 0 && (
            <Card className="glass-liquid p-4 text-sm text-[var(--color-muted)] sm:p-5" style={{ boxShadow: 'none' }}>
              Aun no hay publicaciones en tu comunidad. Comparte la primera para iniciar la conversacion.
            </Card>
          )}

          {feedPosts.map((post) => renderPostCard(post, 'list'))}
        </section>

        <aside className="hidden w-full flex-col lg:flex lg:z-10" style={{ position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <div className="flex flex-col space-y-6 py-4 px-4">
            {/* Anuncios */}
            <div className="space-y-2">
              <div className="px-2">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Anuncios</h3>
              </div>
              <div className="relative h-40 overflow-hidden rounded-xl sm:h-44 lg:h-48">
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
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </motion.div>
                      )
                  )}
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-2 px-2">
                {announcementSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveAnnouncement(index)}
                    className={classNames(
                      'h-2 w-8 rounded-full transition-all duration-200 bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]/70',
                      index === activeAnnouncement && 'shadow-sm'
                    )}
                    aria-label={`Mostrar anuncio ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>





        <button
          onClick={() => {
            setMessagesOpen(!messagesOpen);
            setNotificationsOpen(false); // Cerrar notificaciones si están abiertas
          }}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)]/90 backdrop-blur-xl text-[var(--color-text)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-white/30 transition-all duration-300 hover:scale-105 hover:bg-[var(--color-surface)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] active:scale-95"
          aria-label="Abrir mensajes"
        >
          <MessageCircle className="h-6 w-6" />
        </button>

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
                  {chats.map((chat) => {
                    // Encontrar el otro usuario del chat (si no es grupo)
                    const chatOtherUser = chat.isGroup ? null : (() => {
                      const otherUserId = chat.createdBy === user?.id ? null : chat.createdBy;
                      if (!otherUserId) return null;
                      return friends.find((f) => f.id === otherUserId) || null;
                    })();

                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => handleOpenChat(chat.id)}
                        className="group relative flex w-full items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-left transition-all duration-300 ease-out hover:border-white/30 hover:bg-gradient-to-r hover:from-white/10 hover:via-white/5 hover:to-transparent hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_6px_rgba(0,0,0,0.05)] dark:hover:border-white/20 dark:hover:from-white/8 dark:hover:via-white/4"
                      >
                        <div className="relative flex-shrink-0">
                          {chat.isGroup ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sena-green to-emerald-500 shadow-[0_8px_16px_rgba(57,169,0,0.15)] transition-transform duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-white/20">
                              <UsersIcon className="h-5 w-5 text-white" />
                            </div>
                          ) : chatOtherUser ? (
                            <div className="transition-transform duration-300 group-hover:scale-110">
                              <UserAvatar
                                firstName={chatOtherUser.firstName}
                                lastName={chatOtherUser.lastName}
                                avatarUrl={chatOtherUser.avatarUrl}
                                size="sm"
                                className="transition-transform duration-300 group-hover:ring-2 group-hover:ring-white/20"
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 transition-transform duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-white/20">
                              <UsersIcon className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--color-text)] transition-colors duration-300">{chat.name ?? (chatOtherUser ? `${chatOtherUser.firstName} ${chatOtherUser.lastName}`.trim() : 'Chat sin título')}</p>
                          <p className="text-xs text-[var(--color-muted)] truncate transition-colors duration-300 group-hover:text-[var(--color-text)]/80">
                            {chat.lastMessage 
                              ? (chat.lastMessage.length > 40 ? chat.lastMessage.substring(0, 40) + '...' : chat.lastMessage)
                              : 'Sin mensajes'}
                          </p>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {openChatIds.map((chatId, index) => {
            const chat = chats.find((c) => c.id === chatId);
            if (!chat) return null;
            return <ChatWindow key={chat.id} chat={chat} index={index} onClose={handleCloseChat} />;
          })}
        </AnimatePresence>

        {isStoryViewerOpen && selectedStoryUser && selectedStoryUser.stories && selectedStoryUser.stories.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => {
              if (selectedStoryUser.userId && selectedStoryUser.userId !== user?.id) {
                setViewedStoryUserIds((prev) => new Set(prev).add(selectedStoryUser.userId));
              }
              setIsStoryViewerOpen(false);
              setIsStoryMenuOpen(false);
              setIsStoryViewersOpen(false);
              setSelectedStoryUser(null);
            }}
          >
            <div className="relative flex items-center gap-4" onClick={(event) => event.stopPropagation()}>
              {(() => {
                const currentStories = selectedStoryUser?.stories || [];
                return (
                  <>
                    {currentStories.length > 0 && (
                      <button
                        type="button"
                        className="absolute -left-14 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-sena-green shadow-lg backdrop-blur transition hover:bg-black/65"
                        onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
                        aria-label="Anterior"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}
                    <div ref={storyImageContainerRef} className="relative flex max-h-[80vh] max-w-[90vw] min-h-[300px] items-center justify-center overflow-hidden rounded-3xl bg-black/50">
                      <img
                        src={(currentStories[currentStoryIndex] as StoryData).mediaUrl}
                        alt="Historia"
                        className="max-h-[80vh] max-w-[90vw] rounded-3xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.35)] block"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement | null;
                          if (placeholder) placeholder.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center text-sm text-white/80">
                        <p>No se pudo cargar la imagen.</p>
                        <p className="text-xs opacity-75">
                          Verifica que Railway tenga un Volume en /app/uploads y que VITE_API_URL en Vercel apunte a tu API. Ver DEPLOY.md.
                        </p>
                      </div>
                      {selectedStoryUser?.userId === user?.id && (
                        <>
                          {(() => {
                            const currentStory = selectedStoryUser?.stories?.[currentStoryIndex];
                            const viewers = currentStory ? (storyViewersData[currentStory.id] ?? []) : [];
                            const viewerCount = viewers.length;
                            return (
                              <>
                                <div className="absolute left-4 bottom-4 z-20">
                                  <button
                                    ref={storyViewsButtonRef}
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-sena-green shadow-lg backdrop-blur transition hover:bg-black/80"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const btn = storyViewsButtonRef.current;
                                      const container = storyImageContainerRef.current;
                                      if (btn && container) {
                                        const btnRect = btn.getBoundingClientRect();
                                        const containerRect = container.getBoundingClientRect();
                                        const centerX = btnRect.left + btnRect.width / 2 - containerRect.left;
                                        const centerY = btnRect.top + btnRect.height / 2 - containerRect.top;
                                        const originX = (centerX / containerRect.width) * 100;
                                        const originY = (centerY / containerRect.height) * 100;
                                        storyPanelOriginRef.current = { x: originX, y: originY };
                                      }
                                      setIsStoryViewersOpen((v) => !v);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                    {viewerCount} {viewerCount === 1 ? 'vista' : 'vistas'}
                                  </button>
                                </div>
                                <AnimatePresence>
                                  {isStoryViewersOpen && (
                                    <motion.div
                                      initial={{ '--diffuse-radius': 0 } as unknown as Record<string, number>}
                                      animate={{ '--diffuse-radius': 100 } as unknown as Record<string, number>}
                                      exit={{ '--diffuse-radius': 0 } as unknown as Record<string, number>}
                                      transition={{ type: 'spring', damping: 26, stiffness: 180, mass: 0.9 }}
                                      className="absolute inset-0 z-30 flex flex-col rounded-3xl bg-black/85 backdrop-blur-md overflow-hidden"
                                      style={{
                                        maskImage: `radial-gradient(circle at ${storyPanelOriginRef.current.x}% ${storyPanelOriginRef.current.y}%, black 0%, black calc(var(--diffuse-radius, 0) * 0.45%), rgba(0,0,0,0.6) calc(var(--diffuse-radius, 0) * 0.7%), rgba(0,0,0,0.2) calc(var(--diffuse-radius, 0) * 0.9%), transparent calc(var(--diffuse-radius, 0) * 1.1%))`,
                                        WebkitMaskImage: `radial-gradient(circle at ${storyPanelOriginRef.current.x}% ${storyPanelOriginRef.current.y}%, black 0%, black calc(var(--diffuse-radius, 0) * 0.45%), rgba(0,0,0,0.6) calc(var(--diffuse-radius, 0) * 0.7%), rgba(0,0,0,0.2) calc(var(--diffuse-radius, 0) * 0.9%), transparent calc(var(--diffuse-radius, 0) * 1.1%))`,
                                        maskSize: '200% 200%'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex-1 overflow-y-auto p-4">
                                        <p className="text-sm font-semibold text-white/90 mb-4">
                                          {viewerCount === 0 ? 'Aún no hay vistas' : `${viewerCount} ${viewerCount === 1 ? 'persona vio' : 'personas vieron'} esta historia`}
                                        </p>
                                        {viewers.length > 0 ? (
                                          <div className="space-y-3">
                                            {viewers.map((v) => (
                                              <div
                                                key={v.id}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/10 transition"
                                              >
                                                <UserAvatar
                                                  firstName={v.firstName}
                                                  lastName={v.lastName}
                                                  avatarUrl={resolveAssetUrl(v.avatarUrl) ?? v.avatarUrl}
                                                  size="sm"
                                                />
                                                <span className="text-sm font-medium text-white truncate">
                                                  {[v.firstName, v.lastName].filter(Boolean).join(' ') || 'Usuario'}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                      <button
                                        type="button"
                                        className="mt-auto p-3 text-sm font-semibold text-white/90 hover:bg-white/10 rounded-b-3xl transition"
                                        onClick={() => setIsStoryViewersOpen(false)}
                                      >
                                        Cerrar
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            );
                          })()}
                        </>
                      )}
                      {(!selectedStoryUser || selectedStoryUser.userId === user?.id) && (
                        <>
                          <button
                            type="button"
                            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-sena-green shadow-lg backdrop-blur transition hover:bg-black/70"
                            onClick={() => setIsStoryMenuOpen((prev) => !prev)}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          {isStoryMenuOpen && (
                            <div className="absolute right-3 top-14 z-10 w-44 rounded-2xl glass-frosted px-3 py-2 text-sm text-white">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-red-500 transition hover:bg-white/10"
                                onClick={handleDeleteStory}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" /> Eliminar historia
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {(() => {
                        const currentStories = selectedStoryUser?.stories || [];
                        return currentStories.length > 1 ? (
                          <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-2">
                            {currentStories.map((_, index) => (
                                <span
                                  key={`story-dot-${index}`}
                                  className={classNames(
                                    'h-1.5 w-8 rounded-full transition',
                                    index === currentStoryIndex ? 'bg-sena-green' : 'bg-sena-green/40'
                                  )}
                                />
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    {currentStories.length > 0 && (
                        <button
                          type="button"
                          className="absolute -right-14 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-sena-green shadow-lg backdrop-blur transition hover:bg-black/65"
                          onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
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
                        setIsStoryViewersOpen(false);
                        setSelectedStoryUser(null);
                      }}
                    >
                      Cerrar
                    </button>
                  </>
                );
              })()}
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
                  Elige un amigo y añade un mensaje para compartir la publicación en el chat.
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
              <TextArea
                rows={3}
                placeholder="Di algo a tu comunidad..."
                value={shareMessage}
                onChange={(event) => setShareMessage(event.target.value)}
                disabled={isSharing}
                className="focus:!border-white/25 focus:!ring-0"
              />

              <div className="rounded-2xl glass-liquid px-4 py-4 text-sm text-[var(--color-text)]">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    fullName={shareTarget.author.fullName}
                    avatarUrl={shareTarget.author.avatarUrl}
                    size="md"
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

              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--color-muted)]">Compartir con</p>
                <div className="flex flex-wrap gap-4">
                  {friends.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)]">No tienes amigos agregados</p>
                  ) : (
                    friends.map((friend) => {
                      const isSelected = shareToFriendId === friend.id;
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => setShareToFriendId((id) => (id === friend.id ? null : friend.id))}
                          className={classNames(
                            'flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200',
                            isSelected
                              ? 'ring-2 ring-sena-green bg-sena-green/10'
                              : 'hover:bg-white/10 dark:hover:bg-white/5'
                          )}
                        >
                          <UserAvatar
                            firstName={friend.firstName}
                            lastName={friend.lastName}
                            avatarUrl={friend.avatarUrl}
                            size="md"
                            className="h-12 w-12 flex-shrink-0"
                          />
                          <span className="max-w-[72px] truncate text-center text-xs font-medium text-[var(--color-text)]">
                            {[friend.firstName, friend.lastName].filter(Boolean).join(' ') || 'Usuario'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCloseShareModal} disabled={isSharing}>
                  Cancelar
                </Button>
                <Button onClick={handleShareSubmit} loading={isSharing} disabled={isSharing || !shareToFriendId}>
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
                className="focus:!border-white/25 focus:!ring-0"
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

        {activeModalPost && !(reportTarget && reportTarget.type === 'comment') && (
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
              className="relative mx-auto w-full max-w-3xl overflow-visible rounded-[36px] p-6"
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

        {/* Modal de confirmación eliminar publicación */}
        {deletePostTarget && (
          <GlassDialog
            open={Boolean(deletePostTarget)}
            onClose={() => setDeletePostTarget(null)}
            size="sm"
            preventCloseOnBackdrop={deletePostMutation.isPending}
            contentClassName="glass-dialog-delete"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                    ¿Eliminar publicación? 🗑️
                  </h2>
                  <p className="text-base leading-relaxed text-[var(--color-text)]">
                    Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta publicación?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeletePostTarget(null)}
                  disabled={deletePostMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDeletePost}
                  loading={deletePostMutation.isPending}
                  disabled={deletePostMutation.isPending}
                  className="!bg-rose-500 hover:!bg-rose-600 !text-white focus:!ring-rose-500/50 active:!bg-rose-700 !shadow-[0_4px_14px_rgba(239,68,68,0.4)] hover:!shadow-[0_6px_20px_rgba(239,68,68,0.5)] active:!shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-rose-400/30"
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          </GlassDialog>
        )}

        {/* Modal de confirmación eliminar comentario */}
        {deleteCommentTarget && (
          <GlassDialog
            open={Boolean(deleteCommentTarget)}
            onClose={() => setDeleteCommentTarget(null)}
            size="sm"
            preventCloseOnBackdrop={deleteCommentMutation.isPending}
            contentClassName="glass-dialog-delete"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                    ¿Eliminar comentario? 💬
                  </h2>
                  <p className="text-base leading-relaxed text-[var(--color-text)]">
                    ¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteCommentTarget(null)}
                  disabled={deleteCommentMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDeleteComment}
                  loading={deleteCommentMutation.isPending}
                  disabled={deleteCommentMutation.isPending}
                  className="!bg-rose-500 hover:!bg-rose-600 !text-white focus:!ring-rose-500/50 active:!bg-rose-700 !shadow-[0_4px_14px_rgba(239,68,68,0.4)] hover:!shadow-[0_6px_20px_rgba(239,68,68,0.5)] active:!shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-rose-400/30"
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          </GlassDialog>
        )}

        {/* Mensaje de éxito */}
        <AnimatePresence>
          {composerSuccessMessage && (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.16, 1, 0.3, 1],
                exit: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
              }}
              className="fixed bottom-6 left-6 lg:left-8 xl:left-12 2xl:left-16 z-50 flex items-center rounded-xl glass-liquid-strong px-4 py-3 shadow-lg overflow-hidden max-w-[280px]"
              style={{ willChange: 'transform, opacity' }}
            >
              <p className="text-sm font-medium text-[var(--color-text)] whitespace-nowrap relative z-10">{composerSuccessMessage}</p>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 1.5, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-1 bg-sena-green"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

function SharedPostPreview({ postId }: { postId: string }) {
  const { data: post, isLoading } = useQuery({
    queryKey: ['feed', 'post', postId],
    queryFn: () => feedService.getPost(postId),
    enabled: Boolean(postId)
  });
  if (isLoading || !post) {
    return (
      <div className="my-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-[var(--color-muted)]">
        Cargando publicación...
      </div>
    );
  }
  const created = new Date(post.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
  return (
    <div className="my-1.5 overflow-hidden rounded-xl border border-white/20 bg-white/5">
      <div className="flex items-start gap-2 p-2">
        <UserAvatar
          fullName={post.author.fullName}
          avatarUrl={post.author.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--color-text)]">{post.author.fullName}</p>
          <p className="text-[10px] text-[var(--color-muted)]">{created}</p>
        </div>
      </div>
      {post.content && (
        <p className="border-t border-white/10 px-2 py-1.5 text-xs leading-relaxed text-[var(--color-text)] line-clamp-3">
          {post.content}
        </p>
      )}
      {post.mediaUrl && (
        <div className="border-t border-white/10">
          <img
            src={resolveAssetUrl(post.mediaUrl) ?? post.mediaUrl}
            alt="Vista previa"
            className="max-h-32 w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

const ChatWindow = ({ chat, index, onClose }: ChatWindowProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['home', 'chat', chat.id],
    queryFn: async () => await chatService.listMessages(chat.id),
    enabled: Boolean(chat.id)
  });

  // Cargar amigos para obtener nombres de usuarios
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.listFriends
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(chat.id, { content }),
    onSuccess: async () => {
      setMessage('');
      await queryClient.invalidateQueries({ queryKey: ['home', 'chat', chat.id] });
    }
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current && !isLoading) {
      // Scroll inmediato al final cuando se cargan los mensajes
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Función para obtener el nombre del remitente
  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) {
      return 'Tú';
    }
    const friend = friends.find((f) => f.id === senderId);
    if (friend) {
      return `${friend.firstName} ${friend.lastName}`.trim() || friend.firstName || 'Usuario';
    }
    // Si no se encuentra en amigos, intentar obtener de todos los usuarios
    return senderId; // Fallback al ID si no se encuentra
  };

  // Obtener información del otro usuario del chat (solo si no es grupo)
  const otherUser = useMemo(() => {
    if (chat.isGroup) return null;
    // Buscar en los mensajes
    const otherUserMessage = messages.find((msg) => msg.senderId !== user?.id);
    if (otherUserMessage) {
      const friend = friends.find((f) => f.id === otherUserMessage.senderId);
      if (friend) return friend;
    }
    // Si no encontramos en mensajes, usar createdBy
    if (chat.createdBy !== user?.id) {
      const friend = friends.find((f) => f.id === chat.createdBy);
      if (friend) return friend;
    }
    return null;
  }, [chat, messages, friends, user?.id]);

  // Función para navegar al perfil
  const handleNavigateToProfile = () => {
    if (chat.isGroup || !otherUser) return;
    navigate(`/profile/${otherUser.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      className="fixed bottom-28 z-50 w-80"
      style={{ right: 24 + index * 320 }}
    >
      <Card padded={false} className="flex h-96 flex-col overflow-hidden rounded-3xl glass-liquid-strong">
        <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {chat.isGroup ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sena-green to-emerald-500 flex-shrink-0 shadow-[0_8px_16px_rgba(57,169,0,0.15)]">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
            ) : otherUser ? (
              <div onClick={handleNavigateToProfile} className="cursor-pointer flex-shrink-0">
                <UserAvatar
                  firstName={otherUser.firstName}
                  lastName={otherUser.lastName}
                  avatarUrl={otherUser.avatarUrl}
                  size="sm"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex-shrink-0">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <div 
              className="min-w-0 flex-1 cursor-pointer"
              onClick={handleNavigateToProfile}
            >
              <p className="text-sm font-semibold text-[var(--color-text)] truncate hover:text-sena-green transition-colors">
                {chat.isGroup 
                  ? (chat.name ?? 'Grupo sin título')
                  : otherUser
                    ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.firstName || 'Usuario'
                    : chat.name ?? 'Chat sin título'}
              </p>
              <p className="text-xs text-[var(--color-muted)] truncate">
                {lastMessage 
                  ? (lastMessage.content.length > 30 ? lastMessage.content.substring(0, 30) + '...' : lastMessage.content)
                  : chat.lastMessage 
                    ? (chat.lastMessage.length > 30 ? chat.lastMessage.substring(0, 30) + '...' : chat.lastMessage)
                    : 'Sin mensajes'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onClose(chat.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 hide-scrollbar">
          {isLoading && <p className="text-xs text-[var(--color-muted)]">Cargando mensajes...</p>}
          {!isLoading && messages.length === 0 && (
            <p className="text-xs text-[var(--color-muted)]">An no hay mensajes en este chat.</p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            const senderName = getSenderName(msg.senderId);
            const messageDate = new Date(msg.createdAt);
            const formattedTime = messageDate.toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit'
            });
            const formattedDate = messageDate.toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short'
            });

            return (
              <div key={msg.id} className="rounded-2xl glass-liquid px-3 py-2 text-sm text-[var(--color-text)]">
                {chat.isGroup && !isOwn && (
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-xs font-semibold text-[var(--color-text)]">{senderName}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">
                      {formattedDate} {formattedTime}
                    </p>
                  </div>
                )}
                {chat.isGroup && isOwn && (
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-xs font-semibold text-[var(--color-text)]">{senderName}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">
                      {formattedDate} {formattedTime}
                    </p>
                  </div>
                )}
                {msg.content ? <p className="whitespace-pre-wrap">{msg.content}</p> : null}
                {msg.sharedPostId ? <SharedPostPreview postId={msg.sharedPostId} /> : null}
                {!chat.isGroup && (
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {formattedTime}
                  </p>
                )}
              </div>
            );
          })}
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










