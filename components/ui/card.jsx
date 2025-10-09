export function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }) {
  return <div className={`px-6 pt-5 pb-2 ${className}`}>{children}</div>;
}

export function CardContent({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
