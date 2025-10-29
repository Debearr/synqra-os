'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '◆' },
  { label: 'Automation', href: '/dashboard/automation', icon: '⚡' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '◈' },
  { label: 'Settings', href: '/dashboard/settings', icon: '◉' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '280px'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen glassmorphism z-50 border-r border-white/10 flex flex-col"
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-heading font-bold gradient-gold">
                  NØID
                </h1>
                <p className="text-xs text-silver-mist/60">SYNQRA OS</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle sidebar"
          >
            <span className="text-teal-neon text-xl">
              {isCollapsed ? '▶' : '◀'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      group relative flex items-center gap-4 px-4 py-3 rounded-lg
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-teal-neon/10 text-teal-neon glow-teal' 
                        : 'text-silver-mist hover:bg-white/5 hover:text-teal-neon'
                      }
                    `}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-full bg-teal-neon rounded-r"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    
                    {/* Icon */}
                    <span className="text-2xl min-w-[24px] text-center">
                      {item.icon}
                    </span>
                    
                    {/* Label */}
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="font-body font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-silver-mist/40 text-center"
              >
                <p>NØID © 2025</p>
                <p className="mt-1">Synqra OS v2.0</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-silver-mist/40 text-center"
              >
                <span className="text-gold">◈</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}
