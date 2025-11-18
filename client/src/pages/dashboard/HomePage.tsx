import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
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
  CheckCircle2,
  FileText,
  Flag,
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
  Video,
  X
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Chat } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { FeedAttachment, FeedComment, FeedPostAggregate, ReactionType } from '../../types/feed';
import { useNavigate } from 'react-router-dom';
import { floatingModalContentClass } from '../../utils/modalStyles';

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
  { type: 'like' as ReactionType, label: 'Me gusta', icon: ThumbsUp, color: 'text-blue-500' },
  { type: 'love' as ReactionType, label: 'Me encanta', icon: Heart, color: 'text-rose-500' },
  { type: 'insightful' as ReactionType, label: 'Me asombra', icon: Sparkles, color: 'text-amber-500' },
  { type: 'celebrate' as ReactionType, label: 'Me divierte', icon: Laugh, color: 'text-emerald-500' }
];

const reportReasons = [
  'Contenido inapropiado',
  'Informacion falsa',
  'Discurso dañino o spam',
  'Violacion de derechos',
  'Otro'
];


const shareAudienceOptions = [
  { id: 'feed', label: 'Tu biografia' },
  { id: 'chat', label: 'Mensaje directo' },
  { id: 'group', label: 'Grupo' }
] as const;

type ShareScope = (typeof shareAudienceOptions)[number]['id'];

const iosEmojis = ['😀', '😃', '😄', '😁', '😆', '😍', '🤩', '😎', '🥰', '🫶', '🙌', '👍', '🎉'];

