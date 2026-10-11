/*******************************************************
 * RESTAURANT MANAGEMENT SYSTEM
 * Google Apps Script Backend
 *
 * Sheet Tabs (lowercase, case-insensitive):
 *
 * menu:
 *   A = ITEM ID      B = ITEM NAME   C = PRICE     D = IMAGE
 *   E = STOCK        F = STATUS      G = CATEGORY
 *   -- appended columns (auto-created) --
 *   H = DESCRIPTION  I = THRESHOLD   J = IS ACTIVE
 *
 * order:
 *   A = ORDER ID     B = TIME        C = ITEM ID   D = NAME
 *   E = QTY          F = PRICE (unit price)
 *   -- appended columns (auto-created) --
 *   G = LINE TOTAL   H = STATUS      I = CUSTOMER NAME
 *   J = CONTACT      K = PICKUP NOTE L = DATE      M = TOKEN NUMBER
 *
 * Columns are resolved by header name (with fixed-index fallbacks), and any
 * missing columns listed above are appended automatically the first time an
 * order is written. You can also run "ensureSheetLayout" once from the editor
 * to add them up front.
 *
 * GET  actions: menu, orders, orderItems, inventory, payments, stats, health
 * POST actions: createOrder, placeOrder, updateOrderStatus, updateMenuItem,
 *               addItem, updateItem, deleteItem, updateStock
 *******************************************************/

// =====================================================
// COLUMN ALIASES  (first alias wins; resolved case-insensitively)
// =====================================================

const MENU_ALIASES = {
  ITEM_ID: ["ITEM ID", "itemId", "ID", "SKU"],
  ITEM_NAME: ["ITEM NAME", "itemName", "NAME", "PRODUCT"],
  PRICE: ["PRICE", "price"],
  IMAGE: ["IMAGE", "image", "IMAGE URL", "imageUrl"],
  STOCK: ["STOCK", "stock"],
  STATUS: ["STATUS", "status"],
  CATEGORY: ["CATEGORY", "category"],
  DESCRIPTION: ["DESCRIPTION", "description"],
  THRESHOLD: ["THRESHOLD", "threshold"],
  IS_ACTIVE: ["IS ACTIVE", "isActive", "ACTIVE"],
};

const ORDER_ALIASES = {
  ORDER_ID: ["ORDER ID", "orderId"],
  TIME: ["TIME", "time"],
  DATE: ["DATE", "date"],
  ITEM_ID: ["ITEM ID", "itemId"],
  NAME: ["NAME", "name", "ITEM NAME"],
  QTY: ["QTY", "QUANTITY", "quantity", "qty"],
  PRICE: ["PRICE", "price"],
  LINE_TOTAL: ["LINE TOTAL", "lineTotal"],
  STATUS: ["STATUS", "status"],
  CUSTOMER_NAME: ["CUSTOMER NAME", "customerName"],
  CONTACT: ["CONTACT", "contact"],
  PICKUP_NOTE: ["PICKUP NOTE", "pickupNote"],
  TOKEN: ["TOKEN NUMBER", "tokenNumber"],
};

// Columns guaranteed to exist on the "order" sheet (auto-appended if missing).
const ORDER_REQUIRED_COLUMNS = [
  ["ORDER ID", ORDER_ALIASES.ORDER_ID],
  ["TIME", ORDER_ALIASES.TIME],
  ["DATE", ORDER_ALIASES.DATE],
  ["ITEM ID", ORDER_ALIASES.ITEM_ID],
  ["NAME", ORDER_ALIASES.NAME],
  ["QTY", ORDER_ALIASES.QTY],
  ["PRICE", ORDER_ALIASES.PRICE],
  ["LINE TOTAL", ORDER_ALIASES.LINE_TOTAL],
  ["STATUS", ORDER_ALIASES.STATUS],
  ["CUSTOMER NAME", ORDER_ALIASES.CUSTOMER_NAME],
  ["CONTACT", ORDER_ALIASES.CONTACT],
  ["PICKUP NOTE", ORDER_ALIASES.PICKUP_NOTE],
  ["TOKEN NUMBER", ORDER_ALIASES.TOKEN],
];

