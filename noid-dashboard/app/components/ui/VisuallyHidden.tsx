import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
}

export const VisuallyHidden = ({ children }: VisuallyHiddenProps) => {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 clip-[rect(0,0,0,0)]">
      {children}
    </span>
  );
};
