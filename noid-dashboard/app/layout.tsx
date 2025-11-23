import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://synqra.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Synqra Dashboard — Executive Social Command Center | NØID Labs",
    template: "%s · Synqra Dashboard",
  },
  description:
    "Orchestrate your entire social presence from one intelligent dashboard. Predictive scheduling, AuraFX voice modeling, and concierge-level automation for LinkedIn, Twitter, and beyond. Built by NØID Labs.",
  keywords: "social media dashboard, executive social media, LinkedIn automation, Twitter scheduling, brand voice consistency, social media management, CEO content tools, NØID Labs",
  icons: {
    icon: "/logos/synqra-icon.svg",
  },
  openGraph: {
    title: "Synqra Dashboard — Executive Social Command Center",
    description:
      "Orchestrate your entire social presence from one intelligent dashboard. No switching between tools. Built by NØID Labs.",
    type: "website",
    url: baseUrl,
    siteName: "Synqra by NØID Labs",
    images: [
      {
        url: "/og-synqra-dashboard.jpg",
        width: 1200,
        height: 630,
        alt: "Synqra Dashboard - Executive Social Command Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synqra Dashboard — Executive Social Command Center",
    description:
      "Orchestrate your entire social presence from one intelligent dashboard. Built by NØID Labs.",
    creator: "@noidlabs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-noid-black text-noid-white antialiased selection:bg-noid-teal/40 selection:text-noid-black">
        {children}
      </body>
    </html>
  );
}
