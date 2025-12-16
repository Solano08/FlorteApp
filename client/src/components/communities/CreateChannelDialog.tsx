import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlassDialog } from '../ui/GlassDialog';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Button } from '../ui/Button';

const createChannelSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  description: z.string().max(500).optional()
});

type CreateChannelValues = z.infer<typeof createChannelSchema>;

interface CreateChannelDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateChannelValues) => Promise<void>;
  isLoading?: boolean;
}

export const CreateChannelDialog = ({
  open,
  onClose,
  onSubmit,
  isLoading = false
}: CreateChannelDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateChannelValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const handleFormSubmit = async (values: CreateChannelValues) => {
    await onSubmit(values);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <GlassDialog open={open} onClose={handleClose} size="sm">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Crear Canal</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Crea un nuevo canal para organizar conversaciones
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            label="Nombre del canal"
            placeholder="Ej: recursos, proyectos, general"
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <TextArea
            label="Descripción (opcional)"
            placeholder="¿De qué trata este canal?"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting || isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || isLoading}
            >
              Crear Canal
            </Button>
          </div>
        </form>
      </div>
    </GlassDialog>
  );
};






