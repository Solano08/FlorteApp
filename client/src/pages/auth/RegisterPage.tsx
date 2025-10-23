import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Ingresa tu nombre'),
    lastName: z.string().min(2, 'Ingresa tu apellido'),
    email: z.string().email('Ingresa un correo válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Mínimo 8 caracteres')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  });

type RegisterValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async ({ confirmPassword, ...values }: RegisterValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      navigate('/dashboard');
    } catch (error) {
      setServerError('No pudimos crear tu cuenta. Intenta de nuevo.');
    }
  };

  return (
    <AuthLayout
      title="Únete a la comunidad FlorteApp"
      description="Crea tu cuenta, arma grupos de estudio, comparte recursos y colabora en proyectos SENA."
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre" placeholder="Tu nombre" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Apellido" placeholder="Tu apellido" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input
          label="Correo institucional"
          type="email"
          placeholder="tucorreo@sena.edu.co"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Crea una contraseña segura"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite tu contraseña"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-500">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Crear cuenta
        </Button>

        <p className="text-center text-sm text-[var(--color-muted)]">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-sena-green hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
