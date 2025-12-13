import { forwardRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

type EmojiSelectEvent = {
  native?: string;
  shortcodes?: string;
};

export const EmojiPicker = forwardRef<HTMLDivElement, EmojiPickerProps>(
  ({ onEmojiSelect, onClose, theme = 'light', className }, ref) => {
    const handleEmojiSelect = (emoji: EmojiSelectEvent) => {
      const value = emoji?.native ?? emoji?.shortcodes ?? '';
      if (value) {
        onEmojiSelect(value);
      }
      onClose?.();
    };

    return (
      <div
        ref={ref}
        className={`relative w-[min(320px,90vw)] h-[320px] overflow-hidden rounded-[24px] p-2 glass-liquid shadow-[0_12px_40px_rgba(0,0,0,0.15)] ${className ?? ''}`}
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          height: 'min(320px, calc(100vh - 2rem))'
        }}
      >
        {/* Efectos visuales glass liquid */}
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_60%)] opacity-50 dark:opacity-15 mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.15),_transparent_60%)] opacity-40 dark:opacity-8 mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/8 via-transparent to-white/3 dark:from-white/3 dark:to-transparent opacity-40" />
        
        <div className="relative z-10 h-full">
          <Picker
            data={data}
            theme={theme}
            previewPosition="none"
            navPosition="bottom"
            perLine={8}
            emojiSize={20}
            emojiButtonSize={32}
            skinTonePosition="search"
            searchPosition="top"
            onEmojiSelect={handleEmojiSelect}
          />
        </div>
      </div>
    );
  }
);

EmojiPicker.displayName = 'EmojiPicker';
