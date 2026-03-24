import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UI_MENU_TRANSITION, UI_MOTION_DURATION_S, UI_MOTION_EASE } from '../../utils/transitionConfig';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  ProjectWorkspaceNotesEditor,
  ProjectWorkspaceNotesReadonly,
  isEmptyWorkspaceNotesHtml,
  notesHtmlEquivalentForSave
} from '../../components/projects/ProjectWorkspaceNotesEditor';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { projectService } from '../../services/projectService';
import { Project, ProjectStatus } from '../../types/project';
import { resolveAssetUrl } from '../../utils/media';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { useAuth } from '../../hooks/useAuth';
import {
  ClipboardList,
  Hammer,
  CheckCircle,
  FolderKanban,
  GitBranch,
  Rocket,
  Sparkles,
  ArrowUpRight,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ImagePlus,
  FileText,
  Share2,
  ArrowLeft,
  CalendarDays,
  Users
} from 'lucide-react';

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 500;

const projectSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(TITLE_MAX_LENGTH, `El título no puede superar los ${TITLE_MAX_LENGTH} caracteres`),
  description: z.string().max(DESCRIPTION_MAX_LENGTH, `La descripción no puede superar los ${DESCRIPTION_MAX_LENGTH} caracteres`).optional(),
  repositoryUrl: z.string().url('Ingresa un repositorio válido').optional().or(z.literal('')),
  status: z.enum(['draft', 'in_progress', 'completed']).optional()
});

type ProjectValues = z.infer<typeof projectSchema>;

type ProjectPanelQueryData = Awaited<ReturnType<typeof projectService.getProjectPanel>>;

const statusLabels: Record<'draft' | 'in_progress' | 'completed', string> = {
  draft: 'Planificacion',
  in_progress: 'En progreso',
  completed: 'Completado'
};

const statusOrder: Array<'draft' | 'in_progress' | 'completed'> = ['draft', 'in_progress', 'completed'];

const memberRoleLabel = (role: string): string => {
  if (role === 'lead') return 'Líder';
  if (role === 'coach') return 'Coach';
  return 'Miembro';
};

// Categorías de proyectos
const projectCategories = [
  { id: 'all', label: 'Todas las categorías', icon: FolderKanban },
  { id: 'web', label: 'Web', icon: FolderKanban },
  { id: 'mobile', label: 'Móvil', icon: FolderKanban },
  { id: 'backend', label: 'Backend', icon: FolderKanban },
  { id: 'frontend', label: 'Frontend', icon: FolderKanban },
  { id: 'fullstack', label: 'Full Stack', icon: FolderKanban },
  { id: 'ai', label: 'Inteligencia Artificial', icon: FolderKanban },
  { id: 'iot', label: 'IoT', icon: FolderKanban },
  { id: 'desktop', label: 'Escritorio', icon: FolderKanban }
] as const;

type ProjectCategory = typeof projectCategories[number]['id'];

const statusDisplay: Record<
  'draft' | 'in_progress' | 'completed',
  { icon: typeof ClipboardList; accent: string; helper: string; badge: string }
> = {
  draft: {
    icon: ClipboardList,
    accent: 'text-amber-600',
    helper: 'Define requerimientos y objetivos clave.',
    badge: 'bg-amber-50 text-amber-700'
  },
  in_progress: {
    icon: Hammer,
    accent: 'text-sena-green',
    helper: 'Coordina tareas, commits y avances.',
    badge: 'bg-sena-green/10 text-sena-green'
  },
  completed: {
    icon: CheckCircle,
    accent: 'text-brand',
    helper: 'Comparte resultados y aprendizajes.',
    badge: 'bg-brand/15 text-brand'
  }
};

/** Laboratorio: cartas blancas; sombras de color (completado > en progreso > planificación) */
const laboratorioCardSurface =
  'bg-white dark:bg-zinc-50 border border-neutral-200/90 dark:border-neutral-300/80';

const laboratorioStatusShadows: Record<
  'draft' | 'in_progress' | 'completed',
  { idle: string; hover: string; active: string }
