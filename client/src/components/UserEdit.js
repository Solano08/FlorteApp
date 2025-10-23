import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'apprentice', label: 'Aprendiz' }
];
export const UserEdit = ({ userId, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'apprentice',
        isActive: true,
        password: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        void loadUser();
    }, [userId]);
    const loadUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const user = await userService.getUserById(userId);
            setFormState({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                password: ''
            });
        }
        catch (err) {
            setError('Error al cargar usuario');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleChange = (key, value) => {
        setFormState((prev) => ({ ...prev, [key]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            setError(null);
            const payload = {
                firstName: formState.firstName,
                lastName: formState.lastName,
                email: formState.email,
                role: formState.role,
                isActive: formState.isActive
            };
            if (formState.password.trim().length > 0) {
                payload.password = formState.password.trim();
            }
            await userService.updateUser(userId, payload);
            onSave();
        }
        catch (err) {
            setError('Error al actualizar usuario');
            console.error(err);
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return _jsx("div", { className: "p-4 text-sm text-gray-600", children: "Cargando usuario..." });
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "max-w-xl space-y-4", children: [error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", htmlFor: "firstName", children: "Nombre" }), _jsx("input", { id: "firstName", type: "text", value: formState.firstName, onChange: (event) => handleChange('firstName', event.target.value), className: "w-full px-3 py-2 border rounded", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", htmlFor: "lastName", children: "Apellido" }), _jsx("input", { id: "lastName", type: "text", value: formState.lastName, onChange: (event) => handleChange('lastName', event.target.value), className: "w-full px-3 py-2 border rounded", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", value: formState.email, onChange: (event) => handleChange('email', event.target.value), className: "w-full px-3 py-2 border rounded", required: true })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", htmlFor: "role", children: "Rol" }), _jsx("select", { id: "role", value: formState.role, onChange: (event) => handleChange('role', event.target.value), className: "w-full px-3 py-2 border rounded", children: roleOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "flex items-center gap-2 pt-6", children: [_jsx("input", { id: "isActive", type: "checkbox", checked: formState.isActive, onChange: (event) => handleChange('isActive', event.target.checked), className: "h-4 w-4" }), _jsx("label", { htmlFor: "isActive", className: "text-sm font-medium", children: "Cuenta activa" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", htmlFor: "password", children: "Nueva contrasena (opcional)" }), _jsx("input", { id: "password", type: "password", value: formState.password, onChange: (event) => handleChange('password', event.target.value), className: "w-full px-3 py-2 border rounded", placeholder: "Dejar en blanco para mantener la actual" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 bg-gray-500 text-white rounded", disabled: saving, children: "Cancelar" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-500 text-white rounded", disabled: saving, children: saving ? 'Guardando...' : 'Guardar' })] })] }));
};
