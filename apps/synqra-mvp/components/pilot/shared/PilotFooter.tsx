import Link from "next/link";
import { Twitter, Linkedin, Mail } from "lucide-react";

export function PilotFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-brand-ink/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="text-2xl font-bold mb-4">
              <span className="text-brand-teal">SYNQRA</span>
            </div>
            <p className="text-brand-gray text-sm leading-relaxed max-w-sm">
              AI-powered marketing automation for founders who want consistent,
              high-quality content without the burnout.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://twitter.com/synqra"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-brand-teal/20 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5 text-brand-gray hover:text-brand-teal" />
              </a>
              <a
                href="https://linkedin.com/company/synqra"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-brand-teal/20 flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-5 h-5 text-brand-gray hover:text-brand-teal" />
              </a>
              <a
                href="mailto:pilot@synqra.app"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-brand-teal/20 flex items-center justify-center transition-colors"
              >
                <Mail className="w-5 h-5 text-brand-gray hover:text-brand-teal" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-brand-fg mb-4">Pilot Program</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pilot" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/pilot/apply" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-brand-gray hover:text-brand-teal transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-brand-fg mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="mailto:pilot@synqra.app" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-brand-gray hover:text-brand-teal transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-gray">
          <p>
            © {currentYear} Synqra by NØID Labs. All rights reserved.
          </p>
          <p className="text-xs">
            Built with AI • Designed for Founders • Made with ❤️ in SF
          </p>
        </div>
      </div>
    </footer>
  );
}
