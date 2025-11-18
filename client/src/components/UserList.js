import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
export const UserList = ({ onEdit, refreshToken }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        void loadUsers();
    }, [refreshToken]);
    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.getAllUsers();
            setUsers(data);
        }
        catch (err) {
            setError('Error al cargar usuarios');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleToggleActive = async (id, isActive) => {
        try {
            if (isActive) {
                await userService.deleteUser(id);
            }
            else {
                await userService.restoreUser(id);
            }
            await loadUsers();
        }
        catch (err) {
            setError(isActive ? 'Error al suspender usuario' : 'Error al restaurar usuario');
            console.error(err);
        }
    };
    if (loading) {
        return _jsx("div", { className: "p-4 text-sm text-gray-600", children: "Cargando..." });
    }
    if (error) {
        return _jsxs("div", { className: "p-4 text-sm text-red-600", children: ["Error: ", error] });
    }
    return (_jsxs("div", { className: "container mx-auto p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Gestion de Usuarios" }), _jsxs("table", { className: "min-w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "px-2 py-2", children: "Nombre" }), _jsx("th", { className: "px-2 py-2", children: "Email" }), _jsx("th", { className: "px-2 py-2", children: "Rol" }), _jsx("th", { className: "px-2 py-2", children: "Estado" }), _jsx("th", { className: "px-2 py-2 text-right", children: "Acciones" })] }) }), _jsx("tbody", { children: users.map((user) => (_jsxs("tr", { className: "border-t", children: [_jsxs("td", { className: "px-2 py-2", children: [user.firstName, " ", user.lastName] }), _jsx("td", { className: "px-2 py-2", children: user.email }), _jsx("td", { className: "px-2 py-2 capitalize", children: user.role }), _jsx("td", { className: "px-2 py-2", children: user.isActive ? 'Activo' : 'Inactivo' }), _jsxs("td", { className: "px-2 py-2 text-right space-x-2", children: [onEdit && (_jsx("button", { type: "button", onClick: () => onEdit(user.id), className: "bg-blue-500 text-white px-2 py-1 rounded", children: "Editar" })), _jsx("button", { type: "button", onClick: () => void handleToggleActive(user.id, user.isActive), className: `px-2 py-1 rounded ${user.isActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`, children: user.isActive ? 'Suspender' : 'Restaurar' })] })] }, user.id))) })] })] }));
};
