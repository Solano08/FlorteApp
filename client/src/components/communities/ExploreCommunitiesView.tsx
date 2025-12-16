import { FC } from 'react';
import { Group } from '../../types/group';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Users, Search } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/media';

interface ExploreCommunitiesViewProps {
  communities: Group[];
  isLoading?: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectCommunity: (communityId: string) => void;
}

export const ExploreCommunitiesView: FC<ExploreCommunitiesViewProps> = ({
  communities,
  isLoading,
  searchTerm,
  onSearchTermChange,
  onSelectCommunity
}) => {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 px-6 py-4">
      {/* Barra de búsqueda centrada */}
      <div className="flex justify-center pt-2">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
          </div>
          <Input
            placeholder="Buscar comunidades por nombre o descripción"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="text-center placeholder:text-center pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-[var(--color-muted)]">Cargando comunidades...</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-[var(--color-muted)]">
            No se encontraron comunidades públicas para tu búsqueda.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="mx-auto grid max-w-6xl gap-4 px-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-white/60 bg-white/90 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sena-green/40 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/90"
                onClick={() => onSelectCommunity(community.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Icono */}
                  {community.iconUrl ? (
                    <img
                      src={resolveAssetUrl(community.iconUrl) ?? ''}
                      alt={community.name}
                      className="h-10 w-10 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/40 dark:ring-white/15"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sena-green/20 to-emerald-500/20 text-sena-green ring-1 ring-white/40 dark:ring-white/15">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {community.name}
                    </h3>
                    {community.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                        {community.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {community.memberCount ?? 0}{' '}
                      {community.memberCount === 1 ? 'miembro' : 'miembros'}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="xs"
                    className="h-7 px-3 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCommunity(community.id);
                    }}
                  >
                    Ingresar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
