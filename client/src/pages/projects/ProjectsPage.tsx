import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { projectService } from '../../services/projectService';
import { Project } from '../../types/project';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { ClipboardList, Hammer, CheckCircle, FolderKanban, GitBranch, Rocket } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');

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
    if (statusFilter === 'all') return projects;
    return projects.filter((project: Project) => project.status === statusFilter);
  }, [projects, statusFilter]);

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

  return (
    <DashboardLayout title="Proyectos" subtitle="Gestiona tus iniciativas y su avance real en un solo lugar.">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                <Rocket className="h-4 w-4" /> Laboratorio de proyectos
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-text)]">Planifica, ejecuta y cierra con foco.</h2>
              <p className="text-sm text-[var(--color-muted)]">
                Visualiza el estado de cada iniciativa y cambia de fase con un clic.
              </p>
            </div>

            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
              {statusOrder.map((status) => {
                const { icon: Icon, accent, helper, badge } = statusDisplay[status];
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter((prev) => (prev === status ? 'all' : status))
                    }
                    className={`group flex h-full flex-col rounded-2xl border px-4 py-3 text-left transition ${
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
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

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

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
 origin/Test
            </h2>
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
      </div>
    </DashboardLayout>
  );
};
