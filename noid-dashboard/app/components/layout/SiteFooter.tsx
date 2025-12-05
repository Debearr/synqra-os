import React from 'react';

interface SiteFooterProps {
  children?: React.ReactNode;
}

export default function SiteFooter({ children }: SiteFooterProps) {
  return (
    <footer className="w-full border-t border-noid-charcoal-light bg-noid-black mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-center text-sm text-noid-silver">
          {children || (
            <p>&copy; {new Date().getFullYear()} Synqra by NØID Labs. All rights reserved.</p>
          )}
        </div>
      </div>
    </footer>
  );
}
