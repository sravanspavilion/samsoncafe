"use client";

import useSWR from "swr";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { parseAdminResponse } from "@/lib/admin-response";
import type {
  Order,
  InventoryItem,
  MenuItem,
  Payment,
  Stats,
  OrderStatus,
  HourlyData,
  CategoryVolume,
} from "@/lib/sheets";

// Re-export types for consumers
export type {
  Order,
  InventoryItem,
  MenuItem,
  Payment,
  Stats,
  OrderStatus,
  HourlyData,
  CategoryVolume,
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: "no-store" });
  const data: unknown = await response.json();
  const parsed = parseAdminResponse(data, new URL(url, "http://localhost").searchParams.get("action"));
  if (!response.ok) throw new Error("Failed to fetch admin data");
  return parsed as T;
};

// Generic SWR hook with retry
function useApi<T>(key: string | null, fallback?: T) {
  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher<T>, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    fallbackData: fallback,
    shouldRetryOnError: false,
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to load admin data", { id: key ?? "admin-data" });
    },
  });

  const retry = useCallback(() => {
    mutate();
  }, [mutate]);

  return { data, error, isLoading, mutate, retry };
}

// Orders
export function useOrders() {
  return useApi<Order[]>("/api/admin/sheets?action=getOrders", []);
}

export function useUpdateOrderStatus() {
  const { mutate } = useOrders();

  return useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateOrderStatus", payload: { orderId, status } }),
      });
      toast.success(`Order ${orderId} marked as ${status}`);
      mutate();
    } catch {
      toast.error("Failed to update order status");
      throw new Error("Update failed");
    }
  }, [mutate]);
}

// Inventory
export function useInventory() {
  return useApi<InventoryItem[]>("/api/admin/sheets?action=getInventory", []);
}

export function useAddInventoryItem() {
  const { mutate } = useInventory();

  return useCallback(async (item: Omit<InventoryItem, "status">) => {
    try {
      await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addItem", payload: item }),
      });
      toast.success("Item added");
      mutate();
    } catch {
      toast.error("Failed to add item");
      throw new Error("Add failed");
    }
  }, [mutate]);
}

export function useUpdateInventoryItem() {
  const { mutate } = useInventory();

  return useCallback(async (sku: string, updates: Partial<InventoryItem>) => {
    try {
      await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateItem", payload: { sku, ...updates } }),
      });
      toast.success("Item updated");
      mutate();
    } catch {
      toast.error("Failed to update item");
      throw new Error("Update failed");
    }
  }, [mutate]);
}

export function useDeleteInventoryItem() {
  const { mutate } = useInventory();

  return useCallback(async (sku: string) => {
    try {
      await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteItem", payload: { sku } }),
      });
      toast.success("Item deleted");
      mutate();
    } catch {
      toast.error("Failed to delete item");
      throw new Error("Delete failed");
    }
  }, [mutate]);
}

export function useUpdateStock() {
  const { mutate } = useInventory();

  return useCallback(async (sku: string, delta: number) => {
    try {
      await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStock", payload: { sku, delta } }),
      });
      mutate();
    } catch {
      toast.error("Failed to update stock");
      throw new Error("Update failed");
    }
  }, [mutate]);
}

// Menu
export function useMenu() {
  return useApi<MenuItem[]>("/api/admin/sheets?action=getMenu", []);
}

export function useUpdateMenuItem() {
  const { mutate } = useMenu();

  return useCallback(async (id: string, updates: Partial<MenuItem>) => {
    try {
      await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateMenuItem", payload: { id, ...updates } }),
      });
      toast.success("Menu item updated");
      mutate();
    } catch {
      toast.error("Failed to update menu item");
      throw new Error("Update failed");
    }
  }, [mutate]);
}

// Payments
export function usePayments() {
  return useApi<Payment[]>("/api/admin/sheets?action=getPayments", []);
}

// Stats
export function useStats() {
  return useApi<Stats>("/api/admin/sheets?action=getStats");
}

// Polling hook for live orders
export function useLiveOrders(pollInterval = 8000) {
  const { data, error, isLoading, mutate, retry } = useApi<Order[]>("/api/admin/sheets?action=getOrders", []);

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newOrderChime, setNewOrderChime] = useState(false);

  useEffect(() => {
    if (!data) return;

    // Check for new orders (simple comparison with previous data)
    // In production, you'd compare order IDs or timestamps
    const timer = setTimeout(() => {
      setLastUpdate(new Date());
    }, 0);
    return () => clearTimeout(timer);
  }, [data]);

  // Auto-poll
  useEffect(() => {
    const interval = setInterval(() => {
      mutate();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [mutate, pollInterval]);

  // Sound chime for new orders
  const playChime = useCallback(() => {
    if (newOrderChime) {
      const audio = new Audio("/chime.mp3"); // Add a chime sound file to public/
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore autoplay restrictions
    }
  }, [newOrderChime]);

  useEffect(() => {
    if (data && data.length > 0 && lastUpdate) {
      // Simple heuristic: if data changed, play chime
      playChime();
    }
  }, [data, lastUpdate, playChime]);

  return { orders: data || [], error, isLoading, mutate, retry, lastUpdate, setNewOrderChime };
}
