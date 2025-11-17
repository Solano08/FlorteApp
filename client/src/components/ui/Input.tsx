import { forwardRef, InputHTMLAttributes } from 'react';
import classNames from 'classnames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, type = 'text', ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        {label}
        <input
          ref={ref}
          type={type}
          className={classNames(
            'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[var(--color-text)] outline-none transition-all focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/15 dark:bg-white/10',
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

Input.displayName = 'Input';
