import { ReactNode } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

const authVideo = import.meta.env.VITE_AUTH_VIDEO_URL as string | undefined;

export const AuthLayout = ({ title, description, children }: AuthLayoutProps) => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        {authVideo ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={authVideo}
            autoPlay
            muted
            loop
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sena-green via-sena-light to-emerald-400" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/70">Bienvenido a</p>
            <h1 className="text-4xl font-bold">FlorteApp</h1>
            <p className="mt-4 max-w-md text-white/80">
              Conecta con aprendices del SENA, comparte proyectos, organiza grupos de estudio y lleva tus ideas a otro nivel.
            </p>
          </div>
          <div className="space-y-2 text-sm text-white/70">
            <p>Modo dual claro/oscuro · Chats colaborativos · Biblioteca de recursos · Gestión de proyectos</p>
            <p className="font-semibold text-white">#OrgulloSENA</p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6 py-12">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-[var(--color-text)]">{title}</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-card">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
