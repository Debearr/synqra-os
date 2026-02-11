import type { Metadata } from "next";
import "../styles/globals.css";

// Use system fonts for Railway deployment compatibility
// Google Fonts can fail during build when network is restricted

export const metadata: Metadata = {
  metadataBase: new URL("https://synqra.co"),
  title: "Synqra - AI Content Orchestration for Executives",
  description:
    "Generate executive-grade content in seconds. Synqra learns your voice, maintains brand consistency, and produces publish-ready copy across LinkedIn, Twitter, and newsletters.",
  keywords:
    "AI content generation, executive content, brand voice AI, content orchestration, LinkedIn automation, Twitter automation, CEO content tools",
  openGraph: {
    title: "Synqra - AI Content Orchestration for Executives",
    description: "Generate executive-grade content in seconds with AI that learns your voice.",
    url: "https://synqra.co",
    siteName: "Synqra",
    type: "website",
    images: [
      {
        url: "/og-synqra.jpg",
        width: 1200,
        height: 630,
        alt: "Synqra - AI Content Orchestration Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synqra - AI Content Orchestration for Executives",
    description: "Generate executive-grade content in seconds with AI that learns your voice.",
    images: ["/og-synqra.jpg"],
  },
  themeColor: "#0B0B0B",
  icons: {
    icon: "/favicon.svg",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" className="bg-noir">
      <body className="font-sans">{children}</body>
    </html>
  );
};

export default RootLayout;
