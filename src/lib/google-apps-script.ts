import type { MenuItem, OrderPayload, OrderRecord } from "@/types";

export const fallbackMenu: MenuItem[] = [
  { id: "COF-001", name: "Espresso", price: 60, image: "/images/menu/espresso.png", stock: 35, status: "available", category: "Hot", description: "Double ristretto pull of Arabica Bourbon with molasses and dark cocoa.", featured: true },
  { id: "COF-002", name: "Cappuccino", price: 90, image: "/images/menu/latte.png", stock: 18, status: "available", category: "Hot", description: "Silken milk and a balanced house espresso, finished with delicate art.", featured: true },
  { id: "COF-003", name: "Café Latte", price: 110, image: "/images/menu/latte.png", stock: 12, status: "available", category: "Hot", description: "A velvety, contemplative classic with our slow-roasted espresso.", featured: true },
  { id: "COF-004", name: "Cold Brew", price: 130, image: "/images/menu/cold-brew.png", stock: 7, status: "available", category: "Cold", description: "Twelve-hour steep, served crystalline and naturally sweet.", featured: true },
  { id: "COF-005", name: "Vanilla Iced Latte", price: 150, image: "/images/menu/cold-brew.png", stock: 4, status: "available", category: "Cold", description: "House vanilla, espresso and chilled milk over clear ice." },
  { id: "SMO-001", name: "Midnight Berry", price: 160, image: "/images/menu/cold-brew.png", stock: 9, status: "available", category: "Smoothies", description: "Dark berries, yogurt and a touch of wildflower honey." },
  { id: "PAS-001", name: "Almond Croissant", price: 120, image: "/images/menu/latte.png", stock: 0, status: "unavailable", category: "Pastries", description: "Buttery laminated pastry with roasted almond frangipane." },
  { id: "PAS-002", name: "Dark Chocolate Tart", price: 180, image: "/images/menu/espresso.png", stock: 3, status: "available", category: "Pastries", description: "A rich valrhona ganache tart with a crisp cacao shell." }
];

function toMenuItem(row: Record<string, unknown>, index: number): MenuItem {
  const stock = Number(row.STOCK ?? row.stock ?? 0);
  const rawId = row["ITEM ID"] ?? row.id ?? row.ID;
  const id = rawId ? String(rawId).trim() : `ITEM-${index + 1}`;
  const name = String(row["ITEM NAME"] ?? row.name ?? row.NAME ?? "").trim() || `Menu Item ${index + 1}`;
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
  const description = String(row.DESCRIPTION ?? row.description ?? "A carefully prepared Samsons Cafe selection.").trim();
  const statusRaw = String(row.STATUS ?? row.status ?? "available").toLowerCase();
  const status = statusRaw === "available" && stock > 0 ? "available" : "unavailable";
  return { id, name, price, image: imageStr, stock, status, category, description };
}
export async function fetchMenuFromAppsScript(): Promise<MenuItem[]> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return fallbackMenu;
  // TODO: Adjust the `action=menu` query key if the supplied Apps Script uses another menu action.
  const response = await fetch(`${url}?action=menu`, { cache: "no-store" });
  if (!response.ok) throw new Error("Apps Script menu request failed");
  const json = await response.json();
  const rows = Array.isArray(json) ? json : json.items ?? json.data;
  if (!Array.isArray(rows)) throw new Error("Unexpected Apps Script menu response");
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row, index) => toMenuItem(row as Record<string, unknown>, index))
    .filter((item) => Boolean(item.id) && item.id !== "undefined" && item.id !== "null");
}
export async function submitOrderToAppsScript(order: OrderPayload, orderId: string): Promise<void> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return;
  // TODO: Adjust `action` and the payload shape to exactly match the existing Apps Script once shared.
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "createOrder", orderId, ...order }) });
  if (!response.ok) throw new Error("Apps Script order request failed");
}
export const fallbackOrders: OrderRecord[] = [
  { orderId: "SC-20261004-001", time: "04 Oct, 10:24 AM", itemId: "COF-002", name: "Cappuccino", quantity: 2, price: 180 },
  { orderId: "SC-20261004-002", time: "04 Oct, 09:48 AM", itemId: "COF-004", name: "Cold Brew", quantity: 1, price: 130 },
  { orderId: "SC-20261004-003", time: "03 Oct, 06:12 PM", itemId: "PAS-002", name: "Dark Chocolate Tart", quantity: 1, price: 180 }
];
