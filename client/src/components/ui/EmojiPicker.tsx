import { forwardRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '../../hooks/useTheme';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  /** Si no se pasa, sigue el tema de la app (clase `.dark`). */
  theme?: 'light' | 'dark';
  className?: string;
  /**
   * Evita altura fija extra: el hitbox coincide con el panel real (menos zona vacía clicable).
   * Recomendado en chats con portal o posición fija.
   */
  compactBounds?: boolean;
  /** Límite vertical en px (p. ej. espacio sobre el botón al abrir hacia arriba). */
  maxHeightPx?: number;
}

type EmojiSelectEvent = {
  native?: string;
  shortcodes?: string;
};

export const EmojiPicker = forwardRef<HTMLDivElement, EmojiPickerProps>(
  ({ onEmojiSelect, onClose, theme: themeProp, className, compactBounds, maxHeightPx }, ref) => {
    const { mode } = useTheme();
    const theme = themeProp ?? (mode === 'dark' ? 'dark' : 'light');

    const handleEmojiSelect = (emoji: EmojiSelectEvent) => {
      const value = emoji?.native ?? emoji?.shortcodes ?? '';
      if (value) {
        onEmojiSelect(value);
      }
      onClose?.();
    };

    const waHover =
      theme === 'dark'
        ? ['rgba(37, 211, 102, 0.16)', 'rgba(0, 168, 132, 0.12)']
        : ['rgba(0, 168, 132, 0.12)', 'rgba(37, 211, 102, 0.08)'];

    const defaultMax = 'min(435px, calc(100vh - 2rem))';
    const maxHeightStyle =
      maxHeightPx != null ? `${Math.max(120, maxHeightPx)}px` : defaultMax;

    return (
      <div
        ref={ref}
        className={`emoji-picker-shell relative w-[min(340px,92vw)] overflow-hidden rounded-2xl bg-transparent ${compactBounds ? 'emoji-picker-compact' : ''} ${className ?? ''}`}
        style={
          compactBounds
            ? { maxHeight: maxHeightStyle }
            : {
                maxHeight: defaultMax,
                height: defaultMax
              }
        }
      >
        <div
          className={
            compactBounds ? 'relative z-10 min-h-0' : 'relative z-10 h-full min-h-0'
          }
        >
          <Picker
            data={data}
            theme={theme}
            locale="es"
            previewPosition="none"
            navPosition="top"
            searchPosition="sticky"
            perLine={8}
            emojiSize={22}
            emojiButtonSize={34}
            emojiButtonRadius="100%"
            emojiButtonColors={waHover}
            icons={theme === 'dark' ? 'solid' : 'outline'}
            skinTonePosition="search"
            onEmojiSelect={handleEmojiSelect}
          />
        </div>
      </div>
    );
  }
);

EmojiPicker.displayName = 'EmojiPicker';
