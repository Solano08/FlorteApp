import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Hash, Settings, Shield, UserPlus, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { channelService } from '../../services/channelService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../hooks/useToast';
import { groupService } from '../../services/groupService';
import { CommunitySidebar } from '../../components/communities/CommunitySidebar';

const channelSettingsSchema = z.object({
  name: z.string().min(1, 'El nombre del canal es obligatorio'),
  description: z.string().max(1024, 'La descripción no puede exceder 1024 caracteres').optional()
});

type ChannelSettingsValues = z.infer<typeof channelSettingsSchema>;

export const ChannelSettingsPage = () => {
  const { communityId, channelId } = useParams<{ communityId?: string; channelId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<'general' | 'permissions' | 'invitations' | 'integrations'>('general');
  const [slowMode, setSlowMode] = useState('disabled');
  const [ageRestricted, setAgeRestricted] = useState(false);

  const { data: channel, isLoading } = useQuery({
    queryKey: ['channels', communityId, channelId],
    queryFn: () => channelService.getChannel(channelId!),
    enabled: !!channelId
  });

  const {
    data: myCommunities = [],
    isLoading: isLoadingMyCommunities
  } = useQuery({
    queryKey: ['myGroups'],
    queryFn: groupService.listMyGroups
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<ChannelSettingsValues>({
    resolver: zodResolver(channelSettingsSchema),
    defaultValues: {
      name: channel?.name ?? '',
      description: channel?.description ?? ''
    }
  });

  // Actualizar formulario cuando cambie el canal
  useEffect(() => {
    if (channel) {
      reset({
        name: channel.name,
        description: channel.description ?? ''
      });
    }
  }, [channel, reset]);

  const updateChannelMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => {
      if (!channelId) throw new Error('No se ha seleccionado un canal');
      return channelService.updateChannel(channelId, {
        name: data.name,
        description: data.description ?? null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', communityId] }).catch(() => {});
      toast.success('Canal actualizado correctamente');
    },
    onError: () => {
      toast.error('No se pudo actualizar el canal');
    }
  });

  const deleteChannelMutation = useMutation({
    mutationFn: () => {
      if (!channelId) throw new Error('No se ha seleccionado un canal');
      return channelService.deleteChannel(channelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', communityId] }).catch(() => {});
      toast.success('Canal eliminado correctamente');
      navigate(`/communities/${communityId}`);
    },
    onError: () => {
      toast.error('No se pudo eliminar el canal');
    }
  });

  const onSubmit = (values: ChannelSettingsValues) => {
    updateChannelMutation.mutate({
      name: values.name,
      description: values.description
    });
  };

  const handleClose = () => {
    navigate(`/communities/${communityId}/${channelId}`);
  };

  const handleDelete = () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este canal? Esta acción no se puede deshacer.')) {
      return;
    }
    deleteChannelMutation.mutate();
  };

  const descriptionLength = watch('description')?.length ?? 0;

  if (isLoading) {
    return (
      <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-[var(--color-muted)]">Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!channel) {
    return (
      <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-[var(--color-muted)]">Canal no encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout contentClassName="flex h-full w-full overflow-hidden p-0">
      <div className="flex h-full w-full min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
          <div className="flex h-full w-full">
            <CommunitySidebar
              communities={myCommunities}
              isLoading={isLoadingMyCommunities}
              onCreateCommunity={() => navigate('/communities')}
              onExploreCommunities={() => toast.info('Explorar comunidades estará disponible próximamente')}
            />

            {/* Sidebar izquierdo ajustes de canal */}
            <aside className="flex w-72 flex-col border-r border-white/10 dark:border-white/5 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[12px_0_40px_rgba(15,23,42,0.04)] dark:shadow-[12px_0_40px_rgba(0,0,0,0.6)]">
              <div className="px-4 py-3 border-b border-white/10 dark:border-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Ajustes del canal
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                  <Hash className="h-4 w-4" />
                  <span className="truncate">{channel.name}</span>
                </div>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveSection('general')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'general'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Vista general</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('permissions')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'permissions'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Permisos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('invitations')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'invitations'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invitaciones</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('integrations')}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                    activeSection === 'integrations'
                      ? 'bg-sena-green/10 text-sena-green dark:bg-sena-green/20 dark:text-emerald-300 font-medium shadow-sm ring-1 ring-sena-green/30'
                      : 'text-[var(--color-muted)] hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Integraciones</span>
                </button>
              </nav>

              <div className="px-2 py-4 border-t border-white/10 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar canal</span>
                </button>
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex flex-1 flex-col min-h-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {activeSection === 'general' && 'Vista general'}
                  {activeSection === 'permissions' && 'Permisos'}
                  {activeSection === 'invitations' && 'Invitaciones'}
                  {activeSection === 'integrations' && 'Integraciones'}
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-muted)] whitespace-nowrap">ESC</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {activeSection === 'general' && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Nombre del canal */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Nombre del canal
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          {...register('name')}
                          error={errors.name?.message}
                          className="flex-1"
                          placeholder="general"
                        />
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                          aria-label="Emoji"
                        >
                          😊
                        </button>
                      </div>
                    </div>

                    {/* Tema del canal */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Tema del canal
                      </label>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-2">
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                              aria-label="Negrita"
                            >
                              <span className="text-xs font-bold">B</span>
                            </button>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                              aria-label="Cursiva"
                            >
                              <span className="text-xs italic">I</span>
                            </button>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                              aria-label="Tachado"
                            >
                              <span className="text-xs line-through">S</span>
                            </button>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                              aria-label="Oculto"
                            >
                              <span className="text-xs">👁</span>
                            </button>
                          </div>
                          <TextArea
                            {...register('description')}
                            error={errors.description?.message}
                            rows={4}
                            placeholder="Enséñale a todo el mundo a usar este canal!"
                            className="resize-none"
                          />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-[var(--color-muted)]">
                              {descriptionLength}/1024
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-colors duration-150 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                          aria-label="Emoji"
                        >
                          😊
                        </button>
                      </div>
                    </div>

                    {/* Modo pausado */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                        Modo pausado
                      </label>
                      <select
                        value={slowMode}
                        onChange={(e) => setSlowMode(e.target.value)}
                        className="w-full rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-700/60 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sena-green/50"
                      >
                        <option value="disabled">Desactivado</option>
                        <option value="5">5 segundos</option>
                        <option value="10">10 segundos</option>
                        <option value="30">30 segundos</option>
                        <option value="60">1 minuto</option>
                        <option value="300">5 minutos</option>
                        <option value="600">10 minutos</option>
                        <option value="900">15 minutos</option>
                        <option value="1800">30 minutos</option>
                        <option value="3600">1 hora</option>
                        <option value="21600">6 horas</option>
                      </select>
                      <p className="mt-2 text-[11px] text-[var(--color-muted)]">
                        Los miembros solo podrán enviar un mensaje y crear un hilo por cada intervalo, a menos que tengan los permisos Eludir modo pausado, Gestionar canal o Gestionar mensajes. Esto cambiará el {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.
                      </p>
                    </div>

                    {/* Canal con restricción por edad */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-[var(--color-text)]">
                          Canal con restricción por edad
                        </label>
                        <button
                          type="button"
                          onClick={() => setAgeRestricted(!ageRestricted)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-2xl transition-colors duration-200 ${
                            ageRestricted
                              ? 'bg-sena-green'
                              : 'bg-slate-300 dark:bg-neutral-600'
                          }`}
                          aria-label="Restricción por edad"
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-2xl bg-white transition-transform duration-200 ${
                              ageRestricted ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        loading={updateChannelMutation.isPending}
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                )}

                {activeSection === 'permissions' && (
                  <div className="text-center py-12">
                    <p className="text-[var(--color-muted)]">Funcionalidad de permisos próximamente</p>
                  </div>
                )}

                {activeSection === 'invitations' && (
                  <div className="text-center py-12">
                    <p className="text-[var(--color-muted)]">Funcionalidad de invitaciones próximamente</p>
                  </div>
                )}

                {activeSection === 'integrations' && (
                  <div className="text-center py-12">
                    <p className="text-[var(--color-muted)]">Funcionalidad de integraciones próximamente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

