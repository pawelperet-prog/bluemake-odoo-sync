/**
 * Operator Authentication, Role-Based Access Control, Brute-Force Lockout & Audit Log Service
 */
import { callOdooRpc } from './odooApi.js';

const LOCAL_STORAGE_USERS_KEY = 'bluemake_users_credentials_v4';
const LOCAL_STORAGE_OPERATOR_KEY = 'bluemake_active_operator_v4';
const LOCAL_STORAGE_LOGGED_IN_KEY = 'bluemake_is_logged_in_v4';
const LOCAL_STORAGE_AUDIT_LOGS_KEY = 'bluemake_audit_logs_v4';
const LOCAL_STORAGE_LOCKOUT_KEY = 'bluemake_security_lockout_v4';
const LOCAL_STORAGE_SITE_AUTH_KEY = 'bluemake_site_master_auth_v1';

export const MASTER_SITE_PASSWORD = 'Szymon_Mateusz2025';

export function isSiteUnlocked() {
  return localStorage.getItem(LOCAL_STORAGE_SITE_AUTH_KEY) === 'UNLOCKED_OK';
}

export function verifySitePassword(pass) {
  if (pass && pass.trim() === MASTER_SITE_PASSWORD) {
    localStorage.setItem(LOCAL_STORAGE_SITE_AUTH_KEY, 'UNLOCKED_OK');
    return true;
  }
  return false;
}

export function lockSite() {
  localStorage.removeItem(LOCAL_STORAGE_SITE_AUTH_KEY);
  localStorage.removeItem(LOCAL_STORAGE_LOGGED_IN_KEY);
}

// 4 Initial Operators with PIN 1234
export const INITIAL_USERS = [
  { id: 1, name: 'Paweł', role: 'ADMIN', roleLabel: 'Administrator', pin: '1234', hasChangedPin: false, avatar: 'admin_panel_settings' },
  { id: 2, name: 'Mateusz', role: 'ADMIN', roleLabel: 'Administrator', pin: '1234', hasChangedPin: false, avatar: 'manage_accounts' },
  { id: 3, name: 'Szymon', role: 'OPERATOR', roleLabel: 'Magazynier', pin: '1234', hasChangedPin: false, avatar: 'inventory' },
  { id: 4, name: 'Patryk', role: 'OPERATOR', roleLabel: 'Magazynier', pin: '1234', hasChangedPin: false, avatar: 'precision_manufacturing' }
];

export function getUsers() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || localStorage.getItem('bluemake_users_credentials_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        const merged = INITIAL_USERS.map(initUser => {
          const found = parsed.find(p => p.id === initUser.id || p.name === initUser.name);
          return found 
            ? { ...initUser, ...found, pin: String(found.pin || initUser.pin).trim() } 
            : initUser;
        });
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(merged));
        return merged;
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

export function getUserById(userId) {
  const users = getUsers();
  return users.find(u => u.id === Number(userId)) || null;
}

export function verifyUserPin(userId, pin) {
  const user = getUserById(userId);
  if (!user) return false;
  return String(user.pin).trim() === String(pin).trim();
}

export function changeUserPin(userId, newPin) {
  const users = getUsers();
  const user = users.find(u => u.id === Number(userId));
  if (user) {
    user.pin = String(newPin).trim();
    user.hasChangedPin = true;
    saveUsers(users);

    logAuditAction({
      category: 'AUTH',
      action: '🔑 ZMIANA PINU',
      details: `Użytkownik ${user.name} zmienił swój kod PIN na nowy`,
      operator: user.name,
      operatorRole: user.role,
      status: 'SUCCESS'
    });

    const current = getCurrentOperator();
    if (current && current.id === user.id) {
      current.pin = user.pin;
      current.hasChangedPin = true;
      saveCurrentOperator(current);
    }
    return true;
  }
  return false;
}

export function verifyAndChangePin(userId, oldPin, newPin) {
  const user = getUserById(userId);
  if (!user) {
    return { success: false, error: 'Nie znaleziono profilu operatora!' };
  }
  if (String(user.pin).trim() !== String(oldPin).trim()) {
    return { success: false, error: 'Obecny kod PIN jest nieprawidłowy!' };
  }
  const cleanNewPin = String(newPin).trim();
  if (!/^\d{4}$/.test(cleanNewPin)) {
    return { success: false, error: 'Nowy PIN musi składać się dokładnie z 4 cyfr!' };
  }
  if (cleanNewPin === String(oldPin).trim()) {
    return { success: false, error: 'Nowy PIN musi różnić się od obecnego!' };
  }

  const success = changeUserPin(user.id, cleanNewPin);
  return { success, error: success ? null : 'Błąd podczas zapisywania nowego kodu PIN.' };
}

export function isUserLoggedIn() {
  return localStorage.getItem(LOCAL_STORAGE_LOGGED_IN_KEY) === 'true';
}

