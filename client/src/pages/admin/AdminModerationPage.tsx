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
import { ReportStatus } from '../../types/feed';
import {
  AlertTriangle,
  Facebook,
  Flame,
  Github,
  Instagram,
  Loader2,
  Mail,
  Plus,
  Shield,
  ShieldCheck,
  ShieldHalf,
  Twitter,
  Users,
  X as CloseIcon
} from 'lucide-react';

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

const reportStatusPill = (status: ReportStatus) =>
  status === 'pending'
    ? 'bg-amber-100 text-amber-700 border border-amber-200'
    : 'bg-emerald-100 text-emerald-600 border border-emerald-200';

const optionalUrlField = z
  .union([z.string().trim().url('Ingresa un enlace valido').max(255), z.literal('')])
  .optional()
  .nullable();

const optionalEmailField = z
  .union([z.string().trim().email('Ingresa un correo valido').max(160), z.literal('')])
  .optional()
  .nullable();

const socialLinkConfigs = [
  {
    name: 'instagramUrl',
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'https://www.instagram.com/usuario',
    type: 'url'
  },
  {
    name: 'githubUrl',
    label: 'GitHub',
    icon: Github,
    placeholder: 'https://github.com/usuario',
    type: 'url'
  },
  {
    name: 'facebookUrl',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'https://www.facebook.com/usuario',
    type: 'url'
  },
  {
    name: 'contactEmail',
    label: 'Correo de contacto',
    icon: Mail,
    placeholder: 'usuario@correo.com',
    type: 'email'
  },
  {
    name: 'xUrl',
    label: 'X (Twitter)',
    icon: Twitter,
    placeholder: 'https://x.com/usuario',
    type: 'url'
  }
] as const;

