'use client';

import { useState, useEffect } from 'react';

interface AuthSession {
  identityCode: string;
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for synqra_auth cookie
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const identityCode = getCookie('synqra_auth');
    
    if (identityCode) {
      setSession({ identityCode });
    } else {
      setSession(null);
    }
    
    setLoading(false);
  }, []);

  return { session, loading };
}

