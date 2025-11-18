import { KeyboardEvent, useRef, useState } from 'react';
import classNames from 'classnames';
import { Camera } from 'lucide-react';

interface AvatarUploaderProps {
  imageUrl?: string | null;
  onSelect: (file: File) => void;
  loading?: boolean;
  showTriggerButton?: boolean;
}

export const AvatarUploader = ({
  imageUrl,
  onSelect,
  loading,
  showTriggerButton = true
}: AvatarUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  const handleOpenPicker = () => {
    if (loading) return;
    inputRef.current?.click();
  };

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
          src={preview ?? imageUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg'}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      </div>
      {showTriggerButton && (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-sena-green/90 text-white shadow-[0_16px_30px_rgba(57,169,0,0.35)] hover:bg-sena-green"
        >
          <Camera className="h-5 w-5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
};

