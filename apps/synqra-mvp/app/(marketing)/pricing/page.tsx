import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function PricingPage() {
    return (
        <div className="container py-24">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
                <p className="text-xl text-muted-foreground">Start for free, scale as you grow.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Free Tier */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-sm flex flex-col backdrop-blur-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-brand-fg">Starter</h3>
                        <div className="text-3xl font-bold text-white">Free</div>
                        <p className="text-sm text-brand-gray mt-2">Perfect for individual agents.</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> 5 AI Descriptions / month</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> Basic FICA storage</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> Email support</li>
                    </ul>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white">Get Started</Button>
                </div>

                {/* Pro Tier */}
                <div className="rounded-2xl border-2 border-brand-gold/50 bg-white/[0.04] p-8 shadow-glow-gold flex flex-col relative backdrop-blur-md">
                    <div className="absolute top-0 right-0 bg-brand-gold text-brand-bg text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-white">Professional</h3>
                        <div className="text-3xl font-bold text-white">R499<span className="text-base font-normal text-brand-gray">/mo</span></div>
                        <p className="text-sm text-brand-gray mt-2">For high-performing agents.</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-gold" /> Unlimited AI Descriptions</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-gold" /> Automated FICA Verification</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-gold" /> WhatsApp Integration</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-gold" /> Priority Support</li>
                    </ul>
                    <Button className="w-full bg-brand-gold text-brand-bg hover:bg-brand-gold/90 hover:shadow-glow-gold">Start Free Trial</Button>
                </div>

                {/* Enterprise Tier */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-sm flex flex-col backdrop-blur-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-brand-fg">Agency</h3>
                        <div className="text-3xl font-bold text-white">Custom</div>
                        <p className="text-sm text-brand-gray mt-2">For agencies with 10+ agents.</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> Admin Dashboard</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> Team Management</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> Custom Integrations</li>
                        <li className="flex items-center gap-2 text-sm text-brand-gray"><Check className="h-4 w-4 text-brand-teal" /> Dedicated Account Manager</li>
                    </ul>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white">Contact Sales</Button>
                </div>
            </div>
        </div>
    );
}