const getRandomIosEmoji = () => iosEmojis[Math.floor(Math.random() * iosEmojis.length)];

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
  return 'dataUrl' in attachment ? attachment.dataUrl : attachment.url;
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
  if (mediaType === 'pdf') {
    return (
      <iframe title="Documento adjunto" src={url} className={classNames('h-full w-full', className)} />
    );
  }
  return (
    <div className={classNames('flex h-full w-full items-center justify-center bg-white/70 p-2 text-[10px] text-[var(--color-muted)]', className)}>
      <FileText className="h-5 w-5 text-sena-green" />
      <span className="ml-1 truncate">{getAttachmentLabel(attachment)}</span>
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
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [composerSuccessMessage, setComposerSuccessMessage] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsCache, setCommentsCache] = useState<Record<string, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [shareTarget, setShareTarget] = useState<FeedPostAggregate | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [shareScope, setShareScope] = useState<ShareScope>('feed');
  const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null);
  const [commentMenuOpenId, setCommentMenuOpenId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [editingPost, setEditingPost] = useState<FeedPostAggregate | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [reactionPickerPost, setReactionPickerPost] = useState<string | null>(null);
  const reactionPickerTimeout = useRef<number | null>(null);
  const [commentAttachments, setCommentAttachments] = useState<Record<string, ComposerAttachment | null>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const postMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentFileInputsRef = useRef<Record<string, Partial<Record<AttachmentKind, HTMLInputElement | null>>>>({});
  const navigate = useNavigate();
  const userDisplayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'FlorteApp';
  const composerAvatarUrl =
    user?.avatarUrl ??
    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(userDisplayName)}.svg`;

  const handleClearAttachments = () => {
    setComposerAttachments([]);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setComposerAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
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
      const emoji = getRandomIosEmoji();
      setCommentInputs((prev) => {
        const current = prev[postId] ?? '';
        const trimmed = current.trimEnd();
        return { ...prev, [postId]: trimmed ? `${trimmed} ${emoji} ` : `${emoji} ` };
      });
    }
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
    if (!composerSuccessMessage) return;
    const timeout = window.setTimeout(() => setComposerSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [composerSuccessMessage]);

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
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }).catch(() => {});
    },
    onError: (error) => {
      console.error('No fue posible enviar el reporte', error);
    }
  });

  const handleComposerSubmit = () => {
    const trimmedContent = composerContent.trim();
    if (!trimmedContent || createPostMutation.isPending) return;
    createPostMutation.mutate({
      content: trimmedContent,
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
        if (typeof reader.result !== 'string') return;
        setComposerAttachments((prev) => [
          ...prev,
          {
            id: createAttachmentId(),
            kind,
            dataUrl: reader.result,
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
      if (typeof reader.result !== 'string') return;
      setCommentAttachments((prev) => ({
        ...prev,
        [postId]: {
          kind,
          dataUrl: reader.result,
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
  };

  const handleSubmitReport = () => {
    if (!reportTarget || reportMutation.isPending) return;
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

  const handleShowLess = () => {
    setComposerSuccessMessage('Mostrando menos publicaciones.');
    setPostMenuOpenId(null);
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
      const emoji = getRandomIosEmoji();
      setComposerContent((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed ? `${trimmed} ${emoji}` : emoji;
      });
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
          <AnimatePresence>
            {composerSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-sena-green/40 bg-sena-green/10 px-4 py-3 text-sm text-[var(--color-text)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sena-green" />
                    <p className="font-semibold">{composerSuccessMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComposerSuccessMessage(null)}
                    className="rounded-full bg-white/50 p-1 text-[var(--color-text)] hover:bg-white/70"
                    aria-label="Cerrar notificacion"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {composerIcons.map(({ icon: Icon, label, action }) => (
                      <button
                        key={action}
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/35 text-sena-green transition hover:shadow-[0_0_18px_rgba(57,169,0,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={label}
                        onClick={() => handleComposerToolClick(action)}
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

                {composerAttachments.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-white/20 bg-white/20 p-3 text-sm text-[var(--color-text)]">
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

                    <div className="flex gap-2 overflow-x-auto px-1">
                      {composerAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative flex h-24 w-24 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-[var(--color-text)] shadow-[0_6px_18px_rgba(18,55,29,0.12)]"
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
            const commentAttachment = commentAttachments[post.id] ?? null;
            const canSendComment = Boolean((commentInputs[post.id] ?? '').trim()) || Boolean(commentAttachment);

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
                      <div className="absolute right-0 top-9 z-20 w-48 rounded-2xl border border-white/20 bg-white/95 p-2 text-sm text-[var(--color-text)] shadow-[0_18px_35px_rgba(18,55,29,0.18)] dark:bg-slate-900/95">
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
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar publicacion
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
                        <button
                          type="button"
                          onClick={handleShowLess}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sena-green/10"
                        >
                          <Bookmark className="h-4 w-4" /> Mostrar menos
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
                        key={`${post.id}-${attachment.id}`}
                        className="relative h-24 w-24 flex-none overflow-hidden rounded-2xl border border-white/15 bg-white/5"
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
                  <div className="relative sm:flex-1" onMouseLeave={handleReactionPickerLeave}>
                    <Button
                      variant="ghost"
                      className={classNames(
                        'w-full justify-center gap-2 text-xs sm:text-sm',
                        viewerHasReaction && 'text-sena-green'
                      )}
                      onMouseEnter={() => handleReactionHover(post.id)}
                      onClick={() => reactionMutation.mutate({ postId: post.id, reactionType: 'like' })}
                      disabled={isReacting}
                      loading={isReacting}
                    >
                      <ReactionIconComponent className={classNames('h-4 w-4', selectedReaction?.color ?? (viewerHasReaction ? 'text-sena-green' : 'text-rose-500'))} />
                      {reactionButtonLabel}
                    </Button>
                    {reactionPickerPost === post.id && (
                      <div
                        className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 translate-y-2 rounded-full border border-white/40 bg-white px-3 py-1 shadow-[0_10px_26px_rgba(18,55,29,0.25)] dark:bg-slate-900"
                        onMouseEnter={() => handleReactionHover(post.id)}
                      >
                        <div className="flex items-center gap-2">
                          {reactionOptions.map(({ type, label, icon: Icon, color }) => (
                            <button
                              key={type}
                              type="button"
                              className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-full bg-white/80 text-[10px] font-semibold text-[var(--color-text)] transition hover:scale-105 hover:bg-white"
                              onClick={() => handleReactionSelect(post.id, type)}
                            >
                              <Icon className={classNames('h-4 w-4', color)} />
                              <span className="hidden sm:block">{label.split(' ')[1]}</span>
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
                          const commentAttachmentType = comment.attachmentUrl ? detectMediaType(comment.attachmentUrl) : null;
                          const commentAttachmentName = comment.attachmentUrl ? extractFileName(comment.attachmentUrl) : '';
                          const isEditingComment = editingCommentId === comment.id;
                          const canManageComment = user?.role === 'admin' || user?.id === comment.userId;
                          return (
                            <div key={comment.id} className="flex items-start gap-2">
                              <img
                                src={commentAvatar}
                                alt={comment.author.fullName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="relative flex-1 rounded-2xl bg-white/18 px-3 py-2 text-xs text-[var(--color-text)]">
                                {isEditingComment ? (
                                  <div className="space-y-3">
                                    <textarea
                                      rows={3}
                                      value={editingCommentContent}
                                      onChange={(event) => setEditingCommentContent(event.target.value)}
                                      className="w-full resize-none rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="xs"
                                        onClick={() => handleConfirmEditComment(post.id)}
                                        loading={updateCommentMutation.isPending}
                                        disabled={updateCommentMutation.isPending}
                                      >
                                        Guardar
                                      </Button>
                                      <Button
                                        size="xs"
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
                                      <p className="font-semibold">{comment.author.fullName}</p>
                                      <div className="absolute right-3 top-3" ref={(element) => registerCommentMenuRef(comment.id, element)}>
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
                                          <div className="absolute right-0 top-8 z-20 w-48 rounded-2xl border border-white/20 bg-white/95 p-2 text-sm text-[var(--color-text)] shadow-[0_18px_35px_rgba(18,55,29,0.18)] dark:bg-slate-900/95">
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
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-100"
                                              >
                                                <Trash2 className="h-4 w-4" /> Eliminar comentario
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
                                  </>
                                )}
                                {comment.attachmentUrl && (
                                  <div className="mt-2 overflow-hidden rounded-xl border border-white/20 bg-white/10">
                                    {commentAttachmentType === 'image' && (
                                      <img
                                        src={comment.attachmentUrl}
                                        alt="Adjunto del comentario"
                                        className="max-h-32 w-full object-cover"
                                      />
                                    )}
                                    {commentAttachmentType === 'video' && (
                                      <video
                                        src={comment.attachmentUrl}
                                        controls
                                        className="max-h-32 w-full bg-black"
                                        preload="metadata"
                                      />
                                    )}
                                    {commentAttachmentType === 'pdf' && (
                                      <iframe
                                        title="Documento adjunto"
                                        src={comment.attachmentUrl}
                                        className="h-36 w-full bg-white"
                                      />
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
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-3">
                      {commentAttachment && (
                        <div className="space-y-2 rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-xs text-[var(--color-text)]">
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
                          {commentAttachment.kind === 'document' &&
                            (commentAttachment.mimeType === 'application/pdf' ||
                            commentAttachment.fileName.toLowerCase().endsWith('.pdf') ? (
                              <iframe
                                title="Documento adjunto del comentario"
                                src={commentAttachment.dataUrl}
                                className="h-48 w-full rounded-xl bg-white"
                              />
                            ) : (
                              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[var(--color-text)]">
                                <FileText className="h-4 w-4 text-sena-green" />
                                <div>
                                  <p className="text-sm font-semibold">Archivo adjunto</p>
                                  <p className="text-[11px] text-[var(--color-muted)]">
                                    Se compartira junto con tu comentario.
                                  </p>
                                </div>
                              </div>
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
                          {composerIcons.map(({ icon: Icon, label, action }) => (
                            <button
                              key={`${post.id}-${action}`}
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sena-green transition hover:bg-white/40"
                              aria-label={`${label} comentario`}
                              onClick={() => handleCommentToolClick(post.id, action)}
                              disabled={isCommenting}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          Puedes agregar fotos, videos o emojis.
                        </span>
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
                <Button
                  size="sm"
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => navigate('/explore')}
                >
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
              className="self-start rounded-full border border-white/30 bg-white/70 px-3 py-1 text-xs text-[var(--color-muted)] shadow-[0_10px_24px_rgba(18,55,29,0.18)] backdrop-blur hover:text-sena-green"
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
                      : 'bg-white/20 text-[var(--color-text)] hover:bg-white/30'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

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
              className="self-start rounded-full border border-white/30 bg-white/70 px-3 py-1 text-xs text-[var(--color-muted)] shadow-[0_10px_24px_rgba(18,55,29,0.18)] backdrop-blur hover:text-sena-green"
            >
              <X className="h-4 w-4" /> Cerrar
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-rose-200/40 bg-rose-50/80 px-3 py-3 text-xs text-rose-900">
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
                  onClick={() => setReportReason(reason)}
                  className={classNames(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    reportReason === reason ? 'bg-rose-500 text-white' : 'bg-white/20 text-[var(--color-text)]'
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









