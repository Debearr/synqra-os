import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8">
      {icon && (
        <div className="mb-4 text-noid-gold/50">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-display text-noid-white mb-2">{title}</h3>
      <p className="text-noid-silver max-w-md mb-6">{description}</p>
      {action && action}
    </div>
  );
};
