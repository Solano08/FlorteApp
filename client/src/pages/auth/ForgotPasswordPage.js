import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export const ForgotPasswordPage = () => {
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: '' }
    });
    const onSubmit = async (values) => {
        setMessage(null);
        setError(null);
        try {
            const msg = await authService.forgotPassword(values.email);
            setMessage(msg);
        }
        catch (err) {
            setError('No pudimos enviar el correo. Intenta nuevamente.');
        }
    };
    return (_jsx(AuthLayout, { title: "Recupera tu acceso", description: "Ingresa el correo asociado a tu cuenta para enviarte un enlace de restablecimiento.", children: _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsx(Input, { label: "Correo electr\u00F3nico", type: "email", placeholder: "tucorreo@sena.edu.co", error: errors.email?.message, ...register('email') }), message && _jsx("p", { className: "rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-600", children: message }), error && _jsx("p", { className: "rounded-md bg-red-100 px-3 py-2 text-sm text-red-500", children: error }), _jsx(Button, { type: "submit", className: "w-full", loading: isSubmitting, children: "Enviar instrucciones" }), _jsx("div", { className: "text-center text-sm text-[var(--color-muted)]", children: _jsx(Link, { to: "/login", className: "text-sena-green hover:underline", children: "Volver al inicio de sesi\u00F3n" }) })] }) }));
};
