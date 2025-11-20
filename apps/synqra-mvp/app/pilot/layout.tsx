import type { Metadata } from "next";
import { PilotNav, PilotFooter } from "@/components/pilot";

export const metadata: Metadata = {
  title: "Founder Pilot Program - $97 for 7 Days | Synqra",
  description: "Test drive Synqra's AI marketing automation for 7 days. Get your time back, build consistency, and create more opportunities to sell. Join 50+ founders who've transformed their marketing.",
  keywords: "marketing automation, AI content creation, founder pilot, synqra pilot, content marketing, LinkedIn automation, Twitter automation",
  openGraph: {
    title: "Founder Pilot Program - $97 for 7 Days | Synqra",
    description: "Test drive Synqra's AI marketing automation. Plans, creates, posts, engages — automatically.",
    url: "https://synqra.app/pilot",
    siteName: "Synqra",
    type: "website",
    images: [{
      url: "/pilot/og-pilot.jpg",
      width: 1200,
      height: 630,
      alt: "Synqra Founder Pilot Program",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Founder Pilot Program - $97 for 7 Days | Synqra",
    description: "Test drive Synqra's AI marketing automation for 7 days.",
    creator: "@synqra",
    images: ["/pilot/og-pilot.jpg"],
  },
};

export default function PilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <PilotNav />
      <main className="pt-16">{children}</main>
      <PilotFooter />
    </div>
  );
}
