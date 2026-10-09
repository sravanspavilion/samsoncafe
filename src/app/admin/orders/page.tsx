"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, BellOff, RotateCcw, Filter, AlertCircle, CheckCircle, X, Send, Play, Truck, MapPin, Coffee, Timer } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { KanbanColumn, FilterTabs, OrderCard, type Order, type OrderStatus } from "@/components/admin/KanbanComponents";
import { useOrders, useUpdateOrderStatus } from "@/lib/api-admin";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

const statusOrder: OrderStatus[] = ["new", "preparing", "ready", "completed", "cancelled", "rejected"];
const EMPTY_ORDERS: Order[] = [];

export default function AdminOrdersPage() {
  const { data: ordersData, isLoading, error, mutate, retry } = useOrders();
  const updateOrderStatus = useUpdateOrderStatus();

  // Ensure orders is always an array
  const orders = Array.isArray(ordersData) ? ordersData : EMPTY_ORDERS;

  const [activeFilter, setActiveFilter] = useState("all");
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  // Filter tabs with counts
  const filterTabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "new", label: "New Queue", count: orders.filter((o: Order) => o.status === "new").length },
    { id: "preparing", label: "Preparing", count: orders.filter((o: Order) => o.status === "preparing").length },
    { id: "ready", label: "Ready for Pickup", count: orders.filter((o: Order) => o.status === "ready").length },
    { id: "completed", label: "Completed", count: orders.filter((o: Order) => o.status === "completed").length },
  ];

  // Filter orders based on active tab
  const filteredOrders = activeFilter === "all"
    ? orders
    : orders.filter((o: Order) => o.status === activeFilter);

  // Group orders by status for Kanban
  const newOrders = orders.filter((o: Order) => o.status === "new");
  const preparingOrders = orders.filter((o: Order) => o.status === "preparing");
  const readyOrders = orders.filter((o: Order) => o.status === "ready");
  const completedOrders = orders.filter((o: Order) => o.status === "completed").slice(0, 5);

  const handleAction = useCallback(async (orderId: string, action: string) => {
    setProcessingOrder(orderId);
    try {
      const statusMap: Record<string, OrderStatus> = {
        accept: "preparing",
        reject: "rejected",
        start: "preparing",
        ready: "ready",
        page: "ready",
        complete: "completed",
      };
      const newStatus = statusMap[action];
      if (newStatus) {
        await updateOrderStatus(orderId, newStatus);
        mutate();
        toast.success(`Order ${orderId} → ${newStatus}`);
      }
    } catch (err) {
      toast.error("Failed to update order");
    } finally {
      setProcessingOrder(null);
    }
  }, [updateOrderStatus, mutate]);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await mutate();
      toast.success("Synced with Google Sheets");
    } catch {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }, [mutate]);

  const playChime = useCallback(() => {
    if (chimeEnabled) {
      // Create a simple chime sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [chimeEnabled]);

  // Check for new orders and play chime
  const prevOrdersRef = useRef<Order[]>([]);
  useEffect(() => {
    if (prevOrdersRef.current.length < orders.length) {
      const newOrder = orders.find((o: Order) => !prevOrdersRef.current.some((po: Order) => po.orderId === o.orderId));
      if (newOrder && newOrder.status === "new") {
        playChime();
        toast.info(`New order: ${newOrder.orderId}`, { icon: <AlertCircle size={16} /> });
      }
    }
    prevOrdersRef.current = orders;
  }, [orders, playChime]);

  // Auto-poll
  useEffect(() => {
    const interval = setInterval(() => mutate(), 8000);
    return () => clearInterval(interval);
  }, [mutate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">KDS TERMINAL</span>
            <h1 className="serif mt-2 text-3xl font-semibold">Live Orders</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="admin-card p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--surface-container-high)] animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                {[1,2].map(j => (
                  <div key={j} className="h-32 bg-[var(--surface-container)] rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">KDS TERMINAL</span>
          <h1 className="serif mt-2 text-3xl font-semibold text-[var(--on-surface)]">Live Orders</h1>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">Barista terminal • Real-time order flow</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Chime Toggle */}
          <button
            onClick={() => setChimeEnabled(!chimeEnabled)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              chimeEnabled
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "bg-[var(--surface-container)] text-[var(--on-surface-variant)]"
            )}
          >
            {chimeEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span>{chimeEnabled ? "Chime: On" : "Chime: Off"}</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-colors text-xs font-medium",
              isSyncing && "opacity-75"
            )}
          >
            <RotateCcw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>Live 8s Pulse</span>
          </button>

          {/* Station Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-container)] text-[var(--on-primary-container)] text-xs font-medium">
            <Coffee size={12} />
            <span>Station: La Marzocco Linea PB</span>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="admin-card flex flex-wrap items-center justify-between gap-4 p-4">
          <p className="text-sm text-red-400">
            Unable to load orders. {error instanceof Error ? error.message : "Please try again."}
          </p>
          <button type="button" onClick={retry} className="rounded-lg border border-[var(--outline-variant)] px-4 py-2 text-sm">
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs & Stage Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <FilterTabs activeTab={activeFilter} onChange={setActiveFilter} tabs={filterTabs} />
        <div className="flex items-center gap-4 text-xs text-[var(--on-surface-variant)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--cold-badge)]" />
            Steam Boiler: 93.4°C
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            Grinder: 1.8 Fine
          </span>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KanbanColumn
          title="New Inbound"
          status="new"
          count={newOrders.length}
          orders={newOrders}
          onAction={handleAction}
          isProcessing={processingOrder}
          icon={<AlertCircle size={16} />}
          color="text-[var(--primary)]"
          bgColor="bg-[var(--primary)]/20"
        />

        <KanbanColumn
          title="At Extraction Bar"
          status="preparing"
          count={preparingOrders.length}
          orders={preparingOrders}
          onAction={handleAction}
          isProcessing={processingOrder}
          icon={<Coffee size={16} />}
          color="text-[var(--cold-badge)]"
          bgColor="bg-[var(--cold-badge)]/20"
        />

        <KanbanColumn
          title="Ready at Pickup"
          status="ready"
          count={readyOrders.length}
          orders={readyOrders}
          onAction={handleAction}
          isProcessing={processingOrder}
          icon={<CheckCircle size={16} />}
          color="text-[var(--success)]"
          bgColor="bg-[var(--success)]/20"
        />
      </div>

      {/* Archived / Completed */}
      {activeFilter === "all" || activeFilter === "completed" ? (
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[var(--on-surface-variant)]">done_all</span>
              <h2 className="font-semibold uppercase tracking-wider text-[var(--on-surface)]">Archived / Served</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">
              {completedOrders.length} Recent
            </span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {completedOrders.length === 0 ? (
              <p className="text-[var(--on-surface-variant)]/50 text-center py-8">No completed orders</p>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between p-3 bg-[var(--surface-container-lowest)]/50 rounded-lg border border-[var(--outline-variant)]/50 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-[var(--on-surface-variant)]">done_all</span>
                    <div>
                      <p className="font-medium text-[var(--on-surface)]">{order.orderId}</p>
                      <p className="text-xs text-[var(--on-surface-variant)]">
                        {order.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--on-surface-variant)]">
                    <span className="font-medium text-[var(--on-surface)]">{formatINR(order.total)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">
                      Served
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <Toaster position="top-right" />
    </div>
  );
}
