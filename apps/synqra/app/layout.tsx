import type { Metadata } from "next";
import "../styles/globals.css";

// Use system fonts for Railway deployment compatibility
// Google Fonts can fail during build when network is restricted

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
      <body className="font-sans">{children}</body>
    </html>
  );
};

export default RootLayout;
