"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/studio", label: "Studio" },
  { href: "/calendar", label: "Calendar" },
  { href: "/account", label: "Account" },
];

type PlanBadge = "PILOT" | "CORE" | "PRO" | "STUDIO";

type NavProps = {
  planBadge: PlanBadge;
};

export default function Nav({ planBadge }: NavProps) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? NAV_ITEMS[0];

  return (
    <nav aria-label="Primary" className="flex w-full items-center justify-between gap-3">
      <Link
        href="/dashboard"
        className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-ds-text-primary hover:text-ds-gold"
      >
        Synqra
      </Link>

      <ul className="hidden items-center gap-2 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-flex h-9 items-center border px-3 text-[12px] uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-ds-gold text-ds-gold"
                    : "border-ds-text-secondary/30 text-ds-text-secondary hover:text-ds-text-primary"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 items-center border border-ds-text-secondary/30 px-3 text-[10px] uppercase tracking-[0.14em] text-ds-text-secondary md:hidden">
          {activeItem.label}
        </span>
        <span className="inline-flex h-8 items-center border border-ds-gold/60 px-3 text-[10px] uppercase tracking-[0.14em] text-ds-gold">
          {planBadge}
        </span>
      </div>
    </nav>
  );
}
