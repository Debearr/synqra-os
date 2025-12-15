import Link from "next/link"
import { SynqraLogoFooter } from "@/components/brand/synqra-logo-footer"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Updates", href: "#updates" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" },
  ],
  Resources: [
    { label: "Documentation", href: "#docs" },
    { label: "Help center", href: "#help" },
    { label: "Community", href: "#community" },
  ],
  Legal: [
    { label: "Privacy", href: "#privacy" },
    { label: "Terms", href: "#terms" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 md:py-24 lg:py-32">
        <div className="w-full flex justify-center mt-12 mb-12">
          <div className="inline-flex rounded-lg border border-border/40 bg-foreground/5 px-5 py-4">
            <SynqraLogoFooter />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-16 mb-16 md:mb-24">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <SynqraLogoFooter className="transition-transform duration-300 group-hover:scale-[1.02]" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed font-light max-w-xs">
              AI content intelligence for luxury brands and creators.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="
                text-xs uppercase tracking-wider 
                text-muted-foreground/70 mb-5 
                font-light
              ">
                {category}
              </h3>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="
                        text-sm font-light 
                        text-muted-foreground hover:text-foreground 
                        transition-colors duration-300
                        inline-block
                      "
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="
          pt-10 border-t border-border/30 
          flex flex-col md:flex-row items-center justify-between gap-6
        ">
          <p className="text-xs text-muted-foreground/70 font-light">
            © {new Date().getFullYear()} Synqra. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <Link
              href="#"
              className="
                text-xs font-light 
                text-muted-foreground hover:text-foreground 
                transition-colors duration-300
              "
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="
                text-xs font-light 
                text-muted-foreground hover:text-foreground 
                transition-colors duration-300
              "
            >
              LinkedIn
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          © 2025 NØID Labs Incorporated. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
