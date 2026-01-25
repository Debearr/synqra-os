export default function StudioSystemHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-50 bg-[rgba(10,10,10,0.85)] backdrop-blur-[12px] border-b border-white/6">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left */}
        <div className="text-xs uppercase tracking-widest opacity-80 text-white">
          SYNQRA
        </div>

        {/* Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-white/70">
          NØID Intelligence Platform v1.0
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 text-xs text-white/80">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>SYSTEM ACTIVE | Operator: DEBEAR01</span>
        </div>
      </div>
    </div>
  );
}
