import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export const RegisterPage = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });
    const onSubmit = async ({ confirmPassword, ...values }) => {
        setServerError(null);
        try {
            await registerUser(values);
            navigate('/dashboard');
        }
        catch (error) {
            setServerError('No pudimos crear tu cuenta. Intenta de nuevo.');
        }
    };
    return (_jsx(AuthLayout, { title: "\u00DAnete a la comunidad FlorteApp", description: "Crea tu cuenta, arma grupos de estudio, comparte recursos y colabora en proyectos SENA.", children: _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Input, { label: "Nombre", placeholder: "Tu nombre", error: errors.firstName?.message, ...register('firstName') }), _jsx(Input, { label: "Apellido", placeholder: "Tu apellido", error: errors.lastName?.message, ...register('lastName') })] }), _jsx(Input, { label: "Correo institucional", type: "email", placeholder: "tucorreo@sena.edu.co", error: errors.email?.message, ...register('email') }), _jsx(Input, { label: "Contrase\u00F1a", type: "password", placeholder: "Crea una contrase\u00F1a segura", error: errors.password?.message, ...register('password') }), _jsx(Input, { label: "Confirmar contrase\u00F1a", type: "password", placeholder: "Repite tu contrase\u00F1a", error: errors.confirmPassword?.message, ...register('confirmPassword') }), serverError && _jsx("p", { className: "rounded-md bg-red-100 px-3 py-2 text-sm text-red-500", children: serverError }), _jsx(Button, { type: "submit", className: "w-full", loading: isSubmitting, children: "Crear cuenta" }), _jsxs("p", { className: "text-center text-sm text-[var(--color-muted)]", children: ["\u00BFYa tienes una cuenta?", ' ', _jsx(Link, { to: "/login", className: "text-sena-green hover:underline", children: "Inicia sesi\u00F3n" })] })] }) }));
};
