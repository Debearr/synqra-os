import React from 'react';

interface ProgressProps {
  value?: number;
  className?: string;
}

export const Progress = ({ value = 0, className = '' }: ProgressProps) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-noid-charcoal-light ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-gold transition-all duration-500"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
