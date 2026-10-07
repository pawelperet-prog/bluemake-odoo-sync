import { logAuditAction, getCurrentOperator } from './authService.js';

const STORAGE_KEY_WZ_HISTORY = 'bluemake_wz_history_v2';
const STORAGE_KEY_WZ_COUNTERS = 'bluemake_wz_monthly_counters_v2';
const STORAGE_KEY_WZ_CUSTOMERS = 'bluemake_wz_customers_v2';

export const DEFAULT_SUPPLIER = {
  name: 'BLUEMAKE Sp. z o.o.',
  address: 'ul. Tuwima 39, 39-300 Mielec',
  nip: '8172210070',
  email: 'm.klimkowski@bluemake.eu, www.bluemake.eu'
};

export const DEFAULT_CUSTOMERS = [
  {
    id: 'cust_ec_eng',
    name: 'EC Engineering Sp. z o.o.',
    address: 'ul. Armii Krajowej 28, 30-150 Kraków',
    nip: 'PL9452024663',
    regon: '35690824',
    contact: 'office@ec-e.pl, www.ec-e.pl'
  },
  {
    id: 'cust_mv_center',
    name: 'MV Center Systemy Wizyjne Sp. z o.o.',
    address: 'ul. Krakowska 50, 32-083 Balice (Kraków)',
    nip: '5130255480',
    regon: '380649718',
    contact: 'biuro@mv-center.com, www.mv-center.com'
  },
  {
    id: 'cust_zmj',
    name: 'ZMJ Metals – Mateusz Zieliński',
    address: 'ul. Wojska Polskiego 3, 39-300 Mielec',
    nip: '8141696404',
    regon: '522759005',
    contact: 'biuro@zmjmetals.pl, www.zmjmetals.pl'
  },
  {
    id: 'cust_matmont',
    name: 'MATMONT Sp. z o.o. Sp. k.',
    address: 'Łubnice 22B, 28-232 Łubnice',
    nip: '8661742725',
    regon: '385669667',
    contact: 'biuro@matmont.pl, www.matmont.pl'
  },
  {
    id: 'cust_alpha',
    name: 'ALPHA TECHNOLOGY Sp. z o.o. Sp. k.',
    address: 'ul. Półłanki 29, 30-740 Kraków',
    nip: 'PL6790025708',
    regon: '350811985',
    contact: 'biuro@alphatechnology.com.pl, www.alphatechnology.com.pl'
  },
  {
    id: 'cust_nikmet',
    name: 'NIKMET Sp. z o.o.',
    address: 'Rzemień 44, 39-322 Rzemień',
    nip: 'PL8172088517',
    regon: '180295110',
    contact: 'biuro@nikmet.pl, www.nikmet.pl'
  },
  {
    id: 'cust_kinar',
    name: 'KINAR Kamil Janiszewski',
    address: 'Modra 24/16, 54-151 Wrocław',
    nip: 'PL8982138720',
    regon: '',
    contact: 'kamil.janiszewski@kinar.pl, tel. +48 577 928 734, www.kinar.pl'
  },
  {
    id: 'cust_husqvarna',
    name: 'Husqvarna Poland Sp. z o.o.',
    address: 'ul. Wysockiego 15A, 03-371 Warszawa',
    nip: '5240103440',
    regon: '010156942',
    contact: 'kontakt@husqvarna.pl'
  }
];

const CUSTOMERS_SCHEMA_VERSION = 'v4';
const STORAGE_KEY_CUSTOMERS_INIT = 'bluemake_wz_customers_init_ver';

