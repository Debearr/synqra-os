import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-noid-charcoal rounded-xl p-6 border border-noid-charcoal-light ${className}`}>
      {children}
    </div>
  );
};
