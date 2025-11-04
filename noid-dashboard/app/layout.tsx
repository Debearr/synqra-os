import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synqra Dashboard",
  description: "Luxury social media automation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-noid-black text-noid-white antialiased">
        {children}
      </body>
    </html>
  );
}