type SocialField = (typeof socialLinkConfigs)[number]['name'];

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
  const [activeLinkEditors, setActiveLinkEditors] = useState<Record<string, boolean>>({});

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.listUsers
  });

  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: adminService.listReports
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

  const updateReportStatusMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: ReportStatus }) =>
      adminService.updateReportStatus(reportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }).catch(() => {});
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
    setActiveLinkEditors({});
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
      const nextEditors: Record<string, boolean> = {};
      socialLinkConfigs.forEach(({ name }) => {
        const value = editingUser[name];
        if (value && value.trim().length > 0) {
          nextEditors[name] = true;
        }
      });
      setActiveLinkEditors(nextEditors);
    } else {
      setActiveLinkEditors({});
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

  const handleActivateLinkField = (name: SocialField) => {
    setActiveLinkEditors((prev) => ({ ...prev, [name]: true }));
  };

  const handleClearLinkField = (name: SocialField) => {
    setActiveLinkEditors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
    setValue(name, '', { shouldDirty: true });
  };

  const getSocialError = (field: SocialField) =>
    (errors[field]?.message as string | undefined) ?? undefined;

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

        <Card className="border border-white/15 bg-white/10 p-5 shadow-[0_18px_40px_rgba(18,55,29,0.18)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Reportes de publicaciones</h3>
              <p className="text-xs text-[var(--color-muted)]">
                Supervisa el contenido reportado por la comunidad.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
              {isLoadingReports ? 'Cargando...' : `${reports.length} reportes`}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {isLoadingReports ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={`report-skeleton-${index}`} className="h-24 animate-pulse rounded-2xl bg-white/5" />
              ))
            ) : reports.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm text-[var(--color-muted)]">
                No hay reportes activos. Cuando la comunidad reporte una publicacion, veras los detalles aqui.
              </p>
            ) : (
              reports.map((report) => {
                const reporterAvatar =
                  report.reporter.avatarUrl ??
                  `https://avatars.dicebear.com/api/initials/${encodeURIComponent(report.reporter.fullName)}.svg`;
                const postAuthorAvatar =
                  report.post.author.avatarUrl ??
                  `https://avatars.dicebear.com/api/initials/${encodeURIComponent(report.post.author.fullName)}.svg`;
                const formattedDate = formatDate(report.createdAt);
                const isPending = report.status === 'pending';
                return (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-[var(--color-text)] shadow-[0_12px_30px_rgba(18,55,29,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img src={reporterAvatar} alt={report.reporter.fullName} className="h-9 w-9 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold">{report.reporter.fullName}</p>
                          <p className="text-[11px] text-[var(--color-muted)]">Reporto el {formattedDate}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${reportStatusPill(
                          report.status
                        )}`}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {report.status === 'pending' ? 'Pendiente' : 'Revisado'}
                      </span>
                    </div>
                    {report.reason && (
                      <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-xs italic text-[var(--color-muted)]">
                        “{report.reason}”
                      </p>
                    )}
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs">
                      <div className="flex items-center gap-2 text-[var(--color-muted)]">
                        <img src={postAuthorAvatar} alt={report.post.author.fullName} className="h-6 w-6 rounded-full object-cover" />
                        <span>Publicacion de {report.post.author.fullName}</span>
                      </div>
                      {report.post.content && (
                        <p className="mt-2 line-clamp-2 text-[var(--color-text)]">{report.post.content}</p>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open('/dashboard', '_blank')}
                      >
                        Ver en el feed
                      </Button>
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateReportStatusMutation.mutate({ reportId: report.id, status: 'reviewed' })
                          }
                          loading={
                            updateReportStatusMutation.isPending &&
                            updateReportStatusMutation.variables?.reportId === report.id
                          }
                        >
                          Marcar como revisado
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {editingUser && (
        <GlassDialog
          open={Boolean(editingUser)}
          onClose={handleCloseEditor}
          size="xl"
          preventCloseOnBackdrop={isSaving}
          overlayClassName="!bg-slate-100/70 backdrop-blur-sm dark:!bg-slate-950/65"
          contentClassName="p-0 !overflow-visible !bg-white/55 !backdrop-blur-[30px] !border-white/60 !shadow-[0_50px_120px_rgba(15,38,25,0.25)] dark:!bg-slate-900/85 dark:!border-white/15"
        >
          <div className="max-h-[85vh] space-y-6 overflow-y-auto rounded-[36px] border border-white/60 bg-white/45 p-5 shadow-[0_28px_70px_rgba(15,38,25,0.2)] backdrop-blur-[22px] dark:border-white/15 dark:bg-white/5 dark:shadow-[0_28px_60px_rgba(10,22,15,0.45)] sm:p-8">
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

            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <Input
                label="Correo"
                type="email"
                disabled={isSaving}
                error={errors.email?.message}
                {...register('email')}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">Rol</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--color-text)] shadow-[0_10px_24px_rgba(15,38,25,0.15)] outline-none transition focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/15 dark:bg-white/10"
                    disabled={isSaving}
                    {...register('role')}
                  >
                    <option value="admin">Administrador</option>
                    <option value="instructor">Instructor</option>
                    <option value="apprentice">Aprendiz</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
                </div>
                {errors.role && <span className="text-xs text-red-400">{errors.role.message}</span>}
              </div>
            </div>

            <Input
              label="Nueva contrasena (opcional)"
              type="password"
              placeholder="Dejar en blanco para mantenerla"
              disabled={isSaving}
              error={errors.password?.message}
              {...register('password')}
            />

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

            <Input
              label="Avatar (URL)"
              disabled={isSaving}
              error={errors.avatarUrl?.message}
              placeholder="https://..."
              {...register('avatarUrl')}
            />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">Enlaces</p>
              <p className="text-xs text-[var(--color-muted)]">
                Agrega solo las redes que quieras mostrar. Haz clic en el icono + para desplegar el campo.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {socialLinkConfigs.map(({ name, label, icon: Icon, placeholder, type }) => {
                  const currentValue = watch(name) ?? '';
                  const isActive = activeLinkEditors[name as string] || currentValue.trim().length > 0;

                  if (!isActive) {
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleActivateLinkField(name)}
                        className="flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-white/85 text-center text-sm font-semibold text-slate-500 shadow-[0_18px_42px_rgba(18,55,29,0.12)] transition hover:border-sena-green/60 hover:text-sena-green dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-muted)]"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.18)]">
                          <Plus className="h-5 w-5" />
                        </span>
                        Agregar {label}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={name}
                      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_26px_52px_rgba(18,55,29,0.14)] backdrop-blur-[14px] dark:border-white/10 dark:bg-white/10 dark:shadow-[0_20px_40px_rgba(18,55,29,0.16)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sena-green/15 text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.18)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <Input
                            label={label}
                            type={type === 'email' ? 'email' : 'url'}
                            placeholder={placeholder}
                            error={getSocialError(name)}
                            disabled={isSaving}
                            autoComplete={type === 'email' ? 'email' : 'url'}
                            {...register(name)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleClearLinkField(name)}
                          className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-500 transition hover:border-sena-green/60 hover:text-sena-green dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-muted)]"
                          aria-label={`Quitar ${label}`}
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/35 bg-white/35 px-4 py-4 text-xs text-[var(--color-text)] shadow-[0_24px_54px_rgba(18,55,29,0.24)] backdrop-blur-md dark:border-white/20 dark:bg-white/10">
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

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleCloseEditor} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSaving} disabled={isSaving}>
                Guardar cambios
              </Button>
            </div>
          </form>
          </div>
        </GlassDialog>
      )}
    </DashboardLayout>
  );
};

