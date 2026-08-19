/**
 * Operator Authentication, Role-Based Access Control, Brute-Force Lockout & Audit Log Service
 */
import { callOdooRpc } from './odooApi.js';

const LOCAL_STORAGE_USERS_KEY = 'bluemake_users_credentials_v3';
const LOCAL_STORAGE_OPERATOR_KEY = 'bluemake_active_operator_v3';
const LOCAL_STORAGE_LOGGED_IN_KEY = 'bluemake_is_logged_in_v3';
const LOCAL_STORAGE_AUDIT_LOGS_KEY = 'bluemake_audit_logs_v3';
const LOCAL_STORAGE_LOCKOUT_KEY = 'bluemake_security_lockout_v3';

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
      if (Array.isArray(parsed) && parsed.length === 4 && parsed.some(u => u.name === 'Mateusz') && parsed.some(u => u.name === 'Szymon')) {
        return parsed;
      }
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

    logAuditAction({
      action: '🔑 ZMIANA PINU',
      details: `Użytkownik ${user.name} zmienił swój kod PIN na nowy`,
      operator: user.name
    });

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
  resetFailedAttempts(operator.id);
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
 * Brute-Force Protection & Security Lockout Logic
 */
function getLockoutData() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_LOCKOUT_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function saveLockoutData(data) {
  localStorage.setItem(LOCAL_STORAGE_LOCKOUT_KEY, JSON.stringify(data));
}

export function getLockoutStatus(userId) {
  const allData = getLockoutData();
  const userData = allData[userId] || { failedAttempts: 0, lockedUntil: 0, lockCount: 0 };
  
  const now = Date.now();
  if (userData.lockedUntil && userData.lockedUntil > now) {
    const remainingSeconds = Math.ceil((userData.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      failedAttempts: userData.failedAttempts
    };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts: userData.failedAttempts
  };
}

export function recordFailedPinAttempt(user) {
  const allData = getLockoutData();
  const userData = allData[user.id] || { failedAttempts: 0, lockedUntil: 0, lockCount: 0 };

  userData.failedAttempts += 1;
  const count = userData.failedAttempts;

  let lockDurationMs = 0;
  if (count === 3) {
    lockDurationMs = 30 * 1000; // 30s
    userData.lockCount += 1;
  } else if (count === 5) {
    lockDurationMs = 120 * 1000; // 2 min
    userData.lockCount += 1;
  } else if (count >= 6) {
    lockDurationMs = 300 * 1000; // 5 min
    userData.lockCount += 1;
  }

  if (lockDurationMs > 0) {
    userData.lockedUntil = Date.now() + lockDurationMs;
  }

  allData[user.id] = userData;
  saveLockoutData(allData);

  // Log to Audit History
  logAuditAction({
    action: lockDurationMs > 0 ? '🚨 BLOKADA ANTYWŁAMANIOWA' : '⚠️ BŁĘDNY PIN',
    details: lockDurationMs > 0 
      ? `Zablokowano konto ${user.name} na ${lockDurationMs / 1000}s z powodu ${count} błędnych prób logowania!`
      : `Nieudana próba logowania do konta: ${user.name} (Próba ${count}/3)`,
    operator: `Nieznany (Próba na konto: ${user.name})`
  });

  // Post alert into Odoo Discuss channel (#Wszystko) if 3+ attempts
  if (count >= 3) {
    sendOdooSecurityAlert(user.name, count, Math.round(lockDurationMs / 1000));
  }

  return {
    isLocked: lockDurationMs > 0,
    remainingSeconds: Math.ceil(lockDurationMs / 1000),
    failedAttempts: count
  };
}

export function resetFailedAttempts(userId) {
  const allData = getLockoutData();
  if (allData[userId]) {
    allData[userId].failedAttempts = 0;
    allData[userId].lockedUntil = 0;
    saveLockoutData(allData);
  }
}

async function sendOdooSecurityAlert(targetUserName, attemptsCount, lockDurationSec) {
  try {
    const msg = `🚨 <strong>ALERT BEZPIECZEŃSTWA BLUEMAKE:</strong><br/>` +
      `Wykryto <strong>${attemptsCount} nieudanych prób logowania</strong> na konto <strong>${targetUserName}</strong> w aplikacji warsztatowej!<br/>` +
      `🔒 System nałożył automatyczną blokadę czasową na <strong>${lockDurationSec} sekund</strong>.<br/>` +
      `Data: ${new Date().toLocaleString('pl-PL')}`;

    await callOdooRpc('mail.message', 'create', [{
      model: 'discuss.channel',
      res_id: 11, // #Wszystko
      body: msg,
      message_type: 'comment',
      subtype_id: 1
    }]);
  } catch (err) {
    console.warn('Could not send security alert to Odoo:', err);
  }
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
