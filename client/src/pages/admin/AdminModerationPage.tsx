import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { UserRole } from '../../types/auth';
import { Profile } from '../../types/profile';
import { Shield, ShieldCheck, ShieldHalf } from 'lucide-react';

const roleFilterOptions: Array<{ value: UserRole | 'all'; label: string }> = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'admin', label: 'Administradores' },
  { value: 'instructor', label: 'Instructores' },
  { value: 'apprentice', label: 'Aprendices' }
];

const RoleIcon = ({ role }: { role: UserRole }) => {
  if (role === 'admin') return <Shield className="h-4 w-4 text-sena-green" />;
  if (role === 'instructor') return <ShieldCheck className="h-4 w-4 text-blue-500" />;
  return <ShieldHalf className="h-4 w-4 text-amber-500" />;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const statusPill = (isActive: boolean) =>
  isActive ? 'bg-emerald-100/80 text-emerald-600 border border-emerald-200/70' : 'bg-rose-100 text-rose-500 border border-rose-200/80';

const optionalUrlField = z
  .union([z.string().trim().url('Ingresa un enlace valido').max(255), z.literal('')])
  .optional()
  .nullable();

const optionalEmailField = z
  .union([z.string().trim().email('Ingresa un correo valido').max(160), z.literal('')])
  .optional()
  .nullable();

const editUserSchema = z.object({
  firstName: z.string().trim().min(2, 'Ingresa el nombre'),
  lastName: z.string().trim().min(2, 'Ingresa el apellido'),
  email: z.string().trim().email('Ingresa un correo valido'),
  role: z.enum(['admin', 'instructor', 'apprentice']),
  isActive: z.boolean(),
  password: z.union([z.string().trim().min(6, 'La contrasena debe tener al menos 6 caracteres'), z.literal('')]).optional(),
  headline: z
    .union([z.string().trim().max(160, 'Maximo 160 caracteres'), z.literal('')])
    .optional()
    .nullable(),
  bio: z
    .union([z.string().trim().max(500, 'Maximo 500 caracteres'), z.literal('')])
    .optional()
    .nullable(),
  avatarUrl: optionalUrlField,
  instagramUrl: optionalUrlField,
  githubUrl: optionalUrlField,
  facebookUrl: optionalUrlField,
  contactEmail: optionalEmailField,
  xUrl: optionalUrlField
});

type EditUserValues = z.infer<typeof editUserSchema>;
type AdminUpdatePayload = Parameters<typeof adminService.updateUser>[1];

export const AdminModerationPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.listUsers
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => adminService.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }).catch(() => {});
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.updateStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }).catch(() => {});
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminUpdatePayload }) =>
      adminService.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }).catch(() => {});
      setEditingUser(null);
    },
    onError: () => {
      setFormError('No se pudo actualizar el usuario. Intenta nuevamente.');
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'apprentice',
      isActive: true,
      password: '',
      headline: '',
      bio: '',
      avatarUrl: '',
      instagramUrl: '',
      githubUrl: '',
      facebookUrl: '',
      contactEmail: '',
      xUrl: ''
    }
  });

  const isActiveValue = watch('isActive');
  const isSaving = updateUserMutation.isPending;

  const handleCloseEditor = () => {
    if (isSaving) return;
    setEditingUser(null);
  };

  const filteredUsers = useMemo(() => {
    if (!users.length) return [];
    const term = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        term.length === 0 ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const suspended = total - active;
    return { total, active, suspended };
  }, [users]);

  useEffect(() => {
    if (editingUser) {
      reset({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
        password: '',
        headline: editingUser.headline ?? '',
        bio: editingUser.bio ?? '',
        avatarUrl: editingUser.avatarUrl ?? '',
        instagramUrl: editingUser.instagramUrl ?? '',
        githubUrl: editingUser.githubUrl ?? '',
        facebookUrl: editingUser.facebookUrl ?? '',
        contactEmail: editingUser.contactEmail ?? '',
        xUrl: editingUser.xUrl ?? ''
      });
      setFormError(null);
    }
  }, [editingUser, reset]);

  const normalizeOptional = (value: string | null | undefined): string | null => {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const onSubmit = (values: EditUserValues) => {
    if (!editingUser) return;
    setFormError(null);
    const payload: AdminUpdatePayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      role: values.role,
      isActive: values.isActive,
      headline: normalizeOptional(values.headline),
      bio: normalizeOptional(values.bio),
      avatarUrl: normalizeOptional(values.avatarUrl),
      instagramUrl: normalizeOptional(values.instagramUrl),
      githubUrl: normalizeOptional(values.githubUrl),
      facebookUrl: normalizeOptional(values.facebookUrl),
      contactEmail: normalizeOptional(values.contactEmail),
      xUrl: normalizeOptional(values.xUrl)
    };

    const passwordValue = values.password?.trim();
    if (passwordValue) {
      payload.password = passwordValue;
    }

    updateUserMutation.mutate({ userId: editingUser.id, payload });
  };

  return (
    <DashboardLayout
      title="Moderacion y roles"
      subtitle="Gestiona los accesos de aprendices e instructores para mantener la comunidad segura."
    >
      <div className="space-y-4">
        <Card padded={false} className="p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Total usuarios</p>
                <p className="mt-1 text-lg font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Activos</p>
                <p className="mt-1 text-lg font-semibold text-sena-green">{stats.active}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/12 px-3 py-2 text-xs text-[var(--color-text)] shadow-[0_12px_20px_rgba(18,55,29,0.12)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Suspendidos</p>
                <p className="mt-1 text-lg font-semibold text-rose-500">{stats.suspended}</p>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2 md:max-w-sm">
              <Input
                label="Buscar usuarios"
                placeholder="Nombre, apellido o correo"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="py-1.5 text-xs"
              />

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]">
                Filtrar por rol
                <select
                  className="rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as UserRole | 'all')}
                >
                  {roleFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </Card>

        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-xs text-[var(--color-text)]">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">Usuario</th>
                  <th className="px-3 py-3 text-left font-medium">Correo</th>
                  <th className="px-3 py-3 text-left font-medium">Rol</th>
                  <th className="px-3 py-3 text-left font-medium">Estado</th>
                  <th className="px-3 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[var(--color-muted)]">
                      Cargando usuarios...
                    </td>
                  </tr>
                )}

                {!isLoading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[var(--color-muted)]">
                      No se encontraron usuarios con los criterios seleccionados.
                    </td>
                  </tr>
                )}

                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-white/10">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg'}
                          alt={user.firstName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-[11px] text-[var(--color-muted)]">
                            Registrado el {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">{user.email}</td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <RoleIcon role={user.role} />
                        <select
                          className="rounded-lg border border-white/20 bg-white/15 px-2 py-1 text-[11px] text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-1 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10"
                          value={user.role}
                          onChange={(event) =>
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: event.target.value as UserRole
                            })
                          }
                          disabled={updateRoleMutation.isPending}
                        >
                          <option value="admin">Administrador</option>
                          <option value="instructor">Instructor</option>
                          <option value="apprentice">Aprendiz</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusPill(user.isActive)}`}>
                        {user.isActive ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="px-2.5 text-[11px] shadow-[0_10px_20px_rgba(18,55,29,0.18)] backdrop-blur"
                          onClick={() => setEditingUser(user)}
                        >
                          Editar perfil
                        </Button>
                        <Button
                          size="sm"
                          variant={user.isActive ? 'secondary' : 'primary'}
                          loading={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              userId: user.id,
                              isActive: !user.isActive
                            })
                          }
                          className="px-2.5 text-[11px]"
                        >
                          {user.isActive ? 'Suspender' : 'Reactivar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {editingUser && (
        <GlassDialog
          open={Boolean(editingUser)}
          onClose={handleCloseEditor}
          size="xl"
          preventCloseOnBackdrop={isSaving}
          contentClassName="p-7"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                Editar perfil de {editingUser.firstName} {editingUser.lastName}
              </h3>
              <p className="text-sm text-[var(--color-muted)]">
                Ajusta la informacion personal, el rol y el estado de la cuenta.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleCloseEditor}
              className="self-start rounded-full bg-white/15 px-3 py-1 text-xs text-[var(--color-muted)] shadow-[0_10px_24px_rgba(18,55,29,0.18)] backdrop-blur hover:text-sena-green"
              disabled={isSaving}
            >
              Cerrar
            </Button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {formError && (
              <div className="rounded-[24px] border border-rose-300/50 bg-rose-100/60 px-4 py-3 text-sm text-rose-700 shadow-[0_18px_42px_rgba(220,38,38,0.2)]">
                {formError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre"
                disabled={isSaving}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Apellido"
                disabled={isSaving}
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <Input
                label="Correo"
                type="email"
                disabled={isSaving}
                error={errors.email?.message}
                {...register('email')}
              />
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
                Rol
                <select
                  className="rounded-xl border border-white/30 bg-white/25 px-3 py-2 text-xs text-[var(--color-text)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/10 dark:bg-white/10"
                  disabled={isSaving}
                  {...register('role')}
                >
                  <option value="admin">Administrador</option>
                  <option value="instructor">Instructor</option>
                  <option value="apprentice">Aprendiz</option>
                </select>
                {errors.role && <span className="text-xs text-red-400">{errors.role.message}</span>}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/25 bg-white/25 px-4 py-4 text-xs text-[var(--color-text)] shadow-[0_24px_54px_rgba(18,55,29,0.24)] backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Estado de la cuenta</p>
                <p className="mt-1 text-sm font-semibold">{isActiveValue ? 'Activo' : 'Suspendido'}</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  {isActiveValue
                    ? 'El usuario puede iniciar sesion y acceder al contenido.'
                    : 'El usuario quedara bloqueado hasta que lo reactives.'}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant={isActiveValue ? 'secondary' : 'primary'}
                  className="mt-4 w-full"
                  onClick={() => setValue('isActive', !isActiveValue)}
                  disabled={isSaving}
                >
                  {isActiveValue ? 'Marcar como suspendido' : 'Reactivar usuario'}
                </Button>
              </div>
              <Input
                label="Nueva contrasena (opcional)"
                type="password"
                placeholder="Dejar en blanco para mantenerla"
                disabled={isSaving}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Input
              label="Titular"
              disabled={isSaving}
              error={errors.headline?.message}
              {...register('headline')}
              hint="Maximo 160 caracteres"
            />

            <TextArea
              label="Biografia"
              rows={4}
              disabled={isSaving}
              error={errors.bio?.message}
              {...register('bio')}
              hint="Comparte una descripcion breve del usuario."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Avatar (URL)"
                disabled={isSaving}
                error={errors.avatarUrl?.message}
                placeholder="https://..."
                {...register('avatarUrl')}
              />
              <Input
                label="Instagram"
                disabled={isSaving}
                error={errors.instagramUrl?.message}
                placeholder="https://www.instagram.com/usuario"
                {...register('instagramUrl')}
              />
              <Input
                label="GitHub"
                disabled={isSaving}
                error={errors.githubUrl?.message}
                placeholder="https://github.com/usuario"
                {...register('githubUrl')}
              />
              <Input
                label="Facebook"
                disabled={isSaving}
                error={errors.facebookUrl?.message}
                placeholder="https://www.facebook.com/usuario"
                {...register('facebookUrl')}
              />
              <Input
                label="Correo de contacto"
                type="email"
                disabled={isSaving}
                error={errors.contactEmail?.message}
                placeholder="usuario@correo.com"
                {...register('contactEmail')}
              />
              <Input
                label="X (Twitter)"
                disabled={isSaving}
                error={errors.xUrl?.message}
                placeholder="https://x.com/usuario"
                {...register('xUrl')}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleCloseEditor} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSaving} disabled={isSaving}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </GlassDialog>
      )}
    </DashboardLayout>
  );
};

