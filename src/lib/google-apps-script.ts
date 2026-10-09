import type { MenuItem, OrderPayload, OrderRecord } from "@/types";

// Retained for the existing management inventory view, never used by the public menu API.
export const fallbackMenu: MenuItem[] = [
  { id: "COF-001", name: "Espresso", price: 60, image: "https://res.cloudinary.com/imz1gwe6/image/upload/f_auto,q_auto/espresso", stock: 34, status: "available", category: "HOT", description: "" },
  { id: "COF-002", name: "Cappuccino", price: 90, image: "", stock: 33, status: "available", category: "HOT", description: "" },
  { id: "COF-003", name: "Café Latte", price: 110, image: "", stock: 35, status: "available", category: "HOT", description: "" },
  { id: "COF-004", name: "Flat White", price: 120, image: "", stock: 35, status: "available", category: "HOT", description: "" },
  { id: "COF-005", name: "Café Mocha", price: 120, image: "", stock: 35, status: "available", category: "HOT", description: "" },
  { id: "COF-006", name: "Caramel Macchiato", price: 130, image: "", stock: 35, status: "available", category: "HOT", description: "" },
  { id: "COF-007", name: "Iced Shaken Espresso", price: 120, image: "", stock: 35, status: "available", category: "COLD", description: "" },
  { id: "COF-008", name: "Cold Brew", price: 110, image: "", stock: 34, status: "available", category: "COLD", description: "" },
  { id: "SMO-001", name: "Banana Smoothies", price: 150, image: "", stock: 34, status: "available", category: "COLD", description: "" },
  { id: "SMO-002", name: "Kiwi Smoothies", price: 180, image: "", stock: 35, status: "available", category: "COLD", description: "" }
];

function toMenuItem(row: Record<string, unknown>, index: number): MenuItem {
  const stock = Number(row.STOCK ?? row.stock ?? 0);
  const rawId = row["ITEM ID"] ?? row.itemId ?? row.id ?? row.ID;
  const id = rawId ? String(rawId).trim() : `ITEM-${index + 1}`;
  const name = String(row["ITEM NAME"] ?? row.itemName ?? row.name ?? row.NAME ?? "").trim() || `Menu Item ${index + 1}`;
  const price = Number(row.PRICE ?? row.price ?? 0);
  let image: unknown = row.IMAGE ?? row.image ?? row.Image ?? row.IMAGE_URL ?? row.imageUrl;
  let imageStr = "";
  if (typeof image === "string") {
    imageStr = image.trim();
  } else if (image != null) {
    imageStr = String(image).trim();
  }
  if (!imageStr || imageStr === "null" || imageStr === "undefined") {
    imageStr = "/images/menu/espresso.png";
  }
  const category = String(row.CATEGORY ?? row.category ?? "Other").trim() || "Other";
  const description = String(row.DESCRIPTION ?? row.description ?? "").trim();
  const statusRaw = String(row.STATUS ?? row.status ?? "available").toLowerCase();
  const status = statusRaw === "available" && stock > 0 ? "available" : "unavailable";
  return { id, name, price, image: imageStr, stock, status, category, description };
}
export async function fetchMenuFromAppsScript(): Promise<MenuItem[]> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) throw new Error("Menu data source is not configured");
  // TODO: Adjust the `action=menu` query key if the supplied Apps Script uses another menu action.
  const menuUrl = new URL(url);
  menuUrl.searchParams.set("action", "menu");
  const response = await fetch(menuUrl, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Apps Script menu request failed");
  const json = await response.json();
  const rows = Array.isArray(json) ? json : json.items ?? json.data;
  if (!Array.isArray(rows)) throw new Error("Unexpected Apps Script menu response");
  const result = rows
    .filter((row) => row && typeof row === "object")
    .map((row, index) => toMenuItem(row as Record<string, unknown>, index))
    .filter((item) => {
      if (!item.id || item.id === "undefined" || item.id === "null") return false;
      if (item.name.toLowerCase().startsWith("menu item")) return false;
      return true;
    });
  return result;
}
export async function submitOrderToAppsScript(order: OrderPayload, orderId: string): Promise<void> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return;
  // TODO: Adjust `action` and the payload shape to exactly match the existing Apps Script once shared.
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "createOrder", orderId, ...order }) });
  if (!response.ok) throw new Error("Apps Script order request failed");
}

function groupOrderRecords(records: OrderRecord[]) {
  const map = new Map<string, import("@/types").OrderHistoryItem>();
  for (const rec of records) {
    if (!map.has(rec.orderId)) {
      map.set(rec.orderId, {
        orderId: rec.orderId,
        time: rec.time,
        items: [],
        total: 0,
        status: "preparing" as const,
      });
    }
    const entry = map.get(rec.orderId)!;
    entry.items.push({ itemId: rec.itemId, name: rec.name, quantity: rec.quantity, price: rec.price / rec.quantity || rec.price });
    entry.total += rec.price;
  }
  return Array.from(map.values());
}

export async function fetchOrdersFromAppsScript(): Promise<import("@/types").OrderHistoryItem[]> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return groupOrderRecords(fallbackOrders);
  try {
    const response = await fetch(`${url}?action=orders`, { cache: "no-store" });
    if (!response.ok) throw new Error("Apps Script orders request failed");
    const json = await response.json();
    const rows = Array.isArray(json) ? json : json.items ?? json.data;
    if (!Array.isArray(rows)) throw new Error("Unexpected Apps Script orders response");
    return rows as import("@/types").OrderHistoryItem[];
  } catch {
    return groupOrderRecords(fallbackOrders);
  }
}

export const fallbackOrders: OrderRecord[] = [
  { orderId: "SC-20261004-001", time: "04 Oct, 10:24 AM", itemId: "COF-002", name: "Cappuccino", quantity: 2, price: 180 },
  { orderId: "SC-20261004-002", time: "04 Oct, 09:48 AM", itemId: "COF-004", name: "Cold Brew", quantity: 1, price: 130 },
  { orderId: "SC-20261004-003", time: "03 Oct, 06:12 PM", itemId: "PAS-002", name: "Dark Chocolate Tart", quantity: 1, price: 180 }
];
export const fallbackOrdersGrouped = groupOrderRecords(fallbackOrders);
