import { FC } from 'react';
import classNames from 'classnames';
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
  /** IDs de comunidades a las que el usuario ya pertenece (para mostrar "Ya te uniste"). */
  joinedCommunityIds: Set<string>;
  onSelectCommunity: (communityId: string) => void;
  onCreateCommunity?: () => void;
}

export const ExploreCommunitiesView: FC<ExploreCommunitiesViewProps> = ({
  communities,
  isLoading,
  searchTerm,
  onSearchTermChange,
  joinedCommunityIds,
  onSelectCommunity,
  onCreateCommunity
}) => {
  return (
    <div className="flex h-full flex-1 flex-col gap-5 px-6 py-5 glass-liquid">
      {/* Encabezado elegante */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text)] md:text-xl">
          Explora comunidades
        </h1>
        <p className="text-xs text-[var(--color-muted)] md:text-sm">
          Encuentra espacios donde compartir proyectos, resolver dudas y conectar con otros
          aprendices del CEET.
        </p>
      </div>

      {/* Barra de búsqueda centrada */}
      <div className="flex justify-center pt-1">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <Input
            placeholder="Buscar comunidades por nombre o descripción"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-9 text-sm placeholder:text-xs md:placeholder:text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <p className="text-sm text-[var(--color-muted)]">Cargando comunidades públicas…</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="max-w-md text-center space-y-3">
            <p className="text-sm text-[var(--color-muted)]">
              No se encontraron comunidades para tu búsqueda.
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Puedes ajustar tu búsqueda o crear una nueva comunidad para tu equipo.
            </p>
            {onCreateCommunity && (
              <Button
                variant="primary"
                className="mt-2"
                onClick={onCreateCommunity}
              >
                Crear mi propia comunidad
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="mx-auto grid max-w-6xl gap-4 px-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {communities.map((community) => {
              const isJoined = joinedCommunityIds.has(community.id);
              return (
                <Card
                  key={community.id}
                  className={classNames(
                    'group flex h-full cursor-pointer flex-col justify-between rounded-2xl glass-liquid p-3 transition-all duration-ui hover:-translate-y-1 hover:ring-2',
                    isJoined
                      ? 'ring-1 ring-sena-green/20 hover:ring-sena-green/25'
                      : 'hover:ring-sena-green/40'
                  )}
                  onClick={() => onSelectCommunity(community.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    {community.iconUrl ? (
                      <img
                        src={resolveAssetUrl(community.iconUrl) ?? ''}
                        alt={community.name}
                        className="h-10 w-10 flex-shrink-0 rounded-2xl object-cover ring-1 ring-white/60 dark:ring-white/20"
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sena-green/20 to-emerald-500/25 text-sena-green ring-1 ring-white/60 dark:ring-white/20">
                        <Users className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
                          {community.name}
                        </h3>
                        {isJoined && (
                          <span className="inline-flex shrink-0 rounded-full bg-sena-green/15 px-2 py-0.5 text-[10px] font-semibold text-sena-green dark:bg-sena-green/25">
                            Ya te uniste
                          </span>
                        )}
                      </div>
                      {community.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                          {community.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {community.memberCount ?? 0}{' '}
                        {community.memberCount === 1 ? 'miembro' : 'miembros'}
                      </span>
                    </div>
                    <Button
                      variant={isJoined ? 'secondary' : 'primary'}
                      size="xs"
                      className="h-7 px-3 text-[11px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCommunity(community.id);
                      }}
                    >
                      {isJoined ? 'Abrir comunidad' : 'Ingresar'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
