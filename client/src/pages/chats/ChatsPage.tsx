import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { friendService } from '../../services/friendService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { EmojiPicker } from '../../components/ui/EmojiPicker';
import { UserAvatar } from '../../components/ui/UserAvatar';
import {
  MessageCirclePlus,
  Send,
  Smile,
  Users as UsersIcon,
  User as UserIcon,
  Paperclip,
  Search,
  Phone,
  Video,
  Info,
  MoreHorizontal,
  Settings2,
  Star,
  ChevronDown,
  Archive,
  BellOff,
  Pin,
  CircleAlert,
  Ban,
  Trash2,
  X,
  Folder,
  Users,
  File,
  Image,
  FileText,
  Download,
  Share2,
  X as XIcon,
  Reply,
  Forward,
  Copy,
  CheckSquare2,
  CheckCheck,
  MessageSquareMore
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { resolveAssetUrl } from '../../utils/media';
import { UI_MENU_TRANSITION, UI_MOTION_SLIDE_TWEEN, UI_OVERLAY_TRANSITION } from '../../utils/transitionConfig';
import { Chat, Message } from '../../types/chat';
import type { Profile } from '../../types/profile';

type ChatFilter = 'all' | 'unread' | 'favorites' | 'groups' | 'archived';

const filterTabs: Array<{ value: ChatFilter; label: string; icon?: typeof Star | typeof Archive }> = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'No leidos' },
  { value: 'favorites', label: 'Favoritos', icon: Star },
  { value: 'groups', label: 'Grupos' }
];

const chatsHeaderMoreMenuItemClass =
  'relative z-0 flex w-full min-w-0 cursor-pointer appearance-none items-center gap-2.5 whitespace-nowrap rounded-xl bg-transparent px-3 py-2.5 text-left text-[13px] font-medium leading-tight text-[var(--color-text)] transition-[box-shadow,transform] duration-ui hover:z-20 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_36px_rgba(0,0,0,0.32),0_6px_16px_rgba(0,0,0,0.22)] focus-visible:outline-none focus-visible:ring-0 focus-visible:z-20 focus-visible:-translate-y-0.5 focus-visible:bg-white focus-visible:shadow-[0_14px_36px_rgba(0,0,0,0.32),0_6px_16px_rgba(0,0,0,0.22)] dark:bg-transparent dark:hover:bg-neutral-900 dark:hover:shadow-[0_14px_40px_rgba(0,0,0,0.75),0_6px_20px_rgba(0,0,0,0.55)] dark:focus-visible:bg-neutral-900 dark:focus-visible:shadow-[0_14px_40px_rgba(0,0,0,0.75),0_6px_20px_rgba(0,0,0,0.55)]';

const createChatSchema = z.object({
  chatType: z.enum(['direct', 'group']),
  name: z.string().trim().optional()
});

type CreateChatValues = z.infer<typeof createChatSchema>;

const initialCreateChatValues: CreateChatValues = {
  chatType: 'direct',
  name: ''
};

