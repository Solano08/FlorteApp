import { FC } from 'react';
import { resolveAssetUrl } from '../../utils/media';

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  isActive?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
};

const statusSizeClasses = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5'
};

// Paleta de colores para avatares
const avatarColors = [
  { from: 'from-blue-500', via: 'via-blue-600', to: 'to-cyan-500' },
  { from: 'from-purple-500', via: 'via-purple-600', to: 'to-pink-500' },
  { from: 'from-green-500', via: 'via-green-600', to: 'to-emerald-500' },
  { from: 'from-orange-500', via: 'via-orange-600', to: 'to-red-500' },
  { from: 'from-indigo-500', via: 'via-indigo-600', to: 'to-blue-500' },
  { from: 'from-pink-500', via: 'via-pink-600', to: 'to-rose-500' },
  { from: 'from-teal-500', via: 'via-teal-600', to: 'to-cyan-500' },
  { from: 'from-amber-500', via: 'via-amber-600', to: 'to-yellow-500' },
  { from: 'from-violet-500', via: 'via-violet-600', to: 'to-purple-500' },
  { from: 'from-rose-500', via: 'via-rose-600', to: 'to-pink-500' },
  { from: 'from-emerald-500', via: 'via-emerald-600', to: 'to-green-500' },
  { from: 'from-cyan-500', via: 'via-cyan-600', to: 'to-blue-500' }
];

// Función para obtener un color único basado en el nombre del usuario
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};

export const UserAvatar: FC<UserAvatarProps> = ({
  firstName,
  lastName,
  fullName,
  avatarUrl,
  size = 'md',
  className = '',
  showStatus = false,
  isActive = true
}) => {
  let initials = 'U';
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (parts.length === 1) {
      initials = parts[0].charAt(0).toUpperCase();
    }
  } else if (firstName || lastName) {
    initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  }
  
  const displayName = fullName || `${firstName || ''} ${lastName || ''}`.trim() || 'Usuario';
  const resolvedAvatarUrl = avatarUrl ? resolveAssetUrl(avatarUrl) : null;
  const avatarColor = getAvatarColor(displayName);

  return (
    <div className={`relative inline-block ${className}`}>
      {resolvedAvatarUrl ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden`} style={{ borderRadius: '9999px' }}>
          <img
            src={resolvedAvatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            style={{ borderRadius: '9999px' }}
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${avatarColor.from} ${avatarColor.via} ${avatarColor.to} text-white font-semibold shadow-sm`}
          style={{ borderRadius: '9999px' }}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full border-2 border-white dark:border-slate-900 ${
            isActive ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
};

