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
  updateItemProducedQty,
  updateOrderSyncStatus,
  archiveOrder,
  unarchiveOrder,
  setOrderPdf
} from '../services/orderStorageService.js';
import { getSavedCustomers } from '../services/wzStorageService.js';
import { printCustomerLabelsHtml } from '../utils/customerLabelGenerator.js';
import { isAdmin, getCurrentOperator } from '../services/authService.js';

export function renderOrderImportView(container, navigateTo) {
  const currentOperator = getCurrentOperator();
  const isUserAdmin = isAdmin(currentOperator);

  // Color Theme: 'warm-cream' | 'soft-dark'
  let currentTheme = localStorage.getItem('bluemake_ui_theme') || 'warm-cream';

  // Category Tabs: 'ALL' (Wszystkie domyślnie) | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  let activeTab = 'ALL';

  let activeCustomerFilter = 'ALL';
  let activeMonthFilter = 'ALL';
  let searchQuery = '';
  let showImportModal = false;

  // PDF Preview Modal state
  let previewPdfUrl = null;
  let previewPdfTitle = '';

  // Accordion state: Set of order IDs currently expanded
  let expandedOrderIds = new Set();

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
    odooOrderId: null,
    pdfUrl: null
  };

  // Pre-known PDF mappings for sample/extracted files
  const knownPdfMap = {
    'ZZ-295-07-2026': '/orders_pdf/ZZ-295-07-2026.pdf',
    'ZZ-1-09-2026-ZN': '/orders_pdf/ZZ-1-09-2026-ZN.pdf',
    'ZZ-72/09/2026/EC': '/orders_pdf/ZZ-72-09-2026.pdf',
    'ZZ-190/08/2026/EC': '/orders_pdf/ZZ-190-08-2026.pdf',
    'ZZ-8/09/2026/EC': '/orders_pdf/ZZ-8-09-2026.pdf',
    'ZZ-69/09/2026/EC': '/orders_pdf/ZZ-69-09-2026.pdf',
    'ZZ-136/09/2026/EC': '/orders_pdf/ZZ-136-09-2026.pdf',
    'ZZ-151/09/2026/EC': '/orders_pdf/ZZ-151-09-2026.pdf',
    'ZZ-79/09/2026/EC': '/orders_pdf/ZZ-79-09-2026.pdf',
    'ZZ-184-09-2026': '/orders_pdf/ZZ-184-09-2026.pdf',
    'ZZ-23-09-2026-ZN': '/orders_pdf/ZZ-23-09-2026-ZN.pdf',
    'ZZ-220/09/2026/EC': '/orders_pdf/ZZ-220-09-2026.pdf',
    'ZZ-78/09/2026/EC': '/orders_pdf/ZZ-78-09-2026.pdf',
    'ZZ-241/09/2026/EC': '/orders_pdf/ZZ-241-09-2026.pdf',
    '73-Z-09-2026 BLUEMAKE': '/orders_pdf/MATMONT-73.pdf',
    '73/Z/09/26': '/orders_pdf/MATMONT-73.pdf',
    '42-Z-07-2026 BLUEMAKE': '/orders_pdf/MATMONT-42.pdf',
    '42/Z/07/26': '/orders_pdf/MATMONT-42.pdf',
    'I2601653': '/orders_pdf/I2601653.pdf',
    'Bluemake-I2601412': '/orders_pdf/Bluemake-I2601412.pdf',
    'Bluemake-I2601094': '/orders_pdf/Bluemake-I2601094.pdf',
    'BLM-04-2026': '/orders_pdf/Zamówienie nr BLM-04-2026.pdf',
    'BLM-02-2026': '/orders_pdf/Zamówienie nr BLM-02-2026.pdf',
    'BLM-03-2026': '/orders_pdf/Zamówienie nr BLM-03-2026.pdf',
    'BLM-05-2026': '/orders_pdf/Zamówienie nr BLM-05-2026.pdf',
    'ZZ-247-03-2026': '/orders_pdf/ZZ-247-03-2026.pdf'
  };

  function getOrderPdfUrl(order) {
    if (order.pdfUrl) return order.pdfUrl;
    if (order.orderRef && knownPdfMap[order.orderRef]) return knownPdfMap[order.orderRef];
    // Check if clean ref matches any known pdf
    const clean = (order.orderRef || '').replace(/[\/\s]/g, '-');
    for (const k in knownPdfMap) {
      if (k.replace(/[\/\s]/g, '-') === clean) return knownPdfMap[k];
    }
    return null;
  }

  function calculateTotals(items = []) {
    let totalNetto = 0;
    let totalOrderedQty = 0;
    let totalProducedQty = 0;

    for (const it of items) {
      const q = parseFloat(it.shippedQty || it.orderedQty || 0);
      const prodQ = it.producedQty !== undefined 
        ? parseFloat(it.producedQty) 
        : (it.productionStatus === 'PRODUCED' ? q : 0);
      const p = parseFloat(it.unitPrice || 0);
      totalNetto += q * p;
      totalOrderedQty += q;
      totalProducedQty += prodQ;
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

  function getUniqueMonths() {
    const allOrders = getSavedOrders();
    const monthMap = {};

    allOrders.forEach(o => {
      const d = o.orderDate || o.deliveryDate || '';
      const m = d.substring(0, 7);
      if (m && m.length === 7) {
        if (!monthMap[m]) {
          monthMap[m] = { count: 0, sumNetto: 0 };
        }
        monthMap[m].count++;
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const q = parseFloat(it.shippedQty || it.orderedQty || 0);
            monthMap[m].sumNetto += q * parseFloat(it.unitPrice || 0);
          });
        }
      }
    });

    const monthNames = {
      '01': 'Styczeń',
      '02': 'Luty',
      '03': 'Marzec',
      '04': 'Kwiecień',
      '05': 'Maj',
      '06': 'Czerwiec',
      '07': 'Lipiec',
      '08': 'Sierpień',
      '09': 'Wrzesień',
      '10': 'Październik',
      '11': 'Listopad',
      '12': 'Grudzień'
    };

    return Object.keys(monthMap).sort().reverse().map(m => {
      const [year, mon] = m.split('-');
      const label = `${monthNames[mon] || mon} ${year}`;
      return {
        id: m,
        label: `${label} (${monthMap[m].count} zlec. • ${monthMap[m].sumNetto.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł)`
      };
    });
  }

  function getUniqueCompanyFilters() {
    const allOrders = getSavedOrders();
    const knownCompanies = [
      { id: 'ALL', label: 'Wszystkie Firmy', icon: 'domain' },
      { id: 'EC Engineering', label: 'EC Engineering', icon: 'precision_manufacturing' },
      { id: 'MV CENTER', label: 'MV CENTER', icon: 'videocam' },
      { id: 'ZMJ', label: 'ZMJ', icon: 'build' },
      { id: 'MATMONT', label: 'MATMONT', icon: 'handyman' },
      { id: 'ALPHA TECHNOLOGY', label: 'ALPHA', icon: 'memory' },
      { id: 'NIKMET', label: 'NIKMET', icon: 'inventory_2' }
    ];

    allOrders.forEach(o => {
      const cName = (o.customerName || o.category || '').trim();
      if (cName && !knownCompanies.some(k => k.id.toUpperCase() === cName.toUpperCase() || cName.toUpperCase().includes(k.id.toUpperCase()) || k.id.toUpperCase().includes(cName.toUpperCase()))) {
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
      // 1. Tab filter
      if (activeTab === 'ACTIVE') {
        if (ord.productionStatus === 'PRODUCED' || ord.productionStatus === 'ARCHIVED') return false;
      } else if (activeTab === 'COMPLETED') {
        if (ord.productionStatus !== 'PRODUCED') return false;
      } else if (activeTab === 'ARCHIVED') {
        if (ord.productionStatus !== 'ARCHIVED') return false;
      }

      // 2. Company filter
      if (activeCustomerFilter !== 'ALL') {
        const cName = (ord.customerName || ord.category || '').toUpperCase();
        const fName = activeCustomerFilter.toUpperCase();
        if (!cName.includes(fName) && !fName.includes(cName)) return false;
      }

      // 3. Month filter
      if (activeMonthFilter !== 'ALL') {
        const d = ord.orderDate || ord.deliveryDate || '';
        if (!d.startsWith(activeMonthFilter)) return false;
      }

      // 4. Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesRef = (ord.orderRef || '').toLowerCase().includes(q);
        const matchesOdoo = (ord.odooOrderName || '').toLowerCase().includes(q);
        const matchesCust = (ord.customerName || '').toLowerCase().includes(q);
        const matchesItems = Array.isArray(ord.items) && ord.items.some(it => 
          (it.name || '').toLowerCase().includes(q) || (it.sku || '').toLowerCase().includes(q) || (it.symbol || '').toLowerCase().includes(q)
        );
        if (!matchesRef && !matchesOdoo && !matchesCust && !matchesItems) return false;
      }

      return true;
    });
  }

  function renderUI() {
    const filteredOrders = getFilteredOrders();
    const allOrders = getSavedOrders();
    const companyFilters = getUniqueCompanyFilters();
    const monthFilters = getUniqueMonths();

    // Summary calculations for current filter
    let viewTotalNetto = 0;
    let viewTotalBrutto = 0;
    let viewTotalPieces = 0;
    let viewInProdCount = 0;
    let viewProdCount = 0;
    let viewArchivedCount = 0;

    filteredOrders.forEach(o => {
      if (o.productionStatus === 'ARCHIVED') viewArchivedCount++;
      else if (o.productionStatus === 'PRODUCED') viewProdCount++;
      else viewInProdCount++;

      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          const q = parseFloat(it.shippedQty || it.orderedQty || 0);
          const p = parseFloat(it.unitPrice || 0);
          viewTotalPieces += q;
          viewTotalNetto += q * p;
        });
      }
    });
    viewTotalBrutto = viewTotalNetto * 1.23;

    // Grand counts across all orders
    let grandActiveCount = 0;
    let grandCompletedCount = 0;
    let grandArchivedCount = 0;
    allOrders.forEach(o => {
      if (o.productionStatus === 'ARCHIVED') grandArchivedCount++;
      else if (o.productionStatus === 'PRODUCED') grandCompletedCount++;
      else grandActiveCount++;
    });

    const isCream = currentTheme === 'warm-cream';

    // Theme palette
    const themeStyles = {
      headerBg: isCream ? 'bg-[#f4efe6] border-[#e2d7c5] text-[#2c2825]' : 'bg-slate-900 border-slate-800 text-slate-100',
      mainText: isCream ? 'text-[#2e2a25]' : 'text-slate-200',
      btnBack: isCream ? 'bg-[#e9dfcf] hover:bg-[#ded1bd] text-[#3d3730] border-[#d8c7b0]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
      cardBg: isCream ? 'bg-[#fbf8f2] border-[#e5dcce] text-[#2c2825] shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md',
      metricBoxInProd: isCream ? 'bg-[#fef9f0] border-[#f0cfa0] text-[#78350f]' : 'bg-slate-900/90 border-amber-500/30 text-amber-300',
      metricBoxProd: isCream ? 'bg-[#f0fbf4] border-[#bbf7d0] text-[#14532d]' : 'bg-slate-900/90 border-emerald-500/30 text-emerald-300',
      metricBoxArchived: isCream ? 'bg-[#f5f5f4] border-[#d6d3d1] text-[#44403c]' : 'bg-slate-900/90 border-slate-700 text-slate-300',
      metricBoxPieces: isCream ? 'bg-[#f5f3ff] border-[#ddd6fe] text-[#4338ca]' : 'bg-slate-900/90 border-indigo-500/30 text-indigo-300',
      metricBoxValue: isCream ? 'bg-[#f9f6f0] border-[#e2d9cb] text-[#292524]' : 'bg-slate-900/90 border-slate-800 text-white',
      filterPanel: isCream ? 'bg-[#f6f1e8] border-[#e0d6c4]' : 'bg-slate-900 border-slate-800',
      inputSearch: isCream ? 'bg-white border-[#d8ccb8] text-[#2c2825] placeholder-[#9c9182] focus:border-amber-600' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500',
      tableHeader: isCream ? 'bg-[#ede5d6] text-[#574e42] border-[#ded3c0]' : 'bg-slate-950 text-slate-400 border-slate-800',
      tableRowBg: isCream ? 'bg-white hover:bg-[#f7f2ea]' : 'bg-slate-900/60 hover:bg-slate-800/40',
      tableBorder: isCream ? 'border-[#e8dfcf]' : 'border-slate-800',
      footerBox: isCream ? 'bg-[#f2ebdf] border-[#e0d6c4]' : 'bg-slate-950/70 border-slate-800'
    };

    container.innerHTML = `
      <!-- Top Bar -->
      <header class="fixed top-0 left-0 w-full z-40 ${themeStyles.headerBg} border-b h-14 flex justify-between items-center px-4 shadow-md transition-colors duration-200">
        <div class="flex items-center gap-3">
          <button id="btn-back-dash" class="flex items-center gap-1.5 ${themeStyles.btnBack} px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>MAGAZYN</span>
          </button>
          <div class="h-4 w-px ${isCream ? 'bg-[#d8ccb8]' : 'bg-slate-800'}"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-600 text-[22px]">precision_manufacturing</span>
            <h1 class="font-bold text-sm sm:text-base tracking-tight ${isCream ? 'text-[#2a241e]' : 'text-white'}">Zlecenia Firm & Produkcja 2026</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Motyw Kolorystyczny -->
          <div class="flex items-center gap-1 p-1 rounded-xl border ${isCream ? 'bg-[#ede5d7] border-[#d8ccb8]' : 'bg-slate-950 border-slate-800'}">
            <button id="btn-theme-cream" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isCream ? 'bg-[#84532b] text-white shadow-sm font-black' : 'text-slate-400 hover:text-white'}" title="Ciepły kremowy odcień (przyjazny dla oczu, mniejszy kontrast)">
              <span class="material-symbols-outlined text-[14px]">light_mode</span>
              <span class="hidden md:inline">Ciepły Krem</span>
            </button>
            <button id="btn-theme-dark" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${!isCream ? 'bg-indigo-600 text-white shadow-sm font-black' : 'text-[#6b5f50] hover:text-[#2c2825]'}" title="Ciemny grafit">
              <span class="material-symbols-outlined text-[14px]">dark_mode</span>
              <span class="hidden md:inline">Ciemny</span>
            </button>
          </div>

          <!-- Operator Pill -->
          <div class="flex items-center gap-1.5 ${isCream ? 'bg-[#e9dfce] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800/90 text-white border-slate-700'} px-3 py-1.5 rounded-xl text-xs border shadow-sm">
            <span class="material-symbols-outlined text-[16px] ${isUserAdmin ? 'text-amber-600' : 'text-indigo-500'}">
              ${isUserAdmin ? 'admin_panel_settings' : 'badge'}
            </span>
            <span class="font-bold">${currentOperator?.name || 'Operator'}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-md font-bold ${isUserAdmin ? (isCream ? 'bg-amber-200 text-amber-950 border border-amber-300' : 'bg-amber-950/80 text-amber-300 border border-amber-800/60') : (isCream ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60')}">
              ${isUserAdmin ? 'ADMIN' : 'PRODUKCJA'}
            </span>
          </div>

          <!-- Przycisk przejścia do Kreatora WZ -->
          <button id="btn-nav-wz" class="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">description</span>
            <span class="hidden sm:inline">KREATOR WZ</span>
          </button>

          ${isUserAdmin ? `
            <button id="btn-open-import" class="flex items-center gap-1.5 bg-[#d95c00] hover:bg-[#c24f00] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">upload_file</span>
              <span class="hidden sm:inline">+ NOWE ZLECENIE</span>
            </button>
          ` : ''}
        </div>
      </header>

      <main class="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 mt-14 mb-20 ${themeStyles.mainText}">

        <!-- Category Tabs (W TRAKCIE vs ZREALIZOWANE vs ARCHIWUM vs WSZYSTKIE) -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b ${isCream ? 'border-[#dfd3bf]' : 'border-slate-800'} pb-3">
          <div class="flex items-center gap-2 p-1.5 rounded-2xl border ${isCream ? 'bg-[#ede5d6] border-[#d8ccb8]' : 'bg-slate-900 border-slate-800'} shadow-sm flex-wrap">
            
            <!-- Tab: WSZYSTKIE -->
            <button id="tab-all" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'ALL' ? (isCream ? 'bg-[#292524] text-white shadow-md' : 'bg-indigo-600 text-white shadow-md') : (isCream ? 'text-[#574a38] hover:text-[#2c2825] hover:bg-[#dfd3bf]' : 'text-slate-400 hover:text-white hover:bg-slate-800')}">
              <span class="material-symbols-outlined text-[18px]">list_alt</span>
              <span>WSZYSTKIE ZLECENIA</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'ALL' ? (isCream ? 'bg-stone-900 text-stone-200' : 'bg-slate-950 text-indigo-300') : (isCream ? 'bg-[#d8ccb8] text-[#3d3224]' : 'bg-slate-800 text-slate-300')}">
                ${allOrders.length}
              </span>
            </button>

            <!-- Tab: W TRAKCIE -->
            <button id="tab-active" class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'ACTIVE' ? (isCream ? 'bg-[#78350f] text-white shadow-md' : 'bg-amber-500 text-slate-950 shadow-md') : (isCream ? 'text-[#574a38] hover:text-[#2c2825] hover:bg-[#dfd3bf]' : 'text-slate-400 hover:text-white hover:bg-slate-800')}">
              <span class="material-symbols-outlined text-[18px]">pending_actions</span>
              <span>W TRAKCIE REALIZACJI</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'ACTIVE' ? (isCream ? 'bg-amber-950 text-amber-200' : 'bg-slate-950 text-amber-400') : (isCream ? 'bg-[#d8ccb8] text-[#3d3224]' : 'bg-slate-800 text-slate-300')}">
                ${grandActiveCount}
              </span>
            </button>

            <!-- Tab: ZREALIZOWANE (Do rozliczenia) -->
            <button id="tab-completed" class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'COMPLETED' ? (isCream ? 'bg-[#14532d] text-white shadow-md' : 'bg-emerald-500 text-slate-950 shadow-md') : (isCream ? 'text-[#574a38] hover:text-[#2c2825] hover:bg-[#dfd3bf]' : 'text-slate-400 hover:text-white hover:bg-slate-800')}">
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              <span>ZREALIZOWANE (DO ROZLICZENIA)</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'COMPLETED' ? (isCream ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-950 text-emerald-400') : (isCream ? 'bg-[#d8ccb8] text-[#3d3224]' : 'bg-slate-800 text-slate-300')}">
                ${grandCompletedCount}
              </span>
            </button>

            <!-- Tab: ARCHIWUM (Rozliczone & Zamknięte) -->
            <button id="tab-archived" class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'ARCHIVED' ? (isCream ? 'bg-[#44403c] text-white shadow-md' : 'bg-slate-700 text-white shadow-md') : (isCream ? 'text-[#574a38] hover:text-[#2c2825] hover:bg-[#dfd3bf]' : 'text-slate-400 hover:text-white hover:bg-slate-800')}" title="Zamówienia z wystawionym WZ, fakturą i opłacone przez klienta">
              <span class="material-symbols-outlined text-[18px]">inventory_2</span>
              <span>ARCHIWUM (ROZLICZONE)</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'ARCHIVED' ? (isCream ? 'bg-stone-900 text-stone-200' : 'bg-slate-950 text-slate-300') : (isCream ? 'bg-[#d8ccb8] text-[#3d3224]' : 'bg-slate-800 text-slate-300')}">
                ${grandArchivedCount}
              </span>
            </button>

          </div>

          <!-- Global Accordion Toggle: Expand / Collapse All -->
          <div class="flex items-center gap-2">
            <button id="btn-toggle-all-expand" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#3d3224] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'} cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">${expandedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? 'unfold_less' : 'unfold_more'}</span>
              <span>${expandedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? 'Zwiń wszystkie' : 'Rozwiń wszystkie'}</span>
            </button>
          </div>
        </div>

        <!-- Financial KPI Banner for Current View -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="${themeStyles.metricBoxValue} border rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[10px] uppercase font-bold block tracking-wider ${isCream ? 'text-[#736350]' : 'text-slate-400'}">Wartość Netto (Widok)</span>
              <span class="text-xl sm:text-2xl font-black font-mono ${isCream ? 'text-[#1c1917]' : 'text-white'}">${viewTotalNetto.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
              <span class="text-[10px] ${isCream ? 'text-stone-500' : 'text-slate-400'} block font-semibold">Brutto: ${viewTotalBrutto.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
            </div>
            <div class="w-10 h-10 rounded-xl ${isCream ? 'bg-[#ebdcc7] text-[#5c4a35]' : 'bg-slate-800 text-slate-300'} border flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>

          <div class="${themeStyles.metricBoxInProd} border rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[10px] uppercase font-bold block tracking-wider ${isCream ? 'text-amber-800' : 'text-amber-400'}">Do wykonania</span>
              <span class="text-xl sm:text-2xl font-black font-mono ${isCream ? 'text-amber-950' : 'text-amber-300'}">${viewInProdCount}</span>
              <span class="text-[10px] ${isCream ? 'text-amber-900/70' : 'text-slate-400'} block font-semibold">zleceń w realizacji</span>
            </div>
            <div class="w-10 h-10 rounded-xl ${isCream ? 'bg-amber-200/80 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'} border flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">precision_manufacturing</span>
            </div>
          </div>

          <div class="${themeStyles.metricBoxProd} border rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[10px] uppercase font-bold block tracking-wider ${isCream ? 'text-emerald-800' : 'text-emerald-400'}">Gotowe / Wyprodukowane</span>
              <span class="text-xl sm:text-2xl font-black font-mono ${isCream ? 'text-emerald-950' : 'text-emerald-300'}">${viewProdCount}</span>
              <span class="text-[10px] ${isCream ? 'text-emerald-900/70' : 'text-slate-400'} block font-semibold">zleceń gotowych</span>
            </div>
            <div class="w-10 h-10 rounded-xl ${isCream ? 'bg-emerald-200/80 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'} border flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">check_circle</span>
            </div>
          </div>

          <div class="${themeStyles.metricBoxPieces} border rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <span class="text-[10px] uppercase font-bold block tracking-wider ${isCream ? 'text-indigo-800' : 'text-indigo-400'}">Detale (Sztuki)</span>
              <span class="text-xl sm:text-2xl font-black font-mono ${isCream ? 'text-indigo-950' : 'text-indigo-300'}">${viewTotalPieces.toLocaleString('pl-PL')} szt</span>
              <span class="text-[10px] ${isCream ? 'text-indigo-900/70' : 'text-slate-400'} block font-semibold">w wybranym widoku</span>
            </div>
            <div class="w-10 h-10 rounded-xl ${isCream ? 'bg-indigo-200/80 border-indigo-300 text-indigo-800' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'} border flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">layers</span>
            </div>
          </div>
        </div>

        <!-- Filter Controls: Month Filter, Search, Customer Filter -->
        <div class="${themeStyles.filterPanel} border rounded-2xl p-3.5 flex flex-col gap-3 shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            
            <!-- Month Selector -->
            <div class="sm:col-span-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">calendar_month</span>
              <select id="month-filter-select" class="w-full ${themeStyles.inputSearch} border rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer">
                <option value="ALL" ${activeMonthFilter === 'ALL' ? 'selected' : ''}>📅 Wszystkie miesiące (Łącznie ${allOrders.length} zleceń)</option>
                ${monthFilters.map(m => `
                  <option value="${m.id}" ${activeMonthFilter === m.id ? 'selected' : ''}>${m.label}</option>
                `).join('')}
              </select>
            </div>

            <!-- Search Bar -->
            <div class="sm:col-span-5 relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 ${isCream ? 'text-[#8c7f6f]' : 'text-slate-500'} text-[18px]">search</span>
              <input id="orders-search-input" type="text" value="${searchQuery}" placeholder="Szukaj zlecenia, SO, rysunku, nazwy detalu..." class="w-full ${themeStyles.inputSearch} border rounded-xl pl-9 pr-3 py-2 text-xs outline-none" />
            </div>

            <!-- Total count label -->
            <div class="sm:col-span-3 flex justify-end items-center text-xs font-bold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">
              Znaleziono: <span class="ml-1.5 px-2 py-0.5 rounded-lg ${isCream ? 'bg-[#ede5d6] text-[#2c2825]' : 'bg-slate-800 text-white'} font-mono">${filteredOrders.length}</span> zleceń
            </div>
          </div>

          <!-- Company Filter Buttons -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            ${companyFilters.map(comp => {
              const isSelected = activeCustomerFilter.toUpperCase() === comp.id.toUpperCase();
              return `
                <button class="btn-filter-company flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${isSelected ? (isCream ? 'bg-[#84532b] text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm') : (isCream ? 'bg-[#ede5d7] hover:bg-[#e2d6c3] text-[#4d4233] border border-[#d8ccb8]' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700')}" data-company="${comp.id}">
                  <span class="material-symbols-outlined text-[14px]">${comp.icon || 'business'}</span>
                  <span>${comp.label}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Orders Accordion List -->
        <div class="flex flex-col gap-2.5">
          ${filteredOrders.length === 0 ? `
            <div class="border-2 border-dashed ${isCream ? 'border-[#d8ccb8] bg-[#fbf8f2]' : 'border-slate-800 bg-slate-900/50'} rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <span class="material-symbols-outlined text-5xl ${isCream ? 'text-[#a89985]' : 'text-slate-600'}">search_off</span>
              <div class="text-sm font-bold ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Brak zleceń w tej kategorii</div>
              <p class="text-xs ${isCream ? 'text-[#7d6f5e]' : 'text-slate-500'}">Zmień zakładkę, wybierz inny miesiąc lub wyczyść wyszukiwanie.</p>
              <button id="btn-reset-filters" class="mt-2 px-4 py-2 ${isCream ? 'bg-[#ede5d6] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 text-white border-slate-700'} rounded-xl border text-xs font-bold cursor-pointer">
                Resetuj Filtry
              </button>
            </div>
          ` : filteredOrders.map(order => {
            const isExpanded = expandedOrderIds.has(order.id);
            const totals = calculateTotals(order.items || []);
            const isArchived = order.productionStatus === 'ARCHIVED';
            const isFullyProduced = order.productionStatus === 'PRODUCED';
            const isPartiallyProduced = order.productionStatus === 'PARTIALLY_PRODUCED' || (totals.totalProducedQty > 0 && totals.totalProducedQty < totals.totalOrderedQty);

            const pdfUrl = getOrderPdfUrl(order);

            const borderStatusClass = isArchived
              ? (isCream ? 'border-[#d6d3d1] bg-[#f8f8f7]' : 'border-slate-700 bg-slate-900/60 opacity-90')
              : (isFullyProduced 
                  ? (isCream ? 'border-[#86efac]/90 bg-[#fbfdfb]' : 'border-emerald-500/40 bg-slate-900/90')
                  : (isPartiallyProduced 
                      ? (isCream ? 'border-[#fdba74]/90 bg-[#fffdfa]' : 'border-amber-500/40 bg-slate-900/90')
                      : (isCream ? 'border-[#e0d6c4] bg-[#fbf8f2]' : 'border-slate-800 bg-slate-900/80')));

            return `
              <div class="border rounded-2xl transition-all shadow-sm ${borderStatusClass} overflow-hidden" data-order-card-id="${order.id}">
                
                <!-- Compact Header / Accordion Bar -->
                <div class="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-black/5 transition-colors btn-toggle-order-expand" data-order-id="${order.id}">
                  
                  <!-- Left: Chevron + Order Ref + Customer -->
                  <div class="flex items-center gap-3">
                    <button class="w-8 h-8 rounded-xl ${isCream ? 'bg-[#ede5d6] text-[#4d4233]' : 'bg-slate-800 text-slate-300'} flex items-center justify-center transition-transform shrink-0">
                      <span class="material-symbols-outlined text-xl transition-transform ${isExpanded ? 'rotate-180' : ''}">expand_more</span>
                    </button>

                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-black text-sm sm:text-base font-mono ${isCream ? 'text-[#1c1917]' : 'text-white'}">
                          ${order.orderRef || order.odooOrderName || 'Brak numeru'}
                        </span>
                        ${order.odooOrderName && order.odooOrderName !== order.orderRef ? `
                          <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${isCream ? 'bg-[#ede5d6] text-[#5c4a35] border border-[#d8ccb8]' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                            Odoo: ${order.odooOrderName}
                          </span>
                        ` : ''}
                        
                        <!-- Status Badge -->
                        ${isArchived ? `
                          <span class="px-2.5 py-0.5 rounded-md text-xs font-black ${isCream ? 'bg-stone-300 text-stone-900 border border-stone-400' : 'bg-slate-700 text-slate-200 border border-slate-600'}">
                            📦 ARCHIWUM (ROZLICZONE)
                          </span>
                        ` : isFullyProduced ? `
                          <span class="px-2.5 py-0.5 rounded-md text-xs font-black ${isCream ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950/90 text-emerald-300 border border-emerald-700'}">
                            ✅ WYPRODUKOWANO
                          </span>
                        ` : isPartiallyProduced ? `
                          <span class="px-2.5 py-0.5 rounded-md text-xs font-black ${isCream ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950/90 text-amber-300 border border-amber-700'}">
                            ⏳ CZĘŚCIOWO
                          </span>
                        ` : `
                          <span class="px-2.5 py-0.5 rounded-md text-xs font-black ${isCream ? 'bg-stone-200 text-stone-800 border border-stone-300' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                            🔧 W PRODUKCJI
                          </span>
                        `}
                      </div>
                      
                      <div class="flex items-center gap-2 mt-0.5 text-xs ${isCream ? 'text-[#6e604f]' : 'text-slate-400'} flex-wrap">
                        <span class="font-bold ${isCream ? 'text-[#3d3224]' : 'text-slate-200'}">${order.customerName || 'EC Engineering'}</span>
                        <span>•</span>
                        <span>Data: ${order.orderDate || '2026-06'}</span>
                        <span>•</span>
                        <span>${(order.items || []).length} poz. (${totals.totalOrderedQty} szt.)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: PDF Button + Netto Value + Progress Bar + Direct Actions -->
                  <div class="flex items-center gap-2 sm:gap-3 ml-auto" onclick="event.stopPropagation()">
                    
                    <!-- Attached PDF Button (PODGLĄD / POBIERZ) -->
                    ${pdfUrl ? `
                      <button class="btn-preview-pdf flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isCream ? 'bg-[#f0ebe1] hover:bg-[#e4dcce] text-rose-800 border-[#d8ccb8]' : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'}" data-pdf-url="${pdfUrl}" data-title="${order.orderRef || order.odooOrderName}" title="Otwórz oryginalny dokument zamówienia PDF">
                        <span class="material-symbols-outlined text-rose-600 text-[16px]">picture_as_pdf</span>
                        <span class="hidden sm:inline">PDF</span>
                      </button>
                    ` : `
                      <label class="btn-attach-pdf flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isCream ? 'bg-[#f7f2ea] hover:bg-[#ebe2d2] text-[#8c7f6f] border-[#ded3c0]' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border-slate-700/60'}" title="Podepnij plik PDF do tego zlecenia">
                        <span class="material-symbols-outlined text-[16px]">attach_file</span>
                        <span class="hidden md:inline">+ PDF</span>
                        <input type="file" accept=".pdf" class="hidden input-order-pdf-upload" data-order-id="${order.id}" />
                      </label>
                    `}

                    <!-- Progress Bar & Count -->
                    <div class="hidden md:flex flex-col items-end gap-1 w-28">
                      <div class="flex justify-between w-full text-[10px] font-bold ${isCream ? 'text-[#5c4a35]' : 'text-slate-400'}">
                        <span>Postęp</span>
                        <span class="font-mono">${totals.totalProducedQty}/${totals.totalOrderedQty}</span>
                      </div>
                      <div class="w-full bg-black/10 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all ${isArchived ? 'bg-slate-500' : (isFullyProduced ? 'bg-emerald-500' : (totals.totalProducedQty > 0 ? 'bg-amber-500' : 'bg-slate-400'))}" style="width: ${totals.progressPct}%"></div>
                      </div>
                    </div>

                    <!-- Net Value -->
                    <div class="text-right">
                      <span class="text-sm sm:text-base font-black font-mono ${isCream ? 'text-[#1c1917]' : 'text-white'} block">
                        ${totals.netto} zł
                      </span>
                      <span class="text-[10px] ${isCream ? 'text-[#786c5e]' : 'text-slate-400'} font-semibold block">netto</span>
                    </div>

                    <!-- Direct WZ Button (only if not archived) -->
                    ${!isArchived ? (totals.totalProducedQty > 0 ? `
                      <button class="btn-issue-wz-order flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer" data-order-id="${order.id}">
                        <span class="material-symbols-outlined text-[16px]">description</span>
                        <span class="hidden sm:inline">WZ</span>
                      </button>
                    ` : `
                      <button class="btn-issue-wz-order flex items-center gap-1.5 ${isCream ? 'bg-[#e5dccf] text-[#8c7f6f] border-[#d4c6b2]' : 'bg-slate-800/80 text-slate-500 border-slate-700/80'} font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-sm cursor-not-allowed border" data-order-id="${order.id}" data-locked="true" title="⚠️ Wymagane wyprodukowanie min. 1 sztuki przed wystawieniem WZ">
                        <span class="material-symbols-outlined text-[16px]">lock</span>
                        <span class="hidden sm:inline">WZ</span>
                      </button>
                    `) : ''}

                    <!-- Archiving / Status Quick Actions -->
                    ${isArchived ? `
                      <button class="btn-unarchive-order flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} cursor-pointer" data-order-id="${order.id}" title="Przywróć zlecenie z archiwum do zrealizowanych">
                        <span class="material-symbols-outlined text-[16px]">unarchive</span>
                        <span class="hidden lg:inline">Przywróć</span>
                      </button>
                    ` : isFullyProduced ? `
                      <button class="btn-archive-order flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isCream ? 'bg-[#3e3832] hover:bg-[#2c2825] text-white border-[#2c2825]' : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'} cursor-pointer" data-order-id="${order.id}" title="Oznacz zlecenie jako w pełni rozliczone (faktura wystawiona, zapłacone) i przenieś do archiwum">
                        <span class="material-symbols-outlined text-[16px]">archive</span>
                        <span class="hidden lg:inline">Archiwizuj</span>
                      </button>
                    ` : `
                      <button class="btn-toggle-order-status flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isCream ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'} cursor-pointer" data-order-id="${order.id}" data-current-status="${order.productionStatus}" title="Oznacz wszystkie pozycje jako WYPRODUKOWANE">
                        <span class="material-symbols-outlined text-[16px]">done_all</span>
                        <span class="hidden lg:inline">Gotowe</span>
                      </button>
                    `}

                  </div>
                </div>

                <!-- Expanded Details & Items Table -->
                ${isExpanded ? `
                  <div class="border-t ${isCream ? 'border-[#e8dfcf] bg-white' : 'border-slate-800 bg-slate-950/40'} p-3 sm:p-4 flex flex-col gap-3">
                    
                    <!-- Top Action Bar for Order -->
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b ${isCream ? 'border-[#f0e7d8]' : 'border-slate-800/80'} pb-2.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        ${pdfUrl ? `
                          <button class="btn-preview-pdf flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${isCream ? 'bg-[#f0ebe1] hover:bg-[#e4dcce] text-rose-800 border-[#d8ccb8]' : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'} cursor-pointer" data-pdf-url="${pdfUrl}" data-title="${order.orderRef || order.odooOrderName}">
                            <span class="material-symbols-outlined text-rose-600 text-[18px]">picture_as_pdf</span>
                            <span>Podgląd Oryginału PDF</span>
                          </button>
                          <a href="${pdfUrl}" target="_blank" download class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${isCream ? 'bg-[#ede5d6] text-[#3d3224] border-[#d8ccb8]' : 'bg-slate-800 text-slate-300 border-slate-700'}">
                            <span class="material-symbols-outlined text-[16px]">download</span>
                            <span>Pobierz</span>
                          </a>
                        ` : `
                          <label class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#3d3224] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">attach_file</span>
                            <span>Podepnij plik PDF zlecenia</span>
                            <input type="file" accept=".pdf" class="hidden input-order-pdf-upload" data-order-id="${order.id}" />
                          </label>
                        `}

                        <button class="btn-print-order-label flex items-center gap-1.5 ${isCream ? 'bg-[#ebe2d2] hover:bg-[#ded1bd] text-[#3d3224] border-[#d4c6b0]' : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-700/80'} font-bold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 border cursor-pointer" data-order-id="${order.id}">
                          <span class="material-symbols-outlined text-[16px] text-amber-700">qr_code_2</span>
                          <span>Etykiety do paczek</span>
                        </button>
                      </div>

                      <div class="flex items-center gap-2">
                        ${isArchived ? `
                          <button class="btn-unarchive-order flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} cursor-pointer" data-order-id="${order.id}">
                            <span class="material-symbols-outlined text-[16px]">unarchive</span>
                            <span>Przywróć do zrealizowanych</span>
                          </button>
                        ` : `
                          <button class="btn-archive-order flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${isCream ? 'bg-[#3e3832] hover:bg-[#2c2825] text-white border-[#2c2825]' : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'} cursor-pointer" data-order-id="${order.id}">
                            <span class="material-symbols-outlined text-[16px]">archive</span>
                            <span>Zamknij i przenieś do archiwum (FV opłacona)</span>
                          </button>
                        `}
                      </div>
                    </div>
                    
                    <!-- Table of Order Items -->
                    <div class="overflow-x-auto rounded-xl border ${themeStyles.tableBorder}">
                      <table class="w-full text-left text-xs border-collapse">
                        <thead class="${themeStyles.tableHeader} font-bold">
                          <tr>
                            <th class="py-2 px-3 w-8 text-center">LP</th>
                            <th class="py-2 px-3 w-32">SKU / RYSUNEK</th>
                            <th class="py-2 px-3">NAZWA ELEMENTU</th>
                            <th class="py-2 px-3 w-24 text-center">ZAMÓWIONO</th>
                            <th class="py-2 px-3 w-40 text-center">WYPRODUKOWANO</th>
                            <th class="py-2 px-3 w-36 text-center">STATUS POZYCJI</th>
                            <th class="py-2 px-3 w-24 text-right">CENA JEDN.</th>
                            <th class="py-2 px-3 w-28 text-right">WARTOŚĆ</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y ${themeStyles.tableBorder}">
                          ${(order.items || []).map((it, idx) => {
                            const orderedQty = parseFloat(it.shippedQty || it.orderedQty || 1);
                            const producedQty = it.producedQty !== undefined ? parseFloat(it.producedQty) : (it.productionStatus === 'PRODUCED' ? orderedQty : 0);
                            const isItemProduced = it.productionStatus === 'PRODUCED' || producedQty >= orderedQty;
                            const isItemPartial = !isItemProduced && producedQty > 0;
                            const unitPrice = parseFloat(it.unitPrice || 0);
                            const rowNetto = (orderedQty * unitPrice).toFixed(2);

                            return `
                              <tr class="${themeStyles.tableRowBg} transition-colors">
                                <td class="py-2.5 px-3 text-center font-mono ${isCream ? 'text-[#8c7f6f]' : 'text-slate-500'}">${idx + 1}</td>
                                <td class="py-2.5 px-3 font-mono font-bold ${isCream ? 'text-[#2a241e]' : 'text-amber-400'}">${it.sku || it.symbol || '-'}</td>
                                <td class="py-2.5 px-3 font-semibold ${isCream ? 'text-[#1c1917]' : 'text-slate-200'}">
                                  <div>${it.name || 'Brak nazwy'}</div>
                                  ${it.symbol && it.symbol !== it.sku ? `<div class="text-[10px] ${isCream ? 'text-[#8c7f6f]' : 'text-slate-500'} font-mono font-normal">Symbol: ${it.symbol}</div>` : ''}
                                </td>
                                <td class="py-2.5 px-3 text-center font-bold font-mono ${isCream ? 'text-[#2a241e]' : 'text-slate-300'}">
                                  ${orderedQty} ${it.uom || 'szt'}
                                </td>
                                <td class="py-2 px-2 text-center">
                                  <div class="flex items-center justify-center gap-1">
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="${orderedQty}" 
                                      step="1"
                                      value="${producedQty}" 
                                      class="input-item-qty w-16 text-center font-mono font-black text-xs py-1 px-1.5 rounded-lg border outline-none ${isItemProduced ? (isCream ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-emerald-950/60 border-emerald-500 text-emerald-300') : (isItemPartial ? (isCream ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-amber-950/60 border-amber-500 text-amber-300') : (isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-900 border-slate-700 text-white'))}"
                                      data-order-id="${order.id}" 
                                      data-item-id="${it.id}"
                                      data-ordered-qty="${orderedQty}"
                                      title="Wpisz wyprodukowaną ilość (np. 10/${orderedQty})"
                                    />
                                    <span class="font-mono text-xs font-bold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">/ ${orderedQty}</span>
                                  </div>
                                </td>
                                <td class="py-2 px-2 text-center">
                                  <button class="btn-toggle-item-status w-full py-1 px-2.5 rounded-lg font-bold text-xs transition-all border flex items-center justify-center gap-1 cursor-pointer ${isItemProduced ? (isCream ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' : 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900') : (isItemPartial ? (isCream ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900') : (isCream ? 'bg-[#ede5d6] text-[#574a38] border-[#d8ccb8] hover:bg-[#ded1bd]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'))}" data-order-id="${order.id}" data-item-id="${it.id}" data-current-status="${it.productionStatus}">
                                    <span class="material-symbols-outlined text-[14px]">${isItemProduced ? 'check' : (isItemPartial ? 'timelapse' : 'schedule')}</span>
                                    <span>${isItemProduced ? 'GOTOWE' : (isItemPartial ? 'CZĘŚCIOWO' : 'DO ZROBIENIA')}</span>
                                  </button>
                                </td>
                                <td class="py-2.5 px-3 text-right font-mono ${isCream ? 'text-[#5c4a35]' : 'text-slate-400'}">${unitPrice.toFixed(2)} zł</td>
                                <td class="py-2.5 px-3 text-right font-mono font-bold ${isCream ? 'text-emerald-800' : 'text-emerald-400'}">${rowNetto} zł</td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>

                    <!-- Footer of Expanded Card -->
                    <div class="flex flex-wrap justify-between items-center ${themeStyles.footerBox} rounded-xl p-3 border gap-2">
                      <div class="flex items-center gap-2 text-xs">
                        <span class="material-symbols-outlined ${totals.totalProducedQty >= totals.totalOrderedQty ? 'text-emerald-600' : 'text-amber-600'} text-[18px]">
                          ${totals.totalProducedQty >= totals.totalOrderedQty ? 'task_alt' : 'timelapse'}
                        </span>
                        <span class="${isCream ? 'text-[#4d4233]' : 'text-slate-300'} font-bold">
                          Postęp detali: <strong class="${isCream ? 'text-[#1e1913]' : 'text-white'} font-mono">${totals.totalProducedQty} / ${totals.totalOrderedQty} szt.</strong> (${totals.progressPct}%)
                        </span>
                      </div>

                      <div class="flex items-center gap-3">
                        <span class="text-xs font-mono font-bold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">
                          Wartość: <strong class="${isCream ? 'text-[#1e1913]' : 'text-white'}">${totals.netto} zł netto</strong> (${totals.brutto} zł brutto)
                        </span>

                        ${totals.totalProducedQty > 0 && !isArchived ? `
                          <button class="btn-issue-wz-order flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer" data-order-id="${order.id}">
                            <span class="material-symbols-outlined text-[16px]">description</span>
                            <span>WYSTAW DOKUMENT WZ (${totals.totalProducedQty} szt.)</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>

                  </div>
                ` : ''}

              </div>
            `;
          }).join('')}
        </div>
      </main>

      <!-- MODAL: PDF VIEWER -->
      <div id="pdf-viewer-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 ${previewPdfUrl ? 'flex' : 'hidden'} items-center justify-center p-2 sm:p-4">
        <div class="${isCream ? 'bg-[#fbf7f0] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-900 text-slate-100 border-slate-700'} border rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden">
          
          <div class="flex justify-between items-center border-b ${isCream ? 'border-[#ded3c0]' : 'border-slate-800'} p-3 px-4 shrink-0">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-rose-600 text-2xl">picture_as_pdf</span>
              <h2 class="font-bold ${isCream ? 'text-[#2a241e]' : 'text-white'} text-sm sm:text-base font-mono truncate max-w-md">${previewPdfTitle || 'Podgląd Dokumentu PDF'}</h2>
            </div>
            <div class="flex items-center gap-2">
              <a href="${previewPdfUrl || '#'}" target="_blank" download class="flex items-center gap-1 px-3 py-1.5 ${isCream ? 'bg-[#ede5d6] text-[#3d3224] border-[#d8ccb8]' : 'bg-slate-800 text-slate-200 border-slate-700'} rounded-xl border text-xs font-bold">
                <span class="material-symbols-outlined text-[16px]">download</span>
                <span>Pobierz</span>
              </a>
              <button id="close-pdf-modal" class="p-1.5 ${isCream ? 'text-[#786c5e] hover:bg-[#ede5d6]' : 'text-slate-400 hover:text-white hover:bg-slate-800'} rounded-full cursor-pointer">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          <div class="flex-1 w-full bg-slate-950/20 relative">
            ${previewPdfUrl ? `
              <iframe src="${previewPdfUrl}" class="w-full h-full border-none" title="Podgląd PDF"></iframe>
            ` : ''}
          </div>

        </div>
      </div>

      <!-- MODAL: ADD / EDIT ORDER & PDF IMPORT -->
      <div id="import-modal-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 ${showImportModal ? 'flex' : 'hidden'} items-center justify-center p-3">
        <div class="${isCream ? 'bg-[#fbf7f0] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-900 text-slate-100 border-slate-700'} border rounded-2xl max-w-3xl w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
          
          <div class="flex justify-between items-center border-b ${isCream ? 'border-[#ded3c0]' : 'border-slate-800'} pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#d95c00] text-2xl">upload_file</span>
              <h2 class="font-bold ${isCream ? 'text-[#2a241e]' : 'text-white'} text-base">Wprowadź Nowe Zlecenie Kontrahenta</h2>
            </div>
            <button id="close-import-modal" class="p-1 ${isCream ? 'text-[#786c5e] hover:bg-[#ede5d6]' : 'text-slate-400 hover:text-white hover:bg-slate-800'} rounded-full cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- PDF Drag & Drop Zone -->
          <div id="drop-zone" class="border-2 border-dashed ${isCream ? 'border-[#d8ccb8] bg-[#f5eedf]/60 hover:border-[#d95c00]' : 'border-slate-700 bg-slate-950/50 hover:border-[#ff6b00]'} rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
            <span class="material-symbols-outlined text-4xl text-[#d95c00]">picture_as_pdf</span>
            <div class="text-xs font-bold ${isCream ? 'text-[#2a241e]' : 'text-white'}">Przeciągnij i upuść plik PDF zamówienia (np. zlecenia EC, Alpha, Matmont, NIKMET)</div>
            <div class="text-[11px] ${isCream ? 'text-[#786c5e]' : 'text-slate-400'}">lub kliknij tutaj, aby wybrać plik z dysku</div>
            <input id="pdf-input" type="file" accept=".pdf" class="hidden" />
          </div>

          <!-- Order Form Fields -->
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Firma / Kontrahent:</label>
                <select id="modal-customer" class="${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-3 py-2 text-xs font-bold outline-none">
                  <option value="EC Engineering" ${currentEditingOrder.customerName === 'EC Engineering' ? 'selected' : ''}>EC Engineering</option>
                  <option value="MV CENTER" ${currentEditingOrder.customerName === 'MV CENTER' ? 'selected' : ''}>MV CENTER</option>
                  <option value="ZMJ" ${currentEditingOrder.customerName === 'ZMJ' ? 'selected' : ''}>ZMJ</option>
                  <option value="MATMONT" ${currentEditingOrder.customerName === 'MATMONT' ? 'selected' : ''}>MATMONT</option>
                  <option value="ALPHA TECHNOLOGY" ${currentEditingOrder.customerName === 'ALPHA TECHNOLOGY' ? 'selected' : ''}>ALPHA TECHNOLOGY</option>
                  <option value="NIKMET" ${currentEditingOrder.customerName === 'NIKMET' ? 'selected' : ''}>NIKMET</option>
                  <option value="KINAR" ${currentEditingOrder.customerName === 'KINAR' ? 'selected' : ''}>KINAR</option>
                  <option value="Husqvarna" ${currentEditingOrder.customerName === 'Husqvarna' ? 'selected' : ''}>Husqvarna Poland</option>
                  <option value="Inny" ${!['EC Engineering', 'MV CENTER', 'ZMJ', 'MATMONT', 'ALPHA TECHNOLOGY', 'NIKMET', 'KINAR', 'Husqvarna'].includes(currentEditingOrder.customerName) ? 'selected' : ''}>+ Inna firma zewnętrzna...</option>
                </select>
                <input id="modal-custom-cust-name" type="text" placeholder="Wpisz nazwę innej firmy" value="${currentEditingOrder.customerName || ''}" class="${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-3 py-1.5 text-xs outline-none mt-1 ${['EC Engineering', 'MV CENTER', 'ZMJ', 'MATMONT', 'ALPHA TECHNOLOGY', 'NIKMET', 'KINAR', 'Husqvarna'].includes(currentEditingOrder.customerName) ? 'hidden' : ''}" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Numer Ref. Zlecenia:</label>
                <input id="modal-ref" type="text" value="${currentEditingOrder.orderRef || ''}" placeholder="np. ZZ-123-09-2026" class="${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Termin Realizacji:</label>
                <input id="modal-delivery" type="date" value="${currentEditingOrder.deliveryDate || ''}" class="${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-3 py-2 text-xs font-bold outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Status początkowy:</label>
                <select id="modal-status" class="${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-3 py-2 text-xs font-bold outline-none">
                  <option value="IN_PRODUCTION" ${currentEditingOrder.productionStatus === 'IN_PRODUCTION' ? 'selected' : ''}>⏳ W produkcji / Do produkcji</option>
                  <option value="PRODUCED" ${currentEditingOrder.productionStatus === 'PRODUCED' ? 'selected' : ''}>✅ Zrealizowane (Gotowe do WZ)</option>
                  <option value="ARCHIVED" ${currentEditingOrder.productionStatus === 'ARCHIVED' ? 'selected' : ''}>📦 Archiwum (Rozliczone & Opłacone)</option>
                </select>
              </div>
            </div>

            <!-- Items Table in Modal -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold ${isCream ? 'text-[#2a241e]' : 'text-white'} uppercase">Detale / Pozycje (${currentEditingOrder.items?.length || 0})</span>
                <button id="modal-add-row" class="px-3 py-1.5 ${isCream ? 'bg-[#ede5d6] hover:bg-[#e0d6c2] text-[#3d3224] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} font-bold text-xs rounded-xl border cursor-pointer">
                  + Dodaj detal
                </button>
              </div>

              <div class="overflow-x-auto max-h-60 border ${isCream ? 'border-[#ded3c0]' : 'border-slate-800'} rounded-xl">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="${isCream ? 'bg-[#ede5d6] text-[#5c4e3e]' : 'bg-slate-950 text-slate-400'} font-bold sticky top-0">
                    <tr>
                      <th class="p-2 w-28">SKU / RYSUNEK</th>
                      <th class="p-2">NAZWA DETALU</th>
                      <th class="p-2 w-20 text-center">ILOŚĆ (SZT)</th>
                      <th class="p-2 w-24 text-right">CENA NETTO</th>
                      <th class="p-2 w-10 text-center">X</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y ${isCream ? 'divide-[#ede5d6] bg-white' : 'divide-slate-800 bg-slate-900/80'}">
                    ${(currentEditingOrder.items || []).map((it, idx) => `
                      <tr>
                        <td class="p-1.5"><input type="text" class="modal-item-sku w-full ${isCream ? 'bg-[#faf6f0] border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded p-1.5 text-xs" value="${it.sku || ''}" data-idx="${idx}" /></td>
                        <td class="p-1.5"><input type="text" class="modal-item-name w-full ${isCream ? 'bg-[#faf6f0] border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded p-1.5 text-xs" value="${it.name || ''}" data-idx="${idx}" /></td>
                        <td class="p-1.5"><input type="number" class="modal-item-qty w-full ${isCream ? 'bg-[#faf6f0] border-[#d8ccb8] text-amber-900' : 'bg-slate-950 border-slate-700 text-amber-300'} border rounded p-1.5 text-xs text-center font-bold" value="${it.shippedQty || it.orderedQty || 1}" data-idx="${idx}" /></td>
                        <td class="p-1.5"><input type="number" step="0.01" class="modal-item-price w-full ${isCream ? 'bg-[#faf6f0] border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded p-1.5 text-xs text-right" value="${it.unitPrice || 0}" data-idx="${idx}" /></td>
                        <td class="p-1.5 text-center"><button class="modal-del-row text-rose-500 hover:text-rose-700 p-1 cursor-pointer" data-idx="${idx}">🗑️</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Modal Action Footer -->
            <div class="flex justify-between items-center pt-3 border-t ${isCream ? 'border-[#ded3c0]' : 'border-slate-800'}">
              <button id="modal-sync-odoo" class="flex items-center gap-1.5 bg-[#d95c00] hover:bg-[#c24f00] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 uppercase cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
                <span>ZAPISZ & WYŚLIJ DO ODOO</span>
              </button>

              <button id="modal-save-local" class="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">save</span>
                <span>ZAPISZ LOKALNIE</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Navigation back to warehouse/dashboard
    const btnBack = container.querySelector('#btn-back-dash');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigateTo('dashboard');
        }
      });
    }

    // Navigation to WZ generator
    const btnNavWz = container.querySelector('#btn-nav-wz');
    if (btnNavWz) {
      btnNavWz.addEventListener('click', () => navigateTo('wz'));
    }

    // Theme toggles
    const btnCream = container.querySelector('#btn-theme-cream');
    const btnDark = container.querySelector('#btn-theme-dark');
    if (btnCream) {
      btnCream.addEventListener('click', () => {
        currentTheme = 'warm-cream';
        localStorage.setItem('bluemake_ui_theme', 'warm-cream');
        renderUI();
      });
    }
    if (btnDark) {
      btnDark.addEventListener('click', () => {
        currentTheme = 'soft-dark';
        localStorage.setItem('bluemake_ui_theme', 'soft-dark');
        renderUI();
      });
    }

    // Category Tabs (ACTIVE, COMPLETED, ARCHIVED, ALL)
    const tabActive = container.querySelector('#tab-active');
    const tabCompleted = container.querySelector('#tab-completed');
    const tabArchived = container.querySelector('#tab-archived');
    const tabAll = container.querySelector('#tab-all');

    if (tabActive) {
      tabActive.addEventListener('click', () => {
        activeTab = 'ACTIVE';
        renderUI();
      });
    }
    if (tabCompleted) {
      tabCompleted.addEventListener('click', () => {
        activeTab = 'COMPLETED';
        renderUI();
      });
    }
    if (tabArchived) {
      tabArchived.addEventListener('click', () => {
        activeTab = 'ARCHIVED';
        renderUI();
      });
    }
    if (tabAll) {
      tabAll.addEventListener('click', () => {
        activeTab = 'ALL';
        renderUI();
      });
    }

    // Expand / Collapse all toggle
    const btnToggleAllExpand = container.querySelector('#btn-toggle-all-expand');
    if (btnToggleAllExpand) {
      btnToggleAllExpand.addEventListener('click', () => {
        const filtered = getFilteredOrders();
        if (expandedOrderIds.size === filtered.length && filtered.length > 0) {
          expandedOrderIds.clear();
        } else {
          filtered.forEach(o => expandedOrderIds.add(o.id));
        }
        renderUI();
      });
    }

    // Month filter select
    const monthSelect = container.querySelector('#month-filter-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        activeMonthFilter = e.target.value;
        renderUI();
      });
    }

    // Search input
    const searchInput = container.querySelector('#orders-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderUI();
      });
    }

    // Reset filters button
    const btnReset = container.querySelector('#btn-reset-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        activeTab = 'ACTIVE';
        activeCustomerFilter = 'ALL';
        activeMonthFilter = 'ALL';
        searchQuery = '';
        renderUI();
      });
    }

    // Company filter buttons
    container.querySelectorAll('.btn-filter-company').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCustomerFilter = btn.getAttribute('data-company');
        renderUI();
      });
    });

    // Individual accordion toggle
    container.querySelectorAll('.btn-toggle-order-expand').forEach(cardHeader => {
      cardHeader.addEventListener('click', () => {
        const orderId = cardHeader.getAttribute('data-order-id');
        if (expandedOrderIds.has(orderId)) {
          expandedOrderIds.delete(orderId);
        } else {
          expandedOrderIds.add(orderId);
        }
        renderUI();
      });
    });

    // Partial Quantity input change
    container.querySelectorAll('.input-item-qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const orderId = input.getAttribute('data-order-id');
        const itemId = input.getAttribute('data-item-id');
        const orderedQty = parseFloat(input.getAttribute('data-ordered-qty') || 1);
        let val = parseFloat(input.value) || 0;
        if (val < 0) val = 0;
        if (val > orderedQty) val = orderedQty;
        updateItemProducedQty(orderId, itemId, val);
        renderUI();
      });
    });

    // Toggle single item status
    container.querySelectorAll('.btn-toggle-item-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        const itemId = btn.getAttribute('data-item-id');
        const currentStatus = btn.getAttribute('data-current-status');

        if (currentStatus === 'PRODUCED') {
          if (!confirm('Czy na pewno chcesz cofnąć status tej pozycji do realizacji?')) {
            return;
          }
        }
        toggleItemProductionStatus(orderId, itemId);
        renderUI();
      });
    });

    // Toggle whole order status (Gotowe)
    container.querySelectorAll('.btn-toggle-order-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        const currentStatus = btn.getAttribute('data-current-status');

        if (currentStatus === 'PRODUCED') {
          if (!confirm('Czy na pewno chcesz cofnąć status całego zlecenia do "W trakcie produkcji"?')) {
            return;
          }
        }
        toggleOrderProductionStatus(orderId);
        renderUI();
      });
    });

    // Archive order action (Przenieś do archiwum)
    container.querySelectorAll('.btn-archive-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        if (confirm('📦 Czy chcesz oznaczyć to zlecenie jako w pełni rozliczone (WZ i faktura wystawione, zapłacone) i przenieść do Archiwum?')) {
          archiveOrder(orderId);
          renderUI();
        }
      });
    });

    // Unarchive order action (Przywróć z archiwum)
    container.querySelectorAll('.btn-unarchive-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        unarchiveOrder(orderId);
        renderUI();
      });
    });

    // Preview PDF Modal Trigger
    container.querySelectorAll('.btn-preview-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pdfUrl = btn.getAttribute('data-pdf-url');
        const title = btn.getAttribute('data-title');
        previewPdfUrl = pdfUrl;
        previewPdfTitle = `Oryginał Zamówienia: ${title}`;
        renderUI();
      });
    });

    // Close PDF Modal
    const closePdfModal = container.querySelector('#close-pdf-modal');
    if (closePdfModal) {
      closePdfModal.addEventListener('click', () => {
        previewPdfUrl = null;
        previewPdfTitle = '';
        renderUI();
      });
    }

    // Attach PDF input change (Direct file attachment)
    container.querySelectorAll('.input-order-pdf-upload').forEach(input => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const file = e.target.files[0];
        const orderId = input.getAttribute('data-order-id');
        if (file && orderId) {
          const fakeUrl = URL.createObjectURL(file);
          setOrderPdf(orderId, fakeUrl, file.name);
          alert(`✅ Załączono plik PDF "${file.name}" do zlecenia!`);
          renderUI();
        }
      });
    });

    // Issue WZ document button
    container.querySelectorAll('.btn-issue-wz-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.getAttribute('data-locked') === 'true') {
          alert('⚠️ Przed wystawieniem WZ należy oznaczyć przynajmniej część elementów jako wyprodukowane (wpisz ilość wyprodukowaną lub kliknij status pozycji).');
          return;
        }
        const orderId = btn.getAttribute('data-order-id');
        const all = getSavedOrders();
        const order = all.find(o => o.id === orderId);
        if (order) {
          const itemsToWz = (order.items || []).filter(it => (it.producedQty !== undefined ? it.producedQty > 0 : it.productionStatus === 'PRODUCED')).map(it => ({
            id: `wz_it_${Date.now()}_${Math.random()}`,
            symbol: it.symbol || it.sku || '',
            name: it.name || '',
            quantity: it.producedQty !== undefined ? it.producedQty : (it.shippedQty || it.orderedQty || 1),
            unit: it.uom || 'szt',
            price: it.unitPrice || 0
          }));

          const wzDraft = {
            customerName: order.customerName || 'EC Engineering',
            orderNumber: order.orderRef || order.odooOrderName || '',
            items: itemsToWz
          };

          sessionStorage.setItem('bluemake_wz_prefill', JSON.stringify(wzDraft));
          navigateTo('wz');
        }
      });
    });

    // Print label for order
    container.querySelectorAll('.btn-print-order-label').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        const all = getSavedOrders();
        const order = all.find(o => o.id === orderId);
        if (order) {
          printCustomerLabelsHtml(order.customerName, (order.items || []).map(it => ({
            symbol: it.symbol || it.sku,
            name: it.name,
            quantity: it.producedQty || it.shippedQty || it.orderedQty || 1,
            unit: it.uom || 'szt'
          })));
        }
      });
    });

    // Modal Add / Edit Order triggers
    const btnOpenImport = container.querySelector('#btn-open-import');
    const closeImportModal = container.querySelector('#close-import-modal');
    if (btnOpenImport) {
      btnOpenImport.addEventListener('click', () => {
        showImportModal = true;
        renderUI();
      });
    }
    if (closeImportModal) {
      closeImportModal.addEventListener('click', () => {
        showImportModal = false;
        renderUI();
      });
    }

    // Modal Drop Zone & PDF File Picker
    const dropZone = container.querySelector('#drop-zone');
    const pdfInput = container.querySelector('#pdf-input');
    if (dropZone && pdfInput) {
      dropZone.addEventListener('click', () => pdfInput.click());
      pdfInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const parsedData = await parseOrderPdf(file);
            currentEditingOrder = {
              ...currentEditingOrder,
              orderRef: parsedData.orderRef || file.name.replace('.pdf', ''),
              customerName: parsedData.customerName || 'EC Engineering',
              items: parsedData.items || [],
              pdfUrl: URL.createObjectURL(file)
            };
            showImportModal = true;
            renderUI();
          } catch (err) {
            alert('Błąd odczytu pliku PDF: ' + err.message);
          }
        }
      });
    }

    // Modal Save Local
    const btnModalSaveLocal = container.querySelector('#modal-save-local');
    if (btnModalSaveLocal) {
      btnModalSaveLocal.addEventListener('click', () => {
        const cust = container.querySelector('#modal-customer').value;
        const ref = container.querySelector('#modal-ref').value;
        const deliv = container.querySelector('#modal-delivery').value;
        const stat = container.querySelector('#modal-status').value;

        currentEditingOrder.customerName = cust === 'Inny' ? container.querySelector('#modal-custom-cust-name').value : cust;
        currentEditingOrder.orderRef = ref;
        currentEditingOrder.deliveryDate = deliv;
        currentEditingOrder.productionStatus = stat;

        saveOrderToDb(currentEditingOrder);
        showImportModal = false;
        renderUI();
      });
    }

    // Modal Sync Odoo
    const btnModalSyncOdoo = container.querySelector('#modal-sync-odoo');
    if (btnModalSyncOdoo) {
      btnModalSyncOdoo.addEventListener('click', async () => {
        try {
          btnModalSyncOdoo.disabled = true;
          btnModalSyncOdoo.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Przesyłanie do Odoo...`;
          
          const synced = await syncOrderToOdoo(currentEditingOrder);
          saveOrderToDb(synced);
          showImportModal = false;
          alert('✅ Zamówienie zostało pomyślnie zsynchronizowane z Odoo!');
          renderUI();
        } catch (err) {
          alert('Błąd synchronizacji z Odoo: ' + err.message);
        }
      });
    }
  }

  // Initial render
  renderUI();
}
