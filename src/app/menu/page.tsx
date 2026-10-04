"use client";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MenuCard } from "@/components/menu/MenuCard";
import { CategoryFilters } from "@/components/menu/CategoryFilters";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/States";
import { getMenu } from "@/lib/api";
import type { MenuItem } from "@/types";
export default function MenuPage() { const [menu, setMenu] = useState<MenuItem[]>([]); const [status, setStatus] = useState<"loading"|"ready"|"error">("loading"); const [category, setCategory] = useState("All"); const [search, setSearch] = useState(""); useEffect(() => { getMenu().then((data) => { setMenu(data); setStatus("ready"); }).catch(() => setStatus("error")); }, []); const categories = useMemo(() => [...new Set(menu.map((item) => item.category))], [menu]); const shown = useMemo(() => menu.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    const searchTerm = search.toLowerCase();
    const text = `${item.name} ${item.description || ""}`.toLowerCase();
    return text.includes(searchTerm);
  }), [menu, category, search]); return <><Header /><main className="page-shell"><div className="container-luxury py-12 md:py-16"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><SectionHeading eyebrow="Samsons Private Reserve & Atelier" title="Curated Menu" description="Artisanal single-origin espresso, slow-steeped extractions, and velvety crafted treats poured to perfection." /><div className="panel flex items-center gap-3 rounded-xl px-4 py-3"><i className="size-2 rounded-full bg-[#c8a261]" /><span className="text-[10px] font-bold tracking-widest text-muted">BARISTA AT WORK</span></div></div>{status === "ready" && <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><CategoryFilters categories={categories} value={category} onChange={setCategory} /><label className="relative block lg:w-80">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a8988b]" size={18} />
                  <span className="sr-only">Search menu</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="input-luxury pl-14"
                    placeholder="Search coffee or beverages..."
                    autoComplete="off"
                    spellCheck="false"
                    type="search"
                  />
                </label></div>}<div className="mt-8">{status === "loading" ? <LoadingState /> : status === "error" ? <ErrorState message="The menu could not be loaded. Please refresh and try again." /> : shown.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{shown.map((item) => <MenuCard key={item.id} item={item} />)}</div> : <EmptyState title="No selections found" text="Try another category or search term." />}</div></div></main><Footer /></>; }
