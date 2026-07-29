import { getProducts, getCategories, checkApiStatus } from '../services/odooApi.js';
import { openSettingsModal } from './SettingsModal.js';
import { openCreateProductModal } from './CreateProductModal.js';
import { openReportWindow } from '../utils/reportGenerator.js';

export function renderDashboardView(container, navigateTo) {
  let activeFilter = 'RAW'; // 'RAW' (Surowiec), 'FINISHED' (Produkt gotowy), 'ALL' (Wszystkie)
  let selectedCategoryId = null; // Specific Odoo category ID filter
  let allCategories = [];
  let allProducts = null;

  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="fixed top-0 left-0 w-full z-50 bg-surface border-b border-outline-variant h-touch-target-min flex justify-between items-center px-margin-mobile">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-high rounded-full p-2 transition-transform duration-100 active:scale-95" id="header-settings">settings_remote</span>
        <h1 class="font-headline-md text-headline-md font-bold text-primary tracking-tight">Bluemake</h1>
      </div>
      <div class="flex items-center gap-2">
        <button id="hdr-valuation" title="Podstrona Wyceny i Raportu Magazynu" class="flex items-center gap-1 bg-primary text-on-primary font-label-caps px-3 py-1.5 rounded text-xs font-bold transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[16px]">payments</span>
          <span>WYCENA</span>
        </button>
        <div id="conn-pill" class="flex items-center gap-1.5 bg-surface-container rounded-full px-3 py-1 cursor-pointer">
          <div id="conn-dot" class="w-2 h-2 rounded-full bg-gray-400"></div>
          <span id="conn-label" class="font-label-caps text-label-caps text-on-surface-variant">Sprawdzanie...</span>
        </div>
        <span id="hdr-cloud" class="material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-high rounded-full p-2 transition-transform duration-100 active:scale-95" style="font-variation-settings: 'FILL' 1;">cloud_done</span>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md flex flex-col gap-3 mt-14 mb-24">
      <!-- Search & Action Buttons Bar -->
      <div class="flex flex-col sm:flex-row gap-2 w-full">
        <div class="relative flex-1 h-touch-target-min">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input id="search-input" class="w-full h-full pl-12 pr-4 bg-surface-container rounded border-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary focus:bg-surface" placeholder="Szukaj pręta / blachy (SKU lub Nazwa)" type="text"/>
        </div>
        
        <!-- Interactive Category Select Button -->
        <button id="cat-selector-btn" class="h-touch-target-min bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-caps px-3.5 rounded flex items-center justify-center gap-1.5 transition-colors flex-shrink-0 font-bold border border-outline-variant">
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          <span id="cat-btn-label">SUROWIEC (ID: 4)</span>
        </button>

        <!-- Valuation Subpage Button -->
        <button id="btn-open-valuation" class="h-touch-target-min bg-emerald-700 hover:bg-emerald-800 text-white font-label-caps px-4 rounded flex items-center justify-center gap-1.5 shadow-md uppercase font-bold transition-transform active:scale-95 flex-shrink-0">
          <span class="material-symbols-outlined text-[18px]">payments</span>
          WYCENA & WAGA
        </button>

        <!-- Printable Report Button -->
        <button id="btn-print-report" class="h-touch-target-min bg-amber-600 hover:bg-amber-700 text-white font-label-caps px-3.5 rounded flex items-center justify-center gap-1.5 shadow-md uppercase font-bold transition-transform active:scale-95 flex-shrink-0">
          <span class="material-symbols-outlined text-[18px]">print</span>
          RAPORT HTML
        </button>

        <!-- Add Rod Button -->
        <button id="btn-add-product" class="h-touch-target-min bg-[#ff6b00] hover:bg-[#e66000] text-white font-label-caps px-3.5 rounded flex items-center justify-center gap-1.5 shadow-md uppercase font-bold transition-transform active:scale-95 flex-shrink-0">
          <span class="material-symbols-outlined text-[20px]">add_box</span>
          DODAJ PRĘT
        </button>
      </div>

      <!-- Filter Pills (Surowce vs Produkty vs Wszystkie) -->
      <div class="flex flex-wrap items-center gap-2">
        <button id="filter-raw" class="px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 bg-primary text-on-primary shadow-sm">
          <span class="material-symbols-outlined text-[15px]">inventory_2</span>
          SUROWCE (KAT. 4)
        </button>
        <button id="filter-finished" class="px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">
          <span class="material-symbols-outlined text-[15px]">precision_manufacturing</span>
          PRODUKTY (KAT. 5)
        </button>
        <button id="filter-all" class="px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">
          <span class="material-symbols-outlined text-[15px]">list</span>
          WSZYSTKIE POZYCJE
        </button>
      </div>

      <!-- Material List Container (Compact Industrial Grid) -->
      <div id="product-list" class="flex flex-col gap-2">
        <div class="col-span-full text-center py-12 text-on-surface-variant font-body-md">
          <span class="material-symbols-outlined animate-spin text-4xl mb-2">sync</span>
          <p>Pobieranie pozycji z Odoo 19...</p>
        </div>
      </div>
    </main>

    <!-- Floating Action Button (Scanner) -->
    <button id="fab-scanner" class="fixed bottom-24 md:bottom-8 right-margin-mobile md:right-margin-desktop w-[60px] h-[60px] bg-primary text-on-primary rounded-full shadow-[0_4px_12px_rgba(45,52,54,0.3)] flex items-center justify-center hover:bg-tertiary transition-transform active:scale-90 z-40">
      <span class="material-symbols-outlined text-[30px]">barcode_scanner</span>
    </button>

    <!-- BottomNavBar (Mobile Only) -->
    <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface px-margin-mobile border-t-2 border-primary md:hidden">
      <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-3 py-1 cursor-pointer transition-all duration-150 active:scale-90">
        <span class="material-symbols-outlined mb-1">dashboard</span>
        <span class="font-label-caps text-label-caps">Dashboard</span>
      </div>
      <div id="nav-val" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 cursor-pointer transition-all duration-150 hover:bg-surface-container-highest active:scale-90 rounded-xl">
        <span class="material-symbols-outlined mb-1">payments</span>
        <span class="font-label-caps text-label-caps">Wycena</span>
      </div>
      <div id="nav-scanner" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 cursor-pointer transition-all duration-150 hover:bg-surface-container-highest active:scale-90 rounded-xl">
        <span class="material-symbols-outlined mb-1">barcode_scanner</span>
        <span class="font-label-caps text-label-caps">Scanner</span>
      </div>
      <div id="nav-history" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 cursor-pointer transition-all duration-150 hover:bg-surface-container-highest active:scale-90 rounded-xl">
        <span class="material-symbols-outlined mb-1">history</span>
        <span class="font-label-caps text-label-caps">History</span>
      </div>
    </nav>

    <!-- Category Selector Dropdown Modal -->
    <div id="cat-modal" class="fixed inset-0 bg-primary/50 backdrop-blur-sm z-[90] hidden flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-lg p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
        <div class="flex justify-between items-center border-b border-outline-variant pb-2">
          <h3 class="font-bold text-primary font-headline-md flex items-center gap-1">
            <span class="material-symbols-outlined">filter_list</span> Wybierz Kategorię Odoo
          </h3>
          <button id="close-cat-modal" class="p-1 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div id="cat-modal-options" class="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;

  async function updateStatusPill() {
    const status = await checkApiStatus();
    const dot = container.querySelector('#conn-dot');
    const label = container.querySelector('#conn-label');

    if (status.connected) {
      dot.className = 'w-2 h-2 rounded-full bg-green-500 animate-pulse';
      label.textContent = 'Connected';
    } else {
      dot.className = 'w-2 h-2 rounded-full bg-red-500';
      label.textContent = 'Offline';
    }
  }

  async function loadData() {
    updateStatusPill();
    allCategories = await getCategories();
    allProducts = await getProducts();

    populateCategoryModal();
    filterAndRender();
  }

  function populateCategoryModal() {
    const optsContainer = container.querySelector('#cat-modal-options');
    const items = [
      { id: null, name: 'Wszystkie kategorie' },
      ...allCategories
    ];

    optsContainer.innerHTML = items.map(c => `
      <button data-cat-id="${c.id !== null ? c.id : ''}" class="cat-opt-btn w-full text-left px-3 py-2 rounded text-body-md font-bold flex justify-between items-center ${selectedCategoryId === c.id ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high text-primary'}">
        <span>${c.complete_name || c.name}</span>
        ${c.id !== null ? `<span class="text-xs opacity-75 font-mono">ID: ${c.id}</span>` : ''}
      </button>
    `).join('');

    optsContainer.querySelectorAll('.cat-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rawId = btn.getAttribute('data-cat-id');
        selectedCategoryId = rawId !== '' ? Number(rawId) : null;
        
        const labelEl = container.querySelector('#cat-btn-label');
        if (selectedCategoryId === 4) {
          activeFilter = 'RAW';
          labelEl.textContent = 'SUROWIEC (ID: 4)';
        } else if (selectedCategoryId === 5) {
          activeFilter = 'FINISHED';
          labelEl.textContent = 'PRODUKT (ID: 5)';
        } else if (selectedCategoryId !== null) {
          activeFilter = 'CUSTOM';
          const found = allCategories.find(c => c.id === selectedCategoryId);
          labelEl.textContent = `${found ? found.name : 'KAT'} (ID: ${selectedCategoryId})`;
        } else {
          activeFilter = 'ALL';
          labelEl.textContent = 'WSZYSTKIE KAT.';
        }

        updateFilterButtonsUI();
        container.querySelector('#cat-modal').classList.add('hidden');
        filterAndRender();
      });
    });
  }

  function filterAndRender() {
    const listEl = container.querySelector('#product-list');

    if (allProducts === null) {
      listEl.innerHTML = `
        <div class="bg-surface-container-lowest border-2 border-red-300 rounded-lg p-6 text-center flex flex-col items-center gap-3 my-6 shadow-md">
          <div class="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-3xl">cloud_off</span>
          </div>
          <h3 class="font-headline-md font-bold text-primary">Brak połączenia z Odoo</h3>
          <p class="font-body-md text-on-surface-variant max-w-md">Nie można połączyć się z serwerem Odoo API. Upewnij się, że masz dostęp do internetu / VPN oraz że Ustawienia API są prawidłowe.</p>
          <div class="flex gap-2 mt-2">
            <button id="btn-retry-conn" class="bg-primary hover:bg-tertiary text-on-primary font-label-caps px-4 py-2 rounded font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">sync</span> PONÓW POŁĄCZENIE
            </button>
            <button id="btn-offline-cfg" class="bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-caps px-4 py-2 rounded font-bold flex items-center gap-1 border border-outline-variant">
              <span class="material-symbols-outlined text-[16px]">settings_remote</span> USTAWIENIA API
            </button>
          </div>
        </div>
      `;

      listEl.querySelector('#btn-retry-conn').addEventListener('click', () => loadData());
      listEl.querySelector('#btn-offline-cfg').addEventListener('click', () => openSettingsModal(() => loadData()));
      return;
    }

    const searchVal = container.querySelector('#search-input').value.toLowerCase().trim();

    let filtered = allProducts.filter(p => {
      const matchesSearch = p.sku.toLowerCase().includes(searchVal) || p.name.toLowerCase().includes(searchVal);
      if (!matchesSearch) return false;

      if (selectedCategoryId !== null) {
        return p.categoryId === selectedCategoryId;
      }

      if (activeFilter === 'RAW') return p.isRawMaterial;
      if (activeFilter === 'FINISHED') return p.isFinishedProduct;
      return true;
    });

    renderCompactProductList(filtered);
  }

  function updateFilterButtonsUI() {
    const btnRaw = container.querySelector('#filter-raw');
    const btnFinished = container.querySelector('#filter-finished');
    const btnAll = container.querySelector('#filter-all');

    const activeClasses = 'bg-primary text-on-primary shadow-sm';
    const inactiveClasses = 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest';

    btnRaw.className = `px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 ${activeFilter === 'RAW' ? activeClasses : inactiveClasses}`;
    btnFinished.className = `px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 ${activeFilter === 'FINISHED' ? activeClasses : inactiveClasses}`;
    btnAll.className = `px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 ${activeFilter === 'ALL' ? activeClasses : inactiveClasses}`;
  }

  function renderCompactProductList(products) {
    const listEl = container.querySelector('#product-list');
    if (!products || products.length === 0) {
      listEl.innerHTML = `
        <div class="col-span-full text-center py-12 text-on-surface-variant">
          <p class="font-headline-md">Brak pozycji w wybranej kategorii</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = products.map(p => `
      <div class="bg-surface-container-lowest border ${p.isLowStock ? 'border-error/60' : 'border-outline-variant/40'} rounded p-3 shadow-sm hover:border-primary/50 transition-colors flex flex-row items-center justify-between gap-3">
        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container text-primary border border-outline-variant/30 flex-shrink-0">${p.sku}</span>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${p.categoryId === 4 ? 'bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/30' : 'bg-primary/10 text-primary border border-primary/20'}">
              ${p.categoryName || (p.categoryId === 4 ? 'SUROWIEC' : 'PRODUKT')}
            </span>
          </div>
          <h2 class="font-body-md text-body-md font-bold text-on-surface truncate mt-0.5">${p.name}</h2>
          <div class="text-xs text-on-surface-variant flex items-center gap-2">
            <span>Strefa 5</span>
            <span>•</span>
            <span class="font-bold ${p.isLowStock ? 'text-error' : 'text-primary'}">Stan: ${Number(p.quantity).toFixed(1)}${p.uom}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button data-product-id="${p.id}" class="update-stock-btn px-3 py-2 bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-label-caps text-xs rounded transition-colors uppercase font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">edit</span> UPDATE
          </button>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.update-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = Number(btn.getAttribute('data-product-id'));
        const product = allProducts.find(item => item.id === pId);
        if (product) {
          navigateTo('product', product);
        }
      });
    });
  }

  // Event Listeners
  container.querySelector('#search-input').addEventListener('input', () => filterAndRender());

  container.querySelector('#cat-selector-btn').addEventListener('click', () => {
    container.querySelector('#cat-modal').classList.remove('hidden');
  });

  container.querySelector('#close-cat-modal').addEventListener('click', () => {
    container.querySelector('#cat-modal').classList.add('hidden');
  });

  container.querySelector('#btn-open-valuation').addEventListener('click', () => navigateTo('valuation'));
  container.querySelector('#hdr-valuation').addEventListener('click', () => navigateTo('valuation'));
  container.querySelector('#nav-val').addEventListener('click', () => navigateTo('valuation'));

  container.querySelector('#btn-print-report').addEventListener('click', () => {
    if (allProducts) openReportWindow(allProducts);
  });

  container.querySelector('#btn-add-product').addEventListener('click', () => {
    openCreateProductModal(() => loadData());
  });

  container.querySelector('#filter-raw').addEventListener('click', () => {
    activeFilter = 'RAW';
    selectedCategoryId = 4;
    container.querySelector('#cat-btn-label').textContent = 'SUROWIEC (ID: 4)';
    updateFilterButtonsUI();
    filterAndRender();
  });

  container.querySelector('#filter-finished').addEventListener('click', () => {
    activeFilter = 'FINISHED';
    selectedCategoryId = 5;
    container.querySelector('#cat-btn-label').textContent = 'PRODUKT (ID: 5)';
    updateFilterButtonsUI();
    filterAndRender();
  });

  container.querySelector('#filter-all').addEventListener('click', () => {
    activeFilter = 'ALL';
    selectedCategoryId = null;
    container.querySelector('#cat-btn-label').textContent = 'WSZYSTKIE KAT.';
    updateFilterButtonsUI();
    filterAndRender();
  });

  container.querySelector('#header-settings').addEventListener('click', () => {
    openSettingsModal(() => loadData());
  });

  container.querySelector('#hdr-cloud').addEventListener('click', () => navigateTo('history'));
  container.querySelector('#conn-pill').addEventListener('click', () => navigateTo('history'));

  container.querySelector('#fab-scanner').addEventListener('click', () => navigateTo('scanner'));
  container.querySelector('#nav-scanner').addEventListener('click', () => navigateTo('scanner'));
  container.querySelector('#nav-history').addEventListener('click', () => navigateTo('history'));

  loadData();
}
