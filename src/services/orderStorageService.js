import { logAuditAction, getCurrentOperator } from './authService.js';

const ORDERS_STORAGE_KEY = 'bluemake_saved_orders_db_v1';

export function getSavedOrders() {
  try {
    const data = localStorage.getItem(ORDERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error loading saved orders:', err);
    return [];
  }
}

export function saveOrderToDb(order, operatorName = null) {
  try {
    const orders = getSavedOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    const isNew = existingIndex < 0;
    
    const orderToSave = {
      ...order,
      updatedAt: new Date().toISOString(),
      createdAt: order.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      orders[existingIndex] = orderToSave;
    } else {
      orders.unshift(orderToSave);
    }

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    const itemsCount = Array.isArray(orderToSave.items) ? orderToSave.items.length : 0;
    logAuditAction({
      category: 'ORDER',
      action: isNew ? '📋 IMPORT ZAMÓWIENIA' : '📋 AKTUALIZACJA ZAMÓWIENIA',
      details: `Zamówienie ${orderToSave.orderNumber || orderToSave.id} dla "${orderToSave.customerName || 'Klient'}" (${itemsCount} pozycji)`,
      operator: operatorName || getCurrentOperator()?.name,
      status: 'SUCCESS'
    });

    return orderToSave;
  } catch (err) {
    console.error('Error saving order:', err);
    return order;
  }
}

export function getOrderById(orderId) {
  const orders = getSavedOrders();
  return orders.find(o => o.id === orderId) || null;
}

export function deleteOrderFromDb(orderId, operatorName = null) {
  try {
    const orders = getSavedOrders();
    const order = orders.find(o => o.id === orderId);
    const filtered = orders.filter(o => o.id !== orderId);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));

    logAuditAction({
      category: 'ORDER',
      action: '🗑️ USUNIĘCIE ZAMÓWIENIA',
      details: `Usunięto zamówienie ${order?.orderNumber || orderId} ("${order?.customerName || 'Brak'}")`,
      operator: operatorName || getCurrentOperator()?.name,
      status: 'WARNING'
    });

    return true;
  } catch (err) {
    console.error('Error deleting order:', err);
    return false;
  }
}

export function updateOrderSyncStatus(orderId, syncStatus, odooInfo = {}, operatorName = null) {
  const order = getOrderById(orderId);
  if (order) {
    order.syncStatus = syncStatus; // 'DRAFT', 'SYNCED_ODOO', 'ERROR'
    if (odooInfo.odooOrderId) order.odooOrderId = odooInfo.odooOrderId;
    if (odooInfo.odooOrderName) order.odooOrderName = odooInfo.odooOrderName;
    if (odooInfo.lastSyncError !== undefined) order.lastSyncError = odooInfo.lastSyncError;

    logAuditAction({
      category: 'ORDER',
      action: syncStatus === 'SYNCED_ODOO' ? '🔄 SYNCHRONIZACJA ZAMÓWIENIA (ODOO)' : '⚠️ BŁĄD SYNCHRONIZACJI ZAMÓWIENIA',
      details: `Zamówienie ${order.orderNumber || orderId}: status ${syncStatus} (Odoo SO: ${odooInfo.odooOrderName || '-'})`,
      operator: operatorName || getCurrentOperator()?.name,
      status: syncStatus === 'SYNCED_ODOO' ? 'SYNCHRONIZED' : 'ERROR',
      error: odooInfo.lastSyncError || null
    });

    return saveOrderToDb(order, operatorName);
  }
  return null;
}
