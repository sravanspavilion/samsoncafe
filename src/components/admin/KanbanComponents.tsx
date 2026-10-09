"use client";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { Clock, Truck, MapPin, X, Play, CheckCircle, Send, AlertCircle, Coffee } from "lucide-react";
import { StatusBadge } from "@/components/admin/AdminComponents";
import type { Order, OrderStatus } from "@/lib/sheets";

// Re-export types
export type { Order, OrderStatus };

interface OrderCardProps {
  order: Order;
  currentStage: OrderStatus;
  onAction: (orderId: string, action: string) => void;
  isProcessing?: boolean;
}

const stageConfig = {
  new: {
    title: "New Inbound",
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]/10",
    iconColor: "text-[var(--primary)]",
    actions: [
      { label: "Reject", variant: "ghost", icon: X, action: "reject", color: "text-[var(--error)] hover:text-[var(--error)]" },
      { label: "Accept & Brew", variant: "primary", icon: Play, action: "accept", color: "" },
    ],
  },
  preparing: {
    title: "At Extraction Bar",
    color: "text-[var(--cold-badge)]",
    bg: "bg-[var(--cold-badge)]/10",
    iconColor: "text-[var(--cold-badge)]",
    actions: [
      { label: "Start Preparing", variant: "secondary", icon: Play, action: "start", color: "" },
      { label: "Mark Ready", variant: "primary", icon: CheckCircle, action: "ready", color: "" },
    ],
  },
  ready: {
    title: "Ready at Pickup",
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]/10",
    iconColor: "text-[var(--success)]",
    actions: [
      { label: "Page Guest", variant: "ghost", icon: AlertCircle, action: "page", color: "text-[var(--primary)] hover:text-[var(--primary)]" },
      { label: "Handed Over", variant: "primary", icon: Send, action: "complete", color: "" },
    ],
  },
};

export function OrderCard({ order, currentStage, onAction, isProcessing }: OrderCardProps) {
  const config = stageConfig[currentStage as keyof typeof stageConfig] || stageConfig.new;
  const elapsedMinutes = order.elapsedMinutes || 0;

  const formatElapsed = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <article className={cn("rounded-xl overflow-hidden shadow-md transition-all hover:bg-[var(--surface-container)]", config.bg)}>
      {/* Card Header */}
      <div className="p-4 bg-[var(--surface-container)] flex items-start justify-between border-b border-[var(--outline-variant)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--on-surface)] tracking-wide">{order.orderId}</span>
            {order.tokenNumber && (
              <span className="px-2 py-0.5 rounded bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold text-xs">
                Token #{order.tokenNumber}
              </span>
            )}
          </div>
          <span className="mt-1 text-xs text-[var(--on-surface-variant)]">
            {order.time} • {formatElapsed(elapsedMinutes)} elapsed
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={currentStage} variant={currentStage as any} size="sm" />
          {order.pickupNote && (
            <span className="text-[10px] text-[var(--on-surface-variant)] flex items-center gap-1">
              {order.pickupNote.startsWith("Table") ? <MapPin size={10} /> : <Truck size={10} />}
              {order.pickupNote}
            </span>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 space-y-3">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center flex-shrink-0">
                <Coffee size={18} className="text-[var(--primary)]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[var(--on-surface)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--on-surface-variant)]">Qty: {item.quantity}</p>
              </div>
            </div>
            <span className="font-headline-sm text-[var(--primary)] flex-shrink-0">
              {formatINR(item.price * item.quantity)}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="pt-2 border-t border-[var(--outline-variant)] flex items-center justify-between">
          <span className="font-medium text-[var(--on-surface-variant)]">Total</span>
          <span className="serif text-xl font-semibold text-[var(--on-surface)]">{formatINR(order.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 p-4 bg-[var(--surface-container-low)] border-t border-[var(--outline-variant)]">
        {config.actions.map((action) => (
          <button
            key={action.action}
            onClick={() => !isProcessing && onAction(order.orderId, action.action)}
            disabled={isProcessing}
            className={cn(
              "col-span-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              action.variant === "primary"
                ? "bg-[var(--primary)] text-[var(--on-primary)] hover:shadow-[0_0_16px_rgba(233,195,73,0.4)]"
                : action.variant === "secondary"
                ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:bg-[var(--primary)]"
                : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--error)]"
            )}
          >
            <action.icon size={16} className={action.color} />
            <span>{isProcessing ? "Updating..." : action.label}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

interface KanbanColumnProps {
  title: string;
  status: OrderStatus;
  count: number;
  orders: Order[];
  onAction: (orderId: string, action: string) => void;
  isProcessing?: string | null;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function KanbanColumn({ title, status, count, orders, onAction, isProcessing, icon, color, bgColor }: KanbanColumnProps) {
  return (
    <section className="flex flex-col gap-4 min-h-[500px]">
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface-container-low)]">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full", bgColor)} />
          <h2 className={cn("font-semibold uppercase tracking-wider", color)}>{title}</h2>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">
          {count}
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
        {orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--on-surface-variant)]/50 py-12">
            <p className="text-sm">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              currentStage={status}
              onAction={onAction}
              isProcessing={isProcessing === order.orderId}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface FilterTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  tabs: { id: string; label: string; count: number }[];
}

export function FilterTabs({ activeTab, onChange, tabs }: FilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            activeTab === tab.id
              ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-md"
              : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)]"
          )}
        >
          {tab.label} <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
        </button>
      ))}
    </div>
  );
}