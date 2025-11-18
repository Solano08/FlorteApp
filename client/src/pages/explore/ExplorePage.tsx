import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BadgePlus, CalendarRange, Compass, Filter, Users } from 'lucide-react';

const trendingTopics = [
  { tag: '#InnovaciónSENA', posts: 128 },
  { tag: '#TalentoVerde', posts: 96 },
  { tag: '#FrontendChallenge', posts: 74 },
  { tag: '#AIHub', posts: 51 }
];

const recommendedGroups = [
  {
    name: 'Laboratorio de Innovación',
    members: 48,
    description: 'Experimenta con prototipos y comparte tus ideas con mentores.'
  },
  {
    name: 'Front-End Lovers',
    members: 63,
    description: 'Retos semanales, revisiones de código y mentorías 1:1.'
  },
  {
    name: 'Talento Verde',
    members: 32,
    description: 'Proyectos sostenibles y comunidades de impacto ambiental.'
  }
];

const recommendedProjects = [
  {
    title: 'SenaConnect',
    status: 'En progreso',
    description: 'Aplicación móvil para conectar aprendices con instructores.'
  },
  {
    title: 'GreenLab',
    status: 'Buscando colaboradores',
    description: 'Plataforma para monitorear huertas urbanas en tiempo real.'
  },
  {
    title: 'VR Workshop',
    status: 'Recién iniciado',
    description: 'Experiencias inmersivas para el aula de formación.'
  }
];

export const ExplorePage = () => {
  return (
    <DashboardLayout
      title="Explorar"
      subtitle="Descubre nuevas tendencias, grupos y proyectos para inspirarte."
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                <Compass className="h-4 w-4" /> Tendencias
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                Encuentra lo próximo que quieres aprender
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Explora cursos, comunidades, retos y nuevos proyectos impulsados por aprendices SENA.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 md:max-w-sm">
              <Input placeholder="Buscar proyectos, grupos o temas..." />
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" leftIcon={<Filter className="h-4 w-4" />}>
                  Filtros
                </Button>
                <Button className="flex-1" leftIcon={<BadgePlus className="h-4 w-4" />}>
                  Crear publicación
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Tendencias de hoy</h3>
                <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  Actualizado cada 10 minutos
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {trendingTopics.map((topic) => (
                  <button
                    key={topic.tag}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition hover:border-sena-green/50 hover:bg-[var(--color-accent-soft)]"
                  >
                    <p className="text-sm font-semibold text-sena-green">{topic.tag}</p>
                    <p className="text-xs text-[var(--color-muted)]">{topic.posts} publicaciones</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Proyectos recomendados</h3>
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {recommendedProjects.map((project) => (
                  <div
                    key={project.title}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-[var(--color-text)]">{project.title}</p>
                      <span className="rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{project.description}</p>
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" variant="primary">
                        Ver detalles
                      </Button>
                      <Button size="sm" variant="secondary">
                        Guardar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Eventos destacados</h3>
                <CalendarRange className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <p className="font-semibold text-[var(--color-text)]">Bootcamp de innovación digital</p>
                  <p className="text-xs text-[var(--color-muted)]">25 de Octubre · 9:00 AM</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <p className="font-semibold text-[var(--color-text)]">Taller de UI Design con Figma</p>
                  <p className="text-xs text-[var(--color-muted)]">28 de Octubre · 2:00 PM</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <p className="font-semibold text-[var(--color-text)]">Demo Day proyectos SENA</p>
                  <p className="text-xs text-[var(--color-muted)]">2 de Noviembre · 4:30 PM</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">Grupos que te pueden gustar</h3>
                <Users className="h-4 w-4 text-sena-green" />
              </div>
              <div className="mt-4 space-y-4">
                {recommendedGroups.map((group) => (
                  <div key={group.name} className="rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{group.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{group.members} miembros · Activo ahora</p>
                    <p className="mt-2 text-xs text-[var(--color-text)]">{group.description}</p>
                    <Button size="sm" className="mt-3 w-full">
                      Solicitar acceso
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
