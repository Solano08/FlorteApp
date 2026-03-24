import { useMemo } from 'react';
import { Activity, Flame, FolderKanban } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ActivityOverview, ActivitySummary } from '../../types/activity';

export type ProfileActivityPerspective = 'self' | 'other';

const panelBlackShadow =
  'shadow-[0_10px_28px_-4px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.48)]';

/** Sombra base negra; el tinte al hover/focus lo aporta `metricHoverShadow` por carta */
const metricTileBaseShadow =
  '!shadow-[0_6px_22px_-2px_rgba(0,0,0,0.28),0_2px_10px_-2px_rgba(0,0,0,0.12)] transition-shadow duration-ui dark:!shadow-[0_8px_28px_-2px_rgba(0,0,0,0.55),0_2px_12px_-2px_rgba(0,0,0,0.32)]';

/** Verde Sena (#39A900) — contribuciones y proyectos */
const metricHoverShadowGreen =
  'hover:!shadow-[0_10px_32px_-2px_rgba(57,169,0,0.38),0_4px_18px_-2px_rgba(57,169,0,0.22)] focus-visible:!shadow-[0_10px_32px_-2px_rgba(57,169,0,0.38),0_4px_18px_-2px_rgba(57,169,0,0.22)] dark:hover:!shadow-[0_12px_36px_-2px_rgba(57,169,0,0.5),0_4px_20px_-2px_rgba(57,169,0,0.28)] dark:focus-visible:!shadow-[0_12px_36px_-2px_rgba(57,169,0,0.5),0_4px_20px_-2px_rgba(57,169,0,0.28)]';

/** Ámbar (racha) */
const metricHoverShadowAmber =
  'hover:!shadow-[0_10px_32px_-2px_rgba(245,158,11,0.42),0_4px_18px_-2px_rgba(245,158,11,0.26)] focus-visible:!shadow-[0_10px_32px_-2px_rgba(245,158,11,0.42),0_4px_18px_-2px_rgba(245,158,11,0.26)] dark:hover:!shadow-[0_12px_36px_-2px_rgba(245,158,11,0.48),0_4px_20px_-2px_rgba(245,158,11,0.3)] dark:focus-visible:!shadow-[0_12px_36px_-2px_rgba(245,158,11,0.48),0_4px_20px_-2px_rgba(245,158,11,0.3)]';

const summaryFallback: ActivitySummary = {
  contributionsThisWeek: 0,
  activeProjects: 0,
  streakDays: 0,
  hasProjectActivity: false
};

type StatItem = {
  id: string;
  label: string;
  value: number;
  icon: typeof Activity;
  accent?: string;
  helper: string;
  hoverShadowClass: string;
};

function buildActivityStats(summary: ActivitySummary, perspective: ProfileActivityPerspective): StatItem[] {
  const { contributionsThisWeek, activeProjects, streakDays, hasProjectActivity } = summary;

  const contribHelper =
    perspective === 'self'
      ? contributionsThisWeek > 0
        ? 'Puntos sumados esta semana.'
        : 'Sin puntos esta semana.'
      : contributionsThisWeek > 0
        ? 'Actividad registrada esta semana.'
        : 'Sin actividad esta semana.';

  const projectsHelper =
    perspective === 'self'
      ? activeProjects > 0
        ? 'Proyectos en curso.'
        : 'Aún sin proyectos activos.'
      : activeProjects > 0
        ? 'Tiene proyectos en curso.'
        : 'Sin proyectos activos.';

  let streakHelper: string;
  if (perspective === 'self') {
    if (streakDays === 0) {
      streakHelper = 'Entra hoy para iniciar tu racha.';
    } else if (streakDays === 1) {
      streakHelper = 'Primer día. Vuelve mañana.';
    } else {
      streakHelper = `${streakDays} días seguidos en la app.`;
    }
  } else if (streakDays === 0) {
    streakHelper = 'Sin racha de días consecutivos.';
  } else if (streakDays === 1) {
    streakHelper = 'Un día de racha.';
  } else {
    streakHelper = `${streakDays} días de racha.`;
  }

  return [
    {
      id: 'contributions',
      label: 'Contribuciones',
      value: contributionsThisWeek,
      icon: Activity,
      accent: 'text-sena-green',
      helper: contribHelper,
      hoverShadowClass: metricHoverShadowGreen
    },
    {
      id: 'projects',
      label: 'Proyectos activos',
      value: activeProjects,
      icon: FolderKanban,
      helper: projectsHelper,
      hoverShadowClass: metricHoverShadowGreen
    },
    {
      id: 'streak',
      label: 'Racha activa',
      value: streakDays,
      icon: Flame,
      accent: 'text-amber-500',
      helper: streakHelper,
      hoverShadowClass: metricHoverShadowAmber
    }
  ];
}

type ProfileActivitySectionProps = {
  overview: ActivityOverview | undefined;
  isLoading: boolean;
  perspective: ProfileActivityPerspective;
  title?: string;
  subtitle?: string;
  className?: string;
};

export function ProfileActivitySection({
  overview,
  isLoading,
  perspective,
  title,
  subtitle,
  className
}: ProfileActivitySectionProps) {
  const activitySummary = overview?.summary ?? summaryFallback;
  const stats = useMemo(
    () => buildActivityStats(activitySummary, perspective),
    [activitySummary, perspective]
  );

  const defaultTitle = perspective === 'self' ? 'Mi actividad' : 'Actividad';
  const defaultSubtitle =
    perspective === 'self'
      ? 'Tu resumen en proyectos y conexión diaria.'
      : 'Resumen de participación y racha.';

  return (
    <Card
      className={
        className ??
        `overflow-visible border border-white/30 bg-white/60 ${panelBlackShadow} backdrop-blur-[14px] dark:border-white/15 dark:bg-white/10`
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">{title ?? defaultTitle}</h3>
          <p className="text-xs text-[var(--color-muted)]">{subtitle ?? defaultSubtitle}</p>
        </div>
        <span className="shrink-0 text-right text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
          Últimas
          <br />
          5 sem.
        </span>
      </div>
      <div className="mt-4 pb-1 sm:pb-2">
        {isLoading ? (
          <p className="text-xs text-[var(--color-muted)]">Cargando…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map(({ id, label, value, icon: Icon, accent, helper, hoverShadowClass }) => (
              <button
                key={id}
                type="button"
                aria-label={`${label}: ${value}. ${helper}`}
                className={`group relative flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/35 px-3 py-5 text-center ${metricTileBaseShadow} ${hoverShadowClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/45 focus-visible:ring-offset-2`}
              >
                <p className="text-4xl font-bold tabular-nums text-[var(--color-text)]">{value}</p>
                <Icon className={`h-7 w-7 shrink-0 ${accent ?? 'text-[var(--color-muted)]'}`} aria-hidden />
                <span
                  className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-2 w-max max-w-[200px] -translate-x-1/2 rounded-xl bg-neutral-900/92 px-2.5 py-1.5 text-center text-[10px] font-medium leading-snug text-white opacity-0 shadow-lg transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                  role="tooltip"
                >
                  {helper}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {!isLoading && perspective === 'self' && !activitySummary.hasProjectActivity && (
        <p className="mt-3 text-[11px] text-[var(--color-muted)]">
          Participa en proyectos para ver aquí tus métricas completas.
        </p>
      )}
    </Card>
  );
}
