import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SynqraNavbarGlyph } from "@/components/brand/synqra/glyphs/react/SynqraNavbarGlyph";
import { SynqraFooterGlyph } from "@/components/brand/synqra/glyphs/react/SynqraFooterGlyph";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-brand-bg text-brand-fg font-sans selection:bg-brand-teal/30">
            <header className="border-b border-white/5 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 supports-[backdrop-filter]:bg-brand-bg/60">
                <div className="container flex h-20 items-center justify-between">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <SynqraNavbarGlyph
                                width={180}
                                height={24}
                                className="text-white group-hover:text-brand-gold transition-colors duration-300"
                            />
                        </Link>
                        <nav className="hidden md:flex gap-8">
                            <Link
                                href="/features"
                                className="flex items-center text-sm font-medium text-brand-gray transition-colors hover:text-brand-teal"
                            >
                                Features
                            </Link>
                            <Link
                                href="/pricing"
                                className="flex items-center text-sm font-medium text-brand-gray transition-colors hover:text-brand-teal"
                            >
                                Pricing
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-brand-gray hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link href="/register">
                            <Button size="sm" className="h-10 px-6 text-sm bg-brand-teal hover:bg-brand-teal/90 text-white border-0">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/5 py-12 md:py-16 barcode-bg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />
                <div className="container flex flex-col items-center justify-between gap-6 md:h-24 md:flex-row">
                    <div className="flex flex-col gap-4">
                        <SynqraFooterGlyph width={200} height={40} className="opacity-80" />
                        <p className="text-center text-sm leading-loose text-brand-gray md:text-left">
                            Built by <div className="inline-flex items-center gap-1"><span className="text-brand-gold font-medium">NØID Labs</span></div>. The future of property tech.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
