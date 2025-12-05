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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6 auth-background">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-sena-green/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-emerald-400/10 blur-[100px] animate-pulse delay-700" />

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="glass-liquid relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:shadow-sena-green/20">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-sena-green to-emerald-600 bg-clip-text text-4xl font-bold text-transparent">
            FlorteApp
          </h1>
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
};