const MENU_REQUIRED_COLUMNS = [
  ["ITEM ID", MENU_ALIASES.ITEM_ID],
  ["ITEM NAME", MENU_ALIASES.ITEM_NAME],
  ["PRICE", MENU_ALIASES.PRICE],
  ["IMAGE", MENU_ALIASES.IMAGE],
  ["STOCK", MENU_ALIASES.STOCK],
  ["STATUS", MENU_ALIASES.STATUS],
  ["CATEGORY", MENU_ALIASES.CATEGORY],
  ["DESCRIPTION", MENU_ALIASES.DESCRIPTION],
  ["THRESHOLD", MENU_ALIASES.THRESHOLD],
  ["IS ACTIVE", MENU_ALIASES.IS_ACTIVE],
];

const DEFAULT_THRESHOLD = 6;
const HOURLY_START = 7;
const HOURLY_END = 15;
const CATEGORY_COLORS = ["#E9C349", "#EAC16D", "#DACCC2", "#D4AF37", "#F2CA50", "#FFE088"];

// =====================================================
// GET REQUEST
// =====================================================

/**
 * ?action=menu
 * ?action=orders
 * ?action=orderItems&orderId=ORD-XXXX
 * ?action=inventory
 * ?action=payments
 * ?action=stats
 * ?action=health
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : "health";

    switch (action) {
      case "menu":
      case "getMenu":
        return getMenu();

      case "orders":
      case "getOrders":
      case "orderHistory":
        return getOrders();

      case "orderItems":
        return getOrderItems(e.parameter.orderId);

      case "inventory":
      case "getInventory":
        return getInventory();

      case "payments":
      case "getPayments":
        return getPayments();

      case "stats":
      case "getStats":
        return getStats();

      case "health":
        return jsonResponse({
          success: true,
          message: "Restaurant API is running",
          time: new Date().toISOString(),
        });

      default:
        return jsonResponse({
          success: false,
          error: "Invalid action",
          availableActions: ["menu", "orders", "orderItems", "inventory", "payments", "stats", "health"],
        });
    }
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// POST REQUEST
// =====================================================

/**
 * {
 *   "action": "createOrder",
 *   "orderId": "SC-20261011-ABC123",
 *   "customerName": "...", "contact": "...", "pickupNote": "...",
 *   "items": [ { "id": "COF-002", "quantity": 1 } ]
 * }
 *
 * Also supports legacy placeOrder: { "action": "placeOrder", "items": [...] }
 */
