import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "SYNQRA",
  openGraph: {
    images: ["/assets/hex-logo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/hex-logo.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-noid-black" data-atmo="synqra" suppressHydrationWarning>
      <body className="font-sans relative" suppressHydrationWarning>
        <div className="relative" style={{ zIndex: 10 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
