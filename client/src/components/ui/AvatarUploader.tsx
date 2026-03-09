import { forwardRef, KeyboardEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import classNames from 'classnames';
import { Camera } from 'lucide-react';
import { GlassDialog } from './GlassDialog';
import { ImageCropper } from './ImageCropper';
import { resolveAssetUrl } from '../../utils/media';

interface AvatarUploaderProps {
  imageUrl?: string | null;
  onSelect: (file: File) => void;
  loading?: boolean;
  showTriggerButton?: boolean;
}

export interface AvatarUploaderHandle {
  openPicker: () => void;
}

const AVATAR_SIZE = 400;

export const FALLBACK_AVATAR = 'https://avatars.dicebear.com/api/initials/FlorteApp.svg';

export const AvatarUploader = forwardRef<AvatarUploaderHandle, AvatarUploaderProps>(
  ({ imageUrl, onSelect, loading, showTriggerButton = true }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [cropperFile, setCropperFile] = useState<File | null>(null);
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);

    const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = '';
      const url = URL.createObjectURL(file);
      setCropperSrc(url);
      setCropperFile(file);
    };

    const handleCropperConfirm = useCallback(
      (file: File) => {
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        onSelect(file);
        closeCropper();
      },
      [onSelect]
    );

    const closeCropper = useCallback(() => {
      setCropperFile(null);
      if (cropperSrc) {
        URL.revokeObjectURL(cropperSrc);
        setCropperSrc(null);
      }
    }, [cropperSrc]);

    useEffect(() => setImgError(false), [imageUrl]);
    useEffect(() => {
      return () => {
        if (preview) URL.revokeObjectURL(preview);
        if (cropperSrc) URL.revokeObjectURL(cropperSrc);
      };
    }, [preview, cropperSrc]);

    const handleOpenPicker = useCallback(() => {
      if (loading) return;
      inputRef.current?.click();
    }, [loading]);

    useImperativeHandle(
      ref,
      () => ({
        openPicker: () => {
          handleOpenPicker();
        }
      }),
      [handleOpenPicker]
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpenPicker();
      }
    };

    const interactiveProps = showTriggerButton
      ? {}
      : ({
        role: 'button',
        tabIndex: 0,
        onClick: handleOpenPicker,
        onKeyDown: handleKeyDown,
        'aria-label': 'Actualizar foto de perfil'
      } as const);

    return (
      <div className="relative inline-block">
        <div
          {...interactiveProps}
          className={classNames(
            'h-28 w-28 overflow-hidden rounded-full border-[6px] border-white/30 shadow-[0_18px_38px_rgba(18,55,29,0.22)] dark:border-white/15',
            loading && 'opacity-70',
            !showTriggerButton &&
            'cursor-pointer focus:outline-none focus:ring-2 focus:ring-sena-green/40 focus:ring-offset-2 focus:ring-offset-white/10'
          )}
        >
          <img
            src={preview ?? (imgError ? FALLBACK_AVATAR : resolveAssetUrl(imageUrl)) ?? FALLBACK_AVATAR}
            alt="Avatar"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
        {showTriggerButton && (
          <button
            type="button"
            onClick={handleOpenPicker}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full text-sena-green glass-liquid transition hover:bg-white"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />
        <GlassDialog
          open={Boolean(cropperSrc)}
          onClose={closeCropper}
          size="lg"
          contentClassName="max-w-xl"
        >
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Recortar foto de perfil</h3>
          {cropperSrc && (
            <ImageCropper
              imageSrc={cropperSrc}
              aspectRatio={1}
              outputWidth={AVATAR_SIZE}
              outputHeight={AVATAR_SIZE}
              outputFileName="avatar.jpg"
              onConfirm={handleCropperConfirm}
              onCancel={closeCropper}
              confirmLabel="Aplicar"
              cancelLabel="Cancelar"
            />
          )}
        </GlassDialog>
      </div>
    );
  }
);

AvatarUploader.displayName = 'AvatarUploader';
