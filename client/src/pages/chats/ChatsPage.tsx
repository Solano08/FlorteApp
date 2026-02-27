import { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users,
  File,
  Image,
  FileText,
  Download,
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
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { resolveAssetUrl } from '../../utils/media';
import { Message } from '../../types/chat';
import type { Profile } from '../../types/profile';

type ChatFilter = 'all' | 'unread' | 'favorites' | 'groups' | 'archived';

const filterTabs: Array<{ value: ChatFilter; label: string; icon?: typeof Star | typeof Archive }> = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'No leidos' },
  { value: 'favorites', label: 'Favoritos', icon: Star },
  { value: 'groups', label: 'Grupos' }
];

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
  'from-sena-green/90 to-emerald-400/80',
  'from-blue-500/90 to-cyan-400/80',
  'from-amber-500/90 to-orange-400/80',
  'from-purple-500/90 to-indigo-400/80'
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content?: string; senderId: string; attachmentUrl?: string } | null>(null);
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<{ id: string; content?: string; attachmentUrl?: string } | null>(null);
  const [selectedForwardChats, setSelectedForwardChats] = useState<Set<string>>(new Set());
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { mode: theme } = useTheme();
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

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [moreMenuPosition, setMoreMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [createChatError, setCreateChatError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

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

  // Scroll automático a los últimos mensajes cuando se cargan o cambian
  const previousChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    const chatChanged = previousChatIdRef.current !== selectedChatId;
    previousChatIdRef.current = selectedChatId;
    
    if (messageListRef.current) {
      const container = messageListRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      
      // Hacer scroll automático si:
      // 1. Cambió el chat (siempre mostrar últimos mensajes al entrar)
      // 2. El usuario está cerca del final (dentro de 150px)
      // 3. O si estamos cargando mensajes por primera vez
      if (chatChanged || isNearBottom || isFetchingMessages) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          });
        });
      }
    }
  }, [sortedMessages.length, selectedChatId, isFetchingMessages]);

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

  // Función helper para obtener el nombre del chat, incluyendo el nombre del usuario en chats directos
  const getChatDisplayName = useMemo(() => {
    return (chat: { id: string; name?: string | null; isGroup: boolean; createdBy: string }) => {
      // Si el chat tiene nombre, usarlo
      if (chat.name?.trim() && chat.name.trim().length > 0) {
        return chat.name.trim();
      }
      
      // Si es un grupo sin nombre
      if (chat.isGroup) {
        return 'Grupo sin titulo';
      }
      
      // Para chats directos, intentar obtener el nombre del otro usuario
      // Buscar en los mensajes del chat para encontrar el senderId del otro usuario
      const chatMessages = allChatMessages.data?.[chat.id] || [];
      if (chatMessages.length > 0) {
        const otherUserMessage = chatMessages.find((msg) => msg.senderId !== authUser?.id);
        if (otherUserMessage) {
          const otherUser = friends.find((f) => f.id === otherUserMessage.senderId);
          if (otherUser) {
            return `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.firstName || 'Usuario';
          }
        }
      }
      
      // Si no encontramos en mensajes, intentar con createdBy
      if (chat.createdBy !== authUser?.id) {
        const otherUser = friends.find((f) => f.id === chat.createdBy);
        if (otherUser) {
          return `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.firstName || 'Usuario';
        }
      }
      
      // Fallback
      return 'Chat privado';
    };
  }, [friends, authUser?.id, allChatMessages.data]);

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

  // Calcular posición del emoji picker para evitar cortes
  useEffect(() => {
    if (!showEmojiPicker || !emojiButtonRef.current) {
      setEmojiPickerCoords(null);
      return;
    }

    const calculatePosition = () => {
      if (!emojiButtonRef.current) return;

      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      const pickerHeight = Math.min(320, window.innerHeight - 32); // altura del emoji picker con margen mínimo
      const spaceAbove = buttonRect.top;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const requiredSpace = pickerHeight + 16; // altura + margen

      // Si hay más espacio abajo o no hay suficiente espacio arriba, mostrar abajo
      if (spaceBelow > spaceAbove || spaceAbove < requiredSpace) {
        setEmojiPickerPosition('bottom');
        setEmojiPickerCoords({
          top: buttonRect.bottom + 8,
          left: buttonRect.left
        });
      } else {
        setEmojiPickerPosition('top');
        setEmojiPickerCoords({
          bottom: window.innerHeight - buttonRect.top + 8,
          left: buttonRect.left,
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
        const menuWidth = 200;
        const menuHeight = 350; // Altura aproximada del menú
        const padding = 12;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calcular posición: mostrar a la izquierda del botón (para mensajes propios)
        let x = buttonRect.left - menuWidth - padding;
        let y = buttonRect.top;

        // Si no hay espacio a la izquierda, mostrar a la derecha del botón
        const spaceOnLeft = buttonRect.left;
        const spaceOnRight = viewportWidth - buttonRect.right;

        if (spaceOnLeft < menuWidth + padding && spaceOnRight > menuWidth + padding) {
          x = buttonRect.right + padding;
        }

        // Si tampoco cabe a la derecha, centrar horizontalmente
        if (x + menuWidth > viewportWidth - padding) {
          x = Math.max(padding, viewportWidth - menuWidth - padding);
        }

        // Asegurar que el menú no se salga por la izquierda
        if (x < padding) {
          x = padding;
        }

        // Ajustar verticalmente: alinear el menú con el botón
        // Si el menú se sale por abajo, mostrarlo arriba del botón
        if (y + menuHeight > viewportHeight - padding) {
          y = buttonRect.bottom - menuHeight;
        }

        // Si aún no cabe arriba, ajustar desde el centro del botón
        if (y < padding) {
          y = buttonRect.top + (buttonRect.height / 2) - (menuHeight / 2);
        }

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
            setSuccessMessage('Texto copiado al portapapeles');
            setTimeout(() => setSuccessMessage(null), 1500);
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
            setSuccessMessage('Descarga iniciada');
          setTimeout(() => setSuccessMessage(null), 1500);
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
          setSuccessMessage('Mensaje fijado');
          setTimeout(() => setSuccessMessage(null), 1500);
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
          setSuccessMessage('Mensaje destacado');
          setTimeout(() => setSuccessMessage(null), 1500);
        } else {
          const index = starredMessages.indexOf(message.id);
          starredMessages.splice(index, 1);
          localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
          setSuccessMessage('Mensaje desmarcado');
          setTimeout(() => setSuccessMessage(null), 1500);
        }
        break;
      case 'delete':
        if (selectedChatId && window.confirm('¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.')) {
          try {
            await chatService.deleteMessage(selectedChatId, message.id);
            await queryClient.invalidateQueries({ queryKey: ['chats', selectedChatId, 'messages'] });
            setSuccessMessage('Mensaje eliminado');
            setTimeout(() => setSuccessMessage(null), 1500);
          } catch (err) {
            toast.error('No se pudo eliminar el mensaje');
          }
        }
        break;
      default:
        // Acción no implementada - no mostrar nada
    }
  };

  const activeChatName = activeChat ? getChatDisplayName(activeChat) : '';
  const activeChatInitials = activeChat ? getInitialsFromLabel(activeChatName) : '';
  const activeChatGradient = activeChat ? getAvatarGradient(activeChat.id) : '';
  const activeChatLastActivity = activeChat
    ? formatLastActivity(activeChat.lastMessageAt ?? activeChat.createdAt)
    : '';

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

  // Cerrar menú contextual (más opciones) al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMoreMenuOpen) {
        if (
          moreMenuRef.current &&
          !moreMenuRef.current.contains(event.target as Node) &&
          moreMenuButtonRef.current &&
          !moreMenuButtonRef.current.contains(event.target as Node)
        ) {
          setIsMoreMenuOpen(false);
          setMoreMenuPosition(null);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMoreMenuOpen) {
        setIsMoreMenuOpen(false);
        setMoreMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
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
        setSuccessMessage('Chat archivado');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      case 'unarchive':
        setArchivedChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('archivedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Chat desarchivado');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      case 'mute':
        setMutedChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('mutedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Notificaciones silenciadas para este chat');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      case 'unmute':
        setMutedChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('mutedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Notificaciones activadas para este chat');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      case 'pin':
        setPinnedChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('pinnedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Chat fijado arriba');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      case 'unpin':
        setPinnedChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('pinnedChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Chat desfijado');
        setTimeout(() => setSuccessMessage(null), 1500);
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
        setSuccessMessage('Chat marcado como leído');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      }
      case 'favorite':
        setFavoriteChats((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          localStorage.setItem('favoriteChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Chat añadido a favoritos');
        setTimeout(() => setSuccessMessage(null), 1500);
        break;
      case 'unfavorite':
        setFavoriteChats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          localStorage.setItem('favoriteChats', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setSuccessMessage('Chat quitado de favoritos');
        setTimeout(() => setSuccessMessage(null), 1500);
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
              setSuccessMessage('Usuario bloqueado correctamente');
              setTimeout(() => setSuccessMessage(null), 1500);
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
      <div className="grid h-full grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] gap-0 min-h-0">
        <Card
          padded={false}
          className="relative flex h-full flex-col overflow-hidden rounded-none border-r border-white/30 dark:border-white/10 bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.05)] dark:shadow-[0_0_60px_rgba(0,0,0,0.3)] min-h-0"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(57,169,0,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(57,169,0,0.15),_transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />

          <div className="relative z-10 flex h-full flex-col overflow-hidden min-h-0">
            <header className="flex items-center justify-between gap-3 border-b border-white/30 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)] bg-gradient-to-r from-sena-green to-emerald-600 bg-clip-text text-transparent">
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
                    onClick={(e) => {
                      if (moreMenuButtonRef.current) {
                        const rect = moreMenuButtonRef.current.getBoundingClientRect();
                        setMoreMenuPosition({ x: rect.left, y: rect.bottom + 8 });
                        setIsMoreMenuOpen((prev) => !prev);
                      }
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-xl font-medium transition-all bg-white/10 text-slate-700 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-sena-green"
                    aria-label="Mas opciones"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {isMoreMenuOpen && moreMenuPosition && (
                    createPortal(
                      <div
                        ref={moreMenuRef}
                        className="fixed w-[220px] rounded-[24px] glass-liquid py-2 z-[999999] relative"
                      style={{
                        left: `${moreMenuPosition.x}px`,
                        top: `${moreMenuPosition.y}px`,
                        position: 'fixed',
                        pointerEvents: 'auto',
                      }}
                    >
                      {/* Efectos visuales glass liquid */}
                      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_60%)] opacity-50 dark:opacity-15 mix-blend-overlay" />
                      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.15),_transparent_60%)] opacity-40 dark:opacity-8 mix-blend-overlay" />
                      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/8 via-transparent to-white/3 dark:from-white/3 dark:to-transparent opacity-40" />
                      <div className="relative z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setShowStarredMessages(true);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                        >
                          <Star className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                          <span className="text-left font-medium">Mensajes destacados</span>
                        </button>
                        <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsSelectionMode(true);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                        >
                          <CheckSquare2 className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                          <span className="text-left font-medium">Seleccionar chats</span>
                        </button>
                        <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            // Marcar todos los chats como leídos
                            const allChatIds = chats.map(chat => chat.id);
                            setReadChats(new Set(allChatIds));
                            const now = new Date().toISOString();
                            const allReadTimes: Record<string, string> = {};
                            allChatIds.forEach(chatId => {
                              allReadTimes[chatId] = now;
                            });
                            setLastReadTimes(prev => {
                              const updated = { ...prev, ...allReadTimes };
                              localStorage.setItem('chatLastReadTimes', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                        >
                          <CheckCheck className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                          <span className="text-left font-medium">Marcar todos como leído</span>
                        </button>
                      </div>
                    </div>,
                    document.body
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatDialog(true)}
                  aria-label="Nuevo chat"
                  className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-xl font-medium transition-all bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-sena-green"
                >
                  <MessageCirclePlus className="h-4 w-4 text-sena-green" />
                </button>
              </div>
            </header>

            <div className="space-y-4 border-b border-white/20 dark:border-white/10 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm px-6 py-5">
              <div className="flex items-center gap-3 rounded-2xl glass-liquid px-4 py-3 transition-all duration-200 focus-within:border-sena-green/50 focus-within:ring-2 focus-within:ring-sena-green/20 focus-within:shadow-[0_0_0_4px_rgba(57,169,0,0.1)] hover:shadow-lg">
                <Search className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar un chat o iniciar uno nuevo"
                  className="flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] placeholder:text-xs"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm p-1.5 text-xs text-[var(--color-muted)]">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveFilter(tab.value)}
                      className={classNames(
                        'flex-1 rounded-xl px-3 py-2 transition-all duration-200 font-medium',
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
                              'rounded-full px-2 py-0.5 text-[10px] font-bold transition-all',
                              activeFilter === tab.value
                                ? 'bg-white/30 text-white'
                                : 'bg-white/30 dark:bg-slate-600/30 text-[var(--color-muted)]'
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
                    'inline-flex items-center gap-2 rounded-xl bg-white/40 dark:bg-slate-700/40 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)] shadow-sm transition hover:bg-white/70 dark:hover:bg-slate-700/70',
                    activeFilter === 'archived' && 'ring-2 ring-sena-green/40 bg-white dark:bg-slate-800'
                  )}
                >
                  <Archive className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                  <span>Archivados ({tabStats.archived})</span>
                </button>
              </div>
            )}

            {isSelectionMode && selectedChats.size > 0 && (
              <div className="border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm px-6 py-3">
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

            <div className="flex-1 overflow-y-auto overflow-x-visible px-5 py-4 hide-scrollbar" style={{ position: 'relative', zIndex: 1 }}>
              {isLoadingChats ? (
                <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-sena-green/20 border-t-sena-green"></div>
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
                    const hasUnread = !chat.lastMessageAt;
                    const unreadCount = unreadCounts[chat.id] || (hasUnread ? 1 : 0);
                    const isPinned = pinnedChats.has(chat.id);
                    const isMuted = mutedChats.has(chat.id);
                    const isFavorite = favoriteChats.has(chat.id);

                    const isSelected = selectedChats.has(chat.id);

                    return (
                      <li key={chat.id} className="relative" style={{ zIndex: 1 }}>
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
                              'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 cursor-pointer',
                              isSelected
                                ? 'bg-gradient-to-r from-sena-green/20 via-emerald-500/15 to-sena-green/20 text-sena-green shadow-[0_8px_32px_rgba(57,169,0,0.25)] border-2 border-sena-green/40 scale-[1.01] backdrop-blur-sm'
                                : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-slate-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                            )}
                          >
                            <div className={classNames(
                              'flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all flex-shrink-0',
                              isSelected
                                ? 'bg-sena-green border-sena-green text-white'
                                : 'border-slate-400/50 text-transparent hover:border-sena-green/50'
                            )}>
                              {isSelected && <CheckCheck className="h-4 w-4" />}
                            </div>
                            <span className="relative inline-flex flex-shrink-0">
                              <span
                                className={classNames(
                                  'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-200',
                                  gradient,
                                  isSelected && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                )}
                              >
                                {initials}
                              </span>
                              {!chat.isGroup && (
                                <span
                                  className={classNames(
                                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 transition-all duration-200',
                                    hasUnread
                                      ? 'bg-gradient-to-br from-sena-green to-emerald-500 shadow-[0_2px_8px_rgba(57,169,0,0.5)]'
                                      : 'bg-transparent'
                                  )}
                                />
                              )}
                              {isPinned && (
                                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-sena-green text-white shadow-lg">
                                  <Pin className="h-3 w-3" />
                                </span>
                              )}
                              {isMuted && (
                                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-white">
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
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
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
                              'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200',
                              isActive
                                ? 'bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 text-[var(--color-text)] shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/60 dark:border-slate-700/50 ring-1 ring-white/40 dark:ring-slate-600/30 ring-offset-1 ring-offset-white/50 dark:ring-offset-slate-900/50 scale-[1.005] backdrop-blur-sm'
                                : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-slate-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                            )}
                          >
                            <span className="relative inline-flex flex-shrink-0">
                              <span
                                className={classNames(
                                  'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-200',
                                  gradient,
                                  isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                )}
                              >
                                {initials}
                              </span>
                              {!chat.isGroup && (
                                <span
                                  className={classNames(
                                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 transition-all duration-200',
                                    hasUnread
                                      ? 'bg-gradient-to-br from-sena-green to-emerald-500 shadow-[0_2px_8px_rgba(57,169,0,0.5)]'
                                      : 'bg-transparent'
                                  )}
                                />
                              )}
                              {isPinned && (
                                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-sena-green text-white shadow-lg">
                                  <Pin className="h-3 w-3" />
                                </span>
                              )}
                              {isMuted && (
                                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-white">
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
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
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
                                'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0',
                                openMenuId === chat.id
                                  ? 'opacity-100 bg-sena-green/20 dark:bg-sena-green/30 text-sena-green shadow-md rotate-180'
                                  : 'opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:bg-white/20 dark:hover:bg-slate-700/20 hover:text-sena-green'
                              )}
                              aria-label="Opciones del chat"
                            >
                              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                            </button>
                          </button>
                        )}

                        {!isSelectionMode && openMenuId === chat.id && menuPosition && (
                          createPortal(
                            <div
                              ref={(el) => {
                                menuRefs.current[chat.id] = el;
                              }}
                              className="fixed w-[220px] rounded-[24px] glass-liquid py-2 relative"
                              style={{
                                left: `${menuPosition.x}px`,
                                top: `${menuPosition.y}px`,
                                position: 'fixed',
                                zIndex: 999999,
                                pointerEvents: 'auto',
                                isolation: 'isolate',
                              }}
                            >
                            {/* Efectos visuales glass liquid */}
                            <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_60%)] opacity-50 dark:opacity-15 mix-blend-overlay" />
                            <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.15),_transparent_60%)] opacity-40 dark:opacity-8 mix-blend-overlay" />
                            <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/8 via-transparent to-white/3 dark:from-white/3 dark:to-transparent opacity-40" />
                            <div className="relative z-10">
                              {!archivedChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('archive', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <Archive className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Archivar chat</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unarchive', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <Archive className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Desarchivar chat</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!mutedChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('mute', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <BellOff className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Silenciar notificaciones</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unmute', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <BellOff className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Activar notificaciones</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!pinnedChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('pin', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <Pin className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Fijar chat</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unpin', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <Pin className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Desfijar chat</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              <button
                                type="button"
                                onClick={() => handleMenuAction('markRead', chat.id)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-sena-green transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                              >
                                <CheckSquare2 className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                <span className="text-left font-medium">Marcar como leído</span>
                              </button>
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              {!favoriteChats.has(chat.id) ? (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('favorite', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-amber-500 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl mx-2"
                                >
                                  <Star className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Añadir a Favoritos</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMenuAction('unfavorite', chat.id)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-amber-500 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl mx-2"
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
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] hover:text-red-500 transition-colors hover:bg-white/20 dark:hover:bg-white/10 rounded-xl mx-2"
                                >
                                  <Ban className="h-4 w-4 text-[var(--color-muted)] flex-shrink-0" />
                                  <span className="text-left font-medium">Bloquear</span>
                                </button>
                              )}
                              <div className="my-1 h-px bg-white/20 dark:bg-white/10 mx-2" />
                              <button
                                type="button"
                                onClick={() => handleMenuAction('delete', chat.id)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors hover:bg-red-900/30 dark:hover:bg-red-900/40"
                              >
                                <Trash2 className="h-4 w-4 flex-shrink-0" />
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

                        {/* Sección de chats archivados - similar a WhatsApp */}
                        {activeFilter === 'all' && archivedChatsList.length > 0 && (
                          <>
                            <li className="sticky top-0 z-10 mt-4 mb-2">
                              <div className="flex items-center gap-2 px-4 py-2">
                                <Archive className="h-4 w-4 text-[var(--color-muted)]" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                  Archivados
                                </h3>
                                <div className="flex-1 h-px bg-white/20 dark:bg-white/10"></div>
                                <button
                                  type="button"
                                  onClick={() => setActiveFilter('archived')}
                                  className="text-xs font-medium text-[var(--color-muted)] hover:text-sena-green transition-colors"
                                >
                                  Ver todos
                                </button>
                              </div>
                            </li>
                            {archivedChatsList.slice(0, 3).map((chat) => {
                              const isActive = chat.id === selectedChatId;
                              const lastActivity = formatLastActivity(chat.lastMessageAt ?? chat.createdAt);
                              const chatLabel = getChatDisplayName(chat);
                              const initials = getInitialsFromLabel(chatLabel);
                              const gradient = getAvatarGradient(chat.id);
                              const hasUnread = !chat.lastMessageAt;
                              const unreadCount = unreadCounts[chat.id] || (hasUnread ? 1 : 0);
                              const isPinned = pinnedChats.has(chat.id);
                              const isMuted = mutedChats.has(chat.id);
                              const isFavorite = favoriteChats.has(chat.id);

                              return (
                                <li key={chat.id} className="relative" style={{ zIndex: 1 }}>
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
                                      'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200',
                              isActive
                                ? 'bg-gradient-to-r from-sena-green/10 via-emerald-500/8 to-sena-green/10 text-[var(--color-text)] shadow-[0_10px_30px_rgba(15,23,42,0.18)] border border-sena-green/35 ring-1 ring-sena-green/45 ring-offset-2 ring-offset-white/80 dark:ring-offset-slate-900/80 scale-[1.01] backdrop-blur-sm'
                                        : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-slate-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                                    )}
                                  >
                                    <span className="relative inline-flex flex-shrink-0">
                                      <span
                                        className={classNames(
                                          'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-200',
                                          gradient,
                                          isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                        )}
                                      >
                                        {initials}
                                      </span>
                                      {isPinned && (
                                        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-sena-green text-white shadow-lg">
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
                                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
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
                                        'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0',
                                        openMenuId === chat.id
                                          ? 'opacity-100 bg-sena-green/20 dark:bg-sena-green/30 text-sena-green shadow-md rotate-180'
                                          : 'opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:bg-white/20 dark:hover:bg-slate-700/20 hover:text-sena-green'
                                      )}
                                      aria-label="Opciones del chat"
                                    >
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    </button>
                                  </button>

                                  {openMenuId === chat.id && menuPosition && (
                                    createPortal(
                                      <div
                                        ref={(el) => {
                                          menuRefs.current[chat.id] = el;
                                        }}
                                        className="fixed w-[220px] rounded-2xl bg-slate-800/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 dark:border-slate-600/30 shadow-[0_12px_40px_rgba(0,0,0,0.4)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2"
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
                                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                        >
                                          <Archive className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                          <span className="text-left font-medium">Desarchivar chat</span>
                                        </button>
                                        {!mutedChats.has(chat.id) ? (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('mute', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <BellOff className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Silenciar notificaciones</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('unmute', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <BellOff className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Activar notificaciones</span>
                                          </button>
                                        )}
                                        {!pinnedChats.has(chat.id) ? (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('pin', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <Pin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Fijar chat</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('unpin', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <Pin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Desfijar chat</span>
                                          </button>
                                        )}
                                        <div className="my-1 h-px bg-slate-700/50 dark:bg-slate-600/50 mx-2" />
                                        <button
                                          type="button"
                                          onClick={() => handleMenuAction('delete', chat.id)}
                                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors hover:bg-red-900/30 dark:hover:bg-red-900/40"
                                        >
                                          <Trash2 className="h-4 w-4 flex-shrink-0" />
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
                              const hasUnread = !chat.lastMessageAt;
                              const unreadCount = unreadCounts[chat.id] || (hasUnread ? 1 : 0);
                              const isPinned = pinnedChats.has(chat.id);
                              const isMuted = mutedChats.has(chat.id);
                              const isFavorite = favoriteChats.has(chat.id);

                              return (
                                <li key={chat.id} className="relative" style={{ zIndex: 1 }}>
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
                                      'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200',
                                      isActive
                                        ? 'bg-gradient-to-r from-sena-green/10 via-emerald-500/8 to-sena-green/10 text-[var(--color-text)] shadow-[0_10px_30px_rgba(15,23,42,0.18)] border border-sena-green/35 ring-1 ring-sena-green/45 ring-offset-2 ring-offset-white/80 dark:ring-offset-slate-900/80 scale-[1.01] backdrop-blur-sm'
                                        : 'text-[var(--color-text)] hover:bg-white/30 dark:hover:bg-slate-700/30 hover:shadow-md hover:scale-[1.01] border border-transparent'
                                    )}
                                  >
                                    <span className="relative inline-flex flex-shrink-0">
                                      <span
                                        className={classNames(
                                          'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform duration-200',
                                          gradient,
                                          isActive && 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.2)]'
                                        )}
                                      >
                                        {initials}
                                      </span>
                                      {isPinned && (
                                        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-sena-green text-white shadow-lg">
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
                                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-sena-green to-emerald-500 text-white text-[10px] font-bold shadow-[0_2px_8px_rgba(57,169,0,0.4)]">
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
                                        'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0',
                                        openMenuId === chat.id
                                          ? 'opacity-100 bg-sena-green/20 dark:bg-sena-green/30 text-sena-green shadow-md rotate-180'
                                          : 'opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:bg-white/20 dark:hover:bg-slate-700/20 hover:text-sena-green'
                                      )}
                                      aria-label="Opciones del chat"
                                    >
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    </button>
                                  </button>

                                  {openMenuId === chat.id && menuPosition && (
                                    createPortal(
                                      <div
                                        ref={(el) => {
                                          menuRefs.current[chat.id] = el;
                                        }}
                                        className="fixed w-[220px] rounded-2xl bg-slate-800/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 dark:border-slate-600/30 shadow-[0_12px_40px_rgba(0,0,0,0.4)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2"
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
                                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                        >
                                          <Archive className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                          <span className="text-left font-medium">Desarchivar chat</span>
                                        </button>
                                        {!mutedChats.has(chat.id) ? (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('mute', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <BellOff className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Silenciar notificaciones</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('unmute', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <BellOff className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Activar notificaciones</span>
                                          </button>
                                        )}
                                        {!pinnedChats.has(chat.id) ? (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('pin', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <Pin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Fijar chat</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleMenuAction('unpin', chat.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                          >
                                            <Pin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-left font-medium">Desfijar chat</span>
                                          </button>
                                        )}
                                        <div className="my-1 h-px bg-slate-700/50 dark:bg-slate-600/50 mx-2" />
                                        <button
                                          type="button"
                                          onClick={() => handleMenuAction('delete', chat.id)}
                                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors hover:bg-red-900/30 dark:hover:bg-red-900/40"
                                        >
                                          <Trash2 className="h-4 w-4 flex-shrink-0" />
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
          className="relative flex h-full flex-col overflow-hidden rounded-none bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-800/50 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.05)] dark:shadow-[0_0_60px_rgba(0,0,0,0.3)] min-h-0"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(57,169,0,0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(57,169,0,0.15),_transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-white/15 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />

          <div className="relative z-10 flex h-full flex-col min-h-0">
            {activeChat ? (
              <>
                <header className="flex-shrink-0 flex items-center justify-between gap-4 border-b border-white/30 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span
                      className={classNames(
                        'flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:scale-110',
                        activeChatGradient
                      )}
                    >
                      {activeChatInitials}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-text)] bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        {activeChatName}
                      </h3>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5 font-medium">
                        {activeChat.isGroup ? 'Chat grupal' : 'Chat privado'} • {activeChatLastActivity}
                      </p>
                    </div>
                  </div>
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
                      className={classNames(
                        "inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-xl font-medium transition-all backdrop-blur-md border shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20",
                        selectedChatId && favoriteChats.has(selectedChatId)
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500/40 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20"
                          : "bg-white/10 text-[var(--color-muted)] border-white/20 hover:bg-white/20 hover:border-white/40 hover:text-sena-green dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-sena-green"
                      )}
                      aria-label="Marcar como favorito"
                    >
                      <Star className={classNames("h-4 w-4 text-sena-green", selectedChatId && favoriteChats.has(selectedChatId) && "!text-yellow-500 !fill-yellow-500")} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-xl font-medium transition-all bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-sena-green"
                      aria-label="Llamada de voz"
                    >
                      <Phone className="h-4 w-4 text-sena-green" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-xl font-medium transition-all bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-sena-green"
                      aria-label="Videollamada"
                    >
                      <Video className="h-4 w-4 text-sena-green" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInfoModalOpen(true)}
                      className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-xl font-medium transition-all bg-white/10 text-[var(--color-muted)] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/40 hover:text-sena-green hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-sena-green"
                      aria-label="Detalles del chat"
                    >
                      <Info className="h-4 w-4 text-sena-green" />
                    </button>
                  </div>
                </header>

                <div ref={messageListRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-6 hide-scrollbar bg-gradient-to-b from-transparent via-transparent to-white/20 dark:to-slate-800/20">
                  <div className="mx-auto flex max-w-3xl flex-col gap-4">
                    <div className="flex flex-col items-center gap-4 rounded-3xl glass-liquid-strong px-8 py-8 text-center border border-white/30 dark:border-white/10 shadow-xl">
                      <span
                        className={classNames(
                          'flex h-24 w-24 items-center justify-center rounded-3xl text-3xl font-bold text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-110',
                          activeChatGradient
                        )}
                      >
                        {activeChatInitials}
                      </span>
                      <div>
                        <p className="text-base font-bold text-[var(--color-text)] mb-1">{activeChatName}</p>
                        <p className="text-xs text-[var(--color-muted)] font-medium">Activo(a) {activeChatLastActivity}</p>
                      </div>
                      <p className="max-w-xl text-xs text-[var(--color-muted)] leading-relaxed">
                        Los mensajes y las llamadas están protegidos con cifrado de extremo a extremo. Solo las personas
                        de este chat pueden leerlos o compartirlos.
                      </p>
                    </div>
                    {isFetchingMessages ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-3 border-sena-green/20 border-t-sena-green"></div>
                        <p className="text-xs text-[var(--color-muted)]">Cargando mensajes...</p>
                      </div>
                    ) : sortedMessages.length === 0 ? (
                      <div className="rounded-3xl border-2 border-dashed border-sena-green/20 bg-gradient-to-br from-sena-green/5 to-transparent px-8 py-12 text-center">
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
                                className="flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
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
                                'max-w-[75%] rounded-2xl px-5 py-3.5 text-sm shadow-lg transition-all duration-200 relative',
                                isOwn
                                  ? 'bg-gradient-to-br from-sena-green to-emerald-600 text-white shadow-[0_8px_24px_rgba(57,169,0,0.3)]'
                                  : 'bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm text-[var(--color-text)] border border-white/50 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.1)]'
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
                                    'absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 z-20',
                                    openMessageMenuId === entry.id
                                      ? 'opacity-100 bg-white/30 dark:bg-slate-700/50 text-white shadow-lg scale-110'
                                      : 'opacity-0 group-hover:opacity-100 bg-white/20 dark:bg-slate-700/30 text-white/90 hover:bg-white/30 dark:hover:bg-slate-700/50 hover:scale-110'
                                  )}
                                  aria-label="Opciones del mensaje"
                                >
                                  <ChevronDown className={classNames(
                                    'h-3 w-3 transition-transform duration-200',
                                    openMessageMenuId === entry.id && 'rotate-180'
                                  )} />
                                </button>
                              )}
                              {!isOwn && activeChat?.isGroup && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/profile/${entry.senderId}`)}
                                  className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text)] hover:text-sena-green transition-colors mb-1.5 cursor-pointer"
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
                                  <div className="mb-2 rounded-xl overflow-hidden">
                                    {isImage && attachmentUrl ? (
                                      <img
                                        src={attachmentUrl}
                                        alt="Adjunto"
                                        className="max-w-full max-h-64 rounded-xl object-cover"
                                      />
                                    ) : (
                                      <a
                                        href={attachmentUrl || entry.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classNames(
                                          'flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80',
                                          isOwn
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/30 dark:bg-slate-600/30 text-[var(--color-text)]'
                                        )}
                                      >
                                        <div className={classNames(
                                          'flex h-10 w-10 items-center justify-center rounded-lg',
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
                                  className="fixed w-[200px] rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-white/50 dark:border-slate-600/30 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2 z-[999999]"
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
                                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                  >
                                    <Reply className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                                    <span className="text-left font-medium">Responder</span>
                                  </button>
                                  {entry.content && (
                                    <button
                                      type="button"
                                      onClick={() => handleMessageAction('copy', entry)}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                    >
                                      <Copy className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                                      <span className="text-left font-medium">Copiar</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('forward', entry)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                  >
                                    <Forward className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                                    <span className="text-left font-medium">Reenviar</span>
                                  </button>
                                  {entry.attachmentUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handleMessageAction('download', entry)}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/70"
                                    >
                                      <Download className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                                      <span className="text-left font-medium">Descargar</span>
                                    </button>
                                  )}
                                  <div className="my-1 h-px bg-slate-700/50 dark:bg-slate-600/50 mx-2" />
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('star', entry)}
                                    className={classNames(
                                      "flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors",
                                      (() => {
                                        const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '[]');
                                        const isStarred = starredMessages.includes(entry.id);
                                        return isStarred
                                          ? "text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                          : "text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/70";
                                      })()
                                    )}
                                  >
                                    <Star className={classNames(
                                      "h-4 w-4 flex-shrink-0 transition-colors",
                                      (() => {
                                        const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '[]');
                                        const isStarred = starredMessages.includes(entry.id);
                                        return isStarred
                                          ? "text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400"
                                          : "text-slate-600 dark:text-slate-400";
                                      })()
                                    )} />
                                    <span className="text-left font-medium">Destacar</span>
                                  </button>
                                  <div className="my-1 h-px bg-slate-200 dark:bg-slate-600/50 mx-2" />
                                  <button
                                    type="button"
                                    onClick={() => handleMessageAction('delete', entry)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
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

                <form className="flex-shrink-0 border-t border-white/30 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm px-6 py-5" onSubmit={handleSendMessage}>
                  {replyingTo && (
                    <div className="mb-3 flex items-start gap-3 rounded-xl glass-liquid-strong p-3 border-l-4 border-sena-green/60">
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
                        className="flex h-6 w-6 items-center justify-center rounded-lg glass-liquid text-[var(--color-muted)] hover:text-rose-500 transition-all flex-shrink-0"
                        aria-label="Cancelar respuesta"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {attachment && (
                    <div className="mb-3 flex items-center gap-3 rounded-xl glass-liquid-strong p-3">
                      {attachment.mimeType.startsWith('image/') ? (
                        <img
                          src={attachment.dataUrl}
                          alt="Vista previa"
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-sena-green/20">
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg glass-liquid text-[var(--color-muted)] hover:text-rose-500 transition-all"
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
                        className="flex h-12 w-12 items-center justify-center rounded-2xl glass-liquid text-[var(--color-muted)] transition-all duration-200 hover:text-sena-green hover:scale-110 hover:shadow-lg"
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
                          "flex h-12 w-12 items-center justify-center rounded-2xl glass-liquid transition-all duration-200 hover:scale-110 hover:shadow-lg",
                          showEmojiPicker
                            ? "text-sena-green border-sena-green/50"
                            : "text-[var(--color-muted)] hover:text-sena-green"
                        )}
                        aria-label="Insertar emoji"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                      {showEmojiPicker && (
                        <div
                          ref={emojiPickerRef}
                          className="absolute bottom-full right-0 mb-2 z-[100]"
                        >
                          <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                            theme={theme === 'dark' ? 'dark' : 'light'}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 rounded-2xl glass-liquid px-5 py-3 transition-all duration-200 focus-within:border-sena-green/50 focus-within:ring-2 focus-within:ring-sena-green/20 focus-within:shadow-[0_0_0_4px_rgba(57,169,0,0.1)]">
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
                      className="h-12 w-12 rounded-2xl px-0 bg-gradient-to-r from-sena-green to-emerald-600 hover:from-sena-green/90 hover:to-emerald-600/90 shadow-[0_4px_12px_rgba(57,169,0,0.3)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.4)] transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center px-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sena-green/20 to-emerald-500/20 rounded-full blur-2xl"></div>
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
                  className="px-6 py-2.5 font-semibold shadow-[0_8px_20px_rgba(57,169,0,0.25)] hover:shadow-[0_12px_28px_rgba(57,169,0,0.35)] transition-all hover:scale-105"
                >
                  <MessageCirclePlus className="h-4 w-4 mr-2" />
                  Crear mi primer chat
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de información del chat */}
      <GlassDialog
        open={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        size="md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Información del chat</h3>
            <p className="text-sm text-[var(--color-muted)]">Detalles de la conversación</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsInfoModalOpen(false)}
            className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
          >
            <X className="h-4 w-4" /> Cerrar
          </Button>
        </div>

        {activeChat && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span
                className={classNames(
                  'flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-lg',
                  activeChatGradient
                )}
              >
                {activeChatInitials}
              </span>
              <div>
                <p className="text-lg font-semibold text-[var(--color-text)]">{activeChatName}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {activeChat.isGroup ? 'Chat grupal' : 'Chat privado'}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl glass-liquid p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)]">Tipo</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-sena-green">
                  {activeChat.isGroup ? (
                    <>
                      <UsersIcon className="h-3 w-3" />
                      Grupo
                    </>
                  ) : (
                    <>
                      <UserIcon className="h-3 w-3" />
                      Privado
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)]">Creado</span>
                <span className="text-sm text-[var(--color-muted)]">
                  {new Date(activeChat.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {activeChat.lastMessageAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text)]">Último mensaje</span>
                  <span className="text-sm text-[var(--color-muted)]">
                    {formatLastActivity(activeChat.lastMessageAt)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)]">Total de mensajes</span>
                <span className="text-sm text-[var(--color-muted)]">{sortedMessages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)]">Estado</span>
                <span className={classNames(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                  favoriteChats.has(activeChat.id)
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-[var(--color-accent-soft)] text-sena-green"
                )}>
                  {favoriteChats.has(activeChat.id) && (
                    <>
                      <Star className="h-3 w-3 fill-yellow-500" />
                      Favorito
                    </>
                  )}
                  {mutedChats.has(activeChat.id) && (
                    <>
                      <BellOff className="h-3 w-3" />
                      Silenciado
                    </>
                  )}
                  {pinnedChats.has(activeChat.id) && (
                    <>
                      <Pin className="h-3 w-3" />
                      Fijado
                    </>
                  )}
                  {!favoriteChats.has(activeChat.id) && !mutedChats.has(activeChat.id) && !pinnedChats.has(activeChat.id) && (
                    'Activo'
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsInfoModalOpen(false);
                  if (selectedChatId) {
                    const isFavorite = favoriteChats.has(selectedChatId);
                    handleMenuAction(isFavorite ? 'unfavorite' : 'favorite', selectedChatId);
                  }
                }}
              >
                <Star className={classNames("h-4 w-4 mr-2", favoriteChats.has(activeChat.id) && "fill-yellow-500")} />
                {favoriteChats.has(activeChat.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsInfoModalOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </GlassDialog>

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
              className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleNewChatTypeSelection('direct')}
              className="group flex flex-col items-center gap-3 rounded-2xl glass-liquid-strong p-6 transition-all hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-sena-green/30"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/20 to-emerald-500/20 group-hover:from-sena-green/30 group-hover:to-emerald-500/30 transition-all">
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
              className="group flex flex-col items-center gap-3 rounded-2xl glass-liquid-strong p-6 transition-all hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-sena-green/30"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                <UsersIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">Nuevo Grupo</h4>
                <p className="text-xs text-[var(--color-muted)] mt-1">Conversación grupal</p>
              </div>
            </button>
          </div>

          {newChatType && (
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4">
              <form onSubmit={handleCreateChat} className="space-y-4">
                {newChatType === 'group' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Nombre del grupo</label>
                    <input
                      type="text"
                      placeholder="Proyecto de innovación"
                      className="rounded-xl glass-liquid px-3 py-2 text-sm outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30"
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
                            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                              isSelected
                                ? 'bg-sena-green/10 border border-sena-green/40'
                                : 'glass-liquid hover:bg-white/40'
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
                              className={`h-4 w-4 rounded-full border ${
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

      {/* Diálogo de confirmación para eliminar chat */}
      <GlassDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setChatToDelete(null);
        }}
        size="sm"
        contentClassName="glass-dialog-delete bg-white/90 dark:bg-slate-900/95 border border-red-500/30 shadow-[0_24px_60px_rgba(239,68,68,0.7)]"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              Eliminar conversación
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Esta acción eliminará el historial de mensajes de este chat solo para ti. Las otras personas
              seguirán viendo sus mensajes.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setChatToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="!bg-red-500 !text-white !border-red-500/60 !shadow-[0_8px_18px_rgba(239,68,68,0.55)] hover:!bg-red-600 hover:!shadow-[0_10px_24px_rgba(239,68,68,0.65)] focus:!ring-red-400/60"
              loading={deleteChatMutation.isPending}
              onClick={() => {
                if (!chatToDelete) return;
                deleteChatMutation.mutate(chatToDelete, {
                  onSuccess: () => {
                    setShowDeleteDialog(false);
                    setChatToDelete(null);
                    setSuccessMessage('Chat eliminado correctamente');
                    setTimeout(() => setSuccessMessage(null), 1500);
                  }
                });
              }}
            >
              Eliminar chat
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
              className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
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
                      "rounded-xl p-3",
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
              className="self-start rounded-full glass-liquid px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-sena-green"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Vista previa del mensaje a reenviar */}
          {forwardingMessage && (
            <div className="rounded-xl glass-liquid-strong p-4 border-l-4 border-sena-green/60">
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
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                        isSelected
                          ? 'bg-sena-green/10 border border-sena-green/40'
                          : 'glass-liquid hover:bg-white/40'
                      }`}
                    >
                      <span
                        className={classNames(
                          'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm',
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
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
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

      {/* Mensaje de éxito */}
      <AnimatePresence>
        {successMessage && (
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
            <p className="text-sm font-medium text-[var(--color-text)] whitespace-nowrap relative z-10">{successMessage}</p>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 1.5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-sena-green"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
