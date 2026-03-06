import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Button } from './Button';

export interface ImageCropperProps {
  /** URL de la imagen a recortar (object URL del archivo) */
  imageSrc: string;
  /** Relación de aspecto (ej: 1 para cuadrado, 4 para 4:1) */
  aspectRatio?: number;
  /** Ancho de salida en píxeles */
  outputWidth?: number;
  /** Alto de salida en píxeles */
  outputHeight?: number;
  /** Nombre del archivo de salida */
  outputFileName?: string;
  /** Callback al confirmar con el archivo recortado */
  onConfirm: (file: File) => void;
  /** Callback al cancelar */
  onCancel: () => void;
  /** Texto del botón confirmar */
  confirmLabel?: string;
  /** Texto del botón cancelar */
  cancelLabel?: string;
}

export const ImageCropper = ({
  imageSrc,
  aspectRatio = 1,
  outputWidth,
  outputHeight,
  outputFileName = 'cropped-image.jpg',
  onConfirm,
  onCancel,
  confirmLabel = 'Aplicar',
  cancelLabel = 'Cancelar'
}: ImageCropperProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initCropper = useCallback(() => {
    if (!imageRef.current || !imageSrc) return;

    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    cropperRef.current = new Cropper(imageRef.current, {
      aspectRatio,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.9,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false
    });
  }, [imageSrc, aspectRatio]);

  useEffect(() => {
    initCropper();
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [initCropper]);

  const handleConfirm = () => {
    if (!cropperRef.current) return;
    setIsProcessing(true);

    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: outputWidth,
        height: outputHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      if (!canvas) {
        setIsProcessing(false);
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const ext = outputFileName.split('.').pop() || 'jpg';
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          const file = new File([blob], outputFileName, { type: mime });
          onConfirm(file);
          setIsProcessing(false);
        },
        'image/jpeg',
        0.92
      );
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[min(60vh,400px)] w-full overflow-hidden rounded-2xl bg-neutral-900">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Recortar"
          className="block max-h-full max-w-full"
          style={{ maxHeight: 'min(60vh, 400px)' }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isProcessing}>
          {cancelLabel}
        </Button>
        <Button size="sm" onClick={handleConfirm} loading={isProcessing} disabled={isProcessing}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};
