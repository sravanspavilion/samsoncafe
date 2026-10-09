"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Package, ShoppingBag, AlertTriangle, Clock, Coffee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { StatCard } from "@/components/admin/AdminComponents";
import { KanbanColumn, FilterTabs, OrderCard, type Order } from "@/components/admin/KanbanComponents";
import { useStats, useOrders, useLiveOrders, type Stats } from "@/lib/api-admin";

const hourlyColors = ["#E9C349", "#EAC16D", "#D4AF37", "#F2CA50", "#FFE088", "#D4AF37", "#EAC16D", "#E9C349"];

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, retry: retryStats } = useStats();
  const { orders, isLoading: ordersLoading, retry: retryOrders } = useLiveOrders(10000);

  const [activeFilter, setActiveFilter] = useState("all");

  // Ensure orders is always an array
  const ordersList = orders || [];

  // Compute stats from orders if API not available
  const todayOrders = ordersList.filter((o: Order) => o.status !== "cancelled" && o.status !== "rejected").length;
  const grossSales = ordersList.reduce((sum: number, o: Order) => sum + o.total, 0);
  const itemsSold = ordersList.reduce((sum: number, o: Order) => sum + o.items.reduce((s: number, i: Order["items"][0]) => s + i.quantity, 0), 0);
  const lowStockAlerts = stats?.lowStockAlerts ?? 2; // fallback

  // Hourly velocity data
  const hourlyData = stats?.hourlyVelocity ?? [
    { hour: "7AM", orders: 3, isPeak: false },
    { hour: "8AM", orders: 7, isPeak: false },
    { hour: "9AM", orders: 14, isPeak: true },
    { hour: "10AM", orders: 11, isPeak: false },
    { hour: "11AM", orders: 5, isPeak: false },
    { hour: "12PM", orders: 4, isPeak: false },
    { hour: "1PM", orders: 6, isPeak: false },
    { hour: "2PM", orders: 2, isPeak: false },
    { hour: "3PM", orders: 1, isPeak: false },
  ];

  // Category volume
  const categoryVolume = stats?.categoryVolume ?? [
    { category: "Hot Coffee", count: 39, percentage: 58, color: "#E9C349" },
    { category: "Cold Brews", count: 18, percentage: 26, color: "#EAC16D" },
    { category: "Smoothies", count: 11, percentage: 16, color: "#DACCC2" },
  ];

  // Recent orders for feed (last 4)
  const recentOrders = ordersList.slice(0, 4);

  // Group orders by status for kanban preview
  const newOrders = ordersList.filter((o: Order) => o.status === "new").slice(0, 3);
  const preparingOrders = ordersList.filter((o: Order) => o.status === "preparing").slice(0, 2);
  const readyOrders = ordersList.filter((o: Order) => o.status === "ready").slice(0, 2);

  const handleAction = (orderId: string, action: string) => {
    console.log(`Action ${action} on order ${orderId}`);
    // In production, call updateOrderStatus API
  };

  if (statsLoading && ordersLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCard key={i} label="Loading..." value="—" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 admin-card p-6 h-80"><div className="flex items-center justify-center h-full text-[var(--on-surface-variant)]">Loading chart...</div></div>
          <div className="admin-card p-6 h-80"><div className="flex items-center justify-center h-full text-[var(--on-surface-variant)]">Loading...</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">SAMSONS OPERATIONS</span>
          <h1 className="serif mt-2 text-3xl font-semibold text-[var(--on-surface)]">Overview</h1>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">Real-time cafe dashboard • Brew Bar Online</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            Live
          </span>
          <button onClick={() => { retryStats(); retryOrders(); }} className="btn-ghost text-xs">
            Refresh
          </button>
        </div>
      </div>

      {statsError && <p role="status" className="admin-card p-4 text-sm text-[var(--on-surface-variant)]">Dashboard statistics are unavailable from this Apps Script deployment. Menu and orders can still be loaded.</p>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Orders"
          value={todayOrders}
          note="Demo order activity"
          icon={<ShoppingBag size={16} />}
          trend={{ value: "+8% vs yesterday", positive: true }}
        />
        <StatCard
          label="Gross Sales"
          value={formatINR(grossSales)}
          note="All tenders included"
          icon={<TrendingUp size={16} />}
          highlight
        />
        <StatCard
          label="Items Sold"
          value={itemsSold}
          note="Craft drinks & smoothies"
          icon={<Coffee size={16} />}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockAlerts}
          note="≤ 6 units threshold"
          icon={<AlertTriangle size={16} />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hourly Velocity Chart */}
          <div className="admin-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--secondary)]">Extraction Cadence</span>
                <h2 className="serif mt-1 text-xl font-semibold text-[var(--on-surface)]">Hourly Order Velocity & Rush Peak</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container)] text-[var(--secondary)] text-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                Peak Window: 09:00 - 10:00 AM (14 Orders)
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
                  <XAxis type="number" tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }} axisLine={false} />
                  <YAxis type="category" dataKey="hour" tick={{ fill: "var(--on-surface)", fontSize: 12, fontWeight: 500 }} axisLine={false} width={50} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-container)",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: "8px",
                      color: "var(--on-surface)",
                    }}
                    formatter={(value) => [value ?? 0, "Orders"]}
                  />
                  <Bar dataKey="orders" radius={[0, 4, 4, 0]} barSize={24}>
                    {hourlyData.map((entry, index) => (
                      <Cell key={index} fill={entry.isPeak ? "var(--primary)" : "var(--surface-container-high)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Volume + Sensory Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 admin-card p-6">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--secondary)]">Tasting Matrix</span>
                <h3 className="serif mt-1 text-lg font-semibold text-[var(--on-surface)]">Category Volume Distribution</h3>
                <p className="text-xs text-[var(--on-surface-variant)] mt-1">Today&apos;s dispense ratios by extraction format</p>
              </div>
              <div className="space-y-4">
                {categoryVolume.map((cat, index) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm text-[var(--on-surface)]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.category}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.percentage}% ({cat.count})</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--surface-container)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-[var(--outline-variant)] flex items-center justify-between text-xs text-[var(--on-surface-variant)]">
                  <span>Top Performer: <strong className="text-[var(--primary)]">Double Velvet Flat White</strong></span>
                  <span>Conversion: 94.2%</span>
                </div>
              </div>
            </div>

            {/* Sensory/Visual Card */}
            <div className="md:col-span-5 relative rounded-xl overflow-hidden shadow-md group min-h-[220px]">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80')"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-container-lowest)] via-[var(--surface-container-lowest)]/60 to-transparent" />
              <div className="relative z-10 p-4 h-full flex flex-col justify-end space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--secondary)] bg-[var(--surface-container-low)]/90 backdrop-blur px-3 py-1 rounded-full inline-block w-fit">Flagship Roast Batch #842</span>
                <p className="serif text-lg font-semibold text-[var(--on-surface)]">Precision Extraction Bar</p>
                <p className="text-sm text-[var(--on-surface-variant)] line-clamp-2">Monitored 9 bar brew pressure with dual-boiler PID thermal stability.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Live Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Orders Feed */}
          <div className="admin-card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inset-0 rounded-full bg-[var(--primary)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
                </span>
                <h3 className="serif text-lg font-semibold text-[var(--on-surface)]">Live Orders Feed</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-container)] text-[var(--secondary)]">
                {ordersList.filter((o: Order) => o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected").length} Active
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-96 pr-2">
              {recentOrders.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[var(--on-surface-variant)]/50">
                  <p className="text-sm">No recent orders</p>
                </div>
              ) : (
                recentOrders.map((order: Order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    currentStage={order.status}
                    onAction={handleAction}
                  />
                ))
              )}
            </div>
            <button className="mt-2 w-full py-2 text-center text-sm font-medium text-[var(--secondary)] hover:text-[var(--primary)] flex items-center justify-center gap-1">
              View Full KDS Queue
              <span>→</span>
            </button>
          </div>

          {/* Telemetry Card */}
          <div className="admin-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--secondary)]">Telemetry</span>
              <span className="text-xs text-[var(--on-surface-variant)]">v2.4.1 Cloud API</span>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-[var(--surface-container)] p-3 rounded-lg">
              <div className="space-y-1">
                <span className="text-xs text-[var(--on-surface-variant)]">API Ping</span>
                <span className="serif text-lg font-bold text-[var(--primary)]">42ms</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[var(--on-surface-variant)]">Sync State</span>
                <span className="serif text-lg font-semibold text-[var(--on-surface)]">{stats?.recentOrders?.length || orders.length} Items</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--on-surface-variant)] pt-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                Auto-Polling Active (10s)
              </span>
              <span className="text-[var(--on-surface-variant)]">No Errors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--secondary)]">Managerial Quick Controls</span>
          <span className="text-xs text-[var(--on-surface-variant)]">Authorized: Barista Lead</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="btn-ghost flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--secondary)]">campaign</span>
            <span>Broadcast Notice</span>
          </button>
          <button className="btn-ghost flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--secondary)]">pause_circle</span>
            <span>Pause Online Orders</span>
          </button>
          <button className="btn-ghost flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--secondary)]">download</span>
            <span>Export EOD Summary</span>
          </button>
        </div>
      </div>
    </div>
  );
}
