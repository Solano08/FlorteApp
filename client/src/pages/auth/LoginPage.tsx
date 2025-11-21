import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña')
});

type LoginValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login(values);
      navigate('/dashboard');
    } catch (error) {
      setServerError('No pudimos iniciar sesión. Verifica tus datos e intenta nuevamente.');
    }
  };

  return (
    <AuthLayout
      title="Conecta y aprende con FlorteApp"
      description="Ingresa a la red de aprendices del SENA para colaborar, crear proyectos y acceder a recursos."
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tucorreo@sena.edu.co"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-500">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Iniciar sesión
        </Button>

        <div className="flex justify-between text-sm text-[var(--color-muted)]">
          <Link to="/register" className="text-sena-green hover:underline">
            Crear cuenta
          </Link>
          <Link to="/forgot-password" className="text-sena-green hover:underline">
            Olvidé mi contraseña
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
