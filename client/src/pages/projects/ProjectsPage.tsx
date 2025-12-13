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
import {
  ClipboardList,
  Hammer,
  CheckCircle,
  FolderKanban,
  GitBranch,
  Rocket,
  Sparkles,
  ArrowUpRight,
  Users,
  Filter
} from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(3, 'El titulo es obligatorio'),
  description: z.string().max(600).optional(),
  repositoryUrl: z.string().url('Ingresa un repositorio valido').optional(),
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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.listProjects
  });

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
          <Card className="glass-liquid p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Actividad rapida</h3>
              <Sparkles className="h-4 w-4 text-sena-green" />
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Accede en segundos a proyectos, grupos y espacios clave de tu comunidad.
            </p>
            <div className="mt-5 space-y-3">
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-between px-4 py-2.5"
                onClick={() => navigate('/explore')}
              >
                Explorar proyectos
                <ArrowUpRight className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between px-4 py-2.5"
                onClick={() => navigate('/groups')}
              >
                Encontrar grupos
                <Users className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between px-4 py-2.5"
                onClick={() => navigate('/projects')}
              >
                Revisar mis proyectos
                <FolderKanban className="h-5 w-5" />
              </Button>
            </div>
          </Card>

          <Card className="glass-liquid p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Tus proyectos</h3>
              <Sparkles className="h-4 w-4 text-sena-green" />
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                <p className="text-sm text-[var(--color-muted)]">Cargando proyectos...</p>
              ) : learningHighlights.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  Registra tus proyectos para seguir tu progreso.
                </p>
              ) : (
                learningHighlights.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl glass-liquid px-4 py-3 transition hover:border-sena-green/40 hover:bg-white/30 dark:hover:bg-white/10"
                  >
                    <p className="truncate text-base font-semibold text-[var(--color-text)]">{project.title}</p>
                    <p className="mt-1 text-xs capitalize text-[var(--color-muted)]">
                      {statusLabels[project.status]}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>

        {/* Contenido principal */}
        <section className="mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-5">
          {/* Barra de búsqueda */}
          <Card>
            <div className="relative mx-auto w-full max-w-3xl">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar proyectos, grupos o hashtags..."
                className="pr-24 text-center placeholder:text-center"
              />
              <Button
                type="button"
                variant="secondary"
                className="absolute bottom-2 right-2 px-3 py-2 text-xs shadow-[0_10px_20px_rgba(18,55,29,0.15)]"
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filtros
              </Button>
            </div>
          </Card>

          {/* Formulario de nuevo proyecto */}
          <Card>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Registrar nuevo proyecto</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Define objetivos, repositorio y estado para mantener a tu equipo enfocado.
            </p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={handleSubmit((values: ProjectValues) => {
                createProjectMutation.mutate(
                  {
                    title: values.title,
                    description: values.description,
                    repositoryUrl: values.repositoryUrl,
                    status: values.status
                  },
                  {
                    onSuccess: () => reset()
                  }
                );
              })}
            >
              <div className="sm:col-span-2">
                <Input label="Titulo" error={errors.title?.message} {...register('title')} />
              </div>
              <div className="sm:col-span-2">
                <TextArea label="Descripcion" rows={3} error={errors.description?.message} {...register('description')} />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Repositorio"
                  placeholder="https://github.com/..."
                  error={errors.repositoryUrl?.message}
                  {...register('repositoryUrl')}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
                  Estado inicial
                  <select
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
                    {...register('status')}
                  >
                    <option value="draft">Planificacion</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </label>
              </div>
              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <Button type="submit" className="w-full" loading={isSubmitting || createProjectMutation.isPending}>
                  Registrar proyecto
                </Button>
              </div>
            </form>
          </Card>

          {/* Lista de proyectos */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--color-text)]">Tus proyectos</h2>
              {statusFilter !== 'all' && (
                <Button variant="secondary" size="sm" onClick={() => setStatusFilter('all')}>
                  Ver todos
                </Button>
              )}
            </div>

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
                  <Card key={project.id} className="flex flex-col space-y-4 transition-shadow hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full bg-sena-green/10 p-2 text-sena-green">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-[var(--color-text)]">{project.title}</h3>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Actualizado el {new Date(project.updatedAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <span className="ml-auto flex-shrink-0 rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                        {statusLabels[project.status]}
                      </span>
                    </div>

                    <p className="flex-1 text-sm text-[var(--color-muted)] line-clamp-3">
                      {project.description ?? 'Describe el objetivo y el alcance del proyecto para alinear a tu equipo.'}
                    </p>

                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-sena-green hover:underline"
                      >
                        <GitBranch className="h-4 w-4" />
                        Ver repositorio
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-2">
                      {statusOrder.map((status) => (
                        <Button
                          key={status}
                          variant={project.status === status ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() =>
                            updateProjectMutation.mutate({
                              id: project.id,
                              status
                            })
                          }
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
          <Card className="glass-liquid p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Laboratorio</h3>
              <Rocket className="h-4 w-4 text-sena-green" />
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
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
                    className={`group relative flex h-full flex-col rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-sena-green bg-sena-green/10 shadow-[0_12px_24px_rgba(18,55,29,0.14)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-sena-green/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge}`}>
                        <Icon className={`h-4 w-4 ${accent}`} />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                          {statusLabels[status]}
                        </p>
                        <p className="text-xl font-semibold text-[var(--color-text)]">{stats[status]}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--color-muted)] leading-relaxed">{helper}</p>
                    {/* Tooltip con el nombre al hacer hover */}
                    <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-[0_8px_16px_rgba(15,23,42,0.35)] transition group-hover:opacity-100 whitespace-nowrap z-10">
                      {statusLabels[status]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </DashboardLayout>
  );
};
