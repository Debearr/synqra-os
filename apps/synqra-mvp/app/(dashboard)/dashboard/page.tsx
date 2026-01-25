import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-display font-medium text-white tracking-luxury">Dashboard</h1>
                    <p className="text-brand-gray">Welcome back, John.</p>
                </div>
                <Button className="bg-brand-teal text-brand-bg hover:bg-brand-teal/90 font-medium">
                    <Plus className="h-4 w-4 mr-2" />
                    New Listing
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-xl shadow-sm hover:border-brand-teal/30 transition-colors">
                    <h3 className="text-sm font-medium text-brand-gray mb-2">Active Listings</h3>
                    <div className="text-3xl font-bold text-white">12</div>
                </div>
                <div className="glass-panel p-6 rounded-xl shadow-sm hover:border-brand-gold/30 transition-colors">
                    <h3 className="text-sm font-medium text-brand-gray mb-2">Pending FICA</h3>
                    <div className="text-3xl font-bold text-brand-gold">3</div>
                </div>
                <div className="glass-panel p-6 rounded-xl shadow-sm hover:border-brand-teal/30 transition-colors">
                    <h3 className="text-sm font-medium text-brand-gray mb-2">Total Views</h3>
                    <div className="text-3xl font-bold text-white">1,240</div>
                </div>
            </div>

            <div className="glass-panel rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal font-bold text-xs">JD</div>
                        <div>
                            <p className="text-sm font-medium text-white">Generated description for 123 Main St</p>
                            <p className="text-xs text-brand-gray">2 hours ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-xs">SS</div>
                        <div>
                            <p className="text-sm font-medium text-white">FICA verified for Sarah Smith</p>
                            <p className="text-xs text-brand-gray">5 hours ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
