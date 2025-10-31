"use client";

import React from "react";
import AuthButton from "./AuthButton";

export type HeaderProps = {
  onToggleSidebar?: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-matte-black/80 backdrop-blur-sm gold-divider">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded hover:glow-teal"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <span className="gradient-gold text-lg font-bold">SYNQRA</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 rounded-md border border-gold text-sm hover:glow-gold transition">
              Launch Plan
            </button>
            <AuthButton />
            <div className="w-8 h-8 rounded-full bg-deep-charcoal border border-gold" aria-label="User avatar" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
