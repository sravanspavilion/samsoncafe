"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GoldButton } from "@/components/ui/GoldButton";
import { QuantitySelector } from "@/components/menu/QuantitySelector";
import { getMenu } from "@/lib/api";
import type { MenuItem } from "@/types";
import { formatINR, isLowStock } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { EmptyState, LoadingState } from "@/components/ui/States";
export default function ProductPage() {
  const params = useParams<{ itemId: string }>();
  const [item, setItem] = useState<MenuItem | null | undefined>(undefined);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => { getMenu().then((menu) => setItem(menu.find((entry) => entry.id === params.itemId) ?? null)).catch(() => setItem(null)); }, [params.itemId]);
  if (item === undefined) return <><Header /><main className="page-shell"><div className="container-luxury py-16"><LoadingState /></div></main><Footer /></>;
  if (!item) return <><Header /><main className="page-shell"><div className="container-luxury py-16"><EmptyState title="This selection has moved on" text="Return to our menu for today’s available reserve." /></div></main><Footer /></>;
  const unavailable = item.status === "unavailable" || item.stock < 1;
  return <><Header /><main className="page-shell"><div className="container-luxury py-10 md:py-16"><Link href="/menu" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#e9c07c] hover:text-[#e5c158]"><ArrowLeft size={16} /> BACK TO MENU</Link><div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16"><div className="relative aspect-square overflow-hidden rounded-2xl border border-[#3d312a] bg-[#120e0c]"><Image src={item.image} alt={item.name} fill priority className={`object-cover ${unavailable ? "opacity-40 grayscale" : ""}`} /></div><div className="flex flex-col justify-center"><span className="text-[10px] font-bold tracking-[.22em] text-[#c8a261]">{item.category.toUpperCase()} · {item.id}</span><h1 className="serif mt-4 text-5xl md:text-6xl">{item.name}</h1><p className="serif mt-5 text-3xl text-[#e9c07c]">{formatINR(item.price)}</p><p className="mt-7 max-w-xl text-base leading-8 text-muted">{item.description}</p><div className="mt-7 flex items-center gap-2 text-xs font-bold tracking-widest text-muted">{unavailable ? <span><i className="mr-2 inline-block size-2 rounded-full bg-[#5a473d]" />UNAVAILABLE TODAY</span> : <span><i className={`mr-2 inline-block size-2 rounded-full ${isLowStock(item.stock) ? "bg-[#e5c158]" : "bg-[#c8a261]"}`} />{isLowStock(item.stock) ? `ONLY ${item.stock} LEFT` : "PREPARED TO ORDER"}</span>}</div>{!unavailable && <div className="mt-10 flex flex-wrap items-center gap-5"><QuantitySelector value={quantity} onChange={setQuantity} max={item.stock} /><GoldButton onClick={() => { if (addItem(item, quantity)) { setAdded(true); setTimeout(() => setAdded(false), 2200); } }}><ShoppingBag size={16} />{added ? "ADDED TO ORDER" : "ADD TO TASTING ORDER"}</GoldButton></div>}{added && <p className="mt-4 flex items-center gap-2 text-sm text-[#e9c07c]"><Check size={16} /> Added to your order folio.</p>}</div></div></div></main><Footer /></>;
}
