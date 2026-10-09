/**
 * Samsons Cafe - Google Apps Script Web App
 * 
 * Sheet Tabs & Required Column Headers:
 * 
 * 1. MENU (or "Menu")
 *    ITEM ID | ITEM NAME | PRICE | IMAGE | STOCK | STATUS | CATEGORY | DESCRIPTION
 *    Example: COF-001 | Espresso | 60 | https://... | 34 | available | HOT | Signature House Roast
 * 
 * 2. ORDERS (or "Orders")
 *    ORDER ID | TIME | ITEM ID | NAME | QUANTITY | LINE TOTAL | STATUS | CUSTOMER NAME | CONTACT | PICKUP NOTE | TOKEN NUMBER
 *    Example: SC-20261004-001 | 04 Oct, 10:24 AM | COF-002 | Cappuccino | 2 | 180 | new | John Doe | 9876543210 | Table 04 | 15
 * 
 * 3. INVENTORY (or "Inventory")
 *    SKU | PRODUCT | CATEGORY | PRICE | STOCK | THRESHOLD | STATUS | IMAGE URL | DESCRIPTION | IS ACTIVE
 *    Example: COF-001 | Espresso | Hot Coffee | 60 | 34 | 6 | available | https://... | Signature House Roast | true
 * 
 * 4. PAYMENTS (or "Payments")
 *    TRANSACTION ID | ORDER ID | DATE | METHOD | AMOUNT | STATUS | DETAILS
 *    Example: TXN-20261004-001 | SC-20261004-001 | 2026-10-04 10:24:00 | UPI | 180 | completed | GPay
 * 
 * 5. SETTINGS (optional, for config)
 *    KEY | VALUE
 *    Example: lowStockThreshold | 6
 */

