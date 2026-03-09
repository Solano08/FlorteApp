import { FC } from 'react';
import { Button } from '../ui/Button';

interface EmptyCommunitiesViewProps {
  onCreateCommunity?: () => void;
  onExploreCommunities?: () => void;
}

export const EmptyCommunitiesView: FC<EmptyCommunitiesViewProps> = ({
  onCreateCommunity,
  onExploreCommunities
}) => {
  return (
    <div className="flex h-full w-full items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-liquid p-6 text-center sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-32 w-32 rounded-2xl bg-sena-green/8 blur-3xl dark:bg-sena-green/10" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-2xl bg-sena-green/5 blur-3xl dark:bg-sena-green/8" />

        <div className="relative flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sena-green/12 text-sena-green shadow-[0_10px_30px_rgba(18,55,29,0.35)] sm:h-14 sm:w-14">
            <span className="text-xl sm:text-2xl">🌿</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl">
            Aún no formas parte de ninguna comunidad
          </h2>
          <p className="max-w-md text-sm text-[var(--color-muted)] sm:text-sm">
            Descubre espacios de aprendizaje, proyectos y conversación creados por otros
            aprendices o inicia tu propia comunidad desde cero.
          </p>
        </div>

        <div className="relative mt-5 flex flex-col items-stretch gap-3 sm:mt-6">
          <Button
            variant="primary"
            className="w-full justify-center py-2.5 text-sm font-semibold sm:text-sm"
            onClick={onExploreCommunities}
          >
            Explorar comunidades
          </Button>
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
            <span className="h-px w-10 bg-white/10" />
            <span>o</span>
            <span className="h-px w-10 bg-white/10" />
          </div>
          <Button
            variant="secondary"
            className="w-full justify-center border-white/40 bg-white/60 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:text-sm"
            onClick={onCreateCommunity}
          >
            Crear mi propia comunidad
          </Button>
        </div>
      </div>
    </div>
  );
};
