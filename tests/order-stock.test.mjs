import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync('google-apps-script-samsons-cafe-updated.gs', 'utf8');
function setup(stock = 4) {
  const tables = {
    Menu: [['ITEM ID','ITEM NAME','PRICE','STOCK','STATUS'],['COF-001','Espresso',60,stock,'available']],
    Orders: [['ORDER ID','NAME','ITEM ID','QTY','PRICE','STATUS']]
  };
  function sheet(name) {
    const data = tables[name];
    return { getDataRange: () => ({ getValues: () => data.map(r => [...r]) }), getLastRow: () => data.length,
      getRange(row,col,height=1,width=1) {
        return { getValue: () => data[row-1]?.[col-1] ?? '',
          setValue(value) { data[row-1][col-1]=value; },
          setValues(values) { assert.equal(values.length,height); values.forEach((r,i) => { assert.equal(r.length,width); data[row-1+i] ??= []; r.forEach((v,j) => data[row-1+i][col-1+j]=v); }); },
          clearContent() { data.splice(row-1,height); }
        };
      }
    };
  }
  const context = vm.createContext({ SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => tables[n] ? sheet(n) : null }), flush() {} }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }, Utilities: { formatDate: () => '2026-10-11' }, ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) } });
  vm.runInContext(source, context);
  const order = (items, orderId='test-1') => context.createOrder({ orderId, customerName:'Test', items });
  return { tables, order, inventory: () => context.getInventory() };
}
const espresso = quantity => ({ id:'COF-001', quantity, price:1 });
test('one Espresso deducts one from menu and inventory and uses authoritative price', () => {
  const {tables,order,inventory}=setup(); assert.equal(order([espresso(1)]).success,true);
  assert.equal(tables.Menu[1][3],3); assert.equal(inventory()[0].stock,3);
  assert.deepEqual(tables.Orders[1].slice(0,6),['test-1','Espresso','COF-001',1,60,'new']);
  assert.equal(tables.Orders[1][tables.Orders[0].indexOf('LINE TOTAL')],60);
});
test('duplicate item lines aggregate and exhausted stock becomes unavailable', () => {
  const {tables,order}=setup(3); assert.equal(order([espresso(1),espresso(2)]).success,true);
  assert.equal(tables.Menu[1][3],0); assert.equal(tables.Menu[1][4],'out of stock');
});
test('insufficient or invalid quantities cause no writes', () => {
  for (const qty of [5,0,-1,1.5]) { const {tables,order}=setup(); assert.ok(order([espresso(qty)]).error); assert.equal(tables.Menu[1][3],4); assert.equal(tables.Orders.length,1); }
});
test('same order ID cannot deduct stock twice', () => {
  const {tables,order}=setup(); order([espresso(1)]); order([espresso(1)]);
  assert.equal(tables.Menu[1][3],3); assert.equal(tables.Orders.length,2);
});
test('invalid later item leaves earlier item unchanged', () => {
  const {tables,order}=setup(); assert.ok(order([espresso(1),{id:'missing',quantity:1}]).error);
  assert.equal(tables.Menu[1][3],4); assert.equal(tables.Orders.length,1);
});
