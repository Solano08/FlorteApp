import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Camera } from 'lucide-react';

interface AvatarUploaderProps {
  imageUrl?: string | null;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  loading?: boolean;
}

export const AvatarUploader = ({ imageUrl, onSelect, onRemove, loading }: AvatarUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onSelect(file);
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    if (loading) return;
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="relative inline-block" ref={menuRef}>
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
      <div className="absolute bottom-1 -right-3 sm:-right-4">
        <button
          type="button"
          onClick={toggleMenu}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-sena-green/90 text-white shadow-[0_16px_30px_rgba(57,169,0,0.35)] transition hover:bg-sena-green disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-44 translate-x-5 rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-sm text-slate-600 shadow-[0_20px_50px_rgba(15,38,25,0.25)] backdrop-blur dark:border-white/20 dark:bg-slate-900/90 dark:text-white">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-sena-green/10"
              onClick={() => {
                setMenuOpen(false);
                inputRef.current?.click();
              }}
            >
              Actualizar foto
            </button>
            {onRemove && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-50"
                onClick={() => {
                  setMenuOpen(false);
                  onRemove();
                }}
              >
                Eliminar foto
              </button>
            )}
          </div>
        )}
      </div>
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

