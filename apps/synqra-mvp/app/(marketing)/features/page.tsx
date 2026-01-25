import { Check } from "lucide-react";

export default function FeaturesPage() {
    return (
        <div className="container py-24">
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Everything you need to sell faster</h1>
                <p className="text-xl text-brand-gray">Built by agents, for agents.</p>
            </div>

            <div className="grid gap-12 max-w-5xl mx-auto">
                {/* Feature 1 */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-4 text-white">AI Content Engine</h2>
                        <p className="text-brand-gray mb-4">
                            Stop staring at a blank screen. Upload your photos and let our AI write the perfect listing description.
                            Optimized for Property24, Private Property, and social media.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-brand-fg"><Check className="h-5 w-5 text-brand-teal" /> Photo analysis</li>
                            <li className="flex items-center gap-2 text-brand-fg"><Check className="h-5 w-5 text-brand-teal" /> Tone adjustment (Professional, Luxury, Warm)</li>
                            <li className="flex items-center gap-2 text-brand-fg"><Check className="h-5 w-5 text-brand-teal" /> Multi-language support</li>
                        </ul>
                    </div>
                    <div className="flex-1 glass-panel rounded-xl h-64 w-full flex items-center justify-center text-brand-gray/50">
                        [Image Placeholder: AI Interface]
                    </div>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-4 text-white">FICA Compliance</h2>
                        <p className="text-brand-gray mb-4">
                            Compliance shouldn't be a chase. Send a secure link to your client's phone.
                            They snap a photo of their ID and proof of residence. We verify it instantly.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-brand-fg"><Check className="h-5 w-5 text-brand-teal" /> Biometric verification</li>
                            <li className="flex items-center gap-2 text-brand-fg"><Check className="h-5 w-5 text-brand-teal" /> Automated follow-ups</li>
                            <li className="flex items-center gap-2 text-brand-fg"><Check className="h-5 w-5 text-brand-teal" /> Secure storage</li>
                        </ul>
                    </div>
                    <div className="flex-1 glass-panel rounded-xl h-64 w-full flex items-center justify-center text-brand-gray/50">
                        [Image Placeholder: Mobile FICA Flow]
                    </div>
                </div>
            </div>
        </div>
    );
}
