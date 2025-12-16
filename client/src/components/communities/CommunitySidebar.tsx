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
}

export const CommunitySidebar: FC<CommunitySidebarProps> = ({
  communities,
  isLoading,
  onCreateCommunity,
  onExploreCommunities
}) => {
  const navigate = useNavigate();
  const { communityId } = useParams<{ communityId?: string }>();

  return (
    <aside className="relative z-[100] flex h-full w-[80px] flex-col items-center justify-between bg-gradient-to-b from-white/70 via-white/50 to-white/70 dark:from-slate-800/70 dark:via-slate-800/50 dark:to-slate-800/70 backdrop-blur-xl px-4 py-4 shadow-[2px_0_20px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_20px_rgba(0,0,0,0.2)]">
      {/* Lista de comunidades */}
      <div className="relative z-[100] flex flex-1 flex-col items-center gap-3 overflow-y-auto overflow-x-visible py-2 px-2">
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
              <button
                key={community.id}
                onClick={() => navigate(`/communities/${community.id}`)}
                className={`group relative z-[200] flex h-12 w-12 items-center justify-center rounded-3xl overflow-visible transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-b from-sena-green/15 via-emerald-500/8 to-sena-green/15 text-[var(--color-text)] shadow-[0_10px_24px_rgba(57,169,0,0.25)] ring-2 ring-sena-green/60 border border-white/60 dark:border-slate-700/60 scale-[1.02]'
                    : 'bg-white/80 dark:bg-slate-700/80 text-[var(--color-text)] hover:bg-white/95 dark:hover:bg-slate-700/95 hover:shadow-md'
                }`}
              >
                {community.iconUrl ? (
                  <img
                    src={resolveAssetUrl(community.iconUrl) ?? ''}
                    alt={community.name}
                    className={`h-9 w-9 rounded-2xl object-cover shadow-sm transition-transform duration-200 ${
                      isActive ? 'scale-[1.01]' : 'group-hover:scale-[1.04]'
                    }`}
                  />
                ) : (
                  <span className="text-xs font-semibold">
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-[110] mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] group-hover:block">
                  {community.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Botones inferiores */}
      <div className="mt-4 flex flex-col items-center gap-3 pb-2">
        <button
          type="button"
          onClick={onCreateCommunity}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-700/80 text-[var(--color-text)] shadow-sm transition-all duration-300 hover:scale-110 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExploreCommunities}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-700/80 text-[var(--color-text)] shadow-sm transition-all duration-300 hover:scale-110 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md"
        >
          <Compass className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};
