import { getSoftJaws, saveJawsRecord, deleteJawsRecord, getJawsById } from '../services/jawStorageService.js';
import { getProducts } from '../services/odooApi.js';
import { getCurrentOperator, isAdmin } from '../services/authService.js';
import { printJawLabelHtml } from '../utils/jawLabelGenerator.js';

/**
 * CNC Soft Jaws Management View (Szczęki Miękkie SZ-[SKU])
 */
export function renderSoftJawsView(container, navigateTo, initialJawId = null) {
  let jawsList = getSoftJaws();
  let searchQuery = '';
  let activeStatusFilter = 'ALL'; // 'ALL' | 'READY' | 'IN_USE' | 'TO_MAKE'
  let allProducts = [];
  let currentEditingJaw = null;
  let isModalOpen = false;

  const currentOp = getCurrentOperator();
  const isOpAdmin = isAdmin(currentOp);

  async function loadInitialData() {
    try {
      allProducts = await getProducts();
    } catch (e) {
      console.warn('Could not load Odoo products:', e);
    }
    jawsList = getSoftJaws();

    if (initialJawId) {
      const found = getJawsById(initialJawId);
      if (found) {
        openEditModal(found);
      }
    }
    render();
  }

  function getFilteredJaws() {
    return jawsList.filter(j => {
      const matchesStatus = activeStatusFilter === 'ALL' || j.status === activeStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        j.id.toLowerCase().includes(q) ||
        (j.productSku && j.productSku.toLowerCase().includes(q)) ||
        (j.productName && j.productName.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.viseType && j.viseType.toLowerCase().includes(q)) ||
        (j.notes && j.notes.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }

  function render() {
    const filtered = getFilteredJaws();

    container.innerHTML = `
      <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
        
        <!-- Header -->
        <header class="fixed top-0 left-0 w-full z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-4">
          <div class="flex items-center gap-3">
            <button id="btn-back-dashboard" class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div>
              <h1 class="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-400">precision_manufacturing</span>
                SZCZĘKI MIĘKKIE CNC
              </h1>
              <p class="text-[11px] text-slate-400 font-bold">Baza Oprzyrządowania i Mocowań (Format: SZ-[SKU])</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-add-jaw" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95">
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              <span class="hidden sm:inline">DODAJ SZCZĘKI</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full max-w-7xl mx-auto px-4 mt-20 flex flex-col gap-4 flex-1">
          
          <!-- Search & Filter Controls -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="relative w-full sm:flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input id="jaw-search-input" type="text" value="${searchQuery}" placeholder="Szukaj po kodzie SZ-00329, SKU, nazwie detalu lub szafie..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white placeholder:text-slate-500 focus:border-blue-500 outline-none" />
            </div>

            <!-- Status Filter Pills -->
            <div class="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              ${[
                { id: 'ALL', label: 'Wszystkie', count: jawsList.length },
                { id: 'READY', label: '🟢 Gotowe', count: jawsList.filter(j => j.status === 'READY').length },
                { id: 'IN_USE', label: '🔵 W maszynie', count: jawsList.filter(j => j.status === 'IN_USE').length },
                { id: 'TO_MAKE', label: '🟡 Do zrobienia', count: jawsList.filter(j => j.status === 'TO_MAKE').length }
              ].map(f => `
                <button type="button" class="btn-filter-status px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeStatusFilter === f.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}" data-status="${f.id}">
                  ${f.label} (${f.count})
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Jaws Cards Grid -->
          ${filtered.length === 0 ? `
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
              <div class="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 class="text-base font-bold text-slate-300">Brak zarejestrowanych szczęk</h3>
              <p class="text-xs text-slate-500 max-w-sm">Nie znaleziono szczęk miękkich spełniających kryteria. Kliknij poniżej, aby przypisać pierwsze szczęki do detalu.</p>
              <button id="btn-empty-add" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 mt-2">
                <span class="material-symbols-outlined text-[18px]">add</span>
                DODAJ SZCZĘKI (SZ-[SKU])
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${filtered.map(jaw => renderJawCard(jaw)).join('')}
            </div>
          `}

        </main>

        <!-- Edit / Add Modal Container -->
        <div id="jaw-modal-container"></div>

      </div>
    `;

    bindEvents();
  }

  function renderJawCard(jaw) {
    const statusMap = {
      READY: { label: 'GOTOWE NA PÓŁCE', color: 'bg-emerald-950/80 border-emerald-700 text-emerald-400', icon: 'check_circle' },
      IN_USE: { label: 'W MASZYNIE (CNC)', color: 'bg-blue-950/80 border-blue-700 text-blue-400', icon: 'precision_manufacturing' },
      TO_MAKE: { label: 'DO WYKONANIA', color: 'bg-amber-950/80 border-amber-700 text-amber-400', icon: 'build' }
    };
    const curStatus = statusMap[jaw.status] || statusMap.READY;

    return `
      <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all">
        
        <!-- Card Top & Image -->
        <div>
          <div class="relative h-40 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
            ${jaw.photo ? `
              <img src="${jaw.photo}" alt="${jaw.id}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" onclick="window.open('${jaw.photo}', '_blank')" />
            ` : `
              <div class="flex flex-col items-center text-slate-600 gap-1">
                <span class="material-symbols-outlined text-5xl">hardware</span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Brak zdjęcia szczęk</span>
              </div>
            `}
            
            <!-- Jaw Code Badge -->
            <div class="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md border border-blue-500/50 text-blue-400 font-mono font-black text-sm px-2.5 py-1 rounded-xl shadow-md">
              ${jaw.id}
            </div>

            <!-- Status Badge -->
            <div class="absolute top-2.5 right-2.5 border px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${curStatus.color} shadow-md">
              <span class="material-symbols-outlined text-[12px]">${curStatus.icon}</span>
              <span>${curStatus.label}</span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 flex flex-col gap-2.5">
            <!-- Product Ref -->
            <div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-blue-400">tag</span>
                Detal: <strong class="text-white font-mono text-xs">${jaw.productSku || 'Brak SKU'}</strong>
              </div>
              <h3 class="text-sm font-bold text-white line-clamp-1 mt-0.5" title="${jaw.productName}">${jaw.productName}</h3>
            </div>

            <!-- Technical details -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex flex-col">
                <span class="text-[9px] font-bold text-slate-500 uppercase">Operacja</span>
                <span class="font-bold text-slate-200 truncate" title="${jaw.operation}">⚙️ ${jaw.operation}</span>
              </div>
              <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex flex-col">
                <span class="text-[9px] font-bold text-slate-500 uppercase">Imadło</span>
                <span class="font-bold text-slate-200 truncate" title="${jaw.viseType}">🗜️ ${jaw.viseType}</span>
              </div>
            </div>

            <!-- Location -->
            <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex items-center gap-2 text-xs">
              <span class="material-symbols-outlined text-amber-400 text-[18px]">shelves</span>
              <div class="overflow-hidden">
                <span class="text-[9px] font-bold text-slate-500 block uppercase">Lokalizacja w warsztacie</span>
                <span class="font-bold text-amber-200 truncate block">${jaw.location}</span>
              </div>
            </div>

            ${jaw.notes ? `
              <p class="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50 font-mono text-[11px]">
                💬 ${jaw.notes}
              </p>
            ` : ''}
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <button class="btn-print-jaw-label bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs p-2 rounded-xl flex items-center gap-1 transition-all active:scale-95" data-jaw-id="${jaw.id}" title="Drukuj etykietę QR 50x30mm">
              <span class="material-symbols-outlined text-[16px] text-blue-400">qr_code_2</span>
              <span>ETYKIETA</span>
            </button>
            <button class="btn-view-product bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs p-2 rounded-xl flex items-center gap-1 transition-all active:scale-95" data-sku="${jaw.productSku}" title="Przejdź do karty detalu">
              <span class="material-symbols-outlined text-[16px] text-emerald-400">description</span>
              <span>DETAL</span>
            </button>
          </div>

          <div class="flex items-center gap-1">
            <button class="btn-edit-jaw p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" data-jaw-id="${jaw.id}" title="Edytuj dane szczęk">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="btn-delete-jaw p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-all" data-jaw-id="${jaw.id}" title="Usuń szczęki">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  function openEditModal(jaw = null) {
    currentEditingJaw = jaw ? { ...jaw } : {
      id: '',
      productSku: '',
      productName: '',
      productId: null,
      operation: 'OP1 - Frezowanie',
      location: 'Szafa A / Półka 1',
      viseType: 'Imadło Gerardi 150mm',
      status: 'READY',
      photo: null,
      notes: ''
    };

    const modalContainer = container.querySelector('#jaw-modal-container');
    modalContainer.innerHTML = `
      <div id="jaw-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
          
          <!-- Modal Header -->
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">precision_manufacturing</span>
              </div>
              <div>
                <h3 class="font-black text-white text-base">
                  ${jaw ? 'Edycja Szczęk Miękkich' : 'Nowe Szczęki Miękkie CNC'}
                </h3>
                <p class="text-[11px] text-slate-400 font-bold">Standard kodu: SZ-[NUMER_DETALU]</p>
              </div>
            </div>
            <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Form -->
          <form id="jaw-form" class="flex flex-col gap-3 text-xs">
            
            <!-- Select Product from Odoo -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-400 uppercase tracking-wide">Wybierz Powiązany Detal (z Odoo) *</label>
              <select id="modal-product-select" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none">
                <option value="">-- Wybierz detal ze spisu lub wpisz poniżej --</option>
                ${allProducts.map(p => `
                  <option value="${p.default_code || ''}" data-name="${p.name}" data-id="${p.id}" ${currentEditingJaw.productSku === p.default_code ? 'selected' : ''}>
                    ${p.default_code || '---'} | ${p.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Auto-generated Jaw ID -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="font-bold text-slate-400 uppercase tracking-wide">Kod Szczęk / Grawerka *</label>
                <input id="modal-jaw-id" type="text" value="${currentEditingJaw.id || ''}" placeholder="np. SZ-00329 lub SZ-00329-OP2" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono font-black text-blue-400 focus:border-blue-500 outline-none uppercase" required />
                
                <!-- Quick Format Selectors (OP1, OP2, OP3) -->
                <div class="flex items-center gap-1 mt-1 flex-wrap" id="quick-op-badges">
                  <span class="text-[10px] text-slate-500 font-bold mr-0.5">Wariant:</span>
                  <button type="button" class="btn-quick-code text-[10px] bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2 py-0.5 rounded font-mono font-bold" data-suffix="">SZ-[SKU]</button>
                  <button type="button" class="btn-quick-code text-[10px] bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2 py-0.5 rounded font-mono font-bold" data-suffix="-OP1">OP1</button>
                  <button type="button" class="btn-quick-code text-[10px] bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2 py-0.5 rounded font-mono font-bold" data-suffix="-OP2">OP2</button>
                  <button type="button" class="btn-quick-code text-[10px] bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2 py-0.5 rounded font-mono font-bold" data-suffix="-OP3">OP3</button>
                </div>
              </div>

              <div class="flex flex-col gap-1">
                <label class="font-bold text-slate-400 uppercase tracking-wide">Status Szczęk *</label>
                <select id="modal-jaw-status" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none">
                  <option value="READY" ${currentEditingJaw.status === 'READY' ? 'selected' : ''}>🟢 Gotowe na półce (w samarce)</option>
                  <option value="IN_USE" ${currentEditingJaw.status === 'IN_USE' ? 'selected' : ''}>🔵 W maszynie (CNC)</option>
                  <option value="TO_MAKE" ${currentEditingJaw.status === 'TO_MAKE' ? 'selected' : ''}>🟡 Do zrobienia / przefrezowania</option>
                </select>
              </div>
            </div>

            <!-- Operation & Vise -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="font-bold text-slate-400 uppercase tracking-wide">Operacja CNC</label>
                <input id="modal-jaw-op" type="text" value="${currentEditingJaw.operation || ''}" placeholder="np. OP1 - Gabaryt lub OP2 - Spód" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="font-bold text-slate-400 uppercase tracking-wide">Typ Imadła / Uchwytu</label>
                <input id="modal-jaw-vise" type="text" value="${currentEditingJaw.viseType || ''}" placeholder="np. Gerardi 150, Bison 125" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none" />
              </div>
            </div>

            <!-- Location -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-400 uppercase tracking-wide">Lokalizacja na Warsztacie *</label>
              <input id="modal-jaw-location" type="text" value="${currentEditingJaw.location || ''}" placeholder="np. Szafa A / Półka 2, Regał 3" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-amber-300 focus:border-blue-500 outline-none" required />
            </div>

            <!-- Photo from Phone Camera / Upload -->
            <div class="flex flex-col gap-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
              <label class="font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-blue-400 text-base">photo_camera</span>
                  Zdjęcie Szczęk & Bazowania
                </span>
                ${currentEditingJaw.photo ? `
                  <button type="button" id="btn-remove-photo" class="text-rose-400 hover:text-rose-300 text-[11px] font-bold">USUŃ ZDJĘCIE</button>
                ` : ''}
              </label>

              <div id="photo-preview-box" class="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 transition-colors">
                ${currentEditingJaw.photo ? `
                  <img src="${currentEditingJaw.photo}" alt="Podgląd" class="max-h-36 object-contain rounded-lg shadow-md" />
                ` : `
                  <span class="material-symbols-outlined text-3xl text-slate-500 mb-1">add_a_photo</span>
                  <span class="text-xs font-bold text-slate-400">Kliknij, aby zrobić zdjęcie aparatem telefonu</span>
                  <span class="text-[10px] text-slate-600">lub wgrać plik graficzny</span>
                `}
                <input id="modal-photo-input" type="file" accept="image/*" capture="environment" class="hidden" />
              </div>
            </div>

            <!-- Notes -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-400 uppercase tracking-wide">Notatki Technologiczne / Program CNC</label>
              <textarea id="modal-jaw-notes" rows="2" placeholder="np. Zderzak po lewej stronie, moment docisku 30 Nm, program O20329.NC" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none">${currentEditingJaw.notes || ''}</textarea>
            </div>

            <!-- Submit buttons -->
            <div class="flex gap-2 pt-2 border-t border-slate-800 mt-2">
              <button type="button" id="btn-cancel-modal" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all">
                ANULUJ
              </button>
              <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">save</span>
                ZAPISZ SZCZĘKI
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    bindModalEvents();
  }

  function bindModalEvents() {
    const modalContainer = container.querySelector('#jaw-modal-container');
    const select = modalContainer.querySelector('#modal-product-select');
    const idInput = modalContainer.querySelector('#modal-jaw-id');
    const photoBox = modalContainer.querySelector('#photo-preview-box');
    const photoInput = modalContainer.querySelector('#modal-photo-input');
    const removePhotoBtn = modalContainer.querySelector('#btn-remove-photo');
    const form = modalContainer.querySelector('#jaw-form');

    // When product is selected -> Auto-fill ID as SZ-[SKU]
    select.addEventListener('change', () => {
      const opt = select.selectedOptions[0];
      if (opt && opt.value) {
        const sku = opt.value;
        const name = opt.getAttribute('data-name');
        const prodId = opt.getAttribute('data-id');
        
        currentEditingJaw.productSku = sku;
        currentEditingJaw.productName = name;
        currentEditingJaw.productId = prodId ? Number(prodId) : null;
        
        if (!idInput.value || idInput.value.startsWith('SZ-')) {
          idInput.value = `SZ-${sku}`;
          currentEditingJaw.id = `SZ-${sku}`;
        }
      }
    });

    // Quick Code Format Buttons (SZ-[SKU], SZ-[SKU]-OP1, OP2, OP3)
    modalContainer.querySelectorAll('.btn-quick-code').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const suffix = e.currentTarget.getAttribute('data-suffix') || '';
        let baseSku = currentEditingJaw.productSku;
        if (!baseSku && idInput.value) {
          baseSku = idInput.value.replace(/^SZ[-_]/i, '').split('-')[0];
        }
        if (!baseSku) baseSku = '00000';
        idInput.value = `SZ-${baseSku}${suffix}`;
        currentEditingJaw.id = idInput.value;
        if (suffix) {
          const opNum = suffix.replace('-OP', '');
          modalContainer.querySelector('#modal-jaw-op').value = `OP${opNum} - Frezowanie operacji ${opNum}`;
        }
      });
    });

    // Photo input trigger
    photoBox.addEventListener('click', () => photoInput.click());
    
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          currentEditingJaw.photo = re.target.result;
          openEditModal(currentEditingJaw); // Re-render modal with photo
        };
        reader.readAsDataURL(file);
      }
    });

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentEditingJaw.photo = null;
        openEditModal(currentEditingJaw);
      });
    }

    modalContainer.querySelector('#btn-close-modal').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
    modalContainer.querySelector('#btn-cancel-modal').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const finalId = idInput.value.trim().toUpperCase();
      if (!finalId) {
        alert('Podaj kod szczęk (np. SZ-00329)!');
        return;
      }

      currentEditingJaw.id = finalId;
      currentEditingJaw.status = modalContainer.querySelector('#modal-jaw-status').value;
      currentEditingJaw.operation = modalContainer.querySelector('#modal-jaw-op').value;
      currentEditingJaw.viseType = modalContainer.querySelector('#modal-jaw-vise').value;
      currentEditingJaw.location = modalContainer.querySelector('#modal-jaw-location').value;
      currentEditingJaw.notes = modalContainer.querySelector('#modal-jaw-notes').value;

      saveJawsRecord(currentEditingJaw);
      modalContainer.innerHTML = '';
      jawsList = getSoftJaws();
      render();
    });
  }

  function bindEvents() {
    container.querySelector('#btn-back-dashboard').addEventListener('click', () => navigateTo('dashboard'));
    
    container.querySelector('#btn-add-jaw').addEventListener('click', () => openEditModal());
    container.querySelector('#btn-empty-add')?.addEventListener('click', () => openEditModal());

    const searchInput = container.querySelector('#jaw-search-input');
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
      // Keep focus
      const newInp = container.querySelector('#jaw-search-input');
      newInp.focus();
      newInp.selectionStart = newInp.selectionEnd = newInp.value.length;
    });

    container.querySelectorAll('.btn-filter-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeStatusFilter = e.currentTarget.getAttribute('data-status');
        render();
      });
    });

    container.querySelectorAll('.btn-print-jaw-label').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-jaw-id');
        const jaw = getJawsById(id);
        if (jaw) printJawLabelHtml(jaw);
      });
    });

    container.querySelectorAll('.btn-view-product').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sku = e.currentTarget.getAttribute('data-sku');
        if (sku) {
          const prod = allProducts.find(p => p.default_code === sku || p.sku === sku);
          if (prod) {
            navigateTo('product', prod);
          } else {
            navigateTo('product', {
              id: 0,
              sku: sku,
              name: `Detal ${sku}`,
              quantity: 0,
              uom: 'szt',
              categoryId: 5
            });
          }
        }
      });
    });

    container.querySelectorAll('.btn-edit-jaw').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-jaw-id');
        const jaw = getJawsById(id);
        if (jaw) openEditModal(jaw);
      });
    });

    container.querySelectorAll('.btn-delete-jaw').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-jaw-id');
        if (confirm(`Czy na pewno chcesz usunąć szczęki ${id}?`)) {
          deleteJawsRecord(id);
          jawsList = getSoftJaws();
          render();
        }
      });
    });
  }

  loadInitialData();
}
