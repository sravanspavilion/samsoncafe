export type MenuItem = {
  id: string; name: string; price: number; image: string; stock: number;
  status: "available" | "unavailable"; category: string; description?: string; featured?: boolean;
};

export type CartLine = MenuItem & { quantity: number };
export type OrderPayload = { customerName: string; contact: string; pickupNote?: string; items: Array<{ id: string; name: string; quantity: number; price: number }> };
export type OrderRecord = { orderId: string; time: string; itemId: string; name: string; quantity: number; price: number };

export type OrderHistoryItemLine = {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
};

export type OrderHistoryItem = {
  orderId: string;
  time: string;
  date?: string;
  items: OrderHistoryItemLine[];
  total: number;
  status?: "preparing" | "completed" | "pending" | "cancelled";
  customerName?: string;
  contact?: string;
  pickupNote?: string;
};
