import { getProducts } from '../services/odooApi.js';
import { getCurrentOperator } from '../services/authService.js';
import { 
  DEFAULT_SUPPLIER, 
  getSavedCustomers, 
  saveCustomer, 
  getWzHistory, 
  saveWzDocument, 
  deleteWzDocument, 
  getNextWzNumber, 
  incrementWzCounter 
} from '../services/wzStorageService.js';

export function renderWzGeneratorView(container, navigateTo) {
  const currentOp = getCurrentOperator();
  const nextNumInfo = getNextWzNumber();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const orderDefaultDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const customers = getSavedCustomers();
  const initialCustomer = customers[0] || {
    name: 'EC Engineering Sp. z o.o.',
    address: 'ul. Armii Krajowej 28, 30-150 Kraków',
    nip: 'PL9452024663',
    regon: '35690824',
    contact: 'office@ec-e.pl, www.ec-e.pl'
  };

  let wzState = {
    id: `WZ_${Date.now()}`,
    wzNum: String(nextNumInfo.num),
    wzMonth: nextNumInfo.month,
    wzYear: nextNumInfo.year,
    wzSuffix: '/WZ/BM',
    issueDate: todayStr,
    issuePlace: 'MIELEC',
    orderNumber: `ZZ-72/${nextNumInfo.month}/${nextNumInfo.year}/EC`,
    orderDate: orderDefaultDate,
    issuerName: currentOp ? (currentOp.name === 'Mateusz' ? 'Mateusz Klimkowski' : (currentOp.name === 'Paweł' ? 'Paweł Peret' : currentOp.name)) : 'Mateusz Klimkowski',
    supplier: { ...DEFAULT_SUPPLIER },
    customer: { ...initialCustomer },
    items: [
      { id: 1, name: 'K0029', quantity: 10, uom: 'szt' }
    ]
  };

  let odooProductsList = [];
  let showHistoryModal = false;

  // Asynchronously fetch Odoo products for SKU autocomplete
  getProducts().then(prods => {
    if (Array.isArray(prods)) {
      odooProductsList = prods;
    }
  }).catch(() => {});

  function formatFullWzNumber() {
    return `Nr ${wzState.wzNum}/${wzState.wzMonth}/${wzState.wzYear}${wzState.wzSuffix}`;
  }

  function getFormattedCustomerHtml() {
    const c = wzState.customer;
    let lines = [];
    if (c.name) lines.push(`<strong>${c.name}</strong>`);
    if (c.address) lines.push(c.address);
    let idParts = [];
    if (c.nip) idParts.push(`NIP: ${c.nip}`);
    if (c.regon) idParts.push(`REGON: ${c.regon}`);
    if (idParts.length > 0) lines.push(idParts.join(', '));
    if (c.contact) lines.push(c.contact);
    return lines.join('<br/>');
  }

  function getFormattedSupplierHtml() {
    const s = wzState.supplier;
    return `
      <strong>${s.name}</strong><br/>
      ${s.address}<br/>
      NIP: ${s.nip}<br/>
      ${s.email}
    `;
  }

  function generateStandaloneHtml() {
    const rows = wzState.items.map((it, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; font-weight: bold;">${it.name || ''}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold;">${it.quantity}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">${it.uom || 'szt'}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>WZ ${wzState.wzNum}/${wzState.wzMonth}/${wzState.wzYear}${wzState.wzSuffix}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; background: #fff; margin: 0; padding: 20px; }
    .wz-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .wz-table td, .wz-table th { border: 1px solid #000; padding: 8px 10px; font-size: 10pt; vertical-align: top; }
    .wz-title-box { text-align: center; font-size: 16pt; font-weight: bold; padding: 12px !important; }
    .header-box { width: 33.33%; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: -1px; }
    .items-table th { background: #f0f0f0; border: 1px solid #000; padding: 6px 8px; font-size: 10pt; text-align: left; }
    .items-table td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; }
    .signatures { width: 100%; margin-top: 50px; border-collapse: collapse; }
    .signatures td { border: none; width: 50%; vertical-align: top; }
    .sig-line { border-top: 1px solid #000; width: 85%; margin-bottom: 5px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Header Grid -->
  <table class="wz-table">
    <tr>
      <td class="header-box" style="text-align: center;">
        <div style="font-weight: bold; font-size: 11pt;">${wzState.issueDate} ${wzState.issuePlace}</div>
        <div style="font-size: 8pt; color: #444; margin-top: 3px;">Data i miejsce wystawienia</div>
      </td>
      <td class="header-box wz-title-box">
        Wydanie z magazynu (WZ)
      </td>
      <td class="header-box" style="text-align: center; vertical-align: middle;">
        <div style="font-weight: bold; font-size: 12pt;">${formatFullWzNumber()}</div>
      </td>
    </tr>
    <tr>
      <td style="width: 50%;" colspan="1">
        <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: #555;">Dostawca:</div>
        ${getFormattedSupplierHtml()}
      </td>
      <td style="width: 50%;" colspan="2">
        <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: #555;">Odbiorca:</div>
        ${getFormattedCustomerHtml()}
      </td>
    </tr>
    <tr>
      <td style="width: 50%;">
        <strong>Numer zamówienia:</strong> ${wzState.orderNumber || '-'}
      </td>
      <td style="width: 50%;" colspan="2">
        <strong>Data zamówienia:</strong> ${wzState.orderDate || '-'}
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">Lp.</th>
        <th>Nazwa towaru / usługi</th>
        <th style="width: 90px; text-align: center;">Ilość</th>
        <th style="width: 60px; text-align: center;">Jm</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <!-- Signatures -->
  <table class="signatures">
    <tr>
      <td style="padding-left: 10px;">
        <div class="sig-line"></div>
        <div style="font-size: 9pt; color: #333;">Odebrał(a)</div>
      </td>
      <td style="padding-left: 20px;">
        <div class="sig-line"></div>
        <div style="font-size: 9pt; color: #333;">Wystawił(a): <strong>${wzState.issuerName}</strong></div>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  function downloadHtmlFile() {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WZ_${wzState.wzNum}_${wzState.wzMonth}_${wzState.wzYear}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }

  function renderUI() {
    container.innerHTML = `
      <style>
        @media print {
          body * { visibility: hidden; }
          #printable-wz-sheet, #printable-wz-sheet * { visibility: visible; }
          #printable-wz-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          header, #wz-creator-controls, #history-modal-backdrop { display: none !important; }
        }
      </style>

      <!-- Top Bar -->
      <header class="fixed top-0 left-0 w-full z-40 bg-surface border-b border-outline-variant h-14 flex justify-between items-center px-4">
        <div class="flex items-center gap-3">
          <button id="btn-back-mag" class="flex items-center gap-1 text-primary hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg font-bold text-xs transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>MAGAZYN</span>
          </button>
          <div class="h-4 w-px bg-outline-variant"></div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-amber-600 text-[22px]">description</span>
            <h1 class="font-bold text-primary text-sm sm:text-base">Kreator Dokumentów WZ</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-toggle-wz-history" class="flex items-center gap-1 bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm">
            <span class="material-symbols-outlined text-[16px]">history</span>
            <span>HISTORIA WZ</span>
            <span class="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">${getWzHistory().length}</span>
          </button>
        </div>
      </header>

      <main class="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-5 mt-14 mb-20">
        
        <!-- ═════════════════════════════════════════════════════════════════════
             CREATOR CONTROLS BAR (Styled identically to user photo!)
             ═════════════════════════════════════════════════════════════════════ -->
        <div id="wz-creator-controls" class="bg-surface-container-lowest border-2 border-outline-variant/80 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col gap-4">
          
          <!-- Top Row Form Inputs -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
            
            <!-- Nr WZ: [ 1 ] / [ 09 ] / [ 2026 ] /WZ/BM -->
            <div class="md:col-span-4 flex items-center gap-1 bg-slate-50 border border-slate-300 p-2 rounded-xl">
              <span class="font-bold text-slate-700 whitespace-nowrap">Nr WZ:</span>
              <input id="input-wz-num" type="number" min="1" value="${wzState.wzNum}" class="w-12 text-center bg-white border border-slate-300 rounded font-bold font-mono py-1 px-1 focus:ring-1 focus:ring-primary" />
              <span class="font-bold text-slate-400">/</span>
              <input id="input-wz-month" type="text" maxlength="2" value="${wzState.wzMonth}" class="w-10 text-center bg-white border border-slate-300 rounded font-bold font-mono py-1 px-1 focus:ring-1 focus:ring-primary" />
              <span class="font-bold text-slate-400">/</span>
              <input id="input-wz-year" type="text" maxlength="4" value="${wzState.wzYear}" class="w-14 text-center bg-white border border-slate-300 rounded font-bold font-mono py-1 px-1 focus:ring-1 focus:ring-primary" />
              <input id="input-wz-suffix" type="text" value="${wzState.wzSuffix}" class="w-16 text-center bg-white border border-slate-300 rounded font-bold font-mono py-1 px-1 focus:ring-1 focus:ring-primary" />
            </div>

            <!-- Data wystawienia & Miejsce -->
            <div class="md:col-span-4 flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-2 rounded-xl">
              <span class="font-bold text-slate-700 whitespace-nowrap">Data:</span>
              <input id="input-issue-date" type="date" value="${wzState.issueDate}" class="flex-1 bg-white border border-slate-300 rounded font-bold py-1 px-2 focus:ring-1 focus:ring-primary" />
              <input id="input-issue-place" type="text" value="${wzState.issuePlace}" placeholder="MIELEC" class="w-20 bg-white border border-slate-300 rounded font-bold uppercase py-1 px-1.5 text-center focus:ring-1 focus:ring-primary" />
            </div>

            <!-- Nr zamówienia & Data zamówienia -->
            <div class="md:col-span-4 flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-2 rounded-xl">
              <span class="font-bold text-slate-700 whitespace-nowrap">Nr zam.:</span>
              <input id="input-order-num" type="text" value="${wzState.orderNumber}" placeholder="ZZ-72/09/2026/EC" class="flex-1 bg-white border border-slate-300 rounded font-bold font-mono py-1 px-2 focus:ring-1 focus:ring-primary" />
            </div>

          </div>

          <!-- Secondary Row: Customer, Issuer & Order Date -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
            
            <!-- Data zamówienia -->
            <div class="md:col-span-3 flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-2 rounded-xl">
              <span class="font-bold text-slate-700 whitespace-nowrap">Data zam.:</span>
              <input id="input-order-date" type="date" value="${wzState.orderDate}" class="flex-1 bg-white border border-slate-300 rounded font-bold py-1 px-2 focus:ring-1 focus:ring-primary" />
            </div>

            <!-- Wystawiający (Kto wystawia WZ) -->
            <div class="md:col-span-4 flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-2 rounded-xl">
              <span class="font-bold text-slate-700 whitespace-nowrap">Wystawił:</span>
              <select id="select-issuer-name" class="flex-1 bg-white border border-slate-300 rounded font-bold py-1 px-2 focus:ring-1 focus:ring-primary">
                <option value="Mateusz Klimkowski" ${wzState.issuerName === 'Mateusz Klimkowski' ? 'selected' : ''}>Mateusz Klimkowski</option>
                <option value="Paweł Peret" ${wzState.issuerName === 'Paweł Peret' ? 'selected' : ''}>Paweł Peret</option>
                <option value="Szymon" ${wzState.issuerName === 'Szymon' ? 'selected' : ''}>Szymon</option>
                <option value="Patryk" ${wzState.issuerName === 'Patryk' ? 'selected' : ''}>Patryk</option>
                <option value="Inny">Inny (Wpisz ręcznie)</option>
              </select>
            </div>

            <!-- Odbiorca (Klient) Preset Selector -->
            <div class="md:col-span-5 flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-2 rounded-xl">
              <span class="font-bold text-slate-700 whitespace-nowrap">Odbiorca:</span>
              <select id="select-customer-preset" class="flex-1 bg-white border border-slate-300 rounded font-bold py-1 px-2 focus:ring-1 focus:ring-primary">
                ${customers.map(c => `
                  <option value="${c.id}" ${wzState.customer.name === c.name ? 'selected' : ''}>${c.name}</option>
                `).join('')}
                <option value="NEW">+ Dodaj nowego kontrahenta</option>
              </select>
              <button id="btn-edit-customer" title="Edytuj dane odbiorcy" class="bg-slate-200 hover:bg-slate-300 p-1 rounded">
                <span class="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>

          </div>

          <!-- Customer Edit Drawer (Collapsible) -->
          <div id="customer-edit-box" class="hidden bg-amber-50/70 border border-amber-300 p-3 rounded-xl flex flex-col gap-2 text-xs">
            <span class="font-bold text-amber-900 uppercase">Edycja danych odbiorcy na dokumencie WZ:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input id="edit-cust-name" type="text" placeholder="Nazwa firmy" value="${wzState.customer.name || ''}" class="bg-white border border-amber-300 p-1.5 rounded font-bold" />
              <input id="edit-cust-address" type="text" placeholder="Adres (Ulica, Kod, Miasto)" value="${wzState.customer.address || ''}" class="bg-white border border-amber-300 p-1.5 rounded" />
              <input id="edit-cust-nip" type="text" placeholder="NIP (np. PL9452024663)" value="${wzState.customer.nip || ''}" class="bg-white border border-amber-300 p-1.5 rounded font-mono" />
              <input id="edit-cust-contact" type="text" placeholder="Kontakt / email / www" value="${wzState.customer.contact || ''}" class="bg-white border border-amber-300 p-1.5 rounded" />
            </div>
            <div class="flex justify-end gap-2 mt-1">
              <button id="btn-save-cust-preset" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-1 px-3 rounded text-xs">Zapisz do listy odbiorców</button>
            </div>
          </div>

          <!-- Items Row Controls: [ Usuń ] [ Licznik ] [ + Dodaj ] + Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            
            <!-- Items counter and add/remove buttons -->
            <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-300 text-xs">
              <span class="font-bold text-slate-700 px-1">Pozycje:</span>
              <button id="btn-remove-last-item" class="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[14px]">remove</span>
                <span>Usuń</span>
              </button>
              <span id="items-count-badge" class="font-mono font-bold bg-white border border-slate-300 px-2.5 py-0.5 rounded-md text-slate-900">${wzState.items.length}</span>
              <button id="btn-add-new-item" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[14px]">add</span>
                <span>+ Dodaj</span>
              </button>
            </div>

            <!-- Action Buttons (Exact Green, Blue, Dark, Blue as in photo!) -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-save-wz-state" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[16px]">save</span>
                <span>Zapisz stan</span>
              </button>
              <button id="btn-download-wz-html" class="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[16px]">download</span>
                <span>Pobierz HTML</span>
              </button>
              <button id="btn-reset-new-wz" class="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Nowa WZ</span>
              </button>
              <button id="btn-print-wz-doc" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[18px]">print</span>
                <span>Drukuj WZ</span>
              </button>
            </div>

          </div>

          <!-- Items Interactive Edit Form List -->
          <div class="flex flex-col gap-2 pt-2 border-t border-slate-200">
            <span class="font-bold text-slate-700 text-xs uppercase">Edycja pozycji towarowych:</span>
            <div class="flex flex-col gap-2" id="wz-items-inputs-container">
              ${wzState.items.map((it, idx) => `
                <div class="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded-xl" data-item-idx="${idx}">
                  <span class="font-mono font-bold text-slate-500 w-6 text-center">${idx + 1}.</span>
                  
                  <div class="flex-1 min-w-[200px] relative">
                    <input type="text" list="odoo-products-datalist" value="${it.name || ''}" placeholder="Wpisz numer katalogowy / SKU / Nazwę (np. K0029)" 
                      class="w-full bg-white border border-slate-300 rounded font-bold px-3 py-1.5 text-xs text-slate-900 item-name-input" data-idx="${idx}" />
                  </div>

                  <div class="flex items-center gap-1">
                    <span class="text-xs text-slate-500 font-bold">Ilość:</span>
                    <input type="number" step="1" min="1" value="${it.quantity}" 
                      class="w-20 bg-white border border-slate-300 rounded font-bold font-mono px-2 py-1.5 text-xs text-center text-slate-900 item-qty-input" data-idx="${idx}" />
                  </div>

                  <div class="flex items-center gap-1">
                    <span class="text-xs text-slate-500 font-bold">Jm:</span>
                    <select class="bg-white border border-slate-300 rounded font-bold px-2 py-1.5 text-xs text-slate-900 item-uom-select" data-idx="${idx}">
                      <option value="szt" ${it.uom === 'szt' ? 'selected' : ''}>szt</option>
                      <option value="m" ${it.uom === 'm' ? 'selected' : ''}>m</option>
                      <option value="kpl" ${it.uom === 'kpl' ? 'selected' : ''}>kpl</option>
                      <option value="kg" ${it.uom === 'kg' ? 'selected' : ''}>kg</option>
                    </select>
                  </div>

                  <button type="button" class="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 btn-delete-item" data-idx="${idx}" title="Usuń ten wiersz">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              `).join('')}
            </div>
            
            <datalist id="odoo-products-datalist">
              ${odooProductsList.map(p => `
                <option value="${p.sku}">${p.name} (Stan: ${p.quantity}${p.uom})</option>
              `).join('')}
            </datalist>
          </div>

        </div>

        <!-- ═════════════════════════════════════════════════════════════════════
             LIVE PRINTABLE A4 WZ DOCUMENT PREVIEW (1:1 identical to photo!)
             ═════════════════════════════════════════════════════════════════════ -->
        <div class="flex flex-col items-center">
          <div class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            <span>Podgląd wydruku A4 (1:1 Dokument Oryginał / Kopia)</span>
          </div>

          <div id="printable-wz-sheet" class="bg-white text-black border border-slate-400 p-8 sm:p-12 shadow-2xl rounded-none w-full max-w-[850px] font-sans text-[13px] leading-relaxed select-text">
            
            <!-- Header Grid: 3 Boxes -->
            <table class="w-full border-collapse border border-black mb-0">
              <tr>
                <td class="border border-black p-3 text-center w-1/3 align-middle">
                  <div class="font-bold text-sm" id="prev-issue-date-place">${wzState.issueDate} ${wzState.issuePlace}</div>
                  <div class="text-[10px] text-gray-600 mt-0.5">Data i miejsce wystawienia</div>
                </td>
                <td class="border border-black p-3 text-center w-1/3 align-middle bg-slate-50/50">
                  <h2 class="text-lg sm:text-xl font-bold uppercase tracking-wider m-0">Wydanie z magazynu (WZ)</h2>
                </td>
                <td class="border border-black p-3 text-center w-1/3 align-middle">
                  <div class="font-bold text-sm sm:text-base" id="prev-wz-full-number">${formatFullWzNumber()}</div>
                </td>
              </tr>
              <tr>
                <td class="border border-black p-3.5 align-top w-1/2" colspan="1">
                  <div class="text-[10px] font-bold text-gray-500 uppercase mb-1">Dostawca:</div>
                  <div id="prev-supplier-block">${getFormattedSupplierHtml()}</div>
                </td>
                <td class="border border-black p-3.5 align-top w-1/2" colspan="2">
                  <div class="text-[10px] font-bold text-gray-500 uppercase mb-1">Odbiorca:</div>
                  <div id="prev-customer-block">${getFormattedCustomerHtml()}</div>
                </td>
              </tr>
              <tr>
                <td class="border border-black p-2.5 align-middle">
                  <strong>Numer zamówienia:</strong> <span id="prev-order-num">${wzState.orderNumber || '-'}</span>
                </td>
                <td class="border border-black p-2.5 align-middle" colspan="2">
                  <strong>Data zamówienia:</strong> <span id="prev-order-date">${wzState.orderDate || '-'}</span>
                </td>
              </tr>
            </table>

            <!-- Goods / Items Table -->
            <table class="w-full border-collapse border border-black -mt-[1px]">
              <thead>
                <tr class="bg-gray-100 text-black text-xs font-bold">
                  <th class="border border-black py-2 px-2 text-center w-12">Lp.</th>
                  <th class="border border-black py-2 px-3 text-left">Nazwa towaru / usługi</th>
                  <th class="border border-black py-2 px-3 text-center w-24">Ilość</th>
                  <th class="border border-black py-2 px-3 text-center w-16">Jm</th>
                </tr>
              </thead>
              <tbody id="prev-items-tbody">
                ${wzState.items.map((it, idx) => `
                  <tr>
                    <td class="border border-black py-2 px-2 text-center font-bold">${idx + 1}</td>
                    <td class="border border-black py-2 px-3 font-bold">${it.name || '-'}</td>
                    <td class="border border-black py-2 px-3 text-center font-bold">${it.quantity}</td>
                    <td class="border border-black py-2 px-3 text-center">${it.uom || 'szt'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Signatures Section -->
            <div class="mt-16 grid grid-cols-2 gap-8 px-4">
              <div class="flex flex-col items-start">
                <div class="w-4/5 border-t border-black mb-1"></div>
                <div class="text-[11px] text-gray-700">Odebrał(a)</div>
              </div>
              <div class="flex flex-col items-start">
                <div class="w-4/5 border-t border-black mb-1"></div>
                <div class="text-[11px] text-gray-700">Wystawił(a): <strong id="prev-issuer-signature">${wzState.issuerName}</strong></div>
              </div>
            </div>

          </div>
        </div>

      </main>

      <!-- ═════════════════════════════════════════════════════════════════════
           HISTORY MODAL
           ═════════════════════════════════════════════════════════════════════ -->
      ${showHistoryModal ? `
        <div id="history-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div class="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div class="flex justify-between items-center border-b border-gray-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-600 text-2xl">history</span>
                <h2 class="font-bold text-gray-900 text-base">Zapisane Dokumenty WZ</h2>
              </div>
              <button id="close-history-modal-btn" class="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto flex flex-col gap-2">
              ${getWzHistory().length === 0 ? `
                <div class="text-center py-8 text-gray-400 text-xs font-bold">Brak zapisanych dokumentów WZ. Utwórz nową WZ i kliknij „Zapisz stan”.</div>
              ` : getWzHistory().map(w => `
                <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                  <div>
                    <div class="font-bold text-sm text-slate-900">Nr ${w.wzNum}/${w.wzMonth}/${w.wzYear}${w.wzSuffix}</div>
                    <div class="text-xs text-slate-600">${w.customer?.name || 'Brak odbiorcy'} • Data: ${w.issueDate} • Zam: ${w.orderNumber}</div>
                    <div class="text-[11px] text-amber-700 font-medium">${w.items?.length || 0} pozycji towarowych</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="btn-load-wz bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg active:scale-95" data-id="${w.id}">
                      Wczytaj
                    </button>
                    <button class="btn-del-wz text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg" data-id="${w.id}" title="Usuń z bazy">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="flex justify-end pt-2 border-t border-gray-100">
              <button id="btn-close-hist-bottom" class="bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2 rounded-xl text-xs text-gray-800">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    setupEventHandlers();
  }

  function setupEventHandlers() {
    const backBtn = container.querySelector('#btn-back-mag');
    if (backBtn) backBtn.addEventListener('click', () => navigateTo('dashboard'));

    const histToggle = container.querySelector('#btn-toggle-wz-history');
    if (histToggle) {
      histToggle.addEventListener('click', () => {
        showHistoryModal = true;
        renderUI();
      });
    }

    const closeHistBtn = container.querySelector('#close-history-modal-btn');
    const closeHistBottom = container.querySelector('#btn-close-hist-bottom');
    [closeHistBtn, closeHistBottom].forEach(b => {
      if (b) b.addEventListener('click', () => {
        showHistoryModal = false;
        renderUI();
      });
    });

    // History Load and Delete handlers
    container.querySelectorAll('.btn-load-wz').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = getWzHistory().find(w => w.id === id);
        if (found) {
          wzState = JSON.parse(JSON.stringify(found));
          showHistoryModal = false;
          renderUI();
        }
      });
    });

    container.querySelectorAll('.btn-del-wz').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Czy na pewno usunąć ten dokument z historii WZ?')) {
          deleteWzDocument(id);
          renderUI();
        }
      });
    });

    // Number Inputs
    const inputNum = container.querySelector('#input-wz-num');
    const inputMonth = container.querySelector('#input-wz-month');
    const inputYear = container.querySelector('#input-wz-year');
    const inputSuffix = container.querySelector('#input-wz-suffix');

    if (inputNum) inputNum.addEventListener('input', (e) => { wzState.wzNum = e.target.value; updatePreview(); });
    if (inputMonth) inputMonth.addEventListener('input', (e) => { wzState.wzMonth = e.target.value; updatePreview(); });
    if (inputYear) inputYear.addEventListener('input', (e) => { wzState.wzYear = e.target.value; updatePreview(); });
    if (inputSuffix) inputSuffix.addEventListener('input', (e) => { wzState.wzSuffix = e.target.value; updatePreview(); });

    // Dates and Places
    const inputIssueDate = container.querySelector('#input-issue-date');
    const inputIssuePlace = container.querySelector('#input-issue-place');
    const inputOrderNum = container.querySelector('#input-order-num');
    const inputOrderDate = container.querySelector('#input-order-date');

    if (inputIssueDate) inputIssueDate.addEventListener('input', (e) => { wzState.issueDate = e.target.value; updatePreview(); });
    if (inputIssuePlace) inputIssuePlace.addEventListener('input', (e) => { wzState.issuePlace = e.target.value.toUpperCase(); updatePreview(); });
    if (inputOrderNum) inputOrderNum.addEventListener('input', (e) => { wzState.orderNumber = e.target.value; updatePreview(); });
    if (inputOrderDate) inputOrderDate.addEventListener('input', (e) => { wzState.orderDate = e.target.value; updatePreview(); });

    // Issuer
    const selectIssuer = container.querySelector('#select-issuer-name');
    if (selectIssuer) {
      selectIssuer.addEventListener('change', (e) => {
        if (e.target.value === 'Inny') {
          const customName = prompt('Wpisz imię i nazwisko osoby wystawiającej WZ:', wzState.issuerName);
          if (customName) wzState.issuerName = customName;
        } else {
          wzState.issuerName = e.target.value;
        }
        updatePreview();
      });
    }

    // Customer Selection
    const selectCust = container.querySelector('#select-customer-preset');
    const custEditBox = container.querySelector('#customer-edit-box');
    const btnEditCust = container.querySelector('#btn-edit-customer');

    if (btnEditCust) {
      btnEditCust.addEventListener('click', () => {
        custEditBox.classList.toggle('hidden');
      });
    }

    if (selectCust) {
      selectCust.addEventListener('change', (e) => {
        if (e.target.value === 'NEW') {
          custEditBox.classList.remove('hidden');
          wzState.customer = { name: '', address: '', nip: '', regon: '', contact: '' };
        } else {
          const found = customers.find(c => c.id === e.target.value);
          if (found) {
            wzState.customer = { ...found };
            custEditBox.classList.add('hidden');
          }
        }
        updatePreview();
      });
    }

    const editName = container.querySelector('#edit-cust-name');
    const editAddr = container.querySelector('#edit-cust-address');
    const editNip = container.querySelector('#edit-cust-nip');
    const editContact = container.querySelector('#edit-cust-contact');
    const btnSaveCust = container.querySelector('#btn-save-cust-preset');

    const updateCustFromInputs = () => {
      wzState.customer = {
        name: editName?.value || '',
        address: editAddr?.value || '',
        nip: editNip?.value || '',
        contact: editContact?.value || ''
      };
      updatePreview();
    };

    [editName, editAddr, editNip, editContact].forEach(inp => {
      if (inp) inp.addEventListener('input', updateCustFromInputs);
    });

    if (btnSaveCust) {
      btnSaveCust.addEventListener('click', () => {
        updateCustFromInputs();
        if (!wzState.customer.name) { alert('Wpisz nazwę firmy!'); return; }
        saveCustomer(wzState.customer);
        alert('Zapisano kontrahenta!');
        renderUI();
      });
    }

    // Items Add / Remove
    const btnAddItem = container.querySelector('#btn-add-new-item');
    if (btnAddItem) {
      btnAddItem.addEventListener('click', () => {
        wzState.items.push({
          id: Date.now(),
          name: '',
          quantity: 1,
          uom: 'szt'
        });
        renderUI();
      });
    }

    const btnRemoveLast = container.querySelector('#btn-remove-last-item');
    if (btnRemoveLast) {
      btnRemoveLast.addEventListener('click', () => {
        if (wzState.items.length > 1) {
          wzState.items.pop();
          renderUI();
        }
      });
    }

    // Item Inputs Listeners
    container.querySelectorAll('.item-name-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (wzState.items[idx]) {
          wzState.items[idx].name = e.target.value;
          // Auto-select unit if matched from Odoo
          const matchedOdoo = odooProductsList.find(p => p.sku === e.target.value);
          if (matchedOdoo && matchedOdoo.uom) {
            wzState.items[idx].uom = matchedOdoo.uom;
            const uomSelect = container.querySelector(`.item-uom-select[data-idx="${idx}"]`);
            if (uomSelect) uomSelect.value = matchedOdoo.uom;
          }
          updatePreview();
        }
      });
    });

    container.querySelectorAll('.item-qty-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (wzState.items[idx]) {
          wzState.items[idx].quantity = parseFloat(e.target.value) || 0;
          updatePreview();
        }
      });
    });

    container.querySelectorAll('.item-uom-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (wzState.items[idx]) {
          wzState.items[idx].uom = e.target.value;
          updatePreview();
        }
      });
    });

    container.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (wzState.items.length > 1) {
          wzState.items.splice(idx, 1);
          renderUI();
        } else {
          wzState.items[0] = { id: 1, name: '', quantity: 1, uom: 'szt' };
          renderUI();
        }
      });
    });

    // Action Buttons
    const btnSaveState = container.querySelector('#btn-save-wz-state');
    if (btnSaveState) {
      btnSaveState.addEventListener('click', () => {
        saveWzDocument(wzState);
        incrementWzCounter(wzState.wzNum, wzState.wzMonth, wzState.wzYear);
        alert(`💾 Zapisano dokument WZ (${formatFullWzNumber()}) do pamięci!`);
        renderUI();
      });
    }

    const btnDownloadHtml = container.querySelector('#btn-download-wz-html');
    if (btnDownloadHtml) {
      btnDownloadHtml.addEventListener('click', downloadHtmlFile);
    }

    const btnResetNew = container.querySelector('#btn-reset-new-wz');
    if (btnResetNew) {
      btnResetNew.addEventListener('click', () => {
        if (confirm('Czy utworzyć nową WZ (z kolejnym numerem)?')) {
          incrementWzCounter(wzState.wzNum, wzState.wzMonth, wzState.wzYear);
          const next = getNextWzNumber();
          wzState = {
            id: `WZ_${Date.now()}`,
            wzNum: String(next.num),
            wzMonth: next.month,
            wzYear: next.year,
            wzSuffix: '/WZ/BM',
            issueDate: new Date().toISOString().split('T')[0],
            issuePlace: 'MIELEC',
            orderNumber: `ZZ-73/${next.month}/${next.year}/EC`,
            orderDate: new Date().toISOString().split('T')[0],
            issuerName: wzState.issuerName,
            supplier: { ...DEFAULT_SUPPLIER },
            customer: { ...wzState.customer },
            items: [
              { id: 1, name: '', quantity: 1, uom: 'szt' }
            ]
          };
          renderUI();
        }
      });
    }

    const btnPrint = container.querySelector('#btn-print-wz-doc');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }
  }

  function updatePreview() {
    const prevDatePlace = container.querySelector('#prev-issue-date-place');
    if (prevDatePlace) prevDatePlace.textContent = `${wzState.issueDate} ${wzState.issuePlace}`;

    const prevFullNum = container.querySelector('#prev-wz-full-number');
    if (prevFullNum) prevFullNum.textContent = formatFullWzNumber();

    const prevSupp = container.querySelector('#prev-supplier-block');
    if (prevSupp) prevSupp.innerHTML = getFormattedSupplierHtml();

    const prevCust = container.querySelector('#prev-customer-block');
    if (prevCust) prevCust.innerHTML = getFormattedCustomerHtml();

    const prevOrderNum = container.querySelector('#prev-order-num');
    if (prevOrderNum) prevOrderNum.textContent = wzState.orderNumber || '-';

    const prevOrderDate = container.querySelector('#prev-order-date');
    if (prevOrderDate) prevOrderDate.textContent = wzState.orderDate || '-';

    const prevIssuer = container.querySelector('#prev-issuer-signature');
    if (prevIssuer) prevIssuer.textContent = wzState.issuerName;

    const tbody = container.querySelector('#prev-items-tbody');
    if (tbody) {
      tbody.innerHTML = wzState.items.map((it, idx) => `
        <tr>
          <td class="border border-black py-2 px-2 text-center font-bold">${idx + 1}</td>
          <td class="border border-black py-2 px-3 font-bold">${it.name || '-'}</td>
          <td class="border border-black py-2 px-3 text-center font-bold">${it.quantity}</td>
          <td class="border border-black py-2 px-3 text-center">${it.uom || 'szt'}</td>
        </tr>
      `).join('');
    }
  }

  renderUI();
}
