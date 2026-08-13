import { applyStockAdjustment } from '../services/odooApi.js';

export function renderProductView(container, navigateTo, product) {
  const currentProduct = product || {
    id: 101,
    sku: 'S355-FI20',
    name: 'Pręty Stalowe Okrągłe',
    quantity: 15.5,
    uom: 'm',
    location: 'Strefa 5'
  };

  let operationMode = 'CUT'; // 'CUT' (Ucięcie/Wydanie - odejmij od stanu) vs 'ADD' (Przyjęcie/Dodanie - dodaj do stanu)
  let adjustmentAmount = 0.1; // Domyślna wartość ucięcia/dodania (0.1m / 1 szt)

  function calcFinalStock() {
    const orig = Number(currentProduct.quantity);
    if (operationMode === 'CUT') {
      return Math.max(0, Number((orig - adjustmentAmount).toFixed(2)));
    } else {
      return Number((orig + adjustmentAmount).toFixed(2));
    }
  }

  container.innerHTML = `
    <!-- Header -->
    <header class="flex justify-between items-center px-margin-mobile h-touch-target-min w-full bg-surface-container border-b border-outline-variant">
      <button id="btn-back" aria-label="Go Back" class="flex items-center justify-center w-touch-target-min h-touch-target-min text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-DEFAULT active:scale-95">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">arrow_back</span>
      </button>
      <h1 class="font-headline-md text-headline-md font-bold text-primary truncate px-4">Karta Pręta</h1>
      <div class="w-touch-target-min"></div>
    </header>

    <!-- Main Content Canvas -->
    <main class="flex-grow p-margin-mobile flex flex-col md:max-w-3xl md:mx-auto md:w-full gap-stack-lg pb-10">
      <!-- Product Info Card (Level 1 Elevation) -->
      <section class="bg-surface-container-lowest border border-surface-container-highest rounded-lg overflow-hidden mt-4">
        <div class="bg-surface-container px-4 py-3 border-b border-surface-container-highest flex justify-between items-center">
          <h2 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Informacje o materiale</h2>
          <div class="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded border border-surface-container-highest">
            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></span>
            <span class="font-label-caps text-label-caps text-primary font-bold">ODOO 19</span>
          </div>
        </div>
        <div class="p-4 flex flex-col gap-stack-md">
          <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-start">
            <span class="font-label-caps text-label-caps text-on-surface-variant mt-1">SKU</span>
            <span class="font-headline-md text-headline-md text-primary bg-surface-container-low px-2 py-1 rounded w-fit border border-surface-container-highest font-mono font-bold">${currentProduct.sku}</span>
            
            <span class="font-label-caps text-label-caps text-on-surface-variant mt-1">PRODUKT</span>
            <span class="font-body-md text-body-md text-primary font-bold">${currentProduct.name}</span>

            <span class="font-label-caps text-label-caps text-on-surface-variant mt-1">LOKACJA</span>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-outline">location_on</span>
              <span class="font-body-md text-body-md text-primary font-bold">${currentProduct.location}</span>
            </div>
            
            <div class="col-span-2 h-px bg-surface-container-high my-1"></div>
            
            <span class="font-label-caps text-label-caps text-on-surface-variant self-center">OBECNY STAN</span>
            <div class="flex items-baseline gap-1">
              <span class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">${Number(currentProduct.quantity).toFixed(1)}</span>
              <span class="font-body-md text-body-md text-on-surface-variant">${currentProduct.uom}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Operation Mode Selector (Ucięcie vs Przyjęcie) -->
      <div class="grid grid-cols-2 gap-2 mt-2">
        <button id="mode-cut-btn" class="py-3 px-4 rounded font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-secondary text-on-secondary shadow-md">
          <span class="material-symbols-outlined">content_cut</span>
          UCIĘCIE / WYDANIE (-${currentProduct.uom})
        </button>
        <button id="mode-add-btn" class="py-3 px-4 rounded font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">
          <span class="material-symbols-outlined">add_circle</span>
          PRZYJĘCIE / DOSTAWA (+${currentProduct.uom})
        </button>
      </div>

      <!-- Cut/Add Form Section -->
      <section class="flex flex-col gap-stack-md">
        <div class="bg-surface-container-lowest border-2 border-primary-container rounded-lg p-5 shadow-[0_4px_0_0_#2D3436] flex flex-col items-center justify-center gap-4">
          
          <label id="mode-label" class="font-label-caps text-on-surface-variant uppercase font-bold tracking-wider text-center">
            DŁUGOŚĆ UCIĘCIA (ODEJMIJ OD STANU)
          </label>

          <!-- Main Input Controls -->
          <div class="flex items-center justify-center gap-3 w-full">
            <!-- Minus Stepper (-0.1) -->
            <button id="btn-minus" title="-0.1" aria-label="Decrease value by 0.1" class="w-14 h-14 rounded border-2 border-outline flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary hover:border-primary active:bg-surface-container-high transition-colors flex-shrink-0">
              <span class="material-symbols-outlined" style="font-size: 28px;">remove</span>
            </button>

            <!-- Main Input Field (Direct Typing like 0.1, 0.5, 12.5) -->
            <div class="relative flex items-baseline justify-center">
              <input id="val-input" class="bg-surface-container/50 rounded font-numeric-display text-numeric-display text-primary text-center w-36 border border-outline-variant focus:ring-2 focus:ring-primary py-1 px-2 font-bold" step="0.1" min="0" type="number" value="${adjustmentAmount.toFixed(1)}"/>
              <span class="font-headline-md text-headline-md text-on-surface-variant ml-2">${currentProduct.uom}</span>
            </div>

            <!-- Plus Stepper (+0.1) -->
            <button id="btn-plus" title="+0.1" aria-label="Increase value by 0.1" class="w-14 h-14 rounded border-2 border-outline flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary hover:border-primary active:bg-surface-container-high transition-colors flex-shrink-0">
              <span class="material-symbols-outlined" style="font-size: 28px;">add</span>
            </button>
          </div>

          <!-- Quick Decimal Presets (np. +0.1m, +0.5m, +1.0m, Sztanga 6m, 12m) -->
          <div class="w-full flex flex-col items-center gap-2 border-t border-outline-variant/40 pt-3">
            <span class="font-label-caps text-[11px] text-outline uppercase font-bold">Szybkie skróty (zmiana co 0.1 / 0.5 / 1.0):</span>
            <div class="flex flex-wrap justify-center gap-2">
              <button data-add="0.1" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">
                +0.1${currentProduct.uom}
              </button>
              <button data-add="0.5" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">
                +0.5${currentProduct.uom}
              </button>
              <button data-add="1.0" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">
                +1.0${currentProduct.uom}
              </button>
              <button data-set-half="true" class="preset-half-btn bg-orange-100 text-orange-900 border border-orange-300 text-xs font-mono font-bold px-3 py-1.5 rounded">
                dodaj połówkę (.5)
              </button>
              <button data-set="6.0" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">
                sztanga 6m
              </button>
              <button data-set="12.0" class="preset-btn bg-surface-container hover:bg-surface-container-high text-primary text-xs font-mono font-bold px-3 py-1.5 rounded border border-outline-variant">
                sztanga 12m
              </button>
            </div>
          </div>

          <!-- Final Calculation Preview -->
          <div class="w-full bg-surface-container-low p-3 rounded text-center border border-outline-variant/40 flex items-center justify-between px-4">
            <span class="font-label-caps text-on-surface-variant">NOWY STAN PO ZMIANIE:</span>
            <div class="flex items-baseline gap-1">
              <span id="final-preview" class="font-headline-md font-bold text-primary">${calcFinalStock()}</span>
              <span class="font-body-md text-on-surface-variant">${currentProduct.uom}</span>
            </div>
          </div>

        </div>
      </section>

      <div class="flex-grow"></div>

      <!-- Action Area -->
      <section class="mt-4 flex flex-col gap-stack-sm pb-4">
        <button id="btn-submit" class="w-full h-16 bg-[#ff6b00] hover:bg-[#e66000] text-on-error font-headline-md text-headline-md rounded flex items-center justify-center gap-2 shadow-[0_4px_0_0_#b34b00] active:translate-y-[4px] active:shadow-none transition-all duration-100 uppercase font-bold">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          ZATWIERDŹ W ODOO
        </button>
      </section>
    </main>

    <!-- Success Toast Modal -->
    <div id="toast-modal" class="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-200">
      <div class="bg-surface-container-lowest p-6 rounded-lg shadow-2xl border-2 border-primary max-w-sm w-full text-center flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl">check</span>
        </div>
        <h3 class="font-headline-md font-bold text-primary">Korekta Zapisana!</h3>
        <p id="toast-desc" class="font-body-md text-on-surface-variant">Zaktualizowano stan pręta w Odoo 19.</p>
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
    inputEl.value = Math.max(0, adjustmentAmount).toFixed(1);
    previewEl.textContent = calcFinalStock().toFixed(1);

    if (operationMode === 'CUT') {
      modeLabel.textContent = 'DŁUGOŚĆ UCIĘCIA (ODEJMIJ OD STANU)';
      modeCutBtn.className = 'py-3 px-4 rounded font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-secondary text-on-secondary shadow-md';
      modeAddBtn.className = 'py-3 px-4 rounded font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest';
    } else {
      modeLabel.textContent = 'DŁUGOŚĆ DOSTAWY (DODAJ DO STANU)';
      modeAddBtn.className = 'py-3 px-4 rounded font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 text-white shadow-md';
      modeCutBtn.className = 'py-3 px-4 rounded font-label-caps font-bold flex items-center justify-center gap-2 transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest';
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
    adjustmentAmount = Math.max(0, Number((adjustmentAmount - 0.1).toFixed(1)));
    updateUI();
  });

  plusBtn.addEventListener('click', () => {
    adjustmentAmount = Number((adjustmentAmount + 0.1).toFixed(1));
    updateUI();
  });

  inputEl.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) adjustmentAmount = Math.max(0, val);
    previewEl.textContent = calcFinalStock().toFixed(1);
  });

  // Preset button handlers
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('data-add')) {
        adjustmentAmount = Number((adjustmentAmount + parseFloat(btn.getAttribute('data-add'))).toFixed(1));
      } else if (btn.hasAttribute('data-set')) {
        adjustmentAmount = parseFloat(btn.getAttribute('data-set'));
      }
      updateUI();
    });
  });

  // Half button handler (.5m)
  container.querySelector('.preset-half-btn').addEventListener('click', () => {
    const integerPart = Math.floor(adjustmentAmount);
    adjustmentAmount = Number((integerPart + 0.5).toFixed(1));
    updateUI();
  });

  backBtn.addEventListener('click', () => navigateTo('dashboard'));

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin">sync</span>
      WYSYŁANIE DO ODOO...
    `;

    const finalStockVal = calcFinalStock();
    await applyStockAdjustment(currentProduct.id, finalStockVal, currentProduct.sku, currentProduct.quantity);

    const toast = container.querySelector('#toast-modal');
    const toastDesc = container.querySelector('#toast-desc');
    toastDesc.textContent = `Zapisano nowy stan (${finalStockVal.toFixed(1)}${currentProduct.uom}) dla pręta ${currentProduct.sku} w Odoo 19.`;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
      navigateTo('history');
    }, 1200);
  });

  updateUI();
}
