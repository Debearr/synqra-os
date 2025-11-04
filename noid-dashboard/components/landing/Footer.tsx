import Link from 'next/link';

const footerLinks = [
  {
    title: 'Product',
    items: [
      { label: 'Overview', href: '/landing#hero' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automations', href: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'NØID Studio', href: 'https://noid.so' },
      { label: 'AuraFX', href: 'https://aurafx.ai' },
      { label: 'Press', href: 'mailto:press@synqra.com' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-noid-black/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-4">
          <Link href="/" className="font-display text-lg font-semibold tracking-[0.3em] uppercase text-noid-white">
            Synqra
          </Link>
          <p className="text-sm text-noid-gray/80">
            Crafted by the NØID ecosystem—luxury social orchestration across every executive touchpoint.
          </p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-noid-gray/70">{column.title}</p>
              <ul className="space-y-2">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-noid-gray/80 transition-colors duration-500 hover:text-noid-teal focus-visible:outline-none focus-visible:text-noid-teal"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5 py-6">
        <p className="text-center text-xs text-noid-gray/60">
          © {new Date().getFullYear()} Synqra. Crafted with the NØID · AuraFX alliance.
        </p>
      </div>
    </footer>
  );
}
