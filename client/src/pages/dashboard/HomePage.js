import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { chatService } from '../../services/chatService';
import { groupService } from '../../services/groupService';
import { projectService } from '../../services/projectService';
import { libraryService } from '../../services/libraryService';
import { Bookmark, Heart, MessageCircle, Share2, Sparkles, Image, Paperclip, Smile, Video, Plus, X } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
const stories = [
    { id: 'create', name: 'Tu historia', avatar: '', isLive: false },
    { id: '1', name: 'Laboratorio UX', avatar: 'https://i.pravatar.cc/100?img=12', isLive: true },
    { id: '2', name: 'Dev Backend', avatar: 'https://i.pravatar.cc/100?img=25', isLive: false },
    { id: '3', name: 'Talento Verde', avatar: 'https://i.pravatar.cc/100?img=33', isLive: true },
    { id: '4', name: 'MakerLab', avatar: 'https://i.pravatar.cc/100?img=45', isLive: false },
    { id: '5', name: 'Frontend Squad', avatar: 'https://i.pravatar.cc/100?img=18', isLive: false },
    { id: '6', name: 'AI Hub', avatar: 'https://i.pravatar.cc/100?img=52', isLive: true }
];
const feedPosts = [
    {
        id: 'post-1',
        author: 'Laboratorio de Innovacion',
        role: 'Comunidad - Diseno UX',
        avatar: 'https://i.pravatar.cc/100?img=48',
        timeAgo: 'hace 2 horas',
        description: 'Estamos prototipando una app para facilitar la organizacin de proyectos colaborativos entre aprendices. Dejanos tu feedback!',
        image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=60',
        likes: 168,
        comments: 42,
        tags: ['#UX', '#Prototipos', '#Colaboracion']
    },
    {
        id: 'post-2',
        author: 'Talento Verde',
        role: 'Proyecto sostenible',
        avatar: 'https://i.pravatar.cc/100?img=36',
        timeAgo: 'hace 4 horas',
        description: 'Presentamos los avances del piloto de huertas urbanas monitorizadas con sensores IoT desarrollados por aprendices.',
        image: 'https://images.unsplash.com/photo-1516750105099-4a769162f838?auto=format&fit=crop&w=900&q=60',
        likes: 245,
        comments: 63,
        tags: ['#TalentoVerde', '#IoT', '#SmartCities']
    }
];
const composerIcons = [
    { icon: Image, label: 'Imagen' },
    { icon: Video, label: 'Video' },
    { icon: Paperclip, label: 'Adjuntar' },
    { icon: Smile, label: 'Reacciones' }
];
export const HomePage = () => {
    const { user } = useAuth();
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [openChatIds, setOpenChatIds] = useState([]);
    const [showStoryModal, setShowStoryModal] = useState(false);
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
    const friendSuggestions = groups.slice(0, 3);
    const learningHighlights = projects.slice(0, 3);
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
    const storiesWithAvatars = useMemo(() => {
        return stories.map((story) => story.id === 'create'
            ? {
                ...story,
                avatar: user?.avatarUrl ?? 'https://i.pravatar.cc/100?img=5'
            }
            : story);
    }, [user]);
    return (_jsx(DashboardLayout, { fluid: true, contentClassName: "px-2 sm:px-6 lg:px-10 xl:px-16", children: _jsxs("div", { className: "mx-auto grid w-full gap-4 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,260px)] xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)_minmax(0,300px)]", children: [_jsxs("aside", { className: "hidden max-w-[220px] flex-col gap-3 lg:flex", children: [_jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Sugerencias" }), _jsx(Sparkles, { className: "h-3.5 w-3.5 text-sena-green" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [friendSuggestions.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Unete a grupos para recibir recomendaciones personalizadas." })), friendSuggestions.map((group) => (_jsxs("div", { className: "rounded-xl border border-white/30 bg-white/25 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)] truncate", children: group.name }), _jsxs("p", { className: "text-[11px] text-[var(--color-muted)]", children: ["Grupo - ", new Date(group.createdAt ?? '').toLocaleDateString('es-CO')] }), _jsx(Button, { size: "sm", className: "mt-2 w-full text-xs", children: "Conectar" })] }, group.id)))] })] }), _jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Avances destacados" }), _jsx(Sparkles, { className: "h-3.5 w-3.5 text-sena-green" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [learningHighlights.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "Registra tus proyectos para seguir tu progreso." })), learningHighlights.map((project) => (_jsxs("div", { className: "rounded-xl border border-white/30 bg-white/20 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/30 dark:border-white/15 dark:bg-white/10", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)] truncate", children: project.title }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)] capitalize", children: project.status })] }, project.id)))] })] })] }), _jsxs("section", { className: "mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-5", children: [_jsxs(Card, { className: "overflow-hidden bg-white/30 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--color-text)] sm:text-base", children: "Historias" }), _jsx(Button, { variant: "ghost", size: "sm", className: "px-2 py-1 text-xs text-[var(--color-muted)] hover:text-sena-green", onClick: () => setShowStoryModal(true), children: "Crear" })] }), _jsx("div", { className: "mt-3 flex gap-3 overflow-x-auto pb-2", children: storiesWithAvatars.map((story) => (_jsxs("button", { type: "button", onClick: () => story.id === 'create' && setShowStoryModal(true), className: "flex w-20 flex-col items-center gap-2.5 text-xs", children: [_jsxs("div", { className: `relative h-16 w-16 rounded-full p-[3px] ${story.id === 'create'
                                                    ? 'bg-gradient-to-tr from-sena-green via-sena-light to-emerald-500'
                                                    : 'bg-sena-green/20'}`, children: [_jsx("div", { className: "flex h-full w-full items-center justify-center rounded-full border border-[var(--color-surface)] bg-[var(--color-surface)]", children: story.id === 'create' ? (_jsx(Plus, { className: "h-5 w-5 text-sena-green" })) : (_jsx("img", { src: story.avatar, alt: story.name, className: "h-full w-full rounded-full object-cover" })) }), story.isLive && (_jsx("span", { className: "absolute -bottom-1 right-1 rounded-full bg-red-500 px-1.5 py-[1px] text-[9px] font-semibold text-white", children: "Live" }))] }), _jsx("span", { className: "text-[11px] font-medium text-[var(--color-text)] text-center leading-tight", children: story.id === 'create' ? 'Crear historia' : story.name })] }, story.id))) })] }), _jsx(Card, { className: "bg-white/30 backdrop-blur-xl shadow-[0_10px_24px_rgba(18,55,29,0.14)] dark:bg-white/10", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("img", { src: user?.avatarUrl ?? 'https://i.pravatar.cc/100?img=60', alt: "composer", className: "h-10 w-10 rounded-full object-cover shadow-[0_10px_18px_rgba(18,55,29,0.14)]" }), _jsxs("div", { className: "flex-1 space-y-3", children: [_jsx(TextArea, { placeholder: "Comparte un nuevo avance, recurso o proyecto...", rows: 3 }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("div", { className: "flex gap-2", children: composerIcons.map(({ icon: Icon, label }) => (_jsx("button", { type: "button", className: "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/35 text-sena-green transition hover:shadow-[0_0_18px_rgba(57,169,0,0.35)]", "aria-label": label, children: _jsx(Icon, { className: "h-4 w-4" }) }, label))) }), _jsx(Button, { size: "sm", leftIcon: _jsx(Sparkles, { className: "h-4 w-4" }), className: "px-3 py-2 text-xs", children: "Publicar" })] })] })] }) }), feedPosts.map((post) => (_jsxs(Card, { className: "space-y-3 bg-white/30 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.16)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("img", { src: post.avatar, alt: post.author, className: "h-11 w-11 rounded-full object-cover" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: post.author }), _jsxs("p", { className: "text-xs text-[var(--color-muted)] truncate", children: [post.role, "  ", post.timeAgo] })] })] }), _jsx("p", { className: "text-sm text-[var(--color-text)]", children: post.description }), _jsx("div", { className: "overflow-hidden rounded-3xl", children: _jsx("img", { src: post.image, alt: post.author, className: "h-full w-full object-cover" }) }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)] sm:text-sm", children: [_jsxs("div", { className: "flex items-center gap-1 text-[var(--color-text)]", children: [_jsx(Heart, { className: "h-4 w-4 text-rose-500" }), post.likes, " reacciones"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { children: [post.comments, " comentarios"] }), _jsx("span", { className: "hidden sm:inline" }), _jsx("span", { className: "text-sena-green", children: post.tags.join(' ') })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3", children: [_jsxs(Button, { variant: "ghost", className: "justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm", children: [_jsx(Heart, { className: "h-4 w-4" }), " Reaccionar"] }), _jsxs(Button, { variant: "ghost", className: "justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm", children: [_jsx(MessageCircle, { className: "h-4 w-4" }), " Comentar"] }), _jsxs(Button, { variant: "ghost", className: "justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm", children: [_jsx(Share2, { className: "h-4 w-4" }), " Compartir"] }), _jsxs(Button, { variant: "ghost", className: "justify-center gap-2 text-xs sm:flex-1 sm:justify-center sm:text-sm", children: [_jsx(Bookmark, { className: "h-4 w-4" }), " Guardar"] })] })] }, post.id)))] }), _jsxs("aside", { className: "hidden flex-col gap-4 md:flex", children: [_jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Tendencias" }), _jsx(Button, { variant: "ghost", size: "sm", className: "px-2 py-1 text-xs", children: "Ver todo" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [resources.slice(0, 5).map((resource) => (_jsxs("div", { className: "rounded-xl border border-white/30 bg-white/25 px-3 py-2.5 transition hover:border-sena-green/40 hover:bg-white/35 dark:border-white/15 dark:bg-white/10", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)] truncate", children: resource.title }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)] uppercase tracking-wide", children: resource.resourceType })] }, resource.id))), resources.length === 0 && (_jsx("p", { className: "text-xs text-[var(--color-muted)]", children: "An no hay recursos recientes." }))] })] }), _jsxs(Card, { className: "bg-white/25 p-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(18,55,29,0.12)] dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Actividad rpida" }), _jsx(Sparkles, { className: "h-3.5 w-3.5 text-sena-green" })] }), _jsxs("div", { className: "mt-3 space-y-2 text-xs text-[var(--color-muted)] sm:text-sm", children: [_jsx("p", { children: "Explora proyectos destacados y sigue a tus instructores favoritos." }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", className: "px-3 py-1.5 text-xs", children: "Explorar proyectos" }), _jsx(Button, { size: "sm", variant: "ghost", className: "px-3 py-1.5 text-xs", children: "Invitar amigos" })] })] })] })] }), _jsx(Button, { className: "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-[0_18px_30px_rgba(57,169,0,0.3)]", variant: "primary", onClick: () => setMessagesOpen((prev) => !prev), children: _jsx(MessageCircle, { className: "h-5 w-5" }) }), _jsx(AnimatePresence, { children: messagesOpen && (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 }, transition: { duration: 0.2 }, className: "fixed bottom-24 right-6 z-40 w-80", children: _jsxs(Card, { padded: false, className: "overflow-hidden rounded-3xl border-white/30 bg-white/25 shadow-[0_25px_45px_rgba(18,55,29,0.25)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/20 px-5 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Mensajes" }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: [chats.length, " conversaciones activas"] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setMessagesOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "max-h-72 space-y-2 overflow-y-auto px-4 py-3", children: [chats.length === 0 && (_jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "An no tienes conversaciones activas." })), chats.map((chat) => (_jsxs("button", { type: "button", onClick: () => handleOpenChat(chat.id), className: "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-sena-green/50 hover:bg-white/30 dark:hover:bg-white/15", children: [_jsx("img", { src: `https://avatars.dicebear.com/api/initials/${encodeURIComponent(chat.name ?? 'Chat')}.svg`, alt: chat.name ?? 'Chat', className: "h-9 w-9 rounded-full object-cover" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: chat.name ?? 'Chat sin ttulo' }), _jsx("p", { className: "text-xs text-[var(--color-muted)]", children: chat.lastMessageAt
                                                                ? new Date(chat.lastMessageAt).toLocaleTimeString('es-CO', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : 'Sin mensajes' })] })] }, chat.id)))] })] }) }, "message-list")) }), _jsx(AnimatePresence, { children: openChatIds.map((chatId, index) => {
                        const chat = chats.find((c) => c.id === chatId);
                        if (!chat)
                            return null;
                        return _jsx(ChatWindow, { chat: chat, index: index, onClose: handleCloseChat }, chat.id);
                    }) }), _jsx(AnimatePresence, { children: showStoryModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "w-full max-w-lg rounded-3xl border-white/25 bg-white/20 p-8 shadow-[0_30px_55px_rgba(18,55,29,0.22)] backdrop-blur-2xl dark:bg-white/10", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Crear historia" }), _jsx("p", { className: "text-sm text-[var(--color-muted)]", children: "Comparte un momento con tu comunidad." })] }), _jsx(Button, { variant: "ghost", onClick: () => setShowStoryModal(false), children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx(Input, { type: "file", accept: "image/*,video/*" }), _jsx(TextArea, { rows: 4, placeholder: "Escribe una descripcin..." }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowStoryModal(false), children: "Cancelar" }), _jsx(Button, { onClick: () => setShowStoryModal(false), children: "Publicar historia" })] })] })] }) })) })] }) }));
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
