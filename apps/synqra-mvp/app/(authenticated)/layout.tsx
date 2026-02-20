import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import SystemFooter from "@/components/SystemFooter";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey px-6 py-8">
        <div className="mb-8">
          <Nav />
        </div>
        <div>{children}</div>
      </div>
      <SystemFooter />
    </main>
  );
}
