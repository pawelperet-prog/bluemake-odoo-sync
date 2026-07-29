import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Odoo Config with LocalStorage persistence support
const DEFAULT_CONFIG = {
  url: 'https://odo.domowyasystent.online/jsonrpc',
  db: 'odoo',
  uid: 9,
  apiKey: 'de5aa75b2e7d300edb383050742f785707bcea63',
  locationId: 5,
  categoryId: 4
};

const LOCAL_STORAGE_CONFIG_KEY = 'odoo_config_settings';
const LOCAL_STORAGE_HISTORY_KEY = 'odoo_sync_history';
const LOCAL_STORAGE_PENDING_KEY = 'odoo_pending_syncs';

export function getOdooConfig() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveOdooConfig(newConfig) {
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
}

let requestId = 1;

/**
 * Universal JSON-RPC HTTP Client via CapacitorHttp (Android Native) / fetch (Browser)
 */
async function sendJsonRpc(url, payload) {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: payload
      });

      if (response.status !== 200) {
        throw new Error(`Błąd HTTP ${response.status}`);
      }

      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return data;
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP ${response.status}`);
      }

      return await response.json();
    }
  } catch (err) {
    console.error('sendJsonRpc Error:', err);
    throw err;
  }
}

async function callOdooCommon(method, args = []) {
  const config = getOdooConfig();
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: method,
      args: args
    },
    id: requestId++
  };

  const data = await sendJsonRpc(config.url, payload);
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'Błąd Odoo RPC');
  }

  return data.result;
}

async function callOdooRpc(model, method, args = [], kwargs = {}) {
  const config = getOdooConfig();
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [
        config.db,
        Number(config.uid),
        config.apiKey,
        model,
        method,
        args,
        kwargs
      ]
    },
    id: requestId++
  };

  const data = await sendJsonRpc(config.url, payload);
  if (data.error) {
    const errorMsg = data.error.data?.message || data.error.message || 'Błąd Odoo RPC';
    console.error('Odoo RPC Error:', data.error);
    throw new Error(errorMsg);
  }

  return data.result;
}

export async function checkApiStatus() {
  try {
    const config = getOdooConfig();
    const res = await callOdooCommon('version');
    return {
      connected: true,
      uid: config.uid,
      db: config.db,
      serverVersion: res?.server_version || '19.0',
      error: null
    };
  } catch (err) {
    const config = getOdooConfig();
    return {
      connected: false,
      uid: config.uid,
      db: config.db,
      serverVersion: 'Offline',
      error: err.message
    };
  }
}

/**
 * Fetch all categories from Odoo
 */
export async function getCategories() {
  try {
    const categories = await callOdooRpc('product.category', 'search_read', [[]], {
      fields: ['id', 'name', 'parent_id', 'complete_name']
    });
    return categories || [];
  } catch (e) {
    console.warn('Nie udało się pobrać kategorii z Odoo:', e.message);
    return [
      { id: 4, name: 'Surowiec' },
      { id: 5, name: 'Produkt' }
    ];
  }
}

/**
 * Fetch products from Odoo 19 (Location ID = 5)
 */
export async function getProducts() {
  const config = getOdooConfig();
  try {
    const productDomain = [['active', '=', true]];
    const products = await callOdooRpc('product.product', 'search_read', [productDomain], {
      fields: ['id', 'name', 'default_code', 'uom_id', 'categ_id', 'sale_ok', 'purchase_ok'],
      limit: 500
    });

    let quants = [];
    try {
      quants = await callOdooRpc('stock.quant', 'search_read', [[['location_id', '=', Number(config.locationId)]]], {
        fields: ['id', 'product_id', 'quantity', 'inventory_quantity', 'location_id']
      });
    } catch (e) {
      console.warn('Nie udało się pobrać quants z Odoo:', e.message);
    }

    const quantMap = {};
    if (Array.isArray(quants)) {
      quants.forEach(q => {
        const pId = Array.isArray(q.product_id) ? q.product_id[0] : q.product_id;
        if (pId) quantMap[pId] = q.quantity;
      });
    }

    return products.map(p => {
      const stock = quantMap[p.id] !== undefined ? quantMap[p.id] : 0;
      const uomName = Array.isArray(p.uom_id) ? p.uom_id[1] : 'm';
      const catId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id;
      const catName = Array.isArray(p.categ_id) ? p.categ_id[1] : ('Kategoria ' + p.categ_id);
      
      const isRawMaterial = catId === 4 || (Boolean(p.sale_ok && p.purchase_ok));
      const isFinishedProduct = catId === 5 || (Boolean(p.sale_ok && !p.purchase_ok));

      return {
        id: p.id,
        sku: p.default_code || `SKU-${p.id}`,
        name: p.name || 'Produkt',
        quantity: typeof stock === 'number' ? stock : 0,
        uom: uomName.toLowerCase().includes('unit') ? 'szt' : (uomName.toLowerCase().includes('m') ? 'm' : uomName),
        location: `Strefa ${config.locationId}`,
        categoryId: catId,
        categoryName: catName,
        saleOk: Boolean(p.sale_ok),
        purchaseOk: Boolean(p.purchase_ok),
        isRawMaterial: isRawMaterial,
        isFinishedProduct: isFinishedProduct,
        isLowStock: stock <= 5.0
      };
    });
  } catch (err) {
    console.warn('Brak połączenia z Odoo API:', err.message);
    // Return null to signal offline state without dummy products
    return null;
  }
}

/**
 * Create a new product in Odoo 19 & initialize stock in Location 5
 */
export async function createNewProduct({ name, sku, initialQuantity, categoryId }) {
  const config = getOdooConfig();
  const catId = Number(categoryId) || Number(config.categoryId);
  const isRaw = catId === 4;

  try {
    const pId = await callOdooRpc('product.product', 'create', [{
      name: name,
      default_code: sku,
      type: 'consu',
      is_storable: true,
      sale_ok: true,
      purchase_ok: isRaw,
      categ_id: catId
    }]);

    if (!pId) throw new Error('Nie otrzymano ID nowego produktu z Odoo.');

    if (initialQuantity > 0) {
      const qId = await callOdooRpc('stock.quant', 'create', [{
        product_id: pId,
        location_id: Number(config.locationId),
        inventory_quantity: initialQuantity
      }]);

      if (qId) {
        await callOdooRpc('stock.quant', 'action_apply_inventory', [[qId]]);
      }
    }

    return { success: true, productId: pId };
  } catch (err) {
    console.error('createNewProduct Error:', err);
    return { success: false, error: err.message || 'Błąd dodawania produktu' };
  }
}

export async function applyStockAdjustment(productId, newQuantity, sku, oldQuantity) {
  const config = getOdooConfig();
  const diff = Number((newQuantity - oldQuantity).toFixed(2));
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = 'Dziś, ' + timestamp;

  const historyItem = {
    id: Date.now(),
    sku: sku,
    title: `Korekta ${sku}: ${diff > 0 ? '+' : ''}${diff}m`,
    details: `Nowy stan: ${newQuantity}m`,
    time: dateStr,
    status: 'PENDING',
    error: null,
    productId,
    newQuantity,
    oldQuantity
  };

  saveHistoryItem(historyItem);

  try {
    let quantId = null;
    const targetLoc = Number(config.locationId);

    const searchRes = await callOdooRpc('stock.quant', 'search_read', [[['product_id', '=', productId], ['location_id', '=', targetLoc]]], {
      fields: ['id', 'quantity', 'inventory_quantity']
    });

    if (Array.isArray(searchRes) && searchRes.length > 0) {
      quantId = searchRes[0].id;
      await callOdooRpc('stock.quant', 'write', [[quantId], { inventory_quantity: newQuantity }]);
    } else {
      quantId = await callOdooRpc('stock.quant', 'create', [{
        product_id: productId,
        location_id: targetLoc,
        inventory_quantity: newQuantity
      }]);
    }

    if (quantId) {
      await callOdooRpc('stock.quant', 'action_apply_inventory', [[quantId]]);
    }

    updateHistoryItemStatus(historyItem.id, 'SYNCHRONIZED', null);
    return { success: true, offline: false };
  } catch (err) {
    const errorMsg = err.message || 'Nieznany błąd Odoo API';
    console.warn('Błąd podczas zapisywania korekty w Odoo:', errorMsg);
    
    updateHistoryItemStatus(historyItem.id, 'ERROR', errorMsg);
    queuePendingSync(historyItem);
    return { success: false, offline: true, error: errorMsg };
  }
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (!raw) {
      return [
        { id: 1, sku: 'S355-FI20', title: 'Ucięcie S355-FI20: -1.5m', details: 'Nowy stan: 14.0m', time: 'Dziś, 10:45 AM', status: 'SYNCHRONIZED', error: null },
        { id: 2, sku: 'S235-PL10', title: 'Przyjęcie S235-PL10: +50 szt.', details: 'Nowy stan: 150 szt.', time: 'Dziś, 09:12 AM', status: 'SYNCHRONIZED', error: null }
      ];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveHistoryItem(item) {
  const current = getHistory();
  current.unshift(item);
  localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(current));
}

function updateHistoryItemStatus(id, newStatus, errorMsg = null) {
  const current = getHistory();
  const found = current.find(i => i.id === id);
  if (found) {
    found.status = newStatus;
    found.error = errorMsg;
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(current));
  }
}

function queuePendingSync(item) {
  try {
    const pending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PENDING_KEY) || '[]');
    pending.push(item);
    localStorage.setItem(LOCAL_STORAGE_PENDING_KEY, JSON.stringify(pending));
  } catch (e) {
    console.error('Error queuing pending sync:', e);
  }
}

export async function syncPendingItems() {
  const config = getOdooConfig();
  try {
    const pending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PENDING_KEY) || '[]');
    if (pending.length === 0) return { syncedCount: 0, errors: [] };

    let syncedCount = 0;
    const remaining = [];
    const errorsList = [];

    for (const item of pending) {
      try {
        let quantId = null;
        const targetLoc = Number(config.locationId);
        const searchRes = await callOdooRpc('stock.quant', 'search_read', [[['product_id', '=', item.productId], ['location_id', '=', targetLoc]]], {
          fields: ['id', 'quantity', 'inventory_quantity']
        });

        if (Array.isArray(searchRes) && searchRes.length > 0) {
          quantId = searchRes[0].id;
          await callOdooRpc('stock.quant', 'write', [[quantId], { inventory_quantity: item.newQuantity }]);
        } else {
          quantId = await callOdooRpc('stock.quant', 'create', [{
            product_id: item.productId,
            location_id: targetLoc,
            inventory_quantity: item.newQuantity
          }]);
        }

        if (quantId) {
          await callOdooRpc('stock.quant', 'action_apply_inventory', [[quantId]]);
        }
        updateHistoryItemStatus(item.id, 'SYNCHRONIZED', null);
        syncedCount++;
      } catch (err) {
        updateHistoryItemStatus(item.id, 'ERROR', err.message);
        errorsList.push(`${item.sku}: ${err.message}`);
        remaining.push(item);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_PENDING_KEY, JSON.stringify(remaining));
    return { syncedCount, errors: errorsList };
  } catch (e) {
    return { syncedCount: 0, errors: [e.message] };
  }
}
