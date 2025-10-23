import React, { useEffect, useState } from 'react';
import { UpdateUserPayload, userService } from '../services/userService';
import { UserRole } from '../types/auth';

interface UserEditProps {
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password: string;
}

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Administrador' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'apprentice', label: 'Aprendiz' }
];

export const UserEdit: React.FC<UserEditProps> = ({ userId, onSave, onCancel }) => {
  const [formState, setFormState] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'apprentice',
    isActive: true,
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError('Error al cargar usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload: UpdateUserPayload = {
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
    } catch (err) {
      setError('Error al actualizar usuario');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">Cargando usuario...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="firstName">
            Nombre
          </label>
          <input
            id="firstName"
            type="text"
            value={formState.firstName}
            onChange={(event) => handleChange('firstName', event.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="lastName">
            Apellido
          </label>
          <input
            id="lastName"
            type="text"
            value={formState.lastName}
            onChange={(event) => handleChange('lastName', event.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formState.email}
          onChange={(event) => handleChange('email', event.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="role">
            Rol
          </label>
          <select
            id="role"
            value={formState.role}
            onChange={(event) => handleChange('role', event.target.value as UserRole)}
            className="w-full px-3 py-2 border rounded"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="isActive"
            type="checkbox"
            checked={formState.isActive}
            onChange={(event) => handleChange('isActive', event.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Cuenta activa
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Nueva contrasena (opcional)
        </label>
        <input
          id="password"
          type="password"
          value={formState.password}
          onChange={(event) => handleChange('password', event.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="Dejar en blanco para mantener la actual"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};
