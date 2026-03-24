import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useMemo, useState } from 'react';

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Mínimo 8 caracteres')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  });

type ResetValues = z.infer<typeof schema>;

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (values: ResetValues) => {
    setServerError(null);
    try {
      await authService.resetPassword(token, values.password);
      navigate('/login', { replace: true, state: { passwordResetOk: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No pudimos actualizar la contraseña.';
      setServerError(msg);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Enlace no válido"
        description="Falta el token de recuperación o el enlace está incompleto."
      >
        <div className="space-y-6 text-center text-sm text-[var(--color-muted)]">
          <p>Solicita un nuevo correo desde la pantalla de recuperación.</p>
          <Link to="/forgot-password" className="inline-block text-sena-green hover:underline">
            Recuperar contraseña
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      description="Elige una contraseña segura. Al guardar, podrás iniciar sesión de nuevo."
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && <p className="rounded-2xl bg-red-100 px-3 py-2 text-sm text-red-500">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Guardar contraseña
        </Button>

        <div className="text-center text-sm text-[var(--color-muted)]">
          <Link to="/login" className="text-sena-green hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
