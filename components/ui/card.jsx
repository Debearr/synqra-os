export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export default Card;
