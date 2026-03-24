import { FC, useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Hash,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Settings,
  Plus,
  Check,
  X,
  Folder,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { Channel } from '../../types/channel';
import { useNavigate, useParams } from 'react-router-dom';
import { Group } from '../../types/group';
import { useAuth } from '../../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_MENU_TRANSITION, UI_MOTION_DURATION_S, UI_MOTION_EASE } from '../../utils/transitionConfig';

const CATEGORY_EXPAND_TRANSITION = {
  duration: UI_MOTION_DURATION_S,
  ease: UI_MOTION_EASE
} as const;

interface ChannelSidebarProps {
  channels: Channel[];
  community?: Group | null;
  isLoading?: boolean;
  isLoadingChannels?: boolean;
  onCreateChannel?: (values: { name: string; description?: string; categoryId?: string }) => void;
  onInviteFriends?: () => void;
  onCommunitySettings?: () => void;
  onLeaveCommunity?: () => void;
  isSubmitting?: boolean;
}

export const ChannelSidebar: FC<ChannelSidebarProps> = ({
  channels,
  community,
  isLoading,
  isLoadingChannels,
  onCreateChannel,
  onInviteFriends,
  onCommunitySettings,
  onLeaveCommunity,
  isSubmitting = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { communityId, channelId } = useParams<{ communityId?: string; channelId?: string }>();
  
  // Verificar si el usuario es administrador de la comunidad
  const isAdmin = useMemo(() => {
    if (!user || !community) return false;
    // El creador de la comunidad es admin
    return community.createdBy === user.id;
  }, [user, community]);
  const [isCommunityMenuOpen, setIsCommunityMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [isCreatingTextChannel, setIsCreatingTextChannel] = useState(false);
  const [newTextChannelName, setNewTextChannelName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Array<{ id: string; name: string; communityId: string }>>(() => {
    // Cargar categorías desde localStorage
    if (!communityId) return [];
    const stored = localStorage.getItem(`categories_${communityId}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [channelCategories, setChannelCategories] = useState<Record<string, string>>(() => {
    // Cargar relaciones canal-categoría desde localStorage
    if (!communityId) return {};
    const stored = localStorage.getItem(`channelCategories_${communityId}`);
    return stored ? JSON.parse(stored) : {};
  });
  const [draggedChannel, setDraggedChannel] = useState<{ channel: Channel; categoryUiId: string } | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<{ id: string } | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  /** Orden local de canales por categoría (UI id: texto, uuid, etc.) */
  const [channelOrders, setChannelOrders] = useState<Record<string, string[]>>({});
  const [dragOverChannelId, setDragOverChannelId] = useState<string | null>(null);
  const [channelDropEdge, setChannelDropEdge] = useState<'before' | 'after' | null>(null);
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    // Cargar orden de categorías desde localStorage
    if (!communityId) return [];
    const stored = localStorage.getItem(`categoryOrder_${communityId}`);
    return stored ? JSON.parse(stored) : [];
  });
  const channelListScrollRef = useRef<HTMLDivElement | null>(null);
  const communityMenuRef = useRef<HTMLDivElement | null>(null);
  const communityMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [communityMenuPos, setCommunityMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<string | null>(null);
  const [categoryMenuPos, setCategoryMenuPos] = useState<{ top: number; left: number } | null>(null);
  const categoryMenuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const categoryMenuDropdownRef = useRef<HTMLDivElement | null>(null);
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);
  const [renameCategoryDraft, setRenameCategoryDraft] = useState('');
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const createTextChannelInFlightRef = useRef(false);

  const COMMUNITY_MENU_W = 224;
  const COMMUNITY_MENU_H = 110;
  const CATEGORY_MENU_W = 216;
  const CATEGORY_MENU_H = 260;

  useLayoutEffect(() => {
    if (!isCommunityMenuOpen) {
      setCommunityMenuPos(null);
      return;
    }
    const update = () => {
      const el = communityMenuButtonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      // Alinear el borde izquierdo del menú con el del botón (chevron estrecho). Si alineáramos por la
      // derecha (rect.right - ancho), el panel quedaría demasiado a la izquierda.
      let left = rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - COMMUNITY_MENU_W - 8));
      let top = rect.bottom + gap;
      if (top + COMMUNITY_MENU_H > window.innerHeight - 8) {
        top = Math.max(8, rect.top - COMMUNITY_MENU_H - gap);
      }
      setCommunityMenuPos({ top, left });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isCommunityMenuOpen]);

  useLayoutEffect(() => {
    if (!openCategoryMenuId) {
      setCategoryMenuPos(null);
      return;
    }
    const update = () => {
      const el = categoryMenuButtonRefs.current[openCategoryMenuId];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      // Borde derecho del menú alineado con el del botón ⋮ (queda justo debajo / al lado del disparador)
      let left = rect.right - CATEGORY_MENU_W;
      left = Math.max(8, Math.min(left, window.innerWidth - CATEGORY_MENU_W - 8));
      let top = rect.bottom + gap;
      if (top + CATEGORY_MENU_H > window.innerHeight - 8) {
        top = Math.max(8, rect.top - CATEGORY_MENU_H - gap);
      }
      setCategoryMenuPos({ top, left });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openCategoryMenuId]);

  // Auto-scroll del listado al arrastrar un canal cerca del borde (listas largas)
  useEffect(() => {
    if (!draggedChannel || draggedCategory) return;

    const onDragOverDoc = (e: DragEvent) => {
      const el = channelListScrollRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const zone = 72;
      const y = e.clientY;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (y >= r.top && y <= r.top + zone && el.scrollTop > 0) {
        el.scrollTop = Math.max(0, el.scrollTop - 16);
      } else if (y <= r.bottom && y >= r.bottom - zone && el.scrollTop < maxScroll - 1) {
        el.scrollTop = Math.min(maxScroll, el.scrollTop + 16);
      }
    };

    document.addEventListener('dragover', onDragOverDoc);
    return () => document.removeEventListener('dragover', onDragOverDoc);
  }, [draggedChannel, draggedCategory]);

  const { textChannels, voiceChannels } = useMemo(() => {
    const sorted = [...channels].sort((a, b) => a.position - b.position);
    return {
      textChannels: sorted.filter((channel) => channel.type === 'text'),
      voiceChannels: sorted.filter((channel) => channel.type === 'voice')
    };
  }, [channels]);

  const handleCreateTextChannelInline = async () => {
    if (
      !onCreateChannel ||
      !newTextChannelName.trim() ||
      isSubmitting ||
      createTextChannelInFlightRef.current
    ) {
      return;
    }
    createTextChannelInFlightRef.current = true;
    try {
      await onCreateChannel({
        name: newTextChannelName.trim(),
        categoryId: selectedCategoryId || undefined
      });
      // Actualizar relaciones locales después de crear el canal
      // La relación se guarda en CommunitiesPage, pero necesitamos actualizar el estado local
      // Esperamos un momento para que la query se actualice y luego sincronizamos
      setTimeout(() => {
        if (communityId) {
          const stored = localStorage.getItem(`channelCategories_${communityId}`);
          const relations = stored ? JSON.parse(stored) : {};
          setChannelCategories(relations);
        }
      }, 100);
      setNewTextChannelName('');
      setSelectedCategoryId(null);
      setIsCreatingTextChannel(false);
    } catch {
      // Error manejado por toast en CommunitiesPage
    } finally {
      createTextChannelInFlightRef.current = false;
    }
  };

  // Guardar relación canal-categoría (null = categoría "Texto" / sin categoría)
  const saveChannelCategory = (channelId: string, categoryId: string | null) => {
    if (!communityId) return;
    const updated = { ...channelCategories };
    if (categoryId) {
      updated[channelId] = categoryId;
    } else {
      delete updated[channelId];
    }
    setChannelCategories(updated);
    localStorage.setItem(`channelCategories_${communityId}`, JSON.stringify(updated));
  };

  const uiCategoryToStorage = (uiId: string | null | undefined): string | null => {
    if (!uiId || uiId === 'texto') return null;
    return uiId;
  };

  // Guardar orden de categorías
  const saveCategoryOrder = (newOrder: string[]) => {
    if (!communityId) return;
    setCategoryOrder(newOrder);
    localStorage.setItem(`categoryOrder_${communityId}`, JSON.stringify(newOrder));
  };

  // Obtener categorías ordenadas (incluyendo "Texto" como categoría especial)
  const getOrderedCategories = () => {
    const defaultCategories = [
      { id: 'texto', name: 'Texto', communityId: communityId! },
      { id: 'voz', name: 'Voz', communityId: communityId! }
    ];
    const allCategories = [...defaultCategories, ...categories.filter(c => c.id !== 'texto' && c.id !== 'voz')];
    
    if (categoryOrder.length === 0) return allCategories;
    
    const ordered = categoryOrder
      .map(id => allCategories.find(cat => cat.id === id))
      .filter((c): c is { id: string; name: string; communityId: string } => c !== undefined);

    // Agregar cualquier categoría nueva que no esté en el orden
    const existingIds = new Set(ordered.map(c => c.id));
    allCategories.forEach(c => {
      if (!existingIds.has(c.id)) {
        ordered.push(c);
      }
    });
    
    return ordered;
  };

  // Manejar drag and drop de canales (asa = grip; preview transparente = arrastre más fluido)
  const handleChannelDragStart = (e: React.DragEvent, channel: Channel, categoryUiId: string) => {
    setDraggedChannel({ channel, categoryUiId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', channel.id);
    e.dataTransfer.setData('type', 'channel');
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  // Manejar drag and drop de categorías
  const handleCategoryDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory({ id: categoryId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
    e.dataTransfer.setData('type', 'category');
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string | null, position?: 'before' | 'after') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(categoryId);
    setDragOverPosition(position || null);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
    setDragOverPosition(null);
  };

  const handleContainerDragLeave = (ev: React.DragEvent) => {
    const rel = ev.relatedTarget as Node | null;
    if (rel && ev.currentTarget.contains(rel)) return;
    handleDragLeave();
  };

  const handleChannelRowDragOver = (e: React.DragEvent, targetChannel: Channel) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedChannel || draggedCategory) return;
    if (draggedChannel.channel.id === targetChannel.id) {
      setDragOverChannelId(null);
      setChannelDropEdge(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const h = Math.max(rect.height, 1);
    const rel = (e.clientY - rect.top) / h;
    // Zonas amplias arriba/abajo para "antes/después" sin precisión milimétrica
    let edge: 'before' | 'after';
    if (rel < 0.3) edge = 'before';
    else if (rel > 0.7) edge = 'after';
    else edge = rel < 0.5 ? 'before' : 'after';
    setDragOverChannelId(targetChannel.id);
    setChannelDropEdge(edge);
  };

  const handleChannelRowDragLeave = (e: React.DragEvent) => {
    const rel = e.relatedTarget as Node | null;
    if (rel && e.currentTarget.contains(rel)) return;
    setDragOverChannelId(null);
    setChannelDropEdge(null);
  };

  const handleChannelRowDrop = (e: React.DragEvent, targetChannel: Channel, categoryUiId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedChannel || draggedCategory) return;
    const dragId = draggedChannel.channel.id;
    const srcUi = draggedChannel.categoryUiId;
    const edge = channelDropEdge ?? 'before';

    if (srcUi === categoryUiId) {
      setChannelOrders((prev) => {
        const list = sortChannelsWithLocalOrder(categoryUiId, getChannelsInCategory(categoryUiId));
        const ids = list.map((c) => c.id);
        const from = ids.indexOf(dragId);
        const to = ids.indexOf(targetChannel.id);
        if (from === -1 || to === -1 || dragId === targetChannel.id) return prev;
        const nextIds = [...ids];
        nextIds.splice(from, 1);
        let ins = edge === 'before' ? to : to + 1;
        if (from < ins) ins -= 1;
        nextIds.splice(ins, 0, dragId);
        const merged = { ...prev, [categoryUiId]: nextIds };
        if (communityId) {
          localStorage.setItem(`channelDisplayOrder_${communityId}`, JSON.stringify(merged));
        }
        return merged;
      });
    } else {
      saveChannelCategory(dragId, uiCategoryToStorage(categoryUiId));
      setChannelOrders((prev) => {
        const next = { ...prev };
        next[srcUi] = (prev[srcUi] || []).filter((x) => x !== dragId);
        const dest = [...(prev[categoryUiId] || [])].filter((x) => x !== dragId);
        if (!dest.includes(dragId)) dest.push(dragId);
        next[categoryUiId] = dest;
        if (communityId) {
          localStorage.setItem(`channelDisplayOrder_${communityId}`, JSON.stringify(next));
        }
        return next;
      });
    }
    setDraggedChannel(null);
    setDragOverChannelId(null);
    setChannelDropEdge(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string | null, position?: 'before' | 'after') => {
    e.preventDefault();
    if (!communityId) return;
    
    const dragType = e.dataTransfer.getData('type');
    
    if (dragType === 'channel' && draggedChannel) {
      const srcUi = draggedChannel.categoryUiId;
      const targetUi = targetCategoryId ?? srcUi;
      saveChannelCategory(draggedChannel.channel.id, uiCategoryToStorage(targetUi));
      if (srcUi !== targetUi) {
        setChannelOrders((prev) => {
          const id = draggedChannel.channel.id;
          const next = { ...prev };
          next[srcUi] = (prev[srcUi] || []).filter((x) => x !== id);
          const dest = [...(prev[targetUi] || [])].filter((x) => x !== id);
          if (!dest.includes(id)) dest.push(id);
          next[targetUi] = dest;
          localStorage.setItem(`channelDisplayOrder_${communityId}`, JSON.stringify(next));
          return next;
        });
      }
      setDraggedChannel(null);
    } else if (dragType === 'category' && draggedCategory) {
      // Mover categoría (los canales se mueven automáticamente porque están asociados por categoryId)
      const defaultCategories = ['texto', 'voz'];
      const allCategoryIds = [...defaultCategories, ...categories.map(c => c.id)];
      const currentOrder = categoryOrder.length > 0 
        ? categoryOrder.filter(id => allCategoryIds.includes(id))
        : allCategoryIds;
      
      // Asegurar que todas las categorías estén en el orden
      allCategoryIds.forEach(id => {
        if (!currentOrder.includes(id)) {
          currentOrder.push(id);
        }
      });
      
      const sourceIndex = currentOrder.indexOf(draggedCategory.id);
      
      if (sourceIndex === -1) {
        // Si la categoría no está en el orden, agregarla
        if (targetCategoryId) {
          const targetIndex = currentOrder.indexOf(targetCategoryId);
          if (targetIndex !== -1) {
            if (position === 'after') {
              currentOrder.splice(targetIndex + 1, 0, draggedCategory.id);
            } else {
              currentOrder.splice(targetIndex, 0, draggedCategory.id);
            }
          } else {
            currentOrder.push(draggedCategory.id);
          }
        } else {
          currentOrder.push(draggedCategory.id);
        }
        saveCategoryOrder(currentOrder);
      } else if (targetCategoryId) {
        const targetIndex = currentOrder.indexOf(targetCategoryId);
        if (targetIndex !== -1 && targetIndex !== sourceIndex) {
          const newOrder = [...currentOrder];
          newOrder.splice(sourceIndex, 1);
          
          if (position === 'before') {
            newOrder.splice(targetIndex > sourceIndex ? targetIndex - 1 : targetIndex, 0, draggedCategory.id);
          } else if (position === 'after') {
            newOrder.splice(targetIndex > sourceIndex ? targetIndex : targetIndex + 1, 0, draggedCategory.id);
          } else {
            newOrder.splice(targetIndex, 0, draggedCategory.id);
          }
          
          saveCategoryOrder(newOrder);
        }
      } else {
        // Mover al final
        const newOrder = [...currentOrder];
        newOrder.splice(sourceIndex, 1);
        newOrder.push(draggedCategory.id);
        saveCategoryOrder(newOrder);
      }
      
      setDraggedCategory(null);
    }
    
    setDragOverCategory(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedChannel(null);
    setDraggedCategory(null);
    setDragOverCategory(null);
    setDragOverPosition(null);
    setDragOverChannelId(null);
    setChannelDropEdge(null);
  };

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getChannelsInCategory = (categoryId: string) => {
    if (categoryId === 'texto') {
      // Para la categoría "Texto", mostrar canales sin categoría asignada
      return textChannels.filter((channel) => !channelCategories[channel.id]);
    }
    return textChannels.filter((channel) => channelCategories[channel.id] === categoryId);
  };

  const sortChannelsWithLocalOrder = (categoryUiId: string, list: Channel[]): Channel[] => {
    const custom = channelOrders[categoryUiId];
    const byId = new Map(list.map((c) => [c.id, c]));
    if (!custom?.length) {
      return [...list].sort((a, b) => a.position - b.position);
    }
    const out: Channel[] = [];
    const seen = new Set<string>();
    for (const id of custom) {
      const c = byId.get(id);
      if (c) {
        out.push(c);
        seen.add(id);
      }
    }
    const rest = list.filter((c) => !seen.has(c.id)).sort((a, b) => a.position - b.position);
    return [...out, ...rest];
  };

  const handleCreateCategoryInline = () => {
    if (!newCategoryName.trim() || !communityId) return;
    
    const newCategory = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
      communityId
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // Guardar en localStorage
    localStorage.setItem(`categories_${communityId}`, JSON.stringify(updatedCategories));
    
    // Agregar al orden
    const newOrder = [...categoryOrder, newCategory.id];
    saveCategoryOrder(newOrder);
    
    setNewCategoryName('');
    setIsCreatingCategory(false);
  };

  const isCustomCategoryId = (id: string) => id !== 'texto' && id !== 'voz';

  const deleteCategoryById = (id: string) => {
    if (!communityId || !isCustomCategoryId(id)) return;
    if (!window.confirm('¿Eliminar esta categoría? Los canales pasarán a "Texto".')) return;
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem(`categories_${communityId}`, JSON.stringify(updated));
      return updated;
    });
    setCategoryOrder((prev) => {
      const next = prev.filter((x) => x !== id);
      localStorage.setItem(`categoryOrder_${communityId}`, JSON.stringify(next));
      return next;
    });
    setChannelCategories((prev) => {
      const next = { ...prev };
      for (const [chId, catId] of Object.entries(next)) {
        if (catId === id) delete next[chId];
      }
      localStorage.setItem(`channelCategories_${communityId}`, JSON.stringify(next));
      return next;
    });
    setChannelOrders((prev) => {
      const n = { ...prev };
      delete n[id];
      localStorage.setItem(`channelDisplayOrder_${communityId}`, JSON.stringify(n));
      return n;
    });
    setOpenCategoryMenuId(null);
  };

  const commitRenameCategory = () => {
    if (!renamingCategoryId || !communityId) return;
    const name = renameCategoryDraft.trim();
    if (!name) return;
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === renamingCategoryId ? { ...c, name } : c));
      localStorage.setItem(`categories_${communityId}`, JSON.stringify(updated));
      return updated;
    });
    setRenamingCategoryId(null);
    setRenameCategoryDraft('');
  };

  // Actualizar categorías y relaciones cuando cambia el communityId
  useEffect(() => {
    if (!communityId) {
      setCategories([]);
      setChannelCategories({});
      setCategoryOrder([]);
      setChannelOrders({});
      return;
    }
    const storedCategories = localStorage.getItem(`categories_${communityId}`);
    const parsedCategories: Array<{ id: string; name: string; communityId: string }> = storedCategories
      ? JSON.parse(storedCategories)
      : [];
    setCategories(parsedCategories);

    const validCustomCategoryIds = new Set(parsedCategories.map((c) => c.id));
    // "texto" y "voz" son categorías fijas de la UI; no están en categories_${id} pero sí en channelCategories.
    const validBuiltinCategoryIds = new Set(['texto', 'voz']);
    const storedRelations = localStorage.getItem(`channelCategories_${communityId}`);
    const parsedRelations: Record<string, string> = storedRelations ? JSON.parse(storedRelations) : {};

    // Quitar canales apuntando a categorías borradas (localStorage huérfano); vuelven a "Texto".
    const sanitizedRelations: Record<string, string> = {};
    for (const [chId, catId] of Object.entries(parsedRelations)) {
      if (validCustomCategoryIds.has(catId) || validBuiltinCategoryIds.has(catId)) {
        sanitizedRelations[chId] = catId;
      }
    }
    if (JSON.stringify(sanitizedRelations) !== JSON.stringify(parsedRelations)) {
      localStorage.setItem(`channelCategories_${communityId}`, JSON.stringify(sanitizedRelations));
    }
    setChannelCategories(sanitizedRelations);
    const storedOrder = localStorage.getItem(`categoryOrder_${communityId}`);
    setCategoryOrder(storedOrder ? JSON.parse(storedOrder) : []);
    try {
      const ord = localStorage.getItem(`channelDisplayOrder_${communityId}`);
      setChannelOrders(ord ? JSON.parse(ord) : {});
    } catch {
      setChannelOrders({});
    }
  }, [communityId]);

  // Cerrar menú de comunidad al hacer clic fuera
  useEffect(() => {
    if (!isCommunityMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (communityMenuRef.current?.contains(t) || communityMenuButtonRef.current?.contains(t)) {
        return;
      }
      setIsCommunityMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCommunityMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCommunityMenuOpen]);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!openCategoryMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      const btn = categoryMenuButtonRefs.current[openCategoryMenuId];
      if (categoryMenuDropdownRef.current?.contains(t) || btn?.contains(t)) return;
      setOpenCategoryMenuId(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenCategoryMenuId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openCategoryMenuId]);

  /** Menú contextual en coordenadas de viewport (portal a body evita offset por transform en ancestros). */
  const CONTEXT_MENU_W = 192;
  const CONTEXT_MENU_H = 120;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.max(8, Math.min(e.clientX, window.innerWidth - CONTEXT_MENU_W - 8));
    const y = Math.max(8, Math.min(e.clientY, window.innerHeight - CONTEXT_MENU_H - 8));
    setContextMenu({ x, y });
  };

  const handleChannelSettings = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/communities/${communityId}/${channelId}/settings`);
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className="relative z-10 flex h-full w-96 flex-col glass-liquid"
        onContextMenu={handleContextMenu}
      >
        {/* Header con nombre de comunidad */}
        {community && (
          <div className="relative border-b border-white/20 dark:border-white/10 glass-liquid px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-[var(--color-text)] truncate">
                    {community.name}
                  </h2>
                  <div className="relative flex-shrink-0">
                    <button
                      ref={communityMenuButtonRef}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCommunityMenuOpen((prev) => !prev);
                      }}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-2xl text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 transition-colors duration-ui"
                      aria-label="Menú de comunidad"
                      aria-expanded={isCommunityMenuOpen}
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform duration-ui ${isCommunityMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              {onInviteFriends && (
                <button
                  type="button"
                  onClick={onInviteFriends}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-transparent text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-text)] dark:hover:bg-neutral-700/80 transition-all duration-ui shadow-none hover:shadow-sm"
                  aria-label="Invitar amigos"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

      {/* Contenedor de canales con scroll */}
      <div className="flex flex-1 min-h-0 flex-col px-3 py-3 bg-transparent">
        {/* Lista de canales */}
          <div ref={channelListScrollRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
          {isCreatingCategory && (
            <div className="mb-2 flex items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm">
              <Folder className="h-4 w-4 text-[var(--color-muted)]" />
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategoryInline();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsCreatingCategory(false);
                    setNewCategoryName('');
                  }
                }}
                className="flex-1 bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                placeholder="Nombre de la categoría"
              />
              <button
                type="button"
                onClick={handleCreateCategoryInline}
                disabled={!newCategoryName.trim()}
                className="flex h-6 w-6 items-center justify-center rounded-2xl bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
                aria-label="Crear categoría"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                }}
                className="flex h-6 w-6 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                aria-label="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {isLoadingChannels || isLoading ? (
            <p className="text-[11px] text-[var(--color-muted)]">Cargando canales...</p>
          ) : textChannels.length === 0 && voiceChannels.length === 0 && categories.length === 0 ? (
            <p className="text-[11px] text-[var(--color-muted)]">No hay canales aún.</p>
          ) : (
            <>
              {/* Mostrar categorías creadas */}
              {getOrderedCategories().map((category) => {
                const isCollapsed = collapsedCategories.has(category.id);
                const categoryChannels = sortChannelsWithLocalOrder(category.id, getChannelsInCategory(category.id));
                const isDraggingCategory = draggedCategory?.id === category.id;
                return (
                  <div 
                    key={category.id} 
                    className="mb-2 relative"
                  >
                    {/* Indicador de posición antes */}
                    {dragOverCategory === category.id && dragOverPosition === 'before' && draggedCategory && draggedCategory.id !== category.id && isAdmin && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-sena-green rounded-2xl z-10" />
                    )}
                    <div 
                      className={`group mb-1.5 flex items-center gap-1 px-1 ${isAdmin ? 'cursor-move' : 'cursor-default'} ${isDraggingCategory ? 'opacity-50' : ''}`}
                      draggable={isAdmin}
                      onDragStart={(e) => isAdmin && handleCategoryDragStart(e, category.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedCategory && draggedCategory.id !== category.id && isAdmin) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const midpoint = rect.top + rect.height / 2;
                          const position = e.clientY < midpoint ? 'before' : 'after';
                          handleDragOver(e, category.id, position);
                        }
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedCategory && draggedCategory.id !== category.id && isAdmin) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const midpoint = rect.top + rect.height / 2;
                          const position = e.clientY < midpoint ? 'before' : 'after';
                          handleDrop(e, category.id, position);
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryCollapse(category.id);
                        }}
                        className="flex items-center justify-center rounded hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-all duration-ui ease-ui"
                        aria-label={isCollapsed ? 'Expandir categoría' : 'Colapsar categoría'}
                      >
                        <ChevronDown
                          className={`h-3 w-3 text-[var(--color-muted)] transition-transform duration-ui ease-ui ${
                            isCollapsed ? '-rotate-90' : ''
                          }`}
                        />
                      </button>
                      {renamingCategoryId === category.id ? (
                        <input
                          autoFocus
                          value={renameCategoryDraft}
                          onChange={(e) => setRenameCategoryDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitRenameCategory();
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setRenamingCategoryId(null);
                              setRenameCategoryDraft('');
                            }
                          }}
                          className="min-w-0 flex-1 rounded-lg bg-white/60 dark:bg-neutral-800/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text)] outline-none ring-1 ring-sena-green/30"
                        />
                      ) : (
                        <p className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                          {category.name}
                        </p>
                      )}
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-all duration-ui ease-ui group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(null);
                            if (category.id === 'texto') {
                              setSelectedCategoryId(null);
                            } else {
                              setSelectedCategoryId(category.id);
                            }
                            setIsCreatingTextChannel(true);
                            setNewTextChannelName('');
                          }}
                          className="flex h-4 w-4 items-center justify-center rounded hover:bg-white/50 dark:hover:bg-neutral-700/50 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all duration-ui ease-ui"
                          aria-label={
                            category.id === 'texto' ? 'Crear canal en Texto' : 'Crear canal en categoría'
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          ref={(el) => {
                            categoryMenuButtonRefs.current[category.id] = el;
                          }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCategoryMenuId((prev) => (prev === category.id ? null : category.id));
                          }}
                          className={`flex h-4 w-4 items-center justify-center rounded hover:bg-white/50 dark:hover:bg-neutral-700/50 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all duration-ui ease-ui ${
                            openCategoryMenuId === category.id ? 'opacity-100' : ''
                          }`}
                          aria-label="Opciones de categoría"
                          aria-expanded={openCategoryMenuId === category.id}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          key={`category-body-${category.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={CATEGORY_EXPAND_TRANSITION}
                          className="overflow-hidden"
                        >
                        <AnimatePresence>
                          {isCreatingTextChannel && selectedCategoryId === category.id && (
                            <motion.div
                              key={`create-inline-${category.id}-expanded`}
                              initial={{ opacity: 0, y: -8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.97 }}
                              transition={UI_MENU_TRANSITION}
                              className="ml-4 mb-2 flex origin-top-left items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm"
                            >
                              <Hash className="h-4 w-4 text-[var(--color-muted)]" />
                              <input
                                autoFocus
                                value={newTextChannelName}
                                onChange={(e) => setNewTextChannelName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void handleCreateTextChannelInline();
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setIsCreatingTextChannel(false);
                                    setNewTextChannelName('');
                                    setSelectedCategoryId(null);
                                  }
                                }}
                                className="flex-1 bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                                placeholder="nombre-del-canal"
                              />
                              <button
                                type="button"
                                onClick={() => void handleCreateTextChannelInline()}
                                disabled={!newTextChannelName.trim() || isSubmitting}
                                className="flex h-6 w-6 items-center justify-center rounded-2xl bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
                                aria-label="Crear canal"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingTextChannel(false);
                                  setNewTextChannelName('');
                                  setSelectedCategoryId(null);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                                aria-label="Cancelar"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {isCreatingTextChannel && category.id === 'texto' && !selectedCategoryId && (
                            <motion.div
                              key="create-inline-texto"
                              initial={{ opacity: 0, y: -8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.97 }}
                              transition={UI_MENU_TRANSITION}
                              className="ml-4 mb-2 flex origin-top-left items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm"
                            >
                              <Hash className="h-4 w-4 text-[var(--color-muted)]" />
                              <input
                                autoFocus
                                value={newTextChannelName}
                                onChange={(e) => setNewTextChannelName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void handleCreateTextChannelInline();
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setIsCreatingTextChannel(false);
                                    setNewTextChannelName('');
                                  }
                                }}
                                className="flex-1 bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                                placeholder="nombre-del-canal"
                              />
                              <button
                                type="button"
                                onClick={() => void handleCreateTextChannelInline()}
                                disabled={!newTextChannelName.trim() || isSubmitting}
                                className="flex h-6 w-6 items-center justify-center rounded-2xl bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
                                aria-label="Crear canal"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingTextChannel(false);
                                  setNewTextChannelName('');
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                                aria-label="Cancelar"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div 
                          className="ml-4 space-y-0"
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggedCategory && isAdmin) {
                              handleDragOver(e, category.id);
                            }
                          }}
                          onDragLeave={handleContainerDragLeave}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!draggedCategory && isAdmin) {
                              handleDrop(e, category.id);
                            }
                          }}
                        >
                        {categoryChannels.map((channel) => {
                          const isActive = channel.id === channelId;
                          const showChannelDropBefore =
                            isAdmin &&
                            draggedChannel &&
                            !draggedCategory &&
                            dragOverChannelId === channel.id &&
                            channelDropEdge === 'before';
                          const showChannelDropAfter =
                            isAdmin &&
                            draggedChannel &&
                            !draggedCategory &&
                            dragOverChannelId === channel.id &&
                            channelDropEdge === 'after';
                          return (
                            <div
                              key={channel.id}
                              draggable={isAdmin}
                              onDragStart={(e) => isAdmin && handleChannelDragStart(e, channel, category.id)}
                              onDragEnd={handleDragEnd}
                              title={isAdmin ? 'Arrastra la fila para reordenar el canal' : undefined}
                              className={`group relative rounded-2xl transition-[box-shadow,transform,opacity] duration-ui ${
                                isAdmin ? 'cursor-grab select-none active:cursor-grabbing touch-manipulation' : ''
                              } ${
                                draggedChannel?.channel.id === channel.id
                                  ? 'z-[1] scale-[0.985] opacity-75 shadow-md ring-1 ring-sena-green/35'
                                  : ''
                              }`}
                              onMouseEnter={() => setHoveredChannel(channel.id)}
                              onMouseLeave={() => setHoveredChannel(null)}
                              onDragOver={(e) => isAdmin && handleChannelRowDragOver(e, channel)}
                              onDragLeave={handleChannelRowDragLeave}
                              onDrop={(e) => isAdmin && handleChannelRowDrop(e, channel, category.id)}
                            >
                              {showChannelDropBefore && (
                                <div
                                  className="pointer-events-none absolute -top-0.5 left-2 right-2 z-10 h-0.5 rounded-full bg-sena-green shadow-[0_0_8px_rgba(57,169,0,0.6)]"
                                  aria-hidden
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => navigate(`/communities/${communityId}/${channel.id}`)}
                                className={`relative flex min-w-0 w-full items-center gap-2 rounded-2xl px-2 py-1.5 text-left text-[13px] transition-all duration-ui ${
                                  isActive
                                    ? 'glass-liquid-strong text-sena-green font-medium shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:bg-sena-green/60 before:rounded-2xl'
                                    : 'text-[var(--color-muted)] hover:bg-white/50 dark:hover:bg-neutral-700/50 hover:text-[var(--color-text)]'
                                }`}
                              >
                                <Hash className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate flex-1">{channel.name}</span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => handleChannelSettings(channel.id, e)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleChannelSettings(channel.id, e as unknown as React.MouseEvent);
                                    }
                                  }}
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-2xl text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-ui opacity-0 group-hover:opacity-100"
                                  aria-label="Ajustes del canal"
                                  style={{ pointerEvents: hoveredChannel === channel.id ? 'auto' : 'none' }}
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </span>
                              </button>
                              {showChannelDropAfter && (
                                <div
                                  className="pointer-events-none absolute -bottom-0.5 left-2 right-2 z-10 h-0.5 rounded-full bg-sena-green shadow-[0_0_8px_rgba(57,169,0,0.6)]"
                                  aria-hidden
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isCreatingTextChannel &&
                        selectedCategoryId === category.id &&
                        isCollapsed && (
                        <motion.div
                          key={`create-inline-${category.id}-collapsed`}
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={UI_MENU_TRANSITION}
                          className="ml-4 mb-2 flex origin-top-left items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm"
                        >
                          <Hash className="h-4 w-4 text-[var(--color-muted)]" />
                          <input
                            autoFocus
                            value={newTextChannelName}
                            onChange={(e) => setNewTextChannelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleCreateTextChannelInline();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setIsCreatingTextChannel(false);
                                setNewTextChannelName('');
                                setSelectedCategoryId(null);
                              }
                            }}
                            className="flex-1 bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                            placeholder="nombre-del-canal"
                          />
                          <button
                            type="button"
                            onClick={() => void handleCreateTextChannelInline()}
                            disabled={!newTextChannelName.trim() || isSubmitting}
                            className="flex h-6 w-6 items-center justify-center rounded-2xl bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
                            aria-label="Crear canal"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingTextChannel(false);
                              setNewTextChannelName('');
                              setSelectedCategoryId(null);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                            aria-label="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Indicador de posición después */}
                    {dragOverCategory === category.id && dragOverPosition === 'after' && draggedCategory && draggedCategory.id !== category.id && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sena-green rounded-2xl z-10" />
                    )}
                  </div>
                );
              })}
              {/* Zona de drop al final para categorías */}
              {draggedCategory && isAdmin && (
                <div
                  className="mb-2 relative"
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(e, null, 'after');
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(e, null, 'after');
                  }}
                >
                  {dragOverCategory === null && dragOverPosition === 'after' && (
                    <div className="h-0.5 bg-sena-green rounded-2xl" />
                  )}
                </div>
              )}

              {voiceChannels.length > 0 && (
                <div>
                  <div className="group mt-3 mb-1.5 flex items-center gap-1 px-1">
                    <ChevronDown className="h-3 w-3 text-[var(--color-muted)]" />
                    <p className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Voz
                    </p>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-all duration-ui ease-ui group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreatingTextChannel(true);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-2xl text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-ui ease-ui"
                        aria-label="Crear canal en Voz"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        ref={(el) => {
                          categoryMenuButtonRefs.current.voice_channels_header = el;
                        }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCategoryMenuId((prev) =>
                            prev === 'voice_channels_header' ? null : 'voice_channels_header'
                          );
                        }}
                        className={`flex h-5 w-5 items-center justify-center rounded-2xl text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-ui ease-ui ${
                          openCategoryMenuId === 'voice_channels_header' ? 'opacity-100' : ''
                        }`}
                        aria-label="Opciones de categoría Voz"
                        aria-expanded={openCategoryMenuId === 'voice_channels_header'}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {voiceChannels.map((channel) => {
                      const isActive = channel.id === channelId;
                      return (
                        <div
                          key={channel.id}
                          className="group relative"
                          onMouseEnter={() => setHoveredChannel(channel.id)}
                          onMouseLeave={() => setHoveredChannel(null)}
                        >
                          <button
                            onClick={() => navigate(`/communities/${communityId}/${channel.id}`)}
                            className={`relative flex w-full items-center gap-2 rounded-2xl px-3 py-1.5 text-left text-[13px] transition-all duration-ui ${
                              isActive
                                ? 'glass-liquid-strong text-sena-green font-medium shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:bg-sena-green/60 before:rounded-2xl'
                                : 'text-[var(--color-muted)] hover:bg-white/50 dark:hover:bg-neutral-700/50 hover:text-[var(--color-text)]'
                            }`}
                          >
                            <Hash className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-1">{channel.name}</span>
                            <button
                              type="button"
                              onClick={(e) => handleChannelSettings(channel.id, e)}
                              className="flex h-5 w-5 items-center justify-center rounded-2xl text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-ui opacity-0 group-hover:opacity-100"
                              aria-label="Ajustes del canal"
                              style={{ pointerEvents: hoveredChannel === channel.id ? 'auto' : 'none' }}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>

    {/* Menú de comunidad (portal → body; evita recorte por overflow del shell) */}
    {typeof document !== 'undefined' &&
      createPortal(
        <AnimatePresence>
          {isCommunityMenuOpen && communityMenuPos && (
            <motion.div
              ref={communityMenuRef}
              key="community-menu-dropdown"
              role="menu"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={UI_MENU_TRANSITION}
              className="fixed z-[10060] w-56 origin-top-left rounded-2xl border border-white/20 bg-white/95 py-1.5 text-[12px] leading-snug text-[var(--color-text)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              style={{ top: communityMenuPos.top, left: communityMenuPos.left }}
            >
              <button
                type="button"
                role="menuitem"
                className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors duration-ui ease-ui hover:bg-sena-green/10 dark:hover:bg-sena-green/20"
                onClick={() => {
                  setIsCommunityMenuOpen(false);
                  onCommunitySettings?.();
                }}
              >
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">Ajustes de la comunidad</span>
              </button>
              <div className="my-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-700 to-transparent" />
              <button
                type="button"
                role="menuitem"
                className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-red-500 transition-colors duration-ui ease-ui hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                onClick={() => {
                  setIsCommunityMenuOpen(false);
                  onLeaveCommunity?.();
                }}
              >
                <span className="min-w-0">Abandonar comunidad</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    {/* Menú de opciones por categoría (portal; mismo patrón que menú de comunidad) */}
    {typeof document !== 'undefined' &&
      createPortal(
        <AnimatePresence>
          {openCategoryMenuId && categoryMenuPos && (
            <motion.div
              ref={categoryMenuDropdownRef}
              key={`category-menu-${openCategoryMenuId}`}
              role="menu"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={UI_MENU_TRANSITION}
              className="fixed z-[10060] origin-top-right rounded-2xl border border-white/20 bg-white/95 py-1.5 text-[12px] leading-snug text-[var(--color-text)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              style={{ top: categoryMenuPos.top, left: categoryMenuPos.left, width: CATEGORY_MENU_W }}
            >
              {openCategoryMenuId === 'voice_channels_header' ? (
                <button
                  type="button"
                  role="menuitem"
                  className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors duration-ui ease-ui hover:bg-sena-green/10 dark:hover:bg-sena-green/20"
                  onClick={() => {
                    setOpenCategoryMenuId(null);
                    setIsCreatingTextChannel(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0">Crear canal</span>
                </button>
              ) : (
                (() => {
                  const cat = getOrderedCategories().find((c) => c.id === openCategoryMenuId);
                  if (!cat) return null;
                  const isCollapsed = collapsedCategories.has(cat.id);
                  const canAdminEdit = isAdmin && isCustomCategoryId(cat.id);
                  return (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors duration-ui ease-ui hover:bg-sena-green/10 dark:hover:bg-sena-green/20"
                        onClick={() => {
                          toggleCategoryCollapse(cat.id);
                          setOpenCategoryMenuId(null);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" />
                        )}
                        <span className="min-w-0">{isCollapsed ? 'Expandir categoría' : 'Colapsar categoría'}</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors duration-ui ease-ui hover:bg-sena-green/10 dark:hover:bg-sena-green/20"
                        onClick={() => {
                          setContextMenu(null);
                          if (cat.id === 'texto') {
                            setSelectedCategoryId(null);
                          } else {
                            setSelectedCategoryId(cat.id);
                          }
                          setIsCreatingTextChannel(true);
                          setNewTextChannelName('');
                          setOpenCategoryMenuId(null);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0">Crear canal</span>
                      </button>
                      {canAdminEdit && (
                        <>
                          <div className="my-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-700 to-transparent" />
                          <button
                            type="button"
                            role="menuitem"
                            className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors duration-ui ease-ui hover:bg-sena-green/10 dark:hover:bg-sena-green/20"
                            onClick={() => {
                              setRenameCategoryDraft(cat.name);
                              setRenamingCategoryId(cat.id);
                              setOpenCategoryMenuId(null);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0">Renombrar categoría</span>
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="mx-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-red-500 transition-colors duration-ui ease-ui hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                            onClick={() => deleteCategoryById(cat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0">Eliminar categoría</span>
                          </button>
                        </>
                      )}
                    </>
                  );
                })()
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    {/* Menú contextual junto al puntero (portal → body para position:fixed correcto) */}
    {contextMenu &&
      typeof document !== 'undefined' &&
      createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[10060] w-48 rounded-2xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl py-1.5 text-[12px] text-[var(--color-text)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/10"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sena-green/10 dark:hover:bg-sena-green/20 transition-colors duration-ui rounded-2xl mx-1"
            onClick={() => {
              setContextMenu(null);
              setIsCreatingTextChannel(true);
            }}
          >
            <Hash className="h-3.5 w-3.5" />
            <span>Crear canal</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sena-green/10 dark:hover:bg-sena-green/20 transition-colors duration-ui rounded-2xl mx-1"
            onClick={() => {
              setContextMenu(null);
              setIsCreatingCategory(true);
            }}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Crear categoría</span>
          </button>
        </div>,
        document.body
      )}
    </>
  );
};
