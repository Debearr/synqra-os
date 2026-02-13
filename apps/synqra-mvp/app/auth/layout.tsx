type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-journey items-center px-6 py-12">{children}</div>
    </main>
  );
}
