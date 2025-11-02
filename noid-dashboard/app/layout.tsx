import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://synqra.com"),
  applicationName: "Synqra OS",
  title: {
    default: "Synqra OS Dashboard",
    template: "%s | Synqra OS",
  },
  description:
    "Operational analytics and orchestration suite powering Synqra OS production environments.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icon-512.png",
      },
    ],
  },
  openGraph: {
    type: "website",
    url: "https://synqra.com",
    title: "Synqra OS Dashboard",
    description:
      "Monitor, orchestrate, and deploy Synqra OS services with real-time visibility.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Synqra OS Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synqra OS Dashboard",
    description:
      "Monitor, orchestrate, and deploy Synqra OS services with real-time visibility.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
