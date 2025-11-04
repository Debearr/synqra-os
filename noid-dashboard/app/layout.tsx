import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://synqra.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Synqra — Luxury Social Automation",
    template: "%s · Synqra",
  },
  description:
    "Synqra unifies NØID Studio intelligence, concierge automations, and AuraFX insights into one luxury social media command center.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Synqra — Luxury Social Automation",
    description:
      "Command social storytelling with the Synqra dashboard. Concierge workflows, predictive insights, and AuraFX intelligence in one seamless experience.",
    type: "website",
    url: baseUrl,
    siteName: "Synqra",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Synqra dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synqra — Luxury Social Automation",
    description:
      "Preview the Synqra dashboard and join the NØID ecosystem waitlist for concierge-level social media automation.",
    creator: "@noid",
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
