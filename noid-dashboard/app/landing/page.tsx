import { ContinuitySection } from '@/components/landing/ContinuitySection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { MetricsShowcase } from '@/components/landing/MetricsShowcase';
import { Navbar } from '@/components/landing/Navbar';
import { NewsletterForm } from '@/components/landing/NewsletterForm';
import { getDashboardPreviewMetrics } from '@/lib/supabase';

export const revalidate = 0;

export default async function LandingPage() {
  const metrics = await getDashboardPreviewMetrics();

  return (
    <div className="flex min-h-screen flex-col bg-noid-black">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <MetricsShowcase metrics={metrics} />
        <ContinuitySection />
        <NewsletterForm />
      </main>
      <Footer />
    </div>
  );
}
