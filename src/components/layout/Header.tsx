"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";

const links = [{ href: "/", label: "MENU" }, { href: "/cart", label: "MY ORDER" }];
export function Header() {
  const path = usePathname();
  const { totalItems, totalPrice } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--primary)]/25 bg-[var(--surface-container-lowest)]/95 backdrop-blur-xl">
      <div className="container-luxury flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-full border border-[var(--primary)] serif text-lg text-[var(--primary-fixed-dim)]">S</span>
          <span className="flex flex-col">
            <span className="serif whitespace-nowrap text-lg leading-none tracking-wide">SAMSONS CAFE</span>
            <span className="mt-1 text-[9px] font-semibold tracking-[.25em] text-[var(--primary)]">CAFE & ROASTERY</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-2 text-xs font-semibold tracking-[.12em] ${
                path === link.href
                  ? "text-[var(--primary-fixed-dim)] after:absolute after:bottom-0 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-[var(--primary)]"
                  : "text-[var(--on-surface-variant)] hover:text-[var(--primary-fixed-dim)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/cart" aria-label={`View cart, ${totalItems} items`} className="relative grid size-10 place-items-center rounded-full bg-[var(--surface-container-high)] text-[var(--primary-fixed-dim)] hover:bg-[var(--surface-container-highest)]">
            <ShoppingBag size={19} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--on-primary)]">
                {totalItems}
              </span>
            )}
          </Link>
          <Link href="/cart" className="hidden border border-[var(--primary)] px-3 py-2 text-[10px] font-bold tracking-widest text-[var(--primary-fixed-dim)] sm:inline-block">
            MY ORDER {totalItems > 0 && `(${formatINR(totalPrice)})`}
          </Link>
        </div>
      </div>
      <nav aria-label="Mobile primary" className="container-luxury flex gap-6 pb-3 md:hidden">
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={path === link.href ? "page" : undefined} className="text-xs font-semibold tracking-widest text-[var(--primary-fixed-dim)]">{link.label}</Link>)}
      </nav>
    </header>
  );
}