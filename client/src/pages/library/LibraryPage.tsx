import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { ExternalLink, BookOpen, GraduationCap, Globe, FileText, X } from 'lucide-react';

interface LibraryResource {
  id: string;
  title: string;
  category: string;
  image: string;
  url?: string;
  type: 'external' | 'academic';
  content?: {
    title: string;
    description: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
}

const libraryResources: LibraryResource[] = [
  {
    id: 'betowa',
    title: 'Betowa',
    category: 'Plataforma Educativa',
    image: '/images/betowa-cover.jpg',
    url: 'https://betowa.sena.edu.co/',
    type: 'external'
  },
  {
    id: 'portal-ceet',
    title: 'Portal CEET',
    category: 'Centro de Excelencia',
    image: '/images/ceet-cover.jpg',
    url: 'https://www.gics-sennova.com/portal_ceet/',
    type: 'external'
  },
  {
    id: 'sofia-plus',
    title: 'Sofia Plus',
    category: 'Sistema de Gestión',
    image: '/images/sofia-cover.png',
    url: 'http://senasofiaplus.edu.co/sofia-public/',
    type: 'external'
  },
  {
    id: 'guia-innovacion',
    title: 'Guía de Innovación Tecnológica',
    category: 'Recurso Académico',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
    type: 'academic',
    content: {
      title: 'Guía de Innovación Tecnológica para Aprendices SENA',
      description: 'Esta guía te ayudará a comprender los fundamentos de la innovación tecnológica y cómo aplicarlos en tus proyectos de formación.',
      sections: [
        {
          title: 'Introducción a la Innovación',
          content: 'La innovación tecnológica es el proceso mediante el cual se introducen nuevos productos, servicios o procesos que mejoran la eficiencia y la calidad. En el contexto del SENA, la innovación se enfoca en desarrollar soluciones prácticas que respondan a las necesidades del sector productivo.'
        },
        {
          title: 'Metodologías de Innovación',
          content: 'Existen diversas metodologías que puedes aplicar en tus proyectos: Design Thinking, Lean Startup, Agile, entre otras. Cada una tiene sus propias características y se adapta mejor a diferentes tipos de proyectos. Es importante elegir la metodología que mejor se ajuste a tu contexto y objetivos.'
        },
        {
          title: 'Prototipado y Validación',
          content: 'El prototipado es una fase crucial en el proceso de innovación. Permite materializar ideas y validarlas con usuarios reales antes de invertir grandes recursos. Un buen prototipo debe ser funcional, representar la idea central y permitir obtener feedback valioso para iterar y mejorar.'
        },
        {
          title: 'Recursos y Herramientas',
          content: 'Para desarrollar proyectos innovadores, puedes utilizar diversas herramientas: plataformas de diseño como Figma, herramientas de gestión como Trello, entornos de desarrollo como Visual Studio Code, y plataformas de colaboración como GitHub. El SENA también ofrece acceso a laboratorios y equipos especializados.'
        },
        {
          title: 'Casos de Éxito',
          content: 'Muchos aprendices del SENA han desarrollado proyectos innovadores que han tenido impacto real. Estos casos demuestran que con dedicación, metodología adecuada y apoyo de instructores, es posible crear soluciones que transformen comunidades y sectores productivos.'
        }
      ]
    }
  }
];

export const LibraryPage = () => {
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  const handleResourceClick = (resource: LibraryResource) => {
    if (resource.type === 'external' && resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else if (resource.type === 'academic') {
      setSelectedResource(resource);
    }
  };

  const handleCloseModal = () => {
    setSelectedResource(null);
  };

  return (
    <DashboardLayout
      title="Biblioteca"
      subtitle="Encuentra las páginas oficiales del SENA y recursos académicos que te servirán en tu formación."
    >
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-sena-green" />
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text)]">
                Recursos Educativos y Plataformas Oficiales
              </h2>
              <p className="text-sm text-[var(--color-muted)]">
                Accede a las plataformas oficiales del SENA y recursos académicos seleccionados para tu aprendizaje.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {libraryResources.map((resource) => (
            <Card
              key={resource.id}
              onClick={() => handleResourceClick(resource)}
              className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {resource.type === 'external' && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-white/90 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <ExternalLink className="h-4 w-4 text-sena-green" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] line-clamp-2">
                      {resource.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold text-sena-green">
                      {resource.type === 'external' ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {resource.category}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <GlassDialog
          open={Boolean(selectedResource && selectedResource.type === 'academic')}
          onClose={handleCloseModal}
          size="xl"
        >
          {selectedResource?.content && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[var(--color-text)]">
                    {selectedResource.content.title}
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    {selectedResource.content.description}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-2 transition-colors hover:bg-white/10"
                >
                  <X className="h-5 w-5 text-[var(--color-text)]" />
                </button>
              </div>

              <div className="space-y-6">
                {selectedResource.content.sections.map((section, index) => (
                  <div key={index} className="space-y-3">
                    <h3 className="text-lg font-semibold text-sena-green">
                      {section.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-text)]">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg bg-sena-green px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-green/90"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </GlassDialog>
      </div>
    </DashboardLayout>
  );
};