export function setLoggedIn(operator) {
  const freshUser = getUserById(operator?.id) || operator;
  localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_KEY, 'true');
  saveCurrentOperator(freshUser);
  resetFailedAttempts(freshUser.id);
  logAuditAction({
    category: 'AUTH',
    action: '🟢 LOGOWANIE',
    details: `Zalogowano operatora ${freshUser.name} (${freshUser.roleLabel})`,
    operator: freshUser.name,
    operatorRole: freshUser.role,
    status: 'SUCCESS'
  });
}

export function getCurrentOperator() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OPERATOR_KEY) || localStorage.getItem('bluemake_active_operator_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      const freshUser = getUserById(parsed?.id);
      return freshUser || parsed;
    }
  } catch (e) {}
  return getUsers()[0];
}

export function saveCurrentOperator(operator) {
  localStorage.setItem(LOCAL_STORAGE_OPERATOR_KEY, JSON.stringify(operator));
}

export function switchActiveOperator(operatorIdOrName) {
  const users = getUsers();
  const found = users.find(u => 
    u.id === Number(operatorIdOrName) || 
    (u.name && u.name.toLowerCase() === String(operatorIdOrName).toLowerCase())
  );
  if (found) {
    saveCurrentOperator(found);
    localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_KEY, 'true');
    logAuditAction({
      category: 'AUTH',
      action: '🔄 PRZEŁĄCZENIE OPERATORA',
      details: `Przełączono aktywnego operatora na: ${found.name} (${found.roleLabel || found.role})`,
      operator: found.name,
      operatorRole: found.role,
      status: 'SUCCESS'
    });
    window.dispatchEvent(new CustomEvent('bluemake_operator_changed', { detail: found }));
    return found;
  }
  return null;
}

export function logoutOperator() {
  const op = getCurrentOperator();
  if (op) {
    logAuditAction({
      category: 'AUTH',
      action: '🔴 WYLOGOWANIE',
      details: `Wylogowano operatora ${op.name}`,
      operator: op.name,
      operatorRole: op.role,
      status: 'INFO'
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
    const data = localStorage.getItem(LOCAL_STORAGE_LOCKOUT_KEY) || localStorage.getItem('bluemake_security_lockout_v3');
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
    category: 'AUTH',
    action: lockDurationMs > 0 ? '🚨 BLOKADA ANTYWŁAMANIOWA' : '⚠️ BŁĘDNY PIN',
    details: lockDurationMs > 0 
      ? `Zablokowano konto ${user.name} na ${lockDurationMs / 1000}s z powodu ${count} błędnych prób logowania!`
      : `Nieudana próba logowania do konta: ${user.name} (Próba ${count}/3)`,
    operator: `Nieznany (Próba na: ${user.name})`,
    status: lockDurationMs > 0 ? 'ERROR' : 'WARNING'
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
 * Universal Audit Logging - Complete History of all System Actions
 */
export function logAuditAction(firstArg, secondArg = null, thirdArg = null) {
  try {
    let id = null;
    let action = 'OPERACJA';
    let details = '';
    let operator = null;
    let operatorRole = null;
    let sku = null;
    let category = 'SYSTEM';
    let status = 'SUCCESS';
    let error = null;
    let metadata = null;

    if (typeof firstArg === 'string') {
      const actionMap = {
        'ZMIANA_ILOSCI_WYPRODUKOWANEJ': '🔢 ZMIANA WYKONANYCH SZTUK',
        'ZMIANA_STATUSU_ZAMOWIENIA': '🏷️ ZMIANA STATUSU ZLECENIA',
        'ZMIANA_STATUSU_POZYCJI': '⚙️ ZMIANA STATUSU DETALU',
        'ARCHIWIZACJA_ZAMOWIENIA': '📦 ARCHIWIZACJA ZLECENIA',
        'PRZYWROCENIE_Z_ARCHIWUM': '🔄 PRZYWRÓCENIE Z ARCHIWUM',
        'USUNIECIE_ZAMOWIENIA': '🗑️ USUNIĘCIE ZLECENIA',
        'PODPIECIE_PDF_ZLECENIA': '📎 PODPIĘCIE PLIKU PDF',
        'UTWORZENIE_ZAMOWIENIA': '✨ NOWE ZLECENIE'
      };
      action = actionMap[firstArg] || firstArg;
      category = 'ORDER';

      if (secondArg && typeof secondArg === 'object') {
        const parts = [];
        if (secondArg.numer) parts.push(`Zlecenie: ${secondArg.numer}`);
        if (secondArg.symbol) parts.push(`Detal: ${secondArg.symbol}`);
        if (secondArg.producedQty !== undefined) parts.push(`Ilość: ${secondArg.producedQty} szt.`);
        if (secondArg.status) parts.push(`Status: ${secondArg.status}`);
        if (secondArg.oldStatus) parts.push(`(Poprzednio: ${secondArg.oldStatus})`);
        if (secondArg.pdfName) parts.push(`Plik: ${secondArg.pdfName}`);
        if (secondArg.orderId && !secondArg.numer) parts.push(`ID: ${secondArg.orderId}`);
        details = parts.join(' • ') || JSON.stringify(secondArg);
        sku = secondArg.symbol || secondArg.sku || null;
        operator = secondArg.operator || thirdArg;
        metadata = secondArg;
      } else {
        details = String(secondArg || '');
        operator = thirdArg;
      }
    } else if (firstArg && typeof firstArg === 'object') {
      id = firstArg.id || null;
      action = firstArg.action || 'OPERACJA';
      details = firstArg.details || '';
      operator = firstArg.operator || null;
      operatorRole = firstArg.operatorRole || null;
      sku = firstArg.sku || null;
      category = firstArg.category || 'SYSTEM';
      status = firstArg.status || 'SUCCESS';
      error = firstArg.error || null;
      metadata = firstArg.metadata || null;
    }

    const curOp = getCurrentOperator();
    const opName = operator || curOp?.name || 'Operator';
    const opRole = operatorRole || curOp?.role || (opName === 'Paweł' || opName === 'Mateusz' ? 'ADMIN' : 'OPERATOR');
    const logs = getAuditLogs();
    
    const now = new Date();
    const entryId = id || (Date.now() + Math.floor(Math.random() * 1000));
    
    // Check if an entry with this ID already exists
    const existingIdx = logs.findIndex(l => l.id === entryId);
    const entry = {
      id: entryId,
      timestamp: now.toISOString(),
      dateFormatted: now.toLocaleString('pl-PL'),
      timeShort: now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateOnly: now.toISOString().split('T')[0],
      operator: opName,
      operatorRole: opRole,
      category: category || 'SYSTEM',
      action: action || 'OPERACJA',
      details: details || '',
      sku: sku || '',
      status: status || 'SUCCESS',
      error: error || null,
      metadata: metadata || null
    };
    
    if (existingIdx >= 0) {
      logs[existingIdx] = { ...logs[existingIdx], ...entry };
    } else {
      logs.unshift(entry);
    }
    
    // Keep last 1000 actions in persistent storage
    localStorage.setItem(LOCAL_STORAGE_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 1000)));

    // Asynchronously push to central server so ALL operators (Paweł, Mateusz, etc.) see it on all devices
    try {
      fetch('/api/sync/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry })
      }).catch(() => {});
    } catch (_) {}

    return entry;
  } catch (e) {
    console.warn('Could not save audit log:', e);
  }
}

export function updateAuditLogStatus(id, newStatus, errorMsg = null) {
  try {
    const logs = getAuditLogs();
    const found = logs.find(l => l.id === id);
    if (found) {
      found.status = newStatus;
      if (errorMsg !== undefined) found.error = errorMsg;
      localStorage.setItem(LOCAL_STORAGE_AUDIT_LOGS_KEY, JSON.stringify(logs));

      try {
        fetch('/api/sync/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: found })
        }).catch(() => {});
      } catch (_) {}

      return true;
    }
  } catch (e) {
    console.warn('Could not update audit log status:', e);
  }
  return false;
}

