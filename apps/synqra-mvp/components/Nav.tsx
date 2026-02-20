"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/studio", label: "Studio" },
  { href: "/calendar", label: "Calendar" },
  { href: "/account", label: "Account" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="flex flex-wrap items-center gap-2 md:gap-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-block border px-3 py-2 font-sans text-[12px] uppercase tracking-[0.15em] ${
                  active
                    ? "border-ds-gold text-ds-text-primary"
                    : "border-ds-text-secondary/40 text-ds-text-secondary hover:text-ds-text-primary"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