export function findCustomerMatch(nameOrSearch) {
  if (!nameOrSearch) return null;
  const customers = getSavedCustomers();
  const clean = String(nameOrSearch).toLowerCase().trim();

  // 1. Direct match or id match
  let found = customers.find(c => c.id === nameOrSearch || (c.name && c.name.toLowerCase().trim() === clean));
  if (found) return found;

  // 2. Keyword match
  if (clean.includes('ec') || clean.includes('engineering')) {
    found = customers.find(c => c.id === 'cust_ec_eng' || c.name.toLowerCase().includes('ec engineering'));
    if (found) return found;
  }
  if (clean.includes('mv') || clean.includes('center')) {
    found = customers.find(c => c.id === 'cust_mv_center' || c.name.toLowerCase().includes('mv center'));
    if (found) return found;
  }
  if (clean.includes('zmj')) {
    found = customers.find(c => c.id === 'cust_zmj' || c.name.toLowerCase().includes('zmj'));
    if (found) return found;
  }
  if (clean.includes('matmont')) {
    found = customers.find(c => c.id === 'cust_matmont' || c.name.toLowerCase().includes('matmont'));
    if (found) return found;
  }
  if (clean.includes('alpha')) {
    found = customers.find(c => c.id === 'cust_alpha' || c.name.toLowerCase().includes('alpha'));
    if (found) return found;
  }
  if (clean.includes('nikmet')) {
    found = customers.find(c => c.id === 'cust_nikmet' || c.name.toLowerCase().includes('nikmet'));
    if (found) return found;
  }
  if (clean.includes('kinar')) {
    found = customers.find(c => c.id === 'cust_kinar' || c.name.toLowerCase().includes('kinar'));
    if (found) return found;
  }
  if (clean.includes('husqvarna')) {
    found = customers.find(c => c.id === 'cust_husqvarna' || c.name.toLowerCase().includes('husqvarna'));
    if (found) return found;
  }

  // 3. Substring match
  found = customers.find(c => (c.name && (c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase()))));
  if (found) return found;

  return {
    id: `cust_custom_${Date.now()}`,
    name: nameOrSearch,
    address: '',
    nip: '',
    regon: '',
    contact: ''
  };
}

export function getSavedCustomers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_CUSTOMERS);
    const initVer = localStorage.getItem(STORAGE_KEY_CUSTOMERS_INIT);
    
    if (saved) {
      let parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If first time running v4 schema, merge new default customers (ALPHA, NIKMET, etc.)
        if (initVer !== CUSTOMERS_SCHEMA_VERSION) {
          for (const def of DEFAULT_CUSTOMERS) {
            const exists = parsed.some(c => 
              c.id === def.id || 
              (def.nip && c.nip && c.nip.trim().replace(/[\s-]/g, '').toUpperCase() === def.nip.trim().replace(/[\s-]/g, '').toUpperCase()) || 
              (c.name && c.name.trim().toLowerCase() === def.name.trim().toLowerCase())
            );
            if (!exists) {
              parsed.push(def);
            }
          }
          localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(parsed));
          localStorage.setItem(STORAGE_KEY_CUSTOMERS_INIT, CUSTOMERS_SCHEMA_VERSION);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading WZ customers:', e);
  }
  
  localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
  localStorage.setItem(STORAGE_KEY_CUSTOMERS_INIT, CUSTOMERS_SCHEMA_VERSION);
  return DEFAULT_CUSTOMERS;
}

export function saveCustomer(customer, operatorName = null) {
  if (!customer || !customer.name || !customer.name.trim()) {
    return { list: getSavedCustomers(), savedCustomer: customer };
  }

  const list = getSavedCustomers();
  const cleanName = customer.name.trim().toLowerCase();
  const cleanNip = customer.nip ? String(customer.nip).trim().replace(/[\s-]/g, '').toUpperCase() : '';

  const existingIdx = list.findIndex(c => {
    if (customer.id && c.id === customer.id) return true;
    if (cleanNip && c.nip && String(c.nip).trim().replace(/[\s-]/g, '').toUpperCase() === cleanNip) return true;
    if (c.name && String(c.name).trim().toLowerCase() === cleanName) return true;
    return false;
  });

  const isNew = existingIdx < 0;
  const targetId = (existingIdx >= 0 && list[existingIdx].id) ? list[existingIdx].id : (customer.id && customer.id !== 'NEW' ? customer.id : `cust_${Date.now()}`);

  const customerToSave = {
    id: targetId,
    name: customer.name.trim(),
    address: customer.address ? customer.address.trim() : '',
    nip: customer.nip ? customer.nip.trim() : '',
    regon: customer.regon ? customer.regon.trim() : '',
    contact: customer.contact ? customer.contact.trim() : ''
  };

  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...customerToSave };
  } else {
    list.unshift(customerToSave);
  }

  localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(list));

  logAuditAction({
    category: 'WZ',
    action: isNew ? '🏢 NOWY KONTRAHENT WZ' : '🏢 EDYCJA KONTRAHENTA WZ',
    details: `Zapisano dane kontrahenta: "${customerToSave.name}" (NIP: ${customerToSave.nip || 'Brak'})`,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'SUCCESS'
  });

  return { list, savedCustomer: customerToSave };
}

