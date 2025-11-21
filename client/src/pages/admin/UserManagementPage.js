import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { UserList } from '../../components/UserList';
import { UserEdit } from '../../components/UserEdit';
export const UserManagementPage = () => {
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const handleUserSaved = () => {
        setSelectedUserId(null);
        setRefreshToken((token) => token + 1);
    };
    return (_jsx(DashboardLayout, { title: "Administracion de usuarios", subtitle: "Gestiona roles, estados y datos basicos de las cuentas.", children: _jsxs("div", { className: "grid gap-6 lg:grid-cols-[2fr,1fr]", children: [_jsx(Card, { padded: false, className: "overflow-hidden", children: _jsx(UserList, { onEdit: setSelectedUserId, refreshToken: refreshToken }) }), _jsx(Card, { padded: true, className: "h-full", children: selectedUserId ? (_jsx(UserEdit, { userId: selectedUserId, onSave: handleUserSaved, onCancel: () => setSelectedUserId(null) })) : (_jsx("div", { className: "flex h-full items-center justify-center text-sm text-gray-600", children: "Selecciona un usuario para ver su informacion." })) })] }) }));
};
