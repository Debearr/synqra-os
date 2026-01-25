'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import StudioSystemHeader from '@/components/studio/StudioSystemHeader';
import EnvironmentLayer from '@/components/studio/EnvironmentLayer';

function LoadingShell() {
  return (
    <div className="flex h-screen items-center justify-center bg-noid-black text-white">
      <div className="text-center space-y-4">
        <div className="text-sm tracking-widest">LOADING</div>
        <div className="h-2 w-32 bg-noid-silver/20 rounded-full overflow-hidden">
          <div className="h-full bg-noid-gold animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

function AuthRequiredShell() {
  return (
    <div className="min-h-screen bg-noid-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="font-mono text-sm uppercase tracking-widest text-red-500">
          AUTHENTICATION REQUIRED
        </div>
        <div className="text-xs text-noid-silver/70">
          Please initialize from the homepage
        </div>
      </div>
    </div>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Always render shell - never return null
  if (loading) {
    return <LoadingShell />;
  }

  if (!session) {
    return <AuthRequiredShell />;
  }

  return <>{children}</>;
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-noid-black">
      <EnvironmentLayer />
      <StudioSystemHeader />

      <div className="pt-12">
        <Suspense fallback={<LoadingShell />}>
          <AuthWrapper>{children}</AuthWrapper>
        </Suspense>
      </div>
    </div>
  );
}