export function deleteCustomer(customerId, operatorName = null) {
  const list = getSavedCustomers();
  const found = list.find(c => c.id === customerId);
  const updated = list.filter(c => c.id !== customerId);
  localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(updated));

  logAuditAction({
    category: 'WZ',
    action: '🏢 USUNIĘCIE KONTRAHENTA',
    details: `Usunięto kontrahenta "${found?.name || customerId}" (NIP: ${found?.nip || 'Brak'})`,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'WARNING'
  });

  return updated;
}

export function resetCustomersToDefault(operatorName = null) {
  localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
  localStorage.setItem(STORAGE_KEY_CUSTOMERS_INIT, CUSTOMERS_SCHEMA_VERSION);
  logAuditAction({
    category: 'WZ',
    action: '🏢 RESET BAZY KONTRAHENTÓW',
    details: `Przywrócono domyślną listę kontrahentów (${DEFAULT_CUSTOMERS.length} firm)`,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'INFO'
  });
  return DEFAULT_CUSTOMERS;
}

export function isCustomerEc(customerOrName) {
  if (!customerOrName) return false;
  const name = typeof customerOrName === 'string' ? customerOrName : (customerOrName.name || '');
  const clean = name.toLowerCase().trim();
  return clean.includes('ec engineering') || clean === 'ec' || clean.startsWith('ec-') || clean.includes('ec_eng');
}

export function getWzHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error loading WZ history:', e);
    return [];
  }
}

export function getWzDrafts() {
  const all = getWzHistory();
  return all.filter(w => w.status === 'DRAFT' || w.isDraft === true);
}

export function getWzIssued() {
  const all = getWzHistory();
  return all.filter(w => w.status !== 'DRAFT' && w.isDraft !== true);
}

export function saveWzDraft(wzDoc, operatorName = null) {
  return saveWzDocument({
    ...wzDoc,
    status: 'DRAFT',
    isDraft: true,
    deductFromOdoo: false
  }, operatorName);
}

export function saveWzDocument(wzDoc, operatorName = null) {
  const history = getWzHistory();
  const isDraft = wzDoc.status === 'DRAFT' || wzDoc.isDraft === true;
  const idx = history.findIndex(w => w.id === wzDoc.id);
  const isNew = idx < 0;

  const docWithMeta = {
    ...wzDoc,
    status: isDraft ? 'DRAFT' : 'ISSUED',
    isDraft: isDraft,
    deductFromOdoo: isDraft ? false : (wzDoc.deductFromOdoo !== undefined ? wzDoc.deductFromOdoo : isCustomerEc(wzDoc.customer)),
    savedAt: new Date().toISOString(),
    formattedNumber: `Nr ${wzDoc.wzNum}/${wzDoc.wzMonth}/${wzDoc.wzYear}${wzDoc.wzSuffix || '/BM'}`
  };

  if (idx >= 0) {
    history[idx] = docWithMeta;
  } else {
    history.unshift(docWithMeta);
  }
  localStorage.setItem(STORAGE_KEY_WZ_HISTORY, JSON.stringify(history));

  const itemsCount = Array.isArray(wzDoc.items) ? wzDoc.items.length : 0;
  const actionTitle = isDraft 
    ? (isNew ? '📝 NOWY SZKIC WZ' : '📝 AKTUALIZACJA SZKICU WZ')
    : (isNew ? '📄 WYSTAWIENIE DOKUMENTU WZ' : '📄 AKTUALIZACJA DOKUMENTU WZ');

  logAuditAction({
    category: 'WZ',
    action: actionTitle,
    details: `${isDraft ? '[SZKIC] ' : ''}${docWithMeta.formattedNumber} dla "${wzDoc.customer?.name || 'Klient'}" (${itemsCount} pozycji towarowych). Magazynier: ${wzDoc.operatorName || 'Operator'}${docWithMeta.deductFromOdoo ? ' • Odjęto ze stanu Odoo (EC)' : ' • Bez odejmowania z Odoo'}`,
    operator: operatorName || wzDoc.operatorName || getCurrentOperator()?.name,
    status: 'SUCCESS'
  });

  // Automatically sync linked order shipment status
  if (!isDraft && (wzDoc.orderNumber || wzDoc.orderId)) {
    syncOrderFromWzHistory(wzDoc.orderId || wzDoc.orderNumber);
  }

  return history;
}

