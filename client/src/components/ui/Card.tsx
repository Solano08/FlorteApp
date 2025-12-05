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
        'rounded-2xl glass-liquid',

        padded && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
};
