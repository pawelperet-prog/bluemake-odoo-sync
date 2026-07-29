import { getProducts, checkApiStatus } from '../services/odooApi.js';
import { parseMaterialType, parseSteelGrade, calculateWeightKg, formatSpecs, STEEL_GRADES } from '../utils/valuationCalculator.js';
import { generateRawMaterialsHtml } from '../utils/reportGenerator.js';
import { getMarketReferencePrice, DEFAULT_MARKET_PRICES } from '../utils/marketPrices.js';

const LOCAL_STORAGE_PRICES_KEY = 'odoo_raw_material_prices';

function loadSavedPrices() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRICES_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_MARKET_PRICES };
  } catch (e) {
    return { ...DEFAULT_MARKET_PRICES };
  }
}

function savePrices(prices) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PRICES_KEY, JSON.stringify(prices));
  } catch (e) {
    console.error('Error saving prices:', e);
  }
}

export function renderValuationView(container, navigateTo) {
  let activeTypeFilter = 'ALL'; // 'ALL', 'BLACHA', 'PRĘT', 'PŁASKOWNIK'
  let activeGradeFilter = 'ALL'; // 'ALL', 'S355', '1.4301', 'HM', 'HMT'...
  let allProducts = [];
  let itemPrices = loadSavedPrices();

  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="fixed top-0 left-0 w-full z-50 bg-surface border-b border-outline-variant h-touch-target-min flex justify-between items-center px-margin-mobile">
      <div id="btn-back" class="flex items-center gap-2 cursor-pointer hover:bg-surface-container-high p-1 rounded">
        <span class="material-symbols-outlined text-primary">arrow_back</span>
        <h1 class="font-headline-md text-headline-md font-bold text-primary tracking-tight">Wycena & Raport Surowców</h1>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-fill-market" title="Wypełnij średnimi cenami rynkowymi stali" class="bg-amber-600 hover:bg-amber-700 text-white font-label-caps px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold shadow-sm uppercase">
          <span class="material-symbols-outlined text-[16px]">trending_up</span>
          <span>CENY RYNKOWE</span>
        </button>
        <button id="btn-export-excel" class="bg-emerald-700 hover:bg-emerald-800 text-white font-label-caps px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold shadow-sm uppercase">
          <span class="material-symbols-outlined text-[16px]">table_chart</span>
          <span class="hidden sm:inline">EXCEL</span>
        </button>
        <button id="btn-export-pdf" class="bg-primary hover:bg-tertiary text-on-primary font-label-caps px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold shadow-sm uppercase">
          <span class="material-symbols-outlined text-[16px]">print</span>
          <span class="hidden sm:inline">PDF</span>
        </button>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md flex flex-col gap-4 mt-14 mb-24">
      
      <!-- Summary Cards Header -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm">
          <span class="font-label-caps text-xs text-on-surface-variant font-bold block uppercase">Pozycje Surowcowe</span>
          <span id="summary-count" class="font-headline-lg font-black text-primary text-2xl">0</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm">
          <span class="font-label-caps text-xs text-on-surface-variant font-bold block uppercase">Łączna Waga Magazynu</span>
          <span id="summary-weight" class="font-headline-lg font-black text-emerald-700 text-2xl">0 kg</span>
        </div>
        <div class="bg-primary/10 border-2 border-primary rounded-lg p-4 shadow-md">
          <span class="font-label-caps text-xs text-primary font-bold block uppercase">ŁĄCZNA WARTOŚĆ SUROWCÓW</span>
          <span id="summary-val" class="font-headline-lg font-black text-primary text-3xl">0.00 PLN</span>
        </div>
      </div>

      <!-- Filters & Reference Info Bar -->
      <div class="flex flex-col gap-2 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/40">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <!-- Type Filter Pills -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-on-surface-variant uppercase mr-1">Rodzaj:</span>
            <button id="type-all" class="px-3 py-1 text-xs font-bold rounded-full bg-primary text-on-primary shadow-sm">WSZYSTKIE</button>
            <button id="type-blacha" class="px-3 py-1 text-xs font-bold rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">BLACHY</button>
            <button id="type-pret" class="px-3 py-1 text-xs font-bold rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">PRĘTY</button>
            <button id="type-plaskownik" class="px-3 py-1 text-xs font-bold rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">PŁASKOWNIKI</button>
          </div>

          <button id="btn-fill-market-sec" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded text-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-[15px]">bolt</span> Użyj Średnich Cen Rynkowych
          </button>
        </div>

        <!-- Grade Filter Pills -->
        <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/30">
          <span class="text-xs font-bold text-on-surface-variant uppercase mr-1">Gatunek:</span>
          <button data-grade="ALL" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-primary text-on-primary">WSZYSTKIE</button>
          <button data-grade="S355" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-amber-100 text-amber-900 border-amber-300">S355 (~4.50zł)</button>
          <button data-grade="1.4301" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-blue-100 text-blue-900 border-blue-300">1.4301 (~17.50zł)</button>
          <button data-grade="HM" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-emerald-100 text-emerald-900 border-emerald-300">HM (~5.80zł)</button>
          <button data-grade="HMT" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-purple-100 text-purple-900 border-purple-300">HMT (~6.20zł)</button>
          <button data-grade="S235" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-sky-100 text-sky-900 border-sky-300">S235 (~4.15zł)</button>
          <button data-grade="C45" class="grade-pill-btn px-2.5 py-0.5 text-[11px] font-mono font-bold rounded border bg-teal-100 text-teal-900 border-teal-300">C45 (~5.10zł)</button>
        </div>
      </div>

      <!-- Main Valuation Table -->
      <div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-x-auto shadow-sm">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-surface-container-high text-primary font-bold text-xs uppercase tracking-wider border-b border-outline-variant">
              <th class="p-3">Rodzaj / SKU</th>
              <th class="p-3">Gatunek</th>
              <th class="p-3">Nazwa Surowca & Wymiar</th>
              <th class="p-3 text-right">Stan</th>
              <th class="p-3 text-right">Waga (kg)</th>
              <th class="p-3 text-right">Cena PLN/kg (Rynkowa)</th>
              <th class="p-3 text-right">Wartość (PLN)</th>
            </tr>
          </thead>
          <tbody id="valuation-tbody">
            <tr>
              <td colSpan="7" class="text-center py-8 text-on-surface-variant">Ładowanie wyceny magazynu...</td>
            </tr>
          </tbody>
        </table>
      </div>

    </main>

    <!-- BottomNavBar (Mobile Only) -->
    <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface px-margin-mobile border-t-2 border-primary md:hidden">
      <div id="nav-dash" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 cursor-pointer hover:bg-surface-container-highest rounded-xl">
        <span class="material-symbols-outlined mb-1">dashboard</span>
        <span class="font-label-caps text-label-caps">Dashboard</span>
      </div>
      <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 cursor-pointer">
        <span class="material-symbols-outlined mb-1">payments</span>
        <span class="font-label-caps text-label-caps">Wycena</span>
      </div>
      <div id="nav-hist" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 cursor-pointer hover:bg-surface-container-highest rounded-xl">
        <span class="material-symbols-outlined mb-1">history</span>
        <span class="font-label-caps text-label-caps">History</span>
      </div>
    </nav>
  `;

  async function loadData() {
    const raw = await getProducts();
    allProducts = (raw || []).filter(p => p.isRawMaterial || p.categoryId === 4);
    renderTable();
  }

  function getPriceForProduct(p) {
    const grade = parseSteelGrade(p.sku, p.name);
    if (itemPrices[p.sku] !== undefined) return itemPrices[p.sku];
    if (itemPrices[grade] !== undefined) return itemPrices[grade];
    return getMarketReferencePrice(p.sku, p.name, grade);
  }

  function applyMarketPrices() {
    allProducts.forEach(p => {
      const grade = parseSteelGrade(p.sku, p.name);
      const marketPrice = getMarketReferencePrice(p.sku, p.name, grade);
      itemPrices[p.sku] = marketPrice;
      itemPrices[grade] = marketPrice;
    });
    savePrices(itemPrices);
    renderTable();
  }

  function renderTable() {
    const tbody = container.querySelector('#valuation-tbody');

    const filtered = allProducts.filter(p => {
      const type = parseMaterialType(p.sku, p.name);
      const grade = parseSteelGrade(p.sku, p.name);

      if (activeTypeFilter !== 'ALL' && type !== activeTypeFilter) return false;
      if (activeGradeFilter !== 'ALL' && grade !== activeGradeFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colSpan="7" class="text-center py-8 text-on-surface-variant font-bold">Brak surowców spełniających kryteria filtrów.</td>
        </tr>
      `;
      updateSummary(0, 0, 0);
      return;
    }

    let totalWeightSum = 0;
    let totalValuationSum = 0;

    tbody.innerHTML = filtered.map(p => {
      const type = parseMaterialType(p.sku, p.name);
      const grade = parseSteelGrade(p.sku, p.name);
      const weightKg = calculateWeightKg(p);
      const specs = formatSpecs(p);
      const pricePerKg = getPriceForProduct(p);
      const marketRef = getMarketReferencePrice(p.sku, p.name, grade);
      const rowValuation = weightKg * pricePerKg;

      totalWeightSum += weightKg;
      totalValuationSum += rowValuation;

      return `
        <tr class="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
          <td class="p-3">
            <div class="flex flex-col">
              <span class="font-mono font-bold text-primary">${p.sku}</span>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit mt-0.5 ${type === 'BLACHA' ? 'bg-amber-100 text-amber-900 border border-amber-300' : (type === 'PRĘT' ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-purple-100 text-purple-900 border border-purple-300')}">
                ${type}
              </span>
            </div>
          </td>
          <td class="p-3 font-bold">
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold ${grade === 'S355' ? 'bg-amber-200 text-amber-900' : (grade === '1.4301' ? 'bg-blue-200 text-blue-900' : (grade === 'HM' || grade === 'HMT' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-900'))}">
              ${grade}
            </span>
          </td>
          <td class="p-3">
            <div class="font-bold text-on-surface">${p.name}</div>
            <div class="text-xs text-on-surface-variant font-mono">${specs}</div>
          </td>
          <td class="p-3 text-right font-mono font-bold">
            ${Number(p.quantity).toFixed(1)} <span class="text-xs text-on-surface-variant font-normal">${p.uom}</span>
          </td>
          <td class="p-3 text-right font-mono font-bold text-emerald-800">
            ${weightKg.toFixed(1)} kg
          </td>
          <td class="p-3 text-right">
            <div class="flex flex-col items-end gap-0.5">
              <input data-sku="${p.sku}" data-grade="${grade}" type="number" step="0.1" value="${pricePerKg.toFixed(2)}" class="price-input w-24 bg-surface-container border border-outline-variant rounded px-2 py-1 text-right font-mono font-bold text-primary focus:ring-2 focus:ring-primary"/>
              <span class="text-[10px] text-slate-500 font-mono">rys: ~${marketRef.toFixed(2)} zł</span>
            </div>
          </td>
          <td class="p-3 text-right font-mono font-bold text-primary text-base">
            ${rowValuation.toFixed(2)} zł
          </td>
        </tr>
      `;
    }).join('');

    updateSummary(filtered.length, totalWeightSum, totalValuationSum);

    // Event handlers for live price editing
    tbody.querySelectorAll('.price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        const sku = input.getAttribute('data-sku');
        const grade = input.getAttribute('data-grade');

        itemPrices[sku] = val;
        itemPrices[grade] = val;
        savePrices(itemPrices);

        renderTable();
      });
    });
  }

  function updateSummary(count, weightKg, valPln) {
    container.querySelector('#summary-count').textContent = `${count} pozycji`;
    container.querySelector('#summary-weight').textContent = `${weightKg.toFixed(1)} kg (${(weightKg / 1000).toFixed(2)} t)`;
    container.querySelector('#summary-val').textContent = `${valPln.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`;
  }

  function exportToCsv() {
    const headers = ['Rodzaj', 'Gatunek', 'SKU', 'Nazwa', 'Wymiar', 'Stan', 'Jednostka', 'Waga (kg)', 'Cena PLN/kg', 'Wartość PLN'];
    const rows = allProducts.map(p => {
      const type = parseMaterialType(p.sku, p.name);
      const grade = parseSteelGrade(p.sku, p.name);
      const weight = calculateWeightKg(p);
      const price = getPriceForProduct(p);
      const val = weight * price;
      return [
        type,
        grade,
        `"${p.sku}"`,
        `"${p.name}"`,
        `"${formatSpecs(p)}"`,
        p.quantity,
        p.uom,
        weight.toFixed(1),
        price.toFixed(2),
        val.toFixed(2)
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Wycena_Magazynu_Surowcow_Bluemake_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // Type filter handlers
  container.querySelector('#type-all').addEventListener('click', () => { activeTypeFilter = 'ALL'; updateFilterUI(); renderTable(); });
  container.querySelector('#type-blacha').addEventListener('click', () => { activeTypeFilter = 'BLACHA'; updateFilterUI(); renderTable(); });
  container.querySelector('#type-pret').addEventListener('click', () => { activeTypeFilter = 'PRĘT'; updateFilterUI(); renderTable(); });
  container.querySelector('#type-plaskownik').addEventListener('click', () => { activeTypeFilter = 'PŁASKOWNIK'; updateFilterUI(); renderTable(); });

  // Grade filter handlers
  container.querySelectorAll('.grade-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeGradeFilter = btn.getAttribute('data-grade');
      updateFilterUI();
      renderTable();
    });
  });

  function updateFilterUI() {
    const activeClass = 'bg-primary text-on-primary shadow-sm';
    const inactiveClass = 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest';

    container.querySelector('#type-all').className = `px-3 py-1 text-xs font-bold rounded-full ${activeTypeFilter === 'ALL' ? activeClass : inactiveClass}`;
    container.querySelector('#type-blacha').className = `px-3 py-1 text-xs font-bold rounded-full ${activeTypeFilter === 'BLACHA' ? activeClass : inactiveClass}`;
    container.querySelector('#type-pret').className = `px-3 py-1 text-xs font-bold rounded-full ${activeTypeFilter === 'PRĘT' ? activeClass : inactiveClass}`;
    container.querySelector('#type-plaskownik').className = `px-3 py-1 text-xs font-bold rounded-full ${activeTypeFilter === 'PŁASKOWNIK' ? activeClass : inactiveClass}`;
  }

  // Action listeners
  container.querySelector('#btn-fill-market').addEventListener('click', applyMarketPrices);
  container.querySelector('#btn-fill-market-sec').addEventListener('click', applyMarketPrices);

  container.querySelector('#btn-back').addEventListener('click', () => navigateTo('dashboard'));
  container.querySelector('#btn-export-excel').addEventListener('click', exportToCsv);
  container.querySelector('#btn-export-pdf').addEventListener('click', () => {
    generateRawMaterialsHtml(allProducts);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(generateRawMaterialsHtml(allProducts));
      win.document.close();
    }
  });

  container.querySelector('#nav-dash').addEventListener('click', () => navigateTo('dashboard'));
  container.querySelector('#nav-hist').addEventListener('click', () => navigateTo('history'));

  loadData();
}
