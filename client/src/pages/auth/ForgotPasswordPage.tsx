import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Ingresa un correo válido')
});

type ForgotValues = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (values: ForgotValues) => {
    setMessage(null);
    setError(null);
    try {
      const msg = await authService.forgotPassword(values.email);
      setMessage(msg);
    } catch (err) {
      setError('No pudimos enviar el correo. Intenta nuevamente.');
    }
  };

  return (
    <AuthLayout
      title="Recupera tu acceso"
      description="Ingresa el correo asociado a tu cuenta para enviarte un enlace de restablecimiento."
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tucorreo@sena.edu.co"
          error={errors.email?.message}
          {...register('email')}
        />

        {message && <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-600">{message}</p>}
        {error && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Enviar instrucciones
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
