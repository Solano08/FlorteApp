import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Camera } from 'lucide-react';

interface AvatarUploaderProps {
  imageUrl?: string | null;
  onSelect: (file: File) => void;
  loading?: boolean;
}

export const AvatarUploader = ({ imageUrl, onSelect, loading }: AvatarUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  return (
    <div className="relative inline-block">
      <div
        className={classNames(
          'h-28 w-28 overflow-hidden rounded-full border-[6px] border-white/30 shadow-[0_18px_38px_rgba(18,55,29,0.22)] dark:border-white/15',
          loading && 'opacity-70'
        )}
      >
        <img
          src={preview ?? imageUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg'}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-sena-green/90 text-white shadow-[0_16px_30px_rgba(57,169,0,0.35)] hover:bg-sena-green"
      >
        <Camera className="h-5 w-5" />
      </button>
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


