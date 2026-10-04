function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'menu') {
    return getMenu();
  }
  
  if (action === 'orders' || action === 'getOrders' || action === 'orderHistory') {
    return getOrders();
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getMenu() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Menu');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Menu sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) {
          item[headers[j]] = row[j];
        }
      }
      rows.push(item);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Orders');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const ordersMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) {
          item[headers[j]] = row[j];
        }
      }
      
      const orderId = item['orderId'] || item['ORDERID'] || item['Order ID'] || item['OrderId'] || '';
      if (!orderId) continue;
      
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          orderId: orderId,
          time: item['time'] || item['Time'] || item['TIME'] || item['timestamp'] || '',
          items: []
        };
      }
      
      const quantity = Number(item['quantity'] || item['Quantity'] || item['QTY'] || 0);
      const priceFromLineTotal = Number(item['lineTotal'] || item['Line Total'] || 0);
      const price = quantity > 0 ? priceFromLineTotal / quantity : Number(item['price'] || item['Price'] || 0);
      
      ordersMap[orderId].items.push({
        itemId: item['itemId'] || item['ITEMID'] || item['Item ID'] || item['id'] || '',
        name: item['name'] || item['NAME'] || item['Item Name'] || '',
        quantity: quantity,
        price: price || 0
      });
    }
    
    const orders = Object.keys(ordersMap).map(function(key) {
      const order = ordersMap[key];
      let total = 0;
      for (let k = 0; k < order.items.length; k++) {
        total += (order.items[k].quantity * order.items[k].price);
      }
      return {
        orderId: order.orderId,
        time: order.time,
        items: order.items,
        total: total
      };
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(orders))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'createOrder') {
      return createOrder(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Orders');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const ordersMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) {
          item[headers[j]] = row[j];
        }
      }
      
      const orderId = item['orderId'] || item['ORDERID'] || item['Order ID'] || item['OrderId'] || '';
      if (!orderId) continue;
      
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          orderId: orderId,
          time: item['time'] || item['Time'] || item['TIME'] || item['timestamp'] || '',
          items: []
        };
      }
      
      const quantity = Number(item['quantity'] || item['Quantity'] || item['QTY'] || 0);
      const priceFromLineTotal = Number(item['lineTotal'] || item['Line Total'] || 0);
      const price = quantity > 0 ? priceFromLineTotal / quantity : Number(item['price'] || item['Price'] || 0);
      
      ordersMap[orderId].items.push({
        itemId: item['itemId'] || item['ITEMID'] || item['Item ID'] || item['id'] || '',
        name: item['name'] || item['NAME'] || item['Item Name'] || '',
        quantity: quantity,
        price: price || 0
      });
    }
    
    const orders = Object.keys(ordersMap).map(function(key) {
      const order = ordersMap[key];
      let total = 0;
      for (let k = 0; k < order.items.length; k++) {
        total += (order.items[k].quantity * order.items[k].price);
      }
      return {
        orderId: order.orderId,
        time: order.time,
        items: order.items,
        total: total
      };
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(orders))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createOrder(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Orders');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Orders sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const now = new Date();
    const timeFormatted = Utilities.formatDate(now, 'Asia/Kolkata', 'dd MMM, hh:mm a');
    const items = Array.isArray(data.items) ? data.items : [];
    
    const rowsToAdd = items.map(item => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const lineTotal = quantity * price;
      return [
        data.orderId || '',
        timeFormatted,
        item.id || '',
        item.name || '',
        quantity,
        lineTotal
      ];
    });
    
    if (rowsToAdd.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, orderId: data.orderId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Orders');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const ordersMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) {
          item[headers[j]] = row[j];
        }
      }
      
      const orderId = item['orderId'] || item['ORDERID'] || item['Order ID'] || item['OrderId'] || '';
      if (!orderId) continue;
      
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          orderId: orderId,
          time: item['time'] || item['Time'] || item['TIME'] || item['timestamp'] || '',
          items: []
        };
      }
      
      const quantity = Number(item['quantity'] || item['Quantity'] || item['QTY'] || 0);
      const priceFromLineTotal = Number(item['lineTotal'] || item['Line Total'] || 0);
      const price = quantity > 0 ? priceFromLineTotal / quantity : Number(item['price'] || item['Price'] || 0);
      
      ordersMap[orderId].items.push({
        itemId: item['itemId'] || item['ITEMID'] || item['Item ID'] || item['id'] || '',
        name: item['name'] || item['NAME'] || item['Item Name'] || '',
        quantity: quantity,
        price: price || 0
      });
    }
    
    const orders = Object.keys(ordersMap).map(function(key) {
      const order = ordersMap[key];
      let total = 0;
      for (let k = 0; k < order.items.length; k++) {
        total += (order.items[k].quantity * order.items[k].price);
      }
      return {
        orderId: order.orderId,
        time: order.time,
        items: order.items,
        total: total
      };
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(orders))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}