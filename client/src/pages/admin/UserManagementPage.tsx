import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { UserList } from '../../components/UserList';
import { UserEdit } from '../../components/UserEdit';

export const UserManagementPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleUserSaved = () => {
    setSelectedUserId(null);
    setRefreshToken((token) => token + 1);
  };

  return (
    <DashboardLayout
      title="Administracion de usuarios"
      subtitle="Gestiona roles, estados y datos basicos de las cuentas."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card padded={false} className="overflow-hidden">
          <UserList onEdit={setSelectedUserId} refreshToken={refreshToken} />
        </Card>

        <Card padded className="h-full">
          {selectedUserId ? (
            <UserEdit userId={selectedUserId} onSave={handleUserSaved} onCancel={() => setSelectedUserId(null)} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-600">
              Selecciona un usuario para ver su informacion.
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};
