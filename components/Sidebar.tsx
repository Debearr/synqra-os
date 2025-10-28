'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: '📊' },
  { name: 'Content Library', path: '/dashboard/content', icon: '📝' },
  { name: 'Calendar', path: '/dashboard/calendar', icon: '📅' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: '📈' },
  { name: 'Brand Voice', path: '/dashboard/brand-voice', icon: '🎯' },
  { name: 'Integrations', path: '/dashboard/integrations', icon: '🔗' },
  { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-midnightBlack border-r border-softGray/20 min-h-screen">
      <div className="p-6 border-b border-softGray/20">
        <h1 className="text-2xl font-bold text-goldFoil font-playfair">NØID</h1>
        <p className="text-softGray text-sm mt-1">Synqra Dashboard</p>
      </div>

      <nav className="p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all
                ${isActive
                  ? 'bg-goldFoil/10 text-goldFoil border border-goldFoil/30'
                  : 'text-softGray hover:bg-neonTeal/5 hover:text-neonTeal'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
