import { useMemo, useState } from 'react';
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
  X
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
    accent: 'text-sena-green',
    helper: 'Comparte resultados y aprendizajes.',
    badge: 'bg-sena-green/15 text-sena-green'
  }
};

export const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project: Project) => project.status === statusFilter);
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
  }, [projects, statusFilter, searchTerm]);

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

  return (
    <DashboardLayout
      contentClassName="overflow-y-auto py-4 hide-scrollbar mx-0 px-4 sm:px-6 lg:px-10 xl:px-16"
    >
      <div className="mx-auto grid w-full gap-4 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,360px)]">
        {/* Sidebar izquierdo: Actividad rápida y Tus proyectos */}
        <aside className="hidden w-full flex-col gap-5 lg:flex">
          <Card className="glass-liquid p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20">
                <Sparkles className="h-4 w-4 text-sena-green" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Actividad rápida</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
              Accede en segundos a proyectos, grupos y espacios clave de tu comunidad.
            </p>
            <div className="mt-5 space-y-2.5">
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-between px-4 py-2.5 transition-all hover:scale-[1.02] hover:shadow-md"
                onClick={() => navigate('/explore')}
              >
                <span>Explorar proyectos</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 transition-all hover:scale-[1.02]"
                onClick={() => navigate('/projects')}
              >
                <span>Revisar mis proyectos</span>
                <FolderKanban className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="glass-liquid p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20">
                <FolderKanban className="h-4 w-4 text-sena-green" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Tus proyectos</h3>
            </div>
            <div className="mt-4 space-y-2.5">
              {isLoading ? (
                <p className="text-sm text-[var(--color-muted)]">Cargando proyectos...</p>
              ) : learningHighlights.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  Registra tus proyectos para seguir tu progreso.
                </p>
              ) : (
                learningHighlights.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="group w-full rounded-xl glass-liquid px-4 py-3 text-left transition-all hover:border-sena-green/40 hover:bg-white/40 dark:hover:bg-white/10 hover:shadow-md hover:scale-[1.01]"
                  >
                    <p className="truncate text-sm font-semibold text-[var(--color-text)] group-hover:text-sena-green transition-colors">
                      {project.title}
                    </p>
                    <p className="mt-1 text-xs capitalize text-[var(--color-muted)]">
                      {statusLabels[project.status]}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>
        </aside>

        {/* Contenido principal */}
        <section className="mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-5">
          {/* Barra de búsqueda */}
          <Card className="glass-liquid shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="relative mx-auto w-full max-w-3xl">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar proyectos, grupos o hashtags..."
                className="pr-24 text-center placeholder:text-center rounded-2xl border-white/50 dark:border-white/15 focus:border-sena-green/40 focus:ring-2 focus:ring-sena-green/20"
              />
              <Button
                type="button"
                variant="secondary"
                className="absolute bottom-2 right-2 px-3 py-2 text-xs shadow-[0_4px_12px_rgba(57,169,0,0.2)] hover:shadow-[0_6px_16px_rgba(57,169,0,0.3)] transition-all"
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filtros
              </Button>
            </div>
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
                {filteredProjects.map((project: Project) => (
                  <Card
                    key={project.id}
                    className="group flex flex-col space-y-4 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:scale-[1.02] cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20 p-2.5 text-sena-green transition-transform group-hover:scale-110">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-[var(--color-text)] group-hover:text-sena-green transition-colors">
                          {project.title}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Actualizado el {new Date(project.updatedAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <span className="ml-auto flex-shrink-0 rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green ring-1 ring-sena-green/20">
                        {statusLabels[project.status]}
                      </span>
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
                        className="inline-flex items-center gap-2 text-sm font-medium text-sena-green hover:text-emerald-600 transition-colors"
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
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar derecho: Laboratorio */}
        <aside className="hidden w-full flex-col gap-5 lg:flex">
          <Card className="glass-liquid p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20">
                <Rocket className="h-4 w-4 text-sena-green" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Laboratorio</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
              Visualiza el estado de cada iniciativa y cambia de fase con un clic.
            </p>
            <div className="mt-5 space-y-3">
              {statusOrder.map((status) => {
                const { icon: Icon, accent, helper, badge } = statusDisplay[status];
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter((prev) => (prev === status ? 'all' : status))}
                    className={`group relative flex h-full flex-col rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-sena-green/40 bg-gradient-to-br from-sena-green/10 to-emerald-500/5 shadow-[0_8px_24px_rgba(57,169,0,0.15)] scale-[1.02]'
                        : 'border-white/30 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 hover:border-sena-green/30 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${badge}`}>
                        <Icon className={`h-5 w-5 ${accent}`} />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                          {statusLabels[status]}
                        </p>
                        <p className="text-2xl font-bold text-[var(--color-text)]">{stats[status]}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--color-muted)]">{helper}</p>
                  </button>
                );
              })}
            </div>
          </Card>
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
            <div className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sena-green">
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
                  {watch('description')?.length || 0} / {DESCRIPTION_MAX_LENGTH} caracteres
                </span>
                {watch('description') && watch('description').length > 0 && (
                  <span>
                    {DESCRIPTION_MAX_LENGTH - (watch('description')?.length || 0)} restantes
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
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
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
    </DashboardLayout>
  );
};