export function deleteWzDocument(wzId, operatorName = null) {
  const history = getWzHistory();
  const doc = history.find(w => w.id === wzId);
  const isDraft = doc?.status === 'DRAFT' || doc?.isDraft === true;
  const updated = history.filter(w => w.id !== wzId);
  localStorage.setItem(STORAGE_KEY_WZ_HISTORY, JSON.stringify(updated));

  // If was issued, sync the order back
  if (doc && !isDraft && (doc.orderNumber || doc.orderId)) {
    syncOrderFromWzHistory(doc.orderId || doc.orderNumber);
  }

  logAuditAction({
    category: 'WZ',
    action: isDraft ? '🗑️ USUNIĘCIE SZKICU WZ' : '🗑️ USUNIĘCIE DOKUMENTU WZ',
    details: `Usunięto ${isDraft ? 'szkic' : 'dokument'} WZ ${doc?.formattedNumber || wzId} (Kontrahent: "${doc?.customer?.name || 'Brak'}")`,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'WARNING'
  });

  return updated;
}

/**
 * Get the next WZ number for a given month and year (resets automatically every month to 1)
 */
export function getNextWzNumber(targetMonth = null, targetYear = null) {
  const now = new Date();
  const month = targetMonth || String(now.getMonth() + 1).padStart(2, '0');
  const year = targetYear || String(now.getFullYear());
  const key = `${year}-${month}`;
  
  try {
    const savedCounters = localStorage.getItem(STORAGE_KEY_WZ_COUNTERS);
    if (savedCounters) {
      const counters = JSON.parse(savedCounters);
      if (counters[key] !== undefined && counters[key] !== null) {
        return {
          num: counters[key],
          month: month,
          year: year,
          suffix: '/BM'
        };
      }
    }
  } catch (e) {}

  // Also check history for highest number in this month/year
  const history = getWzHistory();
  const monthDocs = history.filter(w => w.wzMonth === month && w.wzYear === year);
  if (monthDocs.length > 0) {
    const maxNum = Math.max(...monthDocs.map(w => parseInt(w.wzNum, 10) || 0));
    return {
      num: maxNum + 1,
      month: month,
      year: year,
      suffix: '/BM'
    };
  }

  return {
    num: 1,
    month: month,
    year: year,
    suffix: '/BM'
  };
}

/**
 * Increment and save counter for a specific month and year
 */
export function incrementWzCounter(usedNum, month, year) {
  const m = String(month).padStart(2, '0');
  const y = String(year);
  const key = `${y}-${m}`;

  let counters = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_COUNTERS);
    if (saved) counters = JSON.parse(saved);
  } catch (e) {}

  const currentVal = counters[key] || parseInt(usedNum, 10) || 1;
  const nextNum = Math.max((parseInt(usedNum, 10) || 1) + 1, currentVal + 1);
  
  counters[key] = nextNum;
  localStorage.setItem(STORAGE_KEY_WZ_COUNTERS, JSON.stringify(counters));
  return nextNum;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PARTIAL WZ SHIPMENT TRACKING & MULTI-DISPATCH ENGINE (WZ 1, WZ 2, WZ 3...)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function normalizeOrderRef(ref) {
  if (!ref) return '';
  return String(ref).trim().toUpperCase().replace(/[\s\-_\\/]/g, '');
}

export function normalizeItemKey(str) {
  if (!str) return '';
  return String(str).trim().toUpperCase().replace(/[\s\-_\\/]/g, '');
}

