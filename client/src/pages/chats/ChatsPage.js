import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { chatService } from '../../services/chatService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MessageCirclePlus, Send, Smile, Users as UsersIcon, User as UserIcon, Paperclip, Search, Phone, Video, Info, MoreHorizontal, Settings2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';
const filterTabs = [
    { value: 'all', label: 'Todos' },
    { value: 'unread', label: 'No leidos' },
    { value: 'groups', label: 'Grupos' }
];
const createChatSchema = z
    .object({
    chatType: z.enum(['direct', 'group']),
    name: z.string().trim().optional(),
    memberIds: z.string().min(1, 'Ingresa al menos un identificador')
})
    .superRefine((values, ctx) => {
    const members = values.memberIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    if (members.length === 0) {
        ctx.addIssue({
            path: ['memberIds'],
            code: 'custom',
            message: 'Ingresa al menos un identificador valido'
        });
    }
    if (values.chatType === 'direct' && members.length !== 1) {
        ctx.addIssue({
            path: ['memberIds'],
            code: 'custom',
            message: 'Los chats privados requieren exactamente un destinatario'
        });
    }
    if (values.chatType === 'group') {
        const name = values.name?.trim();
        if (!name || name.length < 3) {
            ctx.addIssue({
                path: ['name'],
                code: 'custom',
                message: 'Define un nombre para el grupo (minimo 3 caracteres)'
            });
        }
    }
});
const initialCreateChatValues = {
    chatType: 'direct',
    name: '',
    memberIds: ''
};
const formatLastActivity = (iso) => {
    const target = new Date(iso);
    const now = new Date();
    const isSameDay = target.toDateString() === now.toDateString();
    if (isSameDay) {
        return target.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return target.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short'
    });
};
const getChatName = (name, isGroup) => name?.trim() && name.trim().length > 0 ? name.trim() : isGroup ? 'Grupo sin titulo' : 'Chat privado';
const avatarGradientPalette = [
    'from-sena-green/90 to-emerald-400/80',
    'from-blue-500/90 to-cyan-400/80',
    'from-amber-500/90 to-orange-400/80',
    'from-purple-500/90 to-indigo-400/80'
];
const getAvatarGradient = (seed) => {
    if (!seed) {
        return `bg-gradient-to-br ${avatarGradientPalette[0]}`;
    }
    let hash = 0;
    for (const char of seed) {
        hash = (hash + char.charCodeAt(0) * 17) % 2048;
    }
    return `bg-gradient-to-br ${avatarGradientPalette[hash % avatarGradientPalette.length]}`;
};
const getInitialsFromLabel = (label) => {
    const cleaned = label?.trim();
    if (!cleaned)
        return 'FL';
    const parts = cleaned.split(/\s+/).slice(0, 2);
    const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
    return initials || cleaned.slice(0, 2).toUpperCase();
};
export const ChatsPage = () => {
    const queryClient = useQueryClient();
    const { user: authUser } = useAuth();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [showNewChat, setShowNewChat] = useState(false);
    const [message, setMessage] = useState('');
    const messageListRef = useRef(null);
    const { data: chats = [], isLoading: isLoadingChats } = useQuery({
        queryKey: ['chats'],
        queryFn: chatService.listChats
    });
    useEffect(() => {
        if (!selectedChatId && chats.length > 0) {
            setSelectedChatId(chats[0].id);
        }
    }, [chats, selectedChatId]);
    const { data: messages = [], isFetching: isFetchingMessages } = useQuery({
        enabled: Boolean(selectedChatId),
        queryKey: ['chats', selectedChatId, 'messages'],
        queryFn: async () => {
            if (!selectedChatId)
                return [];
            return await chatService.listMessages(selectedChatId);
        }
    });
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);
    const createChatMutation = useMutation({
        mutationFn: chatService.createChat,
        onSuccess: (chat) => {
            queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => { });
            setSelectedChatId(chat.id);
        }
    });
    const sendMessageMutation = useMutation({
        mutationFn: (payload) => chatService.sendMessage(payload.chatId, { content: payload.content }),
        onSuccess: () => {
            if (!selectedChatId)
                return;
            queryClient.invalidateQueries({ queryKey: ['chats', selectedChatId, 'messages'] }).catch(() => { });
        }
    });
    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(createChatSchema),
        defaultValues: initialCreateChatValues
    });
    const chatType = watch('chatType');
    useEffect(() => {
        if (chatType === 'direct') {
            setValue('name', '');
        }
    }, [chatType, setValue]);
    const filteredChats = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        return chats.filter((chat) => {
            if (activeFilter === 'groups' && !chat.isGroup)
                return false;
            if (activeFilter === 'unread' && chat.lastMessageAt)
                return false;
            if (!normalized)
                return true;
            const name = getChatName(chat.name, chat.isGroup).toLowerCase();
            return name.includes(normalized) || chat.id.toLowerCase().includes(normalized);
        });
    }, [chats, activeFilter, searchTerm]);
    const tabStats = useMemo(() => ({
        all: chats.length,
        unread: chats.filter((chat) => !chat.lastMessageAt).length,
        groups: chats.filter((chat) => chat.isGroup).length
    }), [chats]);
    const activeChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId) ?? null, [chats, selectedChatId]);
    const handleCreateChat = handleSubmit((values) => {
        const members = values.memberIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
        createChatMutation.mutate({
            name: values.chatType === 'group' ? values.name?.trim() || undefined : undefined,
            isGroup: values.chatType === 'group',
            memberIds: members
        }, {
            onSuccess: () => {
                reset(initialCreateChatValues);
                setShowNewChat(false);
            }
        });
    });
    const handleSendMessage = (event) => {
        event.preventDefault();
        if (!selectedChatId || !message.trim())
            return;
        sendMessageMutation.mutate({ chatId: selectedChatId, content: message.trim() }, {
            onSuccess: () => {
                setMessage('');
            }
        });
    };
    const activeChatName = activeChat ? getChatName(activeChat.name, activeChat.isGroup) : '';
    const activeChatInitials = activeChat ? getInitialsFromLabel(activeChatName) : '';
    const activeChatGradient = activeChat ? getAvatarGradient(activeChat.id) : '';
    const activeChatLastActivity = activeChat
        ? formatLastActivity(activeChat.lastMessageAt ?? activeChat.createdAt)
        : '';
    return (_jsx(DashboardLayout, { title: "Chats", subtitle: "Mantente en contacto con tus equipos y grupos de estudio.", children: _jsxs("div", { className: "grid min-h-[75vh] gap-5 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]", children: [_jsxs(Card, { padded: false, className: "relative flex max-h-[80vh] flex-col overflow-hidden rounded-[32px] border-white/25 bg-white/20 shadow-[0_40px_90px_rgba(15,38,25,0.24)]", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_60%)] opacity-70 dark:opacity-25" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/12 to-white/18 dark:from-white/8 dark:via-white/5 dark:to-white/10" }), _jsxs("div", { className: "relative z-10 flex h-full flex-col", children: [_jsxs("header", { className: "flex items-center justify-between gap-3 border-b border-white/20 px-6 py-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold text-[var(--color-text)]", children: "Chats" }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)]", children: "Mantente al dia con tus conversaciones y grupos." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", className: "flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Preferencias de chat", children: _jsx(Settings2, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: "flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Mas opciones", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }), _jsxs(Button, { size: "sm", variant: "secondary", className: "px-3 text-[11px] shadow-[0_12px_24px_rgba(18,55,29,0.18)]", onClick: () => setShowNewChat((prev) => !prev), children: [_jsx(MessageCirclePlus, { className: "h-4 w-4" }), "Nuevo chat"] })] })] }), _jsxs("div", { className: "space-y-4 border-b border-white/15 px-6 py-4", children: [_jsxs("div", { className: "flex items-center gap-2 rounded-[22px] border border-white/25 bg-white/18 px-3 py-2 shadow-[0_16px_28px_rgba(18,55,29,0.18)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30", children: [_jsx(Search, { className: "h-4 w-4 text-[var(--color-muted)]" }), _jsx("input", { type: "text", placeholder: "Buscar en Messenger", className: "flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }), _jsx("div", { className: "flex items-center gap-1 rounded-full bg-white/15 p-1 text-[11px] text-[var(--color-muted)]", children: filterTabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveFilter(tab.value), className: classNames('flex-1 rounded-full px-3 py-1 transition-all', activeFilter === tab.value
                                                    ? 'bg-white text-sena-green shadow-[0_10px_22px_rgba(57,169,0,0.20)]'
                                                    : 'hover:text-[var(--color-text)]'), children: _jsxs("span", { className: "flex items-center justify-center gap-1", children: [tab.label, tabStats[tab.value] > 0 && (_jsx("span", { className: classNames('rounded-full px-1.5 py-[1px] text-[10px] font-semibold transition', activeFilter === tab.value ? 'bg-white/90 text-sena-green' : 'bg-white/20 text-[var(--color-muted)]'), children: tabStats[tab.value] }))] }) }, tab.value))) }), showNewChat && (_jsxs("form", { className: "space-y-4 rounded-[24px] border border-white/25 bg-white/22 px-4 py-4 text-xs text-[var(--color-text)] shadow-[0_24px_56px_rgba(18,55,29,0.2)] backdrop-blur-lg", onSubmit: handleCreateChat, children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]", children: [_jsx("span", { children: "Tipo de chat" }), _jsxs("div", { className: "flex items-center gap-1 rounded-full bg-white/15 p-1", children: [_jsxs("label", { className: classNames('flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 transition', chatType === 'direct'
                                                                        ? 'bg-white text-sena-green shadow-[0_10px_20px_rgba(57,169,0,0.18)]'
                                                                        : 'text-[var(--color-muted)]'), children: [_jsx("input", { type: "radio", value: "direct", className: "hidden", ...register('chatType'), checked: chatType === 'direct' }), _jsx(UserIcon, { className: "h-3.5 w-3.5" }), "Privado"] }), _jsxs("label", { className: classNames('flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 transition', chatType === 'group'
                                                                        ? 'bg-white text-sena-green shadow-[0_10px_20px_rgba(57,169,0,0.18)]'
                                                                        : 'text-[var(--color-muted)]'), children: [_jsx("input", { type: "radio", value: "group", className: "hidden", ...register('chatType'), checked: chatType === 'group' }), _jsx(UsersIcon, { className: "h-3.5 w-3.5" }), "Grupo"] })] })] }), chatType === 'group' && (_jsxs("div", { className: "flex flex-col gap-2 text-xs font-medium", children: [_jsx("span", { children: "Nombre del grupo" }), _jsx("input", { type: "text", placeholder: "Proyecto de innovacion", className: "rounded-xl border border-white/25 bg-white/18 px-3 py-2 text-xs outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30", ...register('name') }), errors.name && _jsx("span", { className: "text-[11px] text-rose-400", children: errors.name.message })] })), _jsxs("div", { className: "flex flex-col gap-2 text-xs font-medium", children: [_jsx("span", { children: chatType === 'group' ? 'Integrantes' : 'Destinatario' }), _jsx("textarea", { rows: chatType === 'group' ? 3 : 2, placeholder: chatType === 'group' ? 'ID1, ID2, ID3...' : 'ID del destinatario', className: "resize-none rounded-xl border border-white/25 bg-white/18 px-3 py-2 text-xs outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30", ...register('memberIds') }), errors.memberIds && _jsx("span", { className: "text-[11px] text-rose-400", children: errors.memberIds.message }), _jsx("span", { className: "text-[10px] text-[var(--color-muted)]", children: "Separa cada identificador con una coma." })] }), _jsxs("div", { className: "flex items-center justify-end gap-2 pt-1", children: [_jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "px-2.5 text-[11px]", onClick: () => {
                                                                reset(initialCreateChatValues);
                                                                setShowNewChat(false);
                                                            }, children: "Cancelar" }), _jsx(Button, { type: "submit", size: "sm", className: "px-3 text-[11px]", loading: createChatMutation.isPending, children: "Crear chat" })] })] }))] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-4", children: isLoadingChats ? (_jsx("div", { className: "mt-8 text-center text-xs text-[var(--color-muted)]", children: "Cargando conversaciones..." })) : filteredChats.length === 0 ? (_jsx("div", { className: "mt-8 rounded-2xl border border-dashed border-white/25 bg-white/12 px-4 py-6 text-center text-xs text-[var(--color-muted)]", children: "No hay conversaciones en esta vista." })) : (_jsx("ul", { className: "space-y-2", children: filteredChats.map((chat) => {
                                            const isActive = chat.id === selectedChatId;
                                            const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);
                                            const chatLabel = getChatName(chat.name, chat.isGroup);
                                            const initials = getInitialsFromLabel(chatLabel);
                                            const gradient = getAvatarGradient(chat.id);
                                            const hasUnread = !chat.lastMessageAt;
                                            return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setSelectedChatId(chat.id), className: classNames('group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all', isActive
                                                        ? 'bg-white/35 text-sena-green shadow-[0_18px_32px_rgba(57,169,0,0.20)]'
                                                        : 'text-[var(--color-text)] hover:bg-white/12'), children: [_jsxs("span", { className: "relative inline-flex", children: [_jsx("span", { className: classNames('flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-[0_10px_20px_rgba(18,55,29,0.22)]', gradient), children: initials }), _jsx("span", { className: classNames('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white/80 transition', hasUnread ? 'bg-sena-green' : 'bg-transparent') })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "truncate text-sm font-semibold", children: chatLabel }), _jsx("span", { className: classNames('text-[10px] uppercase tracking-wide', hasUnread ? 'text-sena-green' : 'text-[var(--color-muted)]'), children: lastActivity })] }), _jsx("p", { className: classNames('mt-1 text-xs', hasUnread ? 'text-sena-green/90 font-semibold' : 'text-[var(--color-muted)]'), children: chat.isGroup
                                                                        ? 'Grupo colaborativo'
                                                                        : hasUnread
                                                                            ? 'Sin mensajes nuevos aun'
                                                                            : 'Mensaje directo' })] })] }) }, chat.id));
                                        }) })) })] })] }), _jsxs(Card, { padded: false, className: "relative flex min-h-[75vh] flex-col overflow-hidden rounded-[36px] border-white/25 bg-white/25 shadow-[0_44px_110px_rgba(15,38,25,0.32)]", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.55),_transparent_55%)] opacity-75 dark:opacity-30" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/18 dark:from-white/8 dark:via-white/5 dark:to-white/10" }), _jsx("div", { className: "relative z-10 flex h-full flex-col", children: activeChat ? (_jsxs(_Fragment, { children: [_jsxs("header", { className: "flex items-center justify-between gap-4 border-b border-white/15 px-6 py-5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: classNames('flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white shadow-[0_16px_30px_rgba(18,55,29,0.25)]', activeChatGradient), children: activeChatInitials }), _jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-[var(--color-text)]", children: activeChatName }), _jsxs("p", { className: "text-[11px] text-[var(--color-muted)]", children: [activeChat.isGroup ? 'Chat grupal' : 'Chat privado', " - Ultima actividad ", activeChatLastActivity] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", className: "flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--color-text)] transition hover:border-sena-green/60 hover:text-sena-green", "aria-label": "Llamada de voz", children: _jsx(Phone, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: "flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--color-text)] transition hover:border-sena-green/60 hover:text-sena-green", "aria-label": "Videollamada", children: _jsx(Video, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: "flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--color-text)] transition hover:border-sena-green/60 hover:text-sena-green", "aria-label": "Detalles del chat", children: _jsx(Info, { className: "h-4 w-4" }) })] })] }), _jsx("div", { ref: messageListRef, className: "flex-1 overflow-y-auto px-6 py-5", children: _jsxs("div", { className: "mx-auto flex max-w-2xl flex-col gap-5", children: [_jsxs("div", { className: "flex flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/12 px-6 py-6 text-center shadow-[0_28px_64px_rgba(18,55,29,0.22)] dark:bg-white/10", children: [_jsx("span", { className: classNames('flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-[0_22px_44px_rgba(18,55,29,0.24)]', activeChatGradient), children: activeChatInitials }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[var(--color-text)]", children: activeChatName }), _jsxs("p", { className: "text-xs text-[var(--color-muted)]", children: ["Activo(a) ", activeChatLastActivity] })] }), _jsx("p", { className: "max-w-xl text-xs text-[var(--color-muted)]", children: "Los mensajes y las llamadas estan protegidos con cifrado de extremo a extremo. Solo las personas de este chat pueden leerlos o compartirlos." })] }), isFetchingMessages ? (_jsx("div", { className: "py-6 text-center text-xs text-[var(--color-muted)]", children: "Sincronizando mensajes..." })) : messages.length === 0 ? (_jsx("div", { className: "rounded-3xl border border-dashed border-white/20 bg-white/10 px-5 py-8 text-center text-sm text-[var(--color-muted)]", children: "Aun no hay mensajes en este chat. Escribe el primero!" })) : (messages.map((entry) => {
                                                    const isOwn = authUser?.id === entry.senderId;
                                                    const timestamp = new Date(entry.createdAt).toLocaleTimeString('es-CO', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    });
                                                    return (_jsx("div", { className: classNames('flex gap-2', isOwn ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: classNames('max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-[0_18px_32px_rgba(18,55,29,0.20)] transition-colors', isOwn
                                                                ? 'bg-sena-green/95 text-white'
                                                                : 'bg-white/16 text-[var(--color-text)] dark:bg-white/12'), children: [_jsx("p", { className: classNames('text-[11px] font-semibold uppercase tracking-wide', isOwn ? 'text-white/70' : 'text-[var(--color-muted)]'), children: isOwn ? 'Tu' : entry.senderId }), _jsx("p", { className: "mt-1 leading-relaxed", children: entry.content }), _jsx("p", { className: classNames('mt-2 text-[10px]', isOwn ? 'text-white/70' : 'text-[var(--color-muted)]'), children: timestamp })] }) }, entry.id));
                                                }))] }) }), _jsx("form", { className: "border-t border-white/15 bg-white/10 px-6 py-4", onSubmit: handleSendMessage, children: _jsxs("div", { className: "flex items-end gap-3", children: [_jsx("button", { type: "button", className: "flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/12 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Adjuntar archivo", children: _jsx(Paperclip, { className: "h-4 w-4" }) }), _jsx("div", { className: "flex-1 rounded-[26px] border border-white/20 bg-white/15 px-4 py-2.5 shadow-[0_16px_32px_rgba(18,55,29,0.18)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30", children: _jsx("textarea", { rows: 2, placeholder: "Escribe un mensaje...", className: "w-full resize-none bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]", value: message, onChange: (event) => setMessage(event.target.value) }) }), _jsx(Button, { type: "submit", size: "sm", disabled: !message.trim(), loading: sendMessageMutation.isPending, className: "h-11 w-11 rounded-xl px-0 text-[11px]", children: _jsx(Send, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: "flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/12 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Insertar emoji", children: _jsx(Smile, { className: "h-5 w-5" }) })] }) })] })) : (_jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-4 text-center text-sm text-[var(--color-muted)]", children: [_jsx(MessageCirclePlus, { className: "h-10 w-10 text-sena-green/80" }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { children: "Selecciona una conversacion para comenzar a chatear." }), _jsx("p", { children: "Crea un nuevo chat para coordinar tus equipos y proyectos." })] }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setShowNewChat(true), children: "Crear mi primer chat" })] })) })] })] }) }));
};
