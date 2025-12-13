import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { groupService } from '../../services/groupService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Users, Compass } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const groupSchema = z.object({
  name: z.string().min(3, 'El nombre es obligatorio'),
  description: z.string().max(400).optional(),
  coverImage: z.string().url('Ingresa una URL válida').optional()
});

type GroupValues = z.infer<typeof groupSchema>;

export const GroupsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.listGroups
  });

  const createGroupMutation = useMutation({
    mutationFn: groupService.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(() => { });
      queryClient.invalidateQueries({ queryKey: ['groups', 'me'] }).catch(() => { });
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<GroupValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      description: '',
      coverImage: ''
    }
  });
  const [searchTerm, setSearchTerm] = useState('');

  const activeGroups = useMemo(() => groups.slice(0, 6), [groups]);
  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query.length === 0) return groups;
    return groups.filter((group) => {
      const name = group.name.toLowerCase();
      const description = (group.description ?? '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [groups, searchTerm]);

  return (

    <DashboardLayout title="Grupos" subtitle="Organiza comunidades y grupos de estudio para aprender juntos.">

      <div className="grid w-full gap-5 pb-16 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">

        <aside className="hidden flex-col gap-4 lg:flex">

          <Card className="h-full p-4 glass-liquid-strong">

            <div className="flex flex-col gap-1">

              <h3 className="text-sm font-semibold text-[var(--color-text)]">Mis grupos</h3>

              <p className="text-xs text-[var(--color-muted)]">Accede rápido a tus comunidades activas.</p>

            </div>

            <div className="mt-3 space-y-3 overflow-y-auto pr-1">

              {activeGroups.length === 0 && (

                <p className="text-sm text-[var(--color-muted)]">

                  Aún no te has unido a ningún grupo. Explora la comunidad para descubrir nuevas oportunidades.

                </p>

              )}

              {activeGroups.map((group) => (

                <div key={group.id} className="rounded-2xl glass-liquid px-3 py-2">

                  <p className="text-sm font-semibold text-[var(--color-text)]">{group.name}</p>

                  <p className="text-xs text-[var(--color-muted)]">

                    Desde {new Date(group.createdAt).toLocaleDateString('es-CO')}

                  </p>

                </div>

              ))}

            </div>

            <Button

              variant="secondary"

              className="mt-4 w-full"

              leftIcon={<Compass className="h-4 w-4" />}

              onClick={() => navigate('/explore')}

            >

              Explorar grupos

            </Button>

          </Card>



          <Card className="p-4 glass-liquid-strong">

            <h3 className="text-sm font-semibold text-[var(--color-text)]">Consejos rápidos</h3>

            <ul className="mt-3 space-y-2 text-xs text-[var(--color-muted)]">

              <li>• Define un objetivo claro para tu comunidad.</li>

              <li>• Comparte recursos útiles y mantén las actualizaciones activas.</li>

              <li>• Invita a instructores para fortalecer la mentoría.</li>

            </ul>

          </Card>

        </aside>



        <section className="flex flex-col gap-5">

          <Card className="p-5 glass-liquid">

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

              <div className="max-w-xl space-y-1">

                <h2 className="text-sm font-semibold text-[var(--color-text)]">Crear un nuevo grupo</h2>

                <p className="text-xs text-[var(--color-muted)]">

                  Ideal para coordinar proyectos, mentorías o comunidades temáticas dentro del SENA.

                </p>

              </div>

              <div className="flex w-full max-w-sm items-end gap-2">

                <Input

                  label="Buscar grupos"

                  placeholder="Nombre o temática"

                  value={searchTerm}

                  onChange={(event) => setSearchTerm(event.target.value)}

                />

              </div>

            </div>

            <form

              className="mt-4 grid gap-3 md:grid-cols-2"

              onSubmit={handleSubmit((values) => {

                createGroupMutation.mutate(

                  {

                    name: values.name,

                    description: values.description,

                    coverImage: values.coverImage

                  },

                  {

                    onSuccess: () => reset()

                  }

                );

              })}

            >

              <Input label="Nombre" error={errors.name?.message} {...register('name')} />

              <Input

                label="Imagen de portada (URL)"

                placeholder="https://..."

                error={errors.coverImage?.message}

                {...register('coverImage')}

              />

              <TextArea

                label="Descripción"

                rows={4}

                error={errors.description?.message}

                {...register('description')}

                className="md:col-span-2"

              />

              <div className="md:col-span-2">

                <Button type="submit" className="w-full" loading={isSubmitting || createGroupMutation.isPending}>

                  Crear grupo

                </Button>

              </div>

            </form>

          </Card>



          <div className="flex flex-col gap-3">

            <div className="flex items-center justify-between">

              <h3 className="text-sm font-semibold text-[var(--color-text)]">Explora la comunidad</h3>

              <span className="text-xs text-[var(--color-muted)]">{filteredGroups.length} resultados</span>

            </div>

            {isLoading ? (

              <Card className="p-6 text-sm text-[var(--color-muted)] glass-liquid">Cargando grupos...</Card>

            ) : filteredGroups.length === 0 ? (

              <Card className="p-6 text-sm text-[var(--color-muted)] glass-liquid">
                No se encontraron grupos. Intenta con otra palabra clave o crea uno nuevo.
              </Card>

            ) : (

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {filteredGroups.map((group) => (

                  <Card key={group.id} className="flex h-full flex-col gap-3 p-4 glass-liquid">

                    <div className="flex items-center gap-3">

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sena-green/15 text-sena-green shadow-[0_10px_20px_rgba(18,55,29,0.12)]">

                        <Users className="h-6 w-6" />

                      </div>

                      <div className="min-w-0">

                        <h4 className="text-sm font-semibold text-[var(--color-text)]">{group.name}</h4>

                        <p className="text-xs text-[var(--color-muted)]">Creado el {new Date(group.createdAt).toLocaleDateString('es-CO')}</p>

                      </div>

                    </div>

                    <p className="text-xs text-[var(--color-muted)]">

                      {group.description ?? 'Grupo sin descripción. Comparte tu experiencia y únete a la conversación.'}

                    </p>

                    <div className="mt-auto flex gap-2">

                      <Button variant="primary" size="sm" className="flex-1">

                        Ver grupo

                      </Button>

                      <Button variant="secondary" size="sm" className="flex-1">

                        Compartir

                      </Button>

                    </div>

                  </Card>

                ))}

              </div>

            )}

          </div>

        </section>

      </div>

    </DashboardLayout>

  );
};
