import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Bookmark, Heart, MessageCircle, Share2, Sparkles, Image, Paperclip, Smile, Plus, X, ThumbsUp, Trash2, MoreHorizontal, FileText, FileArchive, FileImage, FileVideo, FileAudio, FileCode, Shield } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { resolveAssetUrl } from '../../utils/media';
const generateClientId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
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
    { icon: Image, label: 'Multimedia', action: 'media' },
    { icon: Paperclip, label: 'Adjuntar archivos', action: 'attachments' },
    { icon: Smile, label: 'Emojis', action: 'emoji' }
];
const reactionOptions = [
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
const isVideoAsset = (url) => /\.(mp4|mov|webm|ogg)$/i.test(url);
const getExtension = (fileName) => {
    if (!fileName)
        return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
};
const getAttachmentMeta = (fileName, fileType) => {
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
    const [openChatIds, setOpenChatIds] = useState([]);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [isComposerDialogOpen, setComposerDialogOpen] = useState(false);
    const [composerContent, setComposerContent] = useState('');
    const [composerMedia, setComposerMedia] = useState(null);
    const [composerAttachments, setComposerAttachments] = useState([]);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [expandedComments, setExpandedComments] = useState({});
    const [commentsCache, setCommentsCache] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [commentUploadStatus, setCommentUploadStatus] = useState({});
    const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
    const [toast, setToast] = useState(null);
    const [reactionPickerPostId, setReactionPickerPostId] = useState(null);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareMessage, setShareMessage] = useState('');
    const [reportTarget, setReportTarget] = useState(null);
    const [reportMessage, setReportMessage] = useState('');
    const [actionMenuPostId, setActionMenuPostId] = useState(null);
    const mediaInputRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const mediaUploadContext = useRef(null);
    const attachmentUploadContext = useRef(null);
    useEffect(() => {
        if (!toast)
            return;
        const timeout = window.setTimeout(() => setToast(null), 3200);
        return () => window.clearTimeout(timeout);
    }, [toast]);
    useEffect(() => {
        if (!activeEmojiPicker)
            return;
        const handleClick = (event) => {
            const target = event.target;
            if (target?.closest('[data-emoji-panel="true"]') || target?.closest('[data-emoji-trigger="true"]')) {
                return;
            }
            setActiveEmojiPicker(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [activeEmojiPicker]);
    useEffect(() => {
        if (!actionMenuPostId)
            return;
        const handleClick = (event) => {
            const target = event.target;
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
    const feedQueryKey = ['feed', 'posts'];
    const { data: feedPosts = [], isFetching: isLoadingFeed } = useQuery({
        queryKey: feedQueryKey,
        queryFn: () => feedService.listPosts()
    });
    const friendSuggestions = groups.slice(0, 3);
    const learningHighlights = projects.slice(0, 3);
    const updatePostInCache = (postId, updater) => {
        queryClient.setQueryData(feedQueryKey, (existing) => {
            if (!existing)
                return existing;
            return existing.map((post) => (post.id === postId ? updater(post) : post));
        });
    };
    const handleOpenChat = (chatId) => {
        setOpenChatIds((prev) => {
            if (prev.includes(chatId))
                return prev;
            const next = [...prev, chatId];
            return next.slice(-3);
        });
        setMessagesOpen(false);
    };
    const handleCloseChat = (chatId) => {
        setOpenChatIds((prev) => prev.filter((id) => id !== chatId));
    };
    const createPostMutation = useMutation({
        mutationFn: (payload) => feedService.createPost(payload),
        onSuccess: (post) => {
            queryClient.setQueryData(feedQueryKey, (existing) => existing ? [post, ...existing] : [post]);
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
        mutationFn: ({ postId, reactionType }) => feedService.react(postId, reactionType),
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
        mutationFn: (postId) => feedService.toggleSave(postId),
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
        mutationFn: ({ postId, content }) => feedService.comment(postId, content),
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
        mutationFn: ({ postId, message }) => feedService.share(postId, message),
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
        mutationFn: ({ postId, reason }) => feedService.reportPost(postId, reason),
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
        if (!trimmedContent || createPostMutation.isPending || isUploadingMedia || isUploadingAttachment)
            return;
        createPostMutation.mutate({
            content: trimmedContent,
            mediaUrl: composerMedia?.url ?? undefined,
            attachments: composerAttachments.length > 0
                ? composerAttachments.map((attachment) => ({
                    url: attachment.url,
                    fileName: attachment.fileName,
                    fileType: attachment.fileType
                }))
                : undefined
        });
    };
    const handleToggleComments = async (postId) => {
        const nextState = !expandedComments[postId];
        setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));
        if (nextState && !commentsCache[postId]) {
            setLoadingComments((prev) => ({ ...prev, [postId]: true }));
            try {
                const comments = await feedService.listComments(postId);
                comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                setCommentsCache((prev) => ({ ...prev, [postId]: comments }));
            }
            catch {
                // noop - UI can remain with latest comments
            }
            finally {
                setLoadingComments((prev) => ({ ...prev, [postId]: false }));
            }
        }
    };
    const handleCommentInputChange = (postId, value) => {
        setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    };
    const handleSubmitComment = (postId) => {
        const content = (commentInputs[postId] ?? '').trim();
        if (!content)
            return;
        commentMutation.mutate({ postId, content });
    };
    const triggerMediaPicker = (context) => {
        mediaUploadContext.current = context;
        mediaInputRef.current?.click();
    };
    const triggerAttachmentPicker = (context) => {
        attachmentUploadContext.current = context;
        attachmentInputRef.current?.click();
    };
    const appendToCommentInput = (postId, value) => {
        setCommentInputs((prev) => {
            const current = prev[postId] ?? '';
            const next = current ? `${current}\n${value}` : value;
            return { ...prev, [postId]: next };
        });
    };
    const handleMediaChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const context = mediaUploadContext.current ?? { type: 'composer' };
        if (context.type === 'comment' && context.postId) {
            const targetPostId = context.postId;
            setCommentUploadStatus((prev) => ({
                ...prev,
                [targetPostId]: { ...(prev[targetPostId] ?? {}), media: true }
            }));
        }
        else {
            setIsUploadingMedia(true);
        }
        try {
            const upload = await feedService.uploadMedia(file);
            if (context.type === 'composer') {
                setComposerMedia({ url: upload.url, mimeType: upload.mimeType });
                showToast('Multimedia agregada correctamente');
            }
            else if (context.postId) {
                const finalUrl = resolveAssetUrl(upload.url) ?? upload.url;
                appendToCommentInput(context.postId, finalUrl);
                showToast('Multimedia agregada al comentario');
            }
        }
        catch (error) {
            console.error('No fue posible cargar la multimedia', error);
            showToast('No fue posible cargar la multimedia');
        }
        finally {
            if (context.type === 'comment' && context.postId) {
                const targetPostId = context.postId;
                setCommentUploadStatus((prev) => ({
                    ...prev,
                    [targetPostId]: { ...(prev[targetPostId] ?? {}), media: false }
                }));
            }
            else {
                setIsUploadingMedia(false);
            }
            if (event.target) {
                event.target.value = '';
            }
            mediaUploadContext.current = null;
        }
    };
    const handleAttachmentChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
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
        }
        else {
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
            }
            else if (context.postId) {
                const finalUrl = resolveAssetUrl(upload.url) ?? upload.url;
                appendToCommentInput(context.postId, `${upload.fileName ?? file.name}: ${finalUrl}`);
                showToast('Adjunto agregado al comentario');
            }
        }
        catch (error) {
            console.error('No fue posible cargar el adjunto', error);
            showToast('No fue posible cargar el adjunto');
        }
        finally {
            if (context.type === 'comment' && context.postId) {
                const targetPostId = context.postId;
                setCommentUploadStatus((prev) => ({
                    ...prev,
                    [targetPostId]: { ...(prev[targetPostId] ?? {}), file: false }
                }));
            }
            else {
                setIsUploadingAttachment(false);
            }
            if (event.target) {
                event.target.value = '';
            }
            attachmentUploadContext.current = null;
        }
    };
    const handleRemoveComposerAttachment = (attachmentId) => {
        setComposerAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    };
    const handleRemoveComposerMedia = () => {
        setComposerMedia(null);
    };
    const toggleEmojiPicker = (nextTarget) => {
        setActiveEmojiPicker((prev) => {
            if (!prev)
                return nextTarget;
            if (prev.type === 'composer' && nextTarget.type === 'composer') {
                return null;
            }
            if (prev.type === 'comment' && nextTarget.type === 'comment' && prev.postId === nextTarget.postId) {
                return null;
            }
            return nextTarget;
        });
    };
    const handleEmojiSelect = (emoji) => {
        if (!activeEmojiPicker)
            return;
        if (activeEmojiPicker.type === 'composer') {
            setComposerContent((prev) => `${prev}${emoji}`);
        }
        else {
            const postId = activeEmojiPicker.postId;
            setCommentInputs((prev) => {
                const current = prev[postId] ?? '';
                return { ...prev, [postId]: `${current}${emoji}` };
            });
        }
        setActiveEmojiPicker(null);
    };
    const handleInlineComposerAction = (action) => {
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
            }
            else if (action === 'attachments') {
                triggerAttachmentPicker({ type: 'composer' });
            }
        }, 150);
    };
    const isPublishing = createPostMutation.isPending;
    const isSharing = shareMutation.isPending;
    const openComposerDialog = () => setComposerDialogOpen(true);
    const closeComposerDialog = () => {
        if (isPublishing)
            return;
        setComposerDialogOpen(false);
    };
    const showToast = (message) => {
        setToast({ id: Date.now(), message });
    };
    const copyToClipboard = async (value) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                return true;
            }
        }
        catch {
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
        }
        catch {
            return false;
        }
    };
    const handleReactionSelect = (postId, reaction) => {
        reactionMutation.mutate({ postId, reactionType: reaction });
        setReactionPickerPostId(null);
    };
    const handleShareLink = async (post) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const link = `${origin}/feed/${post.id}`;
        const copied = await copyToClipboard(link);
        showToast(copied ? 'El enlace de la publicacion se copio correctamente' : 'No fue posible copiar el enlace automaticamente');
        setActionMenuPostId(null);
    };
    const handleOpenShare = (post) => {
        setShareTarget(post);
        setShareMessage('');
    };
    const handleCloseShareModal = () => {
        if (shareMutation.isPending)
            return;
        setShareTarget(null);
        setShareMessage('');
    };
    const handleShareSubmit = () => {
        if (!shareTarget || shareMutation.isPending)
            return;
        shareMutation.mutate({
            postId: shareTarget.id,
            message: shareMessage.trim() ? shareMessage.trim() : undefined
        });
    };
    const handleOpenReport = (post) => {
        setReportTarget(post);
        setReportMessage('');
        setActionMenuPostId(null);
    };
    const handleSubmitReport = () => {
        if (!reportTarget || reportMutation.isPending)
            return;
        reportMutation.mutate({
            postId: reportTarget.id,
            reason: reportMessage.trim() ? reportMessage.trim() : undefined
        });
    };
    const deletePostMutation = useMutation({
        mutationFn: (postId) => feedService.deletePost(postId),
        onSuccess: (_result, postId) => {
            queryClient.setQueryData(feedQueryKey, (existing) => existing ? existing.filter((post) => post.id !== postId) : existing);
            void queryClient.invalidateQueries({ queryKey: feedQueryKey });
            showToast('La publicacion se elimino correctamente');
        },
        onError: (error) => {
            console.error('No fue posible eliminar la publicacion', error);
            showToast('No fue posible eliminar la publicacion');
        }
    });
    const handleDeletePost = (postId) => {
        if (deletePostMutation.isPending)
            return;
        const confirmed = window.confirm('¿Seguro que deseas eliminar esta publicacion?');
        if (!confirmed)
            return;
        deletePostMutation.mutate(postId);
    };
    const formatTimeAgo = (timestamp) => {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime()))
            return '';
        const diffMs = Date.now() - date.getTime();
        const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
        if (diffMinutes < 1)
            return 'Justo ahora';
        if (diffMinutes < 60)
            return `hace ${diffMinutes} min`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24)
            return `hace ${diffHours} h`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7)
            return `hace ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short'
        });
    };
    const storiesWithAvatars = useMemo(() => {
        return stories.map((story) => story.id === 'create'
            ? {
                ...story,
                avatar: userAvatar
            }
            : story);
    }, [userAvatar]);
    return (_jsxs(DashboardLayout, { fluid: true, contentClassName: "px-2 sm:px-6 lg:px-10 xl:px-16", children: [_jsx("input", { ref: mediaInputRef, type: "file", accept: "image/*,video/*", className: "hidden", onChange: handleMediaChange, "aria-hidden": "true" }), _jsx("input", { ref: attachmentInputRef, type: "file", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,application/*", className: "hidden", onChange: handleAttachmentChange, "aria-hidden": "true" }), _jsx(AnimatePresence, { children: toast && (_jsx(motion.div, { initial: { opacity: 0, y: -15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, className: "pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_16px_40px_rgba(18,55,29,0.18)] backdrop-blur dark:border-white/20 dark:bg-slate-900/85 dark:text-white", children: toast.message }, toast.id)) }), _jsxs("div", { className: "mx-auto grid w-full gap-4 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,260px)] xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)_minmax(0,300px)]", children: [_jsxs("aside", { className: "hidden max-w-[220px] flex-col gap-3 lg:flex", children: [_jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Sugerencias" }), _jsx(Sparkles, { className: "h-3.5 w-3.5 text-sena-green" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [friendSuggestions.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Unete a grupos para recibir recomendaciones personalizadas." })), friendSuggestions.map((group) => (_jsxs("div", { className: "rounded-xl border border-white/30 bg-white/25 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)] truncate", children: group.name }), _jsxs("p", { className: "text-[11px] text-[var(--color-muted)]", children: ["Grupo - ", new Date(group.createdAt ?? '').toLocaleDateString('es-CO')] }), _jsx(Button, { size: "sm", className: "mt-2 w-full text-xs", children: "Conectar" })] }, group.id)))] })] }), _jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Avances destacados" }), _jsx(Sparkles, { className: "h-3.5 w-3.5 text-sena-green" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [learningHighlights.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Registra tus proyectos para seguir tu progreso." })), learningHighlights.map((project) => (_jsxs("div", { className: "rounded-xl border border-white/30 bg-white/20 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/30 dark:border-white/15 dark:bg-white/10", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)] truncate", children: project.title }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)] capitalize", children: project.status })] }, project.id)))] })] })] }), _jsxs("section", { className: "mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-5", children: [_jsxs(Card, { className: "overflow-hidden bg-white/30 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--color-text)] sm:text-base", children: "Historias" }), _jsx(Button, { variant: "ghost", size: "sm", className: "px-2 py-1 text-xs text-[var(--color-muted)] hover:text-sena-green", onClick: () => setShowStoryModal(true), children: "Crear" })] }), _jsx("div", { className: "mt-3 flex gap-3 overflow-x-auto pb-2", children: storiesWithAvatars.map((story) => (_jsxs("button", { type: "button", onClick: () => story.id === 'create' && setShowStoryModal(true), className: "flex w-20 flex-col items-center gap-2.5 text-xs", children: [_jsxs("div", { className: `relative h-16 w-16 rounded-full p-[3px] ${story.id === 'create'
                                                        ? 'bg-gradient-to-tr from-sena-green via-sena-light to-emerald-500'
                                                        : 'bg-sena-green/20'}`, children: [_jsx("div", { className: "flex h-full w-full items-center justify-center rounded-full border border-[var(--color-surface)] bg-[var(--color-surface)]", children: story.id === 'create' ? (_jsx(Plus, { className: "h-5 w-5 text-sena-green" })) : (_jsx("img", { src: story.avatar, alt: story.name, className: "h-full w-full rounded-full object-cover" })) }), story.isLive && (_jsx("span", { className: "absolute -bottom-1 right-1 rounded-full bg-red-500 px-1.5 py-[1px] text-[9px] font-semibold text-white", children: "Live" }))] }), _jsx("span", { className: "text-[11px] font-medium text-[var(--color-text)] text-center leading-tight", children: story.id === 'create' ? 'Crear historia' : story.name })] }, story.id))) })] }), _jsx(Card, { className: "bg-white/30 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)] dark:bg-white/10", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: userAvatar, alt: "composer", className: "h-10 w-10 rounded-full object-cover shadow-[0_10px_18px_rgba(18,55,29,0.14)]" }), _jsx("div", { className: "flex-1", children: _jsx(TextArea, { placeholder: "Comparte un nuevo avance, recurso o proyecto...", rows: 2, value: composerContent, readOnly: true, onClick: openComposerDialog, onFocus: openComposerDialog, className: "cursor-pointer bg-white/90 text-sm placeholder:text-[var(--color-muted)] dark:bg-white/10" }) })] }), _jsx("div", { className: "flex flex-wrap items-center gap-2", children: composerIcons.map(({ icon: Icon, label, action }) => (_jsx("button", { type: "button", title: label, "aria-label": label, "data-emoji-trigger": action === 'emoji' ? 'true' : undefined, onClick: () => handleInlineComposerAction(action), className: "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/35 bg-white/20 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.12)] transition hover:border-sena-green/60 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sena-green/50 dark:border-white/15 dark:bg-white/10 dark:text-white", children: _jsx(Icon, { className: "h-5 w-5" }) }, label))) })] }) }), isLoadingFeed && (_jsx(Card, { className: "bg-white/25 p-4 text-sm text-[var(--color-muted)] backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: "Cargando publicaciones..." })), !isLoadingFeed && feedPosts.length === 0 && (_jsx(Card, { className: "bg-white/25 p-4 text-sm text-[var(--color-muted)] backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: "Aun no hay publicaciones en tu comunidad. Comparte la primera para iniciar la conversacion." })), feedPosts.map((post) => {
                                const comments = commentsCache[post.id] ?? post.latestComments;
                                const isCommentsOpen = !!expandedComments[post.id];
                                const isReacting = reactionMutation.isPending && reactionMutation.variables?.postId === post.id;
                                const isCommenting = commentMutation.isPending && commentMutation.variables?.postId === post.id;
                                const viewerHasReaction = Boolean(post.viewerReaction);
                                const viewerReactionOption = reactionOptions.find((option) => option.type === post.viewerReaction);
                                const formattedTime = formatTimeAgo(post.createdAt);
                                const authorAvatar = post.author.avatarUrl ??
                                    `https://avatars.dicebear.com/api/initials/${encodeURIComponent(post.author.fullName)}.svg`;
                                const reactionLabel = post.reactionCount === 1 ? 'reaccion' : 'reacciones';
                                const commentLabel = post.commentCount === 1 ? 'comentario' : 'comentarios';
                                const shareLabel = post.shareCount === 1 ? 'compartido' : 'compartidos';
                                const commentUploads = commentUploadStatus[post.id] ?? {};
                                const isCommentUploading = Boolean(commentUploads.media || commentUploads.file);
                                const isSharingPost = isSharing && shareMutation.variables?.postId === post.id;
                                const ReactionIcon = viewerReactionOption?.icon ?? ThumbsUp;
                                const reactionAccent = viewerReactionOption?.accent ?? '';
                                return (_jsxs(Card, { className: "space-y-4 bg-white/30 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.16)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("img", { src: authorAvatar, alt: post.author.fullName, className: "h-11 w-11 rounded-full object-cover" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: post.author.fullName }), post.author.headline && (_jsx("p", { className: "text-xs text-[var(--color-muted)] truncate", children: post.author.headline })), _jsx("p", { className: "text-[11px] text-[var(--color-muted)]", children: formattedTime })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { type: "button", "data-post-menu-trigger": "true", className: "rounded-full p-2 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Acciones de publicacion", onClick: () => setActionMenuPostId((prev) => (prev === post.id ? null : post.id)), children: _jsx(MoreHorizontal, { className: "h-5 w-5" }) }), _jsx(AnimatePresence, { children: actionMenuPostId === post.id && (_jsxs(motion.div, { "data-post-menu": "true", initial: { opacity: 0, scale: 0.9, y: -6 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: -6 }, className: "absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-white/30 bg-white/95 p-2 text-sm text-slate-700 shadow-[0_20px_45px_rgba(18,55,29,0.22)] dark:border-white/15 dark:bg-slate-900/90 dark:text-white", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sena-green/10", onClick: () => {
                                                                            setActionMenuPostId(null);
                                                                            saveMutation.mutate(post.id);
                                                                        }, children: [post.isSaved ? 'Quitar de guardados' : 'Guardar publicacion', _jsx(Bookmark, { className: "h-4 w-4" })] }), _jsxs("button", { type: "button", className: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sena-green/10", onClick: () => {
                                                                            setActionMenuPostId(null);
                                                                            void handleShareLink(post);
                                                                        }, children: ["Copiar enlace", _jsx(Share2, { className: "h-4 w-4" })] }), _jsxs("button", { type: "button", className: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sena-green/10", onClick: () => handleOpenReport(post), children: ["Reportar publicacion", _jsx(Shield, { className: "h-4 w-4" })] }), post.authorId === user?.id && (_jsxs("button", { type: "button", className: "mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-500/10", onClick: () => {
                                                                            setActionMenuPostId(null);
                                                                            handleDeletePost(post.id);
                                                                        }, children: ["Eliminar", _jsx(Trash2, { className: "h-4 w-4" })] }))] })) })] })] }), post.content && (_jsx("p", { className: "whitespace-pre-line text-sm text-[var(--color-text)]", children: post.content })), post.mediaUrl && (_jsx("div", { className: "overflow-hidden rounded-3xl border border-white/15", children: isVideoAsset(post.mediaUrl) ? (_jsx("video", { src: post.mediaUrl, controls: true, className: "w-full object-cover" })) : (_jsx("img", { src: post.mediaUrl, alt: "Contenido compartido", className: "w-full object-cover" })) })), post.attachments?.length > 0 && (_jsx("div", { className: "space-y-2 rounded-2xl border border-white/20 bg-white/15 p-3", children: post.attachments.map((attachment) => {
                                                const meta = getAttachmentMeta(attachment.fileName, attachment.fileType);
                                                const Icon = meta.Icon;
                                                return (_jsxs("a", { href: attachment.url, target: "_blank", rel: "noreferrer", className: "flex items-center justify-between rounded-xl bg-white/30 px-3 py-2 text-xs font-medium text-[var(--color-text)] transition hover:text-sena-green", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: `h-3.5 w-3.5 ${meta.color}` }), attachment.fileName ?? 'Archivo adjunto'] }), _jsx("span", { className: "text-[10px] text-[var(--color-muted)]", children: meta.label })] }, attachment.id));
                                            }) })), post.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: post.tags.map((tag) => (_jsx("span", { className: "rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold text-sena-green", children: tag }, `${post.id}-${tag}`))) })), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)] sm:text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-[var(--color-text)]", children: [_jsx(ThumbsUp, { className: classNames('h-4 w-4', viewerHasReaction ? 'text-sena-green' : 'text-rose-500') }), _jsxs("span", { children: [post.reactionCount, " ", reactionLabel] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { children: [post.commentCount, " ", commentLabel] }), _jsxs("span", { children: [post.shareCount, " ", shareLabel] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3", children: [_jsxs("div", { className: "relative flex-1", "data-reaction-zone": "true", onMouseEnter: () => setReactionPickerPostId(post.id), onMouseLeave: () => setReactionPickerPostId((prev) => (prev === post.id ? null : prev)), onBlur: (event) => {
                                                        if (!event.currentTarget.contains(event.relatedTarget)) {
                                                            setReactionPickerPostId((prev) => (prev === post.id ? null : prev));
                                                        }
                                                    }, children: [_jsxs(Button, { variant: "ghost", className: classNames('w-full justify-center gap-2 text-xs sm:text-sm', viewerHasReaction && 'text-sena-green'), onFocus: () => setReactionPickerPostId(post.id), onClick: () => handleReactionSelect(post.id, 'like'), disabled: isReacting, loading: isReacting, children: [_jsx(ReactionIcon, { className: classNames('h-4 w-4', reactionAccent || undefined) }), viewerReactionOption ? viewerReactionOption.label : viewerHasReaction ? 'Reaccionaste' : 'Reaccionar'] }), _jsx(AnimatePresence, { children: reactionPickerPostId === post.id && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, className: "absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-2 shadow-[0_15px_30px_rgba(18,55,29,0.2)] dark:border-white/20 dark:bg-slate-900/95", children: reactionOptions.map(({ type, label, icon: Icon, accent }) => (_jsx("button", { type: "button", className: "flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-700 transition hover:scale-110 dark:bg-white/15 dark:text-white", onClick: () => handleReactionSelect(post.id, type), "aria-label": label, children: _jsx(Icon, { className: classNames('h-4 w-4', accent) }) }, `${post.id}-${type}`))) })) })] }), _jsxs(Button, { variant: "ghost", className: classNames('justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm', isCommentsOpen && 'text-sena-green'), onClick: () => handleToggleComments(post.id), children: [_jsx(MessageCircle, { className: "h-4 w-4" }), " Comentar"] }), _jsxs(Button, { variant: "ghost", className: "justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm", onClick: () => handleOpenShare(post), disabled: isSharingPost, loading: isSharingPost, children: [_jsx(Share2, { className: "h-4 w-4" }), " Compartir"] })] }), isCommentsOpen && (_jsxs("div", { className: "space-y-3 rounded-2xl border border-white/15 bg-white/12 px-3 py-3", children: [loadingComments[post.id] ? (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Cargando comentarios..." })) : comments.length === 0 ? (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Aun no hay comentarios. Se el primero en opinar." })) : (_jsx("div", { className: "space-y-3", children: comments.map((comment) => {
                                                        const commentAvatar = comment.author.avatarUrl ??
                                                            `https://avatars.dicebear.com/api/initials/${encodeURIComponent(comment.author.fullName)}.svg`;
                                                        return (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("img", { src: commentAvatar, alt: comment.author.fullName, className: "h-8 w-8 rounded-full object-cover" }), _jsxs("div", { className: "flex-1 rounded-2xl bg-white/18 px-3 py-2 text-xs text-[var(--color-text)]", children: [_jsx("p", { className: "font-semibold", children: comment.author.fullName }), _jsx("p", { className: "mt-1 leading-relaxed", children: comment.content }), _jsx("p", { className: "mt-1 text-[10px] text-[var(--color-muted)]", children: formatTimeAgo(comment.createdAt) })] })] }, comment.id));
                                                    }) })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [composerIcons.map(({ icon: Icon, label, action }) => (_jsx("button", { type: "button", title: label, "aria-label": label, "data-emoji-trigger": action === 'emoji' ? 'true' : undefined, className: "flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-sena-green transition hover:border-sena-green/50 hover:bg-white/20 dark:border-white/15 dark:bg-white/5 dark:text-white", onClick: () => {
                                                                        if (action === 'media') {
                                                                            triggerMediaPicker({ type: 'comment', postId: post.id });
                                                                        }
                                                                        else if (action === 'attachments') {
                                                                            triggerAttachmentPicker({ type: 'comment', postId: post.id });
                                                                        }
                                                                        else {
                                                                            toggleEmojiPicker({ type: 'comment', postId: post.id });
                                                                        }
                                                                    }, disabled: (action === 'media' && commentUploads.media) ||
                                                                        (action === 'attachments' && commentUploads.file), children: _jsx(Icon, { className: "h-4 w-4" }) }, `${post.id}-${label}`))), isCommentUploading && (_jsx("span", { className: "text-[11px] text-[var(--color-muted)]", children: "Adjuntando archivo..." }))] }), activeEmojiPicker?.type === 'comment' && activeEmojiPicker.postId === post.id && (_jsx("div", { "data-emoji-panel": "true", className: "flex flex-wrap gap-1 rounded-2xl border border-white/20 bg-white/80 p-2 text-xl shadow-[0_12px_24px_rgba(18,55,29,0.18)] dark:border-white/15 dark:bg-slate-900/90", children: iosEmojiPalette.map((emoji) => (_jsx("button", { type: "button", className: "h-8 w-8 text-center", onClick: () => handleEmojiSelect(emoji), children: emoji }, `${post.id}-emoji-${emoji}`))) })), _jsxs("div", { className: "flex items-end gap-2", children: [_jsx("textarea", { rows: 2, value: commentInputs[post.id] ?? '', onChange: (event) => handleCommentInputChange(post.id, event.target.value), placeholder: "Escribe un comentario...", className: "flex-1 resize-none rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-sena-green focus:ring-2 focus:ring-sena-green/30", disabled: isCommenting || isCommentUploading }), _jsx(Button, { size: "sm", onClick: () => handleSubmitComment(post.id), disabled: isCommenting || isCommentUploading || !(commentInputs[post.id] ?? '').trim(), loading: isCommenting, children: "Enviar" })] })] })] }))] }, post.id));
                            })] }), _jsxs("aside", { className: "hidden flex-col gap-4 md:flex", children: [_jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Tendencias" }), _jsx(Button, { variant: "ghost", size: "sm", className: "px-2 py-1 text-xs", children: "Ver todo" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [resources.slice(0, 5).map((resource) => (_jsxs("div", { className: "rounded-xl border border-white/30 bg-white/25 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)] truncate", children: resource.title }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)] uppercase tracking-wide", children: resource.resourceType })] }, resource.id))), resources.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "An no hay recursos recientes." }))] })] }), _jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Actividad rpida" }), _jsx(Sparkles, { className: "h-3.5 w-3.5 text-sena-green" })] }), _jsxs("div", { className: "mt-3 space-y-2 text-xs text-[var(--color-muted)] sm:text-sm", children: [_jsx("p", { children: "Explora proyectos destacados y sigue a tus instructores favoritos." }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", className: "px-3 py-1.5 text-xs", children: "Explorar proyectos" }), _jsx(Button, { size: "sm", variant: "ghost", className: "px-3 py-1.5 text-xs", children: "Invitar amigos" })] })] })] })] }), _jsx(Button, { className: "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-[0_18px_30px_rgba(57,169,0,0.3)]", variant: "primary", onClick: () => setMessagesOpen((prev) => !prev), children: _jsx(MessageCircle, { className: "h-5 w-5" }) }), _jsx(AnimatePresence, { children: messagesOpen && (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 }, transition: { duration: 0.2 }, className: "fixed bottom-24 right-6 z-40 w-80", children: _jsxs(Card, { padded: false, className: "overflow-hidden rounded-3xl border-white/30 bg-white/25 shadow-[0_25px_45px_rgba(18,55,29,0.25)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/20 px-5 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Mensajes" }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: [chats.length, " conversaciones activas"] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setMessagesOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "max-h-72 space-y-2 overflow-y-auto px-4 py-3", children: [chats.length === 0 && (_jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "An no tienes conversaciones activas." })), chats.map((chat) => (_jsxs("button", { type: "button", onClick: () => handleOpenChat(chat.id), className: "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-sena-green/50 hover:bg-white/30 dark:hover:bg-white/15", children: [_jsx("img", { src: `https://avatars.dicebear.com/api/initials/${encodeURIComponent(chat.name ?? 'Chat')}.svg`, alt: chat.name ?? 'Chat', className: "h-9 w-9 rounded-full object-cover" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: chat.name ?? 'Chat sin ttulo' }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: chat.lastMessageAt
                                                                    ? new Date(chat.lastMessageAt).toLocaleTimeString('es-CO', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : 'Sin mensajes' })] })] }, chat.id)))] })] }) }, "message-list")) }), _jsx(AnimatePresence, { children: openChatIds.map((chatId, index) => {
                            const chat = chats.find((c) => c.id === chatId);
                            if (!chat)
                                return null;
                            return _jsx(ChatWindow, { chat: chat, index: index, onClose: handleCloseChat }, chat.id);
                        }) }), isComposerDialogOpen && (_jsx(GlassDialog, { open: isComposerDialogOpen, onClose: closeComposerDialog, size: "lg", preventCloseOnBackdrop: isPublishing, overlayClassName: "!bg-slate-100/70 backdrop-blur-sm dark:!bg-slate-950/65", contentClassName: "p-0 !overflow-visible !bg-white/55 !backdrop-blur-[30px] !border-white/60 !shadow-[0_50px_120px_rgba(15,38,25,0.25)] dark:!bg-slate-900/85 dark:!border-white/15", children: _jsxs("div", { className: "w-full max-w-2xl space-y-5 p-5 sm:p-8", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Crear publicacion" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Comparte avances, anuncios o recursos con tu red." })] }), _jsxs(Button, { variant: "ghost", onClick: closeComposerDialog, disabled: isPublishing, className: "self-start rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-[0_12px_30px_rgba(15,38,25,0.12)] backdrop-blur hover:border-sena-green/40 hover:text-sena-green disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25 dark:bg-white/15 dark:text-[var(--color-muted)]", children: [_jsx(X, { className: "mr-1 h-4 w-4" }), " Cerrar"] })] }), _jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-white/30 bg-white/40 p-3 shadow-[0_12px_28px_rgba(18,55,29,0.12)] dark:border-white/10 dark:bg-white/5", children: [_jsx("img", { src: userAvatar, alt: userDisplayName, className: "h-12 w-12 rounded-full object-cover" }), _jsx("div", { children: _jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: userDisplayName }) })] }), _jsx(TextArea, { rows: 5, autoFocus: true, placeholder: "Que estas pensando hoy?", value: composerContent, onChange: (event) => setComposerContent(event.target.value), disabled: isPublishing, className: "bg-white/90 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] dark:bg-white/10" }), composerMedia && composerMediaPreview && (_jsxs("div", { className: "space-y-3 rounded-2xl border border-white/20 bg-white/60 p-3 shadow-[0_12px_30px_rgba(18,55,29,0.1)] dark:border-white/15 dark:bg-white/5 w-full max-w-xs", children: [_jsxs("div", { className: "flex items-center justify-between text-sm font-semibold text-[var(--color-text)]", children: [_jsx("span", { children: "Multimedia seleccionada" }), _jsx("button", { type: "button", className: "text-xs text-rose-500 hover:text-rose-600", onClick: handleRemoveComposerMedia, children: "Eliminar" })] }), _jsx("div", { className: "overflow-hidden rounded-xl border border-white/40", children: isVideoAsset(composerMediaPreview) ? (_jsx("video", { src: composerMediaPreview, controls: true, className: "h-32 w-full object-cover" })) : (_jsx("img", { src: composerMediaPreview, alt: "Vista previa", className: "h-32 w-full object-cover" })) })] })), composerAttachments.length > 0 && (_jsxs("div", { className: "space-y-2 rounded-2xl border border-white/20 bg-white/50 p-3 shadow-[0_12px_30px_rgba(18,55,29,0.1)] dark:border-white/15 dark:bg-white/5", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Archivos adjuntos" }), composerAttachments.map((attachment) => {
                                            const meta = getAttachmentMeta(attachment.fileName, attachment.fileType);
                                            const Icon = meta.Icon;
                                            return (_jsxs("div", { className: "flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs text-[var(--color-text)] dark:bg-white/10", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: `h-3.5 w-3.5 ${meta.color}` }), attachment.fileName ?? 'Archivo', _jsxs("span", { className: "text-[10px] text-[var(--color-muted)]", children: ["(", meta.label, ")"] })] }), _jsx("button", { type: "button", className: "text-rose-500 hover:text-rose-600", onClick: () => handleRemoveComposerAttachment(attachment.id), children: "Quitar" })] }, attachment.id));
                                        })] })), _jsxs("div", { className: "rounded-2xl border border-dashed border-white/40 bg-white/25 px-4 py-4 shadow-[0_12px_30px_rgba(18,55,29,0.1)] dark:border-white/15 dark:bg-white/5", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Agregar a tu publicacion" }), _jsxs("div", { className: "mt-3 space-y-3", children: [_jsx("div", { className: "flex flex-wrap items-center gap-3", children: composerIcons.map(({ icon: Icon, label, action }) => (_jsxs("button", { type: "button", title: label, "aria-label": label, "data-emoji-trigger": action === 'emoji' ? 'true' : undefined, onClick: () => {
                                                            if (action === 'media') {
                                                                triggerMediaPicker({ type: 'composer' });
                                                            }
                                                            else if (action === 'attachments') {
                                                                if (!maxAttachmentsReached) {
                                                                    triggerAttachmentPicker({ type: 'composer' });
                                                                }
                                                            }
                                                            else {
                                                                toggleEmojiPicker({ type: 'composer' });
                                                            }
                                                        }, className: classNames('flex min-w-[140px] flex-1 items-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-3 py-2 text-left text-xs font-semibold text-[var(--color-text)] transition hover:border-sena-green/40 hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sena-green/40 dark:border-white/15 dark:bg-white/10', action === 'attachments' && maxAttachmentsReached && 'opacity-50'), disabled: action === 'attachments' && maxAttachmentsReached, children: [_jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-sena-green shadow-[0_6px_16px_rgba(18,55,29,0.15)] dark:bg-white/15 dark:text-white", children: _jsx(Icon, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-[13px]", children: [label, action === 'attachments' && maxAttachmentsReached ? ' (limite)' : ''] })] }, `modal-${label}`))) }), activeEmojiPicker?.type === 'composer' && (_jsx("div", { "data-emoji-panel": "true", className: "flex flex-wrap gap-1 rounded-2xl border border-white/30 bg-white/80 p-2 text-xl shadow-[0_12px_24px_rgba(18,55,29,0.18)] dark:border-white/15 dark:bg-slate-900/85", children: iosEmojiPalette.map((emoji) => (_jsx("button", { type: "button", className: "h-8 w-8 text-center", onClick: () => handleEmojiSelect(emoji), children: emoji }, `composer-emoji-${emoji}`))) }))] })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "secondary", onClick: closeComposerDialog, disabled: isPublishing, children: "Cancelar" }), _jsx(Button, { onClick: handleComposerSubmit, loading: isPublishing, disabled: isPublishing || isUploadingMedia || isUploadingAttachment || !composerContent.trim(), className: "min-w-[120px]", children: "Publicar" })] })] }) })), showStoryModal && (_jsxs(GlassDialog, { open: showStoryModal, onClose: () => setShowStoryModal(false), size: "md", contentClassName: "p-8", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Crear historia" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Comparte un momento con tu comunidad." })] }), _jsx(Button, { variant: "ghost", onClick: () => setShowStoryModal(false), children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Input, { type: "file", accept: "image/*,video/*" }), _jsx(TextArea, { rows: 4, placeholder: "Escribe una descripcion..." }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowStoryModal(false), children: "Cancelar" }), _jsx(Button, { onClick: () => setShowStoryModal(false), children: "Publicar historia" })] })] })] })), shareTarget && (_jsxs(GlassDialog, { open: Boolean(shareTarget), onClose: handleCloseShareModal, size: "lg", preventCloseOnBackdrop: isSharing, contentClassName: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Compartir publicacion" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Agrega un mensaje y compartelo con tu comunidad." })] }), _jsx(Button, { variant: "ghost", onClick: handleCloseShareModal, disabled: isSharing, children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(TextArea, { rows: 4, placeholder: "Que piensas sobre esta publicacion?", value: shareMessage, onChange: (event) => setShareMessage(event.target.value), disabled: isSharing }), _jsxs("div", { className: "rounded-2xl border border-white/20 bg-white/12 px-4 py-4 text-sm text-[var(--color-text)]", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("img", { src: shareTarget.author.avatarUrl ??
                                                            `https://avatars.dicebear.com/api/initials/${encodeURIComponent(shareTarget.author.fullName)}.svg`, alt: shareTarget.author.fullName, className: "h-10 w-10 rounded-full object-cover" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-semibold", children: shareTarget.author.fullName }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: formatTimeAgo(shareTarget.createdAt) })] })] }), shareTarget.content && (_jsx("p", { className: "mt-3 text-sm leading-relaxed text-[var(--color-text)]", children: shareTarget.content })), shareTarget.mediaUrl && (_jsx("div", { className: "mt-3 overflow-hidden rounded-2xl border border-white/15", children: isVideoAsset(shareTarget.mediaUrl) ? (_jsx("video", { src: shareTarget.mediaUrl, controls: true, className: "w-full object-cover" })) : (_jsx("img", { src: shareTarget.mediaUrl, alt: "Vista previa", className: "w-full object-cover" })) })), shareTarget.attachments?.length > 0 && (_jsx("div", { className: "mt-3 space-y-2 rounded-xl border border-white/15 bg-white/20 p-3", children: shareTarget.attachments.map((attachment) => {
                                                    const meta = getAttachmentMeta(attachment.fileName, attachment.fileType);
                                                    const Icon = meta.Icon;
                                                    return (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: `h-3.5 w-3.5 ${meta.color}` }), attachment.fileName ?? 'Archivo'] }), _jsx("span", { className: "text-[10px] text-[var(--color-muted)]", children: meta.label })] }, attachment.id));
                                                }) }))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: handleCloseShareModal, disabled: isSharing, children: "Cancelar" }), _jsx(Button, { onClick: handleShareSubmit, loading: isSharing, disabled: isSharing, children: "Compartir" })] })] })] })), reportTarget && (_jsx(GlassDialog, { open: Boolean(reportTarget), onClose: () => {
                            if (reportMutation.isPending)
                                return;
                            setReportTarget(null);
                            setReportMessage('');
                        }, size: "md", preventCloseOnBackdrop: reportMutation.isPending, contentClassName: "p-0 !overflow-visible !bg-white/55 !backdrop-blur-[30px] !border-white/60 !shadow-[0_50px_120px_rgba(15,38,25,0.25)] dark:!bg-slate-900/85 dark:!border-white/15", children: _jsxs("div", { className: "max-h-[70vh] space-y-5 overflow-y-auto rounded-[32px] border border-white/60 bg-white/45 p-5 shadow-[0_28px_70px_rgba(15,38,25,0.2)] backdrop-blur-[22px] dark:border-white/15 dark:bg-white/5 dark:shadow-[0_28px_60px_rgba(10,22,15,0.45)] sm:p-8", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Reportar publicacion" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Describe el motivo para que el equipo de moderacion pueda revisarla." })] }), _jsx(Button, { variant: "ghost", onClick: () => {
                                                if (reportMutation.isPending)
                                                    return;
                                                setReportTarget(null);
                                                setReportMessage('');
                                            }, className: "self-start rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs text-[var(--color-muted)] shadow-[0_10px_24px_rgba(18,55,29,0.18)] backdrop-blur hover:text-sena-green dark:border-white/20 dark:bg-white/10", disabled: reportMutation.isPending, children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx(TextArea, { rows: 4, placeholder: "Contenido falso, spam, lenguaje inapropiado, etc.", value: reportMessage, onChange: (event) => setReportMessage(event.target.value), disabled: reportMutation.isPending, className: "bg-white/80 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] dark:bg-white/10" }), _jsxs("div", { className: "rounded-[24px] border border-white/25 bg-white/35 p-4 text-sm text-[var(--color-text)] shadow-[0_20px_40px_rgba(18,55,29,0.18)] dark:border-white/10 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: reportTarget.author.avatarUrl ??
                                                        `https://avatars.dicebear.com/api/initials/${encodeURIComponent(reportTarget.author.fullName)}.svg`, alt: reportTarget.author.fullName, className: "h-10 w-10 rounded-full object-cover" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: reportTarget.author.fullName }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)]", children: formatTimeAgo(reportTarget.createdAt) })] })] }), reportTarget.content && (_jsx("p", { className: "mt-3 text-sm leading-relaxed text-[var(--color-text)]", children: reportTarget.content }))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => {
                                                if (reportMutation.isPending)
                                                    return;
                                                setReportTarget(null);
                                                setReportMessage('');
                                            }, disabled: reportMutation.isPending, children: "Cancelar" }), _jsx(Button, { onClick: handleSubmitReport, loading: reportMutation.isPending, disabled: reportMutation.isPending, children: "Enviar reporte" })] })] }) }))] })] }));
};
const ChatWindow = ({ chat, index, onClose }) => {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['home', 'chat', chat.id],
        queryFn: async () => await chatService.listMessages(chat.id),
        enabled: Boolean(chat.id)
    });
    const sendMessageMutation = useMutation({
        mutationFn: (content) => chatService.sendMessage(chat.id, { content }),
        onSuccess: async () => {
            setMessage('');
            await queryClient.invalidateQueries({ queryKey: ['home', 'chat', chat.id] });
        }
    });
    return (_jsx(motion.div, { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 16 }, transition: { duration: 0.2 }, className: "fixed bottom-28 z-50 w-80", style: { right: 24 + index * 320 }, children: _jsxs(Card, { padded: false, className: "flex h-96 flex-col overflow-hidden rounded-3xl border-white/30 bg-white/20 shadow-[0_25px_45px_rgba(18,55,29,0.28)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/20 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: `https://avatars.dicebear.com/api/initials/${encodeURIComponent(chat.name ?? 'Chat')}.svg`, alt: chat.name ?? 'Chat', className: "h-9 w-9 rounded-full object-cover" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: chat.name ?? 'Chat sin ttulo' }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Activo ahora" })] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onClose(chat.id), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "flex-1 space-y-3 overflow-y-auto px-4 py-3", children: [isLoading && _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Cargando mensajes..." }), !isLoading && messages.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "An no hay mensajes en este chat." })), messages.map((msg) => (_jsxs("div", { className: "rounded-2xl bg-white/30 px-3 py-2 text-sm text-[var(--color-text)] dark:bg-white/10", children: [_jsx("p", { children: msg.content }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: new Date(msg.createdAt).toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) })] }, msg.id)))] }), _jsx("form", { className: "border-t border-white/20 px-4 py-3", onSubmit: (event) => {
                        event.preventDefault();
                        if (!message.trim())
                            return;
                        sendMessageMutation.mutate(message.trim());
                    }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { value: message, onChange: (event) => setMessage(event.target.value), placeholder: "Escribe un mensaje...", className: "flex-1 rounded-2xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30" }), _jsx(Button, { type: "submit", size: "sm", loading: sendMessageMutation.isPending, children: "Enviar" })] }) })] }) }));
};
