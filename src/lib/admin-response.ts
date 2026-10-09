export function parseAdminResponse(data: unknown, action: string | null): unknown {
  const envelope = data !== null && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : undefined;

  if (envelope?.error || envelope?.success === false) {
    const message = typeof envelope.error === "string" ? envelope.error : "Failed to load admin data";
    throw new Error(message === "Invalid action"
      ? `The deployed Apps Script does not support ${action ?? "this action"}. Update its deployment to enable this admin feature.`
      : message);
  }

  if (action === "getMenu") {
    const items = Array.isArray(data) ? data : envelope?.items ?? envelope?.menu ?? envelope?.data;
    if (!Array.isArray(items)) throw new Error("Unexpected menu response from Google Sheets.");
    return items.map((item: unknown) => {
      if (item === null || typeof item !== "object") throw new Error("Invalid menu item from Google Sheets.");
      const row = item as Record<string, unknown>;
      const id = row.id ?? row.itemId ?? row["ITEM ID"];
      const name = row.name ?? row.itemName ?? row["ITEM NAME"];
      const price = Number(row.price ?? row.PRICE);
      const stock = Number(row.stock ?? row.STOCK ?? 0);
      if (typeof id !== "string" || typeof name !== "string" || !Number.isFinite(price) || !Number.isFinite(stock)) {
        throw new Error("Invalid menu item fields from Google Sheets.");
      }
      const status = String(row.status ?? row.STATUS ?? "available").toLowerCase();
      return {
        id,
        name,
        price,
        stock,
        category: String(row.category ?? row.CATEGORY ?? "Other"),
        description: String(row.description ?? row.DESCRIPTION ?? ""),
        imageUrl: String(row.imageUrl ?? row.image ?? row.IMAGE ?? ""),
        isAvailable: typeof row.isAvailable === "boolean" ? row.isAvailable : status === "available" && stock > 0,
      };
    });
  }

  if (action === "getOrders") {
    const orders = Array.isArray(data) ? data : envelope?.orders ?? envelope?.items ?? envelope?.data;
    if (Array.isArray(orders) && orders.length > 0 && orders.every((row) =>
      row !== null && typeof row === "object" && typeof row.orderId === "string" &&
      typeof row.name === "string" && !Array.isArray(row.items) &&
      Number.isFinite(Number(row.quantity)) && Number(row.quantity) > 0 && Number.isFinite(Number(row.price))
    )) {
      const grouped = new Map<string, { orderId: string; time: string; status: string; total: number; items: { itemId: string; name: string; quantity: number; price: number }[] }>();
      for (const row of orders) {
        const order: NonNullable<ReturnType<typeof grouped.get>> = grouped.get(row.orderId) ?? {
          orderId: row.orderId,
          time: String(row.time ?? ""),
          status: typeof row.status === "string" ? row.status : "preparing",
          total: 0,
          items: [],
        };
        const quantity = Number(row.quantity);
        // The legacy sheet response stores the line total in `price`.
        const lineTotal = Number(row.price);
        order.items.push({ itemId: String(row.itemId ?? ""), name: row.name, quantity, price: lineTotal / quantity });
        order.total += lineTotal;
        grouped.set(row.orderId, order);
      }
      return Array.from(grouped.values());
    }
    if (!Array.isArray(orders) || !orders.every((order) =>
      order !== null && typeof order === "object" && typeof order.orderId === "string" &&
      typeof order.status === "string" && Array.isArray(order.items) &&
      order.items.every((item: unknown) => item !== null && typeof item === "object")
    )) {
      throw new Error("Unexpected orders response. Please check the Google Sheets integration.");
    }
    return orders;
  }

  return data;
}