function doPost(e) {
  try {
    if (!e || !e.postData) {
      throw new Error("No POST data received.");
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action;

    switch (action) {
      case "createOrder":
        return createOrder(request);

      case "placeOrder":
        // Legacy alias: accept items with either `itemId` or `id`.
        return createOrder(request);

      case "updateOrderStatus":
        return updateOrderStatus(request.orderId, request.status);

      case "updateMenuItem":
        return updateMenuItem(request.id, request);

      case "addItem":
        return addMenuItem(request);

      case "updateItem":
        return updateMenuItem(request.sku, request);

      case "deleteItem":
        return deleteMenuItem(request.sku);

      case "updateStock":
        return updateStock(request.sku, request.delta);

      default:
        return jsonResponse({ success: false, error: "Invalid POST action" });
    }
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// GET MENU ITEMS
// =====================================================

function getMenu() {
  try {
    const sheet = getMenuSheet_();
    const map = indexMap_(sheet, MENU_ALIASES);
    const data = sheet.getDataRange().getValues();
    const items = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = String(cell_(row, map, "ITEM_ID") || "").trim();
      if (!id) continue;

      const stock = Number(cell_(row, map, "STOCK")) || 0;

      items.push({
        itemId: id,
        itemName: String(cell_(row, map, "ITEM_NAME") || ""),
        price: Number(cell_(row, map, "PRICE")) || 0,
        image: String(cell_(row, map, "IMAGE") || ""),
        stock: stock,
        status: availability_(cell_(row, map, "STATUS"), stock),
        category: String(cell_(row, map, "CATEGORY") || ""),
        description: String(cell_(row, map, "DESCRIPTION") || ""),
      });
    }

    return jsonResponse({ success: true, count: items.length, items: items });
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// GET ORDERS  (grouped per order)
// =====================================================

function getOrders() {
  try {
    const sheet = getOrderSheet_();
    const map = indexMap_(sheet, ORDER_ALIASES);
    const data = sheet.getDataRange().getValues();
    const byId = {};
    const orders = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const orderId = String(cell_(row, map, "ORDER_ID") || "").trim();
      if (!orderId) continue;

      let entry = byId[orderId];
      if (!entry) {
        entry = {
          orderId: orderId,
          time: "",
          date: "",
          status: "",
          total: 0,
          customerName: "",
          contact: "",
          pickupNote: "",
          tokenNumber: 0,
          items: [],
        };
        byId[orderId] = entry;
        orders.push(entry);
      }

      entry.time = entry.time || String(cell_(row, map, "TIME") || "");
      entry.date = entry.date || String(cell_(row, map, "DATE") || "");

      const status = String(cell_(row, map, "STATUS") || "").trim();
      if (status) entry.status = status;

      entry.customerName = entry.customerName || String(cell_(row, map, "CUSTOMER_NAME") || "");
      entry.contact = entry.contact || String(cell_(row, map, "CONTACT") || "");
      entry.pickupNote = entry.pickupNote || String(cell_(row, map, "PICKUP_NOTE") || "");

      const token = Number(cell_(row, map, "TOKEN")) || 0;
      if (token) entry.tokenNumber = token;

      const quantity = Number(cell_(row, map, "QTY")) || 0;
      const unitPrice = Number(cell_(row, map, "PRICE")) || 0;
      let lineTotal = Number(cell_(row, map, "LINE_TOTAL"));
      if (!isFinite(lineTotal) || lineTotal === 0) lineTotal = unitPrice * quantity;

      entry.items.push({
        itemId: String(cell_(row, map, "ITEM_ID") || ""),
        name: String(cell_(row, map, "NAME") || ""),
        quantity: quantity,
        price: unitPrice || (quantity > 0 ? lineTotal / quantity : 0),
      });
      entry.total += lineTotal;
    }

    orders.forEach(function (order) {
      if (!order.status) order.status = "new";
    });

    orders.sort(function (a, b) {
      const aKey = a.date || a.time || "";
      const bKey = b.date || b.time || "";
      return String(bKey).localeCompare(String(aKey));
    });

    return jsonResponse({ success: true, count: orders.length, orders: orders });
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// GET ITEMS FOR ONE ORDER
// =====================================================

function getOrderItems(orderId) {
  try {
    if (!orderId) throw new Error("orderId is required.");

    const grouped = JSON.parse(getOrders().getContent());
    const order = (grouped.orders || []).find(function (entry) {
      return String(entry.orderId) === String(orderId);
    });

    return jsonResponse({ success: true, orderId: orderId, items: order ? order.items : [] });
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// INVENTORY  (derived from the menu sheet)
// =====================================================

function getInventory() {
  try {
    const sheet = getMenuSheet_();
    const map = indexMap_(sheet, MENU_ALIASES);
    const data = sheet.getDataRange().getValues();
    const items = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sku = String(cell_(row, map, "ITEM_ID") || "").trim();
      if (!sku) continue;

      const stock = Number(cell_(row, map, "STOCK")) || 0;
      const threshold = Number(cell_(row, map, "THRESHOLD")) || DEFAULT_THRESHOLD;

      items.push({
        sku: sku,
        product: String(cell_(row, map, "ITEM_NAME") || ""),
        category: String(cell_(row, map, "CATEGORY") || ""),
        price: Number(cell_(row, map, "PRICE")) || 0,
        stock: stock,
        threshold: threshold,
        status: stockStatus_(stock, threshold),
        imageUrl: String(cell_(row, map, "IMAGE") || ""),
        description: String(cell_(row, map, "DESCRIPTION") || ""),
        isActive: isActive_(cell_(row, map, "IS_ACTIVE")),
      });
    }

    // Bare array — matches the legacy backend contract (parseAdminResponse passes it through).
    return jsonResponse(items);
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// PAYMENTS  (derived from orders; one row per order)
// =====================================================

function getPayments() {
  try {
    const grouped = JSON.parse(getOrders().getContent());
    // Bare array — matches the legacy backend contract.
    const payments = (grouped.orders || []).map(function (order) {
      return {
        transactionId: "TXN-" + order.orderId,
        orderId: order.orderId,
        date: order.date || order.time || "",
        method: "Cash",
        amount: order.total,
        status: order.status === "cancelled" || order.status === "rejected" ? "failed" : "completed",
        details: order.customerName || "",
      };
    });

    return jsonResponse(payments);
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// STATS  (computed from menu + orders)
// =====================================================

function getStats() {
  try {
    const ordersJson = JSON.parse(getOrders().getContent());
    const orders = ordersJson.orders || [];

    const today = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
    const todayLabel = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM");

    const todayOrders = orders.filter(function (order) {
      const date = String(order.date || "");
      if (date.indexOf(today) === 0) return true;
      return String(order.time || "").indexOf(todayLabel) !== -1;
    });

    const grossSales = todayOrders.reduce(function (sum, order) {
      return sum + (Number(order.total) || 0);
    }, 0);

    const itemsSold = todayOrders.reduce(function (sum, order) {
      return sum + order.items.reduce(function (inner, item) {
        return inner + (Number(item.quantity) || 0);
      }, 0);
    }, 0);

    // Category lookup from the menu sheet.
    const menuSheet = getMenuSheet_();
    const menuMap = indexMap_(menuSheet, MENU_ALIASES);
    const menuData = menuSheet.getDataRange().getValues();
    const categoryById = {};
    let lowStockAlerts = 0;

    for (let i = 1; i < menuData.length; i++) {
      const row = menuData[i];
      const id = String(cell_(row, menuMap, "ITEM_ID") || "").trim();
      if (!id) continue;
      const stock = Number(cell_(row, menuMap, "STOCK")) || 0;
      const threshold = Number(cell_(row, menuMap, "THRESHOLD")) || DEFAULT_THRESHOLD;
      if (stock > 0 && stock <= threshold) lowStockAlerts++;
      categoryById[id] = String(cell_(row, menuMap, "CATEGORY") || "").trim() || "Other";
    }

    // Hourly velocity (7AM - 3PM).
    const hourlyVelocity = [];
    for (let hour = HOURLY_START; hour <= HOURLY_END; hour++) {
      const count = todayOrders.filter(function (order) {
        return order.items.some(function () {
          return parseHour_(order.time) === hour;
        });
      }).length;
      hourlyVelocity.push({ hour: hourLabel_(hour), orders: count, isPeak: false });
    }
    const peak = hourlyVelocity.reduce(function (max, entry) {
      return Math.max(max, entry.orders);
    }, 0);
    hourlyVelocity.forEach(function (entry) {
      entry.isPeak = peak > 0 && entry.orders === peak;
    });

    // Category volume (quantity of items sold today).
    const categoryCounts = {};
    todayOrders.forEach(function (order) {
      order.items.forEach(function (item) {
        const category = categoryById[item.itemId] || "Other";
        categoryCounts[category] = (categoryCounts[category] || 0) + (Number(item.quantity) || 0);
      });
    });
    const totalItems = Object.keys(categoryCounts).reduce(function (sum, key) {
      return sum + categoryCounts[key];
    }, 0);
    const categoryVolume = Object.keys(categoryCounts).map(function (category, index) {
      return {
        category: category,
        count: categoryCounts[category],
        percentage: totalItems > 0 ? Math.round((categoryCounts[category] / totalItems) * 100) : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
    });

    return jsonResponse({
      todayOrders: todayOrders.length,
      grossSales: grossSales,
      itemsSold: itemsSold,
      lowStockAlerts: lowStockAlerts,
      hourlyVelocity: hourlyVelocity,
      categoryVolume: categoryVolume,
      recentOrders: orders.slice(0, 10),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// CREATE ORDER
// =====================================================

/**
 * Accepts either the app payload
 *   { orderId, customerName, contact, pickupNote, items:[{id, quantity, ...}] }
 * or the legacy shape
 *   { items:[{itemId, quantity}] }
 * Writes one row per line, decrements stock, and echoes the orderId back.
 */
function createOrder(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const changes = [];
  let orderRange = null;

  try {
    const menuSheet = getMenuSheet_();
    let orderSheet = getOrderSheet_();

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) throw new Error("Order cannot be empty.");

    const orderId = String(payload.orderId || "").trim() || generateOrderId();

    // Idempotency: ignore a repeat submission of the same order.
    if (findRowIndexAlias_(orderSheet, ORDER_ALIASES.ORDER_ID, orderId) !== -1) {
      return jsonResponse({ success: true, orderId: orderId });
    }

    // Combine duplicate lines.
    const requested = {};
    items.forEach(function (item) {
      if (!item) return;
      const id = String(item.itemId || item.id || "").trim();
      const quantity = Number(item.quantity);
      if (!id) throw new Error("An order item is missing itemId.");
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Invalid quantity for " + id);
      requested[id] = (requested[id] || 0) + quantity;
    });

    // Validate EVERY item before writing anything.
    const menuMap = indexMap_(menuSheet, MENU_ALIASES);
    const menuData = menuSheet.getDataRange().getValues();
    const menuById = {};
    for (let i = 1; i < menuData.length; i++) {
      const row = menuData[i];
      const id = String(cell_(row, menuMap, "ITEM_ID") || "").trim();
      if (id) menuById[id] = { rowNumber: i + 1, row: row };
    }

    const validated = [];
    Object.keys(requested).forEach(function (id) {
      const quantity = requested[id];
      const found = menuById[id];
      if (!found) throw new Error("Item not found: " + id);

      const stock = Number(cell_(found.row, menuMap, "STOCK")) || 0;
      const name = String(cell_(found.row, menuMap, "ITEM_NAME") || id);
      const price = Number(cell_(found.row, menuMap, "PRICE")) || 0;

      if (stock <= 0) throw new Error(name + " is out of stock.");
      if (stock < quantity) {
        throw new Error(name + " has only " + stock + " item(s) available. Requested: " + quantity);
      }

      validated.push({ id: id, name: name, quantity: quantity, price: price, rowNumber: found.rowNumber, currentStock: stock });
    });

    // Make sure every column we write to exists.
    orderSheet = ensureColumns_(orderSheet, ORDER_REQUIRED_COLUMNS);
    const orderMap = indexMap_(orderSheet, ORDER_ALIASES);
    const headers = orderMap.__headers;

    const orderTime = new Date();
    const timeLabel = formatTime_(orderTime);
    const dateLabel = formatDateTime_(orderTime);
    const tokenNumber = getNextTokenNumber_(orderSheet, orderMap);

    const rows = validated.map(function (item) {
      const row = new Array(headers.length).fill("");
      setCell_(row, orderMap, "ORDER_ID", orderId);
      setCell_(row, orderMap, "TIME", timeLabel);
      setCell_(row, orderMap, "DATE", dateLabel);
      setCell_(row, orderMap, "ITEM_ID", item.id);
      setCell_(row, orderMap, "NAME", item.name);
      setCell_(row, orderMap, "QTY", item.quantity);
      setCell_(row, orderMap, "PRICE", item.price);
      setCell_(row, orderMap, "LINE_TOTAL", item.price * item.quantity);
      setCell_(row, orderMap, "STATUS", "new");
      setCell_(row, orderMap, "CUSTOMER_NAME", payload.customerName || "");
      setCell_(row, orderMap, "CONTACT", payload.contact || "");
      setCell_(row, orderMap, "PICKUP_NOTE", payload.pickupNote || "");
      setCell_(row, orderMap, "TOKEN", tokenNumber);
      return row;
    });

    // Queue stock updates so they can be rolled back on failure.
    validated.forEach(function (item) {
      const stockCol = menuMap.STOCK;
      const statusCol = menuMap.STATUS;
      const newStock = item.currentStock - item.quantity;

      const stockRange = menuSheet.getRange(item.rowNumber, stockCol + 1);
      changes.push({ range: stockRange, before: stockRange.getValue() });
      stockRange.setValue(newStock);

      if (statusCol >= 0) {
        const statusRange = menuSheet.getRange(item.rowNumber, statusCol + 1);
        changes.push({ range: statusRange, before: statusRange.getValue() });
        statusRange.setValue(newStock <= 0 ? "out of stock" : "available");
      }
    });

    orderRange = orderSheet.getRange(orderSheet.getLastRow() + 1, 1, rows.length, headers.length);
    orderRange.setValues(rows);
    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      message: "Order placed successfully.",
      orderId: orderId,
      tokenNumber: tokenNumber,
      time: orderTime.toISOString(),
      items: validated.map(function (item) {
        return {
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          price: item.price,
          remainingStock: item.currentStock - item.quantity,
        };
      }),
    });
  } catch (error) {
    // Sheets has no transactions; undo the queued stock writes.
    changes.forEach(function (change) {
      change.range.setValue(change.before);
    });
    if (orderRange) orderRange.clearContent();
    SpreadsheetApp.flush();
    return errorResponse(error);
  } finally {
    lock.releaseLock();
  }
}

// =====================================================
// UPDATE ORDER STATUS  (all rows belonging to an order)
// =====================================================

function updateOrderStatus(orderId, status) {
  try {
    if (!orderId) throw new Error("orderId is required.");
    if (!status) throw new Error("status is required.");

    const sheet = ensureColumns_(getOrderSheet_(), [["STATUS", ORDER_ALIASES.STATUS]]);
    const map = indexMap_(sheet, ORDER_ALIASES);

    const data = sheet.getDataRange().getValues();
    let updated = 0;
    for (let i = 1; i < data.length; i++) {
      if (String(cell_(data[i], map, "ORDER_ID") || "") === String(orderId)) {
        sheet.getRange(i + 1, map.STATUS + 1).setValue(status);
        updated++;
      }
    }

    if (!updated) throw new Error("Order not found: " + orderId);
    return jsonResponse({ success: true, orderId: orderId, status: status, rows: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// MENU ITEM WRITES
// =====================================================

function updateMenuItem(id, updates) {
  try {
    if (!id) throw new Error("Menu item id is required.");

    const sheet = getMenuSheet_();
    const map = indexMap_(sheet, MENU_ALIASES);
    const rowIndex = findRowIndexAlias_(sheet, MENU_ALIASES.ITEM_ID, id);
    if (rowIndex === -1) throw new Error("Menu item not found: " + id);

    const explicitStatus = updates.status !== undefined || updates.isAvailable !== undefined;

    if (updates.name !== undefined && map.ITEM_NAME >= 0) sheet.getRange(rowIndex + 1, map.ITEM_NAME + 1).setValue(updates.name);
    if (updates.product !== undefined && map.ITEM_NAME >= 0) sheet.getRange(rowIndex + 1, map.ITEM_NAME + 1).setValue(updates.product);
    if (updates.price !== undefined && map.PRICE >= 0) sheet.getRange(rowIndex + 1, map.PRICE + 1).setValue(Number(updates.price) || 0);
    if (updates.imageUrl !== undefined && map.IMAGE >= 0) sheet.getRange(rowIndex + 1, map.IMAGE + 1).setValue(updates.imageUrl);
    if (updates.image !== undefined && map.IMAGE >= 0) sheet.getRange(rowIndex + 1, map.IMAGE + 1).setValue(updates.image);
    if (updates.category !== undefined && map.CATEGORY >= 0) sheet.getRange(rowIndex + 1, map.CATEGORY + 1).setValue(updates.category);
    if (updates.description !== undefined && map.DESCRIPTION >= 0) sheet.getRange(rowIndex + 1, map.DESCRIPTION + 1).setValue(updates.description);
    if (updates.threshold !== undefined && map.THRESHOLD >= 0) sheet.getRange(rowIndex + 1, map.THRESHOLD + 1).setValue(Number(updates.threshold) || DEFAULT_THRESHOLD);
    if (updates.isActive !== undefined && map.IS_ACTIVE >= 0) sheet.getRange(rowIndex + 1, map.IS_ACTIVE + 1).setValue(updates.isActive !== false);

    const stockProvided = updates.stock !== undefined;
    const stock = stockProvided
      ? Math.max(0, Number(updates.stock) || 0)
      : Number(sheet.getRange(rowIndex + 1, map.STOCK + 1).getValue()) || 0;
    if (stockProvided && map.STOCK >= 0) sheet.getRange(rowIndex + 1, map.STOCK + 1).setValue(stock);

    if (map.STATUS >= 0) {
      if (explicitStatus) {
        const available = updates.isAvailable !== undefined
          ? updates.isAvailable !== false
          : String(updates.status).toLowerCase() === "available";
        sheet.getRange(rowIndex + 1, map.STATUS + 1).setValue(available && stock > 0 ? "available" : "out of stock");
      } else if (stockProvided) {
        sheet.getRange(rowIndex + 1, map.STATUS + 1).setValue(stock <= 0 ? "out of stock" : "available");
      }
    }

    return jsonResponse({ success: true, id: id });
  } catch (error) {
    return errorResponse(error);
  }
}

function addMenuItem(data) {
  try {
    const sheet = ensureColumns_(getMenuSheet_(), MENU_REQUIRED_COLUMNS);
    const map = indexMap_(sheet, MENU_ALIASES);
    const headers = map.__headers;

    const id = String(data.id || data.sku || data.itemId || "").trim();
    if (!id) throw new Error("Item id is required.");
    if (findRowIndexAlias_(sheet, MENU_ALIASES.ITEM_ID, id) !== -1) throw new Error("An item with that id already exists.");

    const stock = Math.max(0, Number(data.stock) || 0);
    const row = new Array(headers.length).fill("");
    setCell_(row, map, "ITEM_ID", id);
    setCell_(row, map, "ITEM_NAME", data.name || data.product || "");
    setCell_(row, map, "PRICE", Number(data.price) || 0);
    setCell_(row, map, "IMAGE", data.imageUrl || data.image || "");
    setCell_(row, map, "STOCK", stock);
    setCell_(row, map, "STATUS", stock <= 0 ? "out of stock" : "available");
    setCell_(row, map, "CATEGORY", data.category || "Other");
    setCell_(row, map, "DESCRIPTION", data.description || "");
    setCell_(row, map, "THRESHOLD", Number(data.threshold) || DEFAULT_THRESHOLD);
    setCell_(row, map, "IS_ACTIVE", data.isActive !== false);

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
    return jsonResponse({ success: true, id: id });
  } catch (error) {
    return errorResponse(error);
  }
}

function deleteMenuItem(id) {
  try {
    const sheet = getMenuSheet_();
    const rowIndex = findRowIndexAlias_(sheet, MENU_ALIASES.ITEM_ID, id);
    if (rowIndex === -1) throw new Error("Item not found: " + id);
    sheet.deleteRow(rowIndex + 1);
    return jsonResponse({ success: true, id: id });
  } catch (error) {
    return errorResponse(error);
  }
}

function updateStock(id, delta) {
  try {
    const sheet = getMenuSheet_();
    const map = indexMap_(sheet, MENU_ALIASES);
    const rowIndex = findRowIndexAlias_(sheet, MENU_ALIASES.ITEM_ID, id);
    if (rowIndex === -1) throw new Error("Item not found: " + id);

    if (map.STOCK < 0) throw new Error('Sheet "menu" is missing a STOCK column.');
    const current = Number(sheet.getRange(rowIndex + 1, map.STOCK + 1).getValue()) || 0;
    const newStock = Math.max(0, current + (Number(delta) || 0));
    sheet.getRange(rowIndex + 1, map.STOCK + 1).setValue(newStock);

    if (map.STATUS >= 0) {
      sheet.getRange(rowIndex + 1, map.STATUS + 1).setValue(newStock <= 0 ? "out of stock" : "available");
    }

    return jsonResponse({ success: true, id: id, newStock: newStock });
  } catch (error) {
    return errorResponse(error);
  }
}

// =====================================================
// ONE-TIME LAYOUT HELPER
// =====================================================

/**
 * Run once from the Apps Script editor to add the appended columns to both
 * sheets if they are missing. Safe to run repeatedly.
 */
function ensureSheetLayout() {
  const menuSheet = ensureColumns_(getMenuSheet_(), MENU_REQUIRED_COLUMNS);
  const orderSheet = ensureColumns_(getOrderSheet_(), ORDER_REQUIRED_COLUMNS);
  return jsonResponse({
    success: true,
    menuColumns: getHeaders_(menuSheet),
    orderColumns: getHeaders_(orderSheet),
  });
}

// =====================================================
// HELPERS
// =====================================================

function getMenuSheet_() {
  return getSheetAny_(["menu", "Menu", "MENU"]);
}

function getOrderSheet_() {
  return getSheetAny_(["order", "Order", "ORDERS", "Orders"]);
}

function getSheetAny_(names) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (let i = 0; i < names.length; i++) {
    const sheet = ss.getSheetByName(names[i]);
    if (sheet) return sheet;
  }
  throw new Error('Sheet "' + names[0] + '" was not found.');
}

function getHeaders_(sheet) {
  const values = sheet.getDataRange().getValues();
  return values.length > 0 ? values[0] : [];
}

/** Map of canonical key -> column index (0-based), plus __headers. */
function indexMap_(sheet, aliases) {
  const headers = getHeaders_(sheet);
  const map = {};
  Object.keys(aliases).forEach(function (key) {
    map[key] = resolveColumn_(headers, aliases[key]);
  });
  map.__headers = headers;
  return map;
}

function resolveColumn_(headers, names) {
  for (let i = 0; i < names.length; i++) {
    const target = String(names[i]).trim().toLowerCase();
    for (let c = 0; c < headers.length; c++) {
      if (String(headers[c]).trim().toLowerCase() === target) return c;
    }
  }
  return -1;
}

function cell_(row, map, key) {
  const index = map[key];
  return index >= 0 && index < row.length ? row[index] : undefined;
}

function setCell_(row, map, key, value) {
  const index = map[key];
  if (index >= 0) row[index] = value;
}

function findRowIndexAlias_(sheet, aliases, value) {
  const map = indexMap_(sheet, { KEY: aliases });
  if (map.KEY < 0) return -1;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(cell_(data[i], map, "KEY") || "").trim() === String(value).trim()) return i;
  }
  return -1;
}

/**
 * Ensures each required column exists, appending missing headers to the end.
 * groups: array of [canonicalHeader, aliasArray].
 */
function ensureColumns_(sheet, groups) {
  let headers = getHeaders_(sheet);

  if (headers.length === 0) {
    const names = groups.map(function (group) {
      return group[0];
    });
    sheet.getRange(1, 1, 1, names.length).setValues([names]);
    return sheet;
  }

  const missing = groups
    .filter(function (group) {
      return resolveColumn_(headers, group[1]) === -1;
    })
    .map(function (group) {
      return group[0];
    });

  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
  }

  return sheet;
}

function availability_(raw, stock) {
  if (stock <= 0) return "out of stock";
  const status = String(raw == null ? "" : raw).trim().toLowerCase();
  if (status === "" || status === "available") return "available";
  return status;
}

function stockStatus_(stock, threshold) {
  if (stock <= 0) return "out-of-stock";
  if (stock <= threshold) return "low-stock";
  return "available";
}

function isActive_(value) {
  if (value === true) return true;
  const text = String(value == null ? "" : value).trim().toLowerCase();
  return text === "true" || text === "yes" || text === "1";
}

function parseHour_(time) {
  const match = String(time || "").match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])/);
  if (!match) return -1;
  let hour = Number(match[1]) % 12;
  if (/[Pp]/.test(match[3])) hour += 12;
  return hour;
}

function hourLabel_(hour) {
  if (hour < 12) return hour + "AM";
  if (hour === 12) return "12PM";
  return hour - 12 + "PM";
}

function formatTime_(date) {
  return Utilities.formatDate(date, "Asia/Kolkata", "dd MMM, hh:mm a");
}

function formatDateTime_(date) {
  return Utilities.formatDate(date, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
}

function getNextTokenNumber_(sheet, map) {
  if (map.TOKEN < 0) return 1;
  const data = sheet.getDataRange().getValues();
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const token = Number(cell_(data[i], map, "TOKEN")) || 0;
    if (token > max) max = token;
  }
  return max + 1;
}

function generateOrderId() {
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return "ORD-" + timestamp + "-" + random;
}

// =====================================================
// RESPONSES
// =====================================================

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(error) {
  return jsonResponse({
    success: false,
    error: error && error.message ? error.message : String(error),
  });
}
