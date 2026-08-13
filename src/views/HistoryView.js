import { checkApiStatus, getHistory, syncPendingItems } from '../services/odooApi.js';
import { openSettingsModal } from './SettingsModal.js';
import { getCurrentOperator, openLoginModal } from '../services/authService.js';

export function renderHistoryView(container, navigateTo) {
  const currentOp = getCurrentOperator();

  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-[64px]">
      <div id="nav-back" class="flex items-center gap-4 cursor-pointer">
        <span class="material-symbols-outlined text-primary">arrow_back</span>
        <span class="font-headline-md text-headline-md font-bold text-primary">Bluemake</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-switch-op" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-primary px-3 py-1.5 rounded-full border border-outline-variant text-xs font-bold transition-all active:scale-95">
          <span class="material-symbols-outlined text-[16px]">account_circle</span>
          <span>${currentOp ? currentOp.name : 'Zaloguj'}</span>
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
        <h3 class="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-2">Ostatnie Aktywności i Audyt Zmian</h3>
        <div id="history-items-list" class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
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
    const listEl = container.querySelector('#history-items-list');

    if (!history || history.length === 0) {
      listEl.innerHTML = `
        <div class="p-stack-md text-center text-on-surface-variant">Brak zarejestrowanych operacji</div>
      `;
      return;
    }

    listEl.innerHTML = history.map(item => `
      <div class="p-stack-md border-b border-outline-variant/60 hover:bg-surface-container-low flex flex-col gap-stack-sm transition-colors">
        <div class="flex flex-col md:flex-row gap-stack-md justify-between items-start md:items-center">
          <div class="flex items-start gap-4">
            <div class="bg-surface-container p-3 rounded-full flex-shrink-0">
              <span class="material-symbols-outlined text-on-surface-variant">cut</span>
            </div>
            <div>
              <div class="font-body-lg text-body-lg text-primary font-bold">${item.title}</div>
              <div class="font-body-md text-body-md text-on-surface-variant mt-1">${item.details}</div>
              <div class="flex items-center gap-2 mt-2">
                <span class="font-label-caps text-label-caps text-outline">${item.time}</span>
                <span class="text-outline">•</span>
                <span class="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded border border-primary/20">
                  <span class="material-symbols-outlined text-[13px]">person</span>
                  <span>${item.operator || 'Paweł Peret'}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 ${
            item.status === 'SYNCHRONIZED' 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : item.status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
              : 'bg-red-100 text-red-800 border-red-300'
          } border px-3 py-1 rounded-full font-label-caps text-label-caps self-start md:self-auto font-bold">
            <span class="material-symbols-outlined text-[16px] ${item.status === 'PENDING' ? 'animate-spin' : ''}">
              ${item.status === 'SYNCHRONIZED' ? 'check_circle' : item.status === 'PENDING' ? 'sync' : 'error'}
            </span>
            ${item.status}
          </div>
        </div>
        ${item.error ? `
          <div class="ml-14 text-xs font-mono bg-red-50 text-red-700 border border-red-200 p-2 rounded flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">warning</span>
            <span>Błąd synchronizacji: ${item.error}</span>
          </div>
        ` : ''}
      </div>
    `).join('');
  }
    `).join('');
  container.querySelector('#btn-switch-op').addEventListener('click', () => {
    openLoginModal(() => {
      renderHistoryView(container, navigateTo);
    });
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
