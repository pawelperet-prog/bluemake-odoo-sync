import * as pdfjsLib from 'pdfjs-dist';
import { applyStockAdjustment, getProductAttachments, getAttachmentData, updateProductDescription, RAW_LOCATIONS, PRODUCT_LOCATIONS } from '../services/odooApi.js';
import { openSingleQrLabelWindow } from '../utils/qrLabelReport.js';
import { openLowStockAlertModal } from './LowStockModal.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export function renderProductView(container, navigateTo, product) {
  const currentProduct = product || {
    id: 101,
    sku: 'S355-FI20',
    name: 'Pręty Stalowe Okrągłe',
    quantity: 15.5,
    uom: 'm',
    location: '01 - Magazyn',
    categoryId: 4
  };

  const isFinishedGood = currentProduct.categoryId === 5 || currentProduct.isFinishedProduct || currentProduct.uom === 'szt';
  const isLowInitial = Number(currentProduct.quantity) < (isFinishedGood ? 2.0 : 5.0);

  let operationMode = 'CUT'; // 'CUT' (Wydanie/Ucięcie) vs 'ADD' (Przyjęcie/Dostawa)
  let adjustmentAmount = isFinishedGood ? 1 : 0.1;

  // Znane półfabrykaty (np. dla 00434 Półksiężyc)
  let initialRawMaterial = '';
  if (currentProduct.sku === '00434' || currentProduct.name?.toLowerCase().includes('księżyc')) {
    initialRawMaterial = '20x70x115';
  } else if (currentProduct.description && currentProduct.description.includes('Półfabrykat:')) {
    const match = currentProduct.description.match(/Półfabrykat:\s*([^\n\r]+)/i);
    if (match) initialRawMaterial = match[1].trim();
  }

  function calcFinalStock() {
    const orig = Number(currentProduct.quantity);
    if (operationMode === 'CUT') {
      return Math.max(0, Number((orig - adjustmentAmount).toFixed(isFinishedGood ? 0 : 2)));
    } else {
      return Number((orig + adjustmentAmount).toFixed(isFinishedGood ? 0 : 2));
    }
  }

  container.innerHTML = `
    <!-- Header -->
    <header class="flex justify-between items-center px-4 h-14 w-full bg-surface-container border-b border-outline-variant sticky top-0 z-40 shadow-sm">
      <button id="btn-back" aria-label="Go Back" class="flex items-center gap-1.5 text-primary font-bold text-sm bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-lg px-3 py-1.5 active:scale-95">
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        <span>WRÓĆ</span>
      </button>
      <h1 class="font-headline-md text-headline-md font-bold text-primary truncate px-2">
        ${isFinishedGood ? 'Karta Detalu / Wyrobu' : 'Karta Surowca / Pręta'}
      </h1>
      <div class="flex items-center gap-1">
        <span class="text-xs font-bold px-2 py-1 rounded ${isFinishedGood ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}">
          ${isFinishedGood ? 'DETAL' : 'SUROWIEC'}
        </span>
      </div>
    </header>

    <!-- Main Content Canvas -->
    <main class="flex-grow p-margin-mobile flex flex-col md:max-w-3xl md:mx-auto md:w-full gap-stack-lg pb-14">
      
      <!-- Low Stock Warning Banner -->
      ${isLowInitial ? `
        <div class="bg-rose-50 border-2 border-rose-500 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm mt-3 animate-pulse">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="material-symbols-outlined text-rose-600 text-2xl flex-shrink-0">warning</span>
            <div>
              <div class="font-bold text-rose-900 text-xs uppercase tracking-wide">Niski stan magazynowy</div>
              <div class="text-xs text-rose-700">Pozostało: <b>${isFinishedGood ? Math.round(currentProduct.quantity) : Number(currentProduct.quantity).toFixed(1)} ${currentProduct.uom}</b></div>
            </div>
          </div>
          <button id="btn-trigger-low-stock-alert" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 shadow-md uppercase transition-transform active:scale-95 flex-shrink-0">
            <span class="material-symbols-outlined text-[16px]">campaign</span>
            <span>ZGŁOŚ BRAK</span>
          </button>
        </div>
      ` : ''}

      <!-- Product Info Card -->
      <section class="bg-surface-container-lowest border border-surface-container-highest rounded-lg overflow-hidden ${isLowInitial ? 'mt-1' : 'mt-3'} shadow-sm">
        <div class="bg-surface-container px-4 py-3 border-b border-surface-container-highest flex justify-between items-center">
          <h2 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
            ${isFinishedGood ? 'Specyfikacja detalu' : 'Informacje o materiale'}
          </h2>
          <div class="flex items-center gap-2">
            <button id="btn-print-this-qr" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 text-white font-label-caps px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm uppercase">
              <span class="material-symbols-outlined text-[16px]">print</span>
              <span>ETYKIETA ZEBRA (50x30)</span>
            </button>
          </div>
        </div>
        <div class="p-4 flex flex-col gap-3">
          <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 items-start">
            <span class="font-label-caps text-label-caps text-on-surface-variant mt-1">KOD SKU</span>
            <span class="font-headline-md text-headline-md text-primary bg-surface-container-low px-2.5 py-1 rounded w-fit border border-surface-container-highest font-mono font-bold">${currentProduct.sku}</span>
            
            <span class="font-label-caps text-label-caps text-on-surface-variant mt-1">NAZWA</span>
            <span class="font-body-md text-body-md text-primary font-bold leading-snug">${currentProduct.name}</span>

            <span class="font-label-caps text-label-caps text-on-surface-variant mt-1">LOKACJA</span>
            <div class="flex items-center gap-2">
              <select id="location-select" class="bg-surface-container-high text-primary font-bold text-xs rounded-lg px-2.5 py-1.5 border border-outline-variant focus:ring-2 focus:ring-primary">
                ${(isFinishedGood ? PRODUCT_LOCATIONS : RAW_LOCATIONS).map(loc => `
                  <option value="${loc.id}" ${currentProduct.locationId === loc.id || (currentProduct.location && currentProduct.location.includes(loc.name)) ? 'selected' : ''}>
                    ${loc.name}
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="col-span-2 h-px bg-surface-container-high my-0.5"></div>
            
            <span class="font-label-caps text-label-caps text-on-surface-variant self-center font-bold">STAN MAGAZYNOWY</span>
            <div class="flex items-baseline gap-1">
              <span class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">${isFinishedGood ? Math.round(currentProduct.quantity) : Number(currentProduct.quantity).toFixed(1)}</span>
              <span class="font-body-md text-body-md text-on-surface-variant font-bold">${currentProduct.uom}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Technical Drawing Section (Tylko dla Detali / Wyrobów Gotowych) -->
      ${isFinishedGood ? `
        <section id="pdf-drawing-card" class="bg-surface-container-lowest border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm">
          <div class="bg-indigo-50/70 px-4 py-2.5 border-b border-indigo-100 flex justify-between items-center">
            <div class="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <span class="material-symbols-outlined text-indigo-700 text-[20px]">description</span>
              <span>Rysunek Techniczny PDF (Odoo)</span>
            </div>
            <span id="pdf-status-badge" class="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-200/70 text-indigo-900">
              Szukam PDF...
            </span>
          </div>

          <div class="p-4 flex flex-col gap-3">
            <div id="pdf-info-container" class="flex items-center justify-between gap-3 min-w-0">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-11 h-11 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 font-bold shadow-inner">
                  <span class="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                </div>
                <div class="min-w-0">
                  <div id="pdf-filename" class="font-bold text-sm text-primary truncate">Sprawdzanie załącznika...</div>
                  <div id="pdf-filesize" class="text-xs text-on-surface-variant">Baza rysunków technicznych Odoo</div>
                </div>
              </div>
            </div>

            <!-- Action button for safe in-app drawing preview -->
            <div id="pdf-actions" class="mt-1 hidden">
              <button id="btn-view-pdf" class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all uppercase">
                <span class="material-symbols-outlined text-[20px]">visibility</span>
                <span>PODGLĄD RYSUNKU (BEZ POBIERANIA)</span>
              </button>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Required Semi-Finished Material & Tech Notes (Tylko dla Detali) -->
      ${isFinishedGood ? `
        <section class="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
          <div class="flex justify-between items-center">
            <label class="font-label-caps text-xs text-on-surface-variant font-bold uppercase flex items-center gap-1">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">straighten</span>
              <span>Wymagany Półfabrykat / Materiał wyjściowy:</span>
            </label>
            <button id="btn-save-note" class="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[15px]">save</span>
              <span>ZAPISZ</span>
            </button>
          </div>
          <div class="flex gap-2">
            <input id="input-raw-spec" type="text" placeholder="np. 20x70x115 (półfabrykat)" value="${initialRawMaterial}" class="w-full bg-surface-container-high text-primary font-bold font-mono text-sm px-3 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary"/>
          </div>
          <p class="text-[11px] text-on-surface-variant">Wpisz gabaryty surowca wymaganego do wykonania tego detalu.</p>
        </section>
      ` : ''}

      <!-- Operation Mode Selector (Wydanie vs Przyjęcie) -->
      <div class="grid grid-cols-2 gap-2 mt-1">
        <button id="mode-cut-btn" class="py-3 px-4 rounded-xl font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-secondary text-on-secondary shadow-md text-xs sm:text-sm">
          <span class="material-symbols-outlined text-[20px]">${isFinishedGood ? 'output' : 'content_cut'}</span>
          <span>${isFinishedGood ? 'WYDANIE (-szt)' : `UCIĘCIE (-${currentProduct.uom})`}</span>
        </button>
        <button id="mode-add-btn" class="py-3 px-4 rounded-xl font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest text-xs sm:text-sm">
          <span class="material-symbols-outlined text-[20px]">add_circle</span>
          <span>${isFinishedGood ? 'PRZYJĘCIE (+szt)' : `DOSTAWA (+${currentProduct.uom})`}</span>
        </button>
      </div>

      <!-- Cut/Add Form Section -->
      <section class="flex flex-col gap-stack-md">
        <div class="bg-surface-container-lowest border-2 border-primary-container rounded-xl p-5 shadow-[0_4px_0_0_#2D3436] flex flex-col items-center justify-center gap-4">
          
          <label id="mode-label" class="font-label-caps text-on-surface-variant uppercase font-bold tracking-wider text-center text-xs sm:text-sm">
            ${isFinishedGood ? 'LICZBA SZTUK DO WYDANIA' : 'DŁUGOŚĆ UCIĘCIA (ODEJMIJ OD STANU)'}
          </label>

          <!-- Main Input Controls -->
          <div class="flex items-center justify-center gap-3 w-full">
            <!-- Minus Stepper -->
            <button id="btn-minus" title="Zmniejsz" class="w-14 h-14 rounded-xl border-2 border-outline flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary hover:border-primary active:bg-surface-container-high transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-[28px]">remove</span>
            </button>

            <!-- Main Input Field -->
            <div class="relative flex items-baseline justify-center">
              <input id="val-input" class="bg-surface-container/50 rounded-xl font-numeric-display text-numeric-display text-primary text-center w-36 border border-outline-variant focus:ring-2 focus:ring-primary py-1.5 px-2 font-bold" step="${isFinishedGood ? '1' : '0.1'}" min="0" type="number" value="${isFinishedGood ? adjustmentAmount : adjustmentAmount.toFixed(1)}"/>
              <span class="font-headline-md text-headline-md text-on-surface-variant ml-2 font-bold">${currentProduct.uom}</span>
            </div>

            <!-- Plus Stepper -->
            <button id="btn-plus" title="Zwiększ" class="w-14 h-14 rounded-xl border-2 border-outline flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary hover:border-primary active:bg-surface-container-high transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>

          <!-- Quick Presets for Finished Goods vs Raw Materials -->
          <div class="w-full flex flex-col items-center gap-2 border-t border-outline-variant/40 pt-3">
            <span class="font-label-caps text-[11px] text-outline uppercase font-bold">
              ${isFinishedGood ? 'Szybkie skróty ilości sztuk:' : 'Szybkie skróty długości (0.1 / 0.5 / 1.0):'}
            </span>
            <div class="flex flex-wrap justify-center gap-2">
              ${isFinishedGood ? `
                <button data-add="1" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg border border-outline-variant">+1 szt</button>
                <button data-add="5" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg border border-outline-variant">+5 szt</button>
                <button data-add="10" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg border border-outline-variant">+10 szt</button>
                <button data-add="50" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg border border-outline-variant">+50 szt</button>
              ` : `
                <button data-add="0.1" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">+0.1m</button>
                <button data-add="0.5" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">+0.5m</button>
                <button data-add="1.0" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">+1.0m</button>
                <button data-set-half="true" class="preset-half-btn bg-orange-100 text-orange-900 border border-orange-300 text-xs font-mono font-bold px-3 py-1.5 rounded">dodaj połówkę (.5)</button>
                <button data-set="6.0" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">sztanga 6m</button>
                <button data-set="12.0" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">sztanga 12m</button>
              `}
            </div>
          </div>

          <!-- Final Calculation Preview -->
          <div class="w-full bg-surface-container-low p-3 rounded-lg text-center border border-outline-variant/40 flex items-center justify-between px-4">
            <span class="font-label-caps text-on-surface-variant font-bold text-xs">NOWY STAN PO ZMIANIE:</span>
            <div class="flex items-baseline gap-1">
              <span id="final-preview" class="font-headline-md font-bold text-primary">${calcFinalStock()}</span>
              <span class="font-body-md text-on-surface-variant font-bold">${currentProduct.uom}</span>
            </div>
          </div>

        </div>
      </section>

      <!-- Action Area -->
      <section class="mt-2 flex flex-col gap-stack-sm pb-4">
        <button id="btn-submit" class="w-full h-16 bg-[#ff6b00] hover:bg-[#e66000] text-white font-headline-md text-headline-md rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_0_0_#b34b00] active:translate-y-[4px] active:shadow-none transition-all duration-100 uppercase font-bold text-base sm:text-lg">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          ZATWIERDŹ ZMIANĘ W ODOO
        </button>
      </section>
    </main>

    <!-- PDF Canvas In-App Modal (100% Czysty Canvas bez pasków przeglądarki i pobierania) -->
    <div id="pdf-viewer-modal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 p-1 sm:p-3 hidden flex-col justify-center items-center">
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border-2 border-primary w-full h-full flex flex-col mx-auto overflow-hidden">
        <!-- Modal Header Controls -->
        <div class="flex flex-wrap justify-between items-center px-4 py-2.5 bg-surface-container border-b border-outline-variant gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-indigo-600 text-[22px]">draw</span>
            <span id="modal-pdf-title" class="font-bold text-primary text-sm truncate">Rysunek techniczny</span>
            <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0">POUFNE • TYLKO DO WGLĄDU</span>
          </div>
          <div class="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <!-- Zoom & Rotate Controls -->
            <button id="btn-pdf-zoom-out" class="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-primary font-bold active:scale-95 transition-all shadow-sm" title="Pomniejsz (-)">
              <span class="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <button id="btn-pdf-zoom-fit" class="px-2.5 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-primary font-bold text-xs active:scale-95 transition-all shadow-sm" title="Dopasuj do ekranu">
              DOPASUJ
            </button>
            <button id="btn-pdf-zoom-in" class="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-primary font-bold active:scale-95 transition-all shadow-sm" title="Powiększ (+)">
              <span class="material-symbols-outlined text-[18px]">add</span>
            </button>
            <button id="btn-pdf-rotate" class="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-primary font-bold active:scale-95 transition-all shadow-sm ml-1" title="Obróć o 90°">
              <span class="material-symbols-outlined text-[18px]">rotate_right</span>
            </button>
            <button id="btn-close-pdf-modal" class="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3 h-8 rounded-lg font-bold text-xs active:scale-95 transition-all shadow-sm ml-2">
              <span class="material-symbols-outlined text-[18px]">close</span>
              <span>ZAMKNIJ</span>
            </button>
          </div>
        </div>
        <!-- Pure Canvas Render Surface (Bez żadnych pasków Chroma) -->
        <div id="pdf-canvas-container" class="flex-1 bg-neutral-900 overflow-auto flex items-center justify-center p-2 sm:p-4 select-none relative">
          <canvas id="pdf-canvas" class="shadow-2xl rounded max-w-none transition-transform"></canvas>
        </div>
      </div>
    </div>

    <!-- Success Toast Modal -->
    <div id="toast-modal" class="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-200">
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-2xl border-2 border-primary max-w-sm w-full text-center flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl">check</span>
        </div>
        <h3 class="font-headline-md font-bold text-primary">Korekta Zapisana!</h3>
        <p id="toast-desc" class="font-body-md text-on-surface-variant">Zaktualizowano stan w Odoo 19.</p>
      </div>
    </div>
  `;

  const inputEl = container.querySelector('#val-input');
  const minusBtn = container.querySelector('#btn-minus');
  const plusBtn = container.querySelector('#btn-plus');
  const submitBtn = container.querySelector('#btn-submit');
  const backBtn = container.querySelector('#btn-back');
  const previewEl = container.querySelector('#final-preview');

  const modeCutBtn = container.querySelector('#mode-cut-btn');
  const modeAddBtn = container.querySelector('#mode-add-btn');
  const modeLabel = container.querySelector('#mode-label');

  const updateUI = () => {
    inputEl.value = isFinishedGood ? Math.max(0, adjustmentAmount) : Math.max(0, adjustmentAmount).toFixed(1);
    previewEl.textContent = calcFinalStock();

    if (operationMode === 'CUT') {
      modeLabel.textContent = isFinishedGood ? 'LICZBA SZTUK DO WYDANIA (ODEJMIJ OD STANU)' : 'DŁUGOŚĆ UCIĘCIA (ODEJMIJ OD STANU)';
      modeCutBtn.className = 'py-3 px-4 rounded-xl font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-secondary text-on-secondary shadow-md text-xs sm:text-sm';
      modeAddBtn.className = 'py-3 px-4 rounded-xl font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest text-xs sm:text-sm';
    } else {
      modeLabel.textContent = isFinishedGood ? 'LICZBA SZTUK DO PRZYJĘCIA (DODAJ DO STANU)' : 'DŁUGOŚĆ DOSTAWY (DODAJ DO STANU)';
      modeAddBtn.className = 'py-3 px-4 rounded-xl font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 text-white shadow-md text-xs sm:text-sm';
      modeCutBtn.className = 'py-3 px-4 rounded-xl font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest text-xs sm:text-sm';
    }
  };

  modeCutBtn.addEventListener('click', () => {
    operationMode = 'CUT';
    updateUI();
  });

  modeAddBtn.addEventListener('click', () => {
    operationMode = 'ADD';
    updateUI();
  });

  minusBtn.addEventListener('click', () => {
    const step = isFinishedGood ? 1 : 0.1;
    adjustmentAmount = Math.max(0, Number((adjustmentAmount - step).toFixed(isFinishedGood ? 0 : 1)));
    updateUI();
  });

  plusBtn.addEventListener('click', () => {
    const step = isFinishedGood ? 1 : 0.1;
    adjustmentAmount = Number((adjustmentAmount + step).toFixed(isFinishedGood ? 0 : 1));
    updateUI();
  });

  inputEl.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) adjustmentAmount = Math.max(0, isFinishedGood ? Math.round(val) : val);
    previewEl.textContent = calcFinalStock();
  });

  // Presets
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('data-add')) {
        const addVal = parseFloat(btn.getAttribute('data-add'));
        adjustmentAmount = Number((adjustmentAmount + addVal).toFixed(isFinishedGood ? 0 : 1));
      } else if (btn.hasAttribute('data-set')) {
        adjustmentAmount = parseFloat(btn.getAttribute('data-set'));
      }
      updateUI();
    });
  });

  // Half button handler (.5m)
  const halfBtn = container.querySelector('.preset-half-btn');
  if (halfBtn) {
    halfBtn.addEventListener('click', () => {
      const integerPart = Math.floor(adjustmentAmount);
      adjustmentAmount = Number((integerPart + 0.5).toFixed(1));
      updateUI();
    });
  }

  // PDF Fetching & Preview Logic (Tylko dla Detali / Wyrobów)
  let activePdfAttachment = null;
  let activeBlobUrl = null;

  if (isFinishedGood) {
    const pdfStatusBadge = container.querySelector('#pdf-status-badge');
    const pdfFilename = container.querySelector('#pdf-filename');
    const pdfFilesize = container.querySelector('#pdf-filesize');
    const pdfActions = container.querySelector('#pdf-actions');
    const btnViewPdf = container.querySelector('#btn-view-pdf');
    const btnDownloadPdf = container.querySelector('#btn-download-pdf');

    const pdfModal = container.querySelector('#pdf-viewer-modal');
    const pdfIframe = container.querySelector('#pdf-iframe');
    const modalTitle = container.querySelector('#modal-pdf-title');
    const btnCloseModal = container.querySelector('#btn-close-pdf-modal');
    const btnModalPrint = container.querySelector('#btn-modal-print-pdf');

    getProductAttachments(currentProduct.id, currentProduct.templateId, currentProduct.sku).then(attachments => {
      if (attachments && attachments.length > 0) {
        activePdfAttachment = attachments[0];
        pdfStatusBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300';
        pdfStatusBadge.textContent = 'Dostępny PDF';
        pdfFilename.textContent = activePdfAttachment.name;
        const sizeKb = activePdfAttachment.file_size ? `${Math.round(activePdfAttachment.file_size / 1024)} KB` : '';
        pdfFilesize.textContent = `Plik PDF w Odoo ${sizeKb ? `(${sizeKb})` : ''} z kodem QR`;
        pdfActions.classList.remove('hidden');
      } else {
        pdfStatusBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-neutral-200 text-neutral-700';
        pdfStatusBadge.textContent = 'Brak PDF';
        pdfFilename.textContent = 'Brak rysunku technicznego w Odoo';
        pdfFilesize.textContent = 'Możesz dodać plik PDF bezpośrednio w systemie Odoo.';
      }
    }).catch(err => {
      pdfStatusBadge.textContent = 'Błąd pobierania';
    });

    let currentPdfDoc = null;
    let currentScale = 1.0;
    let currentRotation = 0;
    let cachedPdfBytes = null;

    const canvasEl = container.querySelector('#pdf-canvas');
    const canvasContainer = container.querySelector('#pdf-canvas-container');
    const btnZoomIn = container.querySelector('#btn-pdf-zoom-in');
    const btnZoomOut = container.querySelector('#btn-pdf-zoom-out');
    const btnZoomFit = container.querySelector('#btn-pdf-zoom-fit');
    const btnRotate = container.querySelector('#btn-pdf-rotate');

    async function loadPdfDoc() {
      if (currentPdfDoc) return currentPdfDoc;
      const attData = await getAttachmentData(activePdfAttachment.id);
      const byteCharacters = atob(attData.datas);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      cachedPdfBytes = new Uint8Array(byteNumbers);
      const loadingTask = pdfjsLib.getDocument({ data: cachedPdfBytes });
      currentPdfDoc = await loadingTask.promise;
      return currentPdfDoc;
    }

    async function renderCanvasPage() {
      if (!currentPdfDoc || !canvasEl || !canvasContainer) return;
      try {
        const page = await currentPdfDoc.getPage(1);
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation: currentRotation });
        
        const containerW = Math.max(300, canvasContainer.clientWidth - 24);
        const containerH = Math.max(300, canvasContainer.clientHeight - 24);
        
        const fitScale = Math.min(containerW / unscaledViewport.width, containerH / unscaledViewport.height);
        const renderScale = (fitScale > 0 ? fitScale : 1.0) * currentScale;
        const dpr = window.devicePixelRatio || 1.5;

        const viewport = page.getViewport({ scale: renderScale * dpr, rotation: currentRotation });
        
        canvasEl.width = viewport.width;
        canvasEl.height = viewport.height;
        canvasEl.style.width = `${viewport.width / dpr}px`;
        canvasEl.style.height = `${viewport.height / dpr}px`;

        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.warn('Canvas render error:', err);
      }
    }

    const showPdfModal = () => {
      pdfModal.classList.remove('hidden');
      pdfModal.classList.add('flex');
    };

    const hidePdfModal = () => {
      pdfModal.classList.add('hidden');
      pdfModal.classList.remove('flex');
      if (canvasEl) {
        const ctx = canvasEl.getContext('2d');
        ctx?.clearRect(0, 0, canvasEl.width, canvasEl.height);
      }
    };

    if (btnViewPdf) {
      btnViewPdf.addEventListener('click', async () => {
        btnViewPdf.disabled = true;
        btnViewPdf.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span><span>ŁADOWANIE RYSUNKU...</span>`;
        try {
          await loadPdfDoc();
          modalTitle.textContent = activePdfAttachment.name;
          currentScale = 1.0;
          currentRotation = 0;
          showPdfModal();
          setTimeout(() => renderCanvasPage(), 60);
        } catch (e) {
          alert('Nie udało się otworzyć rysunku PDF: ' + e.message);
        } finally {
          btnViewPdf.disabled = false;
          btnViewPdf.innerHTML = `<span class="material-symbols-outlined text-[20px]">visibility</span><span>PODGLĄD RYSUNKU (BEZ POBIERANIA)</span>`;
        }
      });
    }

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        currentScale = Math.min(4.0, currentScale + 0.25);
        renderCanvasPage();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        currentScale = Math.max(0.5, currentScale - 0.25);
        renderCanvasPage();
      });
    }

    if (btnZoomFit) {
      btnZoomFit.addEventListener('click', () => {
        currentScale = 1.0;
        renderCanvasPage();
      });
    }

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        currentRotation = (currentRotation + 90) % 360;
        renderCanvasPage();
      });
    }

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', hidePdfModal);
    }

    pdfModal.addEventListener('click', (e) => {
      if (e.target === pdfModal) hidePdfModal();
    });

    // Save Raw Spec Note
    const btnSaveNote = container.querySelector('#btn-save-note');
    const inputRawSpec = container.querySelector('#input-raw-spec');
    if (btnSaveNote && inputRawSpec) {
      btnSaveNote.addEventListener('click', async () => {
        const specVal = inputRawSpec.value.trim();
        btnSaveNote.disabled = true;
        btnSaveNote.innerHTML = `<span class="material-symbols-outlined animate-spin text-[14px]">sync</span>`;
        try {
          const updatedNote = `Półfabrykat: ${specVal}`;
          await updateProductDescription(currentProduct.id, currentProduct.templateId, updatedNote);
          btnSaveNote.innerHTML = `<span class="material-symbols-outlined text-emerald-600 text-[14px]">check</span><span>ZAPISANO</span>`;
          setTimeout(() => {
            btnSaveNote.innerHTML = `<span class="material-symbols-outlined text-[15px]">save</span><span>ZAPISZ</span>`;
            btnSaveNote.disabled = false;
          }, 2000);
        } catch (e) {
          alert('Błąd zapisu notatki: ' + e.message);
          btnSaveNote.disabled = false;
        }
      });
    }
  }

  const printQrBtn = container.querySelector('#btn-print-this-qr');
  if (printQrBtn) {
    printQrBtn.addEventListener('click', () => {
      openSingleQrLabelWindow(currentProduct);
    });
  }

  const alertTriggerBtn = container.querySelector('#btn-trigger-low-stock-alert');
  if (alertTriggerBtn) {
    alertTriggerBtn.addEventListener('click', () => {
      openLowStockAlertModal(currentProduct);
    });
  }

  backBtn.addEventListener('click', () => navigateTo('dashboard'));

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin">sync</span>
      WYSYŁANIE DO ODOO...
    `;

    const finalStockVal = calcFinalStock();
    const locSelect = container.querySelector('#location-select');
    const selectedLocationId = locSelect ? Number(locSelect.value) : (currentProduct.locationId || 5);
    const selectedLocationName = locSelect ? locSelect.options[locSelect.selectedIndex]?.text : currentProduct.location;

    await applyStockAdjustment(currentProduct.id, finalStockVal, currentProduct.sku, currentProduct.quantity, selectedLocationId);

    const toast = container.querySelector('#toast-modal');
    const toastDesc = container.querySelector('#toast-desc');
    toastDesc.textContent = `Zapisano nowy stan (${finalStockVal} ${currentProduct.uom}) w Odoo 19 (${selectedLocationName}).`;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
      if (finalStockVal < (isFinishedGood ? 2.0 : 5.0) && operationMode === 'CUT') {
        toast.classList.add('opacity-0', 'pointer-events-none');
        openLowStockAlertModal({
          ...currentProduct,
          quantity: finalStockVal
        }, () => {
          navigateTo('history');
        });
      } else {
        navigateTo('history');
      }
    }, 1200);
  });

  updateUI();
}
