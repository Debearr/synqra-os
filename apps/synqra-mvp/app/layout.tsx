import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: "Synqra | Perfect Draft Engine",
  description: "Synqra crafts premium, production-ready drafts instantly with zero friction.",
  openGraph: {
    title: "Synqra | Perfect Draft Engine",
    description: "Synqra crafts premium, production-ready drafts instantly with zero friction.",
    url: "https://synqra.local",
    siteName: "Synqra",
    type: "website",
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>{children}</body>
    </html>
  );
};

export default RootLayout;
