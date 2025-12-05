import React from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <main role="main">
        {children}
      </main>
    </div>
  );
}
