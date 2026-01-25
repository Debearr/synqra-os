import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Synqra" width={32} height={32} className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-slate-900">Synqra</span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
              <Image src="/icon-logo.png" alt="ICON" width={16} height={16} className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">ICON Pilot</span>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="#" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Listings</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Compliance</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Automate the <span className="text-blue-600">boring stuff</span>.
            <br />
            Sell more property.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
            Welcome to the <strong>Synqra x ICON Property Group</strong> pilot.
            <br />
            Generate perfect listing descriptions and automate FICA collection in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
              Try Smart Description Generator
            </button>
            <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-lg font-semibold text-lg shadow-sm transition-all">
              View Compliance Dashboard
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Descriptions</h3>
            <p className="text-slate-600">Upload photos, get a Property24-ready description instantly. No writing required.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Auto-FICA</h3>
            <p className="text-slate-600">Send a secure link to clients. We collect and verify ID and proof of residence automatically.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Sync</h3>
            <p className="text-slate-600">Push approved listings to all major portals with a single click. (Coming in Phase 2)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
