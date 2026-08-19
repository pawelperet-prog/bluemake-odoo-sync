import { callOdooRpc, getOdooConfig } from './odooApi.js';

/**
 * Service to interact with Odoo 19 Sales Orders, Products & Prototypes
 */

export async function searchOrCreatePartner(partnerName) {
  try {
    const cleanName = (partnerName || '').trim();
    if (!cleanName) return 7; // Default EC Engineering ID

    const existing = await callOdooRpc('res.partner', 'search_read', [
      [['name', 'ilike', cleanName]]
    ], { fields: ['id', 'name'] });

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    // Try finding by generic keyword like 'EC Engineering'
    if (/EC\s*Engineering/i.test(cleanName)) {
      const ec = await callOdooRpc('res.partner', 'search_read', [
        [['name', 'ilike', 'EC Engineering']]
      ], { fields: ['id', 'name'] });
      if (ec && ec.length > 0) return ec[0].id;
    }

    // Create new partner
    const newId = await callOdooRpc('res.partner', 'create', [{
      name: cleanName,
      customer_rank: 1
    }]);
    return newId;
  } catch (err) {
    console.error('Error finding/creating partner:', err);
    return 7; // Fallback to EC Engineering ID
  }
}

export async function enrichOrderItemsWithOdooData(items) {
  if (!items || items.length === 0) return items;

  const skus = items.map(i => i.sku).filter(Boolean);
  
  try {
    const products = await callOdooRpc('product.product', 'search_read', [
      [['default_code', 'in', skus]]
    ], {
      fields: ['id', 'name', 'default_code', 'qty_available', 'list_price']
    });

    const prodMap = {};
    for (const p of products) {
      if (p.default_code) {
        prodMap[p.default_code.trim()] = p;
      }
    }

    return items.map(item => {
      const odooProd = prodMap[item.sku.trim()];
      if (odooProd) {
        return {
          ...item,
          odooProductId: odooProd.id,
          odooName: odooProd.name,
          inStock: Number(odooProd.qty_available || 0),
          stockStatus: (Number(odooProd.qty_available || 0) >= (item.shippedQty || item.orderedQty)) ? 'OK' : 'MISSING',
          existsInOdoo: true
        };
      } else {
        return {
          ...item,
          odooProductId: null,
          inStock: 0,
          stockStatus: 'MISSING',
          existsInOdoo: false,
          isPrototype: item.isPrototype !== undefined ? item.isPrototype : /^zn/i.test(item.sku)
        };
      }
    });
  } catch (err) {
    console.warn('Could not fetch Odoo stock for items:', err);
    return items;
  }
}

export async function findOrCreateProductInOdoo(item) {
  const cleanSku = (item.sku || '').trim();
  const cleanName = (item.name || item.symbol || `Detal ${cleanSku}`).trim();
  const unitPrice = parseFloat(item.unitPrice || 0);

  // 1. Search if exists
  if (cleanSku) {
    const found = await callOdooRpc('product.product', 'search_read', [
      [['default_code', '=', cleanSku]]
    ], { fields: ['id', 'name', 'default_code'] });

    if (found && found.length > 0) {
      return found[0].id;
    }
  }

  // 2. Create in Odoo
  const isProto = item.isPrototype || /^zn/i.test(cleanSku);
  const displayName = isProto ? `[PROTOTYP] ${cleanName}` : cleanName;

  const newProdId = await callOdooRpc('product.product', 'create', [{
    name: displayName,
    default_code: cleanSku || `ZN_${Date.now()}`,
    type: 'consu', // Goods / Konsumpcyjny
    list_price: unitPrice > 0 ? unitPrice : 50.0,
    description: isProto ? 'PROTOTYP WIRTUALNY - Zlecenie jednorazowe/krótkoseryjne' : 'Produkt utworzony z importu zamówień Bluemake'
  }]);

  return newProdId;
}

export async function syncOrderToOdoo(orderData) {
  const partnerId = await searchOrCreatePartner(orderData.customerName);
  
  // Prepare order lines
  const orderLines = [];

  for (const item of orderData.items) {
    let pId = item.odooProductId;
    if (!pId) {
      pId = await findOrCreateProductInOdoo(item);
      item.odooProductId = pId;
    }

    const qty = parseFloat(item.shippedQty || item.orderedQty || 1);
    const price = parseFloat(item.unitPrice || 0);

    orderLines.push([0, 0, {
      product_id: pId,
      name: `${item.symbol || item.sku} - ${item.name || 'Detal'}`,
      product_uom_qty: qty,
      price_unit: price
    }]);
  }

  // Create Sale Order in Odoo
  const orderDateStr = orderData.orderDate ? `${orderData.orderDate} 10:00:00` : `${new Date().toISOString().split('T')[0]} 10:00:00`;

  const orderId = await callOdooRpc('sale.order', 'create', [{
    partner_id: partnerId,
    client_order_ref: orderData.orderRef || `ZAM-${Date.now()}`,
    date_order: orderDateStr,
    order_line: orderLines
  }]);

  const [savedOrder] = await callOdooRpc('sale.order', 'read', [[orderId], [
    'id', 'name', 'amount_total', 'amount_untaxed', 'amount_tax', 'state', 'client_order_ref'
  ]]);

  // Post summary to Odoo Discuss (#Wszystko)
  try {
    const lineSummary = orderData.items.map(it => 
      `• <strong>${it.sku}</strong> (${it.name}): <strong>${it.shippedQty || it.orderedQty} szt.</strong> × ${it.unitPrice} zł`
    ).join('<br/>');

    const msgHtml = `
📦 <strong>NOWE ZAMÓWIENIE SPRZEDAŻY ZAPISANE W ODOO: ${savedOrder.name}</strong><br/>
🏢 <strong>Klient:</strong> ${orderData.customerName}<br/>
🔢 <strong>Nr zamówienia klienta:</strong> ${orderData.orderRef}<br/>
💰 <strong>Wartość:</strong> ${savedOrder.amount_untaxed} zł netto (${savedOrder.amount_total} zł brutto)<br/>
📋 <strong>Pozycje (${orderData.items.length}):</strong><br/>
${lineSummary}
    `.trim();

    await callOdooRpc('mail.message', 'create', [{
      model: 'discuss.channel',
      res_id: 11, // #Wszystko
      body: msgHtml,
      message_type: 'comment',
      subtype_id: 1
    }]);
  } catch (err) {
    console.warn('Could not post discuss message:', err);
  }

  return savedOrder;
}
