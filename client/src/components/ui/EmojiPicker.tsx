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
        className={`w-[min(360px,92vw)] max-h-[420px] overflow-hidden rounded-2xl p-2 glass-liquid ${className ?? ''}`}
      >
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
    );
  }
);

EmojiPicker.displayName = 'EmojiPicker';
