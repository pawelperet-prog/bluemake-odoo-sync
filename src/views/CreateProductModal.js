import { createNewProduct, getCategories } from '../services/odooApi.js';
import { openSingleQrLabelWindow } from '../utils/qrLabelReport.js';

/**
 * Open Multi-Tab Create Product Modal (Pręt, Płaskownik, Płaskownik - Ścinki)
 */
export async function openCreateProductModal(onCreatedCallback) {
  const existing = document.getElementById('create-prod-backdrop');
  if (existing) existing.remove();

  const categories = await getCategories();

  const categoryOptions = categories.map(c => `
    <option value="${c.id}" ${c.id === 4 ? 'selected' : ''}>${c.complete_name || c.name} (ID: ${c.id})</option>
  `).join('');

  const modalHtml = `
    <div id="create-prod-backdrop" class="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#ff6b00] text-2xl">add_box</span>
            <div>
              <h2 class="font-headline-md font-bold text-primary text-lg">Dodaj Nowy Pozycję Surowcową</h2>
              <p class="text-xs text-on-surface-variant">Wybierz typ surowca i wprowadź wymiary oraz ilość</p>
            </div>
          </div>
          <button id="close-create-btn" class="text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Tab Selector Bar -->
        <div class="flex bg-surface-container p-1 rounded-lg border border-outline-variant/40 gap-1">
          <button id="tab-rod" type="button" class="tab-btn flex-1 py-2.5 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all bg-primary text-on-primary shadow-sm">
            <span class="material-symbols-outlined text-[18px]">panorama_fish_eye</span>
            <span>1. PRĘT</span>
          </button>
          <button id="tab-flat" type="button" class="tab-btn flex-1 py-2.5 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-on-surface-variant hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-[18px]">check_box_outline_blank</span>
            <span>2. PŁASKOWNIK</span>
          </button>
          <button id="tab-scrap" type="button" class="tab-btn flex-1 py-2.5 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-on-surface-variant hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-[18px]">content_cut</span>
            <span>3. ŚCINKI</span>
          </button>
        </div>

        <!-- Form -->
        <form id="create-product-form" class="flex flex-col gap-4 font-body-md">
          
          <!-- Shared Steel Grade Selector -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container/50 p-3 rounded-lg border border-outline-variant/30">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Gatunek Stali *</label>
              <select id="steel-grade-select" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-bold text-primary">
                <option value="S355" selected>S355</option>
                <option value="S235">S235</option>
                <option value="C45">C45</option>
                <option value="42CRMO4">42CrMo4</option>
                <option value="16MNCR5">16MnCr5</option>
                <option value="CUSTOM">Inny gatunek...</option>
              </select>
            </div>
            <div id="custom-grade-wrapper" class="hidden">
              <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Wpisz Gatunek Stali *</label>
              <input id="custom-grade-input" type="text" placeholder="np. 41Cr4" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md uppercase font-bold" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Kategoria w Odoo</label>
              <select id="new-cat" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md text-on-surface">
                ${categoryOptions}
              </select>
            </div>
          </div>

          <!-- TAB 1: PRĘT (Round Bar Inputs) -->
          <div id="panel-rod" class="tab-panel flex flex-col gap-3">
            <div class="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold text-amber-900">
              <span class="material-symbols-outlined text-amber-600">info</span>
              <span>Wprowadź średnicę pręta. Długość podajesz w metrach [m] (jako ilość w Odoo).</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Średnica FI [mm] *</label>
                <input id="rod-diameter" type="number" step="1" min="1" placeholder="np. 20" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono font-bold text-lg" required />
              </div>
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Długość w (ilościach) [m] *</label>
                <input id="rod-length-meters" type="number" step="0.1" min="0.1" value="12.0" placeholder="np. 12.5" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono font-bold text-lg text-emerald-700" required />
              </div>
            </div>
          </div>

          <!-- TAB 2: PŁASKOWNIK (Flat Bar Inputs) -->
          <div id="panel-flat" class="tab-panel hidden flex flex-col gap-3">
            <div class="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold text-blue-900">
              <span class="material-symbols-outlined text-blue-600">info</span>
              <span>Wprowadź 2 wymiary przekroju. Długość podajesz w metrach [m] (jako ilość w Odoo).</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Szerokość [mm] *</label>
                <input id="flat-width" type="number" step="1" min="1" placeholder="np. 50" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono font-bold text-lg" />
              </div>
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Wysokość / Grubość [mm] *</label>
                <input id="flat-height" type="number" step="1" min="1" placeholder="np. 10" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono font-bold text-lg" />
              </div>
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Długość w (ilościach) [m] *</label>
                <input id="flat-length-meters" type="number" step="0.1" min="0.1" value="6.0" placeholder="np. 6.0" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono font-bold text-lg text-emerald-700" />
              </div>
            </div>
          </div>

          <!-- TAB 3: PŁASKOWNIK ŚCINKI (Flat Bar Scraps Inputs) -->
          <div id="panel-scrap" class="tab-panel hidden flex flex-col gap-3">
            <div class="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold text-purple-900">
              <span class="material-symbols-outlined text-purple-600">info</span>
              <span>Wprowadź 3 wymiary ścinka (Dł x Szer x Wys). Ilość podajesz w sztukach [szt].</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Długość [mm] *</label>
                <input id="scrap-length" type="number" step="1" min="1" placeholder="np. 450" class="w-full bg-surface-container border border-outline-variant rounded px-2 py-2 text-body-md font-mono font-bold" />
              </div>
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Szerokość [mm] *</label>
                <input id="scrap-width" type="number" step="1" min="1" placeholder="np. 50" class="w-full bg-surface-container border border-outline-variant rounded px-2 py-2 text-body-md font-mono font-bold" />
              </div>
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Wysokość [mm] *</label>
                <input id="scrap-height" type="number" step="1" min="1" placeholder="np. 10" class="w-full bg-surface-container border border-outline-variant rounded px-2 py-2 text-body-md font-mono font-bold" />
              </div>
              <div>
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Ilość [szt] *</label>
                <input id="scrap-qty-pcs" type="number" step="1" min="1" value="1" placeholder="np. 5" class="w-full bg-surface-container border border-outline-variant rounded px-2 py-2 text-body-md font-mono font-bold text-purple-700" />
              </div>
            </div>
          </div>

          <!-- Generated Preview Fields (Editable) -->
          <div class="border-t border-outline-variant pt-3 flex flex-col gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-1">
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Wyliczony Symbol / SKU *</label>
                <input id="generated-sku" type="text" class="w-full bg-surface-container-high border border-primary/40 rounded px-3 py-2 text-body-md font-mono font-bold uppercase text-primary" required />
              </div>
              <div class="sm:col-span-2">
                <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Pełna Nazwa Produktu w Odoo *</label>
                <input id="generated-name" type="text" class="w-full bg-surface-container-high border border-primary/40 rounded px-3 py-2 text-body-md font-bold text-on-surface" required />
              </div>
            </div>
          </div>

          <!-- Alert Banner -->
          <div id="create-msg-banner" class="hidden p-3 rounded text-sm font-bold flex items-center gap-2 mt-1"></div>

          <!-- Submit Controls -->
          <div class="flex gap-2 pt-2 border-t border-outline-variant">
            <button type="button" id="cancel-create-btn" class="flex-1 bg-surface-container-high text-primary font-label-caps py-3 rounded-lg font-bold hover:bg-surface-container-highest transition-colors">
              ANULUJ
            </button>
            <button type="submit" id="submit-create-btn" class="flex-1 bg-[#ff6b00] hover:bg-[#e66000] text-white font-label-caps py-3 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-md uppercase transition-transform active:scale-95">
              <span class="material-symbols-outlined text-[20px]">add_circle</span>
              DODAJ W ODOO
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('create-prod-backdrop');
  const closeBtn = document.getElementById('close-create-btn');
  const cancelBtn = document.getElementById('cancel-create-btn');
  const form = document.getElementById('create-product-form');
  const submitBtn = document.getElementById('submit-create-btn');
  const banner = document.getElementById('create-msg-banner');

  // Tab State: 'rod' | 'flat' | 'scrap'
  let activeTab = 'rod';

  // Elements
  const tabRod = document.getElementById('tab-rod');
  const tabFlat = document.getElementById('tab-flat');
  const tabScrap = document.getElementById('tab-scrap');

  const panelRod = document.getElementById('panel-rod');
  const panelFlat = document.getElementById('panel-flat');
  const panelScrap = document.getElementById('panel-scrap');

  const steelGradeSelect = document.getElementById('steel-grade-select');
  const customGradeWrapper = document.getElementById('custom-grade-wrapper');
  const customGradeInput = document.getElementById('custom-grade-input');

  const rodDiameter = document.getElementById('rod-diameter');
  const rodLength = document.getElementById('rod-length-meters');

  const flatWidth = document.getElementById('flat-width');
  const flatHeight = document.getElementById('flat-height');
  const flatLength = document.getElementById('flat-length-meters');

  const scrapLength = document.getElementById('scrap-length');
  const scrapWidth = document.getElementById('scrap-width');
  const scrapHeight = document.getElementById('scrap-height');
  const scrapQty = document.getElementById('scrap-qty-pcs');

  const skuInput = document.getElementById('generated-sku');
  const nameInput = document.getElementById('generated-name');

  const closeModal = () => backdrop.remove();
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Tab Switching Logic
  const setActiveTab = (tab) => {
    activeTab = tab;

    // Tab buttons styling
    const activeTabClass = 'bg-primary text-on-primary shadow-sm';
    const inactiveTabClass = 'text-on-surface-variant hover:bg-surface-container-high';

    tabRod.className = `tab-btn flex-1 py-2.5 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${tab === 'rod' ? activeTabClass : inactiveTabClass}`;
    tabFlat.className = `tab-btn flex-1 py-2.5 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${tab === 'flat' ? activeTabClass : inactiveTabClass}`;
    tabScrap.className = `tab-btn flex-1 py-2.5 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${tab === 'scrap' ? activeTabClass : inactiveTabClass}`;

    // Panels visibility
    panelRod.classList.toggle('hidden', tab !== 'rod');
    panelFlat.classList.toggle('hidden', tab !== 'flat');
    panelScrap.classList.toggle('hidden', tab !== 'scrap');

    // Toggle HTML required attribute to match current active tab
    rodDiameter.required = (tab === 'rod');
    rodLength.required = (tab === 'rod');

    flatWidth.required = (tab === 'flat');
    flatHeight.required = (tab === 'flat');
    flatLength.required = (tab === 'flat');

    scrapLength.required = (tab === 'scrap');
    scrapWidth.required = (tab === 'scrap');
    scrapHeight.required = (tab === 'scrap');
    scrapQty.required = (tab === 'scrap');

    updateGeneratedFields();
  };

  tabRod.addEventListener('click', () => setActiveTab('rod'));
  tabFlat.addEventListener('click', () => setActiveTab('flat'));
  tabScrap.addEventListener('click', () => setActiveTab('scrap'));

  // Steel grade selection handler
  steelGradeSelect.addEventListener('change', () => {
    if (steelGradeSelect.value === 'CUSTOM') {
      customGradeWrapper.classList.remove('hidden');
      customGradeInput.required = true;
    } else {
      customGradeWrapper.classList.add('hidden');
      customGradeInput.required = false;
    }
    updateGeneratedFields();
  });

  customGradeInput.addEventListener('input', updateGeneratedFields);

  function getGrade() {
    if (steelGradeSelect.value === 'CUSTOM') {
      return (customGradeInput.value.trim() || 'S355').toUpperCase();
    }
    return steelGradeSelect.value.toUpperCase();
  }

  // Auto-generate SKU & Name dynamically based on active tab and inputs
  function updateGeneratedFields() {
    const grade = getGrade();

    if (activeTab === 'rod') {
      const fi = rodDiameter.value ? rodDiameter.value.trim() : '';
      const sku = fi ? `${grade}-FI${fi}` : `${grade}-FI`;
      const name = fi ? `Pręt okrągły ${grade} FI ${fi}` : `Pręt okrągły ${grade}`;
      skuInput.value = sku;
      nameInput.value = name;
    } else if (activeTab === 'flat') {
      const w = flatWidth.value ? flatWidth.value.trim() : '';
      const h = flatHeight.value ? flatHeight.value.trim() : '';
      const dim = (w && h) ? `${w}x${h}` : '';
      const sku = dim ? `${grade}-PL${dim}` : `${grade}-PL`;
      const name = dim ? `Płaskownik ${grade} ${dim}` : `Płaskownik ${grade}`;
      skuInput.value = sku;
      nameInput.value = name;
    } else if (activeTab === 'scrap') {
      const l = scrapLength.value ? scrapLength.value.trim() : '';
      const w = scrapWidth.value ? scrapWidth.value.trim() : '';
      const h = scrapHeight.value ? scrapHeight.value.trim() : '';
      const dim = (w && h) ? `${w}x${h}` : '';
      const lenStr = l ? `-L${l}` : '';
      const sku = `${grade}-PL${dim}${lenStr}`;
      const name = `Płaskownik (ścinki) ${grade} ${dim}${l ? ' L=' + l + 'mm' : ''}`;
      skuInput.value = sku;
      nameInput.value = name;
    }
  }

  // Event Listeners for inputs
  [rodDiameter, rodLength, flatWidth, flatHeight, flatLength, scrapLength, scrapWidth, scrapHeight, scrapQty].forEach(el => {
    el.addEventListener('input', updateGeneratedFields);
  });

  // Initial calculation
  setActiveTab('rod');

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> TWORZENIE W ODOO...';

    const sku = skuInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();
    const catId = parseInt(document.getElementById('new-cat').value);

    let initialQty = 0;
    let uomName = 'm';

    if (activeTab === 'rod') {
      initialQty = parseFloat(rodLength.value) || 0;
      uomName = 'm';
    } else if (activeTab === 'flat') {
      initialQty = parseFloat(flatLength.value) || 0;
      uomName = 'm';
    } else if (activeTab === 'scrap') {
      initialQty = parseInt(scrapQty.value) || 1;
      uomName = 'szt';
    }

    const res = await createNewProduct({
      name: name,
      sku: sku,
      initialQuantity: initialQty,
      categoryId: catId,
      uomName: uomName
    });

    banner.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');

    if (res.success) {
      banner.classList.add('bg-green-100', 'text-green-800');
      banner.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-green-600 text-xl">check_circle</span>
            <span>Utworzono <strong>${sku}</strong> (${initialQty} ${uomName})! ID Odoo: <strong>${res.productId || 'NOWY'}</strong></span>
          </div>
          <button type="button" id="btn-print-new-qr" class="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm uppercase flex-shrink-0">
            <span class="material-symbols-outlined text-[15px]">qr_code_2</span> DRUKUJ QR
          </button>
        </div>
      `;

      const newProdObj = {
        id: res.productId || Date.now(),
        sku: sku,
        name: name,
        quantity: initialQty,
        uom: uomName,
        categoryName: 'Surowiec'
      };

      const printNewBtn = banner.querySelector('#btn-print-new-qr');
      if (printNewBtn) {
        printNewBtn.addEventListener('click', () => {
          openSingleQrLabelWindow(newProdObj);
        });
      }

      setTimeout(() => {
        closeModal();
        if (onCreatedCallback) onCreatedCallback();
      }, 3500);
    } else {
      banner.classList.add('bg-red-100', 'text-red-800');
      banner.innerHTML = `<span class="material-symbols-outlined text-red-600">error</span> Błąd dodawania: ${res.error}`;
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">add_circle</span> DODAJ W ODOO';
    }
  });
}
