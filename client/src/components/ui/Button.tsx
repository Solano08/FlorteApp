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

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-sena-green text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/40',
  secondary:
    'border border-white/25 bg-white/20 text-[var(--color-text)] backdrop-blur-md hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/30 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15',
  ghost:
    'bg-transparent text-[var(--color-text)] hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena-green/25 dark:hover:bg-white/10',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:bg-red-600 dark:hover:bg-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'min-h-0 px-2 py-1 text-[11px]',
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-11 px-5 py-2.5 text-base',
};

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
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={classNames(
          'inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-ui ease-ui',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isDisabled && 'cursor-not-allowed opacity-70',
          className
        )}
        {...props}
      >
        <span className="inline-flex items-center justify-center gap-1.5">
          {leftIcon}
          {loading && (
            <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-b-transparent" />
          )}
          <span>{children}</span>
          {rightIcon}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
