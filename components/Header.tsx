'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/auth/login')}
          className="px-4 py-2 rounded-lg border border-white/10 text-silver-mist hover:bg-white/5 transition-all text-sm font-body font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || 'User';
  const displayEmail = user.email || 'user@synqra.io';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-all group"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-rose-gold flex items-center justify-center">
          <span className="text-matte-black font-heading font-bold text-sm">{initials}</span>
        </div>
        
        {/* User Info */}
        <div className="hidden lg:block text-left">
          <p className="text-sm font-body font-medium text-silver-mist group-hover:text-teal-neon transition-colors">
            {displayName}
          </p>
          <p className="text-xs text-silver-mist/60">Premium</p>
        </div>

        {/* Dropdown Arrow */}
        <span className="text-silver-mist/60 group-hover:text-teal-neon transition-colors">
          {isMenuOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-2 w-64 glassmorphism rounded-lg shadow-2xl border border-white/10 overflow-hidden z-50"
        >
          <div className="p-4 border-b border-white/10">
            <p className="text-sm font-body font-medium text-silver-mist">
              {displayEmail}
            </p>
            <p className="text-xs text-silver-mist/60 mt-1">
              Premium Account
            </p>
          </div>

          <ul className="py-2">
            <li>
              <button className="w-full px-4 py-3 text-left text-sm text-silver-mist hover:bg-white/5 hover:text-teal-neon transition-all flex items-center gap-3">
                <span className="text-lg">◉</span>
                Profile Settings
              </button>
            </li>
            <li>
              <button className="w-full px-4 py-3 text-left text-sm text-silver-mist hover:bg-white/5 hover:text-teal-neon transition-all flex items-center gap-3">
                <span className="text-lg">◈</span>
                Billing
              </button>
            </li>
            <li>
              <button className="w-full px-4 py-3 text-left text-sm text-silver-mist hover:bg-white/5 hover:text-teal-neon transition-all flex items-center gap-3">
                <span className="text-lg">◆</span>
                API Keys
              </button>
            </li>
            <li className="border-t border-white/10 mt-2 pt-2">
              <button 
                onClick={handleSignOut}
                className="w-full px-4 py-3 text-left text-sm text-crimson hover:bg-crimson/10 transition-all flex items-center gap-3"
              >
                <span className="text-lg">●</span>
                Sign Out
              </button>
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-20 glassmorphism border-b border-gold/20 flex items-center justify-between px-6 lg:px-8">
      {/* Page Title / Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <h2 className="text-2xl font-heading font-bold text-silver-mist">
          Dashboard
        </h2>
        <span className="hidden md:block text-gold/40">━</span>
        <span className="hidden md:block text-sm text-silver-mist/60">
          Welcome back to Synqra OS
        </span>
      </motion.div>

      {/* Right Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-6"
      >
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-white/5 transition-all group"
          aria-label="Notifications"
        >
          <span className="text-xl text-silver-mist group-hover:text-teal-neon transition-colors">
            ◆
          </span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-crimson rounded-full animate-glow-pulse" />
        </button>

        {/* User Menu - Import AuthButton if not using inline */}
        <UserMenu />
      </motion.div>
    </header>
  );
}
