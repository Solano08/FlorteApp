import React, { useEffect, useState } from 'react';
import { User, userService } from '../services/userService';

interface UserListProps {
  onEdit?: (userId: string) => void;
  refreshToken?: number;
}

export const UserList: React.FC<UserListProps> = ({ onEdit, refreshToken }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, [refreshToken]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await userService.deleteUser(id);
      } else {
        await userService.restoreUser(id);
      }
      await loadUsers();
    } catch (err) {
      setError(isActive ? 'Error al suspender usuario' : 'Error al restaurar usuario');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">Cargando...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion de Usuarios</h1>
      <table className="min-w-full">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-2">Nombre</th>
            <th className="px-2 py-2">Email</th>
            <th className="px-2 py-2">Rol</th>
            <th className="px-2 py-2">Estado</th>
            <th className="px-2 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="px-2 py-2">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-2 py-2">{user.email}</td>
              <td className="px-2 py-2 capitalize">{user.role}</td>
              <td className="px-2 py-2">{user.isActive ? 'Activo' : 'Inactivo'}</td>
              <td className="px-2 py-2 text-right space-x-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(user.id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggleActive(user.id, user.isActive)}
                  className={`px-2 py-1 rounded ${
                    user.isActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  }`}
                >
                  {user.isActive ? 'Suspender' : 'Restaurar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
