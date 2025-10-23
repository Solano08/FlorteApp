import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { libraryService } from '../../services/libraryService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Library, BookOpen, Layers, Bookmark } from 'lucide-react';

const resourceSchema = z.object({
  title: z.string().min(3, 'El título es obligatorio'),
  description: z.string().max(500).optional(),
  resourceType: z.enum(['document', 'video', 'link', 'course', 'other']),
  url: z.string().url('Ingresa un enlace válido').optional(),
  tags: z.string().optional()
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

const resourceTypeLabels: Record<ResourceFormValues['resourceType'], string> = {
  document: 'Documento',
  video: 'Video',
  link: 'Enlace',
  course: 'Curso',
  other: 'Otro'
};

const curatedCollections = [
  { id: 'col-1', title: 'Recursos para diseño UX', items: 24 },
  { id: 'col-2', title: 'Aprendizajes de IA aplicada', items: 18 },
  { id: 'col-3', title: 'Plantillas de pitch y demo day', items: 12 }
];

export const LibraryPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceFormValues['resourceType'] | 'all'>('all');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['library', search],
    queryFn: async () => {
      if (!search) {
        return await libraryService.listResources();
      }
      return await libraryService.searchResources(search);
    }
  });

  const createResourceMutation = useMutation({
    mutationFn: libraryService.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => {});
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      description: '',
      resourceType: 'document',
      url: '',
      tags: ''
    }
  });

  const filteredResources = useMemo(() => {
    if (typeFilter === 'all') return resources;
    return resources.filter((resource) => resource.resourceType === typeFilter);
  }, [resources, typeFilter]);

  return (
    <DashboardLayout
      title="Biblioteca"
      subtitle="Comparte y descubre materiales de aprendizaje seleccionados por la comunidad."
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                <BookOpen className="h-4 w-4" /> Curaduría colaborativa
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                Elige tu siguiente recurso para aprender o enseñar
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Encuentra presentaciones, guías, grabaciones de clases y plantillas listas para tus proyectos.
              </p>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-3">
              <Input
                placeholder="Buscar por título, descripción o etiqueta..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {(['all', ...Object.keys(resourceTypeLabels)] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type as ResourceFormValues['resourceType'] | 'all')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      typeFilter === type
                        ? 'bg-sena-green text-white'
                        : 'bg-[var(--color-accent-soft)] text-sena-green hover:bg-sena-green/15'
                    }`}
                  >
                    {type === 'all' ? 'Todos' : resourceTypeLabels[type as ResourceFormValues['resourceType']]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[2fr_1.1fr]">
          <div className="space-y-4">
            {isLoading && <p className="text-sm text-[var(--color-muted)]">Cargando recursos...</p>}
            {!isLoading && filteredResources.length === 0 && (
              <Card>
                <p className="text-sm text-[var(--color-muted)]">
                  No se encontraron recursos con esos criterios. Comparte uno nuevo para inspirar a otros.
                </p>
              </Card>
            )}
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">{resource.title}</h3>
                    <p className="text-xs text-[var(--color-muted)]">
                      Publicado el {new Date(resource.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                    <Library className="h-4 w-4" />
                    {resourceTypeLabels[resource.resourceType]}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text)]">
                  {resource.description ?? 'Este recurso aún no tiene descripción detallada.'}
                </p>
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs text-sena-green">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-sena-green hover:underline"
                    >
                      Abrir recurso
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--color-muted)]">Recurso sin enlace público.</span>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">
                      Guardar
                    </Button>
                    <Button size="sm">Compartir</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="text-base font-semibold text-[var(--color-text)]">Agregar recurso</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Comparte documentos, videos, cursos y enlaces relevantes con la comunidad.
              </p>
              <form
                className="mt-4 space-y-4"
                onSubmit={handleSubmit((values) => {
                  createResourceMutation.mutate(
                    {
                      title: values.title,
                      description: values.description,
                      resourceType: values.resourceType,
                      url: values.url,
                      tags: values.tags
                        ? values.tags
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                        : undefined
                    },
                    {
                      onSuccess: () => reset()
                    }
                  );
                })}
              >
                <Input label="Título" error={errors.title?.message} {...register('title')} />
                <TextArea label="Descripción" error={errors.description?.message} rows={4} {...register('description')} />
                <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
                  Tipo de recurso
                  <select
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
                    {...register('resourceType')}
                  >
                    {Object.entries(resourceTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <Input label="URL" placeholder="https://..." error={errors.url?.message} {...register('url')} />
                <Input
                  label="Etiquetas"
                  placeholder="sena, innovación, programación"
                  hint="Separa con comas"
                  {...register('tags')}
                />
                <Button type="submit" className="w-full" loading={isSubmitting || createResourceMutation.isPending}>
                  Publicar recurso
                </Button>
              </form>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Colecciones destacadas</h3>
                <Layers className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-3">
                {curatedCollections.map((collection) => (
                  <div key={collection.id} className="rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{collection.title}</p>
                    <p className="text-xs text-[var(--color-muted)]">{collection.items} recursos seleccionados</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Consejos de curaduría</h3>
              <div className="mt-3 space-y-3 text-sm text-[var(--color-muted)]">
                <p>• Prefiere enlaces permanentes y con acceso abierto para toda la comunidad.</p>
                <p>• Describe brevemente por qué el recurso es valioso para tu grupo o proyecto.</p>
                <p>• Usa etiquetas cortas y específicas: ejemplo, “frontend”, “pitch”, “ux research”.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
