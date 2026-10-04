"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/context/CartContext";
export default function CartPage() { const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart(); return <><Header /><main className="page-shell"><div className="container-luxury py-12 md:py-16"><Link href="/menu" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#e9c07c]"><ArrowLeft size={16} /> CONTINUE SHOPPING</Link><div className="mt-8"><SectionHeading eyebrow="Your private reserve" title="My Order Folio" description="Review each selection before sending it to our barista." /></div>{!items.length ? <div className="mt-10"><EmptyState /></div> : <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]"><div className="space-y-4">{items.map((item) => <CartItem key={item.id} item={item} onQuantity={(quantity) => updateQuantity(item.id, quantity)} onRemove={() => removeItem(item.id)} />)}</div><CartSummary totalItems={totalItems} totalPrice={totalPrice} /></div>}</div></main><Footer /></>; }
