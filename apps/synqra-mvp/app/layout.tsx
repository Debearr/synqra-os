import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

// Use system fonts for Railway deployment compatibility
// Google Fonts can fail during build when network is restricted

export const metadata: Metadata = {
  metadataBase: new URL("https://synqra.co"),
  title: "Synqra - Content Orchestration for Executives",
  description:
    "Generate executive-grade content in seconds. Synqra learns your voice, maintains brand consistency, and produces publish-ready copy for Instagram and email.",
  keywords:
    "content generation, executive content, brand voice, content orchestration, Instagram automation, email drafting, CEO content tools",
  openGraph: {
    title: "Synqra - Content Orchestration for Executives",
    description: "Generate executive-grade content in seconds with voice-aware automation.",
    url: "https://synqra.co",
    siteName: "Synqra",
    type: "website",
    images: [
      {
        url: "/og-synqra.jpg",
        width: 1200,
        height: 630,
        alt: "Synqra - Content Orchestration Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synqra - Content Orchestration for Executives",
    description: "Generate executive-grade content in seconds with voice-aware automation.",
    images: ["/og-synqra.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ds-bg text-ds-text-primary font-sans antialiased">{children}</body>
    </html>
  );
};

export default RootLayout;
