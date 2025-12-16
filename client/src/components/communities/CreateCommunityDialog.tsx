import { useState, DragEvent, ChangeEvent, FormEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import { GlassDialog } from '../ui/GlassDialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface CreateCommunityDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; iconFile?: File | null }) => Promise<void>;
  isLoading?: boolean;
}

const NAME_MAX_LENGTH = 40;

export const CreateCommunityDialog = ({
  open,
  onClose,
  onSubmit,
  isLoading = false
}: CreateCommunityDialogProps) => {
  const [name, setName] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setName('');
    setIconFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetState();
    onClose();
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setIconFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      handleFile(file);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Ponle un nombre bonito a tu comunidad');
      return;
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      setError(`El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres`);
      return;
    }

    try {
      setError(null);
      await onSubmit({ name: trimmedName, iconFile });
      resetState();
      onClose();
    } catch (err) {
      // El error se maneja desde la mutación en el padre
      // pero dejamos un fallback por si acaso
      setError('No se pudo crear la comunidad. Intenta nuevamente.');
    }
  };

  if (!open) return null;

  return (
    <GlassDialog open={open} onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Crear comunidad
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            En segundos tendrás un espacio para compartir con tu equipo o amigos.
          </p>
        </div>

        {/* Icono / imagen de la comunidad */}
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Icono de la comunidad
          </label>
          <div
            className="space-y-3 rounded-2xl border border-dashed border-white/30 bg-white/40 p-3 text-center text-xs text-[var(--color-muted)] shadow-sm dark:bg-slate-800/60 dark:border-white/15"
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/70 text-[var(--color-muted)] shadow-sm dark:bg-slate-900/70">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Icono de la comunidad"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-7 w-7" />
              )}
            </div>
            <p className="text-[11px]">
              Arrastra una imagen aquí o{' '}
              <label className="cursor-pointer font-medium text-sena-green hover:text-emerald-500">
                elige un archivo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={isLoading}
                />
              </label>
              .
            </p>
          </div>
        </div>

        {/* Nombre de la comunidad */}
        <div className="space-y-1">
          <Input
            label="Nombre de la comunidad"
            placeholder="Ej: Comunidad ADSO, Florte Devs, Proyecto Sena"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, NAME_MAX_LENGTH))}
            error={error || undefined}
          />
          <div className="flex justify-end text-[11px] text-[var(--color-muted)]">
            {name.length}/{NAME_MAX_LENGTH}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isLoading}
          >
            Crear comunidad
          </Button>
        </div>
      </form>
    </GlassDialog>
  );
};


