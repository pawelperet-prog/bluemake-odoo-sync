import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getCurrentOperator } from './authService.js';

// Odoo Config with LocalStorage persistence support
const DEFAULT_CONFIG = {
  url: 'https://odo.pestkalink.pl/jsonrpc',
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
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.url.includes('domowyasystent.online')) {
        parsed.url = parsed.url.replace('domowyasystent.online', 'pestkalink.pl');
        localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(parsed));
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
    return { ...DEFAULT_CONFIG };
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

export async function callOdooRpc(model, method, args = [], kwargs = {}) {
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

export const RAW_LOCATIONS = [
  { id: 16, name: 'Regał 1' },
  { id: 17, name: 'Regał 2' },
  { id: 18, name: 'Regał 3' },
  { id: 19, name: 'Regał 4' },
  { id: 20, name: 'Regał 5' },
  { id: 21, name: 'Pole odkładcze' },
  { id: 5,  name: 'Strefa składowania (Główna)' }
];

export const PRODUCT_LOCATIONS = [
  { id: 22, name: '01 - Magazyn' },
  { id: 23, name: '02 - Regał wysokiego składowania' },
  { id: 21, name: 'Pole odkładcze' },
  { id: 5,  name: 'Strefa składowania (Główna)' }
];

/**
 * Pobierz wszystkie aktywne lokalizacje magazynowe z Odoo
 */
export async function getStockLocations() {
  try {
    const locs = await callOdooRpc('stock.location', 'search_read', [[['usage', '=', 'internal']]], {
      fields: ['id', 'name', 'complete_name', 'location_id']
    });
    return locs || [];
  } catch (e) {
    console.warn('Nie udało się pobrać lokalizacji z Odoo:', e.message);
    return [...RAW_LOCATIONS, ...PRODUCT_LOCATIONS];
  }
}

/**
 * Fetch products from Odoo 19 with real shelf/rack locations
 */
export async function getProducts() {
  const config = getOdooConfig();
  try {
    const productDomain = [['active', '=', true]];
    const products = await callOdooRpc('product.product', 'search_read', [productDomain], {
      fields: ['id', 'name', 'default_code', 'barcode', 'uom_id', 'categ_id', 'sale_ok', 'purchase_ok', 'product_tmpl_id', 'description'],
      limit: 500
    });

    let quants = [];
    try {
      quants = await callOdooRpc('stock.quant', 'search_read', [[['location_id.usage', '=', 'internal']]], {
        fields: ['id', 'product_id', 'quantity', 'inventory_quantity', 'location_id']
      });
    } catch (e) {
      console.warn('Pobieranie quants po usage=internal nieudane, próba po ID:', e.message);
      try {
        quants = await callOdooRpc('stock.quant', 'search_read', [[]], {
          fields: ['id', 'product_id', 'quantity', 'inventory_quantity', 'location_id']
        });
      } catch (err) {}
    }

    // Mapa stanów i lokalizacji
    const quantMap = {};
    const locMap = {};
    const locIdMap = {};

    if (Array.isArray(quants)) {
      quants.forEach(q => {
        const pId = Array.isArray(q.product_id) ? q.product_id[0] : q.product_id;
        const locName = Array.isArray(q.location_id) ? q.location_id[1] : ('Lokacja ' + q.location_id);
        const locId = Array.isArray(q.location_id) ? q.location_id[0] : q.location_id;

        if (pId) {
          quantMap[pId] = (quantMap[pId] || 0) + (typeof q.quantity === 'number' ? q.quantity : 0);
          if (!locMap[pId] || q.quantity > 0) {
            locMap[pId] = locName.replace(/^WH\//, '');
            locIdMap[pId] = locId;
          }
        }
      });
    }

    return products.map(p => {
      const stock = quantMap[p.id] !== undefined ? quantMap[p.id] : 0;
      const uomName = Array.isArray(p.uom_id) ? p.uom_id[1] : 'm';
      const catId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id;
      const catName = Array.isArray(p.categ_id) ? p.categ_id[1] : ('Kategoria ' + p.categ_id);
      
      const isRawMaterial = catId === 4 || (Boolean(p.sale_ok && p.purchase_ok));
      const isFinishedProduct = catId === 5 || (Boolean(p.sale_ok && !p.purchase_ok));

      const defaultLocName = isFinishedProduct ? '01 - Magazyn' : 'Regał 1';
      const defaultLocId = isFinishedProduct ? 22 : 16;

      const codeVal = p.barcode || p.default_code || `SKU-${p.id}`;
      const cleanName = (p.name || 'Produkt')
        .replace(/\bFI\s*([0-9]+)/gi, 'Ø$1')
        .replace(/\bFI\b/gi, 'Ø');

      const tmplId = Array.isArray(p.product_tmpl_id) ? p.product_tmpl_id[0] : p.product_tmpl_id;

      return {
        id: p.id,
        templateId: tmplId || p.id,
        sku: codeVal,
        barcode: codeVal,
        name: cleanName,
        quantity: typeof stock === 'number' ? stock : 0,
        uom: uomName.toLowerCase().includes('unit') ? 'szt' : (uomName.toLowerCase().includes('m') ? 'm' : uomName),
        location: locMap[p.id] || defaultLocName,
        locationId: locIdMap[p.id] || defaultLocId,
        isLowStock: stock < 5,
        categoryId: catId,
        categoryName: isRawMaterial ? 'Surowiec' : (isFinishedProduct ? 'Produkt' : catName),
        isRawMaterial: isRawMaterial,
        isFinishedProduct: isFinishedProduct,
        saleOk: Boolean(p.sale_ok),
        purchaseOk: Boolean(p.purchase_ok),
        description: p.description || ''
      };
    });
  } catch (err) {
    console.error('getProducts Error:', err);
    throw err;
  }
}

/**
 * Pobierz załączniki PDF przypisane do danego produktu / szablonu w Odoo
 */
export async function getProductAttachments(productId, templateId, sku) {
  try {
    let tId = templateId ? Number(templateId) : null;
    const pId = productId ? Number(productId) : null;

    // Jeśli nie znamy templateId, pobierz go z Odoo dla tego product.product
    if (!tId && pId) {
      try {
        const prodData = await callOdooRpc('product.product', 'read', [[pId], ['product_tmpl_id']]);
        if (Array.isArray(prodData) && prodData.length > 0 && prodData[0].product_tmpl_id) {
          tId = Array.isArray(prodData[0].product_tmpl_id) ? prodData[0].product_tmpl_id[0] : prodData[0].product_tmpl_id;
        }
      } catch (errTmpl) {
        console.warn('Nie udało się pobrać templateId z Odoo:', errTmpl.message);
      }
    }

    // 1. Priorytet: Załącznik przypisany bezpośrednio do szablonu produktu (product.template)
    if (tId) {
      const tmplAtts = await callOdooRpc('ir.attachment', 'search_read', [[
        ['res_model', '=', 'product.template'],
        ['res_id', '=', tId],
        '|',
        ['mimetype', 'ilike', 'pdf'],
        ['name', 'ilike', '.pdf']
      ]], {
        fields: ['id', 'name', 'res_model', 'res_id', 'file_size', 'mimetype', 'write_date']
      });

      if (Array.isArray(tmplAtts) && tmplAtts.length > 0) {
        return tmplAtts;
      }
    }

    // 2. Załącznik przypisany bezpośrednio do wariantu (product.product)
    if (pId) {
      const prodAtts = await callOdooRpc('ir.attachment', 'search_read', [[
        ['res_model', '=', 'product.product'],
        ['res_id', '=', pId],
        '|',
        ['mimetype', 'ilike', 'pdf'],
        ['name', 'ilike', '.pdf']
      ]], {
        fields: ['id', 'name', 'res_model', 'res_id', 'file_size', 'mimetype', 'write_date']
      });

      if (Array.isArray(prodAtts) && prodAtts.length > 0) {
        return prodAtts;
      }
    }

    // 3. Fallback: szukaj po nazwie SKU w nazwie pliku
    if (sku && String(sku).trim().length > 2) {
      const cleanSku = String(sku).trim();
      const byName = await callOdooRpc('ir.attachment', 'search_read', [[
        ['name', 'ilike', cleanSku],
        '|',
        ['mimetype', 'ilike', 'pdf'],
        ['name', 'ilike', '.pdf']
      ]], {
        fields: ['id', 'name', 'res_model', 'res_id', 'file_size', 'mimetype', 'write_date'],
        limit: 5
      });
      if (Array.isArray(byName) && byName.length > 0) {
        return byName;
      }
    }

    return [];
  } catch (err) {
    console.warn('Błąd pobierania załączników PDF dla produktu:', err.message);
    return [];
  }
}

/**
 * Pobierz zawartość binarną (base64) danego załącznika PDF z Odoo
 */
export async function getAttachmentData(attachmentId) {
  try {
    const res = await callOdooRpc('ir.attachment', 'read', [[Number(attachmentId)], ['id', 'name', 'datas', 'mimetype', 'file_size']]);
    if (Array.isArray(res) && res.length > 0) {
      return res[0];
    }
    throw new Error('Nie odnaleziono danych załącznika w Odoo');
  } catch (err) {
    console.error('Błąd pobierania zawartości załącznika:', err);
    throw err;
  }
}

/**
 * Zaktualizuj notatkę / opis technologiczny produktu w Odoo
 */
export async function updateProductDescription(productId, templateId, description) {
  try {
    if (templateId) {
      await callOdooRpc('product.template', 'write', [[Number(templateId)], { description: description }]);
    } else {
      await callOdooRpc('product.product', 'write', [[Number(productId)], { description: description }]);
    }
    return true;
  } catch (err) {
    console.error('Błąd aktualizacji opisu produktu:', err);
    throw err;
  }
}

/**
 * Create a new product in Odoo 19 & initialize stock in Location 5
 */
export async function createNewProduct({ name, sku, initialQuantity = 0, categoryId, uomName = 'm' }) {
  const config = getOdooConfig();
  try {
    const isRaw = categoryId === 4;
    const catId = categoryId || 4;

    const pId = await callOdooRpc('product.product', 'create', [{
      name: name,
      default_code: sku,
      barcode: sku,
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
        inventory_quantity: initialQuantity,
        inventory_quantity_set: true,
        user_id: config.uid
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

export async function applyStockAdjustment(productId, newQuantity, sku, oldQuantity, targetLocationId = null) {
  const config = getOdooConfig();
  const diff = Number((newQuantity - oldQuantity).toFixed(2));
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = 'Dziś, ' + timestamp;

  const targetLoc = Number(targetLocationId || config.locationId || 5);

  const operator = getCurrentOperator();
  const historyItem = {
    id: Date.now(),
    sku: sku,
    title: `Korekta ${sku}: ${diff > 0 ? '+' : ''}${diff}`,
    details: `Nowy stan: ${newQuantity} (Lokalizacja ID #${targetLoc})`,
    time: dateStr,
    operator: operator ? operator.name : 'Nieznany Operator',
    operatorRole: operator ? operator.role : 'Operator',
    status: 'PENDING',
    error: null,
    productId,
    newQuantity,
    oldQuantity,
    locationId: targetLoc
  };

  saveHistoryItem(historyItem);

  try {
    // Pobierz wszystkie quants w lokalizacjach wewnętrznych dla tego produktu
    let allInternalQuants = [];
    try {
      allInternalQuants = await callOdooRpc('stock.quant', 'search_read', [[
        ['product_id', '=', Number(productId)],
        ['location_id.usage', '=', 'internal']
      ]], {
        fields: ['id', 'quantity', 'location_id']
      });
    } catch (e) {
      console.warn('Nie udało się pobrać quants z filtrem usage=internal:', e.message);
    }

    // 1. Zaktualizuj lub utwórz quant w docelowej lokalizacji
    let targetQuant = Array.isArray(allInternalQuants) ? allInternalQuants.find(q => {
      const locId = Array.isArray(q.location_id) ? q.location_id[0] : q.location_id;
      return locId === targetLoc;
    }) : null;

    let quantId = null;
    if (targetQuant) {
      quantId = targetQuant.id;
      await callOdooRpc('stock.quant', 'write', [[quantId], {
        inventory_quantity: newQuantity,
        inventory_quantity_set: true,
        user_id: config.uid
      }]);
    } else {
      quantId = await callOdooRpc('stock.quant', 'create', [{
        product_id: Number(productId),
        location_id: targetLoc,
        inventory_quantity: newQuantity,
        inventory_quantity_set: true,
        user_id: config.uid
      }]);
    }

    if (quantId) {
      await callOdooRpc('stock.quant', 'action_apply_inventory', [[quantId]]);
    }

    // 2. Wyzeruj stan na pozostałych lokalizacjach wewnętrznych tego produktu (jeśli tam był stary stan)
    if (Array.isArray(allInternalQuants)) {
      for (const otherQuant of allInternalQuants) {
        const otherLocId = Array.isArray(otherQuant.location_id) ? otherQuant.location_id[0] : otherQuant.location_id;
        if (otherLocId !== targetLoc && otherQuant.quantity > 0) {
          try {
            await callOdooRpc('stock.quant', 'write', [[otherQuant.id], {
              inventory_quantity: 0,
              inventory_quantity_set: true,
              user_id: config.uid
            }]);
            await callOdooRpc('stock.quant', 'action_apply_inventory', [[otherQuant.id]]);
          } catch (errZero) {
            console.warn(`Nie udało się wyzerować starej lokacji ${otherLocId}:`, errZero.message);
          }
        }
      }
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

export const ODOO_DISCUSS_CHANNELS = [
  { id: 9, name: '#Materiał (Domyślny dla surowców)', checked: true },
  { id: 11, name: '#Wszystko (Kanał ogólny)', checked: true }
];

export const ODOO_MANAGERS = [
  { partnerId: 8, userId: 6, name: 'Mateusz Klimkowski', email: 'M.klimkowski@bluemake.eu' },
  { partnerId: 6, userId: 5, name: 'Paweł Peret', email: 'p.peret@bluemake.eu' }
];

/**
 * Send Low Stock Alert message directly into Odoo 19 Discuss Channels (#Materiał / #Wszystko) and Product Chatter
 */
export async function sendLowStockAlert({ 
  productId, 
  sku, 
  name, 
  currentQuantity, 
  uom = 'm', 
  operatorName, 
  location,
  channelIds = [9, 11],
  recipientPartnerIds = [8, 6], 
  customNote = '' 
}) {
  const config = getOdooConfig();
  const operator = getCurrentOperator();
  const opName = operatorName || (operator ? operator.name : 'Operator Magazynu');
  const qtyStr = `${Number(currentQuantity).toFixed(1)} ${uom}`;
  const dateStr = new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
  const locationStr = location || `Strefa ${config.locationId}`;

  const recipientMentions = ODOO_MANAGERS
    .filter(m => recipientPartnerIds.includes(m.partnerId))
    .map(m => `@${m.name}`)
    .join(' ');

  const channelPostHtml = `
🚨 <strong>PILNY ALERT MAGAZYNOWY (Bluemake)</strong><br/>
📦 <strong>Produkt:</strong> ${name} (<code>${sku}</code>)<br/>
📊 <strong>Aktualny stan:</strong> <strong>${qtyStr}</strong> (${locationStr})<br/>
👤 <strong>Zgłaszający operator:</strong> ${opName} • <strong>Data:</strong> ${dateStr}<br/>
${customNote ? `📝 <strong>Notatka:</strong> <em>${customNote}</em><br/>` : ''}
🔔 <strong>Powiadomiono:</strong> ${recipientMentions || '@Mateusz Klimkowski @Paweł Peret'}
  `.trim();

  let sentChannelsCount = 0;
  const errors = [];

  // 1. Post to Odoo Discuss Channels via mail.message (preserve clean HTML)
  for (const cId of (channelIds || [9])) {
    try {
      await callOdooRpc('mail.message', 'create', [{
        model: 'discuss.channel',
        res_id: Number(cId),
        body: channelPostHtml,
        message_type: 'comment',
        subtype_id: 1,
        partner_ids: recipientPartnerIds
      }]);
      sentChannelsCount++;
    } catch (err) {
      console.warn(`Błąd wysyłania do kanału ID ${cId}:`, err);
      try {
        // Fallback to channel message_post
        await callOdooRpc('discuss.channel', 'message_post', [cId], {
          body: channelPostHtml,
          message_type: 'comment'
        });
        sentChannelsCount++;
      } catch (e) {
        errors.push(`Kanał ${cId}: ${e.message}`);
      }
    }
  }

  // 2. Also log to product chatter if productId provided
  if (productId) {
    try {
      await callOdooRpc('mail.message', 'create', [{
        model: 'product.product',
        res_id: Number(productId),
        body: channelPostHtml,
        message_type: 'comment',
        subtype_id: 1,
        partner_ids: recipientPartnerIds
      }]);
    } catch (err) {
      console.warn('Błąd zapisu w chatterze produktu:', err);
    }
  }

  const alertHistoryItem = {
    id: Date.now(),
    sku: sku,
    title: `🚨 Alert na czacie Odoo (${sku})`,
    details: `Stan: ${qtyStr} • Wysłano do: #Materiał / #Wszystko`,
    time: 'Dziś, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    operator: opName,
    operatorRole: 'Magazynier / Operator',
    status: sentChannelsCount > 0 ? 'SYNCHRONIZED' : 'ERROR',
    error: errors.length > 0 ? errors.join('; ') : null,
    productId
  };
  saveHistoryItem(alertHistoryItem);

  if (sentChannelsCount > 0) {
    return { success: true, channelsCount: sentChannelsCount };
  } else {
    return { success: false, error: errors.join('; ') || 'Nie udało się wysłać na czat Odoo' };
  }
}


