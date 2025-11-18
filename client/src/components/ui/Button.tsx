import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

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
      'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-sena-green/90 text-white shadow-[0_12px_20px_rgba(57,169,0,0.22)] hover:bg-sena-green focus:ring-sena-green/35',
      secondary:
        'bg-white/30 text-[var(--color-text)] border border-white/40 hover:border-sena-green/60 hover:text-sena-green shadow-[0_10px_18px_rgba(18,55,29,0.12)] focus:ring-sena-green/30 dark:bg-white/10 dark:text-white',
      ghost:
        'bg-transparent text-[var(--color-text)] hover:text-sena-green hover:bg-[var(--color-accent-soft)] focus:ring-sena-green/30'
    };

    const sizes: Record<ButtonSize, string> = {
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
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
        )}
        <span>{children}</span>
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
