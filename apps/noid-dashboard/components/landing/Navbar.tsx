import Link from 'next/link';

const navLinks = [
  { label: 'NØID', href: 'https://noid.so' },
  { label: 'Synqra', href: '/landing' },
  { label: 'AuraFX', href: 'https://aurafx.ai' },
  { label: 'Pricing', href: '#packages' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-noid-black/80 backdrop-blur border-b border-noid-charcoal-light/60">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-[0.3em] uppercase text-noid-white">
          Synqra
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-noid-gray md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors duration-500 hover:text-noid-teal focus-visible:outline-none focus-visible:text-noid-teal"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="rounded-full border border-noid-gray/50 px-4 py-2 text-sm font-medium text-noid-gray transition-all duration-500 hover:border-noid-teal hover:text-noid-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/40"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="hidden rounded-full bg-noid-gold px-5 py-2 text-sm font-semibold text-noid-black transition-transform duration-500 hover:-translate-y-0.5 hover:shadow-gold-glow md:inline-flex"
          >
            Launch dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
