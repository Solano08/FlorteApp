import { FC, useMemo, useState, useRef, useEffect } from 'react';
import { Hash, UserPlus, ChevronDown, ChevronRight, Settings, Plus, Check, X, Folder } from 'lucide-react';
import { Channel } from '../../types/channel';
import { useNavigate, useParams } from 'react-router-dom';
import { Group } from '../../types/group';
import { useAuth } from '../../hooks/useAuth';

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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
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
  const [draggedChannel, setDraggedChannel] = useState<{ channel: Channel; categoryId: string | null } | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<{ id: string } | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    // Cargar orden de categorías desde localStorage
    if (!communityId) return [];
    const stored = localStorage.getItem(`categoryOrder_${communityId}`);
    return stored ? JSON.parse(stored) : [];
  });
  const communityMenuRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const { textChannels, voiceChannels } = useMemo(() => {
    const sorted = [...channels].sort((a, b) => a.position - b.position);
    return {
      textChannels: sorted.filter((channel) => channel.type === 'text'),
      voiceChannels: sorted.filter((channel) => channel.type === 'voice')
    };
  }, [channels]);

  const handleCreateTextChannelInline = async () => {
    if (!onCreateChannel || !newTextChannelName.trim() || isSubmitting) return;
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
    }
  };

  // Guardar relación canal-categoría
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

  // Manejar drag and drop de canales
  const handleChannelDragStart = (e: React.DragEvent, channel: Channel, categoryId: string | null) => {
    setDraggedChannel({ channel, categoryId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', channel.id);
    e.dataTransfer.setData('type', 'channel');
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

  const handleDrop = (e: React.DragEvent, targetCategoryId: string | null, position?: 'before' | 'after') => {
    e.preventDefault();
    if (!communityId) return;
    
    const dragType = e.dataTransfer.getData('type');
    
    if (dragType === 'channel' && draggedChannel) {
      // Mover canal a categoría
      saveChannelCategory(draggedChannel.channel.id, targetCategoryId);
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

  // Actualizar categorías y relaciones cuando cambia el communityId
  useEffect(() => {
    if (!communityId) {
      setCategories([]);
      setChannelCategories({});
      setCategoryOrder([]);
      return;
    }
    const storedCategories = localStorage.getItem(`categories_${communityId}`);
    setCategories(storedCategories ? JSON.parse(storedCategories) : []);
    const storedRelations = localStorage.getItem(`channelCategories_${communityId}`);
    setChannelCategories(storedRelations ? JSON.parse(storedRelations) : {});
    const storedOrder = localStorage.getItem(`categoryOrder_${communityId}`);
    setCategoryOrder(storedOrder ? JSON.parse(storedOrder) : []);
  }, [communityId]);

  // Cerrar menú de comunidad al hacer clic fuera
  useEffect(() => {
    if (!isCommunityMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (communityMenuRef.current && !communityMenuRef.current.contains(event.target as Node)) {
        setIsCommunityMenuOpen(false);
      }
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

  // Manejar click derecho en el sidebar
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleChannelSettings = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/communities/${communityId}/${channelId}/settings`);
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className="relative z-10 flex h-full w-96 flex-col bg-gradient-to-b from-white/70 via-white/50 to-white/60 dark:from-neutral-900/70 dark:via-neutral-900/50 dark:to-neutral-900/60 backdrop-blur-xl shadow-[2px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_24px_rgba(0,0,0,0.35)]"
        onContextMenu={handleContextMenu}
      >
        {/* Header con nombre de comunidad */}
        {community && (
          <div className="relative border-b border-white/10 dark:border-white/5 bg-white/85 dark:bg-neutral-900/90 px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-[var(--color-text)] truncate">
                    {community.name}
                  </h2>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCommunityMenuOpen((prev) => !prev);
                      }}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 transition-colors duration-150"
                      aria-label="Menú de comunidad"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCommunityMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menú desplegable de comunidad */}
                    {isCommunityMenuOpen && (
                      <div
                        ref={communityMenuRef}
                        className="absolute left-0 top-6 z-30 w-56 rounded-2xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl py-1.5 text-[12px] text-[var(--color-text)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/10"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sena-green/10 dark:hover:bg-sena-green/20 transition-colors duration-150 rounded-2xl mx-1"
                          onClick={() => {
                            setIsCommunityMenuOpen(false);
                            onCommunitySettings?.();
                          }}
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>Ajustes de la comunidad</span>
                        </button>
                        <div className="my-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-700 to-transparent" />
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 rounded-2xl mx-1"
                          onClick={() => {
                            setIsCommunityMenuOpen(false);
                            onLeaveCommunity?.();
                          }}
                        >
                          <span>Abandonar comunidad</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {onInviteFriends && (
                <button
                  type="button"
                  onClick={onInviteFriends}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-transparent text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-text)] dark:hover:bg-neutral-700/80 transition-all duration-200 shadow-none hover:shadow-sm"
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
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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
                className="flex h-6 w-6 items-center justify-center rounded-full bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
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
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
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
              {getOrderedCategories().map((category, categoryIndex) => {
                const isCollapsed = collapsedCategories.has(category.id);
                const categoryChannels = getChannelsInCategory(category.id);
                const isDraggingCategory = draggedCategory?.id === category.id;
                return (
                  <div 
                    key={category.id} 
                    className="mb-2 relative"
                  >
                    {/* Indicador de posición antes */}
                    {dragOverCategory === category.id && dragOverPosition === 'before' && draggedCategory && draggedCategory.id !== category.id && isAdmin && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-sena-green rounded-full z-10" />
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
                        className="flex items-center justify-center rounded hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-all"
                        aria-label={isCollapsed ? 'Expandir categoría' : 'Colapsar categoría'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3 w-3 text-[var(--color-muted)]" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-[var(--color-muted)]" />
                        )}
                      </button>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)] flex-1">
                        {category.name}
                      </p>
                      {category.id !== 'texto' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(null);
                            setSelectedCategoryId(category.id);
                            setIsCreatingTextChannel(true);
                            setNewTextChannelName('');
                          }}
                          className="opacity-0 group-hover:opacity-100 flex h-4 w-4 items-center justify-center rounded hover:bg-white/50 dark:hover:bg-neutral-700/50 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all"
                          aria-label="Crear canal en categoría"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                      {category.id === 'texto' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCreatingTextChannel(true);
                            setSelectedCategoryId(null);
                            setNewTextChannelName('');
                          }}
                          className="opacity-0 group-hover:opacity-100 flex h-4 w-4 items-center justify-center rounded hover:bg-white/50 dark:hover:bg-neutral-700/50 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all"
                          aria-label="Crear canal en Texto"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        {isCreatingTextChannel && selectedCategoryId === category.id && (
                          <div className="ml-4 mb-2 flex items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm">
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
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
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
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                              aria-label="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {isCreatingTextChannel && category.id === 'texto' && !selectedCategoryId && (
                          <div className="ml-4 mb-2 flex items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm">
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
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
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
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                              aria-label="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <div 
                          className="ml-4 space-y-0.5"
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggedCategory && isAdmin) {
                              handleDragOver(e, category.id);
                            }
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!draggedCategory && isAdmin) {
                              handleDrop(e, category.id);
                            }
                          }}
                        >
                        {categoryChannels.map((channel) => {
                          const isActive = channel.id === channelId;
                          return (
                            <div
                              key={channel.id}
                              draggable={isAdmin}
                              onDragStart={(e) => isAdmin && handleChannelDragStart(e, channel, category.id)}
                              onDragEnd={handleDragEnd}
                              className={`group relative ${isAdmin ? 'cursor-move' : 'cursor-default'}`}
                              onMouseEnter={() => setHoveredChannel(channel.id)}
                              onMouseLeave={() => setHoveredChannel(null)}
                            >
                              <button
                                onClick={() => navigate(`/communities/${communityId}/${channel.id}`)}
                                className={`relative flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                  isActive
                                    ? 'bg-white/80 dark:bg-neutral-800/80 text-sena-green dark:text-emerald-400 font-medium shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:bg-sena-green/60 dark:before:bg-emerald-500/60 before:rounded-full'
                                    : 'text-[var(--color-muted)] hover:bg-white/50 dark:hover:bg-neutral-700/50 hover:text-[var(--color-text)]'
                                }`}
                              >
                                <Hash className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate flex-1">{channel.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleChannelSettings(channel.id, e)}
                                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-150 opacity-0 group-hover:opacity-100"
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
                      </>
                    )}
                    {isCreatingTextChannel && selectedCategoryId === category.id && (
                      <div className="ml-4 mb-2 flex items-center gap-2 rounded-2xl bg-white/50 dark:bg-neutral-800/60 px-2.5 py-2 shadow-sm">
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
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-sena-green/80 text-white hover:bg-sena-green disabled:opacity-60 disabled:cursor-not-allowed text-[10px]"
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
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 dark:bg-neutral-700/80 text-[var(--color-muted)] hover:bg-slate-200 dark:hover:bg-neutral-600 text-[10px]"
                          aria-label="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {/* Indicador de posición después */}
                    {dragOverCategory === category.id && dragOverPosition === 'after' && draggedCategory && draggedCategory.id !== category.id && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sena-green rounded-full z-10" />
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
                    <div className="h-0.5 bg-sena-green rounded-full" />
                  )}
                </div>
              )}

              {voiceChannels.length > 0 && (
                <div>
                  <div
                    className="group mt-3 mb-1.5 flex items-center gap-1 px-1"
                    onMouseEnter={() => setHoveredCategory('voz')}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <ChevronDown className="h-3 w-3 text-[var(--color-muted)]" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)] flex-1">
                      Voz
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreatingTextChannel(true);
                      }}
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-150
                        ${hoveredCategory === 'voz' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      aria-label="Crear canal en Voz"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
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
                            className={`relative flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-all duration-200 ${
                              isActive
                                ? 'bg-white/80 dark:bg-neutral-800/80 text-sena-green dark:text-emerald-400 font-medium shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:bg-sena-green/60 dark:before:bg-emerald-500/60 before:rounded-full'
                                : 'text-[var(--color-muted)] hover:bg-white/50 dark:hover:bg-neutral-700/50 hover:text-[var(--color-text)]'
                            }`}
                          >
                            <Hash className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-1">{channel.name}</span>
                            <button
                              type="button"
                              onClick={(e) => handleChannelSettings(channel.id, e)}
                              className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-white/40 dark:hover:bg-white/10 hover:text-sena-green transition-all duration-150 opacity-0 group-hover:opacity-100"
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

    {/* Menú contextual */}
    {contextMenu && (
      <div
        ref={contextMenuRef}
        className="fixed z-50 w-48 rounded-2xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl py-1.5 text-[12px] text-[var(--color-text)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/10"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sena-green/10 dark:hover:bg-sena-green/20 transition-colors duration-150 rounded-2xl mx-1"
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
          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sena-green/10 dark:hover:bg-sena-green/20 transition-colors duration-150 rounded-2xl mx-1"
          onClick={() => {
            setContextMenu(null);
            setIsCreatingCategory(true);
          }}
        >
          <Folder className="h-3.5 w-3.5" />
          <span>Crear categoría</span>
        </button>
      </div>
    )}
    </>
  );
};
