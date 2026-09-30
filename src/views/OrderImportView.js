import { parseOrderPdf } from '../services/orderParserService.js';
import { enrichOrderItemsWithOdooData, syncOrderToOdoo } from '../services/odooOrdersApi.js';
import { 
  getSavedOrders, 
  saveOrderToDb, 
  deleteOrderFromDb, 
  toggleItemProductionStatus, 
  toggleOrderProductionStatus,
  setOrderProductionStatus,
  setItemProductionStatus,
  updateOrderSyncStatus 
} from '../services/orderStorageService.js';
import { getSavedCustomers } from '../services/wzStorageService.js';
import { printCustomerLabelsHtml } from '../utils/customerLabelGenerator.js';
import { isAdmin, getCurrentOperator } from '../services/authService.js';

export function renderOrderImportView(container, navigateTo) {
  const currentOperator = getCurrentOperator();
  const isUserAdmin = isAdmin(currentOperator);

  let activeCustomerFilter = 'ALL';
  let activeStatusFilter = 'ALL';   // 'ALL' | 'IN_PRODUCTION' | 'PRODUCED'
  let searchQuery = '';
  let showImportModal = false;

  let currentEditingOrder = {
    id: `ORD_${Date.now()}`,
    orderRef: '',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    productionStatus: 'IN_PRODUCTION',
    items: [],
    syncStatus: 'DRAFT',
    odooOrderName: null,
    odooOrderId: null
  };

  function calculateTotals(items = []) {
    let totalNetto = 0;
    let totalOrderedQty = 0;
    let totalProducedQty = 0;

    for (const it of items) {
      const q = parseFloat(it.shippedQty || it.orderedQty || 0);
      const prodQ = parseFloat(it.producedQty || 0);
      const p = parseFloat(it.unitPrice || 0);
      totalNetto += q * p;
      totalOrderedQty += q;
      totalProducedQty += it.productionStatus === 'PRODUCED' ? q : prodQ;
    }

    const vat = totalNetto * 0.23;
    const totalBrutto = totalNetto + vat;

    return {
      netto: totalNetto.toFixed(2),
      vat: vat.toFixed(2),
      brutto: totalBrutto.toFixed(2),
      totalOrderedQty,
      totalProducedQty,
      progressPct: totalOrderedQty > 0 ? Math.round((totalProducedQty / totalOrderedQty) * 100) : 0
    };
  }

  function getUniqueCompanyFilters() {
    const allOrders = getSavedOrders();
    const knownCompanies = [
      { id: 'ALL', label: 'Wszystkie Firmy', icon: 'domain' },
      { id: 'EC Engineering', label: 'EC Engineering', icon: 'precision_manufacturing' },
      { id: 'MV CENTER', label: 'MV CENTER', icon: 'videocam' },
      { id: 'ZMJ', label: 'ZMJ Metals', icon: 'build' },
      { id: 'MATMONT', label: 'MATMONT', icon: 'handyman' },
      { id: 'ALPHA', label: 'ALPHA Technology', icon: 'memory' },
      { id: 'NIKMET', label: 'NIKMET', icon: 'inventory_2' }
    ];

    // Detect any other custom companies in orders database
    allOrders.forEach(o => {
      const cName = (o.customerName || '').trim();
      if (cName && !knownCompanies.some(k => k.id.toUpperCase() === cName.toUpperCase() || cName.toUpperCase().includes(k.id.toUpperCase()))) {
        knownCompanies.push({
          id: cName,
          label: cName,
          icon: 'corporate_fare'
        });
      }
    });

    return knownCompanies;
  }

  function getFilteredOrders() {
    const all = getSavedOrders();
    return all.filter(ord => {
      // Customer filter
      if (activeCustomerFilter !== 'ALL') {
        const cName = (ord.customerName || ord.category || '').toUpperCase();
        const fName = activeCustomerFilter.toUpperCase();
        if (!cName.includes(fName) && !fName.includes(cName)) return false;
      }

      // Status filter
      if (activeStatusFilter !== 'ALL') {
        if (ord.productionStatus !== activeStatusFilter) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesRef = (ord.orderRef || '').toLowerCase().includes(q);
        const matchesCust = (ord.customerName || '').toLowerCase().includes(q);
        const matchesItems = Array.isArray(ord.items) && ord.items.some(it => 
          (it.name || '').toLowerCase().includes(q) || (it.sku || '').toLowerCase().includes(q)
        );
        if (!matchesRef && !matchesCust && !matchesItems) return false;
      }

      return true;
    });
  }

  function renderUI() {
    const filteredOrders = getFilteredOrders();
    const allOrders = getSavedOrders();
    const companyFilters = getUniqueCompanyFilters();
    const savedCustomersList = getSavedCustomers();

    // Global dashboard metrics
    let grandTotalNetto = 0;
    let grandInProductionCount = 0;
    let grandProducedCount = 0;

    allOrders.forEach(o => {
      if (o.productionStatus === 'PRODUCED') grandProducedCount++;
      else grandInProductionCount++;

      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          grandTotalNetto += (parseFloat(it.shippedQty || it.orderedQty || 0) * parseFloat(it.unitPrice || 0));
        });
      }
    });

    container.innerHTML = `
      <!-- Top Bar -->
      <header class="fixed top-0 left-0 w-full z-40 bg-surface border-b border-outline-variant h-14 flex justify-between items-center px-4 shadow-sm">
        <div class="flex items-center gap-3">
          <button id="btn-back-dash" class="flex items-center gap-1 text-primary hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg font-bold text-xs transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>MAGAZYN</span>
          </button>
          <div class="h-4 w-px bg-outline-variant"></div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-indigo-500 text-[22px]">precision_manufacturing</span>
            <h1 class="font-bold text-primary text-sm sm:text-base">Zlecenia Firm Zewnętrznych & Produkcja 2026</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Operator Pill -->
          <div class="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full text-xs border border-outline-variant/60">
            <span class="material-symbols-outlined text-[16px] ${isUserAdmin ? 'text-amber-400' : 'text-indigo-400'}">
              ${isUserAdmin ? 'admin_panel_settings' : 'badge'}
            </span>
            <span class="font-bold text-white">${currentOperator?.name || 'Operator'}</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isUserAdmin ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-indigo-950 text-indigo-300 border border-indigo-700'}">
              ${isUserAdmin ? 'ADMIN (CENY WIDOCZNE)' : 'PRODUKCJA (STATUSY & WZ)'}
            </span>
          </div>

          <!-- Przycisk przejścia do Kreatora WZ -->
          <button id="btn-nav-wz" class="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-md">
            <span class="material-symbols-outlined text-[16px]">description</span>
            <span class="hidden sm:inline">KREATOR WZ</span>
          </button>

          ${isUserAdmin ? `
            <button id="btn-open-import" class="flex items-center gap-1 bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-md">
              <span class="material-symbols-outlined text-[16px]">upload_file</span>
              <span class="hidden sm:inline">+ NOWE ZLECENIE / PDF</span>
            </button>
          ` : ''}
        </div>
      </header>

      <main class="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 mt-14 mb-20">

        <!-- Metrics Cards Bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- W produkcji -->
          <div class="bg-amber-950/20 border border-amber-700/50 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[11px] uppercase font-bold text-amber-300/80 block">Do wyprodukowania</span>
              <span class="text-2xl font-black text-amber-400 font-mono">${grandInProductionCount}</span>
              <span class="text-[10px] text-amber-300/60 block">aktywnych zleceń</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-700/60 flex items-center justify-center text-amber-300">
              <span class="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
          </div>

          <!-- Wyprodukowano / Zrealizowane -->
          <div class="bg-emerald-950/20 border border-emerald-700/50 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[11px] uppercase font-bold text-emerald-300/80 block">Zrealizowane</span>
              <span class="text-2xl font-black text-emerald-400 font-mono">${grandProducedCount}</span>
              <span class="text-[10px] text-emerald-300/60 block">gotowych do wystawienia WZ</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
              <span class="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>

          <!-- Wszystkie zlecenia -->
          <div class="bg-indigo-950/20 border border-indigo-700/50 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[11px] uppercase font-bold text-indigo-300/80 block">Razem Zleceń 2026</span>
              <span class="text-2xl font-black text-indigo-400 font-mono">${allOrders.length}</span>
              <span class="text-[10px] text-indigo-300/60 block">w rejestrze warsztatu</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-300">
              <span class="material-symbols-outlined text-2xl">format_list_bulleted</span>
            </div>
          </div>

          <!-- Wartość portfela (Tylko Admin) -->
          <div class="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[11px] uppercase font-bold text-on-surface-variant block">Wartość Netto</span>
              ${isUserAdmin ? `
                <span class="text-xl sm:text-2xl font-black text-primary font-mono">${grandTotalNetto.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
                <span class="text-[10px] text-emerald-400 block font-bold">Portfel zleceń</span>
              ` : `
                <span class="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                  <span class="material-symbols-outlined text-[14px]">lock</span> Dostęp: Administrator
                </span>
                <span class="text-[10px] text-slate-500 block">Uprawnienia ograniczone</span>
              `}
            </div>
            <div class="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-2xl">${isUserAdmin ? 'payments' : 'lock'}</span>
            </div>
          </div>
        </div>

        <!-- Customer Pills Navigation Filter -->
        <div class="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-3.5 shadow-sm flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-2.5">
            <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-indigo-400">filter_alt</span>
              Firmy Zewnętrzne & Kontrahenci:
            </span>

            <!-- Status Buttons (Wszystkie / W Produkcji / Zrealizowane) -->
            <div class="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant/40">
              <button class="btn-status-filter px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeStatusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}" data-status="ALL">
                Wszystkie (${allOrders.length})
              </button>
              <button class="btn-status-filter px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeStatusFilter === 'IN_PRODUCTION' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}" data-status="IN_PRODUCTION">
                ⏳ Do Produkcji (${grandInProductionCount})
              </button>
              <button class="btn-status-filter px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeStatusFilter === 'PRODUCED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}" data-status="PRODUCED">
                ✅ Zrealizowane (${grandProducedCount})
              </button>
            </div>
          </div>

          <!-- Customer Badges -->
          <div class="flex flex-wrap items-center gap-1.5">
            ${companyFilters.map(c => {
              const isActive = activeCustomerFilter === c.id;
              const count = c.id === 'ALL' 
                ? allOrders.length 
                : allOrders.filter(o => (o.customerName || o.category || '').toUpperCase().includes(c.id.toUpperCase())).length;

              return `
                <button class="btn-customer-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isActive 
                    ? 'bg-primary text-on-primary border-primary shadow-md scale-[1.02]' 
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border-outline-variant/40'
                }" data-customer="${c.id}">
                  <span class="material-symbols-outlined text-[15px]">${c.icon}</span>
                  <span>${c.label}</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isActive ? 'bg-black/20 text-white' : 'bg-surface-container-highest text-slate-300'}">${count}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Search Box -->
          <div class="relative mt-0.5">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input id="search-orders" type="text" value="${searchQuery}" placeholder="Szukaj po numerze zamówienia, firmie, rysunku, nazwie detalu..." class="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant/60 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>

        <!-- Orders Cards Container -->
        <div class="flex flex-col gap-3.5">
          ${filteredOrders.length === 0 ? `
            <div class="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2">
              <span class="material-symbols-outlined text-4xl text-slate-600">inventory</span>
              <p class="text-sm font-bold text-white">Brak zleceń spełniających wybrane kryteria.</p>
              <p class="text-xs text-slate-400">Zmień filtr firmy lub statusu produkcji powyżej.</p>
            </div>
          ` : filteredOrders.map(order => {
            const isProduced = order.productionStatus === 'PRODUCED';
            const totals = calculateTotals(order.items || []);

            return `
              <div class="bg-surface-container-lowest border-2 ${isProduced ? 'border-emerald-700/50 hover:border-emerald-500' : 'border-amber-700/60 hover:border-amber-500'} rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col gap-3">
                
                <!-- Order Card Header -->
                <div class="flex flex-wrap justify-between items-start gap-2 border-b border-outline-variant/30 pb-3">
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono font-black text-base text-white tracking-wide">${order.orderRef}</span>
                      <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 uppercase">
                        ${order.customerName}
                      </span>
                      ${order.odooOrderName ? `
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">cloud_done</span> Odoo: ${order.odooOrderName}
                        </span>
                      ` : ''}
                    </div>
                    <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Data: <strong>${order.orderDate || '-'}</strong></span>
                      <span>•</span>
                      <span>Termin: <strong class="text-amber-300">${order.deliveryDate || '-'}</strong></span>
                      <span>•</span>
                      <span>Pozycji: <strong>${order.items?.length || 0}</strong></span>
                    </div>
                  </div>

                  <!-- Right Side: Status Actions & Direct WZ Generation Button -->
                  <div class="flex items-center gap-2 flex-wrap">
                    
                    <!-- Przycisk Wystaw WZ dla tej firmy -->
                    <button class="btn-issue-wz-order px-3 py-1.5 rounded-xl font-black text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 border border-amber-400" data-order-id="${order.id}" title="Wystaw dokument WZ dla firmy ${order.customerName}">
                      <span class="material-symbols-outlined text-[17px]">description</span>
                      <span>📄 WYSTAW WZ</span>
                    </button>

                    <!-- Przyciski statusu: Daj do produkcji / Zrealizowane -->
                    <div class="flex items-center bg-surface-container p-0.5 rounded-xl border border-outline-variant/60">
                      <button class="btn-set-status-inprod px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        !isProduced 
                          ? 'bg-amber-600 text-white shadow-sm font-black' 
                          : 'text-slate-400 hover:text-white'
                      }" data-order-id="${order.id}" title="Ustaw status: W produkcji">
                        <span class="material-symbols-outlined text-[14px]">hourglass_top</span>
                        <span>W produkcji</span>
                      </button>

                      <button class="btn-set-status-produced px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isProduced 
                          ? 'bg-emerald-600 text-white shadow-sm font-black' 
                          : 'text-slate-400 hover:text-white'
                      }" data-order-id="${order.id}" title="Ustaw status: Zrealizowane / Wyprodukowano">
                        <span class="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Zrealizowane</span>
                      </button>
                    </div>

                    ${isUserAdmin ? `
                      <button class="btn-edit-order p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant/60 transition-colors" data-order-id="${order.id}" title="Edytuj zlecenie">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button class="btn-del-order p-1.5 rounded-lg bg-surface-container hover:bg-rose-950/50 text-rose-400 border border-outline-variant/60 transition-colors" data-order-id="${order.id}" title="Usuń zlecenie">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- Items Table in Order Card -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container/30">
                        <th class="py-2 px-2 w-8 text-center">LP</th>
                        <th class="py-2 px-2 w-28 font-mono">SKU / RYSUNEK</th>
                        <th class="py-2 px-2">NAZWA DETALU / OPERACJA</th>
                        <th class="py-2 px-2 w-24 text-center">ILOŚĆ</th>
                        <th class="py-2 px-2 w-44 text-center">STATUS DETALU</th>
                        ${isUserAdmin ? `
                          <th class="py-2 px-2 w-24 text-right">CENA JEDN.</th>
                          <th class="py-2 px-2 w-28 text-right">WARTOŚĆ</th>
                        ` : ''}
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant/20">
                      ${(order.items || []).map((it, idx) => {
                        const itemProduced = it.productionStatus === 'PRODUCED';
                        const rowNetto = ((it.shippedQty || it.orderedQty || 0) * (it.unitPrice || 0)).toFixed(2);

                        return `
                          <tr class="hover:bg-surface-container/20 transition-colors">
                            <td class="py-2 px-2 text-center text-slate-400 font-bold">${idx + 1}</td>
                            <td class="py-2 px-2 font-mono font-bold text-indigo-300">${it.sku || '-'}</td>
                            <td class="py-2 px-2 font-bold text-white">${it.name || '-'}</td>
                            <td class="py-2 px-2 text-center font-bold text-slate-200">
                              ${it.shippedQty || it.orderedQty || 1} ${it.uom || 'szt'}
                            </td>
                            <td class="py-2 px-2 text-center">
                              <button class="btn-toggle-item-status px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border flex items-center justify-center gap-1 mx-auto ${
                                itemProduced 
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 hover:bg-emerald-900' 
                                  : 'bg-amber-950/80 text-amber-300 border-amber-600/80 hover:bg-amber-900'
                              }" data-order-id="${order.id}" data-item-id="${it.id}">
                                <span class="material-symbols-outlined text-[13px]">${itemProduced ? 'check_circle' : 'precision_manufacturing'}</span>
                                <span>${itemProduced ? '✅ Wyprodukowano' : '⏳ W produkcji'}</span>
                              </button>
                            </td>
                            ${isUserAdmin ? `
                              <td class="py-2 px-2 text-right font-mono text-slate-300">${(it.unitPrice || 0).toFixed(2)} zł</td>
                              <td class="py-2 px-2 text-right font-mono font-bold text-primary">${rowNetto} zł</td>
                            ` : ''}
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Footer of Card -->
                <div class="flex flex-wrap justify-between items-center bg-surface-container/40 rounded-xl p-2.5 mt-1 border border-outline-variant/20 gap-2">
                  <div class="flex items-center gap-2 text-xs">
                    <span class="material-symbols-outlined ${isProduced ? 'text-emerald-400' : 'text-amber-400'} text-[18px]">
                      ${isProduced ? 'task_alt' : 'hourglass_top'}
                    </span>
                    <span class="text-slate-300 font-bold">
                      Postęp: <strong>${totals.totalProducedQty} / ${totals.totalOrderedQty} szt.</strong> (${totals.progressPct}%)
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button class="btn-issue-wz-order flex items-center gap-1 bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg transition-transform active:scale-95 shadow-sm" data-order-id="${order.id}">
                      <span class="material-symbols-outlined text-[15px]">description</span>
                      <span>WYSTAW WZ</span>
                    </button>

                    <button class="btn-print-order-label flex items-center gap-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 font-bold text-[11px] px-2.5 py-1 rounded-lg transition-transform active:scale-95" data-order-id="${order.id}">
                      <span class="material-symbols-outlined text-[15px]">qr_code_2</span>
                      <span>ETYKIETY DO PACZKI</span>
                    </button>

                    ${isUserAdmin ? `
                      <div class="text-right border-l border-outline-variant/40 pl-3">
                        <span class="text-[10px] text-slate-400 uppercase block font-bold">Razem Netto:</span>
                        <span class="font-mono font-black text-sm text-primary">${totals.netto} PLN</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </main>

      <!-- Modal Import / Edycja Zamówienia (Dla Admina) -->
      <div id="import-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 ${showImportModal ? 'flex' : 'hidden'}">
        <div class="bg-surface-container-lowest border-2 border-primary rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-500 text-[22px]">upload_file</span>
              <h2 class="font-bold text-primary text-base">Rejestracja / Edycja Zlecenia Firmy Zewnętrznej</h2>
            </div>
            <button id="btn-close-import" class="p-1 rounded-full hover:bg-surface-container-highest text-slate-400 hover:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <!-- Dropzone -->
            <div id="pdf-dropzone" class="border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/30 hover:bg-indigo-950/50 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
              <input type="file" id="pdf-file-input" accept="application/pdf" class="hidden" />
              <div class="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-300 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">upload_file</span>
              </div>
              <p class="font-bold text-white text-xs sm:text-sm">Przeciągnij plik PDF zlecenia firmy lub kliknij tutaj</p>
            </div>

            <!-- Form -->
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface-container/40 p-4 rounded-xl border border-outline-variant/40">
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-bold text-slate-300">Firma / Kontrahent:</label>
                <select id="modal-customer" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-bold text-white outline-none">
                  <option value="EC Engineering" ${currentEditingOrder.customerName === 'EC Engineering' ? 'selected' : ''}>EC Engineering Sp. z o.o.</option>
                  <option value="MV CENTER" ${currentEditingOrder.customerName === 'MV CENTER' ? 'selected' : ''}>MV Center Systemy Wizyjne</option>
                  <option value="ZMJ" ${currentEditingOrder.customerName === 'ZMJ' ? 'selected' : ''}>ZMJ Metals</option>
                  <option value="MATMONT" ${currentEditingOrder.customerName === 'MATMONT' ? 'selected' : ''}>MATMONT</option>
                  <option value="ALPHA" ${currentEditingOrder.customerName === 'ALPHA' ? 'selected' : ''}>ALPHA Technology</option>
                  <option value="NIKMET" ${currentEditingOrder.customerName === 'NIKMET' ? 'selected' : ''}>NIKMET</option>
                  <option value="KINAR" ${currentEditingOrder.customerName === 'KINAR' ? 'selected' : ''}>KINAR</option>
                  <option value="Husqvarna" ${currentEditingOrder.customerName === 'Husqvarna' ? 'selected' : ''}>Husqvarna Poland</option>
                  <option value="Inny" ${!['EC Engineering', 'MV CENTER', 'ZMJ', 'MATMONT', 'ALPHA', 'NIKMET', 'KINAR', 'Husqvarna'].includes(currentEditingOrder.customerName) ? 'selected' : ''}>+ Inna firma zewnętrzna...</option>
                </select>
                <input id="modal-custom-cust-name" type="text" placeholder="Wpisz nazwę innej firmy" value="${currentEditingOrder.customerName || ''}" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 ${['EC Engineering', 'MV CENTER', 'ZMJ', 'MATMONT', 'ALPHA', 'NIKMET', 'KINAR', 'Husqvarna'].includes(currentEditingOrder.customerName) ? 'hidden' : ''}" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-bold text-slate-300">Numer Ref. Zlecenia:</label>
                <input id="modal-ref" type="text" value="${currentEditingOrder.orderRef || ''}" placeholder="np. ZZ-123-09-2026" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-bold text-slate-300">Termin Realizacji:</label>
                <input id="modal-delivery" type="date" value="${currentEditingOrder.deliveryDate || ''}" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-bold text-white outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-bold text-slate-300">Status początkowy:</label>
                <select id="modal-status" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-bold text-white outline-none">
                  <option value="IN_PRODUCTION" ${currentEditingOrder.productionStatus === 'IN_PRODUCTION' ? 'selected' : ''}>⏳ W produkcji / Do produkcji</option>
                  <option value="PRODUCED" ${currentEditingOrder.productionStatus === 'PRODUCED' ? 'selected' : ''}>✅ Zrealizowane / Wyprodukowano</option>
                </select>
              </div>
            </div>

            <!-- Items Table in Modal -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-white uppercase">Detale / Pozycje (${currentEditingOrder.items?.length || 0})</span>
                <button id="modal-add-row" class="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs rounded-lg border border-outline-variant">
                  + Dodaj detal
                </button>
              </div>

              <div class="overflow-x-auto max-h-60 border border-outline-variant/40 rounded-xl">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-surface-container text-slate-400 font-bold sticky top-0">
                    <tr>
                      <th class="p-2 w-28">SKU / RYSUNEK</th>
                      <th class="p-2">NAZWA DETALU</th>
                      <th class="p-2 w-20 text-center">ILOŚĆ</th>
                      <th class="p-2 w-24 text-right">CENA NETTO</th>
                      <th class="p-2 w-10 text-center">X</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/30">
                    ${(currentEditingOrder.items || []).map((it, idx) => `
                      <tr>
                        <td class="p-1.5"><input type="text" class="modal-item-sku w-full bg-surface-container border border-outline-variant rounded p-1 text-xs text-white" value="${it.sku || ''}" data-idx="${idx}" /></td>
                        <td class="p-1.5"><input type="text" class="modal-item-name w-full bg-surface-container border border-outline-variant rounded p-1 text-xs text-white" value="${it.name || ''}" data-idx="${idx}" /></td>
                        <td class="p-1.5"><input type="number" class="modal-item-qty w-full bg-surface-container border border-outline-variant rounded p-1 text-xs text-white text-center" value="${it.shippedQty || it.orderedQty || 1}" data-idx="${idx}" /></td>
                        <td class="p-1.5"><input type="number" step="0.01" class="modal-item-price w-full bg-surface-container border border-outline-variant rounded p-1 text-xs text-white text-right" value="${it.unitPrice || 0}" data-idx="${idx}" /></td>
                        <td class="p-1.5 text-center"><button class="modal-del-row text-rose-400 p-1" data-idx="${idx}">🗑️</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Modal Action Footer -->
            <div class="flex justify-between items-center pt-2 border-t border-outline-variant/40">
              <button id="modal-sync-odoo" class="flex items-center gap-1.5 bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 uppercase">
                <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
                <span>WYŚLIJ DO ODOO</span>
              </button>

              <button id="modal-save-order" class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95">
                <span class="material-symbols-outlined text-[18px]">save</span>
                <span>ZAPISZ W BAZIE WARSZTATU</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#btn-back-dash')?.addEventListener('click', () => navigateTo('dashboard'));
    container.querySelector('#btn-nav-wz')?.addEventListener('click', () => navigateTo('wz', { returnTo: 'orders' }));

    // Customer filters
    container.querySelectorAll('.btn-customer-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeCustomerFilter = e.currentTarget.getAttribute('data-customer');
        renderUI();
      });
    });

    // Status filters
    container.querySelectorAll('.btn-status-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeStatusFilter = e.currentTarget.getAttribute('data-status');
        renderUI();
      });
    });

    // Search input
    const searchInp = container.querySelector('#search-orders');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderUI();
      });
    }

    // Direct Issue WZ for Order button
    container.querySelectorAll('.btn-issue-wz-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        const ord = getSavedOrders().find(o => o.id === orderId);
        if (ord) {
          navigateTo('wz', { fromOrder: ord, returnTo: 'orders' });
        }
      });
    });

    // Set Status: In Production
    container.querySelectorAll('.btn-set-status-inprod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        setOrderProductionStatus(orderId, 'IN_PRODUCTION', currentOperator?.name);
        renderUI();
      });
    });

    // Set Status: Produced / Realized
    container.querySelectorAll('.btn-set-status-produced').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        setOrderProductionStatus(orderId, 'PRODUCED', currentOperator?.name);
        renderUI();
      });
    });

    // Toggle Single Item Production Status
    container.querySelectorAll('.btn-toggle-item-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        const itemId = e.currentTarget.getAttribute('data-item-id');
        toggleItemProductionStatus(orderId, itemId, currentOperator?.name);
        renderUI();
      });
    });

    // Print Labels
    container.querySelectorAll('.btn-print-order-label').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        const ord = getSavedOrders().find(o => o.id === orderId);
        if (ord && ord.items?.length > 0) {
          printCustomerLabelsHtml(ord);
        } else {
          alert('Brak pozycji do wydruku.');
        }
      });
    });

    // Admin-only actions
    if (isUserAdmin) {
      container.querySelector('#btn-open-import')?.addEventListener('click', () => {
        currentEditingOrder = {
          id: `ORD_${Date.now()}`,
          orderRef: '',
          customerName: 'EC Engineering',
          category: 'EC Engineering',
          orderDate: new Date().toISOString().split('T')[0],
          deliveryDate: new Date().toISOString().split('T')[0],
          productionStatus: 'IN_PRODUCTION',
          items: [
            { id: `item_1`, sku: '', name: '', orderedQty: 1, shippedQty: 1, producedQty: 0, productionStatus: 'IN_PRODUCTION', unitPrice: 0, uom: 'szt' }
          ],
          syncStatus: 'DRAFT',
          odooOrderName: null,
          odooOrderId: null
        };
        showImportModal = true;
        renderUI();
      });

      container.querySelector('#btn-close-import')?.addEventListener('click', () => {
        showImportModal = false;
        renderUI();
      });

      container.querySelectorAll('.btn-edit-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const orderId = e.currentTarget.getAttribute('data-order-id');
          const ord = getSavedOrders().find(o => o.id === orderId);
          if (ord) {
            currentEditingOrder = JSON.parse(JSON.stringify(ord));
            showImportModal = true;
            renderUI();
          }
        });
      });

      container.querySelectorAll('.btn-del-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const orderId = e.currentTarget.getAttribute('data-order-id');
          if (confirm('Czy na pewno chcesz usunąć to zlecenie z rejestru?')) {
            deleteOrderFromDb(orderId, currentOperator?.name);
            renderUI();
          }
        });
      });

      // Modal form inputs
      const custSelect = container.querySelector('#modal-customer');
      const customCustInput = container.querySelector('#modal-custom-cust-name');
      if (custSelect) {
        custSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val === 'Inny') {
            if (customCustInput) customCustInput.classList.remove('hidden');
            currentEditingOrder.customerName = customCustInput ? customCustInput.value : 'Inny';
            currentEditingOrder.category = 'Inny';
          } else {
            if (customCustInput) customCustInput.classList.add('hidden');
            currentEditingOrder.customerName = val;
            currentEditingOrder.category = val;
          }
        });
      }

      if (customCustInput) {
        customCustInput.addEventListener('input', (e) => {
          currentEditingOrder.customerName = e.target.value;
          currentEditingOrder.category = e.target.value;
        });
      }

      container.querySelector('#modal-ref')?.addEventListener('input', (e) => {
        currentEditingOrder.orderRef = e.target.value;
      });

      container.querySelector('#modal-delivery')?.addEventListener('change', (e) => {
        currentEditingOrder.deliveryDate = e.target.value;
      });

      container.querySelector('#modal-status')?.addEventListener('change', (e) => {
        currentEditingOrder.productionStatus = e.target.value;
      });

      // Modal table inputs
      container.querySelectorAll('.modal-item-sku').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = Number(e.target.getAttribute('data-idx'));
          if (currentEditingOrder.items[idx]) currentEditingOrder.items[idx].sku = e.target.value;
        });
      });

      container.querySelectorAll('.modal-item-name').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = Number(e.target.getAttribute('data-idx'));
          if (currentEditingOrder.items[idx]) currentEditingOrder.items[idx].name = e.target.value;
        });
      });

      container.querySelectorAll('.modal-item-qty').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = Number(e.target.getAttribute('data-idx'));
          if (currentEditingOrder.items[idx]) {
            const val = parseFloat(e.target.value) || 1;
            currentEditingOrder.items[idx].shippedQty = val;
            currentEditingOrder.items[idx].orderedQty = val;
          }
        });
      });

      container.querySelectorAll('.modal-item-price').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = Number(e.target.getAttribute('data-idx'));
          if (currentEditingOrder.items[idx]) currentEditingOrder.items[idx].unitPrice = parseFloat(e.target.value) || 0;
        });
      });

      container.querySelectorAll('.modal-del-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = Number(e.currentTarget.getAttribute('data-idx'));
          currentEditingOrder.items.splice(idx, 1);
          renderUI();
        });
      });

      container.querySelector('#modal-add-row')?.addEventListener('click', () => {
        currentEditingOrder.items.push({
          id: `item_${Date.now()}_${currentEditingOrder.items.length}`,
          sku: '',
          name: 'Nowy detal',
          orderedQty: 1,
          shippedQty: 1,
          producedQty: 0,
          productionStatus: currentEditingOrder.productionStatus || 'IN_PRODUCTION',
          unitPrice: 100.0,
          uom: 'szt'
        });
        renderUI();
      });

      container.querySelector('#modal-save-order')?.addEventListener('click', () => {
        if (!currentEditingOrder.orderRef) {
          alert('Podaj numer referencyjny zlecenia.');
          return;
        }
        saveOrderToDb(currentEditingOrder, currentOperator?.name);
        alert('✅ Zapisano zlecenie w rejestrze warsztatu!');
        showImportModal = false;
        renderUI();
      });

      // PDF Upload inside modal
      const dropzone = container.querySelector('#pdf-dropzone');
      const fileInput = container.querySelector('#pdf-file-input');

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          if (e.target.files.length > 0) {
            await handlePdfFile(e.target.files[0]);
          }
        });
      }

      // Sync Odoo inside modal
      container.querySelector('#modal-sync-odoo')?.addEventListener('click', async () => {
        if (!currentEditingOrder.orderRef || currentEditingOrder.items.length === 0) {
          alert('Wypełnij dane zlecenia i dodaj pozycje.');
          return;
        }
        try {
          const res = await syncOrderToOdoo(currentEditingOrder);
          currentEditingOrder.odooOrderId = res.id;
          currentEditingOrder.odooOrderName = res.name;
          currentEditingOrder.syncStatus = 'SYNCED_ODOO';
          saveOrderToDb(currentEditingOrder, currentOperator?.name);
          alert(`🎉 Zsynchronizowano z Odoo: ${res.name}`);
          showImportModal = false;
          renderUI();
        } catch (err) {
          alert('Błąd synchronizacji z Odoo: ' + err.message);
        }
      });
    }
  }

  async function handlePdfFile(file) {
    if (!file) return;
    try {
      const parsed = await parseOrderPdf(file);
      currentEditingOrder.orderRef = parsed.orderRef || currentEditingOrder.orderRef;
      currentEditingOrder.customerName = parsed.customerName || currentEditingOrder.customerName;
      currentEditingOrder.category = parsed.customerName || currentEditingOrder.category;
      currentEditingOrder.orderDate = parsed.orderDate || currentEditingOrder.orderDate;
      currentEditingOrder.deliveryDate = parsed.deliveryDate || currentEditingOrder.deliveryDate;

      const enriched = await enrichOrderItemsWithOdooData(parsed.items);
      currentEditingOrder.items = enriched.map(it => ({
        ...it,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION'
      }));

      renderUI();
    } catch (err) {
      alert('Błąd odczytu pliku PDF: ' + err.message);
    }
  }

  renderUI();
}

