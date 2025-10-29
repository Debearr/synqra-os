import "../styles/globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "NØID | Synqra OS",
  description: "Luxury automation platform with street-premium aesthetics. Synqra OS — automation that preserves your craft.",
  keywords: ["automation", "luxury", "premium", "AI", "workflow"],
  authors: [{ name: "NØID" }],
  themeColor: "#0A0A0A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-matte-black text-silver-mist antialiased">
        {children}
      </body>
    </html>
  );
}
