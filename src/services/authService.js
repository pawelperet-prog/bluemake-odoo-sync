/**
 * Operator Authentication, Role-Based Access Control & Audit Log Service
 */

const LOCAL_STORAGE_USERS_KEY = 'bluemake_users_credentials_v2';
const LOCAL_STORAGE_OPERATOR_KEY = 'bluemake_active_operator_v2';
const LOCAL_STORAGE_LOGGED_IN_KEY = 'bluemake_is_logged_in_v2';
const LOCAL_STORAGE_AUDIT_LOGS_KEY = 'bluemake_audit_logs_v2';

// 4 Initial Operators with PIN 1234
export const INITIAL_USERS = [
  { id: 1, name: 'Paweł', role: 'ADMIN', roleLabel: 'Administrator', pin: '1234', hasChangedPin: false, avatar: 'admin_panel_settings' },
  { id: 2, name: 'Mateusz', role: 'ADMIN', roleLabel: 'Administrator', pin: '1234', hasChangedPin: false, avatar: 'manage_accounts' },
  { id: 3, name: 'Szymon', role: 'OPERATOR', roleLabel: 'Magazynier', pin: '1234', hasChangedPin: false, avatar: 'inventory' },
  { id: 4, name: 'Patryk', role: 'OPERATOR', roleLabel: 'Magazynier', pin: '1234', hasChangedPin: false, avatar: 'precision_manufacturing' }
];

export function getUsers() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  // Initialize default
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

export function saveUsers(users) {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

export function changeUserPin(userId, newPin) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.pin = String(newPin).trim();
    user.hasChangedPin = true;
    saveUsers(users);

    // If currently active operator, update session too
    const current = getCurrentOperator();
    if (current && current.id === userId) {
      current.pin = user.pin;
      current.hasChangedPin = true;
      saveCurrentOperator(current);
    }
    return true;
  }
  return false;
}

export function isUserLoggedIn() {
  return localStorage.getItem(LOCAL_STORAGE_LOGGED_IN_KEY) === 'true';
}

export function setLoggedIn(operator) {
  localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_KEY, 'true');
  saveCurrentOperator(operator);
  logAuditAction({
    action: 'LOGOWANIE',
    details: `Zalogowano operatora ${operator.name} (${operator.roleLabel})`,
    operator: operator.name
  });
}

export function getCurrentOperator() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OPERATOR_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return getUsers()[0];
}

export function saveCurrentOperator(operator) {
  localStorage.setItem(LOCAL_STORAGE_OPERATOR_KEY, JSON.stringify(operator));
}

export function logoutOperator() {
  const op = getCurrentOperator();
  if (op) {
    logAuditAction({
      action: 'WYLOGOWANIE',
      details: `Wylogowano operatora ${op.name}`,
      operator: op.name
    });
  }
  localStorage.removeItem(LOCAL_STORAGE_LOGGED_IN_KEY);
  localStorage.removeItem(LOCAL_STORAGE_OPERATOR_KEY);
}

export function isAdmin(operator = null) {
  const op = operator || getCurrentOperator();
  return op && (op.role === 'ADMIN' || op.role === 'Administrator');
}

/**
 * Audit Logging - History of all actions (Who did what)
 */
export function logAuditAction({ action, details, operator = null, sku = null }) {
  try {
    const op = operator || getCurrentOperator()?.name || 'Operator';
    const logs = getAuditLogs();
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('pl-PL'),
      operator: op,
      action: action || 'OPERACJA',
      details: details || '',
      sku: sku || ''
    };
    logs.unshift(entry);
    // Keep last 500 actions
    localStorage.setItem(LOCAL_STORAGE_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
    return entry;
  } catch (e) {
    console.warn('Could not save audit log:', e);
  }
}

export function getAuditLogs() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_AUDIT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}
