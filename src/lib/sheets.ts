/**
 * Server-side functions for Google Sheets integration via Apps Script proxy
 * All functions call /api/admin/sheets which proxies to the Apps Script URL
 */

const API_BASE = "/api/admin/sheets";

// Types
export interface Order {
  orderId: string;
  time: string;
  date?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customerName?: string;
  contact?: string;
  pickupNote?: string;
  tokenNumber?: number;
  elapsedMinutes?: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "rejected";

export interface InventoryItem {
  sku: string;
  product: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  status: "available" | "low-stock" | "out-of-stock";
  imageUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  stock: number;
}

export interface Payment {
  transactionId: string;
  orderId: string;
  date: string;
  method: "UPI" | "Card" | "Cash" | "Roots Pay";
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  details?: string;
}

export interface Stats {
  todayOrders: number;
  grossSales: number;
  itemsSold: number;
  lowStockAlerts: number;
  hourlyVelocity: HourlyData[];
  categoryVolume: CategoryVolume[];
  recentOrders: Order[];
}

export interface HourlyData {
  hour: string;
  orders: number;
  isPeak: boolean;
}

export interface CategoryVolume {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

// Helper to call the API proxy
async function callApi<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Orders
export async function getOrders(): Promise<Order[]> {
  return callApi<Order[]>("getOrders");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await callApi("updateOrderStatus", { orderId, status });
}

export async function createOrder(order: Omit<Order, "orderId" | "elapsedMinutes">): Promise<{ orderId: string }> {
  return callApi("createOrder", order);
}

// Inventory
export async function getInventory(): Promise<InventoryItem[]> {
  return callApi<InventoryItem[]>("getInventory");
}

export async function addInventoryItem(item: Omit<InventoryItem, "status">): Promise<InventoryItem> {
  return callApi("addItem", item);
}

export async function updateInventoryItem(sku: string, updates: Partial<InventoryItem>): Promise<void> {
  await callApi("updateItem", { sku, ...updates });
}

export async function deleteInventoryItem(sku: string): Promise<void> {
  await callApi("deleteItem", { sku });
}

export async function updateStock(sku: string, delta: number): Promise<void> {
  await callApi("updateStock", { sku, delta });
}

// Menu
export async function getMenu(): Promise<MenuItem[]> {
  return callApi<MenuItem[]>("getMenu");
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
  await callApi("updateMenuItem", { id, ...updates });
}

// Payments
export async function getPayments(): Promise<Payment[]> {
  return callApi<Payment[]>("getPayments");
}

// Stats
export async function getStats(): Promise<Stats> {
  return callApi<Stats>("getStats");
}

// Utility: compute status from stock and threshold
export function computeInventoryStatus(stock: number, threshold: number): InventoryItem["status"] {
  if (stock <= 0) return "out-of-stock";
  if (stock <= threshold) return "low-stock";
  return "available";
}

// Utility: format INR
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}