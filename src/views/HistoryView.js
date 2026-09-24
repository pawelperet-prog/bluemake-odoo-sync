import { checkApiStatus, getHistory, syncPendingItems } from '../services/odooApi.js';
import { openSettingsModal } from './SettingsModal.js';
import { getCurrentOperator, logoutOperator, getAuditLogs, clearAuditLogs, isAdmin } from '../services/authService.js';
import { openOperatorModal } from './OperatorModal.js';

export function renderHistoryView(container, navigateTo) {
  const currentOp = getCurrentOperator();
  const isOpAdmin = isAdmin(currentOp);

  // Filter States
  let activeTimeRange = '3D'; // 'TODAY' | '3D' | '7D' | '30D' | 'ALL'
  let activeCategory = 'ALL'; // 'ALL' | 'STOCK' | 'EMPLOYEE' | 'WZ' | 'JAW' | 'ORDER' | 'AUTH' | 'CONFIG'
  let activeOperator = 'ALL'; // 'ALL' | 'Paweł' | 'Mateusz' | 'Szymon' | 'Patryk'
  let searchQuery = '';

  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-[64px] shadow-sm">
      <div id="nav-back" class="flex items-center gap-3 cursor-pointer select-none">
        <div class="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-primary flex items-center justify-center">
          <span class="material-symbols-outlined text-[24px]">arrow_back</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-headline-md text-headline-md font-bold text-primary tracking-tight">Bluemake</span>
          <span class="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">LOGI & AUDYT</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-switch-op" title="Konto operatora" class="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-primary px-3 py-1.5 rounded-full border border-outline-variant text-xs font-bold transition-all active:scale-95">
          <span class="material-symbols-outlined text-[16px]">${isOpAdmin ? 'admin_panel_settings' : 'account_circle'}</span>
          <span>${currentOp ? currentOp.name : 'Zaloguj'}</span>
          <span class="text-[9px] px-1 rounded ${isOpAdmin ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-800'} font-bold">${isOpAdmin ? 'ADMIN' : 'MAGAZYN'}</span>
        </button>
        <span id="hdr-settings" title="Ustawienia API" class="material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-high rounded-full p-2 transition-colors">settings_remote</span>
      </div>
    </header>

    <main class="flex-grow flex flex-col px-margin-mobile py-stack-md max-w-6xl mx-auto w-full gap-4 mt-[64px] pb-[100px]">
      
      <!-- Top Connection & Sync Section -->
      <section class="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <h2 class="font-bold text-sm text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-[18px]">cloud_sync</span>
              <span>Połączenie z serwerem Odoo 19</span>
            </h2>
            <button id="btn-edit-cfg" class="text-[11px] bg-surface-container px-2 py-0.5 rounded font-mono hover:bg-surface-container-high text-primary flex items-center gap-1 border border-outline-variant/40">
              <span class="material-symbols-outlined text-[12px]">edit</span> Edytuj API
            </button>
          </div>
          <div id="api-info" class="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-mono">
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
              <span>Sprawdzanie statusu...</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-2 flex-wrap">
          <button id="btn-sync-now" class="bg-[#ff6b00] hover:bg-[#e66000] text-white font-label-caps px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>SYNCHRONIZUJ</span>
          </button>
          <button id="btn-export-csv" title="Pobierz przefiltrowany dziennik zdarzeń w formacie CSV" class="bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95">
            <span class="material-symbols-outlined text-[16px]">download</span>
            <span>EKSPORT CSV</span>
          </button>
          <button id="btn-print-audit" title="Drukuj elegancki raport audytu" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">print</span>
            <span>DRUKUJ RAPORT</span>
          </button>
          ${isOpAdmin ? `
            <button id="btn-clear-logs" title="Wyczyść archiwalne logi" class="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 px-2.5 py-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-all active:scale-95">
              <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
            </button>
          ` : ''}
        </div>
      </section>

      <!-- KPI Stats Banner -->
      <section class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
          <div class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-primary text-[15px]">event_note</span>
            <span>Zdarzenia w okresie</span>
          </div>
          <div id="stat-total" class="text-2xl font-bold font-mono text-primary">0</div>
          <div id="stat-range-label" class="text-[10px] text-on-surface-variant">Ostatnie 3 dni</div>
        </div>

        <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
          <div class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-emerald-400 text-[15px]">inventory_2</span>
            <span>Magazyn & Stany</span>
          </div>
          <div id="stat-stock" class="text-2xl font-bold font-mono text-emerald-400">0</div>
          <div class="text-[10px] text-on-surface-variant">Korekty, ucięcia, przyjęcia</div>
        </div>

        <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
          <div class="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-purple-400 text-[15px]">badge</span>
            <span>Kadry & Urlopy</span>
          </div>
          <div id="stat-emp" class="text-2xl font-bold font-mono text-purple-400">0</div>
          <div class="text-[10px] text-on-surface-variant">Wnioski, badania, uwagi</div>
        </div>

        <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
          <div class="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-amber-400 text-[15px]">security</span>
            <span>Dostęp & Bezpieczeństwo</span>
          </div>
          <div id="stat-auth" class="text-2xl font-bold font-mono text-amber-400">0</div>
          <div class="text-[10px] text-on-surface-variant">Logowania, PIN, blokady</div>
        </div>
      </section>

      <!-- Advanced Filter Toolbar -->
      <section class="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3.5 flex flex-col gap-3 shadow-sm">
        
        <!-- Row 1: Time Range Filters (Key Feature: 3 Days, Today, 7D, 30D, All) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/40 pb-2.5">
          <div class="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
            <span class="material-symbols-outlined text-primary text-[16px]">calendar_month</span>
            <span>ZAKRES CZASU:</span>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button data-range="TODAY" class="time-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTimeRange === 'TODAY' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              Dzisiaj
            </button>
            <button data-range="3D" class="time-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTimeRange === '3D' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              ⏱️ Ostatnie 3 dni
            </button>
            <button data-range="7D" class="time-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTimeRange === '7D' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              7 dni
            </button>
            <button data-range="30D" class="time-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTimeRange === '30D' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              30 dni
            </button>
            <button data-range="ALL" class="time-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTimeRange === 'ALL' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              Wszystkie
            </button>
          </div>
        </div>

        <!-- Row 2: Category Module Pills & Operator Select -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <!-- Category Pills -->
          <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button data-cat="ALL" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all ${activeCategory === 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              Wszystkie moduły
            </button>
            <button data-cat="STOCK" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${activeCategory === 'STOCK' ? 'bg-emerald-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              <span class="material-symbols-outlined text-[14px]">inventory_2</span>
              <span>Magazyn</span>
            </button>
            <button data-cat="EMPLOYEE" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${activeCategory === 'EMPLOYEE' ? 'bg-purple-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              <span class="material-symbols-outlined text-[14px]">badge</span>
              <span>Kadry & Urlopy</span>
            </button>
            <button data-cat="WZ" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${activeCategory === 'WZ' ? 'bg-amber-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              <span class="material-symbols-outlined text-[14px]">description</span>
              <span>Dokumenty WZ</span>
            </button>
            <button data-cat="JAW" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${activeCategory === 'JAW' ? 'bg-blue-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              <span class="material-symbols-outlined text-[14px]">precision_manufacturing</span>
              <span>Szczęki CNC</span>
            </button>
            <button data-cat="ORDER" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${activeCategory === 'ORDER' ? 'bg-indigo-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              <span class="material-symbols-outlined text-[14px]">receipt_long</span>
              <span>Zamówienia</span>
            </button>
            <button data-cat="AUTH" class="cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${activeCategory === 'AUTH' ? 'bg-rose-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
              <span class="material-symbols-outlined text-[14px]">shield</span>
              <span>Bezpieczeństwo</span>
            </button>
          </div>

          <!-- Operator and Search Inputs -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select id="operator-filter-select" class="bg-surface-container-high text-primary font-bold text-xs rounded-lg px-2.5 py-1.5 border border-outline-variant focus:ring-2 focus:ring-primary flex-shrink-0">
              <option value="ALL">👤 Wszyscy operatorzy</option>
              <option value="Paweł" ${activeOperator === 'Paweł' ? 'selected' : ''}>👑 Paweł Peret (Admin)</option>
              <option value="Mateusz" ${activeOperator === 'Mateusz' ? 'selected' : ''}>👑 Mateusz Klimkowski (Admin)</option>
              <option value="Szymon" ${activeOperator === 'Szymon' ? 'selected' : ''}>📦 Szymon Klimkowski</option>
              <option value="Patryk" ${activeOperator === 'Patryk' ? 'selected' : ''}>📦 Patryk Majka</option>
            </select>

            <div class="relative flex-1 min-w-[150px]">
              <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
              <input id="log-search-input" type="text" placeholder="Szukaj SKU / akcji / tekstu..." class="w-full pl-8 pr-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary focus:bg-surface font-body-md" value="${searchQuery}" />
            </div>
          </div>
        </div>
      </section>

      <!-- History List Section -->
      <section class="flex flex-col gap-2">
        <div class="flex justify-between items-center px-1">
          <h3 class="font-bold text-sm text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]">history</span>
            <span>Dziennik zdarzeń i zmian</span>
            <span id="results-count-badge" class="text-xs px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono font-bold">0 wpisów</span>
          </h3>
          <span class="text-xs text-on-surface-variant font-bold">${isOpAdmin ? '👑 Widok Administratora (Pełny Dostęp)' : '📦 Widok Magazyniera'}</span>
        </div>
        
        <div id="history-items-list" class="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden flex flex-col divide-y divide-outline-variant/40 shadow-sm">
          <!-- Populated dynamically -->
        </div>
      </section>
    </main>

    <!-- BottomNavBar (Mobile Only) -->
    <nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface px-margin-mobile border-t border-outline-variant shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <button id="nav-dashboard" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded active:scale-90 transition-all duration-150">
        <span class="material-symbols-outlined">dashboard</span>
        <span class="font-label-caps text-[10px] mt-1">Magazyn</span>
      </button>
      <button id="nav-scanner" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded active:scale-90 transition-all duration-150">
        <span class="material-symbols-outlined">barcode_scanner</span>
        <span class="font-label-caps text-[10px] mt-1">Skaner</span>
      </button>
      <button class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 active:scale-90 transition-all duration-150">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">history</span>
        <span class="font-label-caps text-[10px] mt-1">Historia</span>
      </button>
    </nav>
  `;

  // API Status Checker
  async function updateApiStatus() {
    const status = await checkApiStatus();
    const infoEl = container.querySelector('#api-info');
    if (!infoEl) return;
    infoEl.innerHTML = `
      <div class="flex items-center gap-1.5">
        <div class="w-2.5 h-2.5 rounded-full ${status.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
        <span>Odoo: <strong class="${status.connected ? 'text-green-400 font-bold' : 'text-red-400'}">${status.connected ? 'Connected' : 'Offline'}</strong></span>
      </div>
      <span class="text-outline-variant">|</span>
      <span>Wersja: <strong class="text-primary">${status.serverVersion || '19.0'}</strong></span>
      <span class="text-outline-variant">|</span>
      <span>UID: <strong class="text-primary">${status.uid}</strong></span>
      <span class="text-outline-variant">|</span>
      <span>DB: <strong class="text-primary">${status.db}</strong></span>
      ${status.error ? `<div class="w-full text-xs text-red-400 mt-1 font-mono bg-red-950/40 p-1.5 rounded border border-red-800/40">Błąd: ${status.error}</div>` : ''}
    `;
  }

  // Filter Helper
  function getFilteredLogs() {
    const rawAudit = getAuditLogs();
    const rawHistory = getHistory();

    // Map odoo_sync_history to universal audit structure if not duplicated
    const odooSyncLogs = rawHistory.map(h => ({
      id: h.id,
      timestamp: h.timestamp || (h.id > 1000000000000 ? new Date(h.id).toISOString() : new Date().toISOString()),
      dateFormatted: h.dateFormatted || h.time || 'Niedawno',
      operator: h.operator || 'Operator',
      operatorRole: h.operatorRole || 'MAGAZYN',
      category: 'STOCK',
      action: h.title || 'KOREKTA STANU',
      details: h.details || '',
      sku: h.sku || '',
      status: h.status || 'SYNCHRONIZED',
      error: h.error || null
    }));

    // Combine logs and remove exact ID duplicates
    const combinedMap = new Map();
    [...rawAudit, ...odooSyncLogs].forEach(item => {
      if (item && item.id) {
        combinedMap.set(item.id, item);
      }
    });

    const allLogs = Array.from(combinedMap.values()).sort((a, b) => {
      const timeA = new Date(a.timestamp || a.id).getTime() || a.id;
      const timeB = new Date(b.timestamp || b.id).getTime() || b.id;
      return timeB - timeA;
    });

    const now = Date.now();
    let cutoffMs = 0;
    if (activeTimeRange === 'TODAY') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      cutoffMs = startOfToday.getTime();
    } else if (activeTimeRange === '3D') {
      cutoffMs = now - (3 * 24 * 60 * 60 * 1000);
    } else if (activeTimeRange === '7D') {
      cutoffMs = now - (7 * 24 * 60 * 60 * 1000);
    } else if (activeTimeRange === '30D') {
      cutoffMs = now - (30 * 24 * 60 * 60 * 1000);
    } else {
      cutoffMs = 0;
    }

    const cleanSearch = searchQuery.toLowerCase().trim();

    return allLogs.filter(log => {
      // 1. Time range filter
      if (cutoffMs > 0) {
        const logTime = new Date(log.timestamp || log.id).getTime() || log.id;
        if (logTime < cutoffMs) return false;
      }

      // 2. Category filter
      if (activeCategory !== 'ALL') {
        const cat = (log.category || 'SYSTEM').toUpperCase();
        if (cat !== activeCategory) return false;
      }

      // 3. Operator filter
      if (activeOperator !== 'ALL') {
        const opName = (log.operator || '').toLowerCase();
        if (!opName.includes(activeOperator.toLowerCase())) return false;
      }

      // 4. Search query filter
      if (cleanSearch) {
        const haystack = `${log.action} ${log.details} ${log.operator} ${log.sku || ''} ${log.dateFormatted || ''}`.toLowerCase();
        if (!haystack.includes(cleanSearch)) return false;
      }

      return true;
    });
  }

  function getCategoryVisuals(category) {
    switch (category) {
      case 'STOCK':
        return { icon: 'inventory_2', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60', label: 'MAGAZYN' };
      case 'EMPLOYEE':
        return { icon: 'badge', color: 'bg-purple-950/60 text-purple-400 border-purple-800/60', label: 'KADRY' };
      case 'WZ':
        return { icon: 'description', color: 'bg-amber-950/60 text-amber-400 border-amber-800/60', label: 'DOKUMENT WZ' };
      case 'JAW':
        return { icon: 'precision_manufacturing', color: 'bg-blue-950/60 text-blue-400 border-blue-800/60', label: 'SZCZĘKI CNC' };
      case 'ORDER':
        return { icon: 'receipt_long', color: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60', label: 'ZAMÓWIENIA' };
      case 'AUTH':
        return { icon: 'shield', color: 'bg-rose-950/60 text-rose-400 border-rose-800/60', label: 'BEZPIECZEŃSTWO' };
      case 'CONFIG':
        return { icon: 'settings_remote', color: 'bg-slate-800 text-slate-300 border-slate-700', label: 'SYSTEM' };
      default:
        return { icon: 'verified_user', color: 'bg-primary/20 text-primary border-primary/30', label: 'AUDYT' };
    }
  }

  function getRelativeTimeString(dateStr) {
    try {
      const logDate = new Date(dateStr);
      if (isNaN(logDate.getTime())) return '';
      const now = new Date();
      const diffSec = Math.floor((now - logDate) / 1000);
      if (diffSec < 60) return 'przed chwilą';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min temu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} godz. temu`;
      if (diffSec < 172800) return 'wczoraj';
      return `${Math.floor(diffSec / 86400)} dni temu`;
    } catch (e) {
      return '';
    }
  }

  function renderHistoryItems() {
    const filtered = getFilteredLogs();
    const listEl = container.querySelector('#history-items-list');
    const badgeEl = container.querySelector('#results-count-badge');
    if (badgeEl) badgeEl.textContent = `${filtered.length} wpisów`;

    // Update KPI Counters
    const statTotal = container.querySelector('#stat-total');
    const statStock = container.querySelector('#stat-stock');
    const statEmp = container.querySelector('#stat-emp');
    const statAuth = container.querySelector('#stat-auth');
    const statRangeLabel = container.querySelector('#stat-range-label');

    const rangeLabels = {
      'TODAY': 'Dzisiaj',
      '3D': 'Ostatnie 3 dni',
      '7D': 'Ostatnie 7 dni',
      '30D': 'Ostatnie 30 dni',
      'ALL': 'Pełna historia'
    };
    if (statRangeLabel) statRangeLabel.textContent = rangeLabels[activeTimeRange] || 'Wybrany zakres';

    if (statTotal) statTotal.textContent = filtered.length;
    if (statStock) statStock.textContent = filtered.filter(l => l.category === 'STOCK').length;
    if (statEmp) statEmp.textContent = filtered.filter(l => l.category === 'EMPLOYEE').length;
    if (statAuth) statAuth.textContent = filtered.filter(l => l.category === 'AUTH').length;

    if (!filtered || filtered.length === 0) {
      listEl.innerHTML = `
        <div class="p-10 text-center flex flex-col items-center gap-3 text-on-surface-variant">
          <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-3xl">event_busy</span>
          </div>
          <p class="font-bold text-base text-primary">Brak zarejestrowanych operacji</p>
          <p class="text-xs max-w-sm text-on-surface-variant">Nie znaleziono logów spełniających wybrane kryteria w zakresie: <strong>${rangeLabels[activeTimeRange]}</strong>.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(item => {
      const visual = getCategoryVisuals(item.category);
      const relTime = getRelativeTimeString(item.timestamp);
      const isOperatorAdmin = item.operator === 'Paweł' || item.operator === 'Mateusz' || item.operator?.includes('Peret') || item.operator?.includes('Klimkowski') || item.operatorRole === 'ADMIN';

      return `
        <div class="p-3.5 hover:bg-surface-container-high/40 flex flex-col gap-1.5 transition-colors border-b border-outline-variant/30 last:border-b-0">
          <div class="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
            <div class="flex items-start gap-3 min-w-0 flex-1">
              <div class="p-2 rounded-xl flex-shrink-0 border ${visual.color}">
                <span class="material-symbols-outlined text-[20px]">
                  ${visual.icon}
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-bold px-1.5 py-0.5 rounded border ${visual.color}">
                    ${visual.label}
                  </span>
                  ${item.sku ? `
                    <span class="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container text-primary border border-outline-variant/40">
                      ${item.sku}
                    </span>
                  ` : ''}
                  <span class="text-sm font-bold text-primary break-words">${item.action}</span>
                </div>
                
                <div class="text-xs text-on-surface-variant mt-1 leading-relaxed break-words font-body-md">${item.details}</div>
                
                <div class="flex items-center gap-2 mt-1.5 text-xs text-gray-400 flex-wrap">
                  <span class="font-mono text-[11px] text-primary/80">${item.dateFormatted || 'Niedawno'}</span>
                  ${relTime ? `<span class="text-[10px] text-gray-500 font-mono">(${relTime})</span>` : ''}
                  <span>•</span>
                  <span class="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${isOperatorAdmin ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-primary/10 text-primary border border-primary/20'}">
                    <span class="material-symbols-outlined text-[13px]">${isOperatorAdmin ? 'admin_panel_settings' : 'person'}</span>
                    <span>${item.operator || 'Operator'}</span>
                    <span class="text-[9px] opacity-75 font-mono">${isOperatorAdmin ? 'ADMIN' : 'MAGAZYN'}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold self-start md:self-auto flex-shrink-0 ${
              item.status === 'SYNCHRONIZED' || item.status === 'SUCCESS'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' 
                : item.status === 'PENDING'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                : item.status === 'ERROR'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60'
            }">
              <span class="material-symbols-outlined text-[14px]">
                ${item.status === 'SYNCHRONIZED' || item.status === 'SUCCESS' ? 'check_circle' : item.status === 'ERROR' ? 'error' : item.status === 'PENDING' ? 'sync' : 'fingerprint'}
              </span>
              <span>${item.status === 'SYNCHRONIZED' ? 'SYNCHRONIZOWANO' : item.status === 'SUCCESS' ? 'ZAPISANO' : item.status === 'PENDING' ? 'OCZEKUJE' : item.status === 'ERROR' ? 'BŁĄD' : 'LOG'}</span>
            </div>
          </div>
          ${item.error ? `
            <div class="ml-11 text-xs font-mono bg-rose-950/50 text-rose-300 border border-rose-800/60 p-2 rounded-lg flex items-center gap-1.5 mt-1">
              <span class="material-symbols-outlined text-[14px] text-rose-400">warning</span>
              <span>Błąd: ${item.error}</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Export to CSV Function
  function exportCsv() {
    const logs = getFilteredLogs();
    if (logs.length === 0) {
      alert('Brak logów do wyeksportowania.');
      return;
    }

    const headers = ['ID', 'Data i Czas', 'Operator', 'Rola', 'Modul', 'Akcja', 'Szczegoly', 'SKU', 'Status'];
    const rows = logs.map(l => [
      l.id,
      `"${l.dateFormatted || l.timestamp || ''}"`,
      `"${l.operator || ''}"`,
      `"${l.operatorRole || ''}"`,
      `"${l.category || ''}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.sku || ''}"`,
      `"${l.status || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bluemake_audit_log_${activeTimeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Print Audit Report Function
  function printAuditReport() {
    const logs = getFilteredLogs();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Zezwól na wyskakujące okienka w przeglądarce, aby wydrukować raport.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="utf-8">
        <title>Raport Audytu - Bluemake Industrial</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; font-size: 12px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 20px; font-bold; color: #0f172a; font-weight: bold; }
          .meta { font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          .badge { font-size: 9px; padding: 2px 5px; border-radius: 4px; font-weight: bold; background: #e2e8f0; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
          @media print {
            body { margin: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">BLUEMAKE Sp. z o.o. • Raport Audytu Systemowego</div>
            <div class="meta">Zakres: ${activeTimeRange} • Liczba zdarzeń: ${logs.length} • Wygenerowano: ${new Date().toLocaleString('pl-PL')}</div>
          </div>
          <div style="text-align: right;">
            <strong>Administrator:</strong> ${currentOp?.name || 'Zarząd'}<br/>
            <span class="meta">Bluemake Cloud & Odoo 19</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 130px;">Data i Czas</th>
              <th style="width: 100px;">Operator</th>
              <th style="width: 80px;">Moduł</th>
              <th>Zdarzenie / Akcja</th>
              <th>Szczegóły operacji</th>
              <th style="width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="font-family: monospace; font-size: 10px;">${l.dateFormatted || l.timestamp}</td>
                <td><strong>${l.operator || 'Operator'}</strong> (${l.operatorRole || 'User'})</td>
                <td><span class="badge">${l.category || 'SYSTEM'}</span></td>
                <td><strong>${l.action}</strong> ${l.sku ? `<code>[${l.sku}]</code>` : ''}</td>
                <td style="font-size: 11px;">${l.details || ''}</td>
                <td><span class="badge">${l.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Podpis sporządzającego: .................................................</div>
          <div>Zatwierdzenie Zarządu: .................................................</div>
        </div>

        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Bind Event Handlers
  container.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTimeRange = btn.getAttribute('data-range');
      container.querySelectorAll('.time-btn').forEach(b => {
        const isCurrent = b.getAttribute('data-range') === activeTimeRange;
        b.className = `time-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCurrent ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`;
      });
      renderHistoryItems();
    });
  });

  container.querySelectorAll('.cat-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-cat');
      container.querySelectorAll('.cat-pill-btn').forEach(b => {
        const cat = b.getAttribute('data-cat');
        const isCurrent = cat === activeCategory;
        const visual = getCategoryVisuals(cat);
        b.className = `cat-pill-btn px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${isCurrent ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`;
      });
      renderHistoryItems();
    });
  });

  const opSelect = container.querySelector('#operator-filter-select');
  if (opSelect) {
    opSelect.addEventListener('change', (e) => {
      activeOperator = e.target.value;
      renderHistoryItems();
    });
  }

  const searchInput = container.querySelector('#log-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderHistoryItems();
    });
  }

  container.querySelector('#btn-switch-op').addEventListener('click', () => {
    openOperatorModal(navigateTo);
  });

  container.querySelector('#btn-export-csv').addEventListener('click', exportCsv);
  container.querySelector('#btn-print-audit').addEventListener('click', printAuditReport);

  const clearBtn = container.querySelector('#btn-clear-logs');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('UWAGA: Czy na pewno chcesz wyczyścić dziennik zdarzeń? Ta operacja jest nieodwracalna!')) {
        clearAuditLogs();
        renderHistoryItems();
      }
    });
  }

  const syncBtn = container.querySelector('#btn-sync-now');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[16px]">sync</span><span>SYNCHRONIZOWANIE...</span>`;
    await syncPendingItems();
    await updateApiStatus();
    renderHistoryItems();
    syncBtn.disabled = false;
    syncBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">sync</span><span>SYNCHRONIZUJ</span>`;
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