export function isItemMatching(orderItem, wzItem) {
  if (!orderItem || !wzItem) return false;
  if (wzItem.orderItemId && orderItem.id && wzItem.orderItemId === orderItem.id) {
    return true;
  }
  
  const oSku = normalizeItemKey(orderItem.sku);
  const oSym = normalizeItemKey(orderItem.symbol);
  const wSku = normalizeItemKey(wzItem.sku);
  const wSym = normalizeItemKey(wzItem.symbol);

  if (oSku && (oSku === wSku || oSku === wSym)) return true;
  if (oSym && (oSym === wSym || oSym === wSku)) return true;

  // Exact or contains name matching
  const oName = (orderItem.name || '').trim().toLowerCase();
  const wName = (wzItem.name || '').trim().toLowerCase();
  if (oName && wName && (oName === wName || wName.includes(oName) || oName.includes(wName))) {
    return true;
  }

  // SKU contained in name
  if (oSku && wzItem.name && normalizeItemKey(wzItem.name).includes(oSku)) return true;
  if (oSym && wzItem.name && normalizeItemKey(wzItem.name).includes(oSym)) return true;

  return false;
}

/**
 * Analyzes all issued WZ documents for a specific order and computes
 * shipped vs remaining quantities per item, and which previous WZs were issued.
 */
export function getOrderWzShipmentSummary(order, wzHistory = null) {
  if (!order) {
    return {
      orderId: null,
      orderRef: '',
      relatedWzs: [],
      itemsSummary: [],
      totalOrdered: 0,
      totalShipped: 0,
      totalRemaining: 0,
      isAllShipped: false,
      isPartiallyShipped: false
    };
  }

  const history = wzHistory || getWzIssued();
  const orderRefNorm = normalizeOrderRef(order.orderRef || order.odooOrderName || order.id);
  const odooOrderNorm = normalizeOrderRef(order.odooOrderName);

  // Find all ISSUED WZs for this order
  const relatedWzs = history.filter(wz => {
    if (wz.isDraft || wz.status === 'DRAFT') return false;
    if (wz.orderId && order.id && wz.orderId === order.id) return true;
    const wzRefNorm = normalizeOrderRef(wz.orderNumber);
    if (!wzRefNorm) return false;
    if (orderRefNorm && wzRefNorm === orderRefNorm) return true;
    if (odooOrderNorm && wzRefNorm === odooOrderNorm) return true;
    return false;
  });

  // Calculate shipped quantities per item
  const itemsSummary = (order.items || []).map(orderItem => {
    const orderedQty = parseFloat(orderItem.orderedQty !== undefined ? orderItem.orderedQty : (orderItem.shippedQty || 1)) || 0;
    let shippedQty = 0;
    const shipments = [];

    relatedWzs.forEach(wz => {
      (wz.items || []).forEach(wzItem => {
        if (isItemMatching(orderItem, wzItem)) {
          const qty = parseFloat(wzItem.quantity) || 0;
          shippedQty += qty;
          shipments.push({
            wzId: wz.id,
            wzNumber: wz.formattedNumber || `Nr ${wz.wzNum}/${wz.wzMonth}/${wz.wzYear}${wz.wzSuffix || '/BM'}`,
            date: wz.issueDate,
            quantity: qty
          });
        }
      });
    });

    const remainingQty = Math.max(0, parseFloat((orderedQty - shippedQty).toFixed(4)));
    const isFullyShipped = remainingQty === 0 && orderedQty > 0 && shippedQty > 0;
    const isPartiallyShipped = shippedQty > 0 && remainingQty > 0;

    return {
      orderItemId: orderItem.id,
      item: orderItem,
      orderedQty,
      shippedQty,
      remainingQty,
      isFullyShipped,
      isPartiallyShipped,
      shipments
    };
  });

  const totalOrdered = itemsSummary.reduce((sum, it) => sum + it.orderedQty, 0);
  const totalShipped = itemsSummary.reduce((sum, it) => sum + it.shippedQty, 0);
  const totalRemaining = itemsSummary.reduce((sum, it) => sum + it.remainingQty, 0);
  const isAllShipped = totalRemaining === 0 && totalOrdered > 0 && relatedWzs.length > 0;
  const isPartiallyShipped = totalShipped > 0 && totalRemaining > 0;

  return {
    orderId: order.id,
    orderRef: order.orderRef || order.odooOrderName || '',
    relatedWzs,
    itemsSummary,
    totalOrdered,
    totalShipped,
    totalRemaining,
    isAllShipped,
    isPartiallyShipped
  };
}

