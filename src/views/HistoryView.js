import { checkApiStatus, getHistory, syncPendingItems } from '../services/odooApi.js';
import { openSettingsModal } from './SettingsModal.js';
import { getCurrentOperator, logoutOperator, getAuditLogs, isAdmin } from '../services/authService.js';

export function renderHistoryView(container, navigateTo) {
  const currentOp = getCurrentOperator();
  const isOpAdmin = isAdmin(currentOp);

  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-[64px]">
      <div id="nav-back" class="flex items-center gap-4 cursor-pointer">
        <span class="material-symbols-outlined text-primary">arrow_back</span>
        <span class="font-headline-md text-headline-md font-bold text-primary">Bluemake</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-switch-op" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-primary px-3 py-1.5 rounded-full border border-outline-variant text-xs font-bold transition-all active:scale-95">
          <span class="material-symbols-outlined text-[16px]">${isOpAdmin ? 'admin_panel_settings' : 'account_circle'}</span>
          <span>${currentOp ? currentOp.name : 'Zaloguj'}</span>
          <span class="text-[9px] px-1 rounded ${isOpAdmin ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-800'} font-bold">${isOpAdmin ? 'ADMIN' : 'MAGAZYN'}</span>
        </button>
        <span id="hdr-settings" class="material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-high rounded-full p-2">settings_remote</span>
      </div>
    </header>

    <main class="flex-grow flex flex-col px-margin-mobile py-stack-lg max-w-4xl mx-auto w-full gap-stack-lg mt-[64px] pb-[90px]">
      <!-- Status Section -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col gap-stack-sm md:flex-row md:items-center md:justify-between shadow-sm mt-2">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <h2 class="font-headline-md text-headline-md text-primary">API Connection Status</h2>
            <button id="btn-edit-cfg" class="text-xs bg-surface-container px-2 py-1 rounded font-mono hover:bg-surface-container-high text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">edit</span> Edytuj
            </button>
          </div>
          <div id="api-info" class="flex flex-wrap items-center gap-3 text-on-surface-variant font-body-md text-body-md">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Odoo API: <strong class="text-on-surface">Sprawdzanie...</strong></span>
            </div>
          </div>
        </div>
        <button id="btn-sync-now" class="bg-[#FF6B00] hover:bg-orange-600 text-white font-label-caps text-label-caps px-6 h-touch-target-min rounded flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100 shadow-md uppercase font-bold">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">sync</span>
          SYNCHRONIZUJ TERAZ
        </button>
      </section>

      <!-- History List -->
      <section class="flex flex-col gap-stack-md">
        <div class="flex justify-between items-center border-b border-outline-variant pb-2">
          <h3 class="font-headline-md text-headline-md text-on-surface">Pełna Historia Aktywności & Audyt Operatorów</h3>
          <span class="text-xs text-on-surface-variant font-bold">${isOpAdmin ? '👑 Widok Administratora' : '📦 Widok Magazyniera'}</span>
        </div>
        
        <div id="history-items-list" class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col divide-y divide-outline-variant/50">
          <!-- Populated dynamically -->
        </div>
      </section>
    </main>

    <!-- BottomNavBar -->
    <nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface px-margin-mobile border-t border-outline-variant shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <button id="nav-dashboard" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded active:scale-90 transition-all duration-150">
        <span class="material-symbols-outlined">dashboard</span>
        <span class="font-label-caps text-label-caps mt-1">Dashboard</span>
      </button>
      <button id="nav-scanner" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded active:scale-90 transition-all duration-150">
        <span class="material-symbols-outlined">barcode_scanner</span>
        <span class="font-label-caps text-label-caps mt-1">Scanner</span>
      </button>
      <button class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 active:scale-90 transition-all duration-150">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">history</span>
        <span class="font-label-caps text-label-caps mt-1">History</span>
      </button>
    </nav>
  `;

  async function updateApiStatus() {
    const status = await checkApiStatus();
    const infoEl = container.querySelector('#api-info');
    infoEl.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ${status.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
        <span>Odoo API: <strong class="${status.connected ? 'text-green-700' : 'text-red-700'}">${status.connected ? 'Connected' : 'Offline'}</strong></span>
      </div>
      <span class="text-outline">|</span>
      <span>Wersja: <strong>${status.serverVersion}</strong></span>
      <span class="text-outline">|</span>
      <span>UID: <strong>${status.uid}</strong></span>
      <span class="text-outline">|</span>
      <span>Database: <strong>${status.db}</strong></span>
      ${status.error ? `<div class="w-full text-xs text-red-600 mt-1 font-mono bg-red-50 p-1.5 rounded border border-red-200">Błąd połączenia: ${status.error}</div>` : ''}
    `;
  }

  function renderHistoryItems() {
    const history = getHistory();
    const auditLogs = getAuditLogs();
    const listEl = container.querySelector('#history-items-list');

    if ((!history || history.length === 0) && (!auditLogs || auditLogs.length === 0)) {
      listEl.innerHTML = `
        <div class="p-stack-md text-center text-on-surface-variant">Brak zarejestrowanych operacji w bazie.</div>
      `;
      return;
    }

    // Combine audit logs and history items
    const combined = [
      ...auditLogs.map(a => ({
        type: 'AUDIT',
        title: `${a.action}: ${a.details}`,
        details: `Operator: <strong>${a.operator}</strong>`,
        time: a.dateFormatted || 'Niedawno',
        operator: a.operator,
        status: 'AUDIT_LOG',
        rawTime: a.id
      })),
      ...history.map(h => ({
        type: 'SYNC',
        title: h.title,
        details: h.details,
        time: h.time,
        operator: h.operator,
        status: h.status,
        error: h.error,
        rawTime: h.id
      }))
    ].sort((a, b) => b.rawTime - a.rawTime);

    listEl.innerHTML = combined.map(item => `
      <div class="p-3.5 hover:bg-surface-container-low flex flex-col gap-1.5 transition-colors">
        <div class="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-xl flex-shrink-0 ${item.type === 'AUDIT' ? 'bg-indigo-100 text-indigo-800' : 'bg-surface-container text-primary'}">
              <span class="material-symbols-outlined text-[20px]">
                ${item.type === 'AUDIT' ? 'verified_user' : 'inventory_2'}
              </span>
            </div>
            <div>
              <div class="text-sm font-bold text-primary">${item.title}</div>
              <div class="text-xs text-on-surface-variant mt-0.5">${item.details}</div>
              <div class="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <span class="font-mono text-[11px]">${item.time}</span>
                <span>•</span>
                <span class="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[11px] border border-primary/20">
                  <span class="material-symbols-outlined text-[13px]">person</span>
                  <span>${item.operator || 'Paweł Peret'}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold self-start md:self-auto ${
            item.status === 'SYNCHRONIZED' 
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
              : item.status === 'AUDIT_LOG'
              ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
              : item.status === 'PENDING'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-rose-100 text-rose-900 border border-rose-300'
          }">
            <span class="material-symbols-outlined text-[14px]">
              ${item.status === 'SYNCHRONIZED' ? 'check_circle' : item.status === 'AUDIT_LOG' ? 'fingerprint' : 'sync'}
            </span>
            <span>${item.status === 'AUDIT_LOG' ? 'LOG SYSTEMOWY' : item.status}</span>
          </div>
        </div>
        ${item.error ? `
          <div class="ml-11 text-xs font-mono bg-rose-50 text-rose-800 border border-rose-200 p-2 rounded flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">warning</span>
            <span>Błąd synchronizacji: ${item.error}</span>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  container.querySelector('#btn-switch-op').addEventListener('click', () => {
    if (confirm(`Wylogować operatora ${currentOp?.name}?`)) {
      logoutOperator();
      navigateTo('login');
    }
  });

  const syncBtn = container.querySelector('#btn-sync-now');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin">sync</span>
      SYNCHRONIZOWANIE...
    `;
    await syncPendingItems();
    await updateApiStatus();
    renderHistoryItems();
    syncBtn.disabled = false;
    syncBtn.innerHTML = `
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">sync</span>
      SYNCHRONIZUJ TERAZ
    `;
  });

  const openSettings = () => {
    openSettingsModal(() => {
      updateApiStatus();
      renderHistoryItems();
    });
  };

  container.querySelector('#hdr-settings').addEventListener('click', openSettings);
  container.querySelector('#btn-edit-cfg').addEventListener('click', openSettings);

  container.querySelector('#nav-back').addEventListener('click', () => navigateTo('dashboard'));
  container.querySelector('#nav-dashboard').addEventListener('click', () => navigateTo('dashboard'));
  container.querySelector('#nav-scanner').addEventListener('click', () => navigateTo('scanner'));

  updateApiStatus();
  renderHistoryItems();
}
