import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Home, FileCheck, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-brand-bg">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-brand-bg/95 backdrop-blur-md hidden md:flex flex-col">
                <div className="p-6">
                    <span className="text-xl font-display font-medium tracking-luxury text-white">Synqra</span>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-brand-gray hover:bg-white/5 hover:text-brand-teal rounded-lg transition-all duration-300">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/properties" className="flex items-center gap-3 px-4 py-3 text-brand-gray hover:bg-white/5 hover:text-brand-teal rounded-lg transition-all duration-300">
                        <Home className="h-5 w-5" />
                        Properties
                    </Link>
                    <Link href="/compliance" className="flex items-center gap-3 px-4 py-3 text-brand-gray hover:bg-white/5 hover:text-brand-teal rounded-lg transition-all duration-300">
                        <FileCheck className="h-5 w-5" />
                        Compliance
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-brand-gray hover:bg-white/5 hover:text-brand-teal rounded-lg transition-all duration-300">
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                </nav>
                <div className="p-4 border-t border-white/5">
                    <button className="flex items-center gap-3 px-4 py-3 text-brand-gray hover:text-white w-full transition-colors">
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-brand-bg barcode-bg">
                <header className="h-16 border-b border-white/5 bg-brand-bg/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
                    <div className="md:hidden">
                        {/* Mobile Menu Trigger Placeholder */}
                        <span className="font-bold text-white">Synqra</span>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="h-8 w-8 rounded-full bg-brand-teal/20 border border-brand-teal/30 flex items-center justify-center text-brand-teal font-bold text-xs">
                            JD
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
