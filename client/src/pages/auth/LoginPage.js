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
const loginSchema = z.object({
    email: z.string().email('Ingresa un correo válido'),
    password: z.string().min(1, 'Ingresa tu contraseña')
});
export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });
    const onSubmit = async (values) => {
        setServerError(null);
        try {
            await login(values);
            navigate('/dashboard');
        }
        catch (error) {
            setServerError('No pudimos iniciar sesión. Verifica tus datos e intenta nuevamente.');
        }
    };
    return (_jsx(AuthLayout, { title: "Conecta y aprende con FlorteApp", description: "Ingresa a la red de aprendices del SENA para colaborar, crear proyectos y acceder a recursos.", children: _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsx(Input, { label: "Correo electr\u00F3nico", type: "email", placeholder: "tucorreo@sena.edu.co", error: errors.email?.message, ...register('email') }), _jsx(Input, { label: "Contrase\u00F1a", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", error: errors.password?.message, ...register('password') }), serverError && _jsx("p", { className: "rounded-md bg-red-100 px-3 py-2 text-sm text-red-500", children: serverError }), _jsx(Button, { type: "submit", className: "w-full", loading: isSubmitting, children: "Iniciar sesi\u00F3n" }), _jsxs("div", { className: "flex justify-between text-sm text-[var(--color-muted)]", children: [_jsx(Link, { to: "/register", className: "text-sena-green hover:underline", children: "Crear cuenta" }), _jsx(Link, { to: "/forgot-password", className: "text-sena-green hover:underline", children: "Olvid\u00E9 mi contrase\u00F1a" })] })] }) }));
};
