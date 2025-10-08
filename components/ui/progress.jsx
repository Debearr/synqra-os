export function Progress({ value = 0, className = "" }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded bg-neutral-800 ${className}`}>
      <div
        className="h-full bg-teal-500 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
export default Progress;
