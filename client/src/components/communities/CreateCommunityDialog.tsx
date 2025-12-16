import { useState, DragEvent, ChangeEvent, FormEvent } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setName('');
    setIconFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetState();
    onClose();
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona una imagen válida');
      return;
    }
    setIconFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setError(null);
  };

  const handleRemoveImage = () => {
    setIconFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
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
      setError('El nombre es obligatorio');
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
      setError('No se pudo crear la comunidad. Intenta nuevamente.');
    }
  };

  if (!open) return null;

  return (
    <GlassDialog open={open} onClose={handleClose} size="md">
      <div className="glass-frosted-card rounded-3xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sena-green">
              <span>Comunidad</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Crear nueva comunidad
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Diseña un espacio seguro y colaborativo para tu equipo
            </p>
          </div>

          {/* Área de subida de imagen */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[var(--color-text)]">
              Foto de perfil
            </label>
            <div
              className={`group relative rounded-3xl border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? 'border-sena-green/60 bg-sena-green/5 dark:bg-sena-green/10'
                  : 'border-white/40 dark:border-white/15 bg-white/30 dark:bg-slate-800/30'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
            {previewUrl ? (
              <div className="relative p-4">
                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl ring-2 ring-white/40 dark:ring-white/10 shadow-lg">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 text-red-500 shadow-md transition-all duration-200 hover:scale-110 hover:bg-white dark:hover:bg-slate-800"
                  aria-label="Eliminar imagen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sena-green/10 dark:bg-sena-green/20">
                  <Upload className="h-7 w-7 text-sena-green dark:text-emerald-400" />
                </div>
                <p className="mb-1 text-sm font-medium text-[var(--color-text)]">
                  Arrastra una imagen aquí
                </p>
                <p className="mb-4 text-xs text-[var(--color-muted)]">
                  o haz clic para seleccionar
                </p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-sena-green/10 dark:bg-sena-green/20 px-4 py-2 text-sm font-medium text-sena-green dark:text-emerald-400 transition-all duration-200 hover:bg-sena-green/20 dark:hover:bg-sena-green/30">
                    <ImagePlus className="h-4 w-4" />
                    Elegir archivo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

          {/* Campo de nombre */}
          <div className="space-y-2">
            <label htmlFor="community-name" className="block text-xs font-medium text-[var(--color-text)]">
              Nombre de la comunidad
            </label>
            <Input
              id="community-name"
              placeholder="Ej: Mi Comunidad, Proyecto SENA, Equipo Dev"
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, NAME_MAX_LENGTH));
                setError(null);
              }}
              error={error || undefined}
              className="text-base rounded-2xl"
              disabled={isLoading}
            />
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--color-muted)]">
                {name.length > 0 && `${name.length} de ${NAME_MAX_LENGTH} caracteres`}
              </span>
              {name.length > 0 && (
                <span className="text-[var(--color-muted)]">
                  {NAME_MAX_LENGTH - name.length} restantes
                </span>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="px-5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={!name.trim()}
              className="px-6"
            >
              Crear comunidad
            </Button>
          </div>
        </form>
      </div>
    </GlassDialog>
  );
};


