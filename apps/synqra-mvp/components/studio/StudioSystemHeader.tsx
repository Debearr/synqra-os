export default function StudioSystemHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-50 bg-[rgba(10,10,10,0.85)] backdrop-blur-[12px] border-b border-white/6">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left */}
        <div className="text-xs uppercase tracking-widest opacity-80 text-white">
          SYNQRA
        </div>

        {/* Right */}
        <div className="text-xs text-white/70">
          DEBEAR01
        </div>
      </div>
    </div>
  );
}
