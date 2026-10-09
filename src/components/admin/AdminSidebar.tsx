"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, ClipboardList, Package, CreditCard, Menu, Shield } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Live Orders", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/menu", label: "Menu", icon: Menu },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-56 border-r border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-4 md:p-6 min-h-screen">
      <Link href="/admin" className="flex items-center gap-2 mb-8">
        <span aria-hidden className="grid size-8 place-items-center rounded-full border border-[var(--primary)] serif text-base text-[var(--primary-fixed-dim)]">S</span>
        <span className="serif text-lg font-semibold tracking-wide text-[var(--on-surface)]">SAMSONS CAFE</span>
      </Link>

      <p className="text-[9px] font-bold tracking-[.2em] uppercase text-[var(--on-surface-variant)] mb-6">ADMIN CONSOLE</p>

      <nav className="flex flex-col gap-1" aria-label="Admin sidebar navigation">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              pathname === href
                ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_16px_rgba(212,175,55,0.2)]"
                : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]"
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Brew Bar Status at bottom */}
      <div className="mt-auto pt-6 border-t border-[var(--outline-variant)]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[var(--surface-container-low)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
          </span>
          <span className="text-xs font-medium text-[var(--secondary)]">Brew Bar Online</span>
        </div>
      </div>
    </aside>
  );
}