/**
 * Prepares prefill items for WZ generator:
 * DEDUCTS previous WZs so only remaining unfulfilled items and quantities are included!
 */
export function prepareOrderItemsForWz(order, wzHistory = null) {
  const summary = getOrderWzShipmentSummary(order, wzHistory);

  // Filter items: ONLY those with remainingQty > 0
  const remainingItems = summary.itemsSummary.filter(it => it.remainingQty > 0);
  
  // If all items are already shipped, keep all items (to allow re-issuing if explicitly forced)
  const sourceItems = remainingItems.length > 0 ? remainingItems : summary.itemsSummary;

  const itemsToWz = sourceItems.map((entry, idx) => {
    const it = entry.item;
    const producedQty = it.producedQty !== undefined ? parseFloat(it.producedQty) : 0;
    
    // Propose remaining quantity (or produced quantity if partial production was recorded)
    let proposedQty = entry.remainingQty;
    if (producedQty > 0 && producedQty < entry.remainingQty) {
      proposedQty = producedQty;
    }

    return {
      id: `wz_it_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      orderItemId: it.id,
      symbol: it.symbol || it.sku || '',
      sku: it.sku || it.symbol || '',
      name: it.sku && it.name && !it.name.includes(it.sku) ? `${it.sku} - ${it.name}` : (it.name || it.sku || it.symbol || `Detal ${idx + 1}`),
      orderedQty: entry.orderedQty,
      alreadyShippedQty: entry.shippedQty,
      remainingQty: entry.remainingQty,
      quantity: proposedQty > 0 ? proposedQty : (entry.remainingQty > 0 ? entry.remainingQty : entry.orderedQty),
      unit: it.uom || 'szt',
      uom: it.uom || 'szt',
      price: it.unitPrice || 0,
      productId: it.odooProductId || it.productId || null
    };
  });

  return {
    orderId: order.id,
    orderRef: order.orderRef || order.odooOrderName || '',
    orderNumber: order.orderRef || order.odooOrderName || '',
    orderDate: order.orderDate || new Date().toISOString().split('T')[0],
    customerName: order.customerName || order.category || 'EC Engineering',
    items: itemsToWz,
    summary: summary
  };
}

/**
 * Updates orders storage to reflect newly issued or deleted WZ documents
 */
export function syncOrderFromWzHistory(orderRefOrId) {
  try {
    const STORAGE_KEY = 'bluemake_saved_orders_db_v14';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const orders = JSON.parse(raw);
    if (!Array.isArray(orders)) return null;

    const normTarget = normalizeOrderRef(orderRefOrId);
    const orderIdx = orders.findIndex(o => 
      o.id === orderRefOrId || 
      normalizeOrderRef(o.orderRef) === normTarget || 
      normalizeOrderRef(o.odooOrderName) === normTarget
    );
    if (orderIdx === -1) return null;

    const order = orders[orderIdx];
    const summary = getOrderWzShipmentSummary(order);

    // Update shippedQty on order items
    order.items = (order.items || []).map(orderItem => {
      const match = summary.itemsSummary.find(s => s.orderItemId === orderItem.id);
      if (match) {
        return {
          ...orderItem,
          shippedQty: match.shippedQty,
          remainingQty: match.remainingQty
        };
      }
      return orderItem;
    });

    order.wzSummary = {
      wzCount: summary.relatedWzs.length,
      wzNumbers: summary.relatedWzs.map(w => w.formattedNumber || w.wzNum),
      totalShipped: summary.totalShipped,
      totalRemaining: summary.totalRemaining,
      isAllShipped: summary.isAllShipped
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return order;
  } catch (e) {
    console.error('Error syncing order from WZ history:', e);
    return null;
  }
}
