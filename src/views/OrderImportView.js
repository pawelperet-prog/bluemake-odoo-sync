import { parseOrderPdf, extractOrderDetailsFromText } from '../services/orderParserService.js';
import { enrichOrderItemsWithOdooData, syncOrderToOdoo } from '../services/odooOrdersApi.js';
import { getSavedOrders, saveOrderToDb, deleteOrderFromDb, updateOrderSyncStatus } from '../services/orderStorageService.js';
import { printCustomerLabelsHtml } from '../utils/customerLabelGenerator.js';

export function renderOrderImportView(container, navigateTo) {
  let currentOrder = {
    id: `ORD_${Date.now()}`,
    orderRef: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    items: [],
    syncStatus: 'DRAFT',
    odooOrderName: null,
    odooOrderId: null
  };

  let isProcessing = false;
  let showHistoryModal = false;

  function calculateTotals() {
    let totalNetto = 0;
    for (const it of currentOrder.items) {
      const q = parseFloat(it.shippedQty || it.orderedQty || 0);
      const p = parseFloat(it.unitPrice || 0);
      totalNetto += q * p;
    }
    const vat = totalNetto * 0.23;
    const totalBrutto = totalNetto + vat;
    return {
      netto: totalNetto.toFixed(2),
      vat: vat.toFixed(2),
      brutto: totalBrutto.toFixed(2)
    };
  }

  function renderUI() {
    const totals = calculateTotals();
    const allInStock = currentOrder.items.length > 0 && currentOrder.items.every(i => i.stockStatus === 'OK');

    container.innerHTML = `
      <!-- Top Bar -->
      <header class="fixed top-0 left-0 w-full z-40 bg-surface border-b border-outline-variant h-14 flex justify-between items-center px-4">
        <div class="flex items-center gap-3">
          <button id="btn-back-dash" class="flex items-center gap-1 text-primary hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg font-bold text-xs transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>MAGAZYN</span>
          </button>
          <div class="h-4 w-px bg-outline-variant"></div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-indigo-600 text-[22px]">receipt_long</span>
            <h1 class="font-bold text-primary text-sm sm:text-base">Import & Wysyłka Zamówień</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-toggle-history" class="flex items-center gap-1 bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm">
            <span class="material-symbols-outlined text-[16px]">history</span>
            <span>HISTORIA BAZY</span>
            <span class="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">${getSavedOrders().length}</span>
          </button>
        </div>
      </header>

      <main class="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 mt-14 mb-20">
        
        <!-- Dropzone / PDF Upload Card -->
        <div id="pdf-dropzone" class="border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 shadow-sm flex flex-col items-center justify-center gap-2">
          <input type="file" id="pdf-file-input" accept="application/pdf" class="hidden" />
          <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
            <span class="material-symbols-outlined text-3xl">upload_file</span>
          </div>
          <div>
            <h3 class="font-bold text-indigo-950 text-sm sm:text-base">Przeciągnij i upuść plik PDF zamówienia od klienta (1, 2 lub 3+ strony)</h3>
            <p class="text-xs text-indigo-700 mt-0.5">Obsługuje formaty Comarch ERP XL, Subiekt, SAP, zlecenia magazynowe i faktury</p>
          </div>
          <button type="button" class="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-transform active:scale-95 shadow-md pointer-events-none">
            WYBIERZ PLIK PDF Z DYSKU
          </button>
        </div>

        <!-- Order Header Metadata Form -->
        <div class="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
          <div class="flex flex-wrap justify-between items-center border-b border-outline-variant/40 pb-2.5 gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[20px]">assignment</span>
              <span class="font-bold text-primary text-sm uppercase tracking-wide">Dane Nagłówka Zamówienia</span>
            </div>
            ${currentOrder.odooOrderName ? `
              <div class="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-[16px] text-emerald-600">cloud_done</span>
                <span>ZSYNCHRONIZOWANO Z ODOO: <strong>${currentOrder.odooOrderName}</strong></span>
              </div>
            ` : `
              <div class="flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-[16px] text-amber-600">edit_document</span>
                <span>SZKIC / DO WYSŁANIA</span>
              </div>
            `}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Nr Zamówienia / Ref:</label>
              <input id="input-order-ref" type="text" value="${currentOrder.orderRef || ''}" placeholder="np. ZZ-330/10/2025/EC lub 24/08/2026" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary outline-none font-mono" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Data Wystawienia:</label>
              <input id="input-order-date" type="date" value="${currentOrder.orderDate || ''}" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary outline-none" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Termin Realizacji:</label>
              <input id="input-delivery-date" type="date" value="${currentOrder.deliveryDate || ''}" class="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>

        <!-- Editable Items Table -->
        <div class="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
          <div class="flex justify-between items-center border-b border-outline-variant/40 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[20px]">list_alt</span>
              <span class="font-bold text-primary text-sm uppercase tracking-wide">Pozycje Zamówienia (${currentOrder.items.length})</span>
            </div>
            <button id="btn-add-row" class="flex items-center gap-1 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs px-3 py-1.5 rounded-lg transition-transform active:scale-95 border border-outline-variant">
              <span class="material-symbols-outlined text-[16px]">add</span>
              <span>DODAJ POZYCJĘ</span>
            </button>
          </div>

          ${currentOrder.items.length === 0 ? `
            <div class="text-center py-10 text-on-surface-variant flex flex-col items-center gap-2">
              <span class="material-symbols-outlined text-4xl text-gray-400">post_add</span>
              <p class="text-sm font-bold">Brak pozycji w zamówieniu.</p>
              <p class="text-xs text-gray-500">Przeciągnij plik PDF powyżej lub kliknij „Dodaj pozycję”, aby wpisać ręcznie.</p>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr class="border-b border-outline-variant text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container/60">
                    <th class="py-2.5 px-2 w-10 text-center">LP</th>
                    <th class="py-2.5 px-2 w-24 font-mono">SKU</th>
                    <th class="py-2.5 px-2">RYSUNEK / NAZWA DETALU</th>
                    <th class="py-2.5 px-2 w-20 text-center">ZAMÓWIONE</th>
                    <th class="py-2.5 px-2 w-28 text-center bg-indigo-50/60 text-indigo-950 font-black">DO WYSYŁKI</th>
                    <th class="py-2.5 px-2 w-24 text-right">CENA NETTO</th>
                    <th class="py-2.5 px-2 w-24 text-right">WARTOŚĆ</th>
                    <th class="py-2.5 px-2 w-28 text-center">TYP / PROTOTYP</th>
                    <th class="py-2.5 px-2 w-28 text-center">STAN ODOO</th>
                    <th class="py-2.5 px-2 w-10 text-center">USUŃ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/40">
                  ${currentOrder.items.map((item, idx) => {
                    const rowNetto = ((item.shippedQty || item.orderedQty || 0) * (item.unitPrice || 0)).toFixed(2);
                    return `
                      <tr class="hover:bg-surface-container/30 transition-colors" data-row-idx="${idx}">
                        <td class="py-2 px-2 text-center font-bold text-gray-500">${idx + 1}</td>
                        <td class="py-2 px-2">
                          <input type="text" class="row-sku w-full bg-surface-container border border-outline-variant/60 rounded px-1.5 py-1 font-mono font-bold text-xs" value="${item.sku || ''}" />
                        </td>
                        <td class="py-2 px-2">
                          <input type="text" class="row-name w-full bg-surface-container border border-outline-variant/60 rounded px-1.5 py-1 font-bold text-xs" value="${item.name || ''}" />
                        </td>
                        <td class="py-2 px-2 text-center">
                          <span class="font-bold text-gray-600">${item.orderedQty || 0} ${item.uom || 'szt'}</span>
                        </td>
                        <td class="py-2 px-2 text-center bg-indigo-50/40">
                          <input type="number" step="1" min="0" class="row-shipped-qty w-20 text-center bg-white border-2 border-indigo-400 focus:border-indigo-600 rounded-lg px-1.5 py-1 font-black text-sm text-indigo-950 outline-none" value="${item.shippedQty !== undefined ? item.shippedQty : item.orderedQty}" title="Wpisz faktyczną ilość wyprodukowaną / do wysyłki (np. 55 zamiast 50)" />
                        </td>
                        <td class="py-2 px-2 text-right">
                          <input type="number" step="0.01" class="row-price w-20 text-right bg-surface-container border border-outline-variant/60 rounded px-1.5 py-1 font-bold text-xs" value="${item.unitPrice || 0}" />
                        </td>
                        <td class="py-2 px-2 text-right font-bold text-primary font-mono">${rowNetto} zł</td>
                        <td class="py-2 px-2 text-center">
                          <button type="button" class="btn-toggle-proto px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${item.isPrototype ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-gray-100 text-gray-700 border-gray-300'}">
                            ${item.isPrototype ? '🧪 PROTOTYP' : '🏷️ STAŁY'}
                          </button>
                        </td>
                        <td class="py-2 px-2 text-center">
                          ${item.existsInOdoo ? `
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold ${item.stockStatus === 'OK' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'} px-2 py-0.5 rounded">
                              ${item.stockStatus === 'OK' ? '🟢' : '🔴'} ${item.inStock} ${item.uom || 'szt'}
                            </span>
                          ` : `
                            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              ✨ NOWY W ODOO
                            </span>
                          `}
                        </td>
                        <td class="py-2 px-2 text-center">
                          <button type="button" class="btn-remove-row text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}

          <!-- Totals Footer Bar -->
          <div class="flex flex-wrap justify-between items-center bg-surface-container/70 rounded-xl p-3.5 mt-2 gap-3 border border-outline-variant/40">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined ${allInStock ? 'text-emerald-600' : 'text-amber-600'} text-[22px]">
                ${allInStock ? 'check_circle' : 'inventory_2'}
              </span>
              <div>
                <p class="text-xs font-bold text-primary">
                  ${allInStock ? '🟢 Wszystkie pozycje są dostępne na magazynie!' : 'ℹ️ Część pozycji wymaga wykonania / pobrania surowca.'}
                </p>
                <p class="text-[11px] text-on-surface-variant">Ilość pozycji: <strong>${currentOrder.items.length}</strong></p>
              </div>
            </div>

            <div class="flex items-center gap-4 text-right">
              <div>
                <span class="text-[11px] text-gray-500 block uppercase">Netto:</span>
                <span class="font-bold font-mono text-sm text-gray-900">${totals.netto} PLN</span>
              </div>
              <div>
                <span class="text-[11px] text-gray-500 block uppercase">VAT (23%):</span>
                <span class="font-bold font-mono text-sm text-gray-700">${totals.vat} PLN</span>
              </div>
              <div class="border-l border-outline-variant pl-4">
                <span class="text-[11px] text-gray-500 block uppercase font-bold">RAZEM BRUTTO:</span>
                <span class="font-black font-mono text-lg text-primary">${totals.brutto} PLN</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons Bar -->
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <button id="btn-save-draft" class="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs px-4 py-3 rounded-xl border border-outline-variant shadow-sm transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">save</span>
            <span>ZAPISZ W BAZIE LOKALNEJ</span>
          </button>

          <div class="flex flex-wrap gap-2">
            <button id="btn-print-labels" class="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-md transition-transform active:scale-95">
              <span class="material-symbols-outlined text-[20px]">barcode_scanner</span>
              <span>🏷️ DRUKUJ KODY DO PACZKI (ZEBRA / PDF)</span>
            </button>

            <button id="btn-sync-odoo" class="flex items-center gap-1.5 bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-[0_3px_0_0_#b34b00] active:translate-y-[2px] active:shadow-none transition-all uppercase">
              <span class="material-symbols-outlined text-[20px]">cloud_upload</span>
              <span>🚀 WYŚLIJ / ZAKTUALIZUJ W ODOO</span>
            </button>
          </div>
        </div>

      </main>

      <!-- History Modal -->
      <div id="history-modal" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 ${showHistoryModal ? 'flex' : 'hidden'}">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-600 text-[22px]">history</span>
              <h2 class="font-bold text-primary text-base">Historia Zapisanych Zamówień</h2>
            </div>
            <button id="btn-close-history" class="p-1 rounded-full hover:bg-surface-container-highest text-gray-500 hover:text-primary">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
            ${getSavedOrders().length === 0 ? `
              <div class="text-center py-12 text-gray-500">Brak zapisanych zamówień w bazie lokalnej.</div>
            ` : getSavedOrders().map(o => `
              <div class="p-3 bg-surface-container/60 hover:bg-surface-container rounded-xl border border-outline-variant flex flex-wrap justify-between items-center gap-2 transition-colors">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-sm text-primary">${o.orderRef}</span>
                    <span class="text-xs text-gray-600 font-bold">• ${o.customerName}</span>
                    ${o.odooOrderName ? `
                      <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ODOO: ${o.odooOrderName}
                      </span>
                    ` : `
                      <span class="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">SZKIC</span>
                    `}
                  </div>
                  <span class="text-[11px] text-gray-500 mt-0.5">Pozycji: ${o.items?.length || 0} • Data: ${o.orderDate || 'brak'}</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <button class="btn-load-order px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs" data-order-id="${o.id}">
                    WCZYTAJ DO EDYCJI
                  </button>
                  <button class="btn-del-order p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" data-order-id="${o.id}" title="Usuń z historii">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#btn-back-dash')?.addEventListener('click', () => navigateTo('dashboard'));

    // Dropzone & File Input
    const dropzone = container.querySelector('#pdf-dropzone');
    const fileInput = container.querySelector('#pdf-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-indigo-600', 'bg-indigo-100/60');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-indigo-600', 'bg-indigo-100/60');
      });

      dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-indigo-600', 'bg-indigo-100/60');
        if (e.dataTransfer.files.length > 0) {
          await handlePdfFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          await handlePdfFile(e.target.files[0]);
        }
      });
    }

    // Input fields update
    container.querySelector('#input-order-ref')?.addEventListener('input', (e) => {
      currentOrder.orderRef = e.target.value;
    });

    container.querySelector('#input-customer-name')?.addEventListener('input', (e) => {
      currentOrder.customerName = e.target.value;
    });

    container.querySelector('#input-order-date')?.addEventListener('change', (e) => {
      currentOrder.orderDate = e.target.value;
    });

    container.querySelector('#input-delivery-date')?.addEventListener('change', (e) => {
      currentOrder.deliveryDate = e.target.value;
    });

    // Row inputs
    container.querySelectorAll('.row-sku').forEach((inp, idx) => {
      inp.addEventListener('input', (e) => {
        if (currentOrder.items[idx]) currentOrder.items[idx].sku = e.target.value;
      });
    });

    container.querySelectorAll('.row-name').forEach((inp, idx) => {
      inp.addEventListener('input', (e) => {
        if (currentOrder.items[idx]) currentOrder.items[idx].name = e.target.value;
      });
    });

    container.querySelectorAll('.row-shipped-qty').forEach((inp, idx) => {
      inp.addEventListener('input', (e) => {
        if (currentOrder.items[idx]) {
          currentOrder.items[idx].shippedQty = parseFloat(e.target.value) || 0;
          renderUI();
        }
      });
    });

    container.querySelectorAll('.row-price').forEach((inp, idx) => {
      inp.addEventListener('input', (e) => {
        if (currentOrder.items[idx]) {
          currentOrder.items[idx].unitPrice = parseFloat(e.target.value) || 0;
          renderUI();
        }
      });
    });

    container.querySelectorAll('.btn-toggle-proto').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (currentOrder.items[idx]) {
          currentOrder.items[idx].isPrototype = !currentOrder.items[idx].isPrototype;
          renderUI();
        }
      });
    });

    container.querySelectorAll('.btn-remove-row').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        currentOrder.items.splice(idx, 1);
        renderUI();
      });
    });

    // Add Row
    container.querySelector('#btn-add-row')?.addEventListener('click', () => {
      currentOrder.items.push({
        id: `line_${Date.now()}_${currentOrder.items.length}`,
        lp: currentOrder.items.length + 1,
        sku: '',
        symbol: '',
        name: '',
        orderedQty: 1,
        shippedQty: 1,
        uom: 'szt',
        unitPrice: 50.0,
        vat: 23,
        isPrototype: false,
        inStock: 0,
        odooProductId: null
      });
      renderUI();
    });

    // Save Draft
    container.querySelector('#btn-save-draft')?.addEventListener('click', () => {
      saveOrderToDb(currentOrder);
      alert('✅ Zapisano zamówienie w lokalnej bazie danych!');
      renderUI();
    });

    // Print Barcode Labels
    container.querySelector('#btn-print-labels')?.addEventListener('click', () => {
      if (currentOrder.items.length === 0) {
        alert('Dodaj pozycje do zamówienia przed drukowaniem etykiet.');
        return;
      }
      printCustomerLabelsHtml(currentOrder);
    });

    // Sync to Odoo
    const syncBtn = container.querySelector('#btn-sync-odoo');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        if (currentOrder.items.length === 0) {
          alert('Brak pozycji do wysłania do Odoo.');
          return;
        }

        syncBtn.disabled = true;
        syncBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> WYSYŁANIE DO ODOO...`;

        try {
          const res = await syncOrderToOdoo(currentOrder);
          currentOrder.odooOrderId = res.id;
          currentOrder.odooOrderName = res.name;
          currentOrder.syncStatus = 'SYNCED_ODOO';
          saveOrderToDb(currentOrder);

          alert(`🎉 SUKCES! Utworzono zamówienie w Odoo: ${res.name} (Wartość brutto: ${res.amount_total} zł)`);
          renderUI();
        } catch (err) {
          alert('Błąd synchronizacji z Odoo: ' + err.message);
        } finally {
          syncBtn.disabled = false;
          syncBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">cloud_upload</span><span>🚀 WYŚLIJ / ZAKTUALIZUJ W ODOO</span>`;
        }
      });
    }

    // History Modal events
    container.querySelector('#btn-toggle-history')?.addEventListener('click', () => {
      showHistoryModal = true;
      renderUI();
    });

    container.querySelector('#btn-close-history')?.addEventListener('click', () => {
      showHistoryModal = false;
      renderUI();
    });

    container.querySelectorAll('.btn-load-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        const loaded = getSavedOrders().find(o => o.id === orderId);
        if (loaded) {
          currentOrder = JSON.parse(JSON.stringify(loaded));
          showHistoryModal = false;
          renderUI();
        }
      });
    });

    container.querySelectorAll('.btn-del-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        if (confirm('Czy na pewno chcesz usunąć to zamówienie z historii?')) {
          deleteOrderFromDb(orderId);
          renderUI();
        }
      });
    });
  }

  async function handlePdfFile(file) {
    if (!file) return;
    const dropzone = container.querySelector('#pdf-dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center animate-spin">
          <span class="material-symbols-outlined text-3xl">sync</span>
        </div>
        <h3 class="font-bold text-indigo-950 text-sm">Przetwarzanie stron PDF za pomocą AI i weryfikacja magazynu Odoo...</h3>
      `;
    }

    try {
      const parsed = await parseOrderPdf(file);
      currentOrder.orderRef = parsed.orderRef || currentOrder.orderRef;
      currentOrder.customerName = parsed.customerName || currentOrder.customerName;
      currentOrder.orderDate = parsed.orderDate || currentOrder.orderDate;
      currentOrder.deliveryDate = parsed.deliveryDate || currentOrder.deliveryDate;

      // Match items against real-time Odoo database
      const enrichedItems = await enrichOrderItemsWithOdooData(parsed.items);
      currentOrder.items = enrichedItems;

      saveOrderToDb(currentOrder);
      renderUI();
    } catch (err) {
      alert('Błąd podczas odczytu pliku PDF: ' + err.message);
      renderUI();
    }
  }

  renderUI();
}
