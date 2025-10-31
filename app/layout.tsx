import "../styles/globals.css";
import ThemeProvider from "@/lib/theme-provider";

export const metadata = {
  title: "Synqra OS",
  description: "Synqra OS — automation that preserves your craft.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-matte-black text-silver-mist antialiased" data-theme="noid">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
