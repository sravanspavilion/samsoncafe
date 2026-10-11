"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, Ticket } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/States";
import { GoldButton } from "@/components/ui/GoldButton";
import { QuantitySelector } from "@/components/menu/QuantitySelector";
import { useCart } from "@/context/CartContext";
import { placeOrder } from "@/lib/api";
import { formatINR } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickupNote, setPickupNote] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await placeOrder({
        pickupNote,
        items: items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
      });
      clearCart();
      router.push(`/order-success?orderId=${encodeURIComponent(result.orderId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="container-luxury py-12 md:py-16">
          {!items.length ? (
            <EmptyState title="Your order folio is empty" text="Choose something from the menu before checkout." />
          ) : (
            <>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#e9c07c]"
              >
                <ArrowLeft size={16} /> BACK TO MY ORDER
              </button>

              <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
                {/* Order panel */}
                <div className="panel flex flex-col rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between gap-4 border-b border-[#3d312a] px-5 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <Ticket className="text-[#c8a261]" size={20} />
                      <div>
                        <span className="text-[10px] font-bold tracking-[.22em] text-[#c8a261]">YOUR ORDER</span>
                        <h1 className="serif mt-1 text-2xl md:text-3xl">Checkout</h1>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg border border-[#c8a261]/30 px-3 py-1.5 text-xs font-bold tracking-widest text-[#e9c07c]">
                      {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
                    </span>
                  </div>

                  {/* Scrolling item list */}
                  <div className="max-h-[55vh] min-h-0 overflow-y-auto px-5 py-4 md:px-6">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="flex flex-col gap-3 border-b border-[#3d312a]/60 py-5 first:pt-1 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">{item.category} · {item.id}</p>
                          <h2 className="serif mt-1 break-words text-xl text-[#ece3d3]">{item.name}</h2>
                          <p className="mt-1 text-sm text-muted">{formatINR(item.price)} each</p>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <QuantitySelector value={item.quantity} onChange={(quantity) => updateQuantity(item.id, quantity)} max={item.stock} />
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="grid size-9 place-items-center rounded-full text-[#a8988b] transition hover:bg-[#261e1a] hover:text-[#e5c158]"
                          >
                            <span className="text-lg leading-none">×</span>
                          </button>
                          <strong className="serif w-20 text-right text-xl text-[#e9c07c]">{formatINR(item.price * item.quantity)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Pickup note (optional) */}
                  <div className="border-t border-[#3d312a] px-5 py-4 md:px-6">
                    <label className="block text-xs font-bold tracking-widest text-[#d1c5b4]">
                      PICKUP / TABLE NOTE <span className="font-normal text-muted">(optional)</span>
                      <textarea
                        value={pickupNote}
                        onChange={(event) => setPickupNote(event.target.value)}
                        className="input-luxury mt-2 min-h-20 resize-y"
                        placeholder="e.g. Table 4, or pickup in 15 minutes"
                      />
                    </label>
                  </div>

                  {/* Total + submit */}
                  <div className="flex flex-col gap-4 border-t border-[#c8a261]/25 bg-[#1c1512] px-5 py-5 md:px-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted">Total ({totalItems} items)</span>
                      <strong className="serif text-3xl text-[#e9c07c]">{formatINR(totalPrice)}</strong>
                    </div>
                    <div className="flex items-center gap-3">
                      <LockKeyhole className="shrink-0 text-[#c8a261]" size={16} />
                      <p className="text-xs leading-5 text-muted">Your order will be submitted for staff confirmation.</p>
                    </div>
                    {error && <p role="alert" className="text-sm text-[#ffb4ab]">{error}</p>}
                    <GoldButton disabled={loading} className="w-full">
                      {loading ? "SUBMITTING ORDER…" : "PLACE ORDER"}
                    </GoldButton>
                  </div>
                </div>

                {/* Summary */}
                <aside className="lg:sticky lg:top-8 lg:self-start">
                  <div className="panel rounded-2xl p-5 md:p-6">
                    <h2 className="serif text-xl">Total</h2>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between text-muted">
                        <span>Items ({totalItems})</span>
                        <span className="text-[#ece3d3]">{formatINR(totalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted">
                        <span>Service</span>
                        <span className="text-[#ece3d3]">Included</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#3d312a] pt-3">
                        <span className="font-semibold text-[#ece3d3]">Grand total</span>
                        <strong className="serif text-2xl text-[#e9c07c]">{formatINR(totalPrice)}</strong>
                      </div>
                    </div>
                  </div>
                </aside>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}