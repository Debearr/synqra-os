import React from 'react';

interface SiteHeaderProps {
  children?: React.ReactNode;
}

export default function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className="w-full border-b border-noid-charcoal-light bg-noid-black">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {children}
        </div>
      </div>
    </header>
  );
}