// ============ doGet ============
function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'menu':
    case 'getMenu':
      return getMenu();
    case 'orders':
    case 'getOrders':
    case 'orderHistory':
      return getOrders();
    case 'inventory':
    case 'getInventory':
      return getInventory();
    case 'payments':
    case 'getPayments':
      return getPayments();
    case 'stats':
    case 'getStats':
      return getStats();
    default:
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Invalid action. Supported: menu, orders, inventory, payments, stats' }))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============ doPost ============
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'createOrder':
        return createOrder(data);
      case 'updateOrderStatus':
        return updateOrderStatus(data.orderId, data.status);
      case 'addItem':
        return addInventoryItem(data);
      case 'updateItem':
        return updateInventoryItem(data.sku, data);
      case 'deleteItem':
        return deleteInventoryItem(data.sku);
      case 'updateStock':
        return updateStock(data.sku, data.delta);
      case 'updateMenuItem':
        return updateMenuItem(data.id, data);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============ Helper Functions ============
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet "${name}" not found`);
  }
  return sheet;
}

function getHeaders(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.length > 0 ? data[0] : [];
}

function getRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) item[headers[j]] = row[j];
    }
    rows.push(item);
  }
  return rows;
}

function findRowIndex(sheet, keyColumn, keyValue) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return -1;
  const headers = data[0];
  const keyColIndex = headers.indexOf(keyColumn);
  if (keyColIndex === -1) return -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyColIndex] == keyValue) return i;
  }
  return -1;
}

function formatTime() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM, hh:mm a');
}

function formatDateTime() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ MENU ============
function getMenu() {
  try {
    const sheet = getSheet('Menu');
    const rows = getRows(sheet);
    return jsonResponse(rows);
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ============ ORDERS ============
function getOrders() {
  try {
    const sheet = getSheet('Orders');
    const rows = getRows(sheet);
    
    // Group by orderId
    const ordersMap = {};
    rows.forEach(row => {
      const orderId = row['ORDER ID'] || row['orderId'] || row['Order ID'] || '';
      if (!orderId) return;
      
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          orderId: orderId,
          time: row['TIME'] || row['time'] || row['Time'] || '',
          date: row['DATE'] || row['date'] || '',
          items: [],
          total: 0,
          status: row['STATUS'] || row['status'] || 'new',
          customerName: row['CUSTOMER NAME'] || row['customerName'] || '',
          contact: row['CONTACT'] || row['contact'] || '',
          pickupNote: row['PICKUP NOTE'] || row['pickupNote'] || '',
          tokenNumber: Number(row['TOKEN NUMBER'] || row['tokenNumber'] || 0)
        };
      }
      
      const quantity = Number(row['QUANTITY'] || row['quantity'] || row['QTY'] || 0);
      const lineTotal = Number(row['LINE TOTAL'] || row['lineTotal'] || row['Line Total'] || 0);
      const price = quantity > 0 ? lineTotal / quantity : Number(row['PRICE'] || row['price'] || 0);
      
      ordersMap[orderId].items.push({
        itemId: row['ITEM ID'] || row['itemId'] || row['Item ID'] || '',
        name: row['NAME'] || row['name'] || row['Item Name'] || '',
        quantity: quantity,
        price: price || 0
      });
      ordersMap[orderId].total += (quantity * (price || 0));
    });
    
    const orders = Object.values(ordersMap).sort((a, b) => 
      new Date(b.time) - new Date(a.time)
    );
    
    return jsonResponse(orders);
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function createOrder(data) {
  try {
    const sheet = getSheet('Orders');
    const timeFormatted = formatTime();
    const dateFormatted = formatDateTime();
    const items = Array.isArray(data.items) ? data.items : [];
    
    const headers = getHeaders(sheet);
    const tokenNumber = getNextTokenNumber(sheet);
    
    const rowsToAdd = items.map(item => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const lineTotal = quantity * price;
      return [
        data.orderId || '',
        timeFormatted,
        dateFormatted,
        item.id || '',
        item.name || '',
        quantity,
        lineTotal,
        data.status || 'new',
        data.customerName || '',
        data.contact || '',
        data.pickupNote || '',
        tokenNumber
      ];
    });
    
    if (rowsToAdd.length > 0) {
      // Ensure headers exist
      if (headers.length === 0) {
        sheet.getRange(1, 1, 1, 11).setValues([[
          'ORDER ID', 'TIME', 'DATE', 'ITEM ID', 'NAME', 'QUANTITY', 'LINE TOTAL', 
          'STATUS', 'CUSTOMER NAME', 'CONTACT', 'PICKUP NOTE', 'TOKEN NUMBER'
        ]]);
      }
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    }
    
    return jsonResponse({ success: true, orderId: data.orderId, tokenNumber });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function getNextTokenNumber(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 1;
  const headers = data[0];
  const tokenCol = headers.indexOf('TOKEN NUMBER');
  if (tokenCol === -1) return 1;
  let maxToken = 0;
  for (let i = 1; i < data.length; i++) {
    const token = Number(data[i][tokenCol]) || 0;
    if (token > maxToken) maxToken = token;
  }
  return maxToken + 1;
}

function updateOrderStatus(orderId, status) {
  try {
    const sheet = getSheet('Orders');
    const rowIndex = findRowIndex(sheet, 'ORDER ID', orderId);
    if (rowIndex === -1) {
      return jsonResponse({ error: 'Order not found' });
    }
    
    const headers = getHeaders(sheet);
    const statusCol = headers.indexOf('STATUS');
    if (statusCol === -1) {
      return jsonResponse({ error: 'STATUS column not found' });
    }
    
    sheet.getRange(rowIndex + 1, statusCol + 1).setValue(status);
    return jsonResponse({ success: true, orderId, status });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ============ INVENTORY ============
function getInventory() {
  try {
    const sheet = getSheet('Inventory');
    const rows = getRows(sheet);
    
    // Compute status based on stock and threshold
    const items = rows.map(row => {
      const stock = Number(row['STOCK'] || row['stock'] || 0);
      const threshold = Number(row['THRESHOLD'] || row['threshold'] || 6);
      let status = row['STATUS'] || row['status'] || 'available';
      
      // Auto-compute status
      if (stock <= 0) status = 'out-of-stock';
      else if (stock <= threshold) status = 'low-stock';
      else status = 'available';
      
      return {
        sku: row['SKU'] || row['sku'] || '',
        product: row['PRODUCT'] || row['product'] || '',
        category: row['CATEGORY'] || row['category'] || '',
        price: Number(row['PRICE'] || row['price'] || 0),
        stock: stock,
        threshold: threshold,
        status: status,
        imageUrl: row['IMAGE URL'] || row['imageUrl'] || '',
        description: row['DESCRIPTION'] || row['description'] || '',
        isActive: row['IS ACTIVE'] === true || row['isActive'] === 'true' || row['IS ACTIVE'] === 'TRUE'
      };
    });
    
    return jsonResponse(items);
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function addInventoryItem(data) {
  try {
    const sheet = getSheet('Inventory');
    const headers = getHeaders(sheet);
    
    // Ensure headers exist
    if (headers.length === 0) {
      sheet.getRange(1, 1, 1, 9).setValues([[
        'SKU', 'PRODUCT', 'CATEGORY', 'PRICE', 'STOCK', 'THRESHOLD', 'STATUS', 'IMAGE URL', 'DESCRIPTION', 'IS ACTIVE'
      ]]);
    }
    
    const stock = Number(data.stock) || 0;
    const threshold = Number(data.threshold) || 6;
    let status = 'available';
    if (stock <= 0) status = 'out-of-stock';
    else if (stock <= threshold) status = 'low-stock';
    
    const row = [
      data.sku || '',
      data.product || '',
      data.category || '',
      Number(data.price) || 0,
      stock,
      threshold,
      status,
      data.imageUrl || '',
      data.description || '',
      data.isActive !== false
    ];
    
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    return jsonResponse({ success: true, sku: data.sku });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function updateInventoryItem(sku, updates) {
  try {
    const sheet = getSheet('Inventory');
    const rowIndex = findRowIndex(sheet, 'SKU', sku);
    if (rowIndex === -1) {
      return jsonResponse({ error: 'Item not found' });
    }
    
    const headers = getHeaders(sheet);
    const rowData = sheet.getRange(rowIndex + 1, 1, 1, headers.length).getValues()[0];
    
    // Update fields
    const fieldMap = {
      'product': 'PRODUCT',
      'category': 'CATEGORY',
      'price': 'PRICE',
      'stock': 'STOCK',
      'threshold': 'THRESHOLD',
      'imageUrl': 'IMAGE URL',
      'description': 'DESCRIPTION',
      'isActive': 'IS ACTIVE'
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      const colName = fieldMap[key];
      if (colName) {
        const colIndex = headers.indexOf(colName);
        if (colIndex !== -1) {
          rowData[colIndex] = value;
        }
      }
    });
    
    // Auto-compute status if stock or threshold changed
    if (updates.stock !== undefined || updates.threshold !== undefined) {
      const stock = Number(rowData[headers.indexOf('STOCK')]) || 0;
      const threshold = Number(rowData[headers.indexOf('THRESHOLD')]) || 6;
      let status = 'available';
      if (stock <= 0) status = 'out-of-stock';
      else if (stock <= threshold) status = 'low-stock';
      
      const statusCol = headers.indexOf('STATUS');
      if (statusCol !== -1) {
        rowData[statusCol] = status;
      }
    }
    
    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([rowData]);
    return jsonResponse({ success: true, sku });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function deleteInventoryItem(sku) {
  try {
    const sheet = getSheet('Inventory');
    const rowIndex = findRowIndex(sheet, 'SKU', sku);
    if (rowIndex === -1) {
      return jsonResponse({ error: 'Item not found' });
    }
    
    sheet.deleteRow(rowIndex + 1);
    return jsonResponse({ success: true, sku });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function updateStock(sku, delta) {
  try {
    const sheet = getSheet('Inventory');
    const rowIndex = findRowIndex(sheet, 'SKU', sku);
    if (rowIndex === -1) {
      return jsonResponse({ error: 'Item not found' });
    }
    
    const headers = getHeaders(sheet);
    const stockCol = headers.indexOf('STOCK');
    const thresholdCol = headers.indexOf('THRESHOLD');
    const statusCol = headers.indexOf('STATUS');
    
    if (stockCol === -1) {
      return jsonResponse({ error: 'STOCK column not found' });
    }
    
    const currentStock = Number(sheet.getRange(rowIndex + 1, stockCol + 1).getValue()) || 0;
    const newStock = Math.max(0, currentStock + delta);
    
    sheet.getRange(rowIndex + 1, stockCol + 1).setValue(newStock);
    
    // Update status
    if (thresholdCol !== -1 && statusCol !== -1) {
      const threshold = Number(sheet.getRange(rowIndex + 1, thresholdCol + 1).getValue()) || 6;
      let status = 'available';
      if (newStock <= 0) status = 'out-of-stock';
      else if (newStock <= threshold) status = 'low-stock';
      sheet.getRange(rowIndex + 1, statusCol + 1).setValue(status);
    }
    
    return jsonResponse({ success: true, sku, newStock });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ============ PAYMENTS ============
function getPayments() {
  try {
    const sheet = getSheet('Payments');
    const rows = getRows(sheet);
    return jsonResponse(rows);
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ============ STATS ============
function getStats() {
  try {
    // Get orders for today
    const ordersSheet = getSheet('Orders');
    const ordersRows = getRows(ordersSheet);
    const today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    
    const todayOrders = ordersRows.filter(row => {
      const dateStr = row['DATE'] || row['date'] || '';
      return dateStr.startsWith(today) || dateStr.includes(Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM'));
    });
    
    const totalOrders = todayOrders.length;
    const grossSales = todayOrders.reduce((sum, o) => sum + Number(o['LINE TOTAL'] || o['lineTotal'] || 0), 0);
    const itemsSold = todayOrders.reduce((sum, o) => sum + Number(o['QUANTITY'] || o['quantity'] || 0), 0);
    
    // Get low stock count
    const inventorySheet = getSheet('Inventory');
    const inventoryRows = getRows(inventorySheet);
    const lowStockAlerts = inventoryRows.filter(row => {
      const stock = Number(row['STOCK'] || row['stock'] || 0);
      const threshold = Number(row['THRESHOLD'] || row['threshold'] || 6);
      return stock > 0 && stock <= threshold;
    }).length;
    
    // Hourly velocity
    const hourlyData = [];
    for (let h = 7; h <= 15; h++) {
      const hourStr = h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`;
      const count = todayOrders.filter(o => {
        const time = o['TIME'] || o['time'] || '';
        const hour = parseInt(time.split(':')[0]);
        return hour === h;
      }).length;
      hourlyData.push({
        hour: hourStr,
        orders: count,
        isPeak: count === Math.max(...hourlyData.map(d => d.orders), count)
      });
    }
    
    // Category volume
    const categoryMap = {};
    todayOrders.forEach(o => {
      // Would need to join with menu to get category - simplified
      const cat = 'Hot Coffee'; // placeholder
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    
    const categoryVolume = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
      color: category === 'Hot Coffee' ? '#E9C349' : category === 'Cold Brews' ? '#EAC16D' : '#DACCC2'
    }));
    
    return jsonResponse({
      todayOrders: totalOrders,
      grossSales: grossSales,
      itemsSold: itemsSold,
      lowStockAlerts: lowStockAlerts,
      hourlyVelocity: hourlyData,
      categoryVolume: categoryVolume,
      recentOrders: todayOrders.slice(0, 10)
    });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ============ MENU ITEM UPDATES ============
function updateMenuItem(id, updates) {
  try {
    const sheet = getSheet('Menu');
    const rowIndex = findRowIndex(sheet, 'ITEM ID', id);
    if (rowIndex === -1) {
      return jsonResponse({ error: 'Menu item not found' });
    }
    
    const headers = getHeaders(sheet);
    const rowData = sheet.getRange(rowIndex + 1, 1, 1, headers.length).getValues()[0];
    
    const fieldMap = {
      'name': 'ITEM NAME',
      'price': 'PRICE',
      'imageUrl': 'IMAGE',
      'stock': 'STOCK',
      'status': 'STATUS',
      'category': 'CATEGORY',
      'description': 'DESCRIPTION',
      'isAvailable': 'STATUS'
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      const colName = fieldMap[key];
      if (colName) {
        const colIndex = headers.indexOf(colName);
        if (colIndex !== -1) {
          if (key === 'isAvailable') {
            rowData[colIndex] = value ? 'available' : 'unavailable';
          } else {
            rowData[colIndex] = value;
          }
        }
      }
    });
    
    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([rowData]);
    return jsonResponse({ success: true, id });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}