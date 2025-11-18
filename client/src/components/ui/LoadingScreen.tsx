export const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-[var(--color-background)]">
    <div className="flex flex-col items-center gap-4">
      <div className="h-16 w-16 rounded-full border-4 border-sena-green border-b-transparent animate-spin" />
      <p className="text-sm text-[var(--color-muted)]">Cargando FlorteApp...</p>
    </div>
  </div>
);
