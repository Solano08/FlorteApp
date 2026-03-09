import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth,
      loading,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-1.5 rounded-2xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-sena-green/85 text-white backdrop-blur-sm shadow-[0_8px_25px_rgba(57,169,0,0.2)] hover:shadow-[0_12px_30px_rgba(57,169,0,0.3)] hover:scale-[1.02] hover:bg-sena-green/95 focus:ring-sena-green/35 active:scale-95 border border-white/10',
      secondary:
        'bg-white/10 text-[var(--color-text)] backdrop-blur-md border border-white/20 hover:border-white/40 hover:bg-white/20 hover:text-sena-green shadow-sm focus:ring-sena-green/20 dark:bg-white/5 dark:hover:bg-white/10',
      ghost:
        'bg-white/5 text-[var(--color-text)] border border-white/10 hover:bg-white/15 hover:border-white/25 hover:text-[var(--color-text)] focus:ring-transparent backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-95 dark:bg-white/5 dark:hover:bg-white/10',
      destructive:
        'bg-red-500/90 text-white backdrop-blur-sm hover:bg-red-600 focus:ring-red-500/35 active:scale-95 border border-white/10'
    };

    const sizes: Record<ButtonSize, string> = {
      xs: 'px-2 py-1 text-[11px]',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base'
    };

    return (
      <button
        ref={ref}
        className={classNames(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-70 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon}
        {loading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-2xl border-2 border-white border-b-transparent" />
        )}
        <span>{children}</span>
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
