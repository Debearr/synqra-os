"use client";

import React from "react";
import Link from "next/link";

export type SidebarProps = {
  isOpen: boolean;
  onClose?: () => void;
};

const navItems: Array<{ href: string; label: string; icon?: React.ReactNode }> = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/automation", label: "Automation" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={
        "fixed z-40 inset-y-0 left-0 w-72 p-4 transition-transform duration-300 md:static md:translate-x-0 " +
        (isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")
      }
      aria-hidden={!isOpen}
    >
      <div className="glassmorphism h-full flex flex-col px-4 py-6 bg-deep-charcoal">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="text-xl font-bold gradient-gold">
            SYNQRA
          </Link>
          <button
            className="md:hidden p-2 rounded hover:glow-teal"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <span className="sr-only">Close</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md transition-colors duration-300 hover:bg-black/20"
            >
              <span className="text-silver-mist">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <div className="text-xs text-silver-mist/70">v0.1 • NØID</div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
