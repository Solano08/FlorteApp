import { ReactNode } from 'react';
import classNames from 'classnames';

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, padded = true, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'rounded-2xl glass-liquid',
        onClick && 'cursor-pointer',
        padded && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
};
