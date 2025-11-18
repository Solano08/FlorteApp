import { ReactNode } from 'react';
import classNames from 'classnames';

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export const Card = ({ children, className, padded = true }: CardProps) => {
  return (
    <div
      className={classNames(
        'rounded-2xl border border-white/20 bg-white/10 shadow-[0_18px_32px_rgba(30,60,32,0.12)] backdrop-blur-lg',
        'dark:border-white/10 dark:bg-white/5',
        padded && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
};
