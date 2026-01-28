'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDisclaimerState } from '@/hooks/useDisclaimerState';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { getDisclaimerContent } from '@/lib/compliance/disclaimer-manager';
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
  const disclaimerFallback = getDisclaimerContent('assessment');
  const disclaimer = useDisclaimerState({
    assessmentType: 'assessment_calibration',
    userId: session?.identityCode,
    autoCheck: true,
  });

  // Always render shell - never return null
  if (loading) {
    return <LoadingShell />;
  }

  if (!session) {
    return <AuthRequiredShell />;
  }

  return (
    <>
      <div className="px-6 pt-6">
        {/* Regulatory safety: global disclaimer for all AuraFX scenario views. */}
        <DisclaimerBanner
          content={disclaimer.content}
          methodologyContent={disclaimer.methodologyContent}
          disclaimer={disclaimerFallback}
          requiresAcknowledgment={disclaimer.requiresAcknowledgment}
          triggerMessage={disclaimer.triggerMessage}
          onAcknowledge={disclaimer.acknowledge}
          isAcknowledging={disclaimer.isAcknowledging}
        />
      </div>
      {children}
    </>
  );
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
