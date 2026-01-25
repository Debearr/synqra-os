import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-bg barcode-bg">
            <div className="w-full max-w-md space-y-8 rounded-xl glass-panel p-10 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-display font-bold tracking-luxury text-white">Create an account</h2>
                    <p className="mt-2 text-sm text-brand-gray">Start your 14-day free trial</p>
                </div>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-fg mb-2">Full Name</label>
                        <input id="name" type="text" placeholder="John Doe" className="block w-full h-12 rounded-lg bg-white/[0.04] border border-white/10 px-4 text-white placeholder:text-brand-gray/50 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all duration-200 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-fg mb-2">Email address</label>
                        <input id="email" type="email" placeholder="name@example.com" className="block w-full h-12 rounded-lg bg-white/[0.04] border border-white/10 px-4 text-white placeholder:text-brand-gray/50 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all duration-200 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-fg mb-2">Password</label>
                        <input id="password" type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="block w-full h-12 rounded-lg bg-white/[0.04] border border-white/10 px-4 text-white placeholder:text-brand-gray/50 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all duration-200 sm:text-sm" />
                    </div>
                    <Button className="w-full bg-brand-teal text-brand-bg hover:bg-brand-teal/90 font-medium h-12 text-base shadow-glow hover:shadow-glow-gold">Sign up</Button>
                </div>
                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-brand-teal hover:text-brand-gold transition-colors">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
