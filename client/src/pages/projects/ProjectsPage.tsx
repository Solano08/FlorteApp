import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { projectService } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { FolderKanban, GitBranch, Sparkles, Milestone, Rocket } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(3, 'El título es obligatorio'),
  description: z.string().max(600).optional(),
  repositoryUrl: z.string().url('Ingresa un repositorio válido').optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional()
});

type ProjectValues = z.infer<typeof projectSchema>;

const statusLabels: Record<'draft' | 'in_progress' | 'completed', string> = {
  draft: 'Planificación',
  in_progress: 'En progreso',
  completed: 'Completado'
};

const statusOrder: Array<'draft' | 'in_progress' | 'completed'> = ['draft', 'in_progress', 'completed'];

const milestoneTips = [
  'Define un objetivo claro y entregables medibles.',
  'Comparte avances con tu grupo al menos una vez por semana.',
  'Documenta aprendizajes clave en la biblioteca del proyecto.'
];

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
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const stats = useMemo(() => {
    return statusOrder.reduce(
      (acc, status) => ({
        ...acc,
        [status]: projects.filter((project) => project.status === status).length
      }),
      { draft: 0, in_progress: 0, completed: 0 }
    );
  }, [projects]);

  return (
    <DashboardLayout
      title="Proyectos"
      subtitle="Gestiona tus iniciativas, conecta repositorios y da seguimiento a su progreso."
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                <Rocket className="h-4 w-4" /> Laboratorio de proyectos
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                Impulsa tu proyecto desde la idea hasta la demo final
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Centraliza requerimientos, tareas y repositorios para trabajar con tu equipo de forma ágil.
              </p>
            </div>
            <div className="grid w-full max-w-xl gap-4 sm:grid-cols-3">
              {statusOrder.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter((prev) => (prev === status ? 'all' : status))}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    statusFilter === status
                      ? 'border-sena-green bg-sena-green/10 text-sena-green'
                      : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-sena-green/50'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide">{statusLabels[status]}</p>
                  <p className="mt-1 text-2xl font-semibold">{stats[status]}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[2fr_1.1fr]">
          <div className="space-y-4">
            {isLoading && <p className="text-sm text-[var(--color-muted)]">Cargando proyectos...</p>}
            {!isLoading && filteredProjects.length === 0 && (
              <Card>
                <p className="text-sm text-[var(--color-muted)]">
                  No hay proyectos en este estado todavía. Crea uno nuevo o cambia el filtro.
                </p>
              </Card>
            )}
            {filteredProjects.map((project) => (
              <Card key={project.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-sena-green/10 p-2 text-sena-green">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">{project.title}</h3>
                    <p className="text-xs text-[var(--color-muted)]">
                      Actualizado el {new Date(project.updatedAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                    {statusLabels[project.status]}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
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
                <div className="flex flex-wrap gap-2">
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

          <div className="space-y-4">
            <Card>
              <h2 className="text-base font-semibold text-[var(--color-text)]">Registrar nuevo proyecto</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Define objetivos, repositorio y estado para mantener a tu equipo enfocado.
              </p>
              <form
                className="mt-4 space-y-4"
                onSubmit={handleSubmit((values) => {
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
                <Input label="Título" error={errors.title?.message} {...register('title')} />
                <TextArea label="Descripción" rows={4} error={errors.description?.message} {...register('description')} />
                <Input
                  label="Repositorio"
                  placeholder="https://github.com/..."
                  error={errors.repositoryUrl?.message}
                  {...register('repositoryUrl')}
                />
                <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
                  Estado inicial
                  <select
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
                    {...register('status')}
                  >
                    <option value="draft">Planificación</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </label>
                <Button type="submit" className="w-full" loading={isSubmitting || createProjectMutation.isPending}>
                  Registrar proyecto
                </Button>
              </form>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Hitos recomendados</h3>
                <Milestone className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-3">
                {milestoneTips.map((tip, index) => (
                  <div key={tip} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text)]">
                    <span className="mr-2 rounded-full bg-sena-green/10 px-2 py-0.5 text-xs font-semibold text-sena-green">
                      Hito {index + 1}
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Eventos del proyecto</h3>
                <Sparkles className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
                <p>📅 Demo Day proyectos SENA · 05 Nov · 5:00 PM</p>
                <p>🧪 Testing colaborativo · 12 Nov · 3:00 PM</p>
                <p>🎯 Retrospectiva de aprendizajes · 22 Nov · 10:00 AM</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
