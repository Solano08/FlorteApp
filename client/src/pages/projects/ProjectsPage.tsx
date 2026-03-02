import { useMemo, useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { projectService } from '../../services/projectService';
import { Project } from '../../types/project';
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
  X,
  MoreHorizontal,
  Edit,
  Trash2
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

const statusLabels: Record<'draft' | 'in_progress' | 'completed', string> = {
  draft: 'Planificacion',
  in_progress: 'En progreso',
  completed: 'Completado'
};

const statusOrder: Array<'draft' | 'in_progress' | 'completed'> = ['draft', 'in_progress', 'completed'];

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
    accent: 'text-blue-500',
    helper: 'Coordina tareas, commits y avances.',
    badge: 'bg-blue-50/60 text-blue-600'
  },
  completed: {
    icon: CheckCircle,
    accent: 'text-brand',
    helper: 'Comparte resultados y aprendizajes.',
    badge: 'bg-brand/15 text-brand'
  }
};

export const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory>('all');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.listProjects
  });

  const createProjectMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['projects', 'me'] }).catch(() => {});
      reset();
      setShowCreateDialog(false);
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'in_progress' | 'completed' }) =>
      projectService.updateProject(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
    }
  });

  const editProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string; repositoryUrl?: string; status?: 'draft' | 'in_progress' | 'completed' } }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      setProjectToEdit(null);
      reset();
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {});
      setProjectToDelete(null);
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

  const currentStatus = watch('status') ?? 'draft';
  
  // Proyectos destacados para el sidebar
  const learningHighlights = useMemo(() => {
    return projects.slice(0, 3);
  }, [projects]);

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
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Actividad rápida</h3>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => navigate('/explore')}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left glass-liquid transition-all duration-300 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(57,169,0,0.15)] active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 dark:bg-white/10 text-brand transition-all duration-300 group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">Explorar proyectos</span>
                </button>
                <button
                  onClick={() => navigate('/projects')}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left glass-liquid transition-all duration-300 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(57,169,0,0.15)] active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 dark:bg-white/10 text-brand transition-all duration-300 group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">Revisar mis proyectos</span>
                </button>
              </div>
            </div>

            {/* Tus proyectos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
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
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left glass-liquid transition-all duration-300 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(57,169,0,0.15)] active:scale-[0.98]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 dark:bg-white/10 text-brand transition-all duration-300 group-hover:bg-white dark:group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(57,169,0,0.3)]">
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
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <section className="mx-auto flex min-w-0 w-full flex-col gap-3 sm:gap-4 lg:gap-5 pb-16 sm:pb-20 px-3 sm:px-4 relative z-10 hide-scrollbar" style={{ width: '100%', maxWidth: '100%', overflowX: 'visible', boxShadow: 'none', WebkitBoxShadow: 'none', overflowY: 'auto', height: 'calc(100vh - 56px)', alignSelf: 'flex-start' }}>
          {/* Barra de búsqueda */}
          <Card className="glass-liquid shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar proyectos, grupos o hashtags..."
                className="flex-1 rounded-2xl border-white/50 dark:border-white/15 focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className={`px-4 py-2 text-xs shadow-[0_4px_12px_rgba(57,169,0,0.2)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.3)] transition-all ${
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
                        className={`flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 ${
                          isSelected
                            ? 'bg-brand/20 ring-2 ring-brand/40 shadow-lg'
                            : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70'
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
          <Card className="glass-liquid shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">Tus proyectos</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Gestiona y organiza todos tus proyectos en un solo lugar.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
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
              <Card>
                <p className="text-sm text-[var(--color-muted)]">Cargando proyectos...</p>
              </Card>
            )}

            {!isLoading && filteredProjects.length === 0 && (
              <Card>
                <p className="text-sm text-[var(--color-muted)]">
                  No hay proyectos en este estado todavia. Crea uno nuevo o cambia el filtro.
                </p>
              </Card>
            )}

            {!isLoading && filteredProjects.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project: Project) => {
                  const isOwner = user?.id === project.ownerId;
                  return (
                  <Card
                    key={project.id}
                    className="group relative flex flex-col space-y-4 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:scale-[1.02] cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {/* Botón de menú en la esquina superior derecha */}
                    {isOwner && (
                      <div className="absolute right-2 top-2 z-10" ref={(el) => { menuRefs.current[project.id] = el; }}>
                        <button
                          type="button"
                          onClick={(e) => handleMenuToggle(project.id, e)}
                          className="flex-shrink-0 rounded-lg p-1.5 text-[var(--color-muted)] transition-all hover:bg-white/40 dark:hover:bg-slate-700/40 hover:text-[var(--color-text)] opacity-0 group-hover:opacity-100"
                          aria-label="Opciones del proyecto"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {openMenuId === project.id && (
                          <div className="absolute right-0 top-8 z-50 w-48 rounded-xl glass-liquid-strong border border-white/20 p-1 shadow-lg">
                            <button
                              onClick={(e) => handleEditProject(project, e)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text)] transition-colors hover:bg-white/20"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(project, e)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start gap-3 pr-8">
                      <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-brand/20 to-emerald-500/20 p-3 text-brand transition-transform group-hover:scale-110">
                        <FolderKanban className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-[var(--color-text)] group-hover:text-brand transition-colors">
                          {project.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                          Actualizado el {new Date(project.updatedAt).toLocaleDateString('es-CO')}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand ring-1 ring-brand/20">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProjectMutation.mutate({
                              id: project.id,
                              status
                            });
                          }}
                          className="transition-all hover:scale-105"
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
        </section>

        {/* Sidebar derecho: Laboratorio */}
        <aside className="hidden w-full flex-col lg:flex lg:z-10" style={{ position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <div className="flex flex-col space-y-6 py-4 px-4">
            {/* Laboratorio */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Rocket className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Laboratorio</h3>
              </div>
              <p className="px-2 text-xs text-[var(--color-muted)]">
                Visualiza el estado de cada iniciativa y cambia de fase con un clic.
              </p>
              <div className="grid grid-cols-3 gap-2.5 px-2 pb-2">
                {statusOrder.map((status) => {
                  const { icon: Icon, accent, helper, badge } = statusDisplay[status];
                  const isActive = statusFilter === status;
                  const statusConfig = {
                    draft: {
                      gradient: 'from-amber-50/80 via-amber-100/60 to-orange-50/80 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-orange-950/30',
                      border: 'border-amber-300/50 dark:border-amber-700/40',
                      borderHover: 'hover:border-amber-400/60 dark:hover:border-amber-600/50',
                      shadow: 'shadow-[0_4px_16px_rgba(245,158,11,0.2)] dark:shadow-[0_4px_16px_rgba(245,158,11,0.15)]',
                      shadowHover: 'hover:shadow-[0_6px_20px_rgba(245,158,11,0.3)] dark:hover:shadow-[0_6px_20px_rgba(245,158,11,0.2)]',
                      activeShadow: 'shadow-[0_8px_24px_rgba(245,158,11,0.25)] dark:shadow-[0_8px_24px_rgba(245,158,11,0.2)]'
                    },
                    in_progress: {
                      gradient: 'from-blue-50/80 via-blue-100/60 to-cyan-50/80 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-cyan-950/30',
                      border: 'border-blue-300/50 dark:border-blue-700/40',
                      borderHover: 'hover:border-blue-400/60 dark:hover:border-blue-600/50',
                      shadow: 'shadow-[0_4px_16px_rgba(59,130,246,0.2)] dark:shadow-[0_4px_16px_rgba(59,130,246,0.15)]',
                      shadowHover: 'hover:shadow-[0_6px_20px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_6px_20px_rgba(59,130,246,0.2)]',
                      activeShadow: 'shadow-[0_8px_24px_rgba(59,130,246,0.25)] dark:shadow-[0_8px_24px_rgba(59,130,246,0.2)]'
                    },
                    completed: {
                      gradient: 'from-brand/20 via-emerald-100/60 to-green-50/80 dark:from-brand/30 dark:via-emerald-900/20 dark:to-green-950/30',
                      border: 'border-brand/40 dark:border-emerald-700/40',
                      borderHover: 'hover:border-brand/50 dark:hover:border-emerald-600/50',
                      shadow: 'shadow-[0_4px_16px_rgba(57,169,0,0.2)] dark:shadow-[0_4px_16px_rgba(57,169,0,0.15)]',
                      shadowHover: 'hover:shadow-[0_6px_20px_rgba(57,169,0,0.3)] dark:hover:shadow-[0_6px_20px_rgba(57,169,0,0.2)]',
                      activeShadow: 'shadow-[0_8px_24px_rgba(57,169,0,0.25)] dark:shadow-[0_8px_24px_rgba(57,169,0,0.2)]'
                    }
                  };
                  const config = statusConfig[status];
                  return (
                    <div key={status} className="relative group">
                      <button
                        type="button"
                        onClick={() => setStatusFilter((prev) => (prev === status ? 'all' : status))}
                        className={`relative flex flex-col items-center justify-center rounded-2xl border p-2.5 pb-2 min-h-[80px] w-full transition-all duration-300 bg-gradient-to-br ${config.gradient} ${
                          isActive
                            ? `${config.border} ${config.activeShadow} scale-[1.05] ring-2 ring-offset-2 ring-offset-transparent ${
                                status === 'draft' ? 'ring-amber-400/30 dark:ring-amber-600/30' :
                                status === 'in_progress' ? 'ring-blue-400/30 dark:ring-blue-600/30' :
                                'ring-brand/30 dark:ring-emerald-600/30'
                              }`
                            : `${config.border} ${config.shadow} ${config.borderHover} ${config.shadowHover} hover:scale-[1.03]`
                        }`}
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${badge} ${
                          isActive ? 'shadow-lg' : ''
                        }`}>
                          <Icon className={`h-5 w-5 ${accent} transition-transform group-hover:scale-110`} />
                        </span>
                        <p className={`mt-2 text-xl font-bold transition-colors ${
                          status === 'draft' ? 'text-amber-700 dark:text-amber-400' :
                          status === 'in_progress' ? 'text-blue-700 dark:text-blue-400' :
                          'text-brand dark:text-emerald-400'
                        }`}>{stats[status]}</p>
                        {/* Nombre del estado en la parte inferior - solo visible en hover */}
                        <p className={`mt-1 text-[9px] font-semibold uppercase tracking-wide transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          status === 'draft' ? 'text-amber-700/80 dark:text-amber-400/80' :
                          status === 'in_progress' ? 'text-blue-700/80 dark:text-blue-400/80' :
                          'text-brand/80 dark:text-emerald-400/80'
                        }`}>
                          {statusLabels[status]}
                        </p>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Diálogo para crear nuevo proyecto */}
      <GlassDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          reset();
        }}
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
              <Plus className="h-3 w-3" />
              <span>Nuevo Proyecto</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Registrar nuevo proyecto
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Define objetivos, repositorio y estado para mantener a tu equipo enfocado.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((values: ProjectValues) => {
              createProjectMutation.mutate({
                title: values.title,
                description: values.description,
                repositoryUrl: values.repositoryUrl || undefined,
                status: values.status
              });
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="project-title" className="block text-xs font-medium text-[var(--color-text)]">
                Título del proyecto
              </label>
              <Input
                id="project-title"
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
              <label htmlFor="project-description" className="block text-xs font-medium text-[var(--color-text)]">
                Descripción (opcional)
              </label>
              <TextArea
                id="project-description"
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
              <label htmlFor="project-repository" className="block text-xs font-medium text-[var(--color-text)]">
                Repositorio (opcional)
              </label>
              <Input
                id="project-repository"
                placeholder="https://github.com/usuario/repositorio"
                error={errors.repositoryUrl?.message}
                {...register('repositoryUrl')}
                className="text-sm rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="project-status" className="block text-xs font-medium text-[var(--color-text)]">
                Estado inicial
              </label>
              <select
                id="project-status"
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
                onClick={() => {
                  setShowCreateDialog(false);
                  reset();
                }}
                disabled={isSubmitting || createProjectMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isSubmitting || createProjectMutation.isPending}
                disabled={!watch('title')?.trim()}
              >
                Crear proyecto
              </Button>
            </div>
          </form>
        </div>
      </GlassDialog>

      {/* Diálogo para editar proyecto */}
      <GlassDialog
        open={!!projectToEdit}
        onClose={() => {
          setProjectToEdit(null);
          reset();
        }}
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
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
                  }
                });
              }
            })}
            className="space-y-4"
          >
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
                onClick={() => {
                  setProjectToEdit(null);
                  reset();
                }}
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
      </GlassDialog>

      {/* Diálogo para confirmar eliminación */}
      <GlassDialog
        open={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        size="sm"
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-500">
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
              variant="ghost"
              onClick={() => {
                if (projectToDelete) {
                  deleteProjectMutation.mutate(projectToDelete.id);
                }
              }}
              loading={deleteProjectMutation.isPending}
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </GlassDialog>
    </DashboardLayout>
  );
};
