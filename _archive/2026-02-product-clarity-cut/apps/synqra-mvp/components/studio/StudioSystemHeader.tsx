export default function StudioSystemHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-50 bg-zinc-950/85 backdrop-blur-[16px] border-b border-white/5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.12)]">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left */}
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-50 drop-shadow-[0_0_6px_rgba(255,255,255,0.25)]">
          SYNQRA
        </div>

        {/* Right */}
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Request Access
        </div>
      </div>
    </div>
  );
}
