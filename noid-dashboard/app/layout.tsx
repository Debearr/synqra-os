import type { Metadata } from "next";
import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://synqra.app"
    : "http://localhost:3003");

export const metadata: Metadata = {
  title: "Synqra Dashboard",
  description: "Luxury social media automation platform",
  metadataBase: new URL(baseUrl),
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
