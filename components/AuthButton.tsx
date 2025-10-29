'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
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

  if (isLoading) {
    return (
      <div className="px-4 py-2 rounded-lg bg-white/5">
        <span className="text-silver-mist/60 text-sm">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-silver-mist/60 hidden md:block">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-lg border border-crimson/30 text-crimson hover:bg-crimson/10 transition-all text-sm font-body font-medium"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.push('/auth/login')}
        className="px-4 py-2 rounded-lg border border-white/10 text-silver-mist hover:bg-white/5 transition-all text-sm font-body font-medium"
      >
        Sign In
      </button>
      <button
        onClick={() => router.push('/auth/signup')}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold to-rose-gold text-matte-black hover:opacity-90 transition-all text-sm font-body font-semibold"
      >
        Sign Up
      </button>
    </div>
  );
}
