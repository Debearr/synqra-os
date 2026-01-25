export default function SocialProof() {
    return (
        <section className="w-full py-12 bg-brand-bg">
            <div className="gold-divider mb-8" />
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-6 text-center">
                    <p className="text-xs font-medium tracking-[0.2em] text-brand-gray/60 uppercase">
                        Trusted by Top Agencies
                    </p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-700">
                        {/* Placeholder for logos - using stylized text with luxury font */}
                        <span className="text-xl font-display font-bold text-white tracking-wider">RE/MAX</span>
                        <span className="text-xl font-display font-bold text-white tracking-wider">PAM GOLDING</span>
                        <span className="text-xl font-display font-bold text-white tracking-wider">SEEFF</span>
                        <span className="text-xl font-display font-bold text-white tracking-wider">RAWSON</span>
                    </div>
                </div>
            </div>
            <div className="gold-divider mt-8" />
        </section>
    );
}
