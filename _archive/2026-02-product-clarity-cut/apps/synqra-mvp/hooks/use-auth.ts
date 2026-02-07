'use client';

import { useState, useEffect } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';

interface AuthSession {
  session: Session;
}

export function useAuth() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setAuthSession(null);
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setAuthSession(session ? { session } : null);
      setLoading(false);
    };

    loadSession().catch((error) => {
      console.error('Failed to load auth session:', error);
      if (!mounted) return;
      setAuthSession(null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthSession(session ? { session } : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session: authSession, loading };
}
