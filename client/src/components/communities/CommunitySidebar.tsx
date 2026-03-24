import { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Compass } from 'lucide-react';
import { Group } from '../../types/group';
import { resolveAssetUrl } from '../../utils/media';

interface CommunitySidebarProps {
  communities: Group[];
  isLoading?: boolean;
  onCreateCommunity?: () => void;
  onExploreCommunities?: () => void;
  /** Si se define, se usa al pulsar una comunidad (p. ej. salir de "Explorar" y abrir la comunidad). */
  onSelectCommunity?: (communityId: string) => void;
}

export const CommunitySidebar: FC<CommunitySidebarProps> = ({
  communities,
  isLoading,
  onCreateCommunity,
  onExploreCommunities,
  onSelectCommunity
}) => {
  const navigate = useNavigate();
  const { communityId } = useParams<{ communityId?: string }>();

  const goToCommunity = (id: string) => {
    if (onSelectCommunity) {
      onSelectCommunity(id);
    } else {
      navigate(`/communities/${id}`);
    }
  };

  return (
    <aside className="relative z-[100] flex h-full w-[80px] flex-col items-center justify-between glass-liquid px-3 py-4 overflow-visible">
      {/* Lista de comunidades */}
      <div className="relative z-[100] flex flex-1 flex-col items-center gap-3 overflow-y-visible overflow-x-visible py-4 px-2">
        {isLoading ? (
          <div className="mt-4 text-[10px] text-[var(--color-muted)]">Cargando...</div>
        ) : communities.length === 0 ? (
          <div className="mt-4 px-1 text-center text-[10px] text-[var(--color-muted)]">
            Aún no tienes
            <br />
            comunidades
          </div>
        ) : (
          communities.map((community) => {
            const isActive = community.id === communityId;
            return (
              <div
                key={community.id}
                className="relative flex items-center justify-center overflow-visible"
                style={{ 
                  padding: isActive ? '4px' : '2px',
                  minWidth: isActive ? '56px' : '52px',
                  minHeight: isActive ? '56px' : '52px'
                }}
              >
                <button
                  type="button"
                  onClick={() => goToCommunity(community.id)}
                  className={`group relative z-[200] flex h-12 w-12 items-center justify-center rounded-2xl overflow-visible transition-all duration-ui ${
                    isActive
                      ? 'glass-liquid-strong text-sena-green ring-2 ring-sena-green/40 scale-[1.02]'
                      : 'glass-liquid text-[var(--color-text)] hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md'
                  }`}
                >
                  {community.iconUrl ? (
                    <img
                      src={resolveAssetUrl(community.iconUrl) ?? ''}
                      alt={community.name}
                      className={`h-9 w-9 rounded-2xl object-cover shadow-sm transition-transform duration-ui ${
                        isActive ? 'scale-[1.01]' : 'group-hover:scale-[1.04]'
                      }`}
                    />
                  ) : (
                    <span className="text-xs font-semibold">
                      {community.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {/* Etiqueta a la derecha del icono */}
                  <span className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl bg-neutral-900/95 dark:bg-neutral-800/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] group-hover:inline-flex" style={{ position: 'absolute' }}>
                    {community.name}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Botones inferiores */}
      <div className="mt-4 flex flex-col items-center gap-3 pb-2">
        <button
          type="button"
          onClick={onCreateCommunity}
          className="flex h-10 w-10 items-center justify-center rounded-2xl glass-liquid text-[var(--color-text)] transition-all duration-ui hover:scale-110 hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExploreCommunities}
          className="flex h-10 w-10 items-center justify-center rounded-2xl glass-liquid text-[var(--color-text)] transition-all duration-ui hover:scale-110 hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md"
        >
          <Compass className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};
