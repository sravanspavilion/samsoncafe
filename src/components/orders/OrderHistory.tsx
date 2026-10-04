"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrders } from "@/lib/api";
import type { OrderHistoryItem } from "@/types";
import { formatINR } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function parseOrderTime(timeStr?: string) {
  if (!timeStr) return { date: new Date(), label: "" };
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return { date: d, label: d.toLocaleString("en-IN", { month: "short", day: "2-digit", year: "numeric", timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) };
    }
  } catch {
    // ignore
  }
  return { date: new Date(), label: timeStr };
}

const statusLabels: Record<string, string> = {
  preparing: "PREPARING",
  completed: "COMPLETED",
  pending: "PENDING",
  cancelled: "CANCELLED",
};

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "today">("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getOrders();
        if (mounted) {
          const sorted = [...data].sort((a, b) => {
            const ad = parseOrderTime(a.time).date.getTime();
            const bd = parseOrderTime(b.time).date.getTime();
            return bd - ad;
          });
          setOrders(sorted);
          if (sorted.length > 0 && !selectedId) {
            setSelectedId(sorted[0].orderId);
          }
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    const now = new Date();
    return orders.filter((o) => {
      const d = parseOrderTime(o.time).date;
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [orders, filter]);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((o) => o.orderId === selectedId)) {
      setSelectedId(filtered[0].orderId);
    }
  }, [filtered, selectedId]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, OrderHistoryItem[]> = {};
    for (const o of filtered) {
      const d = parseOrderTime(o.time).date;
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const selected = filtered.find((o) => o.orderId === selectedId);

  if (loading) {
    return (
      <div className="mt-10 flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#c8a261]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 panel rounded-2xl p-8 text-center">
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="inline-block size-2 rounded-full bg-[#c8a261] shadow-[0_0_8px_#c8a261]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c8a261]">
              CHRONOLOGICAL ATELIER ARCHIVE
            </span>
          </div>
          <h1 className="serif text-3xl md:text-4xl">Order History</h1>
          <p className="mt-2 text-sm text-muted">Explore your artisanal order history by date.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#3d312a] bg-[#120e0c] p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              filter === "all" ? "bg-[#c8a261] text-[#241a00]" : "text-[#a8988b] hover:text-[#e9c07c]"
            }`}
          >
            All Dates
          </button>
          <button
            type="button"
            onClick={() => setFilter("today")}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              filter === "today" ? "bg-[#c8a261] text-[#241a00]" : "text-[#a8988b] hover:text-[#e9c07c]"
            }`}
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#faf6f0]">Order Archive Ledger</span>
              <span className="rounded-full bg-[#1c1512] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">
                {filtered.length} ORDERS
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#3d312a] bg-[#120e0c] p-12 text-center">
              <h3 className="serif text-2xl">No orders found</h3>
              <p className="mt-2 max-w-md text-sm text-muted">
                Explore our curated roastery selections for your next pairing.
              </p>
              <Link
                href="/menu"
                className="mt-6 inline-flex items-center gap-2 border border-[#c8a261] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#e9c07c] hover:bg-[#c8a261]/10"
              >
                Explore Menu
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groupedByDate.map(([dateKey, items]) => {
                const dayTotal = items.reduce((sum, o) => sum + o.total, 0);
                return (
                  <div key={dateKey} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#3d312a] px-1 pb-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#c8a261]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">
                          {dateKey}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-[#a8988b]">
                        {items.length} Orders • {formatINR(dayTotal)}
                      </span>
                    </div>
                    {items.map((order) => {
                      const { label } = parseOrderTime(order.time);
                      const status = order.status || "preparing";
                      const isActive = selectedId === order.orderId;
                      return (
                        <button
                          key={order.orderId}
                          type="button"
                          onClick={() => setSelectedId(order.orderId)}
                          className={`group relative rounded-xl border p-5 text-left transition-all ${
                            isActive
                              ? "border-[#c8a261] bg-[#1c1512] shadow-[0_0_24px_-4px_rgba(200,162,97,0.35)]"
                              : "border-[#3d312a] bg-[#120e0c] hover:border-[#c8a261]/60 hover:bg-[#1c1512]"
                          }`}
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="serif text-lg text-[#e9c07c]">{order.orderId}</span>
                              <span className="flex items-center gap-1.5 text-xs text-[#a8988b]">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {label}
                              </span>
                            </div>
                            <span className="rounded-full bg-[#261e1a] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e9c07c]">
                              {statusLabels[status] || status.toUpperCase()}
                            </span>
                          </div>
                          <div className="border-t border-b border-[#3d312a] py-3">
                            <p className="text-sm leading-relaxed text-[#faf6f0]">
                              {order.items
                                .map((it) => `${it.name} × ${it.quantity}`)
                                .join(", ")}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-[#a8988b]">{order.items.length} item(s)</span>
                            <span className="serif text-lg text-[#e9c07c]">{formatINR(order.total)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <aside className="relative rounded-2xl border border-[#c8a261]/30 bg-[#120e0c] p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] sm:p-8">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-[#3d312a] pb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">
                      ORDER INSPECTION
                    </span>
                    <h2 className="serif mt-1 text-2xl text-[#faf6f0]">{selected.orderId}</h2>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#1c1512] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">
                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                    SECURE
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#3d312a]/60 py-4 text-sm text-[#a8988b]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#c8a261]">calendar_today</span>
                    {parseOrderTime(selected.time).label}
                  </span>
                  <span className="rounded-md bg-[#1c1512] px-2.5 py-1 font-mono text-xs text-[#faf6f0]">
                    {selected.status?.toUpperCase() || "PREPARING"}
                  </span>
                </div>
                <div className="my-5 rounded-xl bg-[#110d0b] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a8988b]">
                      Order Items
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c8a261]">
                      {selected.items.length} ITEM(S)
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {selected.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-[#3d312a]/40 pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm text-[#faf6f0]">{it.name}</p>
                          <p className="text-xs text-[#a8988b]">Qty: {it.quantity}</p>
                        </div>
                        <span className="text-sm text-[#e9c07c]">{formatINR(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#3d312a]/60 pt-4">
                    <span className="text-sm font-semibold text-[#faf6f0]">Total</span>
                    <span className="serif text-xl text-[#e9c07c]">{formatINR(selected.total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center text-center">
                <p className="text-sm text-muted">Select an order to inspect</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
