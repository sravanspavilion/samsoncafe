"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Coffee, LayoutDashboard, ClipboardList, Package, CreditCard, Menu, LogOut, Bell, Search, Shield } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Live Orders", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/menu", label: "Menu", icon: Menu },
] as const;

export function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]/95 backdrop-blur-xl">
        <div className="container-luxury flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <span aria-hidden className="grid size-8 place-items-center rounded-full border border-[var(--primary)] serif text-base text-[var(--primary-fixed-dim)]">S</span>
            <span className="hidden sm:block serif text-lg font-semibold tracking-wide text-[var(--on-surface)]">SAMSONS CAFE</span>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[var(--surface-container-low)] px-2 py-1 rounded-full" aria-label="Admin navigation">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === href
                    ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_16px_rgba(212,175,55,0.2)]"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)]"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, items..."
                className="input-luxury w-64 pl-10 pr-4 py-1.5 text-sm"
              />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] hover:text-[var(--on-surface)]"
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] hover:text-[var(--on-surface)]">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--error)]" />
            </button>

            {/* User avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface-container)]"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                  <Shield size={16} className="text-[var(--on-primary)]" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-[var(--on-surface)]">Admin</span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-[var(--outline-variant)]">
                      <p className="text-sm font-semibold text-[var(--on-surface)]">Administrator</p>
                      <p className="text-xs text-[var(--on-surface-variant)]">Samsons Cafe</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-high)]"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Brew Bar Online Status Chip - visible on desktop */}
        <div className="hidden lg:block px-[24px] pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container-low)] shadow-[inset_0_0_12px_rgba(233,195,73,0.06)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
            </span>
            <span className="font-medium text-xs uppercase tracking-wider text-[var(--secondary)]">Brew Bar Online</span>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)} />
      )}
      {showMobileMenu && (
        <aside className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-[var(--surface-container-low)] border-l border-[var(--outline-variant)] shadow-xl p-4">
          <div className="flex items-center justify-between mb-6">
            <span className="serif text-xl text-[var(--on-surface)]">SAMSONS CAFE</span>
            <button onClick={() => setShowMobileMenu(false)} className="p-2 text-[var(--on-surface-variant)]">
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium ${
                  pathname === href
                    ? "bg-[var(--primary-container)] text-[var(--on-primary-container)]"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)]"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}