> = {
  draft: {
    idle:
      '!shadow-[0_6px_22px_-2px_rgba(245,158,11,0.11),0_2px_10px_-2px_rgba(245,158,11,0.06)] dark:!shadow-[0_8px_26px_-2px_rgba(245,158,11,0.15),0_2px_12px_-2px_rgba(245,158,11,0.09)]',
    hover:
      'hover:!shadow-[0_10px_32px_-2px_rgba(245,158,11,0.18),0_4px_18px_-2px_rgba(245,158,11,0.11)] focus-visible:!shadow-[0_10px_32px_-2px_rgba(245,158,11,0.18),0_4px_18px_-2px_rgba(245,158,11,0.11)] dark:hover:!shadow-[0_12px_36px_-2px_rgba(245,158,11,0.22),0_4px_20px_-2px_rgba(245,158,11,0.14)] dark:focus-visible:!shadow-[0_12px_36px_-2px_rgba(245,158,11,0.22),0_4px_20px_-2px_rgba(245,158,11,0.14)]',
    active:
      '!shadow-[0_10px_32px_-2px_rgba(245,158,11,0.21),0_4px_20px_-2px_rgba(245,158,11,0.13)] dark:!shadow-[0_12px_36px_-2px_rgba(245,158,11,0.24),0_4px_22px_-2px_rgba(245,158,11,0.15)]'
  },
  in_progress: {
    idle:
      '!shadow-[0_6px_22px_-2px_rgba(57,169,0,0.19),0_2px_10px_-2px_rgba(57,169,0,0.11)] dark:!shadow-[0_8px_26px_-2px_rgba(57,169,0,0.26),0_2px_12px_-2px_rgba(57,169,0,0.16)]',
    hover:
      'hover:!shadow-[0_10px_32px_-2px_rgba(57,169,0,0.3),0_4px_18px_-2px_rgba(57,169,0,0.19)] focus-visible:!shadow-[0_10px_32px_-2px_rgba(57,169,0,0.3),0_4px_18px_-2px_rgba(57,169,0,0.19)] dark:hover:!shadow-[0_12px_36px_-2px_rgba(57,169,0,0.38),0_4px_20px_-2px_rgba(57,169,0,0.24)] dark:focus-visible:!shadow-[0_12px_36px_-2px_rgba(57,169,0,0.38),0_4px_20px_-2px_rgba(57,169,0,0.24)]',
    active:
      '!shadow-[0_10px_32px_-2px_rgba(57,169,0,0.36),0_4px_20px_-2px_rgba(57,169,0,0.23)] dark:!shadow-[0_12px_36px_-2px_rgba(57,169,0,0.41),0_4px_22px_-2px_rgba(57,169,0,0.27)]'
  },
  completed: {
    idle:
      '!shadow-[0_6px_22px_-2px_rgba(16,185,129,0.28),0_2px_10px_-2px_rgba(16,185,129,0.16)] dark:!shadow-[0_8px_26px_-2px_rgba(52,211,153,0.38),0_2px_12px_-2px_rgba(52,211,153,0.24)]',
    hover:
      'hover:!shadow-[0_10px_32px_-2px_rgba(16,185,129,0.44),0_4px_18px_-2px_rgba(16,185,129,0.28)] focus-visible:!shadow-[0_10px_32px_-2px_rgba(16,185,129,0.44),0_4px_18px_-2px_rgba(16,185,129,0.28)] dark:hover:!shadow-[0_12px_36px_-2px_rgba(52,211,153,0.54),0_4px_20px_-2px_rgba(52,211,153,0.34)] dark:focus-visible:!shadow-[0_12px_36px_-2px_rgba(52,211,153,0.54),0_4px_20px_-2px_rgba(52,211,153,0.34)]',
    active:
      '!shadow-[0_10px_32px_-2px_rgba(16,185,129,0.52),0_4px_20px_-2px_rgba(16,185,129,0.33)] dark:!shadow-[0_12px_36px_-2px_rgba(52,211,153,0.58),0_4px_22px_-2px_rgba(52,211,153,0.4)]'
  }
};

/** Desfase del movimiento suave del Laboratorio para que las tres cartas no vayan sincronizadas */
const laboratorioMotionDelay: Record<'draft' | 'in_progress' | 'completed', string> = {
  draft: '0s',
  in_progress: '0.9s',
  completed: '1.8s'
};

/** Panel lateral: misma sombra que los Card del centro (`Card` ya aplica glass-liquid) */
const sidebarPanelClass =
  'shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]';

/** Filas dentro del panel (elevación suave; el panel ya aporta la sombra principal) */
const sidebarRowClass =
  'glass-liquid shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.28)] dark:hover:shadow-[0_6px_18px_rgba(57,169,0,0.22)]';

const projectCardShadow =
  'shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]';

const projectViewTransition = {
  duration: UI_MOTION_DURATION_S,
  ease: UI_MOTION_EASE
} as const;

type InlineDraftState = {
  title: string;
  description: string;
  status: ProjectStatus;
  coverFile: File | null;
  coverPreviewUrl: string | null;
};

