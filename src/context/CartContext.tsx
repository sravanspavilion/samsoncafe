"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartLine, MenuItem } from "@/types";

type CartContextValue = { items: CartLine[]; addItem: (item: MenuItem, quantity?: number) => boolean; removeItem: (id: string) => void; updateQuantity: (id: string, quantity: number) => void; clearCart: () => void; totalItems: number; totalPrice: number };
const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "samsons-cafe-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Always start empty so the first client render matches the server-rendered HTML.
  // The persisted cart is loaded from localStorage after mount instead.
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as CartLine[]);
    } catch { /* ignore malformed storage */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return; // avoid overwriting storage before the initial load
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);
  const addItem = (item: MenuItem, quantity = 1) => {
    const current = items.find((line) => line.id === item.id)?.quantity ?? 0;
    if (item.status !== "available" || current + quantity > item.stock) return false;
    setItems((lines) => { const existing = lines.find((line) => line.id === item.id); return existing ? lines.map((line) => line.id === item.id ? { ...line, quantity: line.quantity + quantity } : line) : [...lines, { ...item, quantity }]; });
    return true;
  };
  const updateQuantity = (id: string, quantity: number) => setItems((lines) => lines.flatMap((line) => line.id !== id ? [line] : quantity <= 0 ? [] : [{ ...line, quantity: Math.min(quantity, line.stock) }]));
  const value = { items, addItem, updateQuantity, removeItem: (id: string) => setItems((lines) => lines.filter((line) => line.id !== id)), clearCart: () => setItems([]), totalItems: items.reduce((sum, item) => sum + item.quantity, 0), totalPrice: items.reduce((sum, item) => sum + item.quantity * item.price, 0) };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used inside CartProvider"); return context; }
