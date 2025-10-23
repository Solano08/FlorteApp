import { forwardRef, TextareaHTMLAttributes } from 'react';
import classNames from 'classnames';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, rows = 4, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        {label}
        <textarea
          ref={ref}
          rows={rows}
          className={classNames(
            'rounded-xl border border-white/25 bg-white/20 px-3 py-2 text-xs text-[var(--color-text)] outline-none transition-all focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/15 dark:bg-white/10',
            error && 'border-red-400/80 focus:ring-red-400/40',
            className
          )}
          {...props}
        />
        {hint && !error && <span className="text-xs text-[var(--color-muted)]">{hint}</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </label>
    );
  }
);

TextArea.displayName = 'TextArea';
