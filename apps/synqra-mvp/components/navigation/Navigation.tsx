"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { SynqraLogoNavbar } from "@/components/brand/synqra-logo-navbar"
import { cn } from "@/lib/utils"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ]

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className={cn(
          "flex items-center justify-between transition-all duration-500",
          isScrolled ? "h-16 md:h-20" : "h-20 md:h-24"
        )}>
          {/* Logo */}
          <Link href="/" className="group">
            <SynqraLogoNavbar className="transition-transform duration-300 group-hover:scale-[1.02]" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="
                  text-sm font-light 
                  text-muted-foreground hover:text-foreground 
                  transition-colors duration-300
                  relative
                  after:absolute after:bottom-[-4px] after:left-0 after:right-0 
                  after:h-px after:bg-foreground 
                  after:scale-x-0 hover:after:scale-x-100
                  after:transition-transform after:duration-300
                  motion-reduce:after:transition-none
                "
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="font-light hover:bg-accent transition-colors duration-300"
            >
              Sign in
            </Button>
            <Button 
              size="sm" 
              className="
                font-light 
                bg-foreground text-background 
                hover:bg-foreground/90
                transition-all duration-300
              "
            >
              Get started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="
              md:hidden p-2 
              hover:bg-accent rounded-sm
              transition-colors duration-300
            "
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="
          md:hidden 
          border-t border-border/50 
          bg-background/95 backdrop-blur-xl
          animate-in slide-in-from-top duration-300
        ">
          <div className="px-6 py-8 space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  block text-base font-light 
                  text-muted-foreground hover:text-foreground 
                  transition-colors duration-300
                "
              >
                {link.label}
              </a>
            ))}
            <div className="pt-6 border-t border-border/50 space-y-3">
              <Button variant="ghost" className="w-full font-light">
                Sign in
              </Button>
              <Button className="w-full font-light bg-foreground text-background">
                Get started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