export const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory>('all');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [inlineDraft, setInlineDraft] = useState<InlineDraftState | null>(null);
  const [draftTitleError, setDraftTitleError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const draftCoverInputRef = useRef<HTMLInputElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreviewUrl, setEditCoverPreviewUrl] = useState<string | null>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savedWorkspaceNotesBaseline, setSavedWorkspaceNotesBaseline] = useState('');
  const [workspaceNotesEditorSynced, setWorkspaceNotesEditorSynced] = useState(false);

  const setProjectView = useCallback(
    (id: string | null) => {
      setViewingProjectId(id);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('v', id);
          else next.delete('v');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const raw = searchParams.get('v');
    const id = raw?.trim() || null;
    setViewingProjectId((prev) => (prev === id ? prev : id));
  }, [searchParams]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.listProjects
  });

  const {
    data: projectPanel,
    isLoading: isPanelLoading,
    isError: isPanelError,
    error: panelQueryError
  } = useQuery({
    queryKey: ['projects', 'panel', viewingProjectId],
    queryFn: () => projectService.getProjectPanel(viewingProjectId!),
    enabled: Boolean(viewingProjectId && user?.id)
  });

  useEffect(() => {
    setNotesDraft('');
    setWorkspaceNotesEditorSynced(false);
    setSavedWorkspaceNotesBaseline('');
  }, [viewingProjectId]);

  useEffect(() => {
    if (!viewingProjectId || !projectPanel || projectPanel.project.id !== viewingProjectId) return;
    setSavedWorkspaceNotesBaseline(projectPanel.project.workspaceNotes ?? '');
  }, [viewingProjectId, projectPanel?.project.id]);

  const handleWorkspaceNotesHtml = useCallback((html: string) => {
    setNotesDraft(html);
    setWorkspaceNotesEditorSynced(true);
  }, []);

  const createProjectMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => {});
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'in_progress' | 'completed' }) =>
      projectService.updateProject(id, { status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'panel', vars.id] }).catch(() => {});
    }
  });

  const saveWorkspaceNotesMutation = useMutation({
    mutationFn: ({ projectId, notes }: { projectId: string; notes: string | null }) =>
      projectService.updateWorkspaceNotes(projectId, notes),
    onSuccess: (project) => {
      setSavedWorkspaceNotesBaseline(project.workspaceNotes ?? '');
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      queryClient.setQueryData<ProjectPanelQueryData>(['projects', 'panel', project.id], (old) => {
        if (!old) return old;
        return { ...old, project: { ...old.project, workspaceNotes: project.workspaceNotes } };
      });
    }
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      projectService.uploadProjectAttachment(projectId, file),
    onSuccess: (attachment, vars) => {
      queryClient.setQueryData<ProjectPanelQueryData>(['projects', 'panel', vars.projectId], (old) => {
        if (!old) return old;
        if (old.attachments.some((a) => a.id === attachment.id)) return old;
        return { ...old, attachments: [...old.attachments, attachment] };
      });
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ projectId, attachmentId }: { projectId: string; attachmentId: string }) =>
      projectService.deleteProjectAttachment(projectId, attachmentId),
    onSuccess: (_void, vars) => {
      queryClient.setQueryData<ProjectPanelQueryData>(['projects', 'panel', vars.projectId], (old) => {
        if (!old) return old;
        return { ...old, attachments: old.attachments.filter((a) => a.id !== vars.attachmentId) };
      });
    }
  });

  const deleteImageAttachmentForNotes = useCallback(
    (attachmentId: string) => {
      if (!viewingProjectId) return Promise.reject(new Error('Sin proyecto'));
      return deleteAttachmentMutation.mutateAsync({ projectId: viewingProjectId, attachmentId });
    },
    [viewingProjectId, deleteAttachmentMutation]
  );

  const uploadProjectImageForNotes = useCallback(
    async (file: File) => {
      if (!viewingProjectId) throw new Error('Sin proyecto');
      const att = await uploadAttachmentMutation.mutateAsync({
        projectId: viewingProjectId,
        file
      });
      const src = resolveAssetUrl(att.fileUrl) ?? att.fileUrl;
      return { src, attachmentId: att.id };
    },
    [viewingProjectId, uploadAttachmentMutation]
  );

  const editProjectMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      coverFile
    }: {
      id: string;
      data: { title?: string; description?: string; repositoryUrl?: string; status?: 'draft' | 'in_progress' | 'completed' };
      coverFile: File | null;
    }) => {
      const updated = await projectService.updateProject(id, data);
      if (coverFile) {
        await projectService.uploadProjectCover(id, coverFile);
      }
      return updated;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'panel', vars.id] }).catch(() => {});
      setEditCoverPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setEditCoverFile(null);
      if (editCoverInputRef.current) editCoverInputRef.current.value = '';
      setProjectToEdit(null);
      reset();
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => {});
      setProjectToDelete(null);
      setViewingProjectId((v) => (v === deletedId ? null : v));
      setSearchParams(
        (prev) => {
          if (prev.get('v') !== deletedId) return prev;
          const next = new URLSearchParams(prev);
          next.delete('v');
          return next;
        },
        { replace: true }
      );
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      repositoryUrl: '',
      status: 'draft'
    }
  });

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openMenuId) return;
      const menuElement = menuRefs.current[openMenuId];
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);


  // Preparar formulario cuando se abre el diálogo de edición
  useEffect(() => {
    if (projectToEdit) {
      setValue('title', projectToEdit.title);
      setValue('description', projectToEdit.description || '');
      setValue('repositoryUrl', projectToEdit.repositoryUrl || '');
      setValue('status', projectToEdit.status);
    }
  }, [projectToEdit, setValue]);

  useEffect(() => {
    if (!projectToEdit) return;
    setEditCoverFile(null);
    setEditCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (editCoverInputRef.current) editCoverInputRef.current.value = '';
  }, [projectToEdit?.id]);

  // Función para obtener la categoría de un proyecto (simulado basado en palabras clave)
  const getProjectCategory = (project: Project): ProjectCategory => {
    const title = project.title.toLowerCase();
    const description = (project.description || '').toLowerCase();
    const text = `${title} ${description}`;

    if (text.includes('mobile') || text.includes('móvil') || text.includes('android') || text.includes('ios') || text.includes('react native')) {
      return 'mobile';
    }
    if (text.includes('backend') || text.includes('api') || text.includes('servidor') || text.includes('express') || text.includes('node')) {
      return 'backend';
    }
    if (text.includes('frontend') || text.includes('react') || text.includes('vue') || text.includes('angular') || text.includes('ui')) {
      return 'frontend';
    }
    if (text.includes('full stack') || text.includes('fullstack')) {
      return 'fullstack';
    }
    if (text.includes('ia') || text.includes('ai') || text.includes('machine learning') || text.includes('ml') || text.includes('inteligencia artificial')) {
      return 'ai';
    }
    if (text.includes('iot') || text.includes('internet of things')) {
      return 'iot';
    }
    if (text.includes('desktop') || text.includes('escritorio') || text.includes('electron')) {
      return 'desktop';
    }
    if (text.includes('web') || text.includes('sitio') || text.includes('página')) {
      return 'web';
    }
    return 'web'; // Por defecto
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project: Project) => project.status === statusFilter);
    }
    
    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((project: Project) => getProjectCategory(project) === categoryFilter);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (project: Project) =>
          project.title.toLowerCase().includes(term) ||
          (project.description ?? '').toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [projects, statusFilter, categoryFilter, searchTerm]);

  const stats = useMemo(
    () =>
      statusOrder.reduce(
        (acc, status) => ({
          ...acc,
          [status]: projects.filter((project: Project) => project.status === status).length
        }),
        { draft: 0, in_progress: 0, completed: 0 }
      ),
    [projects]
  );

  // Proyectos destacados para el sidebar
  const learningHighlights = useMemo(() => {
    return projects.slice(0, 3);
  }, [projects]);

  const activeProject = useMemo(
    () => (viewingProjectId ? projects.find((p) => p.id === viewingProjectId) ?? null : null),
    [projects, viewingProjectId]
  );

  const panelForbidden =
    isPanelError && isAxiosError(panelQueryError) && panelQueryError.response?.status === 403;

  const sortedPanelMembers = useMemo(() => {
    const list = projectPanel?.members ?? [];
    return [...list].sort((a, b) => {
      if (a.isOwner === b.isOwner) return 0;
      return a.isOwner ? -1 : 1;
    });
  }, [projectPanel?.members]);

  const handleMenuToggle = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === projectId ? null : projectId));
  };

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setOpenMenuId(null);
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setOpenMenuId(null);
  };

  const handleCopyProjectLink = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/projects?v=${encodeURIComponent(project.id)}`;
    void navigator.clipboard.writeText(url);
    setOpenMenuId(null);
  };

  const handleEditCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setEditCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setEditCoverFile(file);
  };

  const closeEditDialog = () => {
    setEditCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setEditCoverFile(null);
    if (editCoverInputRef.current) editCoverInputRef.current.value = '';
    setProjectToEdit(null);
    reset();
  };

  const discardInlineDraft = useCallback(() => {
    setInlineDraft((prev) => {
      if (prev?.coverPreviewUrl) URL.revokeObjectURL(prev.coverPreviewUrl);
      return null;
    });
    setDraftTitleError(null);
    if (draftCoverInputRef.current) draftCoverInputRef.current.value = '';
  }, []);

  const openInlineDraft = useCallback(() => {
    setInlineDraft((prev) => {
      if (prev?.coverPreviewUrl) URL.revokeObjectURL(prev.coverPreviewUrl);
      return {
        title: '',
        description: '',
        status: 'draft',
        coverFile: null,
        coverPreviewUrl: null
      };
    });
    setDraftTitleError(null);
    if (draftCoverInputRef.current) draftCoverInputRef.current.value = '';
  }, []);

  const saveInlineDraft = useCallback(async () => {
    if (!inlineDraft) return;
    const title = inlineDraft.title.trim();
    if (title.length < 3) {
      setDraftTitleError('El título debe tener al menos 3 caracteres');
      return;
    }
    setDraftTitleError(null);
    setIsSavingDraft(true);
    try {
      const created = await createProjectMutation.mutateAsync({
        title,
        description: inlineDraft.description.trim() || undefined,
        status: inlineDraft.status
      });
      if (inlineDraft.coverFile) {
        await projectService.uploadProjectCover(created.id, inlineDraft.coverFile);
      }
      if (inlineDraft.coverPreviewUrl) URL.revokeObjectURL(inlineDraft.coverPreviewUrl);
      setInlineDraft(null);
      if (draftCoverInputRef.current) draftCoverInputRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['projects', 'me'] });
    } catch {
      // Errores de red / API: el usuario puede reintentar
    } finally {
      setIsSavingDraft(false);
    }
  }, [inlineDraft, createProjectMutation, queryClient]);

  const handleDraftCoverChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setInlineDraft((prev) => {
      if (!prev) return prev;
      if (prev.coverPreviewUrl) URL.revokeObjectURL(prev.coverPreviewUrl);
      return {
        ...prev,
        coverFile: file,
        coverPreviewUrl: URL.createObjectURL(file)
      };
    });
  }, []);

  return (
    <DashboardLayout
      fluid
      contentClassName="h-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 !pt-0"
    >
      <div className="mx-auto grid w-full max-w-[1920px] items-start gap-3 pt-2 sm:gap-4 md:grid-cols-[1fr_320px] md:gap-4 lg:grid-cols-[280px_1fr_300px] lg:gap-5 xl:grid-cols-[320px_1fr_360px] xl:gap-6 2xl:max-w-[2560px]" style={{ minHeight: 'calc(100vh - 56px)', boxShadow: 'none', WebkitBoxShadow: 'none' }}>
        {/* Sidebar izquierdo: Actividad rápida y Tus proyectos */}
        <aside className="hidden w-full flex-col lg:flex lg:z-10" style={{ position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)' }}>
          <div className="flex flex-col space-y-6 py-4">
            {/* Actividad Rápida */}
            <Card padded={false} className={`${sidebarPanelClass} space-y-3 p-3`}>
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Actividad rápida</h3>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => navigate('/explore')}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-ui hover:bg-white/10 active:scale-[0.98] ${sidebarRowClass}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 dark:bg-white/10 text-brand transition-all duration-ui group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">Explorar proyectos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectView(null)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-ui hover:bg-white/10 active:scale-[0.98] ${sidebarRowClass}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 dark:bg-white/10 text-brand transition-all duration-ui group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">Revisar mis proyectos</span>
                </button>
              </div>
            </Card>

            {/* Tus proyectos */}
            <Card padded={false} className={`${sidebarPanelClass} space-y-3 p-3`}>
              <div className="flex items-center gap-2 px-1">
                <FolderKanban className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Tus proyectos</h3>
              </div>
              <div className="space-y-1.5">
                {isLoading ? (
                  <p className="px-2 text-xs text-[var(--color-muted)]">Cargando proyectos...</p>
                ) : learningHighlights.length === 0 ? (
                  <p className="px-2 text-xs text-[var(--color-muted)]">
                    Registra tus proyectos para seguir tu progreso.
                  </p>
                ) : (
                  learningHighlights.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setProjectView(project.id)}
                      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-ui hover:bg-white/10 active:scale-[0.98] ${sidebarRowClass} ${
                        viewingProjectId === project.id ? 'ring-2 ring-brand/40' : ''
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 dark:bg-white/10 text-brand transition-all duration-ui group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{project.title}</p>
                        <p className="text-xs text-[var(--color-muted)] capitalize">{statusLabels[project.status]}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </aside>

        {/* Contenido principal */}
        <section
          className="mx-auto flex min-w-0 w-full flex-col pb-16 sm:pb-20 px-3 sm:px-4 relative z-10 hide-scrollbar"
          style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'visible',
            boxShadow: 'none',
            WebkitBoxShadow: 'none',
            overflowY: 'auto',
            height: 'calc(100vh - 56px)',
            alignSelf: 'flex-start'
          }}
        >
          <div className="relative w-full min-h-0 flex-1">
            <AnimatePresence mode="wait">
              {!viewingProjectId ? (
                <motion.div
                  key="projects-list"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={projectViewTransition}
                  className="flex flex-col gap-3 sm:gap-4 lg:gap-5"
                >
          {/* Barra de búsqueda */}
          <Card className={projectCardShadow}>
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar proyectos, grupos o hashtags..."
                className="w-full min-w-0 max-w-xl rounded-2xl border-white/50 dark:border-white/15 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.2)] transition-shadow duration-ui dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.45)] focus:!border-white/25 focus:!ring-0 dark:focus:!border-white/15 focus:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.3)] dark:focus:shadow-[0_6px_22px_-2px_rgba(0,0,0,0.55)]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className={`w-full max-w-xl shrink-0 px-4 py-2 text-xs shadow-[0_4px_12px_rgba(57,169,0,0.2)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.3)] transition-all sm:w-auto sm:max-w-none ${
                  categoryFilter !== 'all' ? 'bg-brand/20 ring-2 ring-brand/40' : ''
                }`}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filtros
              </Button>
            </div>
            {showFiltersMenu && (
              <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Categorías
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {projectCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = categoryFilter === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryFilter(category.id)}
                        className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all duration-ui hover:scale-105 ${
                          isSelected
                            ? 'bg-brand/20 ring-2 ring-brand/40 shadow-lg'
                            : 'bg-white/50 dark:bg-neutral-800/50 hover:bg-white/70 dark:hover:bg-neutral-700/70'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-brand' : 'text-[var(--color-muted)]'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'font-semibold text-brand' : 'text-[var(--color-text)]'}`}>
                          {category.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Botón para crear nuevo proyecto */}
          <Card className={projectCardShadow}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">Tus proyectos</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Gestiona y organiza todos tus proyectos en un solo lugar.
                </p>
              </div>
              <Button
                onClick={openInlineDraft}
                leftIcon={<Plus className="h-4 w-4" />}
                className="shadow-[0_4px_12px_rgba(57,169,0,0.2)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.3)] transition-all hover:scale-105"
              >
                Nuevo proyecto
              </Button>
            </div>
          </Card>

          {/* Lista de proyectos */}
          <div>
            {statusFilter !== 'all' && (
              <div className="mb-4 flex items-center justify-end">
                <Button variant="secondary" size="sm" onClick={() => setStatusFilter('all')}>
                  Ver todos
                </Button>
              </div>
            )}

            {isLoading && (
              <Card className={projectCardShadow}>
                <p className="text-sm text-[var(--color-muted)]">Cargando proyectos...</p>
              </Card>
            )}

            {!isLoading && filteredProjects.length === 0 && !inlineDraft && (
              <Card className={projectCardShadow}>
                <p className="text-sm text-[var(--color-muted)]">
                  No hay proyectos en este estado todavia. Crea uno nuevo o cambia el filtro.
                </p>
              </Card>
            )}

            {!isLoading && (filteredProjects.length > 0 || inlineDraft) && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inlineDraft && (
                  <Card className={`relative flex flex-col space-y-3 ${projectCardShadow} cursor-default`}>
                    <input
                      ref={draftCoverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDraftCoverChange}
                    />
                    <div className="relative -mx-4 -mt-4 overflow-hidden rounded-t-2xl border-b border-white/15 dark:border-white/10">
                      <div className="relative flex h-36 w-full items-center justify-center bg-gradient-to-br from-brand/15 to-emerald-500/10">
                        {inlineDraft.coverPreviewUrl ? (
                          <img
                            src={inlineDraft.coverPreviewUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="relative z-[1] shadow-md"
                          leftIcon={<ImagePlus className="h-4 w-4" />}
                          onClick={() => draftCoverInputRef.current?.click()}
                        >
                          Subir foto
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="inline-draft-title" className="text-xs font-medium text-[var(--color-text)]">
                        Nombre del proyecto
                      </label>
                      <Input
                        id="inline-draft-title"
                        value={inlineDraft.title}
                        onChange={(e) =>
                          setInlineDraft((d) => (d ? { ...d, title: e.target.value } : d))
                        }
                        placeholder="Ej: App de inventarios"
                        maxLength={TITLE_MAX_LENGTH}
                        className="rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {draftTitleError ? (
                        <p className="text-xs text-red-500">{draftTitleError}</p>
                      ) : null}
                    </div>

                    <TextArea
                      label="Descripción"
                      rows={3}
                      value={inlineDraft.description}
                      onChange={(e) =>
                        setInlineDraft((d) => (d ? { ...d, description: e.target.value } : d))
                      }
                      placeholder="Objetivo y alcance del proyecto..."
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      className="text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="space-y-1.5">
                      <label htmlFor="inline-draft-status" className="text-xs font-medium text-[var(--color-text)]">
                        Estado
                      </label>
                      <select
                        id="inline-draft-status"
                        value={inlineDraft.status}
                        onChange={(e) =>
                          setInlineDraft((d) =>
                            d
                              ? { ...d, status: e.target.value as ProjectStatus }
                              : d
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="draft">Planificación</option>
                        <option value="in_progress">En progreso</option>
                        <option value="completed">Completado</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-white/20 dark:border-white/10 pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={discardInlineDraft}
                        disabled={isSavingDraft}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        loading={isSavingDraft}
                        disabled={isSavingDraft}
                        onClick={() => void saveInlineDraft()}
                      >
                        Guardar proyecto
                      </Button>
                    </div>
                  </Card>
                )}

                {filteredProjects.map((project: Project) => {
                  const isOwner = user?.id === project.ownerId;
                  const coverSrc = resolveAssetUrl(project.coverImage ?? null);
                  return (
                  <Card
                    key={project.id}
                    className={`group relative flex flex-col space-y-4 transition-all duration-ui hover:scale-[1.02] cursor-pointer ${projectCardShadow} hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden`}
                    onClick={() => setProjectView(project.id)}
                  >
                    <div
                      className="absolute right-2 top-2 z-10"
                      ref={(el) => {
                        menuRefs.current[project.id] = el;
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleMenuToggle(project.id, e)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-2xl text-[var(--color-muted)] transition hover:bg-white/30 dark:hover:bg-[#0E0F0F] hover:text-sena-green"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === project.id}
                        aria-label="Opciones del proyecto"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      <AnimatePresence>
                        {openMenuId === project.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{
                              opacity: UI_MENU_TRANSITION.opacity,
                              y: UI_MENU_TRANSITION.y,
                              scale: UI_MENU_TRANSITION.scale
                            }}
                            className="absolute right-0 top-9 z-20 w-48 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-700/90 shadow-[0_10px_28px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.45)] p-2 text-sm text-[var(--color-text)]"
                          >
                            {isOwner ? (
                              <button
                                type="button"
                                onClick={(e) => handleEditProject(project, e)}
                                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-black/5 dark:hover:bg-neutral-800"
                              >
                                <FileText className="h-4 w-4 text-sena-green" />
                                Editar proyecto
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={(e) => handleCopyProjectLink(project, e)}
                              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-black/5 dark:hover:bg-neutral-800"
                            >
                              <Share2 className="h-4 w-4 text-sena-green" />
                              Copiar enlace
                            </button>
                            {isOwner ? (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteProject(project, e)}
                                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-red-500 dark:text-red-400 transition hover:bg-rose-50 dark:hover:bg-rose-900/25 hover:text-red-600 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                Eliminar
                              </button>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {coverSrc ? (
                      <div className="relative -mx-4 -mt-4 h-36 w-[calc(100%+2rem)] overflow-hidden">
                        <img src={coverSrc} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : null}

                    <div className="flex items-start gap-3 pr-8">
                      {!coverSrc ? (
                        <div className="flex-shrink-0 rounded-2xl bg-gradient-to-br from-brand/20 to-emerald-500/20 p-3 text-brand transition-transform group-hover:scale-110">
                          <FolderKanban className="h-6 w-6" />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-[var(--color-text)] group-hover:text-brand transition-colors">
                          {project.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                          Actualizado el {new Date(project.updatedAt).toLocaleDateString('es-CO')}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex rounded-2xl bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand ring-1 ring-brand/20">
                            {statusLabels[project.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="flex-1 text-sm leading-relaxed text-[var(--color-muted)] line-clamp-3">
                      {project.description ?? 'Describe el objetivo y el alcance del proyecto para alinear a tu equipo.'}
                    </p>

                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-emerald-600 transition-colors"
                      >
                        <GitBranch className="h-4 w-4" />
                        Ver repositorio
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-white/20 dark:border-white/10 pt-3">
                      {statusOrder.map((status) => (
                        <Button
                          key={status}
                          variant={project.status === status ? 'primary' : 'secondary'}
                          size="sm"
                          disabled={!isOwner}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOwner) return;
                            updateProjectMutation.mutate({
                              id: project.id,
                              status
                            });
                          }}
                          className={`transition-all hover:scale-105 ${!isOwner ? 'opacity-50' : ''}`}
                        >
                          {statusLabels[status]}
                        </Button>
                      ))}
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`project-detail-${viewingProjectId}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14 }}
                  transition={projectViewTransition}
                  className="flex flex-col gap-4"
                >
                  {activeProject ? (
                    (() => {
                      const p = projectPanel?.project ?? activeProject;
                      const detailCover = resolveAssetUrl(p.coverImage ?? null);
                      const detailOwner = user?.id === p.ownerId;
                      const detailStatus = statusDisplay[p.status];
                      const DetailStatusIcon = detailStatus.icon;
                      return (
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setProjectView(null)}
                              leftIcon={<ArrowLeft className="h-4 w-4" />}
                              className="shadow-[0_4px_12px_rgba(57,169,0,0.15)]"
                            >
                              Volver a proyectos
                            </Button>
                            {detailOwner ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setProjectToEdit(p)}
                                leftIcon={<Edit className="h-4 w-4" />}
                              >
                                Editar proyecto
                              </Button>
                            ) : null}
                          </div>

                          <Card className={`overflow-hidden ${projectCardShadow}`}>
                            {detailCover ? (
                              <div className="relative -mx-4 -mt-4 h-48 w-[calc(100%+2rem)] overflow-hidden sm:h-56">
                                <img src={detailCover} alt="" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="relative -mx-4 -mt-4 flex h-40 w-[calc(100%+2rem)] items-center justify-center bg-gradient-to-br from-brand/20 to-emerald-500/15">
                                <FolderKanban className="h-16 w-16 text-brand/35" />
                              </div>
                            )}
                            <div className="space-y-4 pt-2">
                              <div>
                                <h1 className="text-2xl font-semibold text-[var(--color-text)]">{p.title}</h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="inline-flex rounded-2xl bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand ring-1 ring-brand/20">
                                    {statusLabels[p.status]}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                                    <DetailStatusIcon className={`h-3.5 w-3.5 shrink-0 ${detailStatus.accent}`} />
                                    {detailStatus.helper}
                                  </span>
                                </div>
                              </div>
                              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-muted)]">
                                {p.description?.trim()
                                  ? p.description
                                  : 'Sin descripción. Puedes añadirla desde Editar proyecto.'}
                              </p>
                              {p.repositoryUrl ? (
                                <a
                                  href={p.repositoryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-emerald-600 transition-colors"
                                >
                                  <GitBranch className="h-4 w-4" />
                                  Abrir repositorio
                                </a>
                              ) : null}
                            </div>
                          </Card>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <Card className={projectCardShadow}>
                              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Fase del proyecto</h3>
                              <p className="mb-3 text-xs text-[var(--color-muted)]">
                                Cambia la fase cuando tu equipo avance en el ciclo del proyecto.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {statusOrder.map((status) => (
                                  <Button
                                    key={status}
                                    variant={p.status === status ? 'primary' : 'secondary'}
                                    size="sm"
                                    disabled={!detailOwner}
                                    onClick={() => {
                                      if (!detailOwner) return;
                                      updateProjectMutation.mutate({
                                        id: p.id,
                                        status
                                      });
                                    }}
                                    className={`transition-all hover:scale-105 ${!detailOwner ? 'opacity-50' : ''}`}
                                  >
                                    {statusLabels[status]}
                                  </Button>
                                ))}
                              </div>
                            </Card>

                            <Card className={projectCardShadow}>
                              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                                <CalendarDays className="h-4 w-4 text-brand" />
                                Fechas
                              </h3>
                              <dl className="space-y-3 text-sm">
                                <div>
                                  <dt className="text-xs font-medium text-[var(--color-muted)]">Creado</dt>
                                  <dd className="text-[var(--color-text)]">
                                    {new Date(p.createdAt).toLocaleString('es-CO', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium text-[var(--color-muted)]">Última actualización</dt>
                                  <dd className="text-[var(--color-text)]">
                                    {new Date(p.updatedAt).toLocaleString('es-CO', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })}
                                  </dd>
                                </div>
                              </dl>
                            </Card>

                            <Card className={`lg:col-span-2 ${projectCardShadow}`}>
                              <h3 className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                                <FileText className="h-4 w-4 text-brand" />
                                Espacio de trabajo
                                {detailOwner &&
                                p.id === viewingProjectId &&
                                workspaceNotesEditorSynced &&
                                !notesHtmlEquivalentForSave(notesDraft, savedWorkspaceNotesBaseline) ? (
                                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold normal-case text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                                    (Borrador)
                                  </span>
                                ) : null}
                              </h3>
                              {!user?.id ? (
                                <p className="text-sm text-[var(--color-muted)]">
                                  Inicia sesión para ver notas y archivos del equipo.
                                </p>
                              ) : isPanelLoading ? (
                                <p className="text-sm text-[var(--color-muted)]">Cargando espacio de trabajo...</p>
                              ) : isPanelError ? (
                                <p className="text-sm text-[var(--color-muted)]">
                                  {panelForbidden
                                    ? 'No tienes acceso al espacio de trabajo de este proyecto (solo miembros).'
                                    : 'No se pudo cargar el espacio de trabajo. Intenta de nuevo.'}
                                </p>
                              ) : projectPanel ? (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    {detailOwner ? (
                                      <ProjectWorkspaceNotesEditor
                                        key={viewingProjectId}
                                        initialContent={projectPanel.project.workspaceNotes ?? ''}
                                        onHtmlChange={handleWorkspaceNotesHtml}
                                        onSave={() =>
                                          saveWorkspaceNotesMutation.mutate({
                                            projectId: p.id,
                                            notes: isEmptyWorkspaceNotesHtml(notesDraft)
                                              ? null
                                              : notesDraft.slice(0, 50_000)
                                          })
                                        }
                                        saving={saveWorkspaceNotesMutation.isPending}
                                        onUploadImage={uploadProjectImageForNotes}
                                        uploadPending={uploadAttachmentMutation.isPending}
                                        onDeleteImageAttachment={deleteImageAttachmentForNotes}
                                      />
                                    ) : (
                                      <ProjectWorkspaceNotesReadonly
                                        html={projectPanel.project.workspaceNotes}
                                      />
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </Card>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <Card className={projectCardShadow}>
                      <p className="text-sm text-[var(--color-muted)]">No se encontró el proyecto.</p>
                      <Button type="button" variant="secondary" className="mt-4" onClick={() => setProjectView(null)}>
                        Volver a proyectos
                      </Button>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar derecho: Laboratorio o panel del proyecto abierto */}
        <aside className="hidden w-full flex-col lg:flex lg:z-10" style={{ position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto py-4 px-4">
            <AnimatePresence mode="wait">
              {!viewingProjectId ? (
                <motion.div
                  key="lab-sidebar"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={projectViewTransition}
                  className="space-y-6"
                >
                  <Card padded={false} className={`${sidebarPanelClass} space-y-3 p-3`}>
                    <div className="flex items-center gap-2 px-1">
                      <Rocket className="h-4 w-4 text-brand" />
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">Laboratorio</h3>
                    </div>
                    <p className="px-1 text-xs text-[var(--color-muted)]">
                      Visualiza el estado de cada iniciativa y cambia de fase con un clic.
                    </p>
                    <div className="grid grid-cols-3 gap-2.5 px-1 pb-1">
                      {statusOrder.map((status) => {
                        const { icon: Icon, accent, badge } = statusDisplay[status];
                        const isActive = statusFilter === status;
                        const shadowStyle = laboratorioStatusShadows[status];
                        return (
                          <div
                            key={status}
                            className={`relative group ${!isActive ? 'laboratorio-metric-soft-drift' : ''}`}
                            style={
                              !isActive ? { animationDelay: laboratorioMotionDelay[status] } : undefined
                            }
                          >
                            <button
                              type="button"
                              onClick={() => setStatusFilter((prev) => (prev === status ? 'all' : status))}
                              className={`relative flex min-h-[80px] w-full flex-col items-center justify-center rounded-2xl p-2.5 pb-2 transition-all duration-ui ease-ui focus:outline-none ${laboratorioCardSurface} ${
                                isActive
                                  ? `${shadowStyle.active} scale-[1.05]`
                                  : `${shadowStyle.idle} ${shadowStyle.hover} hover:scale-[1.03]`
                              }`}
                            >
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-ui group-hover:scale-110 group-hover:rotate-3 ${badge}`}
                              >
                                <Icon className={`h-5 w-5 ${accent} transition-transform group-hover:scale-110`} />
                              </span>
                              <p
                                className={`mt-2 text-xl font-bold transition-colors ${
                                  status === 'draft'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : status === 'in_progress'
                                      ? 'text-sena-dark dark:text-sena-green'
                                      : 'text-brand dark:text-emerald-400'
                                }`}
                              >
                                {stats[status]}
                              </p>
                              <p
                                className={`mt-1 text-[9px] font-semibold uppercase tracking-wide transition-all duration-ui opacity-0 group-hover:opacity-100 ${
                                  status === 'draft'
                                    ? 'text-amber-700/80 dark:text-amber-400/80'
                                    : status === 'in_progress'
                                      ? 'text-sena-dark/80 dark:text-sena-green/80'
                                      : 'text-brand/80 dark:text-emerald-400/80'
                                }`}
                              >
                                {statusLabels[status]}
                              </p>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key={`project-sidebar-${viewingProjectId}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14 }}
                  transition={projectViewTransition}
                  className="space-y-6"
                >
                  <Card padded={false} className={`${sidebarPanelClass} space-y-3 p-3`}>
                    <div className="flex items-center gap-2 px-1">
                      <Users className="h-4 w-4 text-brand" />
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">Equipo de trabajo</h3>
                    </div>
                    {!user?.id ? (
                      <p className="px-1 text-xs text-[var(--color-muted)]">Inicia sesión para ver al equipo.</p>
                    ) : isPanelLoading ? (
                      <p className="px-1 text-xs text-[var(--color-muted)]">Cargando equipo...</p>
                    ) : isPanelError ? (
                      <p className="px-1 text-xs text-[var(--color-muted)]">
                        {panelForbidden ? 'Sin acceso al equipo (solo miembros).' : 'No se pudo cargar el equipo.'}
                      </p>
                    ) : sortedPanelMembers.length === 0 ? (
                      <p className="px-1 text-xs text-[var(--color-muted)]">No hay miembros registrados.</p>
                    ) : (
                      <ul className="space-y-2 px-1">
                        {sortedPanelMembers.map((m) => {
                          const av = m.avatarUrl ? resolveAssetUrl(m.avatarUrl) : null;
                          return (
                            <li
                              key={m.userId}
                              className={`flex items-center gap-2 rounded-2xl px-2 py-2 ${sidebarRowClass}`}
                            >
                              {av ? (
                                <img src={av} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                                  {(m.firstName || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{m.fullName}</p>
                                <p className="text-[10px] text-[var(--color-muted)]">
                                  {memberRoleLabel(m.role)}
                                  {m.isOwner ? ' · Dueño' : ''}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* Diálogo para editar proyecto */}
      <GlassDialog open={!!projectToEdit} onClose={closeEditDialog} size="md">
        {projectToEdit ? (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
              <Edit className="h-3 w-3" />
              <span>Editar Proyecto</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Editar proyecto
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Actualiza la información de tu proyecto.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((values: ProjectValues) => {
              if (projectToEdit) {
                editProjectMutation.mutate({
                  id: projectToEdit.id,
                  data: {
                    title: values.title,
                    description: values.description,
                    repositoryUrl: values.repositoryUrl || undefined,
                    status: values.status
                  },
                  coverFile: editCoverFile
                });
              }
            })}
            className="space-y-4"
          >
            <input
              ref={editCoverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEditCoverChange}
            />
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--color-text)]">Foto del proyecto</span>
              <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10">
                <div className="relative flex h-36 w-full items-center justify-center bg-gradient-to-br from-brand/15 to-emerald-500/10">
                  {(editCoverPreviewUrl || resolveAssetUrl(projectToEdit.coverImage ?? null)) ? (
                    <img
                      src={
                        editCoverPreviewUrl ??
                        resolveAssetUrl(projectToEdit.coverImage ?? null) ??
                        ''
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="relative z-[1] shadow-md"
                    leftIcon={<ImagePlus className="h-4 w-4" />}
                    onClick={() => editCoverInputRef.current?.click()}
                    disabled={editProjectMutation.isPending}
                  >
                    {projectToEdit.coverImage || editCoverFile
                      ? 'Cambiar foto'
                      : 'Subir foto'}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-[var(--color-muted)]">
                Formatos de imagen. Se aplicará al guardar los cambios.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-project-title" className="block text-xs font-medium text-[var(--color-text)]">
                Título del proyecto
              </label>
              <Input
                id="edit-project-title"
                placeholder="Ej: Sistema de gestión, App móvil, API REST"
                error={errors.title?.message}
                maxLength={TITLE_MAX_LENGTH}
                {...register('title')}
                className="text-base rounded-2xl"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-muted)]">
                <span>
                  {watch('title')?.length || 0} / {TITLE_MAX_LENGTH} caracteres
                </span>
                {watch('title') && watch('title').length > 0 && (
                  <span>
                    {TITLE_MAX_LENGTH - (watch('title')?.length || 0)} restantes
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-project-description" className="block text-xs font-medium text-[var(--color-text)]">
                Descripción (opcional)
              </label>
              <TextArea
                id="edit-project-description"
                rows={4}
                placeholder="Describe el objetivo y alcance del proyecto..."
                error={errors.description?.message}
                maxLength={DESCRIPTION_MAX_LENGTH}
                {...register('description')}
                className="text-sm rounded-2xl resize-none"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-muted)]">
                <span>
                  {watch('description')?.length ?? 0} / {DESCRIPTION_MAX_LENGTH} caracteres
                </span>
                {(watch('description')?.length ?? 0) > 0 && (
                  <span>
                    {DESCRIPTION_MAX_LENGTH - (watch('description')?.length ?? 0)} restantes
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-project-repository" className="block text-xs font-medium text-[var(--color-text)]">
                Repositorio (opcional)
              </label>
              <Input
                id="edit-project-repository"
                placeholder="https://github.com/usuario/repositorio"
                error={errors.repositoryUrl?.message}
                {...register('repositoryUrl')}
                className="text-sm rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-project-status" className="block text-xs font-medium text-[var(--color-text)]">
                Estado
              </label>
              <select
                id="edit-project-status"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                {...register('status')}
              >
                <option value="draft">Planificación</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completado</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeEditDialog}
                disabled={isSubmitting || editProjectMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isSubmitting || editProjectMutation.isPending}
                disabled={!watch('title')?.trim()}
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
        ) : null}
      </GlassDialog>

      {/* Diálogo para confirmar eliminación */}
      <GlassDialog
        open={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        size="sm"
        preventCloseOnBackdrop={deleteProjectMutation.isPending}
        overlayClassName="delete-post-overlay-warning"
        contentClassName="glass-dialog-delete"
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-500">
              <Trash2 className="h-3 w-3" />
              <span>Eliminar Proyecto</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              ¿Eliminar proyecto?
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Esta acción no se puede deshacer. El proyecto "{projectToDelete?.title}" será eliminado permanentemente.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setProjectToDelete(null)}
              disabled={deleteProjectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="!bg-red-500 !text-white !border-red-500/60 !shadow-[0_2px_8px_rgba(0,0,0,0.14)] hover:!bg-red-600 hover:!shadow-[0_4px_14px_rgba(0,0,0,0.2)] focus:!ring-red-400/60"
              onClick={() => {
                if (projectToDelete) {
                  deleteProjectMutation.mutate(projectToDelete.id);
                }
              }}
              loading={deleteProjectMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </GlassDialog>
    </DashboardLayout>
  );
};
