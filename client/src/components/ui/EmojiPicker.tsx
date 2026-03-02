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
        className={`relative w-[min(320px,90vw)] h-[320px] overflow-hidden rounded-[24px] bg-transparent ${className ?? ''}`}
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          height: 'min(320px, calc(100vh - 2rem))'
        }}
      >
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
