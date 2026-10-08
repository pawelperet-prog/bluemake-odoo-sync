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
  setOrderPdf,
  getOrderYear,
  getAvailableOrderYears,
  getAnnualOrdersSummary,
  fetchServerOrders
} from '../services/orderStorageService.js';
import { getSavedCustomers, getOrderWzShipmentSummary, prepareOrderItemsForWz, fetchServerWzDocuments } from '../services/wzStorageService.js';
import { printCustomerLabelsHtml, openAndPrintEcBarcodePdf, resolveOrderPdfUrl } from '../utils/customerLabelGenerator.js';
import { findItemDrawingPdf } from '../services/drawingService.js';
import { getProductAttachments, getAttachmentData } from '../services/odooApi.js';
import { isAdmin, getCurrentOperator, switchActiveOperator, fetchServerAuditLogs, getAuditLogs } from '../services/authService.js';
import { fetchComments, submitComment, toggleResolveComment, deleteComment } from '../services/issueCommentService.js';

export function renderOrderImportView(container, navigateTo) {
  let currentOperator = getCurrentOperator();
  let isUserAdmin = isAdmin(currentOperator);

  // Color Theme: 'warm-cream' | 'soft-dark'
  let currentTheme = localStorage.getItem('bluemake_ui_theme') || 'warm-cream';

  // Year Selection: '2026' (Bieżący domyślny) | '2025' | '2027' | 'ALL'
  let activeYear = '2026';
  let showAnnualBreakdown = false;

  // Category Tabs: 'ALL' (Wszystkie domyślnie) | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  let activeTab = 'ALL';

  let activeCustomerFilter = 'ALL';
  let activeMonthFilter = 'ALL';
  let currentSortBy = 'DEFAULT'; // 'DEFAULT' (Po terminie = Priorytet + Najbliższy termin) | 'DELIVERY_DATE_ASC' | 'DELIVERY_DATE_DESC' | 'ORDER_DATE_DESC' | 'ORDER_DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC'
  let filterOnlyOverdue = false;
  let filterOnlyIssues = false;
  let searchQuery = '';
  let searchCursorPos = 0;
  let isSearchingFocus = false;
  let showImportModal = false;

  // Workshop comments & photo issues state
  let orderComments = [];
  let centralAuditLogs = getAuditLogs() || [];
  let isSyncing = false;
  let showAddCommentModal = false;
  let activeCommentOrder = null;
  let activeCommentSku = '';
  let selectedCommentPhotoFile = null;
  let selectedCommentPhotoPreview = null;
  let lightboxImageUrl = null;

  async function syncAllData(silent = false) {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const [fetchedOrders, fetchedWz, comments, logs] = await Promise.all([
        fetchServerOrders(true),
        fetchServerWzDocuments(true),
        fetchComments(),
        fetchServerAuditLogs()
      ]);
      if (comments) orderComments = comments;
      if (logs) centralAuditLogs = logs;
      renderUI();
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      isSyncing = false;
    }
  }

  // Trigger initial server sync
  syncAllData(true);

  // Periodic polling every 8s to sync changes between Paweł and Mateusz in real-time
  const pollInterval = setInterval(() => {
    if (!container.isConnected) {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocusHandler);
      window.removeEventListener('bluemake_orders_synced', onOrdersSynced);
      return;
    }
    const isEditing = document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    const isModalOpen = Boolean(
      container.querySelector('#issue-comment-modal:not(.hidden)') || 
      container.querySelector('#image-zoom-modal:not(.hidden)') || 
      previewPdfUrl
    );
    if (!isEditing && !isModalOpen) {
      Promise.all([
        fetchServerOrders(),
        fetchServerWzDocuments(),
        fetchComments(),
        fetchServerAuditLogs()
      ]).then(([orders, wzs, comments, logs]) => {
        let changed = false;
        if (comments && JSON.stringify(comments) !== JSON.stringify(orderComments)) {
          orderComments = comments;
          changed = true;
        }
        if (logs && JSON.stringify(logs.slice(0, 5)) !== JSON.stringify(centralAuditLogs.slice(0, 5))) {
          centralAuditLogs = logs;
          changed = true;
        }
        if (changed) {
          renderUI();
        }
      }).catch(() => {});
    }
  }, 8000);

  const onFocusHandler = () => {
    syncAllData(true);
  };
  window.addEventListener('focus', onFocusHandler);

  const onOrdersSynced = (e) => {
    if (e.detail?.source === 'server') {
      renderUI();
    }
  };
  window.addEventListener('bluemake_orders_synced', onOrdersSynced);

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
    const clean = (order.orderRef || order.odooOrderName || '').replace(/[\/\s]/g, '-');
    for (const k in knownPdfMap) {
      if (k.replace(/[\/\s]/g, '-') === clean) return knownPdfMap[k];
    }
    if (clean.toLowerCase().startsWith('zz-')) {
      const noSuff = clean.replace(/-(ec|zn)$/i, '');
      return `/orders_pdf/${noSuff}.pdf`;
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
      // If a specific year is chosen, only include months for that year
      if (activeYear !== 'ALL' && getOrderYear(o) !== activeYear) return;

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
    const todayStr = new Date().toISOString().split('T')[0];

    const filtered = all.filter(ord => {
      // 0. Year filter (Default 2026, or chosen year - 2025 is kept but excluded from general view)
      if (activeYear !== 'ALL') {
        if (getOrderYear(ord) !== activeYear) return false;
      }

      const isDone = ord.productionStatus === 'PRODUCED' || ord.productionStatus === 'ARCHIVED' || ord.isArchived === true;

      // 1. Tab filter
      if (activeTab === 'ACTIVE') {
        if (isDone) return false;
      } else if (activeTab === 'COMPLETED') {
        if (ord.productionStatus !== 'PRODUCED') return false;
      } else if (activeTab === 'ARCHIVED') {
        if (ord.productionStatus !== 'ARCHIVED' && !ord.isArchived) return false;
      }

      // 2. Overdue filter (Tylko po terminie)
      const isOverdue = !isDone && ord.deliveryDate && ord.deliveryDate < todayStr;
      if (filterOnlyOverdue) {
        if (!isOverdue) return false;
      }

      // 2b. Workshop Issues & Notes filter (Tylko zlecenia ze zgłoszeniami od Mateusza/operatorów)
      if (filterOnlyIssues) {
        const hasIssue = orderComments.some(c => c.orderId === ord.id && c.status !== 'RESOLVED');
        if (!hasIssue) return false;
      }

      // 3. Company filter
      if (activeCustomerFilter !== 'ALL') {
        const cName = (ord.customerName || ord.category || '').toUpperCase();
        const fName = activeCustomerFilter.toUpperCase();
        if (!cName.includes(fName) && !fName.includes(cName)) return false;
      }

      // 4. Month filter
      if (activeMonthFilter !== 'ALL') {
        const d = ord.orderDate || ord.deliveryDate || '';
        if (!d.startsWith(activeMonthFilter)) return false;
      }

      // 5. Search query
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

    return sortOrders(filtered, currentSortBy, todayStr);
  }

  function sortOrders(orders, sortBy, todayStr) {
    const getOrderNetto = (ord) => {
      let sum = 0;
      (ord.items || []).forEach(it => {
        const q = parseFloat(it.orderedQty || it.quantity || 1);
        const p = parseFloat(it.unitPrice || 0);
        sum += q * p;
      });
      return sum;
    };

    const getEffectiveDeliveryDate = (ord) => {
      return ord.deliveryDate || ord.orderDate || '9999-99-99';
    };

    return [...orders].sort((a, b) => {
      if (sortBy === 'ORDER_DATE_DESC') {
        return (b.orderDate || '').localeCompare(a.orderDate || '');
      }
      if (sortBy === 'ORDER_DATE_ASC') {
        return (a.orderDate || '').localeCompare(b.orderDate || '');
      }
      if (sortBy === 'DELIVERY_DATE_ASC') {
        return getEffectiveDeliveryDate(a).localeCompare(getEffectiveDeliveryDate(b));
      }
      if (sortBy === 'DELIVERY_DATE_DESC') {
        return getEffectiveDeliveryDate(b).localeCompare(getEffectiveDeliveryDate(a));
      }
      if (sortBy === 'AMOUNT_DESC') {
        return getOrderNetto(b) - getOrderNetto(a);
      }
      if (sortBy === 'AMOUNT_ASC') {
        return getOrderNetto(a) - getOrderNetto(b);
      }

      // DEFAULT:
      // "domyslnie pokazuje zamowienie ktore jest najblizej daty realizacji lub daty poterminie to priorytet pozniej data realizacji"
      const isDoneA = a.productionStatus === 'PRODUCED' || a.productionStatus === 'ARCHIVED' || a.isArchived === true;
      const isDoneB = b.productionStatus === 'PRODUCED' || b.productionStatus === 'ARCHIVED' || b.isArchived === true;

      // Active orders come before completed/archived orders
      if (isDoneA !== isDoneB) {
        return isDoneA ? 1 : -1;
      }

      const dateA = a.deliveryDate || a.orderDate || '9999-99-99';
      const dateB = b.deliveryDate || b.orderDate || '9999-99-99';

      const isOverdueA = !isDoneA && (a.deliveryDate ? a.deliveryDate < todayStr : false);
      const isOverdueB = !isDoneB && (b.deliveryDate ? b.deliveryDate < todayStr : false);

      // Overdue orders have absolute TOP PRIORITY!
      if (isOverdueA !== isOverdueB) {
        return isOverdueA ? -1 : 1;
      }

      // If both are overdue, sort by delivery date ascending (the most overdue first)
      if (isOverdueA && isOverdueB) {
        return dateA.localeCompare(dateB);
      }

      // If both are upcoming active, sort by delivery date ascending (closest deadline first!)
      return dateA.localeCompare(dateB);
    });
  }

  function renderUI() {
    const allOrders = getSavedOrders();
    const availableYears = getAvailableOrderYears();
    const annualSummary = getAnnualOrdersSummary();

    // Reset activeMonthFilter if it doesn't match active year
    if (activeYear !== 'ALL' && activeMonthFilter !== 'ALL' && !activeMonthFilter.startsWith(activeYear)) {
      activeMonthFilter = 'ALL';
    }

    const filteredOrders = getFilteredOrders();
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

    // Grand counts across selected active year
    const activeYearOrders = allOrders.filter(o => activeYear === 'ALL' || getOrderYear(o) === activeYear);
    let grandActiveCount = 0;
    let grandCompletedCount = 0;
    let grandArchivedCount = 0;
    activeYearOrders.forEach(o => {
      if (o.productionStatus === 'ARCHIVED') grandArchivedCount++;
      else if (o.productionStatus === 'PRODUCED') grandCompletedCount++;
      else grandActiveCount++;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    let totalOverdueCount = 0;
    activeYearOrders.forEach(o => {
      const isDone = o.productionStatus === 'PRODUCED' || o.productionStatus === 'ARCHIVED' || o.isArchived === true;
      if (!isDone && o.deliveryDate && o.deliveryDate < todayStr) {
        totalOverdueCount++;
      }
    });

    const isCream = currentTheme === 'warm-cream';

    // Set CNC machine background on container with subtle gradient overlay
    container.style.backgroundImage = isCream
      ? "linear-gradient(rgba(235, 227, 213, 0.90), rgba(224, 214, 198, 0.94)), url('/cnc_machine_bg.jpg')"
      : "linear-gradient(rgba(10, 15, 26, 0.90), rgba(15, 23, 42, 0.95)), url('/cnc_machine_bg.jpg')";
    container.style.backgroundPosition = "center center";
    container.style.backgroundSize = "cover";
    container.style.backgroundAttachment = "fixed";
    container.style.backgroundRepeat = "no-repeat";
    container.style.minHeight = "100vh";

    // Theme palette (darker, richer, deeper cream tone)
    const themeStyles = {
      headerBg: isCream ? 'bg-[#ebe2d4]/95 backdrop-blur-md border-[#d2c3ad] text-[#221c16]' : 'bg-slate-900 border-slate-800 text-slate-100',
      mainText: isCream ? 'text-[#1e1812]' : 'text-slate-200',
      btnBack: isCream ? 'bg-[#ded0bc] hover:bg-[#cfbfab] text-[#34291f] border-[#cbbba5]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
      cardBg: isCream ? 'bg-[#f4ebe0]/95 border-[#d6c7b2] text-[#221c16] shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md',
      metricBoxInProd: isCream ? 'bg-[#fcefdc]/90 border-[#e8be88] text-[#78350f]' : 'bg-slate-900/90 border-amber-500/30 text-amber-300',
      metricBoxProd: isCream ? 'bg-[#e8f7ee]/90 border-[#a3e6be] text-[#14532d]' : 'bg-slate-900/90 border-emerald-500/30 text-emerald-300',
      metricBoxArchived: isCream ? 'bg-[#ede8e1]/90 border-[#cdc6bc] text-[#44403c]' : 'bg-slate-900/90 border-slate-700 text-slate-300',
      metricBoxPieces: isCream ? 'bg-[#eee9fc]/90 border-[#c7bcf5] text-[#4338ca]' : 'bg-slate-900/90 border-indigo-500/30 text-indigo-300',
      metricBoxValue: isCream ? 'bg-[#ede3d4]/90 border-[#d2c2ad] text-[#201912]' : 'bg-slate-900/90 border-slate-800 text-white',
      filterPanel: isCream ? 'bg-[#ebe0d2]/95 border-[#cfbfa9]' : 'bg-slate-900 border-slate-800',
      inputSearch: isCream ? 'bg-[#f8f2e9] border-[#cfbfa9] text-[#1e1812] placeholder-[#8a7a68] focus:border-amber-600' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500',
      tableHeader: isCream ? 'bg-[#e2d5c2] text-[#453727] border-[#cfbfa9]' : 'bg-slate-950 text-slate-400 border-slate-800',
      tableRowBg: isCream ? 'bg-[#faf5ee]/95 hover:bg-[#ede1d0]' : 'bg-slate-900/60 hover:bg-slate-800/40',
      tableBorder: isCream ? 'border-[#d8c9b4]' : 'border-slate-800',
      footerBox: isCream ? 'bg-[#e7dcce] border-[#cfbfa9]' : 'bg-slate-950/70 border-slate-800'
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
            <h1 class="font-bold text-sm sm:text-base tracking-tight ${isCream ? 'text-[#2a241e]' : 'text-white'}">Zlecenia Firm & Produkcja <span class="text-amber-600 font-mono">${activeYear === 'ALL' ? 'Wszystkie Lata' : activeYear}</span></h1>
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

          <!-- Operator Switcher Dropdown (1-Click Switch: Paweł, Mateusz, Szymon, Patryk) -->
          <div class="flex items-center gap-1.5 ${isCream ? 'bg-[#e9dfce] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800/90 text-white border-slate-700'} px-2.5 py-1 rounded-xl text-xs border shadow-sm">
            <span class="material-symbols-outlined text-[16px] ${isUserAdmin ? 'text-amber-600' : 'text-indigo-500'}">
              ${isUserAdmin ? 'admin_panel_settings' : 'badge'}
            </span>
            <select id="header-select-operator" class="bg-transparent font-black text-xs cursor-pointer outline-none border-none pr-1 ${isCream ? 'text-[#2c2825]' : 'text-white'}">
              <option value="Paweł" ${currentOperator?.name === 'Paweł' ? 'selected' : ''}>👑 Paweł (Admin)</option>
              <option value="Mateusz" ${currentOperator?.name === 'Mateusz' ? 'selected' : ''}>👑 Mateusz (Admin)</option>
              <option value="Szymon" ${currentOperator?.name === 'Szymon' ? 'selected' : ''}>📦 Szymon (Magazynier)</option>
              <option value="Patryk" ${currentOperator?.name === 'Patryk' ? 'selected' : ''}>📦 Patryk (Magazynier)</option>
            </select>
          </div>

          <!-- Synchronizuj Button -->
          <button id="btn-manual-sync" class="flex items-center gap-1.5 ${isCream ? 'bg-[#ede3d3] hover:bg-[#ded1bd] text-[#3d3224] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm" title="Synchronizuj dane z serwerem i pobierz zmiany od Mateusza/Pawła">
            <span id="sync-icon-spin" class="material-symbols-outlined text-[16px] text-emerald-600 ${isSyncing ? 'animate-spin' : ''}">sync</span>
            <span class="hidden md:inline">SYNCHRONIZUJ</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <!-- Dziennik Zdarzeń Button -->
          <button id="btn-nav-history" class="flex items-center gap-1.5 ${isCream ? 'bg-[#f7efe1] hover:bg-[#eadbc3] text-amber-950 border-amber-300' : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'} px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-sm" title="Zobacz co robili Mateusz, Paweł i pracownicy w Dzienniku Zdarzeń">
            <span class="material-symbols-outlined text-[16px] text-amber-600">history_edu</span>
            <span class="hidden lg:inline">DZIENNIK ZDARZEŃ</span>
          </button>

          <!-- Przycisk Dodaj Notatkę / Zgłoś Wadę -->
          <button id="btn-header-add-issue" class="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer" title="Dodaj notatkę lub zgłoś usterkę/problem ze zdjęciem">
            <span class="material-symbols-outlined text-[16px]">edit_note</span>
            <span class="hidden sm:inline">+ NOTATKA / FOTO</span>
          </button>

          <!-- Przycisk przejścia do Kreatora WZ -->
          <button id="btn-nav-wz" class="flex items-center gap-1.5 bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer">
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

        <!-- Live Activity Bar (Ostatnie działania Mateusza i Pawła na żywo) -->
        <div class="border rounded-2xl p-3 sm:p-3.5 ${isCream ? 'bg-[#f7f0e3] border-[#ded1be]' : 'bg-slate-900 border-slate-800'} shadow-sm flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">bolt</span>
              <span class="text-xs font-black uppercase tracking-wider ${isCream ? 'text-[#4a3d2c]' : 'text-slate-300'}">
                Ostatnia aktywność na warsztacie (Mateusz & Paweł & Zespół)
              </span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Synchronizacja w czasie rzeczywistym"></span>
            </div>
            <button id="btn-feed-to-history" class="text-xs font-black text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer">
              <span>Pełny dziennik zdarzeń</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            ${(centralAuditLogs && centralAuditLogs.length > 0 ? centralAuditLogs.slice(0, 4) : [
              { operator: 'System', action: 'Brak nowych zdarzeń', details: 'Wszystkie operacje będą widoczne tutaj', timeShort: '' }
            ]).map(log => {
              const isMateusz = log.operator === 'Mateusz';
              const isPawel = log.operator === 'Paweł';
              const opBadgeColor = isMateusz 
                ? (isCream ? 'bg-amber-200 text-amber-950 border-amber-300' : 'bg-amber-950/80 text-amber-300 border-amber-800')
                : (isPawel 
                  ? (isCream ? 'bg-blue-100 text-blue-950 border-blue-200' : 'bg-blue-950/80 text-blue-300 border-blue-800')
                  : (isCream ? 'bg-stone-200 text-stone-800 border-stone-300' : 'bg-slate-800 text-slate-300 border-slate-700'));
              return `
                <div class="p-2.5 rounded-xl border ${isCream ? 'bg-[#fffdfa] border-[#e8ddcb]' : 'bg-slate-950/80 border-slate-800'} flex flex-col justify-between gap-1 shadow-xs">
                  <div class="flex items-center justify-between gap-1">
                    <span class="px-2 py-0.5 rounded-md border text-[10px] font-black ${opBadgeColor} flex items-center gap-1">
                      <span>👤 ${log.operator || 'Operator'}</span>
                    </span>
                    <span class="text-[10px] font-mono ${isCream ? 'text-[#7a6d5c]' : 'text-slate-500'}">${log.timeShort || log.dateFormatted?.split(',')[1] || ''}</span>
                  </div>
                  <div class="font-bold text-[11px] truncate ${isCream ? 'text-[#2a241e]' : 'text-slate-100'}" title="${log.action}">
                    ${log.action || 'Operacja'}
                  </div>
                  <div class="text-[10px] line-clamp-2 ${isCream ? 'text-[#6b5d4c]' : 'text-slate-400'}" title="${log.details}">
                    ${log.details || 'Brak dodatkowych szczegółów'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Year Selection & Annual Summary Controls Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-2xl border ${isCream ? 'bg-[#ede5d6] border-[#d8ccb8]' : 'bg-slate-900 border-slate-800'} shadow-sm">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 mr-1">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">calendar_today</span>
              <span class="text-xs font-black uppercase tracking-wider ${isCream ? 'text-[#574a38]' : 'text-slate-400'}">ROK ZLECEŃ:</span>
            </div>
            
            <!-- Year Pills -->
            ${availableYears.map(y => {
              const isSelected = activeYear === y;
              const count = annualSummary[y]?.totalOrders || 0;
              return `
                <button class="btn-select-year flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isSelected 
                    ? (isCream ? 'bg-[#84532b] text-white shadow-md' : 'bg-amber-500 text-slate-950 shadow-md')
                    : (isCream ? 'bg-[#fbf8f2] hover:bg-[#ded1bd] text-[#4d4233] border border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700')
                }" data-year="${y}">
                  <span>${y}</span>
                  ${y === '2026' ? '<span class="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ' + (isSelected ? 'bg-amber-950 text-amber-200' : 'bg-amber-100 text-amber-900 border border-amber-300') + '">BIEŻĄCY</span>' : ''}
                  ${y === '2025' ? '<span class="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ' + (isSelected ? 'bg-stone-900 text-stone-200' : 'bg-stone-200 text-stone-800 border border-stone-300') + '">ARCHIWUM</span>' : ''}
                  ${y === '2027' ? '<span class="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ' + (isSelected ? 'bg-indigo-950 text-indigo-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200') + '">NOWY</span>' : ''}
                  <span class="px-1.5 py-0.5 rounded-md text-[10px] font-mono ${isSelected ? 'bg-black/20 text-white' : (isCream ? 'bg-[#ede5d6] text-[#3d3224]' : 'bg-slate-900 text-slate-400')}">
                    ${count} zlec.
                  </span>
                </button>
              `;
            }).join('')}

            <!-- Wszystkie lata pill -->
            <button class="btn-select-year flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeYear === 'ALL'
                ? (isCream ? 'bg-[#292524] text-white shadow-md' : 'bg-indigo-600 text-white shadow-md')
                : (isCream ? 'bg-[#fbf8f2] hover:bg-[#ded1bd] text-[#574a38] border border-[#d8ccb8]' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700')
            }" data-year="ALL" title="Zobacz łącznie wszystkie lata">
              <span>Wszystkie lata</span>
              <span class="px-1.5 py-0.5 rounded-md text-[10px] font-mono ${activeYear === 'ALL' ? 'bg-black/20 text-white' : (isCream ? 'bg-[#ede5d6] text-[#3d3224]' : 'bg-slate-900 text-slate-400')}">
                ${allOrders.length}
              </span>
            </button>
          </div>

          <!-- Toggle Annual Summary Breakdown Button -->
          <button id="btn-toggle-annual-breakdown" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
            showAnnualBreakdown
              ? (isCream ? 'bg-[#5c3e1e] text-white border-[#4d3215] shadow-md' : 'bg-indigo-600 text-white border-indigo-500 shadow-md')
              : (isCream ? 'bg-[#f5efe4] hover:bg-[#ebdcc7] text-[#4d4233] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700')
          }">
            <span class="material-symbols-outlined text-[18px] text-amber-500">analytics</span>
            <span>📊 Podliczenie Roczne</span>
            <span class="material-symbols-outlined text-[16px] transition-transform ${showAnnualBreakdown ? 'rotate-180' : ''}">expand_more</span>
          </button>
        </div>

        <!-- Expandable Annual Summary Breakdown Panel -->
        ${showAnnualBreakdown ? `
          <div class="border rounded-2xl p-4 sm:p-5 ${isCream ? 'bg-[#fbf8f2] border-[#dfd3bf]' : 'bg-slate-900 border-slate-800'} shadow-md flex flex-col gap-3.5 transition-all">
            <div class="flex items-center justify-between border-b ${isCream ? 'border-[#e8decb]' : 'border-slate-800'} pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-600 text-2xl">analytics</span>
                <div>
                  <h3 class="font-black text-sm sm:text-base ${isCream ? 'text-[#2a241e]' : 'text-white'}">
                    Podliczenie i Zestawienie Roczne Zleceń (2025 / 2026 / 2027)
                  </h3>
                  <p class="text-[11px] ${isCream ? 'text-[#736350]' : 'text-slate-400'}">
                    Porównanie wartości netto/brutto, liczby zleceń i wykonanych detali dla poszczególnych lat
                  </p>
                </div>
              </div>
              <button id="btn-close-annual-breakdown" class="w-8 h-8 rounded-xl ${isCream ? 'bg-[#ede5d6] text-[#4d4233] hover:bg-[#ded1bd]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} flex items-center justify-center transition-all cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <!-- Yearly Comparison Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              ${['2025', '2026', '2027'].map(yr => {
                const stats = annualSummary[yr] || { totalOrders: 0, activeOrders: 0, completedOrders: 0, archivedOrders: 0, totalPieces: 0, totalNetto: 0, totalBrutto: 0 };
                const isCurrentActive = activeYear === yr;
                const isCurrentYear = yr === '2026';
                const isPastYear = yr === '2025';
                const isFutureYear = yr === '2027';

                return `
                  <div class="border rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all ${
                    isCurrentActive
                      ? (isCream ? 'bg-[#fffdf9] border-amber-600/60 ring-2 ring-amber-600/20 shadow-md' : 'bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/20 shadow-md')
                      : (isCream ? 'bg-[#f7f2e9] border-[#e2d7c5]' : 'bg-slate-950/70 border-slate-800')
                  }">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-base sm:text-lg font-black font-mono ${isCream ? 'text-[#1c1917]' : 'text-white'}">ROK ${yr}</span>
                          ${isCurrentYear ? '<span class="text-[9px] px-2 py-0.5 rounded font-black bg-amber-500 text-slate-950">BIEŻĄCY</span>' : ''}
                          ${isPastYear ? '<span class="text-[9px] px-2 py-0.5 rounded font-bold ' + (isCream ? 'bg-stone-300 text-stone-900' : 'bg-slate-800 text-slate-300') + '">ARCHIWUM</span>' : ''}
                          ${isFutureYear ? '<span class="text-[9px] px-2 py-0.5 rounded font-bold ' + (isCream ? 'bg-indigo-100 text-indigo-900' : 'bg-indigo-950 text-indigo-300') + '">NOWY</span>' : ''}
                        </div>
                        ${isCurrentActive ? '<span class="text-[10px] font-bold text-amber-600 flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> AKTYWNY</span>' : ''}
                      </div>

                      <!-- Main Values -->
                      <div class="space-y-1 mb-3">
                        <div class="flex justify-between items-baseline">
                          <span class="text-[11px] font-semibold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">Wartość Netto:</span>
                          <span class="text-base font-black font-mono ${isCream ? 'text-[#1c1917]' : 'text-white'}">
                            ${stats.totalNetto.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                          </span>
                        </div>
                        <div class="flex justify-between items-baseline">
                          <span class="text-[10px] ${isCream ? 'text-stone-500' : 'text-slate-500'}">Wartość Brutto:</span>
                          <span class="text-xs font-mono font-bold ${isCream ? 'text-[#44403c]' : 'text-slate-300'}">
                            ${stats.totalBrutto.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                          </span>
                        </div>
                        <div class="flex justify-between items-baseline pt-1 border-t ${isCream ? 'border-[#e8decb]' : 'border-slate-800'}">
                          <span class="text-[11px] font-semibold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">Suma detali (szt.):</span>
                          <span class="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                            ${stats.totalPieces.toLocaleString('pl-PL')} szt.
                          </span>
                        </div>
                      </div>

                      <!-- Counts Breakdown -->
                      <div class="grid grid-cols-3 gap-1.5 text-center p-2 rounded-lg ${isCream ? 'bg-[#ede5d6]' : 'bg-slate-900 border border-slate-800'} text-[10px] font-mono">
                        <div>
                          <div class="text-amber-600 font-bold font-sans">W realizacji</div>
                          <div class="font-black text-xs ${isCream ? 'text-[#2a241e]' : 'text-white'}">${stats.activeOrders}</div>
                        </div>
                        <div>
                          <div class="text-emerald-600 font-bold font-sans">Gotowe</div>
                          <div class="font-black text-xs ${isCream ? 'text-[#2a241e]' : 'text-white'}">${stats.completedOrders}</div>
                        </div>
                        <div>
                          <div class="text-stone-500 font-bold font-sans">Archiwum</div>
                          <div class="font-black text-xs ${isCream ? 'text-[#2a241e]' : 'text-white'}">${stats.archivedOrders}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Switch year button -->
                    <button class="btn-switch-year-from-summary w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCurrentActive
                        ? (isCream ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm')
                        : (isCream ? 'bg-[#e2d5c1] hover:bg-[#d8c7b0] text-[#3d3224]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')
                    }" data-year="${yr}">
                      <span class="material-symbols-outlined text-[16px]">${isCurrentActive ? 'visibility' : 'filter_alt'}</span>
                      <span>${isCurrentActive ? 'Aktualnie przeglądasz' : 'Pokaż zlecenia ' + yr}</span>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Category Tabs (W TRAKCIE vs ZREALIZOWANE vs ARCHIWUM vs WSZYSTKIE) -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b ${isCream ? 'border-[#dfd3bf]' : 'border-slate-800'} pb-3">
          <div class="flex items-center gap-2 p-1.5 rounded-2xl border ${isCream ? 'bg-[#ede5d6] border-[#d8ccb8]' : 'bg-slate-900 border-slate-800'} shadow-sm flex-wrap">
            
            <!-- Tab: WSZYSTKIE -->
            <button id="tab-all" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'ALL' ? (isCream ? 'bg-[#292524] text-white shadow-md' : 'bg-indigo-600 text-white shadow-md') : (isCream ? 'text-[#574a38] hover:text-[#2c2825] hover:bg-[#dfd3bf]' : 'text-slate-400 hover:text-white hover:bg-slate-800')}">
              <span class="material-symbols-outlined text-[18px]">list_alt</span>
              <span>WSZYSTKIE ZLECENIA</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'ALL' ? (isCream ? 'bg-stone-900 text-stone-200' : 'bg-slate-950 text-indigo-300') : (isCream ? 'bg-[#d8ccb8] text-[#3d3224]' : 'bg-slate-800 text-slate-300')}">
                ${activeYearOrders.length}
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
              <span class="text-[10px] uppercase font-bold block tracking-wider ${isCream ? 'text-[#736350]' : 'text-slate-400'}">Wartość Netto (${activeYear === 'ALL' ? 'Wszystkie Lata' : 'Rok ' + activeYear})</span>
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

        <!-- Filter Controls: Month Filter, Search, Sort, Overdue Filter, Customer Filter -->
        <div class="${themeStyles.filterPanel} border rounded-2xl p-3.5 flex flex-col gap-3 shadow-sm backdrop-blur-sm">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            
            <!-- Month Selector -->
            <div class="sm:col-span-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">calendar_month</span>
              <select id="month-filter-select" class="w-full ${themeStyles.inputSearch} border rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer">
                <option value="ALL" ${activeMonthFilter === 'ALL' ? 'selected' : ''}>📅 Wszystkie m-ce (${activeYear === 'ALL' ? allOrders.length : activeYearOrders.length})</option>
                ${monthFilters.map(m => `
                  <option value="${m.id}" ${activeMonthFilter === m.id ? 'selected' : ''}>${m.label}</option>
                `).join('')}
              </select>
            </div>

            <!-- Sort By Selector -->
            <div class="sm:col-span-4 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">sort</span>
              <select id="orders-sort-select" class="w-full ${themeStyles.inputSearch} border rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer">
                <option value="DEFAULT" ${currentSortBy === 'DEFAULT' ? 'selected' : ''}>⚡ Domyślnie: Po terminie (Priorytet) + Najbliższy termin</option>
                <option value="DELIVERY_DATE_ASC" ${currentSortBy === 'DELIVERY_DATE_ASC' ? 'selected' : ''}>📅 Termin realizacji: Najbliższe najpierw</option>
                <option value="DELIVERY_DATE_DESC" ${currentSortBy === 'DELIVERY_DATE_DESC' ? 'selected' : ''}>📅 Termin realizacji: Najdalsze najpierw</option>
                <option value="ORDER_DATE_DESC" ${currentSortBy === 'ORDER_DATE_DESC' ? 'selected' : ''}>🗓️ Data zamówienia: Od najnowszych</option>
                <option value="ORDER_DATE_ASC" ${currentSortBy === 'ORDER_DATE_ASC' ? 'selected' : ''}>🗓️ Data zamówienia: Od najstarszych</option>
                <option value="AMOUNT_DESC" ${currentSortBy === 'AMOUNT_DESC' ? 'selected' : ''}>💰 Kwota zamówienia: Od najwyższej</option>
                <option value="AMOUNT_ASC" ${currentSortBy === 'AMOUNT_ASC' ? 'selected' : ''}>💰 Kwota zamówienia: Od najniższej</option>
              </select>
            </div>

            <!-- Search Bar -->
            <div class="sm:col-span-5 relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 ${isCream ? 'text-[#8c7f6f]' : 'text-slate-500'} text-[18px]">search</span>
              <input id="orders-search-input" type="text" value="${searchQuery}" placeholder="Szukaj zlecenia, SO, rysunku, nazwy detalu..." class="w-full ${themeStyles.inputSearch} border rounded-xl pl-9 pr-3 py-2 text-xs outline-none" />
            </div>
          </div>

          <!-- Bottom Row: Overdue Button + Workshop Issues Button + Company Filter Buttons + Count -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t ${isCream ? 'border-[#dfd4c3]' : 'border-slate-800'}">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Overdue Filter Toggle Button -->
              <button id="btn-toggle-overdue-filter" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${filterOnlyOverdue ? 'bg-orange-600 text-white border-orange-500 shadow-md ring-2 ring-orange-500/50' : (isCream ? 'bg-[#f5ebd9] hover:bg-[#ebdcc7] text-orange-950 border-orange-300' : 'bg-slate-800 hover:bg-slate-700 text-orange-400 border-orange-500/40')}" title="Filtruj tylko zlecenia po terminie realizacji">
                <span class="material-symbols-outlined text-[16px] text-orange-500 ${filterOnlyOverdue ? 'text-white' : ''}">warning</span>
                <span>PO TERMINIE</span>
                <span class="px-1.5 py-0.2 rounded font-mono text-[10px] ${filterOnlyOverdue ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'}">
                  ${totalOverdueCount}
                </span>
              </button>

              <!-- Workshop Issues / Photos Filter Toggle Button (Od Mateusza / Operatorów) -->
              <button id="btn-toggle-issues-filter" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${filterOnlyIssues ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-500/50' : (isCream ? 'bg-[#f7efe1] hover:bg-[#ebdcc7] text-amber-950 border-amber-300' : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40')}" title="Filtruj tylko zlecenia z notatkami, uwagami lub problemami ze zdjęciem">
                <span class="material-symbols-outlined text-[16px] text-amber-500 ${filterOnlyIssues ? 'text-white' : ''}">edit_note</span>
                <span>NOTATKI / USTERKI</span>
                <span class="px-1.5 py-0.2 rounded font-mono text-[10px] ${filterOnlyIssues ? 'bg-white/20 text-white' : 'bg-amber-600 text-white font-black'}">
                  ${orderComments.filter(c => c.status !== 'RESOLVED').length}
                </span>
              </button>

              <div class="h-4 w-px ${isCream ? 'bg-[#d8ccb8]' : 'bg-slate-800'}"></div>

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

            <!-- Count badge -->
            <div class="text-xs font-bold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'} ml-auto">
              Znaleziono: <span class="ml-1 px-2 py-0.5 rounded-lg ${isCream ? 'bg-[#ede5d6] text-[#2c2825]' : 'bg-slate-800 text-white'} font-mono">${filteredOrders.length}</span> zleceń
            </div>
          </div>
        </div>

        <!-- Orders Accordion List -->
        <div class="flex flex-col gap-2.5">
          ${filteredOrders.length === 0 ? `
            <div class="border-2 border-dashed ${isCream ? 'border-[#d8ccb8] bg-[#fbf8f2]/95' : 'border-slate-800 bg-slate-900/50'} rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <span class="material-symbols-outlined text-5xl ${isCream ? 'text-[#a89985]' : 'text-slate-600'}">search_off</span>
              <div class="text-sm font-bold ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Brak zleceń dla wybranych filtrów</div>
              <p class="text-xs ${isCream ? 'text-[#7d6f5e]' : 'text-slate-500'}">Zmień rok (np. 2026 / 2025), wyłącz filtr po terminie lub wyczyść filtry.</p>
              <button id="btn-reset-filters" class="mt-2 px-4 py-2 ${isCream ? 'bg-[#ede5d6] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 text-white border-slate-700'} rounded-xl border text-xs font-bold cursor-pointer">
                Resetuj Filtry
              </button>
            </div>
          ` : filteredOrders.map(order => {
            const isExpanded = expandedOrderIds.has(order.id);
            const totals = calculateTotals(order.items || []);
            const wzSummary = getOrderWzShipmentSummary(order);
            const isArchived = order.productionStatus === 'ARCHIVED' || order.isArchived === true;
            const isFullyProduced = order.productionStatus === 'PRODUCED';
            const isPartiallyProduced = order.productionStatus === 'PARTIALLY_PRODUCED' || (totals.totalProducedQty > 0 && totals.totalProducedQty < totals.totalOrderedQty);
            const isOrderDone = isFullyProduced || isArchived;
            const isOverdue = !isOrderDone && order.deliveryDate && order.deliveryDate < todayStr;

            // Workshop comments & photo issues for this order
            const orderIssues = orderComments.filter(c => c.orderId === order.id);
            const orderOpenIssues = orderIssues.filter(c => c.status !== 'RESOLVED');
            const hasOpenIssues = orderOpenIssues.length > 0;

            const pdfUrl = getOrderPdfUrl(order);

            const borderStatusClass = isArchived
              ? (isCream ? 'border-[#d6d3d1] bg-[#f8f8f7]/95' : 'border-slate-700 bg-slate-900/60 opacity-90')
              : (isOverdue
                  ? (isCream ? 'border-orange-500/80 bg-[#fff8f0]/95 shadow-md shadow-orange-500/10' : 'border-orange-500/80 bg-orange-950/20 shadow-md shadow-orange-500/10')
                  : (isFullyProduced 
                      ? (isCream ? 'border-[#86efac]/90 bg-[#fbfdfb]/95' : 'border-emerald-500/40 bg-slate-900/90')
                      : (isPartiallyProduced 
                          ? (isCream ? 'border-[#fdba74]/90 bg-[#fffdfa]/95' : 'border-amber-500/40 bg-slate-900/90')
                          : (isCream ? 'border-[#d6c7b2] bg-[#f4ebe0]/95' : 'border-slate-800 bg-slate-900/80'))));

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

                        <!-- Overdue Warning Badge in Orange -->
                        ${isOverdue ? `
                          <span class="px-2.5 py-0.5 rounded-md text-xs font-black bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/60 shadow-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px] text-orange-500">warning</span>
                            <span>PO TERMINIE: ${order.deliveryDate}</span>
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

                        <!-- WZ Dispatch Tag in Header -->
                        ${wzSummary.relatedWzs.length > 0 ? (
                          wzSummary.isAllShipped ? `
                            <span class="px-2 py-0.5 rounded-md text-[11px] font-bold ${isCream ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600'} flex items-center gap-1" title="Wszystkie pozycje zlecenia wysłane na ${wzSummary.relatedWzs.length} dok. WZ">
                              <span class="material-symbols-outlined text-[13px]">verified</span>
                              <span>WZ: 100% WYSŁANE (${wzSummary.relatedWzs.length})</span>
                            </span>
                          ` : `
                            <span class="px-2 py-0.5 rounded-md text-[11px] font-bold ${isCream ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950/80 text-amber-300 border border-amber-600'} flex items-center gap-1" title="Wysłano ${wzSummary.totalShipped} z ${wzSummary.totalOrdered} szt. Pozostało: ${wzSummary.totalRemaining} szt.">
                              <span class="material-symbols-outlined text-[13px]">local_shipping</span>
                              <span>WZ: ${wzSummary.totalShipped}/${wzSummary.totalOrdered} szt. (${wzSummary.relatedWzs.length} dok.)</span>
                            </span>
                          `
                        ) : ''}

                        <!-- Workshop Issues Badge (Zgłoszenia i zdjęcia od Mateusza/operatorów) -->
                        ${orderIssues.length > 0 ? `
                          <span class="px-2.5 py-0.5 rounded-md text-xs font-black ${hasOpenIssues ? 'bg-amber-500/25 text-amber-900 border border-amber-500 shadow-xs' : 'bg-stone-200 text-stone-800 border border-stone-300'} flex items-center gap-1" title="Zgłoszone uwagi i zdjęcia z warsztatu">
                            <span class="material-symbols-outlined text-[14px] text-amber-600">report_problem</span>
                            <span>${hasOpenIssues ? `⚠️ ZGŁOSZENIE (${orderOpenIssues.length})` : `💬 UWAGI (${orderIssues.length})`}</span>
                            ${orderIssues.some(i => i.photoUrl) ? '<span class="material-symbols-outlined text-[13px] text-amber-600">photo_camera</span>' : ''}
                          </span>
                        ` : ''}
                      </div>
                      
                      <div class="flex items-center gap-2 mt-0.5 text-xs ${isCream ? 'text-[#6e604f]' : 'text-slate-400'} flex-wrap">
                        <span class="font-bold ${isCream ? 'text-[#3d3224]' : 'text-slate-200'}">${order.customerName || 'EC Engineering'}</span>
                        <span>•</span>
                        ${order.deliveryDate ? `
                          <span class="${isOverdue ? 'text-orange-600 dark:text-orange-400 font-black' : ''}">
                            Termin: ${order.deliveryDate}
                          </span>
                          <span>•</span>
                        ` : ''}
                        <span>Data zam.: ${order.orderDate || '2026-06'}</span>
                        <span>•</span>
                        <span>${(order.items || []).length} poz. (${totals.totalOrderedQty} szt.)</span>
                      </div>

                      <!-- Prominent Workshop Notes & Defect Photos Box (Zawsze widoczne na karcie) -->
                      ${orderIssues.length > 0 ? `
                        <div class="mt-2.5 p-2.5 sm:p-3 rounded-xl border ${hasOpenIssues ? (isCream ? 'bg-amber-100/90 border-amber-400 text-amber-950' : 'bg-amber-950/40 border-amber-500/70 text-amber-200') : (isCream ? 'bg-[#ede5d6]/80 border-[#d8ccb8] text-[#3d3224]' : 'bg-slate-900 border-slate-800 text-slate-300')} shadow-xs flex flex-col gap-2" onclick="event.stopPropagation()">
                          <div class="flex items-center justify-between border-b pb-1.5 ${hasOpenIssues ? (isCream ? 'border-amber-300' : 'border-amber-800/60') : (isCream ? 'border-[#ded3c0]' : 'border-slate-800')}">
                            <div class="flex items-center gap-1.5 text-xs font-black">
                              <span class="material-symbols-outlined text-[18px] text-amber-600">edit_note</span>
                              <span>📝 NOTATKI Z WARSZTATU (${orderIssues.length}):</span>
                              ${hasOpenIssues ? '<span class="px-2 py-0.2 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">DO WYJAŚNIENIA</span>' : '<span class="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white">ROZWIĄZANE</span>'}
                            </div>
                            <button type="button" class="btn-open-issue-form text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer" data-order-id="${order.id}">
                              <span class="material-symbols-outlined text-[15px]">add_circle</span>
                              <span>+ Dopisz notatkę</span>
                            </button>
                          </div>

                          <div class="space-y-1.5">
                            ${orderIssues.map(issue => `
                              <div class="p-2 sm:p-2.5 rounded-lg ${isCream ? 'bg-white/95 border border-amber-200/90' : 'bg-slate-950 border border-slate-800'} flex items-start justify-between gap-3 shadow-xs">
                                <div class="flex items-start gap-2 min-w-0 flex-1">
                                  <span class="material-symbols-outlined text-[18px] ${issue.type === 'DEFECT' ? 'text-rose-500' : (issue.type === 'PROBLEM' ? 'text-amber-500' : 'text-blue-500')} shrink-0 mt-0.5">
                                    ${issue.photoUrl ? 'photo_camera' : 'chat'}
                                  </span>
                                  <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                                      <span class="font-black text-xs ${isCream ? 'text-[#1c1917]' : 'text-white'}">👤 ${issue.operator}</span>
                                      <span class="text-[10px] font-mono opacity-70 ${isCream ? 'text-stone-600' : 'text-slate-400'}">${issue.dateFormatted || issue.createdAt}</span>
                                      ${issue.sku ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-stone-200 font-bold border">Detal: ${issue.sku}</span>` : ''}
                                      <span class="px-1.5 py-0.2 rounded text-[9px] font-black ${issue.type === 'DEFECT' ? 'bg-rose-100 text-rose-800 border border-rose-300' : (issue.type === 'PROBLEM' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300')}">
                                        ${issue.type === 'DEFECT' ? 'WADA' : (issue.type === 'PROBLEM' ? 'PROBLEM' : 'UWAGA')}
                                      </span>
                                    </div>
                                    <p class="text-xs font-semibold leading-relaxed ${isCream ? 'text-[#1e1913]' : 'text-slate-100'} whitespace-pre-wrap">${issue.text}</p>
                                  </div>
                                </div>

                                ${issue.photoUrl ? `
                                  <div class="shrink-0 flex flex-col items-center gap-0.5">
                                    <img src="${issue.photoUrl}" class="btn-zoom-image h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-lg border-2 border-amber-500 shadow-sm cursor-pointer hover:scale-105 transition-transform" data-img-url="${issue.photoUrl}" title="Kliknij aby powiększyć zdjęcie ze stanowiska" />
                                    <span class="text-[9px] font-bold text-amber-600 cursor-pointer">🔍 Foto</span>
                                  </div>
                                ` : ''}
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
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

                    <!-- Direct WZ Button (Full Multi-Dispatch Support: WZ 1, WZ 2, WZ 3...) -->
                    ${!isArchived ? (
                      wzSummary.isAllShipped ? `
                        <button class="btn-issue-wz-order flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer border border-emerald-500/60" data-order-id="${order.id}" data-wz-status="full" title="Wszystkie detale z tego zlecenia (${wzSummary.totalShipped} szt.) zostały już wysłane na ${wzSummary.relatedWzs.length} dok. WZ. Kliknij, aby zobaczyć lub wystawić kolejne.">
                          <span class="material-symbols-outlined text-[16px]">verified</span>
                          <span class="hidden sm:inline">WZ ✓ (${wzSummary.relatedWzs.length})</span>
                        </button>
                      ` : wzSummary.isPartiallyShipped ? `
                        <button class="btn-issue-wz-order flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer border border-amber-400/80" data-order-id="${order.id}" data-wz-status="partial" title="Wysłano ${wzSummary.totalShipped} z ${wzSummary.totalOrdered} szt. Pozostało: ${wzSummary.totalRemaining} szt. Kliknij, aby wystawić kolejne WZ na brakujące pozycje.">
                          <span class="material-symbols-outlined text-[16px]">local_shipping</span>
                          <span class="hidden sm:inline">Kolejne WZ (#${wzSummary.relatedWzs.length + 1})</span>
                        </button>
                      ` : `
                        <button class="btn-issue-wz-order flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer" data-order-id="${order.id}" data-wz-status="none" title="Wystaw dokument WZ dla tego zlecenia">
                          <span class="material-symbols-outlined text-[16px]">description</span>
                          <span class="hidden sm:inline">WZ</span>
                        </button>
                      `
                    ) : ''}

                    <!-- Drukuj Kody Kreskowe z Zamówienia (Etykiety do Paczek bez faktury) -->
                    <button class="btn-print-order-label flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border cursor-pointer ${isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'}" data-order-id="${order.id}" title="Drukuj kody kreskowe / etykiety wysyłkowe do paczek z zamówienia (bez faktury)">
                      <span class="material-symbols-outlined text-[16px] text-amber-600">barcode</span>
                      <span class="hidden sm:inline">Kody Kreskowe</span>
                    </button>

                    <!-- Zgłoś problem / dodaj komentarz ze zdjęciem od Mateusza -->
                    <button class="btn-open-issue-form flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${hasOpenIssues ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-md' : (isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700')}" data-order-id="${order.id}" title="Dodaj notatkę lub zgłoś usterkę/brak ze zdjęciem ze stanowiska">
                      <span class="material-symbols-outlined text-[16px] text-amber-600">edit_note</span>
                      <span>${orderIssues.length > 0 ? `📝 Notatki (${orderIssues.length})` : '📝 Notatka / Foto'}</span>
                    </button>

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

                        <button class="btn-print-order-label flex items-center gap-1.5 ${isCream ? 'bg-[#ebe2d2] hover:bg-[#ded1bd] text-[#3d3224] border-[#d4c6b0]' : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-700/80'} font-bold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 border cursor-pointer" data-order-id="${order.id}" title="Drukuj kody kreskowe / etykiety wysyłkowe z zamówienia (bez faktury)">
                          <span class="material-symbols-outlined text-[16px] text-amber-600">barcode</span>
                          <span>Drukuj Kody Kreskowe (Etykiety EC)</span>
                        </button>

                        ${wzSummary.relatedWzs.length > 0 ? `
                          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${isCream ? 'bg-amber-100/90 border-amber-300 text-amber-950' : 'bg-amber-950/50 border-amber-700/70 text-amber-300'}" title="Historia wystawionych dokumentów WZ dla tego zlecenia">
                            <span class="material-symbols-outlined text-[16px] text-amber-600">local_shipping</span>
                            <span>WZ (${wzSummary.relatedWzs.length}):</span>
                            <span class="font-mono">${wzSummary.relatedWzs.map(w => w.formattedNumber || w.wzNum).join(', ')}</span>
                            <span class="text-[11px] opacity-80 font-normal">(${wzSummary.totalShipped}/${wzSummary.totalOrdered} szt.)</span>
                          </div>
                        ` : ''}
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
                            <th class="py-2 px-3 w-28 text-center">ZAMÓWIONO</th>
                            <th class="py-2 px-3 w-40 text-center">WYPRODUKOWANO</th>
                            <th class="py-2 px-3 w-36 text-center">STATUS POZYCJI</th>
                            <th class="py-2 px-3 w-24 text-right">CENA JEDN.</th>
                            <th class="py-2 px-3 w-28 text-right">WARTOŚĆ</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y ${themeStyles.tableBorder}">
                          ${(order.items || []).map((it, idx) => {
                            const orderedQty = parseFloat(it.orderedQty !== undefined ? it.orderedQty : (it.shippedQty || 1));
                            const producedQty = it.producedQty !== undefined ? parseFloat(it.producedQty) : (it.productionStatus === 'PRODUCED' ? orderedQty : 0);
                            const isItemProduced = it.productionStatus === 'PRODUCED' || producedQty >= orderedQty;
                            const isItemPartial = !isItemProduced && producedQty > 0;
                            const unitPrice = parseFloat(it.unitPrice || 0);
                            const rowNetto = (orderedQty * unitPrice).toFixed(2);

                            const itemShipment = wzSummary.itemsSummary.find(s => s.orderItemId === it.id);
                            const itShippedQty = itemShipment ? itemShipment.shippedQty : 0;
                            const itRemainingQty = itemShipment ? itemShipment.remainingQty : orderedQty;
                            const itemIssues = orderIssues.filter(i => i.sku && (i.sku === it.sku || i.sku === it.symbol));
                            const hasItemIssue = itemIssues.some(i => i.status !== 'RESOLVED');

                            return `
                              <tr class="${themeStyles.tableRowBg} transition-colors">
                                <td class="py-2.5 px-3 text-center font-mono ${isCream ? 'text-[#8c7f6f]' : 'text-slate-500'}">${idx + 1}</td>
                                <td class="py-2.5 px-3 font-mono font-bold ${isCream ? 'text-[#2a241e]' : 'text-amber-400'}">
                                  <div class="flex items-center gap-1.5 flex-wrap">
                                    <span>${it.sku || it.symbol || '-'}</span>
                                    <button class="btn-preview-item-drawing p-1 rounded-lg ${isCream ? 'hover:bg-[#ebdcc7] text-rose-700 bg-[#f7f2ea]' : 'hover:bg-slate-800 text-rose-400 bg-slate-900'} border ${isCream ? 'border-[#d8ccb8]' : 'border-slate-800'} transition-all cursor-pointer flex items-center gap-0.5 shadow-sm" data-sku="${it.sku || ''}" data-symbol="${it.symbol || ''}" data-name="${it.name || ''}" title="Otwórz rysunek PDF dla tego detalu (${it.sku || it.symbol})">
                                      <span class="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                                      <span class="text-[9px] font-sans font-bold">RYS</span>
                                    </button>
                                    <button class="btn-open-issue-form p-1 rounded-lg ${hasItemIssue ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-sm animate-pulse' : (isCream ? 'hover:bg-[#ebdcc7] text-amber-900 bg-[#f7f2ea]' : 'hover:bg-slate-800 text-amber-400 bg-slate-900')} border ${isCream ? 'border-[#d8ccb8]' : 'border-slate-800'} transition-all cursor-pointer flex items-center gap-0.5 shadow-sm" data-order-id="${order.id}" data-item-sku="${it.sku || it.symbol || ''}" title="Dodaj notatkę lub zgłoś wadę do detalu ${it.sku || it.symbol}">
                                      <span class="material-symbols-outlined text-[15px]">${hasItemIssue ? 'report_problem' : 'edit_note'}</span>
                                      <span class="text-[9px] font-sans font-bold">${itemIssues.length > 0 ? `WADA (${itemIssues.length})` : 'NOTATKA'}</span>
                                    </button>
                                  </div>
                                </td>
                                <td class="py-2.5 px-3 font-semibold ${isCream ? 'text-[#1c1917]' : 'text-slate-200'}">
                                  <div>${it.name || 'Brak nazwy'}</div>
                                  ${it.symbol && it.symbol !== it.sku ? `<div class="text-[10px] ${isCream ? 'text-[#8c7f6f]' : 'text-slate-500'} font-mono font-normal">Symbol: ${it.symbol}</div>` : ''}
                                  ${itemIssues.length > 0 ? `
                                    <div class="space-y-1 mt-1">
                                      ${itemIssues.map(iss => `
                                        <div class="text-[11px] p-1.5 rounded-lg ${iss.type === 'DEFECT' ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300' : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'} border flex items-center justify-between gap-1 shadow-xs">
                                          <div class="flex items-center gap-1.5 min-w-0">
                                            <span class="font-bold text-[10px]">⚠️ ${iss.operator}:</span>
                                            <span class="truncate">${iss.text}</span>
                                          </div>
                                          ${iss.photoUrl ? `
                                            <img src="${iss.photoUrl}" class="btn-zoom-image h-6 w-6 object-cover rounded cursor-pointer border border-amber-500 shrink-0" data-img-url="${iss.photoUrl}" title="Kliknij aby powiększyć zdjęcie" />
                                          ` : ''}
                                        </div>
                                      `).join('')}
                                    </div>
                                  ` : ''}
                                </td>
                                <td class="py-2.5 px-3 text-center font-bold font-mono ${isCream ? 'text-[#2a241e]' : 'text-slate-300'}">
                                  <div>${orderedQty} ${it.uom || 'szt'}</div>
                                  ${wzSummary.relatedWzs.length > 0 ? (
                                    itRemainingQty === 0 ? `
                                      <div class="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-0.5 mt-0.5" title="Wysłano w całości (${itShippedQty} szt.) na WZ">
                                        <span class="material-symbols-outlined text-[13px]">verified</span>
                                        <span>WZ: 100% (${itShippedQty})</span>
                                      </div>
                                    ` : itShippedQty > 0 ? `
                                      <div class="text-[10px] text-amber-600 font-bold flex items-center justify-center gap-0.5 mt-0.5" title="Wysłano ${itShippedQty} z ${orderedQty} szt. Pozostało: ${itRemainingQty} szt.">
                                        <span class="material-symbols-outlined text-[13px]">local_shipping</span>
                                        <span>WZ: ${itShippedQty}/${orderedQty} (poz. ${itRemainingQty})</span>
                                      </div>
                                    ` : `
                                      <div class="text-[10px] text-slate-400 font-normal mt-0.5" title="Brak WZ">
                                        <span>WZ: 0/${orderedQty}</span>
                                      </div>
                                    `
                                  ) : ''}
                                </td>
                                <td class="py-2 px-2 text-center">
                                  <div class="flex items-center justify-center gap-1">
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="${wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty}" 
                                      step="1"
                                      value="${producedQty}" 
                                      class="input-item-qty w-14 text-center font-mono font-black text-xs py-1 px-1 rounded-lg border outline-none ${isItemProduced ? (isCream ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-emerald-950/60 border-emerald-500 text-emerald-300') : (isItemPartial ? (isCream ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-amber-950/60 border-amber-500 text-amber-300') : (isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-900 border-slate-700 text-white'))}"
                                      data-order-id="${order.id}" 
                                      data-item-id="${it.id}"
                                      data-ordered-qty="${orderedQty}"
                                      data-max-qty="${wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty}"
                                      title="Wpisz ilość do wysyłki (maks. ${wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty} szt.)"
                                    />
                                    <button 
                                      type="button" 
                                      class="btn-item-qty-all px-1.5 py-0.5 rounded text-[10px] font-black font-mono tracking-tight transition-all active:scale-90 border shadow-xs cursor-pointer ${(wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty) === 0 ? 'bg-slate-200 text-slate-400 border-slate-300 opacity-60 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600'}" 
                                      data-order-id="${order.id}" 
                                      data-item-id="${it.id}" 
                                      data-max-qty="${wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty}" 
                                      title="Wstaw całość (${wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty} szt.)"
                                      ${(wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty) === 0 ? 'disabled' : ''}
                                    >
                                      ALL
                                    </button>
                                    <span class="font-mono text-xs font-bold ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">/ ${wzSummary.relatedWzs.length > 0 ? itRemainingQty : orderedQty}</span>
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

                    <!-- Dedicated WZ Dispatch History Section -->
                    ${wzSummary.relatedWzs.length > 0 ? `
                      <div class="mt-3 mb-2 p-3 rounded-xl border ${isCream ? 'bg-[#f7f2ea] border-[#e2d5c3]' : 'bg-slate-900/90 border-slate-800'}">
                        <div class="flex items-center justify-between mb-2 pb-1.5 border-b ${isCream ? 'border-[#e2d5c3]' : 'border-slate-800'}">
                          <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-[18px] text-amber-500">local_shipping</span>
                            <span class="font-bold text-xs ${isCream ? 'text-[#1e1913]' : 'text-slate-200'}">
                              📦 Historia Wystawionych Dokumentów WZ (${wzSummary.relatedWzs.length} dok.)
                            </span>
                          </div>
                          <div class="text-[11px] font-mono font-bold ${isCream ? 'text-emerald-800' : 'text-emerald-400'}">
                            Wysłano łącznie: ${wzSummary.totalShipped} / ${wzSummary.totalOrdered} szt. ${wzSummary.isAllShipped ? '• 100% ZREALIZOWANE' : `• Pozostało: ${wzSummary.totalRemaining} szt.`}
                          </div>
                        </div>
                        <div class="space-y-1.5">
                          ${wzSummary.relatedWzs.map(wz => {
                            const wzNum = wz.formattedNumber || `Nr ${wz.wzNum}/${wz.wzMonth}/${wz.wzYear}${wz.wzSuffix || '/BM'}`;
                            const wzDate = wz.issueDate || 'Brak daty';
                            const operator = wz.operatorName || wz.issuerName || 'Operator';
                            const shippedList = (wz.items || []).map(it => {
                              const q = it.quantity || 0;
                              const label = it.symbol || it.sku || it.name || 'Detal';
                              return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono ${isCream ? 'bg-[#ede5d6] text-[#2c2825] border border-[#d8ccb8]' : 'bg-slate-800 text-slate-200 border border-slate-700'}"><span>${label}:</span> <strong class="text-amber-500 font-bold">${q} ${it.uom || 'szt'}</strong></span>`;
                            }).join(' ');

                            return `
                              <div class="flex flex-wrap items-center justify-between p-2 rounded-lg ${isCream ? 'bg-white border border-[#e8ded0]' : 'bg-slate-950/70 border border-slate-800/80'} gap-2">
                                <div class="flex items-center gap-2 flex-wrap">
                                  <span class="px-2 py-0.5 rounded font-mono font-black text-xs ${isCream ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950/80 text-amber-300 border border-amber-700'}">
                                    ${wzNum}
                                  </span>
                                  <span class="text-xs ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">
                                    📅 ${wzDate}
                                  </span>
                                  <span class="text-xs ${isCream ? 'text-[#6e604f]' : 'text-slate-400'}">
                                    👤 ${operator}
                                  </span>
                                  <div class="flex items-center gap-1 flex-wrap ml-1">
                                    ${shippedList || '<span class="text-xs text-slate-500">Brak pozycji</span>'}
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  class="btn-open-historical-wz px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer ${isCream ? 'bg-[#ede5d6] hover:bg-[#dfd2be] text-[#1e1913] border border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}" 
                                  data-wz-id="${wz.id}" 
                                  title="Otwórz podgląd tego dokumentu WZ"
                                >
                                  <span class="material-symbols-outlined text-[15px] text-amber-500">visibility</span>
                                  <span>Otwórz WZ</span>
                                </button>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    ` : `
                      <div class="mt-2 mb-2 p-2 rounded-lg text-[11px] ${isCream ? 'bg-[#f7f2ea]/60 text-[#7a6d5c]' : 'bg-slate-900/40 text-slate-500'} flex items-center gap-1.5 border ${isCream ? 'border-[#e8ded0]' : 'border-slate-800/50'}">
                        <span class="material-symbols-outlined text-[15px] text-slate-400">history</span>
                        <span>Brak wystawionych dokumentów WZ dla tego zlecenia (Wszystkie pozycje oczekują na wysyłkę).</span>
                      </div>
                    `}

                    <!-- Workshop Comments & Photo Issues Section (Zgłoszenia od Mateusza i warsztatu) -->
                    <div class="mt-2 mb-2 p-3 rounded-xl border ${isCream ? 'bg-[#f7f2ea] border-[#e2d5c3]' : 'bg-slate-900/90 border-slate-800'}">
                      <div class="flex items-center justify-between mb-2 pb-1.5 border-b ${isCream ? 'border-[#e2d5c3]' : 'border-slate-800'}">
                        <div class="flex items-center gap-2">
                          <span class="material-symbols-outlined text-[18px] text-amber-500">rate_review</span>
                          <span class="font-bold text-xs ${isCream ? 'text-[#1e1913]' : 'text-slate-200'}">
                            💬 Zgłoszenia z Warsztatu i Zdjęcia Usterek (${orderIssues.length})
                          </span>
                          ${hasOpenIssues ? `
                            <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 border border-amber-500/40">
                              ⚠️ ${orderOpenIssues.length} do wyjaśnienia
                            </span>
                          ` : ''}
                        </div>
                        
                        <button type="button" class="btn-open-issue-form px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black border border-amber-600" data-order-id="${order.id}">
                          <span class="material-symbols-outlined text-[15px]">add_a_photo</span>
                          <span>+ Dodaj Komentarz / Zdjęcie</span>
                        </button>
                      </div>

                      ${orderIssues.length === 0 ? `
                        <div class="p-2.5 text-center text-[11px] ${isCream ? 'text-[#7a6d5c]' : 'text-slate-500'}">
                          Brak zgłoszonych uwag lub usterek do tego zlecenia. Kliknij <strong>"+ Dodaj Komentarz / Zdjęcie"</strong>, aby dodać wpis lub fotkę od Mateusza.
                        </div>
                      ` : `
                        <div class="space-y-2">
                          ${orderIssues.map(issue => {
                            const isResolved = issue.status === 'RESOLVED';
                            const typeBadge = issue.type === 'DEFECT' 
                              ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 border border-rose-500/40">❌ WADA / BUBEL</span>'
                              : (issue.type === 'PROBLEM' 
                                  ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 border border-amber-500/40">⚠️ PROBLEM / AWARIA</span>'
                                  : '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-600 border border-blue-500/40">💬 UWAGA</span>');

                            return `
                              <div class="p-2.5 rounded-xl ${isCream ? 'bg-white border border-[#e8ded0]' : 'bg-slate-950/70 border border-slate-800/80'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isResolved ? 'opacity-70' : ''}">
                                <div class="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div class="p-1.5 rounded-lg ${issue.type === 'DEFECT' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'} shrink-0 mt-0.5">
                                    <span class="material-symbols-outlined text-[20px]">${issue.photoUrl ? 'photo_camera' : 'chat'}</span>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                      ${typeBadge}
                                      <span class="text-xs font-bold ${isCream ? 'text-[#1e1913]' : 'text-slate-200'}">👤 ${issue.operator}</span>
                                      <span class="text-[10px] ${isCream ? 'text-[#7a6d5c]' : 'text-slate-400'} font-mono">${issue.dateFormatted || issue.createdAt}</span>
                                      ${issue.sku ? `
                                        <span class="text-[10px] font-mono px-1 rounded ${isCream ? 'bg-stone-100 text-stone-800' : 'bg-slate-800 text-slate-300'}">SKU: ${issue.sku}</span>
                                      ` : ''}
                                      ${isResolved ? `
                                        <span class="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                                          ✓ Rozwiązane (${issue.resolvedBy || 'Admin'})
                                        </span>
                                      ` : `
                                        <span class="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                                          Oczekuje
                                        </span>
                                      `}
                                    </div>
                                    <div class="text-xs ${isCream ? 'text-[#3d3224]' : 'text-slate-300'} mt-1 font-medium break-words leading-relaxed">
                                      ${issue.text}
                                    </div>
                                    ${issue.photoUrl ? `
                                      <div class="mt-2 flex items-center gap-2">
                                        <img src="${issue.photoUrl}" alt="Zdjęcie usterki" class="h-16 w-24 object-cover rounded-lg border border-outline-variant cursor-pointer hover:scale-105 transition-transform shadow-xs btn-open-lightbox" data-img-url="${issue.photoUrl}" title="Kliknij, aby powiększyć zdjęcie" />
                                        <button type="button" class="btn-open-lightbox text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer" data-img-url="${issue.photoUrl}">
                                          <span class="material-symbols-outlined text-[14px]">zoom_in</span>
                                          <span>Powiększ zdjęcie</span>
                                        </button>
                                      </div>
                                    ` : ''}
                                  </div>
                                </div>

                                <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                  <button type="button" class="btn-toggle-resolve-issue px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${isResolved ? (isCream ? 'bg-[#ede5d6] text-[#4d4233] border-[#d8ccb8]' : 'bg-slate-800 text-slate-300 border-slate-700') : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 shadow-sm'}" data-issue-id="${issue.id}">
                                    ${isResolved ? 'Wznów zgłoszenie' : '✓ Rozwiązane'}
                                  </button>
                                  <button type="button" class="btn-delete-issue p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/20 cursor-pointer transition-colors" data-issue-id="${issue.id}" title="Usuń ten wpis">
                                    <span class="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      `}
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

                        ${!isArchived ? `
                          <button class="btn-issue-wz-order flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer" data-order-id="${order.id}">
                            <span class="material-symbols-outlined text-[16px]">description</span>
                            <span>${totals.totalProducedQty > 0 ? `WYSTAW DOKUMENT WZ (${totals.totalProducedQty} szt.)` : (wzSummary.totalRemaining > 0 ? `WYSTAW DOKUMENT WZ (Pozostałe ${wzSummary.totalRemaining} szt.)` : 'WYSTAW DOKUMENT WZ')}</span>
                          </button>
                        ` : ''}

                        <button class="btn-print-order-label flex items-center gap-1.5 ${isCream ? 'bg-[#ede5d6] hover:bg-[#ded1bd] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all active:scale-95 border cursor-pointer" data-order-id="${order.id}" title="Drukuj kody kreskowe z zamówienia (bez faktury)">
                          <span class="material-symbols-outlined text-[16px] text-amber-600">barcode</span>
                          <span>DRUKUJ KODY KRESKOWE</span>
                        </button>
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
              <button id="btn-print-modal-pdf" class="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all" title="Drukuj ten dokument">
                <span class="material-symbols-outlined text-[16px]">print</span>
                <span>Drukuj</span>
              </button>
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

      <!-- MODAL: ADD COMMENT / REPORT PROBLEM WITH PHOTO (Od Mateusza / Operatorów) -->
      <div id="issue-comment-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 ${showAddCommentModal ? 'flex' : 'hidden'} items-center justify-center p-3">
        <div class="${isCream ? 'bg-[#fbf7f0] text-[#2c2825] border-[#d8ccb8]' : 'bg-slate-900 text-slate-100 border-slate-700'} border rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
          
          <div class="flex justify-between items-center border-b ${isCream ? 'border-[#ded3c0]' : 'border-slate-800'} pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-500 text-3xl">edit_note</span>
              <div>
                <h3 class="font-bold text-base ${isCream ? 'text-[#2a241e]' : 'text-white'}">📝 Notatka / Zgłoszenie Usterki ze Zdjęciem</h3>
                <p class="text-[11px] ${isCream ? 'text-[#7d6f5e]' : 'text-slate-400'}">Wpisz co jest nie tak, opisz problem i załącz fotkę ze stanowiska</p>
              </div>
            </div>
            <button id="close-comment-modal" class="p-1.5 ${isCream ? 'text-[#786c5e] hover:bg-[#ede5d6]' : 'text-slate-400 hover:text-white hover:bg-slate-800'} rounded-full cursor-pointer">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form id="form-submit-issue" class="flex flex-col gap-3">
            <!-- Operator & Type Selection -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="text-[11px] font-bold block mb-1 ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Kto zgłasza (Operator):</label>
                <select id="issue-operator" class="w-full ${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer">
                  <option value="Mateusz" ${currentOperator?.name === 'Mateusz' ? 'selected' : ''}>👑 Mateusz Klimkowski (Admin)</option>
                  <option value="Paweł" ${currentOperator?.name === 'Paweł' ? 'selected' : ''}>👑 Paweł Peret (Admin)</option>
                  <option value="Szymon" ${currentOperator?.name === 'Szymon' ? 'selected' : ''}>📦 Szymon Klimkowski</option>
                  <option value="Patryk" ${currentOperator?.name === 'Patryk' ? 'selected' : ''}>📦 Patryk Majka</option>
                </select>
              </div>
              <div>
                <label class="text-[11px] font-bold block mb-1 ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Typ zgłoszenia:</label>
                <select id="issue-type" class="w-full ${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer">
                  <option value="PROBLEM">⚠️ Awaria / Problem ze zleceniem</option>
                  <option value="DEFECT">❌ Wada materiału / błąd detalu / bubel</option>
                  <option value="NOTE">📝 Ważna notatka warsztatowa</option>
                  <option value="INFO">ℹ️ Informacja ogólna</option>
                </select>
              </div>
            </div>

            <!-- Order selection -->
            <div>
              <label class="text-[11px] font-bold block mb-1 ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Dotyczy zlecenia:</label>
              <select id="issue-order-select" class="w-full ${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer">
                <option value="">-- Cały warsztat / Uwaga ogólna --</option>
                ${allOrders.map(o => `
                  <option value="${o.id}" ${activeCommentOrder?.id === o.id ? 'selected' : ''}>${o.orderRef || o.odooOrderName || o.id} (${o.customerName || 'Klient'})</option>
                `).join('')}
              </select>
            </div>

            <!-- Item selection if order has items -->
            ${activeCommentOrder && Array.isArray(activeCommentOrder.items) && activeCommentOrder.items.length > 0 ? `
              <div>
                <label class="text-[11px] font-bold block mb-1 ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Dotyczy konkretnego detalu / SKU (opcjonalnie):</label>
                <select id="issue-sku" class="w-full ${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913]' : 'bg-slate-950 border-slate-700 text-white'} border rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer">
                  <option value="">-- Całe zlecenie --</option>
                  ${activeCommentOrder.items.map(it => `
                    <option value="${it.sku || it.symbol || it.name}" ${activeCommentSku === (it.sku || it.symbol) ? 'selected' : ''}>${it.sku || it.symbol || '-'} • ${it.name || ''}</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <!-- Description Textarea -->
            <div>
              <label class="text-[11px] font-bold block mb-1 ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">Treść notatki / co jest nie tak:</label>
              <textarea id="issue-text" rows="4" required placeholder="Wpisz dokładnie co jest nie tak, np. błąd wymiaru na rysunku, brak materiału, uszkodzony gwint, zrobiono 5 szt. za mało, informacja dla Pawła lub Mateusza..." class="w-full ${isCream ? 'bg-white border-[#d8ccb8] text-[#1e1913] placeholder-[#9a8c7b]' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'} border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-sans leading-relaxed"></textarea>
            </div>

            <!-- Photo Attachment with Camera / File Upload -->
            <div>
              <label class="text-[11px] font-bold block mb-1 ${isCream ? 'text-[#4d4233]' : 'text-slate-300'}">📸 Zdjęcie ze stanowiska (aparat w telefonie lub plik ze zdjęciem):</label>
              
              <div class="flex items-center gap-2">
                <label for="input-issue-photo" class="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-4 rounded-xl border-2 border-dashed ${isCream ? 'border-[#d8ccb8] bg-[#f5ebd9] hover:bg-[#ede0ca] text-[#4d4233]' : 'border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-300'} cursor-pointer transition-all active:scale-98">
                  <span class="material-symbols-outlined text-amber-500 text-3xl">add_a_photo</span>
                  <span class="text-xs font-black">📸 Zrób zdjęcie aparatem lub wybierz z galerii</span>
                  <span class="text-[10px] ${isCream ? 'text-[#7d6f5e]' : 'text-slate-500'}">Możesz dołączyć zdjęcie uszkodzonego detalu, detalu na maszynie lub szkicu</span>
                  <input type="file" id="input-issue-photo" accept="image/*" capture="environment" class="hidden" />
                </label>
              </div>

              <div id="issue-photo-preview-container" class="mt-2 ${selectedCommentPhotoPreview ? 'flex' : 'hidden'} items-center gap-3 p-2 rounded-xl border ${isCream ? 'bg-white border-[#d8ccb8]' : 'bg-slate-950 border-slate-800'}">
                <img id="issue-photo-preview-img" src="${selectedCommentPhotoPreview || ''}" class="h-16 w-16 object-cover rounded-lg border border-outline-variant" />
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-bold ${isCream ? 'text-[#2a241e]' : 'text-white'} block truncate" id="issue-photo-name">Zdjęcie wybrane</span>
                  <span class="text-[10px] text-emerald-600 font-bold">✓ Gotowe do wysłania</span>
                </div>
                <button type="button" id="btn-remove-photo" class="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>

            <!-- Submit button -->
            <div class="flex items-center justify-end gap-2 pt-2 border-t ${isCream ? 'border-[#ded3c0]' : 'border-slate-800'}">
              <button type="button" id="btn-cancel-issue" class="px-4 py-2 rounded-xl text-xs font-bold ${isCream ? 'bg-[#ede5d6] text-[#4d4233] hover:bg-[#ded1bd]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} cursor-pointer">
                Anuluj
              </button>
              <button type="submit" id="btn-submit-issue-action" class="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md cursor-pointer transition-all active:scale-95">
                <span class="material-symbols-outlined text-[16px]">send</span>
                <span>WYŚLIJ ZGŁOSZENIE (ZAPISZ)</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: IMAGE LIGHTBOX ZOOM -->
      <div id="image-zoom-modal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] ${lightboxImageUrl ? 'flex' : 'hidden'} items-center justify-center p-3 select-none">
        <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onclick="event.stopPropagation()">
          <button id="close-zoom-modal" class="absolute -top-10 right-0 text-white bg-slate-800/80 hover:bg-slate-700 p-1.5 rounded-full cursor-pointer">
            <span class="material-symbols-outlined text-2xl">close</span>
          </button>
          <img id="zoom-modal-img" src="${lightboxImageUrl || ''}" class="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl" />
          <div class="mt-3 flex items-center gap-3">
            <a id="zoom-download-link" href="${lightboxImageUrl || '#'}" target="_blank" download class="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Pobierz zdjęcie w pełnym rozmiarze</span>
            </a>
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

    // Operator switcher dropdown
    const headerOpSelect = container.querySelector('#header-select-operator');
    if (headerOpSelect) {
      headerOpSelect.addEventListener('change', (e) => {
        const newOp = e.target.value;
        switchActiveOperator(newOp);
        currentOperator = getCurrentOperator();
        isUserAdmin = isAdmin(currentOperator);
        renderUI();
      });
    }

    // Manual sync button
    const btnSync = container.querySelector('#btn-manual-sync');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        const icon = btnSync.querySelector('#sync-icon-spin');
        if (icon) icon.classList.add('animate-spin');
        await syncAllData();
        if (icon) icon.classList.remove('animate-spin');
      });
    }

    // Navigation to History / Audit Log
    const btnNavHist = container.querySelector('#btn-nav-history');
    if (btnNavHist) {
      btnNavHist.addEventListener('click', () => navigateTo('history'));
    }
    const btnFeedHist = container.querySelector('#btn-feed-to-history');
    if (btnFeedHist) {
      btnFeedHist.addEventListener('click', () => navigateTo('history'));
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

    // Year selection buttons
    container.querySelectorAll('.btn-select-year').forEach(btn => {
      btn.addEventListener('click', () => {
        activeYear = btn.getAttribute('data-year');
        activeMonthFilter = 'ALL';
        renderUI();
      });
    });

    // Toggle Annual Breakdown Panel
    const btnToggleBreakdown = container.querySelector('#btn-toggle-annual-breakdown');
    if (btnToggleBreakdown) {
      btnToggleBreakdown.addEventListener('click', () => {
        showAnnualBreakdown = !showAnnualBreakdown;
        renderUI();
      });
    }

    // Close Annual Breakdown Panel
    const btnCloseBreakdown = container.querySelector('#btn-close-annual-breakdown');
    if (btnCloseBreakdown) {
      btnCloseBreakdown.addEventListener('click', () => {
        showAnnualBreakdown = false;
        renderUI();
      });
    }

    // Switch Year from inside summary cards
    container.querySelectorAll('.btn-switch-year-from-summary').forEach(btn => {
      btn.addEventListener('click', () => {
        activeYear = btn.getAttribute('data-year');
        activeMonthFilter = 'ALL';
        renderUI();
      });
    });

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

    // Search input with preserved focus & cursor position
    const searchInput = container.querySelector('#orders-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        searchCursorPos = e.target.selectionStart || 0;
        isSearchingFocus = true;
        renderUI();
      });
      searchInput.addEventListener('focus', () => {
        isSearchingFocus = true;
      });
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement !== container.querySelector('#orders-search-input')) {
            isSearchingFocus = false;
          }
        }, 80);
      });
    }

    // Sort By selector
    const sortSelect = container.querySelector('#orders-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        renderUI();
      });
    }

    // Overdue filter toggle button
    const btnOverdue = container.querySelector('#btn-toggle-overdue-filter');
    if (btnOverdue) {
      btnOverdue.addEventListener('click', () => {
        filterOnlyOverdue = !filterOnlyOverdue;
        renderUI();
      });
    }

    // Workshop Issues / Photos filter toggle button
    const btnIssues = container.querySelector('#btn-toggle-issues-filter');
    if (btnIssues) {
      btnIssues.addEventListener('click', () => {
        filterOnlyIssues = !filterOnlyIssues;
        renderUI();
      });
    }

    // Reset filters button
    const btnReset = container.querySelector('#btn-reset-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        activeTab = 'ALL';
        activeYear = '2026';
        activeCustomerFilter = 'ALL';
        activeMonthFilter = 'ALL';
        currentSortBy = 'DEFAULT';
        filterOnlyOverdue = false;
        filterOnlyIssues = false;
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
      const flushInputQty = () => {
        const orderId = input.getAttribute('data-order-id');
        const itemId = input.getAttribute('data-item-id');
        const maxVal = parseFloat(input.getAttribute('data-max-qty') || input.getAttribute('data-ordered-qty') || 1);
        let val = parseFloat(input.value) || 0;
        if (val < 0) val = 0;
        if (val > maxVal) val = maxVal;
        updateItemProducedQty(orderId, itemId, val);
      };
      input.addEventListener('input', flushInputQty);
      input.addEventListener('change', () => {
        flushInputQty();
        renderUI();
      });
    });

    // ALL button click (Sets max remaining quantity for this item)
    container.querySelectorAll('.btn-item-qty-all').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        const itemId = btn.getAttribute('data-item-id');
        const maxQty = parseFloat(btn.getAttribute('data-max-qty') || 0);
        updateItemProducedQty(orderId, itemId, maxQty);
        renderUI();
      });
    });

    // Open historical WZ document
    container.querySelectorAll('.btn-open-historical-wz').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wzId = btn.getAttribute('data-wz-id');
        navigateTo('wz', { loadWzId: wzId });
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

    // Direct Print from PDF Modal Header
    const btnPrintModalPdf = container.querySelector('#btn-print-modal-pdf');
    if (btnPrintModalPdf) {
      btnPrintModalPdf.addEventListener('click', () => {
        if (previewPdfUrl) {
          const iframe = container.querySelector('#pdf-viewer-modal iframe');
          if (iframe && iframe.contentWindow) {
            try {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              return;
            } catch (e) {
              console.warn('Iframe print fallback to window.open:', e);
            }
          }
          window.open(previewPdfUrl, '_blank');
        }
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

    // Issue WZ document button (Multi-Dispatch Engine: WZ 1, WZ 2, WZ 3...)
    container.querySelectorAll('.btn-issue-wz-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');

        // CRITICAL FIX: Flush any pending input-item-qty in the DOM immediately before reading DB!
        const card = btn.closest('[data-order-card-id]') || container.querySelector(`[data-order-card-id="${orderId}"]`);
        if (card) {
          card.querySelectorAll('.input-item-qty').forEach(input => {
            const iOrderId = input.getAttribute('data-order-id');
            const iItemId = input.getAttribute('data-item-id');
            const maxVal = parseFloat(input.getAttribute('data-max-qty') || input.getAttribute('data-ordered-qty') || 1);
            let val = parseFloat(input.value);
            if (!isNaN(val)) {
              if (val < 0) val = 0;
              if (val > maxVal) val = maxVal;
              updateItemProducedQty(iOrderId, iItemId, val);
            }
          });
        }

        const all = getSavedOrders();
        const order = all.find(o => o.id === orderId);
        if (!order) return;

        const summary = getOrderWzShipmentSummary(order);

        // If ALL items were already 100% shipped on previous WZs:
        if (summary.isAllShipped) {
          const wzListStr = summary.relatedWzs.map(w => `• ${w.formattedNumber || w.wzNum} (z dn. ${w.issueDate})`).join('\n');
          const confirmReopen = confirm(
            `ℹ️ Wszystkie detale z tego zlecenia (${order.orderRef || order.odooOrderName}) zostały już w 100% zrealizowane na ${summary.relatedWzs.length} dokumentach WZ:\n\n${wzListStr}\n\nŁącznie wysłano: ${summary.totalShipped} szt. (Brak pozycji oczekujących na wysyłkę).\n\nCzy chcesz otworzyć generator WZ mimo to (np. dodatkowa wysyłka)?`
          );
          if (!confirmReopen) return;
        }

        // DEDUCT previous WZs and prioritize produced quantities (e.g. 5 szt.)!
        const wzDraft = prepareOrderItemsForWz(order);

        window.__ACTIVE_WZ_ORDER_PARAMS = wzDraft;
        sessionStorage.setItem('bluemake_wz_prefill', JSON.stringify(wzDraft));
        localStorage.setItem('bluemake_wz_active_draft', JSON.stringify(wzDraft));

        navigateTo('wz', { fromOrder: wzDraft });
      });
    });

    // Print Barcodes: Slices clean original EC Engineering vector pages (1:1 fidelity, no invoice)
    container.querySelectorAll('.btn-print-order-label').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        const all = getSavedOrders();
        const order = all.find(o => o.id === orderId);
        if (order) {
          const originalContent = btn.innerHTML;
          btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[16px] text-amber-600">sync</span><span class="hidden sm:inline">Wycinanie stron...</span>`;
          btn.disabled = true;

          try {
            await openAndPrintEcBarcodePdf(order, {
              openModal: (blobUrl, title) => {
                previewPdfUrl = blobUrl;
                previewPdfTitle = title;
                renderUI();
              }
            });
          } catch (err) {
            console.error('Błąd wycinania kodów EC:', err);
            alert(`Błąd: ${err.message || err}`);
          } finally {
            btn.innerHTML = originalContent;
            btn.disabled = false;
          }
        }
      });
    });

    // Preview technical drawing PDF for an item (Local /orders_pdf/ first, then Odoo attachments)
    container.querySelectorAll('.btn-preview-item-drawing').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const sku = (btn.getAttribute('data-sku') || '').trim();
        const symbol = (btn.getAttribute('data-symbol') || '').trim();
        const name = (btn.getAttribute('data-name') || '').trim();
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[15px]">sync</span>`;
        btn.disabled = true;

        try {
          const res = await findItemDrawingPdf(sku, symbol, name);
          if (res && res.url) {
            previewPdfUrl = res.url;
            previewPdfTitle = `Rysunek detalu: ${sku || symbol} (${res.fileName || ''})`;
            renderUI();
            return;
          }

          alert(`ℹ️ Brak podpiętego rysunku technicznego dla detalu "${sku || symbol}" (${name}).\n\nMożesz wgrać rysunek do Odoo lub skopiować do katalogu orders_pdf.`);
        } catch (err) {
          console.error('Błąd otwierania rysunku detalu:', err);
          alert(`Błąd odczytu rysunku: ${err.message || err}`);
        } finally {
          btn.innerHTML = originalContent;
          btn.disabled = false;
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
    // === WORKSHOP COMMENTS & PHOTO ISSUES LISTENERS ===

    // Open Issue / Comment Form
    container.querySelectorAll('.btn-open-issue-form').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        const itemSku = btn.getAttribute('data-item-sku');
        const allOrders = getSavedOrders();
        activeCommentOrder = allOrders.find(o => o.id === orderId) || null;
        activeCommentSku = itemSku || '';
        selectedCommentPhotoFile = null;
        selectedCommentPhotoPreview = null;
        showAddCommentModal = true;
        renderUI();
      });
    });

    // Top Header + Notatka / Foto button
    const btnHeaderAddIssue = container.querySelector('#btn-header-add-issue');
    if (btnHeaderAddIssue) {
      btnHeaderAddIssue.addEventListener('click', () => {
        activeCommentOrder = null;
        activeCommentSku = '';
        selectedCommentPhotoFile = null;
        selectedCommentPhotoPreview = null;
        showAddCommentModal = true;
        renderUI();
      });
    }

    // Dynamic order selection inside modal
    const modalOrderSelect = container.querySelector('#issue-order-select');
    if (modalOrderSelect) {
      modalOrderSelect.addEventListener('change', (e) => {
        const selId = e.target.value;
        const allOrders = getSavedOrders();
        activeCommentOrder = allOrders.find(o => o.id === selId) || null;
        activeCommentSku = '';
        renderUI();
      });
    }

    // Close Comment Modal
    const closeCommentBtn = container.querySelector('#close-comment-modal');
    if (closeCommentBtn) {
      closeCommentBtn.addEventListener('click', () => {
        showAddCommentModal = false;
        renderUI();
      });
    }

    const cancelIssueBtn = container.querySelector('#btn-cancel-issue');
    if (cancelIssueBtn) {
      cancelIssueBtn.addEventListener('click', () => {
        showAddCommentModal = false;
        renderUI();
      });
    }

    // Photo input change (Camera / File)
    const issuePhotoInput = container.querySelector('#input-issue-photo');
    if (issuePhotoInput) {
      issuePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          selectedCommentPhotoFile = file;
          const reader = new FileReader();
          reader.onload = (evt) => {
            selectedCommentPhotoPreview = evt.target.result;
            const previewContainer = container.querySelector('#issue-photo-preview-container');
            const previewImg = container.querySelector('#issue-photo-preview-img');
            const photoName = container.querySelector('#issue-photo-name');
            if (previewContainer && previewImg) {
              previewImg.src = selectedCommentPhotoPreview;
              if (photoName) photoName.textContent = file.name;
              previewContainer.classList.remove('hidden');
              previewContainer.classList.add('flex');
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove selected photo
    const btnRemovePhoto = container.querySelector('#btn-remove-photo');
    if (btnRemovePhoto) {
      btnRemovePhoto.addEventListener('click', () => {
        selectedCommentPhotoFile = null;
        selectedCommentPhotoPreview = null;
        const previewContainer = container.querySelector('#issue-photo-preview-container');
        if (previewContainer) {
          previewContainer.classList.add('hidden');
          previewContainer.classList.remove('flex');
        }
        if (issuePhotoInput) issuePhotoInput.value = '';
      });
    }

    // Submit Issue / Comment
    const formSubmitIssue = container.querySelector('#form-submit-issue');
    if (formSubmitIssue) {
      formSubmitIssue.addEventListener('submit', async (e) => {
        e.preventDefault();
        const operatorEl = container.querySelector('#issue-operator');
        const typeEl = container.querySelector('#issue-type');
        const skuEl = container.querySelector('#issue-sku');
        const textEl = container.querySelector('#issue-text');
        const submitBtn = container.querySelector('#btn-submit-issue-action');
        const orderSelectEl = container.querySelector('#issue-order-select');

        let effectiveOrder = activeCommentOrder;
        if (orderSelectEl && orderSelectEl.value) {
          const allOrders = getSavedOrders();
          effectiveOrder = allOrders.find(o => o.id === orderSelectEl.value) || activeCommentOrder;
        }

        const operatorVal = operatorEl ? operatorEl.value : 'Mateusz';
        const typeVal = typeEl ? typeEl.value : 'PROBLEM';
        const skuVal = skuEl ? skuEl.value : '';
        const textVal = textEl ? textEl.value.trim() : '';

        if (!textVal && !selectedCommentPhotoFile) {
          alert('Wprowadź treść zgłoszenia lub załącz zdjęcie!');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[16px]">sync</span><span>Wysyłanie...</span>`;
        }

        const res = await submitComment({
          orderId: effectiveOrder?.id || null,
          orderRef: effectiveOrder?.orderRef || effectiveOrder?.odooOrderName || '',
          sku: skuVal,
          operator: operatorVal,
          text: textVal,
          photoFile: selectedCommentPhotoFile,
          type: typeVal
        });

        if (res.success) {
          showAddCommentModal = false;
          selectedCommentPhotoFile = null;
          selectedCommentPhotoPreview = null;
          orderComments = await fetchComments();
          renderUI();
        } else {
          alert('Błąd podczas zapisywania zgłoszenia: ' + (res.error || 'Nieznany błąd'));
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">send</span><span>WYŚLIJ ZGŁOSZENIE (ZAPISZ)</span>`;
          }
        }
      });
    }

    // Toggle Resolve issue
    container.querySelectorAll('.btn-toggle-resolve-issue').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const issueId = btn.getAttribute('data-issue-id');
        btn.disabled = true;
        btn.textContent = 'Zapisywanie...';
        await toggleResolveComment(issueId, currentOperator?.name || 'Admin');
        orderComments = await fetchComments();
        renderUI();
      });
    });

    // Delete issue
    container.querySelectorAll('.btn-delete-issue').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const issueId = btn.getAttribute('data-issue-id');
        if (confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) {
          await deleteComment(issueId);
          orderComments = await fetchComments();
          renderUI();
        }
      });
    });

    // Open Lightbox Image
    container.querySelectorAll('.btn-open-lightbox').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgUrl = el.getAttribute('data-img-url');
        lightboxImageUrl = imgUrl;
        const modal = container.querySelector('#image-zoom-modal');
        const modalImg = container.querySelector('#zoom-modal-img');
        const downloadLink = container.querySelector('#zoom-download-link');
        if (modal && modalImg) {
          modalImg.src = imgUrl;
          if (downloadLink) downloadLink.href = imgUrl;
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        }
      });
    });

    const closeZoomBtn = container.querySelector('#close-zoom-modal');
    if (closeZoomBtn) {
      closeZoomBtn.addEventListener('click', () => {
        const modal = container.querySelector('#image-zoom-modal');
        if (modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
        lightboxImageUrl = null;
      });
    }

    // Restore focus and cursor position in search bar after re-render
    if (isSearchingFocus) {
      const freshSearchInput = container.querySelector('#orders-search-input');
      if (freshSearchInput) {
        freshSearchInput.focus();
        try {
          freshSearchInput.setSelectionRange(searchCursorPos, searchCursorPos);
        } catch (e) {}
      }
    }
  }

  // Initial render
  renderUI();
}
