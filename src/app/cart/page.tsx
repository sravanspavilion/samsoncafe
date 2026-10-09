"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/context/CartContext";
import { OrderHistory } from "@/components/orders/OrderHistory";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="container-luxury py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#e9c07c]">
            <ArrowLeft size={16} /> CONTINUE SHOPPING
          </Link>

          <div className="mt-8">
            <SectionHeading
              eyebrow="Your private reserve"
              title="My Order Panel"
              description="Review your current selections and check your order history."
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 rounded-lg border border-[#3d312a] bg-[#120e0c] p-1 sm:inline-flex">
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === "current" ? "bg-[#c8a261] text-[#241a00]" : "text-[#a8988b] hover:text-[#e9c07c]"
              }`}
            >
              Current Order
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === "history" ? "bg-[#c8a261] text-[#241a00]" : "text-[#a8988b] hover:text-[#e9c07c]"
              }`}
            >
              Order History
            </button>
          </div>

          {activeTab === "current" && (
            <>
              {!items.length ? (
                <div className="mt-10">
                  <EmptyState />
                </div>
              ) : (
                <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onQuantity={(quantity) => updateQuantity(item.id, quantity)}
                        onRemove={() => removeItem(item.id)}
                      />
                    ))}
                  </div>
                  <CartSummary totalItems={totalItems} totalPrice={totalPrice} />
                </div>
              )}
            </>
          )}

          {activeTab === "history" && <OrderHistory />}
        </div>
      </main>
      <Footer />
    </>
  );
}
