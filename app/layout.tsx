import "../styles/globals.css";

export const metadata = {
  title: "Synqra OS",
  description: "Synqra OS — automation that preserves your craft.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