const formatLastActivity = (iso: string) => {
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

// Función helper fuera del componente para casos simples
const getChatName = (name: string | null | undefined, isGroup: boolean) =>
  name?.trim() && name.trim().length > 0 ? name.trim() : isGroup ? 'Grupo sin titulo' : 'Chat privado';

const avatarGradientPalette = [
  'from-sena-green/90 to-emerald-500/80',
  'from-sena-green/80 to-emerald-600/70',
  'from-emerald-500/90 to-sena-green/80',
  'from-emerald-600/80 to-sena-green/70'
];

const getAvatarGradient = (seed: string) => {
  if (!seed) {
    return `bg-gradient-to-br ${avatarGradientPalette[0]}`;
  }

  let hash = 0;
  for (const char of seed) {
    hash = (hash + char.charCodeAt(0) * 17) % 2048;
  }

  return `bg-gradient-to-br ${avatarGradientPalette[hash % avatarGradientPalette.length]}`;
};

const getInitialsFromLabel = (label: string | null | undefined) => {
  const cleaned = label?.trim();
  if (!cleaned) return 'FL';

  const parts = cleaned.split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials || cleaned.slice(0, 2).toUpperCase();
};

function classifyChatAttachment(raw: string): 'image' | 'video' | 'file' {
  const resolved = resolveAssetUrl(raw) ?? raw;
  const test = (s: string) => {
    if (s.startsWith('data:image/')) return 'image' as const;
    const l = s.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(l)) return 'image' as const;
    if (/\.(mp4|webm|mov|ogg|m4v)(\?|#|$)/i.test(l)) return 'video' as const;
    return null;
  };
  return test(raw) ?? test(resolved) ?? 'file';
}

export const ChatsPage = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group' | null>(null);
  const [message, setMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<'top' | 'bottom'>('top');
  const [emojiPickerCoords, setEmojiPickerCoords] = useState<{ top?: number; bottom?: number; left: number; maxHeight?: number } | null>(null);
  const [attachment, setAttachment] = useState<{ file: File; dataUrl: string; fileName: string; mimeType: string } | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content?: string; senderId: string; attachmentUrl?: string } | null>(null);
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<{ id: string; content?: string; attachmentUrl?: string } | null>(null);
  const [selectedForwardChats, setSelectedForwardChats] = useState<Set<string>>(new Set());
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lastReadTimes, setLastReadTimes] = useState<Record<string, string>>(() => {
    // Cargar desde localStorage si existe
    const stored = localStorage.getItem('chatLastReadTimes');
    return stored ? JSON.parse(stored) : {};
  });

  // Preferencias de chat almacenadas en localStorage
  const [archivedChats, setArchivedChats] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('archivedChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [mutedChats, setMutedChats] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('mutedChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [pinnedChats, setPinnedChats] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('pinnedChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [favoriteChats, setFavoriteChats] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('favoriteChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [isChatInfoPanelOpen, setIsChatInfoPanelOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [moreMenuCoords, setMoreMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuPortalRef = useRef<HTMLDivElement | null>(null);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [createChatError, setCreateChatError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; content?: string } | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  const { data: chats = [], isLoading: isLoadingChats } = useQuery({
    queryKey: ['chats'],
    queryFn: chatService.listChats,
    refetchInterval: 5000, // Refrescar cada 5 segundos para obtener nuevos mensajes
  });

  // Obtener chats ordenados por último mensaje (para seleccionar el más reciente)
  const sortedChatsForSelection = useMemo(() => {
    return [...chats]
      .filter((chat) => !archivedChats.has(chat.id))
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [chats, archivedChats]);

  useEffect(() => {
    if (chats.length === 0) return;

    const params = new URLSearchParams(location.search);
    const targetChatId = params.get('chatId');

    if (targetChatId && chats.some((chat) => chat.id === targetChatId)) {
      if (selectedChatId !== targetChatId) {
        setSelectedChatId(targetChatId);
      }
      return;
    }

    // Seleccionar el último chat (el más reciente por mensaje)
    if (!selectedChatId && sortedChatsForSelection.length > 0) {
      setSelectedChatId(sortedChatsForSelection[0].id);
    }
  }, [chats, selectedChatId, location.search, sortedChatsForSelection]);

  // Marcar chat como leído cuando se selecciona
  useEffect(() => {
    if (selectedChatId) {
      setReadChats((prev) => {
        const newSet = new Set(prev);
        newSet.add(selectedChatId);
        return newSet;
      });
      // Guardar la fecha de última lectura
      const now = new Date().toISOString();
      setLastReadTimes((prev) => {
        const updated = { ...prev, [selectedChatId]: now };
        localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
        return updated;
      });
    }
  }, [selectedChatId]);

  const { data: friends = [], isLoading: isLoadingFriends } = useQuery<Profile[]>({
    queryKey: ['friends'],
    queryFn: friendService.listFriends
  });

  const { data: messages = [], isFetching: isFetchingMessages } = useQuery({
    enabled: Boolean(selectedChatId),
    queryKey: ['chats', selectedChatId, 'messages'],
    queryFn: async () => {
      if (!selectedChatId) return [];
      const messagesList = await chatService.listMessages(selectedChatId);
      // Ordenar mensajes por fecha (más antiguos primero para mostrar cronológicamente)
      return messagesList.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
    refetchOnWindowFocus: true, // Refrescar cuando se vuelve a la ventana
  });

  // Obtener mensajes de todos los chats para calcular no leídos
  const allChatMessages = useQuery({
    queryKey: ['all-chat-messages', chats.map(c => c.id).join(',')],
    queryFn: async () => {
      const messagesMap: Record<string, Message[]> = {};
      await Promise.all(
        chats.map(async (chat) => {
          try {
            const chatMessages = await chatService.listMessages(chat.id);
            messagesMap[chat.id] = chatMessages;
          } catch (error) {
            // Error silencioso al cargar mensajes de un chat
            messagesMap[chat.id] = [];
          }
        })
      );
      return messagesMap;
    },
    enabled: chats.length > 0,
    staleTime: 3000, // Cache por 3 segundos
    refetchInterval: 5000, // Refrescar cada 5 segundos para obtener nuevos mensajes
  });

  // Calcular mensajes no leídos para cada chat basado en mensajes reales
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const messagesMap = allChatMessages.data || {};

    chats.forEach((chat) => {
      // Si el chat está seleccionado, no hay mensajes no leídos
      if (chat.id === selectedChatId) {
        counts[chat.id] = 0;
        return;
      }

      const chatMessages = messagesMap[chat.id] || [];
      if (chatMessages.length === 0) {
        counts[chat.id] = 0;
        return;
      }

      // Obtener la última vez que se leyó este chat
      const lastReadTime = lastReadTimes[chat.id];

      if (!lastReadTime) {
        // Si nunca se ha leído, contar todos los mensajes excepto los propios
        const unreadMessages = chatMessages.filter(
          (msg) => msg.senderId !== authUser?.id
        );
        counts[chat.id] = unreadMessages.length;
      } else {
        // Contar mensajes creados después de la última lectura y que no sean del usuario
        const lastReadDate = new Date(lastReadTime);
        const unreadMessages = chatMessages.filter(
          (msg) =>
            msg.senderId !== authUser?.id &&
            new Date(msg.createdAt) > lastReadDate
        );
        counts[chat.id] = unreadMessages.length;
      }
    });

    return counts;
  }, [chats, selectedChatId, allChatMessages.data, lastReadTimes, authUser?.id]);

  // Ordenar mensajes por fecha (más antiguos primero)
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [messages]);

  const chatSharedMediaItems = useMemo(() => {
    type Item =
      | { kind: 'image'; key: string; messageId: string; src: string; createdAt: string }
      | { kind: 'video'; key: string; messageId: string; src: string; createdAt: string }
      | { kind: 'file'; key: string; messageId: string; href: string; label: string; isPdf: boolean; createdAt: string }
      | { kind: 'post'; key: string; messageId: string; postId: string; createdAt: string };

    const items: Item[] = [];
    const seenAttachmentKeys = new Set<string>();

    const sortedNewestFirst = [...sortedMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const m of sortedNewestFirst) {
      if (m.sharedPostId) {
        items.push({
          kind: 'post',
          key: `post-${m.id}-${m.sharedPostId}`,
          messageId: m.id,
          postId: m.sharedPostId,
          createdAt: m.createdAt
        });
      }
      if (m.attachmentUrl) {
        const dedupeKey = m.attachmentUrl;
        if (seenAttachmentKeys.has(dedupeKey)) continue;
        seenAttachmentKeys.add(dedupeKey);
        const fullUrl = resolveAssetUrl(m.attachmentUrl) ?? m.attachmentUrl;
        const cls = classifyChatAttachment(m.attachmentUrl);
        if (cls === 'image') {
          items.push({
            kind: 'image',
            key: `img-${m.id}`,
            messageId: m.id,
            src: fullUrl,
            createdAt: m.createdAt
          });
        } else if (cls === 'video') {
          items.push({
            kind: 'video',
            key: `vid-${m.id}`,
            messageId: m.id,
            src: fullUrl,
            createdAt: m.createdAt
          });
        } else {
          const isPdf =
            /\.(pdf)(\?|#|$)/i.test(m.attachmentUrl) || /\.(pdf)(\?|#|$)/i.test(fullUrl);
          const label =
            fullUrl.split('/').pop()?.split('?')[0] ||
            m.attachmentUrl.split('/').pop()?.split('?')[0] ||
            'Archivo';
          items.push({
            kind: 'file',
            key: `file-${m.id}`,
            messageId: m.id,
            href: fullUrl,
            label,
            isPdf,
            createdAt: m.createdAt
          });
        }
      }
    }
    return items;
  }, [sortedMessages]);

  // Al cambiar de chat, forzar posicionamiento al final cuando termine de cargar.
  const shouldScrollToBottomOnChatOpenRef = useRef(false);
  useEffect(() => {
    if (selectedChatId) {
      shouldScrollToBottomOnChatOpenRef.current = true;
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (!selectedChatId || isFetchingMessages || !messageListRef.current) return;
    if (!shouldScrollToBottomOnChatOpenRef.current) return;

    const container = messageListRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    });
    shouldScrollToBottomOnChatOpenRef.current = false;
  }, [selectedChatId, isFetchingMessages, sortedMessages.length]);

  // Mantener auto-scroll cuando llegan mensajes nuevos solo si el usuario está cerca del final.
  const previousMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (!messageListRef.current || isFetchingMessages) return;

    const container = messageListRef.current;
    const messagesIncreased = sortedMessages.length > previousMessagesLengthRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (messagesIncreased && isNearBottom) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      });
    }

    previousMessagesLengthRef.current = sortedMessages.length;
  }, [sortedMessages.length, isFetchingMessages, selectedChatId]);

  const createChatMutation = useMutation({
    mutationFn: chatService.createChat,
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => { });
      setSelectedChatId(chat.id);
      setShowNewChatDialog(false);
      setNewChatType(null);
      setSelectedFriendIds(new Set());
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { chatId: string; content?: string; attachmentUrl?: string }) => {
      return await chatService.sendMessage(payload.chatId, {
        content: payload.content || undefined,
        attachmentUrl: payload.attachmentUrl
      });
    },
    onSuccess: (_, variables) => {
      if (!selectedChatId) return;
      // Invalidar mensajes del chat actual
      queryClient.invalidateQueries({ queryKey: ['chats', selectedChatId, 'messages'] }).catch(() => { });
      // Invalidar lista de chats para actualizar lastMessageAt
      queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => { });
      // Invalidar todos los mensajes para actualizar contadores
      queryClient.invalidateQueries({ queryKey: ['all-chat-messages'] }).catch(() => { });
      // Limpiar adjunto después de enviar
      setAttachment(null);
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: chatService.deleteChat,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => { });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<CreateChatValues>({
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

    return chats
      .filter((chat) => {
        // Excluir chats archivados del filtro 'all' y otros filtros excepto 'archived'
        if (activeFilter !== 'archived' && archivedChats.has(chat.id)) return false;
        if (activeFilter === 'archived' && !archivedChats.has(chat.id)) return false;
        if (activeFilter === 'groups' && !chat.isGroup) return false;
        if (activeFilter === 'unread' && chat.lastMessageAt) return false;
        if (activeFilter === 'favorites' && !favoriteChats.has(chat.id)) return false;

        if (!normalized) return true;

        const name = getChatDisplayName(chat).toLowerCase();
        return name.includes(normalized) || chat.id.toLowerCase().includes(normalized);
      })
      .sort((a, b) => {
        // Los chats fijados van primero
        const aPinned = pinnedChats.has(a.id);
        const bPinned = pinnedChats.has(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;

        // Luego por fecha de último mensaje
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [chats, activeFilter, searchTerm, archivedChats, pinnedChats, favoriteChats]);

  // Separar chats normales y archivados
  const normalChats = useMemo(() => {
    return filteredChats.filter((chat) => !archivedChats.has(chat.id));
  }, [filteredChats, archivedChats]);

  // Lista real de chats archivados (independiente del filtro de búsqueda) para evitar desajustes
  const archivedChatsList = useMemo(() => {
    return chats.filter((chat) => archivedChats.has(chat.id));
  }, [chats, archivedChats]);

  const tabStats = useMemo<Record<ChatFilter, number>>(
    () => ({
      all: chats.filter((chat) => !archivedChats.has(chat.id)).length,
      unread: chats.filter((chat) => !chat.lastMessageAt && !archivedChats.has(chat.id)).length,
      favorites: chats.filter((chat) => favoriteChats.has(chat.id) && !archivedChats.has(chat.id)).length,
      groups: chats.filter((chat) => chat.isGroup && !archivedChats.has(chat.id)).length,
      archived: chats.filter((chat) => archivedChats.has(chat.id)).length
    }),
    [chats, archivedChats, favoriteChats]
  );

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const friendsById = useMemo(() => {
    const map: Record<string, Profile> = {};
    friends.forEach((friend) => {
      map[friend.id] = friend;
    });
    return map;
  }, [friends]);

  const friendsByNormalizedName = useMemo(() => {
    const map = new Map<string, Profile>();
    friends.forEach((friend) => {
      const fullName = `${friend.firstName} ${friend.lastName}`.trim().toLowerCase();
      if (fullName && !map.has(fullName)) {
        map.set(fullName, friend);
      }
    });
    return map;
  }, [friends]);

  const directChatFriendByChatId = useMemo(() => {
    const map: Record<string, Profile | null> = {};
    const messagesMap = allChatMessages.data || {};

    chats.forEach((chat) => {
      if (chat.isGroup) {
        map[chat.id] = null;
        return;
      }

      const candidateIds = new Set<string>();
      const chatMessages = messagesMap[chat.id] || [];

      chatMessages.forEach((entry) => {
        if (entry.senderId !== authUser?.id) {
          candidateIds.add(entry.senderId);
        }
      });

      if (chat.createdBy && chat.createdBy !== authUser?.id) {
        candidateIds.add(chat.createdBy);
      }

      let matchedFriend: Profile | null = null;
      for (const candidateId of candidateIds) {
        const candidate = friendsById[candidateId];
        if (candidate) {
          matchedFriend = candidate;
          break;
        }
      }

      if (!matchedFriend && chat.name?.trim()) {
        matchedFriend = friendsByNormalizedName.get(chat.name.trim().toLowerCase()) || null;
      }

      map[chat.id] = matchedFriend;
    });

    return map;
  }, [allChatMessages.data, authUser?.id, chats, friendsById, friendsByNormalizedName]);

  // Función helper para obtener el nombre del chat, incluyendo el nombre del usuario en chats directos
  const getChatDisplayName = useMemo(() => {
    return (chat: Chat) => {
      if (chat.name?.trim() && chat.name.trim().length > 0) {
        return chat.name.trim();
      }

      if (chat.isGroup) {
        return 'Grupo sin titulo';
      }

      const otherUser = directChatFriendByChatId[chat.id];
      if (otherUser) {
        return `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.firstName || 'Usuario';
      }

      return 'Chat privado';
    };
  }, [directChatFriendByChatId]);

  const getChatAvatarUrl = useMemo(() => {
    return (chat: Chat) => {
      if (chat.isGroup) return null;
      return directChatFriendByChatId[chat.id]?.avatarUrl ?? null;
    };
  }, [directChatFriendByChatId]);

  // Función helper para obtener el nombre del remitente de un mensaje
  const getSenderName = useMemo(() => {
    return (senderId: string) => {
      if (senderId === authUser?.id) {
        return 'Tú';
      }
      const friend = friends.find((f) => f.id === senderId);
      if (friend) {
        return `${friend.firstName} ${friend.lastName}`.trim() || friend.firstName || 'Usuario';
      }
      return senderId; // Fallback al ID si no se encuentra
    };
  }, [friends, authUser?.id]);

  const handleCreateChat = handleSubmit((values) => {
    setCreateChatError(null);

    const members = Array.from(selectedFriendIds);

    if (!newChatType) {
      setCreateChatError('Selecciona el tipo de conversación.');
      return;
    }

    if (newChatType === 'direct') {
      if (members.length !== 1) {
        setCreateChatError('Selecciona exactamente un amigo para el chat privado.');
        return;
      }
    }

    if (newChatType === 'group') {
      if (members.length === 0) {
        setCreateChatError('Selecciona al menos un amigo para el grupo.');
        return;
      }
      const name = values.name?.trim();
      if (!name || name.length < 3) {
        setCreateChatError('Define un nombre para el grupo (mínimo 3 caracteres).');
        return;
      }
    }

    // Para chats privados, usar el nombre del amigo seleccionado como nombre del chat
    let chatName: string | undefined;
    if (newChatType === 'direct' && members.length === 1) {
      const friend = friends.find((f) => f.id === members[0]);
      if (friend) {
        chatName = `${friend.firstName} ${friend.lastName}`.trim() || undefined;
      }
    }

    createChatMutation.mutate(
      {
        name: newChatType === 'group' ? values.name?.trim() || undefined : chatName,
        isGroup: newChatType === 'group',
        memberIds: members
      },
      {
        onSuccess: () => {
          reset(initialCreateChatValues);
          setShowNewChatDialog(false);
          setNewChatType(null);
          setSelectedFriendIds(new Set());
        }
      }
    );
  });

  const handleNewChatTypeSelection = (type: 'direct' | 'group') => {
    setNewChatType(type);
    setValue('chatType', type);
    setSelectedFriendIds(new Set());
    setCreateChatError(null);
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedChatId || (!message.trim() && !attachment)) return;

    let attachmentUrl: string | undefined = undefined;

    // Si hay un archivo adjunto, procesarlo como data URL
    if (attachment) {
      attachmentUrl = attachment.dataUrl;
    }

    sendMessageMutation.mutate(
      {
        chatId: selectedChatId as string,
        content: message.trim() || undefined,
        attachmentUrl
      },
      {
        onSuccess: () => {
          setMessage('');
          setAttachment(null);
          setReplyingTo(null);
          // Scroll suave al final después de enviar el mensaje
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (messageListRef.current) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
              }
            });
          });
        }
      }
    );
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. El tamaño máximo es 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === 'string') {
        setAttachment({
          file,
          dataUrl,
          fileName: file.name,
          mimeType: file.type
        });
      }
    };
    reader.readAsDataURL(file);

    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  // Posición del emoji picker en viewport (portal + fixed; evita quedar detrás del sidebar)
  useLayoutEffect(() => {
    if (!showEmojiPicker || !emojiButtonRef.current) {
      setEmojiPickerCoords(null);
      return;
    }

    const calculatePosition = () => {
      if (!emojiButtonRef.current) return;

      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      const pickerWidth = Math.min(340, window.innerWidth * 0.92);
      const pickerHeight = Math.min(435, window.innerHeight - 32);
      const spaceAbove = buttonRect.top;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const requiredSpace = pickerHeight + 16;

      let left = buttonRect.right - pickerWidth;
      left = Math.max(8, Math.min(left, window.innerWidth - pickerWidth - 8));

      if (spaceBelow > spaceAbove || spaceAbove < requiredSpace) {
        setEmojiPickerPosition('bottom');
        setEmojiPickerCoords({
          top: buttonRect.bottom + 8,
          left
        });
      } else {
        setEmojiPickerPosition('top');
        setEmojiPickerCoords({
          bottom: window.innerHeight - buttonRect.top + 8,
          left,
          maxHeight: spaceAbove - 16
        });
      }
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [showEmojiPicker]);

  // Cerrar emoji picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Cerrar menú de mensaje al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMessageMenuId) {
        const menuElement = messageMenuRefs.current[openMessageMenuId];
        const buttonElement = messageButtonRefs.current[openMessageMenuId];

        if (
          menuElement &&
          !menuElement.contains(event.target as Node) &&
          buttonElement &&
          !buttonElement.contains(event.target as Node)
        ) {
          setOpenMessageMenuId(null);
          setMessageMenuPosition(null);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMessageMenuId(null);
        setMessageMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMessageMenuId]);

  const handleMessageMenuToggle = (messageId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (openMessageMenuId === messageId) {
      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);
    } else {
      // Cerrar otros menús primero
      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);

      // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
      requestAnimationFrame(() => {
        const buttonElement = messageButtonRefs.current[messageId];
        if (!buttonElement) return;

        const buttonRect = buttonElement.getBoundingClientRect();
        const menuWidth = 192; // w-48
        const menuHeight = 350; // Altura aproximada del menú
        const padding = 12;
        const menuGap = 4;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Anclar al botón: burbujas propias (derecha) → menú a la izquierda del chevron; resto → a la derecha
        const anchorOnRightSide = buttonRect.right > viewportWidth * 0.5;
        let x: number;

        const placeLeftOfButton = () => buttonRect.left - menuWidth - menuGap;
        const placeRightOfButton = () => buttonRect.right + menuGap;

        if (anchorOnRightSide) {
          x = placeLeftOfButton();
          if (x < padding) {
            x = placeRightOfButton();
            if (x + menuWidth > viewportWidth - padding) {
              x = Math.max(padding, viewportWidth - menuWidth - padding);
            }
          }
        } else {
          x = placeRightOfButton();
          if (x + menuWidth > viewportWidth - padding) {
            x = placeLeftOfButton();
          }
          if (x < padding) {
            x = padding;
          }
        }

        let y = buttonRect.top + (buttonRect.height / 2) - (menuHeight / 2);

        // Asegurar que el menú no se salga por arriba
        if (y < padding) {
          y = padding;
        }

        // Asegurar que el menú no se salga por abajo
        if (y + menuHeight > viewportHeight - padding) {
          y = viewportHeight - menuHeight - padding;
        }

        setMessageMenuPosition({ x, y });
        setOpenMessageMenuId(messageId);
      });
    }
  };

  const handleMessageAction = async (action: string, message: Message) => {
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);

    switch (action) {
      case 'copy':
        if (message.content) {
          try {
            await navigator.clipboard.writeText(message.content);
            toast.success('Texto copiado al portapapeles', 1500);
          } catch (err) {
            toast.error('No se pudo copiar el texto');
          }
        }
        break;
      case 'reply':
        // Guardar el mensaje a responder
        setReplyingTo({
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          attachmentUrl: message.attachmentUrl ?? undefined
        });
        setOpenMessageMenuId(null);
        setMessageMenuPosition(null);
        // Hacer scroll al input de mensaje
        setTimeout(() => {
          const messageInput = document.querySelector('textarea[placeholder="Escribe un mensaje..."]') as HTMLTextAreaElement;
          if (messageInput) {
            messageInput.focus();
            messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        break;
      case 'forward':
        // Abrir diálogo de reenvío
        setForwardingMessage({
          id: message.id,
          content: message.content,
          attachmentUrl: message.attachmentUrl ?? undefined
        });
        setSelectedForwardChats(new Set());
        setIsForwardDialogOpen(true);
        setOpenMessageMenuId(null);
        setMessageMenuPosition(null);
        break;
      case 'download':
        if (message.attachmentUrl) {
          try {
            const url = resolveAssetUrl(message.attachmentUrl) || message.attachmentUrl;
            const link = document.createElement('a');
            link.href = url;
            link.download = url.split('/').pop() || 'archivo';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Descarga iniciada', 1500);
          } catch (err) {
            toast.error('No se pudo descargar el archivo');
          }
        } else {
          toast.warning('Este mensaje no tiene archivos adjuntos');
        }
        break;
      case 'pin':
        // Guardar mensajes fijados en localStorage
        const pinnedMessages = JSON.parse(localStorage.getItem('pinnedMessages') || '[]');
        if (!pinnedMessages.includes(message.id)) {
          pinnedMessages.push(message.id);
          localStorage.setItem('pinnedMessages', JSON.stringify(pinnedMessages));
          toast.success('Mensaje fijado', 1500);
        } else {
          toast.info('Este mensaje ya está fijado');
        }
        break;
      case 'star':
        // Guardar mensajes destacados en localStorage
        const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '[]');
        if (!starredMessages.includes(message.id)) {
          starredMessages.push(message.id);
          localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
          toast.success('Mensaje destacado', 1500);
        } else {
          const index = starredMessages.indexOf(message.id);
          starredMessages.splice(index, 1);
          localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
          toast.success('Mensaje desmarcado', 1500);
        }
        break;
      case 'delete':
        if (!selectedChatId) {
          toast.error('No se pudo identificar el chat del mensaje');
          break;
        }
        setMessageToDelete({ id: message.id, content: message.content });
        setShowDeleteMessageDialog(true);
        break;
      default:
        // Acción no implementada - no mostrar nada
    }
  };

  const handleConfirmDeleteMessage = async () => {
    if (!selectedChatId || !messageToDelete) return;
    setIsDeletingMessage(true);
    try {
      await chatService.deleteMessage(selectedChatId, messageToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ['chats', selectedChatId, 'messages'] });
      toast.success('Mensaje eliminado', 1500);
      setShowDeleteMessageDialog(false);
      setMessageToDelete(null);
    } catch (err) {
      toast.error('No se pudo eliminar el mensaje');
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const activeChatName = activeChat ? getChatDisplayName(activeChat) : '';
  const activeChatInitials = activeChat ? getInitialsFromLabel(activeChatName) : '';
  const activeChatGradient = activeChat ? getAvatarGradient(activeChat.id) : '';
  const activeChatAvatarUrl = activeChat ? getChatAvatarUrl(activeChat) : null;
  const activeChatLastActivity = activeChat
    ? formatLastActivity(activeChat.lastMessageAt ?? activeChat.createdAt)
    : '';

  /** En chat privado, usuario con el que hablas (para abrir su perfil público). */
  const activeChatOtherUserId = useMemo(() => {
    if (!activeChat?.id || activeChat.isGroup) return null;
    const fromFriend = directChatFriendByChatId[activeChat.id];
    if (fromFriend?.id) return fromFriend.id;
    if (selectedChatId === activeChat.id && messages.length > 0) {
      const fromSelected = messages.find((m) => m.senderId !== authUser?.id);
      if (fromSelected) return fromSelected.senderId;
    }
    const list = allChatMessages.data?.[activeChat.id] ?? [];
    const fromMsg = list.find((m) => m.senderId !== authUser?.id);
    if (fromMsg) return fromMsg.senderId;
    if (activeChat.createdBy && activeChat.createdBy !== authUser?.id) return activeChat.createdBy;
    return null;
  }, [activeChat, directChatFriendByChatId, allChatMessages.data, authUser?.id, messages, selectedChatId]);

  useEffect(() => {
    if (!isChatInfoPanelOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsChatInfoPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isChatInfoPanelOpen]);

  useEffect(() => {
    setIsChatInfoPanelOpen(false);
  }, [selectedChatId]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        const buttonElement = menuButtonRefs.current[openMenuId];

        if (
          menuElement &&
          !menuElement.contains(event.target as Node) &&
          buttonElement &&
          !buttonElement.contains(event.target as Node)
        ) {
          setOpenMenuId(null);
          setMenuPosition(null);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuId]);

  const updateMoreMenuPosition = useCallback(() => {
    const el = moreMenuButtonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const MENU_W = 224; // w-56 (menú header Chats)
    const MENU_H = 188;
    let left = r.right - MENU_W;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
    let top = r.bottom + 8;
    if (top + MENU_H > window.innerHeight - 8) {
      top = Math.max(8, r.top - MENU_H - 8);
    }
    setMoreMenuCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!isMoreMenuOpen) return;
    updateMoreMenuPosition();
    const onReposition = () => updateMoreMenuPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [isMoreMenuOpen, updateMoreMenuPosition]);

  // Cerrar menú contextual (más opciones) al hacer clic fuera (incluye nodo en portal)
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (moreMenuRef.current?.contains(t) || moreMenuPortalRef.current?.contains(t)) {
        return;
      }
      setIsMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const handleMenuToggle = (chatId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (openMenuId === chatId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const listContainer = event.currentTarget.closest('ul');
      const containerRect = listContainer?.getBoundingClientRect();

      if (containerRect) {
        const menuWidth = 220;
        const menuHeight = 360;
        const padding = 12;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calcular posición: preferir a la derecha del botón
        let x = buttonRect.right + padding;
        let y = buttonRect.top;

        // Verificar si hay espacio a la derecha
        const spaceOnRight = viewportWidth - buttonRect.right;
        const spaceOnLeft = buttonRect.left;

        // Si no hay suficiente espacio a la derecha, mostrar a la izquierda
        if (spaceOnRight < menuWidth + padding && spaceOnLeft > menuWidth + padding) {
          x = buttonRect.left - menuWidth - padding;
        }

        // Ajustar verticalmente si está cerca del borde inferior
        if (y + menuHeight > viewportHeight - padding) {
          y = viewportHeight - menuHeight - padding;
          // Si aún no cabe, ajustar desde arriba del botón
          if (y < buttonRect.top - menuHeight) {
            y = buttonRect.top - menuHeight;
          }
        }

        // Ajustar verticalmente si está cerca del borde superior
        if (y < padding) {
          y = padding;
        }

        // Asegurar que el menú no se salga por la izquierda
        if (x < padding) {
          x = padding;
        }

        // Asegurar que el menú no se salga por la derecha
        if (x + menuWidth > viewportWidth - padding) {
          x = viewportWidth - menuWidth - padding;
        }

        // Asegurar que el menú no se salga por abajo
        if (y + menuHeight > viewportHeight - padding) {
          y = Math.max(padding, viewportHeight - menuHeight - padding);
        }

        setMenuPosition({ x, y });
        setOpenMenuId(chatId);
      }
    }
  };

  const handleMenuAction = async (action: string, chatId: string) => {
    setOpenMenuId(null);
    setMenuPosition(null);

    switch (action) {
      case 'delete': {
        // El diálogo bonito se gestiona más abajo con GlassDialog
        setChatToDelete(chatId);
        setShowDeleteDialog(true);
        break;
      }
      case 'archive':
        setArchivedChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('archivedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        if (selectedChatId === chatId && activeFilter !== 'archived') {
          setSelectedChatId(null);
        }
        toast.success('Chat archivado', 1500);
        break;
      case 'unarchive':
        setArchivedChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('archivedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Chat desarchivado', 1500);
        break;
      case 'mute':
        setMutedChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('mutedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Notificaciones silenciadas para este chat', 1500);
        break;
      case 'unmute':
        setMutedChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('mutedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Notificaciones activadas para este chat', 1500);
        break;
      case 'pin':
        setPinnedChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('pinnedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Chat fijado arriba', 1500);
        break;
      case 'unpin':
        setPinnedChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('pinnedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Chat desfijado', 1500);
        break;
      case 'markRead': {
        // Marcar como leído este chat
        const now = new Date().toISOString();
        setReadChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          return newSet;
        });
        setLastReadTimes((prev) => {
          const updated = { ...prev, [chatId]: now };
          localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
          return updated;
        });
        toast.success('Chat marcado como leído', 1500);
        break;
      }
      case 'favorite':
        setFavoriteChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('favoriteChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Chat añadido a favoritos', 1500);
        break;
      case 'unfavorite':
        setFavoriteChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('favoriteChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        toast.success('Chat quitado de favoritos', 1500);
        break;
      case 'block':
        const chat = chats.find((c) => c.id === chatId);
        if (chat && !chat.isGroup) {
          if (window.confirm('¿Estás seguro de que deseas bloquear a este usuario? No podrás recibir mensajes de ellos.')) {
            try {
              // Obtener el ID del otro usuario del chat
              // Primero intentar obtenerlo de los mensajes del chat seleccionado
              let otherUserId: string | null = null;
              
              if (selectedChatId === chatId && messages.length > 0) {
                // Si este es el chat seleccionado, buscar en los mensajes
                const otherUserMessage = messages.find((m) => m.senderId !== authUser?.id);
                otherUserId = otherUserMessage?.senderId ?? null;
              }
              
              // Si no encontramos el ID en los mensajes, usar createdBy como fallback
              // En un chat privado, el otro usuario puede ser el creador
              if (!otherUserId) {
                otherUserId = chat.createdBy !== authUser?.id ? chat.createdBy : null;
              }
              
              if (!otherUserId) {
                toast.error('No se pudo identificar al usuario a bloquear');
                return;
              }
              
              await userService.blockUser(otherUserId);
              
              // Eliminar el chat después de bloquear
              deleteChatMutation.mutate(chatId);
              toast.success('Usuario bloqueado correctamente', 1500);
            } catch (err) {
              toast.error('No se pudo bloquear al usuario');
            }
          }
        } else {
          toast.warning('Solo puedes bloquear usuarios en chats privados.');
        }
        break;
      default:
        // Acción no implementada - no mostrar nada
    }
  };

  return (
    <DashboardLayout fluid contentClassName="h-full p-0 overflow-hidden">
      <div className="chats-layout flex h-full w-full min-h-0 overflow-hidden rounded-t-none rounded-b-2xl glass-liquid">
        <div className="grid h-full w-full flex-1 grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] gap-0 min-h-0">
        <Card
          padded={false}
          className="relative flex h-full flex-col overflow-hidden !rounded-none border-r border-white/30 dark:border-white/10 glass-liquid min-h-0"
        >

          <div className="relative z-10 flex h-full flex-col overflow-hidden min-h-0">
            <header className="flex min-h-[96px] items-center justify-between gap-3 border-b border-white/30 dark:border-white/10 glass-liquid px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-sena-green">
                  Chats
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Buscar un chat o iniciar uno nuevo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={moreMenuRef}>
                  <button
                    ref={moreMenuButtonRef}
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-2xl text-[var(--color-muted)] transition-colors duration-ui hover:bg-white/30 dark:hover:bg-[#0E0F0F] hover:text-sena-green"
                    aria-haspopup="true"
                    aria-expanded={isMoreMenuOpen}
                    aria-label="Mas opciones"
                    onClick={() => {
                      if (isMoreMenuOpen) {
                        setIsMoreMenuOpen(false);
                        return;
                      }
                      updateMoreMenuPosition();
                      setIsMoreMenuOpen(true);
                    }}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {isMoreMenuOpen &&
                    moreMenuCoords &&
                    createPortal(
                      <motion.div
                        key="chats-header-more"
                        ref={moreMenuPortalRef}
                        role="menu"
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          opacity: UI_MENU_TRANSITION.opacity,
                          y: UI_MENU_TRANSITION.y,
                          scale: UI_MENU_TRANSITION.scale
                        }}
                        className="fixed z-[100060] flex w-56 min-w-[14rem] flex-col gap-1 overflow-visible rounded-2xl border border-slate-200/90 bg-white p-1.5 text-[var(--color-text)] shadow-[0_12px_40px_-4px_rgba(15,23,42,0.22),0_4px_16px_-4px_rgba(15,23,42,0.12)] dark:border-neutral-700/90 dark:bg-neutral-900 dark:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.55),0_8px_24px_-8px_rgba(0,0,0,0.38)]"
                        style={{
                          top: moreMenuCoords.top,
                          left: moreMenuCoords.left,
                          pointerEvents: 'auto',
                          overflow: 'visible'
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setShowStarredMessages(true);
                          }}
                          className={chatsHeaderMoreMenuItemClass}
                        >
                          <Star className="h-4 w-4 shrink-0 text-sena-green" /> Mensajes destacados
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsSelectionMode(true);
                          }}
                          className={chatsHeaderMoreMenuItemClass}
                        >
                          <CheckSquare2 className="h-4 w-4 shrink-0 text-sena-green" /> Seleccionar chats
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            const allChatIds = chats.map((chat) => chat.id);
                            setReadChats(new Set(allChatIds));
                            const now = new Date().toISOString();
                            const allReadTimes: Record<string, string> = {};
                            allChatIds.forEach((chatId) => {
                              allReadTimes[chatId] = now;
                            });
                            setLastReadTimes((prev) => {
                              const updated = { ...prev, ...allReadTimes };
                              localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className={chatsHeaderMoreMenuItemClass}
                        >
                          <CheckCheck className="h-4 w-4 shrink-0 text-sena-green" /> Marcar todos como leído
                        </button>
                      </motion.div>,
                      document.body
                    )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatDialog(true)}
                  aria-label="Nuevo chat"
                  className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-2xl font-medium transition-all duration-ui bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-sena-green"
                >
                  <MessageCirclePlus className="h-4 w-4 text-sena-green" />
                </button>
              </div>
            </header>

            <div className="space-y-4 border-b border-white/20 dark:border-white/10 bg-white/20 dark:bg-neutral-800/20 backdrop-blur-sm px-6 py-5">
              <div className="chat-compose-focus-glass flex items-center gap-3 rounded-2xl glass-liquid px-4 py-3 transition-shadow duration-ui">
                <Search className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar un chat o iniciar uno nuevo"
                  className="flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] placeholder:text-xs"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl bg-white/30 dark:bg-neutral-700/30 backdrop-blur-sm p-1.5 text-xs text-[var(--color-muted)]">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveFilter(tab.value)}
                      className={classNames(
                        'flex-1 rounded-2xl px-3 py-2 transition-all duration-ui font-medium',
                        activeFilter === tab.value
                          ? 'bg-gradient-to-r from-sena-green to-emerald-500 text-white shadow-[0_4px_12px_rgba(57,169,0,0.35)] scale-105'
                          : 'hover:text-[var(--color-text)] hover:bg-white/20 dark:hover:bg-white/10'
                      )}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {Icon && <Icon className={classNames('h-3.5 w-3.5', activeFilter === tab.value && 'text-white')} />}
                        {tab.label}
                        {tabStats[tab.value] > 0 && (
                          <span
                            className={classNames(
                              'rounded-2xl px-2 py-0.5 text-[10px] font-bold transition-all duration-ui',
                              activeFilter === tab.value
                                ? 'bg-white/30 text-white'
                                : 'bg-white/30 dark:bg-neutral-600/30 text-[var(--color-muted)]'
                            )}
                          >
                            {tabStats[tab.value]}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Formulario inline de creación de chat eliminado; ahora sólo se usa el diálogo modal. */}
            </div>

            {tabStats.archived > 0 && (
              <div className="px-6 py-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('archived')}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-2xl bg-white/40 dark:bg-neutral-700/40 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)] shadow-sm transition-colors duration-ui hover:bg-white/70 dark:hover:bg-neutral-700/70',
                    activeFilter === 'archived' && 'ring-2 ring-sena-green/40 bg-white dark:bg-neutral-800'
                  )}
                >
                  <Archive className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                  <span>Archivados ({tabStats.archived})</span>
                </button>
              </div>
            )}

            {isSelectionMode && selectedChats.size > 0 && (
              <div className="border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-800/30 backdrop-blur-sm px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {selectedChats.size} {selectedChats.size === 1 ? 'chat seleccionado' : 'chats seleccionados'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Marcar seleccionados como leídos
                        const now = new Date().toISOString();
                        setReadChats(prev => {
                          const newSet = new Set(prev);
                          selectedChats.forEach(id => newSet.add(id));
                          return newSet;
                        });
                        setLastReadTimes(prev => {
                          const updated = { ...prev };
                          selectedChats.forEach(id => {
                            updated[id] = now;
                          });
                          localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
                          return updated;
                        });
                        setSelectedChats(new Set());
                        setIsSelectionMode(false);
                      }}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                      Marcar como leído
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedChats(new Set());
                        setIsSelectionMode(false);
                      }}
                      className="text-xs"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 hide-scrollbar" style={{ position: 'relative', zIndex: 1 }}>
              {isLoadingChats ? (
                <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="h-8 w-8 animate-spin rounded-2xl border-4 border-sena-green/20 border-t-sena-green"></div>
                  <p className="text-xs text-[var(--color-muted)]">Cargando conversaciones...</p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="mt-8 rounded-2xl border-2 border-dashed border-sena-green/20 bg-gradient-to-br from-sena-green/5 to-transparent px-6 py-8 text-center">
                  <MessageCirclePlus className="h-12 w-12 mx-auto mb-3 text-sena-green/40" />
                  <p className="text-sm font-medium text-[var(--color-text)] mb-1">No hay conversaciones</p>
                  <p className="text-xs text-[var(--color-muted)]">En esta vista.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {/* Chats normales */}
                  {activeFilter !== 'archived' && normalChats.length > 0 && normalChats.map((chat) => {
                    const isActive = chat.id === selectedChatId;
                    const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);
                    const chatLabel = getChatDisplayName(chat);
                    const initials = getInitialsFromLabel(chatLabel);
                    const gradient = getAvatarGradient(chat.id);
                    const avatarUrl = getChatAvatarUrl(chat);
                    const hasUnread = !chat.lastMessageAt;
                    const unreadCount = unreadCounts[chat.id] || (hasUnread ? 1 : 0);
                    const isPinned = pinnedChats.has(chat.id);
                    const isMuted = mutedChats.has(chat.id);
                    const isFavorite = favoriteChats.has(chat.id);

                    const isSelected = selectedChats.has(chat.id);

                    return (
                      <li
                        key={chat.id}
                        className={classNames('relative', isActive && !isSelectionMode && 'z-[2]')}
                      >
                        {isSelectionMode ? (
                          <div
                            onClick={() => {
                              setSelectedChats(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(chat.id)) {
                                  newSet.delete(chat.id);
                                } else {
                                  newSet.add(chat.id);
                                }
                                return newSet;
                              });
                            }}
                            className={classNames(
                              'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-ui cursor-pointer',
                              isSelected
                                ? 'bg-gradient-to-r from-sena-green/20 via-emerald-500/15 to-sena-green/20 text-sena-green shadow-[0_8px_32px_rgba(57,169,0,0.25)] border-2 border-sena-green/40 scale-[1.01] backdrop-blur-sm'
                                : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-neutral-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                            )}
                          >
                            <div className={classNames(
                              'flex h-6 w-6 items-center justify-center rounded-2xl border-2 transition-all duration-ui flex-shrink-0',
                              isSelected
                                ? 'bg-sena-green border-sena-green text-white'
                                : 'border-slate-400/50 text-transparent hover:border-sena-green/50'
                            )}>
                              {isSelected && <CheckCheck className="h-4 w-4" />}
                            </div>
                            <span className="relative inline-flex flex-shrink-0">
                              {avatarUrl ? (
                                <img
                                  src={resolveAssetUrl(avatarUrl) ?? avatarUrl}
                                  alt={chatLabel}
                                  className={classNames(
                                    'h-12 w-12 rounded-2xl object-cover shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-ui',
                                    isSelected && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                  )}
                                />
                              ) : (
                                <span
                                  className={classNames(
                                    'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-ui',
                                    gradient,
                                    isSelected && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                  )}
                                >
                                  {initials}
                                </span>
                              )}
                              {!chat.isGroup && (
                                <span
                                  className={classNames(
                                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-2xl ring-2 ring-white dark:ring-neutral-800 transition-all duration-ui',
                                    hasUnread
                                      ? 'bg-gradient-to-br from-sena-green to-emerald-500 shadow-[0_2px_8px_rgba(57,169,0,0.5)]'
                                      : 'bg-transparent'
                                  )}
                                />
                              )}
                              {isPinned && (
                                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-2xl bg-sena-green text-white shadow-lg">
                                  <Pin className="h-3 w-3" />
                                </span>
                              )}
                              {isMuted && (
                                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-2xl bg-neutral-600 text-white">
                                  <BellOff className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={classNames(
                                  'truncate font-semibold',
                                  isSelected ? 'text-sm' : 'text-sm',
                                  hasUnread && !isSelected && 'text-[var(--color-text)]'
                                )}>
                                  {chatLabel}
                                </p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {unreadCount > 0 && !isSelected && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-2xl bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                  )}
                                  <span
                                    className={classNames(
                                      'text-[10px] font-medium whitespace-nowrap',
                                      hasUnread ? 'text-sena-green font-bold' : 'text-[var(--color-muted)]'
                                    )}
                                  >
                                    {lastActivity}
                                  </span>
                                </div>
                              </div>
                              <p
                                className={classNames(
                                  'mt-1 text-xs truncate',
                                  hasUnread
                                    ? 'text-sena-green/90 font-semibold'
                                    : 'text-[var(--color-muted)]'
                                )}
                              >
                                {chat.isGroup
                                  ? 'Grupo colaborativo'
                                  : hasUnread
                                    ? 'Nuevo mensaje'
                                    : 'Nuevo mensaje'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatId(chat.id);
                              setOpenMenuId(null);
                              setMenuPosition(null);
                              // Marcar como leído al seleccionar
                              setReadChats((prev) => {
                                const newSet = new Set(prev);
                                newSet.add(chat.id);
                                return newSet;
                              });
                              // Guardar la fecha de última lectura
                              const now = new Date().toISOString();
                              setLastReadTimes((prev) => {
                                const updated = { ...prev, [chat.id]: now };
                                localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
                                return updated;
                              });
                            }}
                            className={classNames(
                              'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-ui',
                              isActive
                                ? 'bg-white/95 text-[var(--color-text)] shadow-[0_8px_28px_rgba(15,23,42,0.12),0_2px_10px_rgba(15,23,42,0.06)] border border-white/80 ring-1 ring-black/[0.06] backdrop-blur-md dark:bg-neutral-800/95 dark:shadow-[0_10px_36px_rgba(0,0,0,0.42),0_4px_14px_rgba(0,0,0,0.28)] dark:border-neutral-600/55 dark:ring-white/[0.08] scale-[1.01]'
                                : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-neutral-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                            )}
                          >
                            <span className="relative inline-flex flex-shrink-0">
                              {avatarUrl ? (
                                <img
                                  src={resolveAssetUrl(avatarUrl) ?? avatarUrl}
                                  alt={chatLabel}
                                  className={classNames(
                                    'h-12 w-12 rounded-2xl object-cover shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-ui',
                                    isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                  )}
                                />
                              ) : (
                                <span
                                  className={classNames(
                                    'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-ui',
                                    gradient,
                                    isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                  )}
                                >
                                  {initials}
                                </span>
                              )}
                              {!chat.isGroup && (
                                <span
                                  className={classNames(
                                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-2xl ring-2 ring-white dark:ring-neutral-800 transition-all duration-ui',
                                    hasUnread
                                      ? 'bg-gradient-to-br from-sena-green to-emerald-500 shadow-[0_2px_8px_rgba(57,169,0,0.5)]'
                                      : 'bg-transparent'
                                  )}
                                />
                              )}
                              {isPinned && (
                                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-2xl bg-sena-green text-white shadow-lg">
                                  <Pin className="h-3 w-3" />
                                </span>
                              )}
                              {isMuted && (
                                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-2xl bg-neutral-600 text-white">
                                  <BellOff className="h-2.5 w-2.5" />
                                </span>
                              )}
                              {isFavorite && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                                </span>
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={classNames(
                                  'truncate font-semibold',
                                  isActive ? 'text-sm' : 'text-sm',
                                  hasUnread && !isActive && 'text-[var(--color-text)]'
                                )}>
                                  {chatLabel}
                                </p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {unreadCount > 0 && !isActive && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-2xl bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                  )}
                                  <span
                                    className={classNames(
                                      'text-[10px] font-medium whitespace-nowrap',
                                      hasUnread ? 'text-sena-green font-bold' : 'text-[var(--color-muted)]'
                                    )}
                                  >
                                    {lastActivity}
                                  </span>
                                </div>
                              </div>
                              <p
                                className={classNames(
                                  'mt-1 text-xs truncate',
                                  hasUnread
                                    ? 'text-sena-green/90 font-semibold'
                                    : 'text-[var(--color-muted)]'
                                )}
                              >
                                {chat.isGroup
                                  ? 'Grupo colaborativo'
                                  : hasUnread
                                    ? 'Nuevo mensaje'
                                    : 'Nuevo mensaje'}
                              </p>
                            </div>
                            <button
                              ref={(el) => {
                                menuButtonRefs.current[chat.id] = el;
                              }}
                              type="button"
                              onClick={(e) => handleMenuToggle(chat.id, e)}
                              className={classNames(
                                'flex h-8 w-8 items-center justify-center rounded-2xl transition-all duration-ui flex-shrink-0',
                                openMenuId === chat.id
                                  ? 'opacity-100 bg-sena-green/20 dark:bg-sena-green/30 text-sena-green shadow-md rotate-180'
                                  : 'opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:bg-white/20 dark:hover:bg-neutral-700/20 hover:text-sena-green'
                              )}
                              aria-label="Opciones del chat"
                            >
                              <ChevronDown className="h-4 w-4 transition-transform duration-ui" />
                            </button>
                          </button>
                        )}

                        {!isSelectionMode && openMenuId === chat.id && menuPosition && (
                          createPortal(
                            <div
                              ref={(el) => {
                                menuRefs.current[chat.id] = el;
                              }}
                              className="fixed w-[220px] rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-700/90 shadow-[0_10px_28px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.45)] p-2 text-sm text-[var(--color-text)]"
                              style={{
                                left: `${menuPosition.x}px`,
                                top: `${menuPosition.y}px`,
                                position: 'fixed',
                                zIndex: 999999,
                                pointerEvents: 'auto',
                                isolation: 'isolate',
                              }}
                            >
                            <div className="relative z-10">
                              {!archivedChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('archive', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Archive className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Archivar chat</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unarchive', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Archive className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Desarchivar chat</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!mutedChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('mute', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <BellOff className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Silenciar notificaciones</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unmute', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <BellOff className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Activar notificaciones</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!pinnedChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('pin', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Pin className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Fijar chat</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unpin', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Pin className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Desfijar chat</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              <button
                                type="button"
                                onClick={() => handleMenuAction('markRead', chat.id)}
                                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                              >
                                <CheckSquare2 className="h-4 w-4 text-sena-green flex-shrink-0" />
                                <span className="text-left font-medium">Marcar como leído</span>
                              </button>
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!favoriteChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('favorite', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Star className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Añadir a Favoritos</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unfavorite', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Star className="h-4 w-4 text-amber-400 flex-shrink-0 fill-amber-400" />
                                  <span className="text-left font-medium">Quitar de Favoritos</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!chat.isGroup && (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('block', chat.id)}
                                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                >
                                  <Ban className="h-4 w-4 text-sena-green flex-shrink-0" />
                                  <span className="text-left font-medium">Bloquear</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              <button
                                type="button"
                                onClick={() => handleMenuAction('delete', chat.id)}
                                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-red-500 dark:text-red-400 transition-colors duration-ui hover:bg-rose-50 dark:hover:bg-rose-900/25 hover:text-red-600 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                                <span className="text-left font-medium">Eliminar chat</span>
                              </button>
                            </div>
                            </div>,
                            document.body
                          )
                        )}
                      </li>
                        );
                  })}

                        {/* Vista completa de archivados */}
                        {activeFilter === 'archived' && archivedChatsList.length > 0 && (
                          <>
                            <li className="sticky top-0 z-10 mb-2">
                              <div className="flex items-center gap-2 px-4 py-2">
                                <Archive className="h-4 w-4 text-[var(--color-muted)]" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                  Archivados
                                </h3>
                                <div className="flex-1 h-px bg-white/20 dark:bg-white/10"></div>
                              </div>
                            </li>
                            {archivedChatsList.map((chat) => {
                              const isActive = chat.id === selectedChatId;
                              const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);
                              const chatLabel = getChatDisplayName(chat);
                              const initials = getInitialsFromLabel(chatLabel);
                              const gradient = getAvatarGradient(chat.id);
                              const avatarUrl = getChatAvatarUrl(chat);
                              const hasUnread = !chat.lastMessageAt;
                              const unreadCount = unreadCounts[chat.id] || (hasUnread ? 1 : 0);
                              const isPinned = pinnedChats.has(chat.id);
                              const isMuted = mutedChats.has(chat.id);
                              const isFavorite = favoriteChats.has(chat.id);

                              return (
                                <li key={chat.id} className={classNames('relative', isActive && 'z-[2]')}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChatId(chat.id);
                                      setOpenMenuId(null);
                                      setMenuPosition(null);
                                      setReadChats((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.add(chat.id);
                                        return newSet;
                                      });
                                      const now = new Date().toISOString();
                                      setLastReadTimes((prev) => {
                                        const updated = { ...prev, [chat.id]: now };
                                        localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
                                        return updated;
                                      });
                                    }}
                                    className={classNames(
                                      'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-ui',
                                      isActive
                                        ? 'bg-white/95 text-[var(--color-text)] shadow-[0_8px_28px_rgba(15,23,42,0.12),0_2px_10px_rgba(15,23,42,0.06)] border border-sena-green/30 ring-1 ring-sena-green/25 backdrop-blur-md dark:bg-neutral-800/95 dark:shadow-[0_10px_36px_rgba(0,0,0,0.42),0_4px_14px_rgba(0,0,0,0.28)] dark:border-sena-green/35 dark:ring-sena-green/20 scale-[1.01]'
                                        : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-neutral-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                                    )}
                                  >
                                    <span className="relative inline-flex flex-shrink-0">
                                      {avatarUrl ? (
                                        <img
                                          src={resolveAssetUrl(avatarUrl) ?? avatarUrl}
                                          alt={chatLabel}
                                          className={classNames(
                                            'h-12 w-12 rounded-2xl object-cover shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-ui',
                                            isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                          )}
                                        />
                                      ) : (
                                        <span
                                          className={classNames(
                                            'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-ui',
                                            gradient,
                                            isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                          )}
                                        >
                                          {initials}
                                        </span>
                                      )}
                                      {isPinned && (
                                        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-2xl bg-sena-green text-white shadow-lg">
                                          <Pin className="h-3 w-3" />
                                        </span>
                                      )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className={classNames(
                                          'truncate font-semibold',
                                          isActive ? 'text-sm' : 'text-sm',
                                          hasUnread && !isActive && 'text-[var(--color-text)]'
                                        )}>
                                          {chatLabel}
                                        </p>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {unreadCount > 0 && !isActive && (
                                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-2xl bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
                                              {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                          )}
                                          <span
                                            className={classNames(
                                              'text-[10px] font-medium whitespace-nowrap',
                                              hasUnread ? 'text-sena-green font-bold' : 'text-[var(--color-muted)]'
                                            )}
                                          >
                                            {lastActivity}
                                          </span>
                                        </div>
                                      </div>
                                      <p
                                        className={classNames(
                                          'mt-1 text-xs truncate',
                                          hasUnread
                                            ? 'text-sena-green/90 font-semibold'
                                            : 'text-[var(--color-muted)]'
                                        )}
                                      >
                                        {chat.isGroup
                                          ? 'Grupo colaborativo'
                                          : hasUnread
                                            ? 'Nuevo mensaje'
                                            : 'Nuevo mensaje'}
                                      </p>
                                    </div>
                                    <button
                                      ref={(el) => {
                                        menuButtonRefs.current[chat.id] = el;
                                      }}
                                      type="button"
                                      onClick={(e) => handleMenuToggle(chat.id, e)}
                                      className={classNames(
                                        'flex h-8 w-8 items-center justify-center rounded-2xl transition-all duration-ui flex-shrink-0',
                                        openMenuId === chat.id
                                          ? 'opacity-100 bg-sena-green/20 dark:bg-sena-green/30 text-sena-green shadow-md rotate-180'
                                          : 'opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:bg-white/20 dark:hover:bg-neutral-700/20 hover:text-sena-green'
                                      )}
                                      aria-label="Opciones del chat"
                                    >
                                      <ChevronDown className="h-4 w-4 transition-transform duration-ui" />
                                    </button>
                                  </button>

                                  {openMenuId === chat.id && menuPosition && (
                                    createPortal(
                                      <div
                                        ref={(el) => {
                                          menuRefs.current[chat.id] = el;
                                        }}
                                        className="fixed w-[220px] rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-700/90 shadow-[0_10px_28px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.45)] p-2 text-sm text-[var(--color-text)]"
                                        style={{
                                          left: `${menuPosition.x}px`,
                                          top: `${menuPosition.y}px`,
                                          position: 'fixed',
                                          zIndex: 999999,
                                          pointerEvents: 'auto',
                                          isolation: 'isolate',
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleMenuAction('unarchive', chat.id)}
                                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                        >
                                          <Archive className="h-4 w-4 text-sena-green flex-shrink-0" />
                                          <span className="text-left font-medium">Desarchivar chat</span>
                                        </button>
                                        {!mutedChats.has(chat.id) ? (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('mute', chat.id)}
                                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                          >
                                            <BellOff className="h-4 w-4 text-sena-green flex-shrink-0" />
                                            <span className="text-left font-medium">Silenciar notificaciones</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('unmute', chat.id)}
                                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                          >
                                            <BellOff className="h-4 w-4 text-sena-green flex-shrink-0" />
                                            <span className="text-left font-medium">Activar notificaciones</span>
                                          </button>
                                        )}
                                        {!pinnedChats.has(chat.id) ? (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('pin', chat.id)}
                                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                          >
                                            <Pin className="h-4 w-4 text-sena-green flex-shrink-0" />
                                            <span className="text-left font-medium">Fijar chat</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('unpin', chat.id)}
                                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                          >
                                            <Pin className="h-4 w-4 text-sena-green flex-shrink-0" />
                                            <span className="text-left font-medium">Desfijar chat</span>
                                          </button>
                                        )}
                                        <div className="my-1 h-px bg-neutral-700/50 dark:bg-neutral-600/50 mx-2" />
                                        <button
                                          type="button"
                                          onClick={() => handleMenuAction('delete', chat.id)}
                                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-red-500 dark:text-red-400 transition-colors duration-ui hover:bg-rose-50 dark:hover:bg-rose-900/25 hover:text-red-600 dark:hover:text-red-300"
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                                          <span className="text-left font-medium">Eliminar chat</span>
                                        </button>
                                      </div>,
                                      document.body
                                    )
                                  )}
                                </li>
                              );
                            })}
                          </>
                        )}
                      </ul>
                    )
                  }
            </div>
          </div>
        </Card>

        <Card
          padded={false}
          className="relative flex h-full flex-col overflow-hidden !rounded-none glass-liquid min-h-0"
        >
          <div className="relative z-10 flex h-full flex-col min-h-0">
            {activeChat ? (
              <>
                <header className="flex min-h-[96px] flex-shrink-0 flex items-center justify-between gap-4 border-b border-white/30 dark:border-white/10 glass-liquid px-6 py-5">
                  {activeChatOtherUserId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${activeChatOtherUserId}`)}
                      className="flex items-center gap-4 rounded-2xl text-left outline-none transition-opacity duration-ui hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sena-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      aria-label={`Ver perfil de ${activeChatName}`}
                    >
                      {activeChatAvatarUrl ? (
                        <img
                          src={resolveAssetUrl(activeChatAvatarUrl) ?? activeChatAvatarUrl}
                          alt={activeChatName}
                          className="h-14 w-14 rounded-2xl object-cover shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform duration-ui hover:scale-110"
                        />
                      ) : (
                        <span
                          className={classNames(
                            'flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform duration-ui hover:scale-110',
                            activeChatGradient
                          )}
                        >
                          {activeChatInitials}
                        </span>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-sena-green">{activeChatName}</h3>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5 font-medium">
                          {activeChat.isGroup ? 'Chat grupal' : 'Chat privado'} • {activeChatLastActivity}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-4">
                      {activeChatAvatarUrl ? (
                        <img
                          src={resolveAssetUrl(activeChatAvatarUrl) ?? activeChatAvatarUrl}
                          alt={activeChatName}
                          className="h-14 w-14 rounded-2xl object-cover shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform duration-ui hover:scale-110"
                        />
                      ) : (
                        <span
                          className={classNames(
                            'flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform duration-ui hover:scale-110',
                            activeChatGradient
                          )}
                        >
                          {activeChatInitials}
                        </span>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-sena-green">{activeChatName}</h3>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5 font-medium">
                          {activeChat.isGroup ? 'Chat grupal' : 'Chat privado'} • {activeChatLastActivity}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedChatId) {
                          const isFavorite = favoriteChats.has(selectedChatId);
                          if (isFavorite) {
                            handleMenuAction('unfavorite', selectedChatId);
                          } else {
                            handleMenuAction('favorite', selectedChatId);
                          }
                        }
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-2xl font-medium transition-all duration-ui bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-sena-green"
                      aria-label="Marcar como favorito"
                    >
                      <Star className={classNames("h-4 w-4 text-sena-green", selectedChatId && favoriteChats.has(selectedChatId) && "!text-yellow-500 !fill-yellow-500")} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-2xl font-medium transition-all duration-ui bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-sena-green"
                      aria-label="Llamada de voz"
                    >
                      <Phone className="h-4 w-4 text-sena-green" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-2xl font-medium transition-all duration-ui bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-sena-green"
                      aria-label="Videollamada"
                    >
                      <Video className="h-4 w-4 text-sena-green" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChatInfoPanelOpen(true)}
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-2xl font-medium transition-all duration-ui bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-sena-green"
                      aria-label="Detalles del chat"
                    >
                      <Info className="h-4 w-4 text-sena-green" />
                    </button>
                  </div>
                </header>

                <div ref={messageListRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-6 hide-scrollbar bg-gradient-to-b from-transparent via-transparent to-white/20 dark:to-neutral-800/20">
                  <div className="flex w-full flex-col gap-4">
                    <div className="flex flex-col items-center gap-4 rounded-2xl glass-liquid-strong px-8 py-8 text-center border border-white/30 dark:border-white/10 shadow-xl">
                      {activeChatOtherUserId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/profile/${activeChatOtherUserId}`)}
                          className="flex flex-col items-center gap-4 rounded-2xl text-center outline-none transition-opacity duration-ui hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sena-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                          aria-label={`Ver perfil de ${activeChatName}`}
                        >
                          {activeChatAvatarUrl ? (
                            <img
                              src={resolveAssetUrl(activeChatAvatarUrl) ?? activeChatAvatarUrl}
                              alt={activeChatName}
                              className="h-24 w-24 rounded-2xl object-cover shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-transform duration-ui hover:scale-110"
                            />
                          ) : (
                            <span
                              className={classNames(
                                'flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-transform duration-ui hover:scale-110',
                                activeChatGradient
                              )}
                            >
                              {activeChatInitials}
                            </span>
                          )}
                          <div>
                            <p className="text-base font-bold text-[var(--color-text)] mb-1">{activeChatName}</p>
                            <p className="text-xs text-[var(--color-muted)] font-medium">
                              Activo(a) {activeChatLastActivity}
                            </p>
                          </div>
                        </button>
                      ) : (
                        <>
                          {activeChatAvatarUrl ? (
                            <img
                              src={resolveAssetUrl(activeChatAvatarUrl) ?? activeChatAvatarUrl}
                              alt={activeChatName}
                              className="h-24 w-24 rounded-2xl object-cover shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-transform duration-ui hover:scale-110"
                            />
                          ) : (
                            <span
                              className={classNames(
                                'flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-transform duration-ui hover:scale-110',
                                activeChatGradient
                              )}
                            >
                              {activeChatInitials}
                            </span>
                          )}
                          <div>
                            <p className="text-base font-bold text-[var(--color-text)] mb-1">{activeChatName}</p>
                            <p className="text-xs text-[var(--color-muted)] font-medium">Activo(a) {activeChatLastActivity}</p>
                          </div>
                        </>
                      )}
                      <p className="max-w-xl text-xs text-[var(--color-muted)] leading-relaxed">
                        Los mensajes y las llamadas están protegidos con cifrado de extremo a extremo. Solo las personas
                        de este chat pueden leerlos o compartirlos.
                      </p>
                    </div>
                    {isFetchingMessages ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-2xl border-3 border-sena-green/20 border-t-sena-green"></div>
                        <p className="text-xs text-[var(--color-muted)]">Cargando mensajes...</p>
                      </div>
                    ) : sortedMessages.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-sena-green/20 bg-gradient-to-br from-sena-green/5 to-transparent px-8 py-12 text-center">
                        <MessageCirclePlus className="h-16 w-16 mx-auto mb-4 text-sena-green/40" />
                        <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Aún no hay mensajes</p>
                        <p className="text-xs text-[var(--color-muted)]">Escribe el primero!</p>
                      </div>
                    ) : (
                      sortedMessages.map((entry) => {
                        const isOwn = authUser?.id === entry.senderId;
                        const timestamp = new Date(entry.createdAt).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        const senderFriend = !isOwn ? friends.find((f) => f.id === entry.senderId) : null;
                        return (
                          <div
                            key={entry.id}
                            className={classNames('flex gap-3 items-end relative group', isOwn ? 'justify-end' : 'justify-start')}
                          >
                            {/* Avatar para mensajes de grupos (solo si no es propio) */}
                            {!isOwn && activeChat?.isGroup && (
                              <button
                                type="button"
                                onClick={() => navigate(`/profile/${entry.senderId}`)}
                                className="flex-shrink-0 cursor-pointer transition-transform duration-ui hover:scale-110"
                              >
                                <UserAvatar
                                  firstName={senderFriend?.firstName || ''}
                                  lastName={senderFriend?.lastName || ''}
                                  avatarUrl={senderFriend?.avatarUrl}
                                  size="sm"
                                />
                              </button>
                            )}
                            <div
                              className={classNames(
                                'max-w-[75%] rounded-2xl px-5 py-3.5 text-sm shadow-lg transition-all duration-ui relative',
                                isOwn
                                  ? 'bg-gradient-to-br from-sena-green to-emerald-600 text-white shadow-[0_8px_24px_rgba(57,169,0,0.3)]'
                                  : 'bg-white/40 dark:bg-neutral-700/40 backdrop-blur-sm text-[var(--color-text)] border border-white/50 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.1)]'
                              )}
                            >
                              {isOwn && (
                                <button
                                  ref={(el) => {
                                    messageButtonRefs.current[entry.id] = el;
                                  }}
                                  type="button"
                                  onClick={(e) => handleMessageMenuToggle(entry.id, e)}
                                  className={classNames(
                                    'absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-2xl transition-all duration-ui z-20',
                                    openMessageMenuId === entry.id
                                      ? 'opacity-100 bg-white/30 dark:bg-neutral-700/50 text-white shadow-lg scale-110'
                                      : 'opacity-0 group-hover:opacity-100 bg-white/20 dark:bg-neutral-700/30 text-white/90 hover:bg-white/30 dark:hover:bg-neutral-700/50 hover:scale-110'
                                  )}
                                  aria-label="Opciones del mensaje"
                                >
                                  <ChevronDown className={classNames(
                                    'h-3 w-3 transition-transform duration-ui',
                                    openMessageMenuId === entry.id && 'rotate-180'
                                  )} />
                                </button>
                              )}
                              {!isOwn && activeChat?.isGroup && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/profile/${entry.senderId}`)}
                                  className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text)] hover:text-sena-green transition-colors duration-ui mb-1.5 cursor-pointer"
                                >
                                  {getSenderName(entry.senderId)}
                                </button>
                              )}
                              {entry.attachmentUrl && (() => {
                                const attachmentUrl = resolveAssetUrl(entry.attachmentUrl);
                                const isImage = entry.attachmentUrl.match(/^data:image\//) ||
                                  entry.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                                  (attachmentUrl && attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                                const isPdf = entry.attachmentUrl.match(/\.(pdf)$/i) ||
                                  (attachmentUrl && attachmentUrl.match(/\.(pdf)$/i));

                                return (
                                  <div className="mb-2 rounded-2xl overflow-hidden">
                                    {isImage && attachmentUrl ? (
                                      <img
                                        src={attachmentUrl}
                                        alt="Adjunto"
                                        className="max-w-full max-h-64 rounded-2xl object-cover"
                                      />
                                    ) : (
                                      <a
                                        href={attachmentUrl || entry.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classNames(
                                          'flex items-center gap-3 p-3 rounded-2xl transition-all duration-ui hover:opacity-80',
                                          isOwn
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/30 dark:bg-neutral-600/30 text-[var(--color-text)]'
                                        )}
                                      >
                                        <div className={classNames(
                                          'flex h-10 w-10 items-center justify-center rounded-2xl',
                                          isOwn ? 'bg-white/20' : 'bg-sena-green/20'
                                        )}>
                                          {isPdf ? (
                                            <FileText className={classNames('h-5 w-5', isOwn ? 'text-white' : 'text-sena-green')} />
                                          ) : (
                                            <File className={classNames('h-5 w-5', isOwn ? 'text-white' : 'text-sena-green')} />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={classNames('text-sm font-medium truncate', isOwn && 'text-white')}>
                                            Archivo adjunto
                                          </p>
                                          <p className={classNames('text-xs truncate', isOwn ? 'text-white/70' : 'text-[var(--color-muted)]')}>
                                            {attachmentUrl?.split('/').pop() || entry.attachmentUrl.split('/').pop() || 'Descargar'}
                                          </p>
                                        </div>
                                        <Download className={classNames('h-4 w-4 flex-shrink-0', isOwn ? 'text-white/70' : 'text-[var(--color-muted)]')} />
                                      </a>
                                    )}
                                  </div>
                                );
                              })()}
                              {entry.content && (
                                <p className={classNames('leading-relaxed whitespace-pre-wrap break-words', isOwn && 'text-white')}>
                                  {entry.content}
                                </p>
                              )}
                              <p
                                className={classNames(
                                  'mt-2 text-[10px] font-medium',
                                  isOwn ? 'text-white/80' : 'text-[var(--color-muted)]'
                                )}
                              >
                                {timestamp}
                              </p>
                            </div>

                            {/* Menú contextual para mensajes propios */}
                            {isOwn && openMessageMenuId === entry.id && messageMenuPosition && (
                              createPortal(
                                <div
                                  ref={(el) => {
                                    messageMenuRefs.current[entry.id] = el;
                                  }}
                                  className="fixed w-48 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-700/90 shadow-[0_10px_28px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.45)] p-2 text-sm text-[var(--color-text)] z-[999999]"
                                  style={{
                                    left: `${messageMenuPosition.x}px`,
                                    top: `${messageMenuPosition.y}px`,
                                    position: 'fixed',
                                    pointerEvents: 'auto',
                                    isolation: 'isolate',
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('reply', entry)}
                                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                  >
                                    <Reply className="h-4 w-4 text-sena-green flex-shrink-0" />
                                    <span className="text-left font-medium">Responder</span>
                                  </button>
                                  {entry.content && (
                                    <button
                                      type="button"
                                      onClick={() => handleMessageAction('copy', entry)}
                                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                    >
                                      <Copy className="h-4 w-4 text-sena-green flex-shrink-0" />
                                      <span className="text-left font-medium">Copiar</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('forward', entry)}
                                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                  >
                                    <Forward className="h-4 w-4 text-sena-green flex-shrink-0" />
                                    <span className="text-left font-medium">Reenviar</span>
                                  </button>
                                  {entry.attachmentUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handleMessageAction('download', entry)}
                                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-ui hover:bg-black/5 dark:hover:bg-neutral-800"
                                    >
                                      <Download className="h-4 w-4 text-sena-green flex-shrink-0" />
                                      <span className="text-left font-medium">Descargar</span>
                                    </button>
                                  )}
                                  <div className="my-1 h-px bg-slate-200 dark:bg-neutral-700" />
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('star', entry)}
                                    className={classNames(
                                      "flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-all duration-ui",
                                      (() => {
                                        const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '[]');
                                        const isStarred = starredMessages.includes(entry.id);
                                        return isStarred
                                          ? "text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/25"
                                          : "text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-neutral-800";
                                      })()
                                    )}
                                  >
                                    <Star className={classNames(
                                      "h-4 w-4 flex-shrink-0 transition-colors duration-ui",
                                      (() => {
                                        const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '[]');
                                        const isStarred = starredMessages.includes(entry.id);
                                        return isStarred
                                          ? "text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400"
                                          : "text-sena-green";
                                      })()
                                    )} />
                                    <span className="text-left font-medium">Destacar</span>
                                  </button>
                                  <div className="my-1 h-px bg-slate-200 dark:bg-neutral-700" />
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('delete', entry)}
                                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-red-500 dark:text-red-400 transition-colors duration-ui hover:bg-rose-50 dark:hover:bg-rose-900/25 hover:text-red-600 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <span className="text-left font-medium">Eliminar</span>
                                  </button>
                                </div>,
                                document.body
                              )
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <form className="flex-shrink-0 border-t border-white/30 dark:border-white/10 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm px-6 py-5" onSubmit={handleSendMessage}>
                  {replyingTo && (
                    <div className="mb-3 flex items-start gap-3 rounded-2xl glass-liquid-strong p-3 border-l-4 border-sena-green/60">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply className="h-3.5 w-3.5 text-sena-green flex-shrink-0" />
                          <span className="text-xs font-semibold text-sena-green">
                            Respondiendo a {replyingTo.senderId === authUser?.id ? 'ti mismo' : getSenderName(replyingTo.senderId)}
                          </span>
                        </div>
                        {replyingTo.content && (
                          <p className="text-xs text-[var(--color-muted)] line-clamp-2">
                            {replyingTo.content}
                          </p>
                        )}
                        {replyingTo.attachmentUrl && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <Paperclip className="h-3 w-3 text-[var(--color-muted)]" />
                            <span className="text-xs text-[var(--color-muted)]">Archivo adjunto</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="flex h-6 w-6 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] hover:text-rose-500 transition-all duration-ui flex-shrink-0"
                        aria-label="Cancelar respuesta"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {attachment && (
                    <div className="mb-3 flex items-center gap-3 rounded-2xl glass-liquid-strong p-3">
                      {attachment.mimeType.startsWith('image/') ? (
                        <img
                          src={attachment.dataUrl}
                          alt="Vista previa"
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sena-green/20">
                          <File className="h-8 w-8 text-sena-green" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {(attachment.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        className="flex h-8 w-8 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] hover:text-rose-500 transition-all duration-ui"
                        aria-label="Eliminar adjunto"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf,.doc,.docx,.txt"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] transition-all duration-ui hover:text-sena-green hover:scale-110 hover:shadow-lg"
                        aria-label="Adjuntar archivo"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="relative">
                      <button
                        ref={emojiButtonRef}
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className={classNames(
                          "flex h-12 w-12 items-center justify-center rounded-2xl glass-liquid transition-all duration-ui hover:scale-110 hover:shadow-lg",
                          showEmojiPicker
                            ? "text-sena-green border-sena-green/50"
                            : "text-[var(--color-muted)] hover:text-sena-green"
                        )}
                        aria-label="Insertar emoji"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                      {showEmojiPicker &&
                        emojiPickerCoords &&
                        createPortal(
                          <div
                            className="fixed z-[100070] pointer-events-auto"
                            style={
                              emojiPickerPosition === 'bottom'
                                ? {
                                    top: emojiPickerCoords.top,
                                    left: emojiPickerCoords.left
                                  }
                                : {
                                    bottom: emojiPickerCoords.bottom,
                                    left: emojiPickerCoords.left
                                  }
                            }
                          >
                            <EmojiPicker
                              ref={emojiPickerRef}
                              compactBounds
                              maxHeightPx={
                                emojiPickerPosition === 'top' &&
                                emojiPickerCoords.maxHeight != null
                                  ? emojiPickerCoords.maxHeight
                                  : undefined
                              }
                              onEmojiSelect={handleEmojiSelect}
                              onClose={() => setShowEmojiPicker(false)}
                            />
                          </div>,
                          document.body
                        )}
                    </div>
                    <div className="chat-message-compose-glass flex-1 rounded-2xl glass-liquid px-5 py-3 transition-shadow duration-ui">
                      <textarea
                        rows={2}
                        placeholder="Escribe un mensaje..."
                        className="w-full resize-none bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] placeholder:text-xs"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (message.trim() || attachment) {
                              handleSendMessage(e as any);
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!message.trim() && !attachment}
                      loading={sendMessageMutation.isPending}
                      className="h-12 w-12 rounded-2xl px-0 bg-gradient-to-r from-sena-green to-emerald-600 hover:from-sena-green/90 hover:to-emerald-600/90 shadow-[0_4px_12px_rgba(57,169,0,0.3)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.4)] transition-all duration-ui hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center px-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sena-green/20 to-emerald-500/20 rounded-2xl blur-2xl"></div>
                  <MessageCirclePlus className="h-20 w-20 text-sena-green/60 relative z-10" />
                </div>
                <div className="space-y-2 max-w-md">
                  <p className="text-base font-semibold text-[var(--color-text)]">Selecciona una conversación</p>
                  <p className="text-sm text-[var(--color-muted)]">para comenzar a chatear.</p>
                  <p className="text-xs text-[var(--color-muted)] mt-3">Crea un nuevo chat para coordinar tus equipos y proyectos.</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowNewChatDialog(true)}
                  className="px-6 py-2.5 font-semibold shadow-[0_8px_20px_rgba(57,169,0,0.25)] hover:shadow-[0_12px_28px_rgba(57,169,0,0.35)] transition-all duration-ui hover:scale-105"
                >
                  <MessageCirclePlus className="h-4 w-4 mr-2" />
                  Crear mi primer chat
                </Button>
              </div>
            )}
          </div>
        </Card>
        </div>
      </div>

      {/* Panel lateral información del chat (estilo WhatsApp) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isChatInfoPanelOpen && activeChat && (
              <>
                <motion.div
                  key="chat-info-backdrop"
                  role="presentation"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={UI_OVERLAY_TRANSITION}
                  className="fixed inset-0 z-[10050] bg-black/45 backdrop-blur-[2px] dark:bg-black/55"
                  onClick={() => setIsChatInfoPanelOpen(false)}
                />
                <motion.aside
                  key="chat-info-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="chat-info-panel-title"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={UI_MOTION_SLIDE_TWEEN}
                  className="fixed right-0 top-0 z-[10051] flex h-full w-full max-w-[min(100vw,420px)] flex-col border-l border-neutral-200/80 bg-[#f0f2f5] shadow-[-12px_0_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1a1d21] dark:shadow-[-12px_0_48px_rgba(0,0,0,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200/90 bg-white/90 px-3 py-3.5 dark:border-white/10 dark:bg-[#1e2125]/95">
                    <button
                      type="button"
                      onClick={() => setIsChatInfoPanelOpen(false)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors duration-ui hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                      aria-label="Cerrar panel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2
                      id="chat-info-panel-title"
                      className="flex-1 text-center text-[15px] font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                      {activeChat.isGroup ? 'Info. del grupo' : 'Info. del contacto'}
                    </h2>
                    <span className="h-10 w-10 shrink-0" aria-hidden />
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
                    <div className="flex flex-col items-center text-center">
                      {activeChatAvatarUrl ? (
                        <img
                          src={resolveAssetUrl(activeChatAvatarUrl) ?? activeChatAvatarUrl}
                          alt=""
                          className="h-36 w-36 rounded-full object-cover shadow-md ring-2 ring-white/50 dark:ring-white/10"
                        />
                      ) : (
                        <span
                          className={classNames(
                            'flex h-36 w-36 items-center justify-center rounded-full text-4xl font-bold text-white shadow-md ring-2 ring-white/30',
                            activeChatGradient
                          )}
                        >
                          {activeChatInitials}
                        </span>
                      )}
                      <p className="mt-5 max-w-[280px] text-xl font-semibold leading-snug text-neutral-900 dark:text-white">
                        {activeChatName}
                      </p>
                      <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {(() => {
                          const peer = directChatFriendByChatId[activeChat.id];
                          if (!activeChat.isGroup && peer?.email) return peer.email;
                          if (activeChat.isGroup) return 'Chat grupal';
                          return 'Chat privado';
                        })()}
                      </p>
                    </div>

                    <p className="mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      Información
                    </p>
                    <div className="mt-2 divide-y divide-neutral-200/90 rounded-xl border border-neutral-200/80 bg-white/90 text-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#252a31]/90">
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-neutral-500 dark:text-neutral-400">Tipo</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                          {activeChat.isGroup ? (
                            <>
                              <UsersIcon className="h-4 w-4 text-sena-green" />
                              Grupo
                            </>
                          ) : (
                            <>
                              <UserIcon className="h-4 w-4 text-sena-green" />
                              Privado
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-neutral-500 dark:text-neutral-400">Creado</span>
                        <span className="text-right text-neutral-800 dark:text-neutral-200">
                          {new Date(activeChat.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {activeChat.lastMessageAt && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                          <span className="text-neutral-500 dark:text-neutral-400">Último mensaje</span>
                          <span className="text-neutral-800 dark:text-neutral-200">
                            {formatLastActivity(activeChat.lastMessageAt)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-neutral-500 dark:text-neutral-400">Mensajes</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{sortedMessages.length}</span>
                      </div>
                    </div>

                    {chatSharedMediaItems.length > 0 && (
                      <div className="mt-6">
                        <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white/90 px-3 py-3 dark:border-white/10 dark:bg-[#252a31]/90">
                          <span className="flex items-center gap-2.5 text-[15px] font-medium text-neutral-800 dark:text-neutral-100">
                            <Folder className="h-5 w-5 text-sena-green" />
                            Archivos, enlaces y documentos
                          </span>
                          <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                            {chatSharedMediaItems.length}
                          </span>
                        </div>
                        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {chatSharedMediaItems.map((item) => {
                            const tile = 'relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg border border-neutral-200/80 dark:border-white/10';
                            if (item.kind === 'image') {
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => window.open(item.src, '_blank', 'noopener,noreferrer')}
                                  className={classNames(tile, 'bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/50')}
                                  aria-label="Abrir imagen"
                                >
                                  <img src={item.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                                </button>
                              );
                            }
                            if (item.kind === 'video') {
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => window.open(item.src, '_blank', 'noopener,noreferrer')}
                                  className={classNames(tile, 'bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/50')}
                                  aria-label="Abrir video"
                                >
                                  <video
                                    src={item.src}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                    <Video className="h-7 w-7 text-white drop-shadow" />
                                  </div>
                                </button>
                              );
                            }
                            if (item.kind === 'file') {
                              return (
                                <a
                                  key={item.key}
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={classNames(
                                    tile,
                                    'flex flex-col items-center justify-center gap-0.5 bg-neutral-100 p-1 dark:bg-neutral-800'
                                  )}
                                >
                                  {item.isPdf ? (
                                    <FileText className="h-6 w-6 text-sena-green" />
                                  ) : (
                                    <File className="h-6 w-6 text-sena-green" />
                                  )}
                                  <span className="line-clamp-2 w-full px-0.5 text-center text-[9px] font-medium text-neutral-700 dark:text-neutral-300">
                                    {item.label}
                                  </span>
                                </a>
                              );
                            }
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                  setIsChatInfoPanelOpen(false);
                                  navigate('/dashboard', { state: { focusPostId: item.postId } });
                                }}
                                className={classNames(
                                  tile,
                                  'flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-sena-green/10 to-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/40'
                                )}
                              >
                                <Share2 className="h-6 w-6 text-sena-green" />
                                <span className="text-[9px] font-semibold text-neutral-800 dark:text-neutral-200">Post</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 divide-y divide-neutral-200/90 overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90 dark:divide-white/10 dark:border-white/10 dark:bg-[#252a31]/90">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChatInfoPanelOpen(false);
                          setShowStarredMessages(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-neutral-800 transition-colors duration-ui hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-white/5"
                      >
                        <Star className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
                        Mensajes destacados
                      </button>
                      {selectedChatId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (mutedChats.has(selectedChatId)) {
                              void handleMenuAction('unmute', selectedChatId);
                            } else {
                              void handleMenuAction('mute', selectedChatId);
                            }
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-neutral-800 transition-colors duration-ui hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-white/5"
                        >
                          <BellOff className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
                          {mutedChats.has(selectedChatId)
                            ? 'Activar notificaciones'
                            : 'Silenciar notificaciones'}
                        </button>
                      )}
                      {selectedChatId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (pinnedChats.has(selectedChatId)) {
                              void handleMenuAction('unpin', selectedChatId);
                            } else {
                              void handleMenuAction('pin', selectedChatId);
                            }
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-neutral-800 transition-colors duration-ui hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-white/5"
                        >
                          <Pin className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
                          {pinnedChats.has(selectedChatId) ? 'Desfijar chat' : 'Fijar chat'}
                        </button>
                      )}
                      {selectedChatId && (
                        <button
                          type="button"
                          onClick={() => {
                            const fav = favoriteChats.has(selectedChatId);
                            void handleMenuAction(fav ? 'unfavorite' : 'favorite', selectedChatId);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-neutral-800 transition-colors duration-ui hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-white/5"
                        >
                          <Star
                            className={classNames(
                              'h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400',
                              favoriteChats.has(selectedChatId) && 'fill-yellow-500 text-yellow-600 dark:text-yellow-400'
                            )}
                          />
                          {favoriteChats.has(selectedChatId) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Diálogo de Nuevo Chat/Grupo */}
      <GlassDialog
        open={showNewChatDialog}
        onClose={() => {
          setShowNewChatDialog(false);
          setNewChatType(null);
          reset(initialCreateChatValues);
          setSelectedFriendIds(new Set());
          setCreateChatError(null);
        }}
        size="md"
        contentClassName="glass-dialog-neutral"
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Crear nueva conversación</h3>
              <p className="text-sm text-[var(--color-muted)]">Selecciona el tipo de conversación que deseas crear</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewChatDialog(false);
                setNewChatType(null);
                reset(initialCreateChatValues);
                setSelectedFriendIds(new Set());
                setCreateChatError(null);
              }}
              className="self-start rounded-2xl px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-sena-green"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleNewChatTypeSelection('direct')}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/85 bg-slate-50/95 p-6 transition-all duration-ui hover:scale-[1.02] hover:border-sena-green/35 hover:shadow-md dark:border-white/12 dark:bg-neutral-800/55 dark:hover:border-sena-green/40"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20 group-hover:from-sena-green/30 group-hover:to-emerald-500/30 transition-all duration-ui">
                <UserIcon className="h-8 w-8 text-sena-green" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">Nuevo Chat</h4>
                <p className="text-xs text-[var(--color-muted)] mt-1">Conversación privada</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNewChatTypeSelection('group')}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/85 bg-slate-50/95 p-6 transition-all duration-ui hover:scale-[1.02] hover:border-sena-green/35 hover:shadow-md dark:border-white/12 dark:bg-neutral-800/55 dark:hover:border-sena-green/40"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20 group-hover:from-sena-green/30 group-hover:to-emerald-500/30 transition-all duration-ui">
                <UsersIcon className="h-8 w-8 text-sena-green" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">Nuevo Grupo</h4>
                <p className="text-xs text-[var(--color-muted)] mt-1">Conversación grupal</p>
              </div>
            </button>
          </div>

          {newChatType && (
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-neutral-800/35">
              <form onSubmit={handleCreateChat} className="space-y-4">
                {newChatType === 'group' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Nombre del grupo</label>
                    <input
                      type="text"
                      placeholder="Proyecto de innovación"
                      className="rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-all duration-ui focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/12 dark:bg-neutral-900/50"
                      {...register('name')}
                    />
                    {errors.name && <span className="text-[11px] text-rose-400">{errors.name.message}</span>}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[var(--color-text)]">
                    {newChatType === 'group' ? 'Selecciona amigos para el grupo' : 'Elige un amigo para chatear'}
                  </label>
                  {isLoadingFriends ? (
                    <p className="text-xs text-[var(--color-muted)]">Cargando amigos…</p>
                  ) : friends.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">
                      Aún no tienes amigos agregados. Envía solicitudes desde los perfiles públicos.
                    </p>
                  ) : (
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                      {friends.map((friend) => {
                        const isSelected = selectedFriendIds.has(friend.id);
                        const avatarUrl =
                          friend.avatarUrl ??
                          `https://avatars.dicebear.com/api/initials/${encodeURIComponent(
                            `${friend.firstName} ${friend.lastName}`
                          )}.svg`;
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => {
                              setSelectedFriendIds((prev) => {
                                const next = new Set(prev);
                                if (newChatType === 'direct') {
                                  next.clear();
                                  next.add(friend.id);
                                } else {
                                  if (next.has(friend.id)) {
                                    next.delete(friend.id);
                                  } else {
                                    next.add(friend.id);
                                  }
                                }
                                return next;
                              });
                              setCreateChatError(null);
                            }}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                              isSelected
                                ? 'border-sena-green/40 bg-sena-green/10'
                                : 'border-slate-200/70 bg-white/90 hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-800/50 dark:hover:bg-neutral-800/80'
                            }`}
                          >
                            <UserAvatar
                              firstName={friend.firstName}
                              lastName={friend.lastName}
                              avatarUrl={friend.avatarUrl}
                              size="sm"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[var(--color-text)]">
                                {friend.firstName} {friend.lastName}
                              </p>
                              {friend.headline && (
                                <p className="text-[11px] text-[var(--color-muted)] line-clamp-1">
                                  {friend.headline}
                                </p>
                              )}
                            </div>
                            <div
                              className={`h-4 w-4 rounded-2xl border ${
                                isSelected ? 'bg-sena-green border-sena-green' : 'border-[var(--color-muted)]'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {createChatError && (
                    <span className="text-[11px] text-rose-400">{createChatError}</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="px-3 text-xs"
                    onClick={() => {
                      reset(initialCreateChatValues);
                      setNewChatType(null);
                      setShowNewChatDialog(false);
                      setSelectedFriendIds(new Set());
                      setCreateChatError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="px-4 text-xs" loading={createChatMutation.isPending}>
                    Crear {newChatType === 'group' ? 'grupo' : 'chat'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </GlassDialog>

      {/* Diálogo de confirmación para eliminar mensaje */}
      <GlassDialog
        open={showDeleteMessageDialog}
        onClose={() => {
          if (isDeletingMessage) return;
          setShowDeleteMessageDialog(false);
          setMessageToDelete(null);
        }}
        size="sm"
        preventCloseOnBackdrop={isDeletingMessage}
        overlayClassName="delete-post-overlay-warning"
        contentClassName="glass-dialog-delete"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              Eliminar mensaje
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Esta acción no se puede deshacer. El mensaje se eliminará de este chat.
            </p>
            {messageToDelete?.content && (
              <div className="mt-3 rounded-2xl border border-white/25 bg-white/20 px-3 py-2 text-xs text-[var(--color-text)]">
                {messageToDelete.content.length > 140
                  ? `${messageToDelete.content.slice(0, 140)}...`
                  : messageToDelete.content}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (isDeletingMessage) return;
                setShowDeleteMessageDialog(false);
                setMessageToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="!bg-red-500 !text-white !border-red-500/60 !shadow-[0_2px_8px_rgba(0,0,0,0.14)] hover:!bg-red-600 hover:!shadow-[0_4px_14px_rgba(0,0,0,0.2)] focus:!ring-red-400/60"
              loading={isDeletingMessage}
              onClick={handleConfirmDeleteMessage}
            >
              Eliminar mensaje
            </Button>
          </div>
        </div>
      </GlassDialog>

      {/* Diálogo de confirmación para eliminar chat */}
      <GlassDialog
        open={showDeleteDialog}
        onClose={() => {
          if (deleteChatMutation.isPending) return;
          setShowDeleteDialog(false);
          setChatToDelete(null);
        }}
        size="sm"
        preventCloseOnBackdrop={deleteChatMutation.isPending}
        overlayClassName="delete-post-overlay-warning"
        contentClassName="glass-dialog-delete"
      >
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                ¿Eliminar conversación? 🗑️
              </h2>
              <p className="text-base leading-relaxed text-[var(--color-text)]">
                Esta acción no se puede deshacer. El historial de mensajes de este chat se eliminará solo para
                ti; las otras personas seguirán viendo sus mensajes.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setChatToDelete(null);
              }}
              disabled={deleteChatMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!chatToDelete) return;
                deleteChatMutation.mutate(chatToDelete, {
                  onSuccess: () => {
                    setShowDeleteDialog(false);
                    setChatToDelete(null);
                    toast.success('Chat eliminado correctamente', 1500);
                  }
                });
              }}
              loading={deleteChatMutation.isPending}
              disabled={deleteChatMutation.isPending}
              className="!bg-red-700 hover:!bg-red-800 !text-white focus:!ring-red-700/55 active:!bg-red-900 !shadow-[0_5px_16px_rgba(127,29,29,0.55)] hover:!shadow-[0_8px_24px_rgba(127,29,29,0.7)] active:!shadow-[0_3px_10px_rgba(127,29,29,0.5)] !border-red-500/45"
            >
              Sí, eliminar
            </Button>
          </div>
        </div>
      </GlassDialog>

      {/* Diálogo de Mensajes Destacados */}
      <GlassDialog
        open={showStarredMessages}
        onClose={() => setShowStarredMessages(false)}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                Mensajes destacados
              </h3>
              <p className="text-sm text-[var(--color-muted)]">Todos tus mensajes marcados con estrella</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowStarredMessages(false)}
              className="self-start rounded-2xl glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {(() => {
              const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '[]');
              if (starredMessages.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="h-12 w-12 mb-3 text-yellow-500/30" />
                    <p className="text-sm font-medium text-[var(--color-text)] mb-1">No hay mensajes destacados</p>
                    <p className="text-xs text-[var(--color-muted)]">Marca mensajes con estrella para encontrarlos fácilmente</p>
                  </div>
                );
              }

              // Obtener todos los mensajes de todos los chats y filtrar los destacados
              const allMessages: Message[] = [];
              chats.forEach(chat => {
                const chatMessages = allChatMessages.data?.[chat.id] || [];
                allMessages.push(...chatMessages.filter(msg => starredMessages.includes(msg.id)));
              });

              if (allMessages.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="h-12 w-12 mb-3 text-yellow-500/30" />
                    <p className="text-sm font-medium text-[var(--color-text)] mb-1">No se encontraron mensajes destacados</p>
                    <p className="text-xs text-[var(--color-muted)]">Los mensajes destacados aparecerán aquí</p>
                  </div>
                );
              }

              return allMessages.map((message) => {
                const chat = chats.find(c => c.id === message.chatId);
                const chatName = chat ? getChatDisplayName(chat) : 'Chat eliminado';
                const isOwnMessage = message.senderId === authUser?.id;

                return (
                  <div
                    key={message.id}
                    className="rounded-2xl glass-liquid p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-semibold text-[var(--color-text)]">{chatName}</span>
                      </div>
                      <span className="text-xs text-[var(--color-muted)]">
                        {new Date(message.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className={classNames(
                      "rounded-2xl p-3",
                      isOwnMessage ? "bg-sena-green/10 ml-auto max-w-[80%]" : "bg-white/10 max-w-[80%]"
                    )}>
                      {message.content && (
                        <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.attachmentUrl && (
                        <div className="mt-2 text-xs text-[var(--color-muted)]">
                          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sena-green hover:underline">
                            Ver adjunto
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </GlassDialog>

      {/* Diálogo de reenvío */}
      <GlassDialog
        open={isForwardDialogOpen}
        onClose={() => {
          setIsForwardDialogOpen(false);
          setForwardingMessage(null);
          setSelectedForwardChats(new Set());
        }}
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
                <Forward className="h-5 w-5 text-sena-green" />
                Reenviar mensaje
              </h3>
              <p className="text-sm text-[var(--color-muted)]">Selecciona los chats a los que quieres reenviar</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setIsForwardDialogOpen(false);
                setForwardingMessage(null);
                setSelectedForwardChats(new Set());
              }}
              className="self-start rounded-2xl glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Vista previa del mensaje a reenviar */}
          {forwardingMessage && (
            <div className="rounded-2xl glass-liquid-strong p-4 border-l-4 border-sena-green/60">
              {forwardingMessage.content && (
                <p className="text-sm text-[var(--color-text)] line-clamp-3 mb-2">
                  {forwardingMessage.content}
                </p>
              )}
              {forwardingMessage.attachmentUrl && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Archivo adjunto</span>
                </div>
              )}
            </div>
          )}

          {/* Lista de chats disponibles */}
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageCirclePlus className="h-10 w-10 mb-2 text-[var(--color-muted)]/30" />
                <p className="text-sm text-[var(--color-muted)]">No hay chats disponibles</p>
              </div>
            ) : (
              filteredChats
                .filter(chat => chat.id !== selectedChatId) // Excluir el chat actual
                .map((chat) => {
                  const isSelected = selectedForwardChats.has(chat.id);
                  const chatLabel = getChatDisplayName(chat);
                  const initials = getInitialsFromLabel(chatLabel);
                  const gradient = getAvatarGradient(chat.id);

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        setSelectedForwardChats((prev) => {
                          const next = new Set(prev);
                          if (next.has(chat.id)) {
                            next.delete(chat.id);
                          } else {
                            next.add(chat.id);
                          }
                          return next;
                        });
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        isSelected
                          ? 'bg-sena-green/10 border border-sena-green/40'
                          : 'glass-liquid hover:bg-white/40'
                      }`}
                    >
                      <span
                        className={classNames(
                          'flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm',
                          gradient
                        )}
                      >
                        {initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                          {chatLabel}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {chat.isGroup ? 'Chat grupal' : 'Chat privado'}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-2xl border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-sena-green border-sena-green'
                            : 'border-[var(--color-muted)]'
                        }`}
                      >
                        {isSelected && <CheckCheck className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/30 dark:border-white/10">
            <Button
              variant="ghost"
              onClick={() => {
                setIsForwardDialogOpen(false);
                setForwardingMessage(null);
                setSelectedForwardChats(new Set());
              }}
              className="px-4"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!forwardingMessage || selectedForwardChats.size === 0) {
                  toast.warning('Selecciona al menos un chat para reenviar');
                  return;
                }

                try {
                  // Reenviar el mensaje a cada chat seleccionado
                  for (const chatId of selectedForwardChats) {
                    await chatService.sendMessage(chatId, {
                      content: forwardingMessage.content || undefined,
                      attachmentUrl: forwardingMessage.attachmentUrl
                    });
                  }

                  toast.success(`Mensaje reenviado a ${selectedForwardChats.size} ${selectedForwardChats.size === 1 ? 'chat' : 'chats'}`);
                  queryClient.invalidateQueries({ queryKey: ['chats'] }).catch(() => { });
                  setIsForwardDialogOpen(false);
                  setForwardingMessage(null);
                  setSelectedForwardChats(new Set());
                } catch (error) {
                  toast.error('Error al reenviar el mensaje');
                }
              }}
              disabled={selectedForwardChats.size === 0}
              className="px-6"
            >
              <Forward className="h-4 w-4 mr-2" />
              Reenviar ({selectedForwardChats.size})
            </Button>
          </div>
        </div>
      </GlassDialog>

    </DashboardLayout>
  );
};
