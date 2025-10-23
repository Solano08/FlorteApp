import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { chatService } from '../../services/chatService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { MessageCirclePlus, Send, Smile, MessageCircle, Users as UsersIcon, User as UserIcon, Paperclip } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';
const filterTabs = [
    { value: 'all', label: 'Todos' },
    { value: 'direct', label: 'Privados' },
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
            if (activeFilter === 'direct' && chat.isGroup)
                return false;
            if (!normalized)
                return true;
            const name = getChatName(chat.name, chat.isGroup).toLowerCase();
            return name.includes(normalized) || chat.id.toLowerCase().includes(normalized);
        });
    }, [chats, activeFilter, searchTerm]);
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
    return (_jsx(DashboardLayout, { title: "Chats", subtitle: "Mantente en contacto con tus equipos y grupos de estudio.", children: _jsxs("div", { className: "grid min-h-[70vh] gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]", children: [_jsxs(Card, { padded: false, className: "flex flex-col overflow-hidden", children: [_jsx("div", { className: "border-b border-white/10 bg-white/5 px-4 py-3 dark:border-white/5 dark:bg-white/5", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--color-text)]", children: "Conversaciones" }), _jsx("p", { className: "text-[11px] text-[var(--color-muted)]", children: "Chats privados y grupos activos." })] }), _jsxs(Button, { size: "sm", variant: "secondary", className: "px-2.5 text-[11px]", onClick: () => setShowNewChat((prev) => !prev), children: [_jsx(MessageCirclePlus, { className: "h-4 w-4" }), "Nuevo chat"] })] }) }), _jsxs("div", { className: "space-y-3 px-4 py-3", children: [_jsx("div", { className: "flex items-center gap-1 rounded-full bg-white/10 p-1 text-[11px] text-[var(--color-muted)]", children: filterTabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveFilter(tab.value), className: classNames('flex-1 rounded-full px-2.5 py-1 transition-all', activeFilter === tab.value
                                            ? 'bg-white text-sena-green shadow-[0_8px_16px_rgba(57,169,0,0.20)]'
                                            : 'hover:text-[var(--color-text)]'), children: tab.label }, tab.value))) }), _jsx(Input, { label: "Buscar chat", placeholder: "Nombre o identificador", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), className: "py-1.5 text-xs" }), showNewChat && (_jsxs("form", { className: "space-y-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-xs", onSubmit: handleCreateChat, children: [_jsxs("div", { className: "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]", children: ["Tipo de chat", _jsxs("div", { className: "flex items-center gap-1 rounded-full bg-white/10 p-1", children: [_jsxs("label", { className: classNames('flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 transition', chatType === 'direct' ? 'bg-white text-sena-green' : 'text-[var(--color-muted)]'), children: [_jsx("input", { type: "radio", value: "direct", className: "hidden", ...register('chatType'), checked: chatType === 'direct' }), "Privado"] }), _jsxs("label", { className: classNames('flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 transition', chatType === 'group' ? 'bg-white text-sena-green' : 'text-[var(--color-muted)]'), children: [_jsx("input", { type: "radio", value: "group", className: "hidden", ...register('chatType'), checked: chatType === 'group' }), "Grupo"] })] })] }), chatType === 'group' && (_jsxs("div", { className: "flex flex-col gap-1 text-xs font-medium text-[var(--color-text)]", children: [_jsx("span", { children: "Nombre del grupo" }), _jsx("input", { type: "text", placeholder: "Proyecto de innovacion", className: "rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30", ...register('name') }), errors.name && _jsx("span", { className: "text-[11px] text-rose-400", children: errors.name.message })] })), _jsxs("div", { className: "flex flex-col gap-1 text-xs font-medium text-[var(--color-text)]", children: [_jsx("span", { children: chatType === 'group' ? 'Integrantes' : 'Destinatario' }), _jsx("textarea", { rows: chatType === 'group' ? 3 : 2, placeholder: chatType === 'group' ? 'ID1, ID2, ID3...' : 'ID del destinatario', className: "resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30", ...register('memberIds') }), errors.memberIds && (_jsx("span", { className: "text-[11px] text-rose-400", children: errors.memberIds.message })), _jsx("span", { className: "text-[10px] text-[var(--color-muted)]", children: "Separa cada identificador con una coma." })] }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "px-2.5 text-[11px]", onClick: () => {
                                                        reset(initialCreateChatValues);
                                                        setShowNewChat(false);
                                                    }, children: "Cancelar" }), _jsx(Button, { type: "submit", size: "sm", className: "px-3 text-[11px]", loading: createChatMutation.isPending, children: "Crear chat" })] })] }))] }), _jsx("div", { className: "flex-1 overflow-y-auto px-2 pb-4", children: isLoadingChats ? (_jsx("div", { className: "mt-8 text-center text-xs text-[var(--color-muted)]", children: "Cargando conversaciones..." })) : filteredChats.length === 0 ? (_jsx("div", { className: "mt-8 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center text-xs text-[var(--color-muted)]", children: "No hay conversaciones en esta vista." })) : (_jsx("ul", { className: "space-y-2", children: filteredChats.map((chat) => {
                                    const isActive = chat.id === selectedChatId;
                                    const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);
                                    return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setSelectedChatId(chat.id), className: classNames('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all', isActive
                                                ? 'bg-white/20 text-sena-green shadow-[0_10px_20px_rgba(57,169,0,0.16)]'
                                                : 'text-[var(--color-text)] hover:bg-white/10'), children: [_jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shadow-[0_6px_12px_rgba(18,55,29,0.14)]", children: chat.isGroup ? (_jsx(UsersIcon, { className: "h-4 w-4 text-sena-green" })) : (_jsx(UserIcon, { className: "h-4 w-4 text-sena-green" })) }), _jsxs("div", { className: "flex flex-1 flex-col", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "truncate text-sm font-semibold", children: getChatName(chat.name, chat.isGroup) }), _jsx("span", { className: "whitespace-nowrap text-[10px] text-[var(--color-muted)]", children: lastActivity })] }), _jsx("p", { className: "mt-1 text-[11px] text-[var(--color-muted)]", children: chat.isGroup ? 'Grupo colaborativo' : 'Mensaje directo' })] })] }) }, chat.id));
                                }) })) })] }), _jsx(Card, { padded: false, className: "flex flex-col overflow-hidden", children: activeChat ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4 text-sm text-[var(--color-text)] dark:border-white/5 dark:bg-white/5", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold", children: getChatName(activeChat.name, activeChat.isGroup) }), _jsxs("p", { className: "text-[11px] text-[var(--color-muted)]", children: [activeChat.isGroup ? 'Chat grupal' : 'Chat privado', " - Ultima actividad", ' ', formatLastActivity(activeChat.lastMessageAt ?? activeChat.createdAt)] })] }), _jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] text-[var(--color-muted)]", children: [_jsx(MessageCircle, { className: "h-3.5 w-3.5" }), messages.length, " mensajes"] })] }), _jsx("div", { ref: messageListRef, className: "flex-1 space-y-3 overflow-y-auto px-5 py-4", children: isFetchingMessages ? (_jsx("div", { className: "text-center text-xs text-[var(--color-muted)]", children: "Sincronizando mensajes..." })) : messages.length === 0 ? (_jsx("div", { className: "mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-[var(--color-muted)]", children: "Aun no hay mensajes en este chat. Escribe el primero!" })) : (messages.map((entry) => {
                                    const isOwn = authUser?.id === entry.senderId;
                                    const timestamp = new Date(entry.createdAt).toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    return (_jsx("div", { className: classNames('flex gap-2', isOwn ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: classNames('max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-[0_8px_16px_rgba(18,55,29,0.12)]', isOwn
                                                ? 'bg-sena-green/90 text-white'
                                                : 'bg-white/15 text-[var(--color-text)] dark:bg-white/10'), children: [_jsx("p", { className: "text-[11px] font-semibold opacity-80", children: isOwn ? 'Tu' : entry.senderId }), _jsx("p", { className: "mt-1 leading-relaxed", children: entry.content }), _jsx("p", { className: classNames('mt-2 text-[10px]', isOwn ? 'text-white/70' : 'text-[var(--color-muted)]'), children: timestamp })] }) }, entry.id));
                                })) }), _jsx("form", { className: "border-t border-white/10 bg-white/5 px-5 py-3 dark:border-white/5 dark:bg-white/5", onSubmit: handleSendMessage, children: _jsxs("div", { className: "flex items-end gap-3", children: [_jsx("button", { type: "button", className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Adjuntar archivo", children: _jsx(Paperclip, { className: "h-4 w-4" }) }), _jsx("div", { className: "flex-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 shadow-[0_10px_20px_rgba(18,55,29,0.12)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30", children: _jsx("textarea", { rows: 2, placeholder: "Escribe un mensaje...", className: "w-full resize-none bg-transparent text-sm text-[var(--color-text)] outline-none", value: message, onChange: (event) => setMessage(event.target.value) }) }), _jsx(Button, { type: "submit", size: "sm", disabled: !message.trim(), loading: sendMessageMutation.isPending, className: "px-3 text-[11px]", children: _jsx(Send, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[var(--color-muted)] transition hover:text-sena-green", "aria-label": "Insertar emoji", children: _jsx(Smile, { className: "h-4 w-4" }) })] }) })] })) : (_jsxs("div", { className: "flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-sm text-[var(--color-muted)]", children: [_jsx(MessageCirclePlus, { className: "h-8 w-8 text-sena-green/70" }), _jsx("p", { children: "Selecciona una conversacion para comenzar a chatear o crea un nuevo chat." })] })) })] }) }));
};
