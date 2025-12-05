import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Compass, Filter, Users } from 'lucide-react';
import { feedService } from '../../services/feedService';
import { projectService } from '../../services/projectService';
import { groupService } from '../../services/groupService';
import { FeedPostAggregate } from '../../types/feed';
import { Project } from '../../types/project';
import { Group } from '../../types/group';

type TrendingTag = { tag: string; count: number };

const statusLabels: Record<Project['status'], string> = {
  draft: 'Planeacion',
  in_progress: 'En progreso',
  completed: 'Completado'
};

export const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: feedPosts = [], isLoading: isLoadingFeed } = useQuery<FeedPostAggregate[]>({
    queryKey: ['feed', 'explore'],
    queryFn: () => feedService.listPosts({ limit: 50 })
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectService.listProjects
  });

  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: groupService.listGroups
  });

  const trendingTags = useMemo<TrendingTag[]>(() => {
    const counts = new Map<string, { tag: string; count: number }>();
    const term = searchTerm.trim().toLowerCase();

    feedPosts.forEach((post) => {
      (post.tags ?? []).forEach((rawTag) => {
        const normalized = rawTag.trim();
        if (!normalized) return;
        const key = normalized.startsWith('#') ? normalized.toLowerCase() : `#${normalized.toLowerCase()}`;
        const label = normalized.startsWith('#') ? normalized : `#${normalized}`;
        const current = counts.get(key) ?? { tag: label, count: 0 };
        counts.set(key, { tag: current.tag, count: current.count + 1 });
      });
    });

    return Array.from(counts.values())
      .filter((entry) => (!term ? true : entry.tag.toLowerCase().includes(term)))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [feedPosts, searchTerm]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const sorted = [...projects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const filtered = term
      ? sorted.filter(
          (project) =>
            project.title.toLowerCase().includes(term) ||
            (project.description ?? '').toLowerCase().includes(term)
        )
      : sorted;
    return filtered.slice(0, 3);
  }, [projects, searchTerm]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? groups.filter(
          (group) =>
            group.name.toLowerCase().includes(term) || (group.description ?? '').toLowerCase().includes(term)
        )
      : groups;
    return filtered.slice(0, 3);
  }, [groups, searchTerm]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">Explorar</h2>
        </div>

        <Card>
          <div className="relative mx-auto w-full max-w-3xl">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar proyectos, grupos o hashtags..."
              className="pr-24 text-center placeholder:text-center"
            />
            <Button
              type="button"
              variant="secondary"
              className="absolute bottom-2 right-2 px-3 py-2 text-xs shadow-[0_10px_20px_rgba(18,55,29,0.15)]"
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filtros
            </Button>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Proyectos recomendados</h3>
                <span className="text-xs text-[var(--color-muted)]">Datos reales del aplicativo</span>
              </div>
              <div className="mt-4 space-y-4">
                {isLoadingProjects ? (
                  <p className="text-sm text-[var(--color-muted)]">Cargando proyectos...</p>
                ) : filteredProjects.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No hay proyectos publicados por ahora. Sube el primero desde la seccion Proyectos.
                  </p>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-semibold text-[var(--color-text)]">{project.title}</p>
                        <span className="rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                          {statusLabels[project.status]}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-sm text-[var(--color-muted)] line-clamp-3">{project.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Tendencias</h3>
                <Compass className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-3">
                {isLoadingFeed ? (
                  <p className="text-sm text-[var(--color-muted)]">Cargando tendencias...</p>
                ) : trendingTags.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No hay tendencias todavia. Usa # en tus publicaciones para comenzar a verlas aqui.
                  </p>
                ) : (
                  trendingTags.map((topic) => (
                    <div
                      key={topic.tag}
                      className="rounded-xl border border-[var(--color-border)] px-4 py-3"
                    >
                      <p className="font-semibold text-[var(--color-text)]">{topic.tag}</p>
                      <p className="text-xs text-[var(--color-muted)]">{topic.count} publicaciones</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Grupos que te pueden gustar</h3>
                <Users className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-4">
                {isLoadingGroups ? (
                  <p className="text-sm text-[var(--color-muted)]">Cargando grupos...</p>
                ) : filteredGroups.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No hay grupos registrados todavia. Crea uno nuevo o busca mas tarde.
                  </p>
                ) : (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-[var(--color-border)] px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-[var(--color-text)]">{group.name}</p>
                      {group.description && (
                        <p className="mt-2 text-xs text-[var(--color-text)] line-clamp-3">{group.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