export function getAuditLogs() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_AUDIT_LOGS_KEY) || localStorage.getItem('bluemake_audit_logs_v3');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Scrub out fake / mock entries (e.g. S355-FI20 mock records)
        return parsed.filter(log => {
          if (!log) return false;
          if (log.sku === 'S355-FI20' && (log.details?.includes('14.0m') || log.action?.includes('Ucięcie') || log.title?.includes('Ucięcie'))) return false;
          if (log.sku === 'S235-PL10' && (log.details?.includes('150 szt.') || log.action?.includes('Przyjęcie') || log.title?.includes('Przyjęcie'))) return false;
          return true;
        });
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Fetch and merge audit logs from central server (loads actions by Mateusz and other operators)
 */
export async function fetchServerAuditLogs() {
  try {
    const res = await fetch('/api/sync/audit-logs');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.logs)) {
        const local = getAuditLogs();
        const map = new Map();
        local.forEach(l => { if (l && l.id) map.set(l.id, l); });
        data.logs.forEach(l => { if (l && l.id) map.set(l.id, l); });

        const merged = Array.from(map.values()).sort((a, b) => {
          const timeA = new Date(a.timestamp || a.id).getTime() || 0;
          const timeB = new Date(b.timestamp || b.id).getTime() || 0;
          return timeB - timeA;
        });

        localStorage.setItem(LOCAL_STORAGE_AUDIT_LOGS_KEY, JSON.stringify(merged.slice(0, 1500)));

        // If local had unsynced entries, sync merged collection back to server
        if (local.length > data.logs.length) {
          fetch('/api/sync/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: merged })
          }).catch(() => {});
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Could not fetch server audit logs:', e);
  }
  return getAuditLogs();
}

// Background initial sync
setTimeout(() => {
  fetchServerAuditLogs().catch(() => {});
}, 1000);

export function clearAuditLogs() {
  localStorage.setItem(LOCAL_STORAGE_AUDIT_LOGS_KEY, JSON.stringify([]));
  localStorage.removeItem('odoo_sync_history');
  localStorage.removeItem('bluemake_audit_logs_v3');
  try {
    fetch('/api/sync/audit-logs', { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
}

