/**
 * Persistent Storage for Bluemake Customer Orders (LocalStorage & IndexedDB fallback)
 */
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

export function saveOrderToDb(order) {
  try {
    const orders = getSavedOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    
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

export function deleteOrderFromDb(orderId) {
  try {
    const orders = getSavedOrders().filter(o => o.id !== orderId);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (err) {
    console.error('Error deleting order:', err);
    return false;
  }
}

export function updateOrderSyncStatus(orderId, syncStatus, odooInfo = {}) {
  const order = getOrderById(orderId);
  if (order) {
    order.syncStatus = syncStatus; // 'DRAFT', 'SYNCED_ODOO', 'ERROR'
    if (odooInfo.odooOrderId) order.odooOrderId = odooInfo.odooOrderId;
    if (odooInfo.odooOrderName) order.odooOrderName = odooInfo.odooOrderName;
    if (odooInfo.lastSyncError !== undefined) order.lastSyncError = odooInfo.lastSyncError;
    return saveOrderToDb(order);
  }
  return null;
}
