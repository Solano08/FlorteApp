import { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export const Card = ({ children, className, padded = true, onClick, style }: CardProps) => {
  return (
    <div
      onClick={onClick}
      style={style}
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
