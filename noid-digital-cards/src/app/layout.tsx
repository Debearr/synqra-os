import type { Metadata } from "next";
import { IBM_Plex_Mono, Poppins, Sora } from "next/font/google";
import "./globals.css";

const display = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

const sans = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NØID Digital Cards — Premium Smart Business Cards | NØID Labs",
  description: "Your professional identity, elevated. Smart business cards with QR codes, live portfolio links, and seasonal visual themes. Share your credentials with investor-ready polish. Built by NØID Labs.",
  keywords: "digital business card, smart business card, QR business card, professional identity, portfolio card, executive business card, NØID Labs",
  openGraph: {
    title: "NØID Digital Cards — Premium Smart Business Cards",
    description: "Your professional identity, elevated. Smart cards with QR codes, live portfolio links, and seasonal themes.",
    type: "website",
    url: "https://cards.noidlabs.com",
    siteName: "NØID Digital Cards",
    images: [{
      url: "/og-noid-cards.jpg",
      width: 1200,
      height: 630,
      alt: "NØID Digital Cards - Premium Smart Business Cards",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NØID Digital Cards — Premium Smart Business Cards",
    description: "Your professional identity, elevated with smart QR cards and live portfolio links.",
    creator: "@noidlabs",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
