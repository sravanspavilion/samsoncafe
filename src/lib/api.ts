import type { MenuItem, OrderPayload } from "@/types";

export async function getMenu(): Promise<MenuItem[]> {
  const response = await fetch("/api/menu", { cache: "no-store" });
  if (!response.ok) throw new Error("The menu is unavailable right now.");
  return response.json();
}
export async function placeOrder(order: OrderPayload) {
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "We could not submit your order.");
  return data as { orderId: string };
}
