"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/menu/QuantitySelector";
import { CartSummary } from "@/components/cart/CartSummary";
import { GoldButton } from "@/components/ui/GoldButton";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";

export function MenuCheckout() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();

  return (
    <section aria-labelledby="menu-checkout-heading" className="mt-16 border-t border-[#3d312a] pt-10 md:mt-20 md:pt-12">
      <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c8a261]">Your selections</p>
      <h2 id="menu-checkout-heading" className="serif mt-3 text-3xl md:text-4xl">Ready to checkout?</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Review your order below, then continue to checkout to confirm your details.</p>

      {items.length ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="panel flex min-w-0 flex-col rounded-2xl p-4">
                <div className="flex flex-1 flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">{item.category}</p>
                  <h3 className="serif mt-2 break-words text-xl">{item.name}</h3>
                  <p className="mt-2 text-sm text-muted">{formatINR(item.price)} each</p>
                  <div className="mt-auto pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <QuantitySelector value={item.quantity} onChange={(quantity) => updateQuantity(item.id, quantity)} max={item.stock} />
                      <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="grid size-9 place-items-center rounded-full text-[#a8988b] transition hover:bg-[#261e1a] hover:text-[#e5c158]">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#3d312a] pt-4">
                      <span className="text-xs text-muted">Subtotal</span>
                      <strong className="serif text-xl text-[#e9c07c]">{formatINR(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <CartSummary totalItems={totalItems} totalPrice={totalPrice} />
        </div>
      ) : (
        <div className="panel mt-8 flex flex-col items-center gap-5 rounded-2xl p-6 text-center sm:flex-row sm:text-left md:p-8">
          <ShoppingBag aria-hidden="true" size={28} className="shrink-0 text-[#c8a261]" />
          <div className="flex-1">
            <h3 className="serif text-2xl">Your order is empty</h3>
            <p className="mt-2 text-sm text-muted">Add your favourites from the menu above to get started.</p>
          </div>
          <GoldButton disabled className="w-full sm:w-auto">CONTINUE TO CHECKOUT</GoldButton>
        </div>
      )}
    </section>
  );
}
