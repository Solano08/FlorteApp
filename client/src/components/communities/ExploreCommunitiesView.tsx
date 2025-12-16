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
  onCreateCommunity?: () => void;
}

export const ExploreCommunitiesView: FC<ExploreCommunitiesViewProps> = ({
  communities,
  isLoading,
  searchTerm,
  onSearchTermChange,
  onSelectCommunity,
  onCreateCommunity
}) => {
  return (
    <div className="flex h-full flex-1 flex-col gap-5 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-white/90 to-slate-50/80 backdrop-blur-xl dark:from-slate-950/80 dark:via-slate-900/90 dark:to-slate-950/80">
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
            {communities.map((community) => (
              <Card
                key={community.id}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-slate-50/90 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white/40 transition-all duration-300 hover:-translate-y-1 hover:border-sena-green/50 hover:shadow-[0_22px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/90 dark:ring-white/15"
                onClick={() => onSelectCommunity(community.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Icono */}
                  {community.iconUrl ? (
                    <img
                      src={resolveAssetUrl(community.iconUrl) ?? ''}
                      alt={community.name}
                      className="h-10 w-10 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/60 dark:ring-white/20"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sena-green/20 to-emerald-500/25 text-sena-green ring-1 ring-white/60 dark:ring-white/20">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
                        {community.name}
                      </h3>
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
