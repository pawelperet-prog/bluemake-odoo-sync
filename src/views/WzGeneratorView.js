import html2pdf from 'html2pdf.js';
import { getProducts, applyStockAdjustment } from '../services/odooApi.js';
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

  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());
  const todayStr = now.toISOString().split('T')[0];
  const orderDefaultDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const nextNumInfo = getNextWzNumber(currentMonthStr, currentYearStr);

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
    wzSuffix: '/BM',
    issueDate: todayStr,
    issuePlace: 'MIELEC',
    orderNumber: `ZZ-72/${nextNumInfo.month}/${nextNumInfo.year}/EC`,
    orderDate: orderDefaultDate,
    issuerName: currentOp ? (currentOp.name === 'Mateusz' ? 'Mateusz Klimkowski' : (currentOp.name === 'Paweł' ? 'Paweł Peret' : currentOp.name)) : 'Mateusz Klimkowski',
    supplier: { ...DEFAULT_SUPPLIER },
    customer: { ...initialCustomer },
    items: [
      { 
        id: 1, 
        name: '00229 - EC-VAC 0108000-004-01 - Podkladka gniazdo', 
        sku: '00229',
        productId: null,
        currentStock: 0,
        locationId: 5,
        quantity: 10, 
        uom: 'szt' 
      }
    ]
  };

  let odooProductsList = [];
  let showHistoryModal = false;
  let showOdooPickerModal = false;
  let targetPickerItemIdx = null;
  let isProcessing = false;
  let statusBannerMsg = '';
  let statusBannerType = 'info'; // 'success' | 'info' | 'error'

  // Asynchronously fetch Odoo products for SKU autocomplete
  getProducts().then(prods => {
    if (Array.isArray(prods)) {
      odooProductsList = prods;
      // Auto-match initial items with Odoo data if possible
      wzState.items.forEach(it => {
        const found = odooProductsList.find(p => p.sku === it.sku || p.sku === it.name || (it.name && it.name.includes(p.sku)));
        if (found) {
          it.productId = found.id;
          it.currentStock = Number(found.quantity || 0);
          it.locationId = found.locationId || 5;
          it.uom = found.uom || it.uom || 'szt';
        }
      });
      updatePreview();
    }
  }).catch(() => {});

  function formatFullWzNumber() {
    return `Nr ${wzState.wzNum}/${wzState.wzMonth}/${wzState.wzYear}${wzState.wzSuffix || '/BM'}`;
  }

  function getFormattedCustomerHtml() {
    const c = wzState.customer;
    let lines = [];
    if (c.name) lines.push(`<strong class="text-slate-900 font-bold">${c.name}</strong>`);
    if (c.address) lines.push(`<span class="text-slate-700">${c.address}</span>`);
    let idParts = [];
    if (c.nip) idParts.push(`NIP: <strong>${c.nip}</strong>`);
    if (c.regon) idParts.push(`REGON: ${c.regon}`);
    if (idParts.length > 0) lines.push(`<span class="text-slate-600 text-[11px]">${idParts.join(', ')}</span>`);
    if (c.contact) lines.push(`<span class="text-slate-500 text-[11px]">${c.contact}</span>`);
    return lines.join('<br/>');
  }

  function getFormattedSupplierHtml() {
    const s = wzState.supplier;
    return `
      <strong class="text-slate-900 font-bold">${s.name}</strong><br/>
      <span class="text-slate-700">${s.address}</span><br/>
      <span class="text-slate-600 text-[11px]">NIP: <strong>${s.nip}</strong></span><br/>
      <span class="text-slate-500 text-[11px]">${s.email}</span>
    `;
  }

  async function downloadPdfFile(docState = wzState) {
    const element = document.getElementById('printable-wz-sheet');
    if (!element) return;

    const fileName = `WZ_${docState.wzNum}_${docState.wzMonth}_${docState.wzYear}_BM.pdf`;
    const opt = {
      margin: [6, 6, 6, 6],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      return true;
    } catch (e) {
      console.error('Error generating PDF with html2pdf:', e);
      window.print();
      return false;
    }
  }

  function downloadHtmlFile() {
    const rows = wzState.items.map((it, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="border: 1px solid #475569; padding: 7px 8px; text-align: center; font-weight: bold; font-family: monospace;">${idx + 1}</td>
        <td style="border: 1px solid #475569; padding: 7px 10px; font-weight: bold; color: #0f172a;">${it.name || ''}</td>
        <td style="border: 1px solid #475569; padding: 7px 8px; text-align: center; font-weight: bold; font-family: monospace; font-size: 11pt;">${it.quantity}</td>
        <td style="border: 1px solid #475569; padding: 7px 8px; text-align: center; color: #475569;">${it.uom || 'szt'}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>WZ ${wzState.wzNum}/${wzState.wzMonth}/${wzState.wzYear}${wzState.wzSuffix}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #0f172a; background: #fff; margin: 0; padding: 15px; }
    .wz-table { width: 100%; border-collapse: collapse; margin-bottom: 0; border: 1.5px solid #334155; }
    .wz-table td { border: 1px solid #475569; padding: 8px 10px; vertical-align: top; }
    .header-box { width: 33.33%; }
    .title-box { background-color: #f1f5f9; text-align: center; padding: 12px 6px !important; }
    .title-text { font-size: 15pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin: 0; }
    .party-header { background-color: #f1f5f9; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #475569; padding: 4px 8px; margin: -8px -10px 6px -10px; border-bottom: 1px solid #cbd5e1; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: -1px; border: 1.5px solid #334155; }
    .items-table th { background-color: #e2e8f0; border: 1px solid #475569; padding: 8px 6px; font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #1e293b; }
    .signatures { width: 100%; margin-top: 45px; border-collapse: collapse; }
    .signatures td { border: none; width: 50%; vertical-align: top; }
    .sig-box { border-top: 1.5px solid #334155; width: 85%; padding-top: 6px; font-size: 9.5pt; color: #334155; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <table class="wz-table">
    <tr>
      <td class="header-box" style="text-align: center; vertical-align: middle;">
        <div style="font-weight: 800; font-size: 11pt; color: #0f172a;">${wzState.issueDate} ${wzState.issuePlace}</div>
        <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Data i miejsce wystawienia</div>
      </td>
      <td class="header-box title-box">
        <div class="title-text">Wydanie z magazynu (WZ)</div>
      </td>
      <td class="header-box" style="text-align: center; vertical-align: middle;">
        <div style="font-weight: 900; font-size: 12.5pt; color: #0f172a; font-family: monospace;">${formatFullWzNumber()}</div>
      </td>
    </tr>
    <tr>
      <td style="width: 50%;">
        <div class="party-header">Dostawca:</div>
        ${getFormattedSupplierHtml()}
      </td>
      <td style="width: 50%;" colspan="2">
        <div class="party-header">Odbiorca:</div>
        ${getFormattedCustomerHtml()}
      </td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="width: 50%; font-size: 9.5pt;">
        <strong style="color: #334155;">Numer zamówienia:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${wzState.orderNumber || '-'}</span>
      </td>
      <td style="width: 50%; font-size: 9.5pt;" colspan="2">
        <strong style="color: #334155;">Data zamówienia:</strong> <span style="font-weight: bold; color: #0f172a;">${wzState.orderDate || '-'}</span>
      </td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 45px; text-align: center;">Lp.</th>
        <th style="text-align: left; padding-left: 10px;">Nazwa towaru / usługi</th>
        <th style="width: 95px; text-align: center;">Ilość</th>
        <th style="width: 65px; text-align: center;">Jm</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <table class="signatures">
    <tr>
      <td style="padding-left: 10px;">
        <div class="sig-box">
          <div style="font-weight: bold; color: #475569;">Odebrał(a)</div>
        </div>
      </td>
      <td style="padding-left: 20px;">
        <div class="sig-box">
          <div style="color: #475569;">Wystawił(a): <strong style="color: #0f172a;">${wzState.issuerName}</strong></div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WZ_${wzState.wzNum}_${wzState.wzMonth}_${wzState.wzYear}_BM.html`;
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
          header, #wz-creator-controls, #history-modal-backdrop, #odoo-picker-modal-backdrop { display: none !important; }
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

      <main class="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 mt-14 mb-20">
        
        <!-- Status Toast Banner -->
        ${statusBannerMsg ? `
          <div class="p-3.5 rounded-2xl flex items-center justify-between gap-2 shadow-md ${statusBannerType === 'success' ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-950' : 'bg-blue-100 border-2 border-blue-400 text-blue-950'}">
            <div class="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <span class="material-symbols-outlined ${statusBannerType === 'success' ? 'text-emerald-600' : 'text-blue-600'}">
                ${statusBannerType === 'success' ? 'check_circle' : 'info'}
              </span>
              <span>${statusBannerMsg}</span>
            </div>
            <button id="btn-dismiss-status" class="text-xs font-bold px-2 py-1 hover:bg-black/10 rounded-lg">✕</button>
          </div>
        ` : ''}

        <!-- ═════════════════════════════════════════════════════════════════════
             CREATOR CONTROLS BAR (Styled identically to user photo!)
             ═════════════════════════════════════════════════════════════════════ -->
        <div id="wz-creator-controls" class="bg-surface-container-lowest border-2 border-outline-variant/80 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col gap-4">
          
          <!-- Top Row Form Inputs -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
            
            <!-- Nr WZ: [ 1 ] / [ 09 ] / [ 2026 ] /BM -->
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
                <span class="material-symbols-outlined text-[16px]">${isProcessing ? 'sync' : 'cloud_sync'}</span>
                <span>${isProcessing ? 'SYNCHRONIZACJA ODOO & PDF...' : '💾 Generuj WZ (Odejmij Stan & Pobierz PDF)'}</span>
              </button>
              <button id="btn-download-wz-html" class="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[16px]">html</span>
                <span>Pobierz HTML</span>
              </button>
              <button id="btn-reset-new-wz" class="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Nowa WZ</span>
              </button>
              <button id="btn-print-wz-doc" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[18px]">print</span>
                <span>Drukuj WZ</span>
              </button>
            </div>

          </div>

          <!-- Items Interactive Edit Form List with Autocomplete & Direct Odoo Picker -->
          <div class="flex flex-col gap-2 pt-2 border-t border-slate-200">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-700 text-xs uppercase tracking-wide">Pozycje towarowe (Wpisz numer / SKU lub wybierz z bazy):</span>
              <span class="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                Automatyczne odejmowanie ze stanu Odoo 19 przy zapisie
              </span>
            </div>

            <div class="flex flex-col gap-2" id="wz-items-inputs-container">
              ${wzState.items.map((it, idx) => `
                <div class="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded-xl relative" data-item-idx="${idx}">
                  <span class="font-mono font-bold text-slate-500 w-6 text-center">${idx + 1}.</span>
                  
                  <!-- SKU / Product Name Input with Auto-Suggest Dropdown -->
                  <div class="flex-1 min-w-[260px] relative">
                    <div class="flex items-center gap-1">
                      <input 
                        type="text" 
                        value="${it.name || ''}" 
                        placeholder="Wpisz numer (np. 00229) lub nazwę detalu" 
                        autocomplete="off"
                        class="w-full bg-white border border-slate-300 rounded font-bold px-3 py-1.5 text-xs text-slate-900 item-name-input focus:ring-2 focus:ring-primary" 
                        data-idx="${idx}" 
                      />
                      <button 
                        type="button" 
                        class="btn-open-odoo-picker bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded text-[11px] font-bold whitespace-nowrap flex items-center gap-1 active:scale-95" 
                        data-idx="${idx}" 
                        title="Otwórz pełną listę produktów z Odoo"
                      >
                        <span class="material-symbols-outlined text-[15px]">inventory_2</span>
                        <span>BAZA</span>
                      </button>
                    </div>

                    <!-- Floating Autocomplete Suggestion Dropdown Box -->
                    <div id="autocomplete-box-${idx}" class="autocomplete-dropdown hidden absolute top-full left-0 w-full bg-white border-2 border-indigo-500 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto mt-1 p-1"></div>
                  </div>

                  <!-- Quantity -->
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-slate-500 font-bold">Ilość:</span>
                    <input 
                      type="number" 
                      step="1" 
                      min="1" 
                      value="${it.quantity}" 
                      class="w-20 bg-white border border-slate-300 rounded font-bold font-mono px-2 py-1.5 text-xs text-center text-slate-900 item-qty-input focus:ring-2 focus:ring-primary" 
                      data-idx="${idx}" 
                    />
                  </div>

                  <!-- Unit of Measure -->
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-slate-500 font-bold">Jm:</span>
                    <select class="bg-white border border-slate-300 rounded font-bold px-2 py-1.5 text-xs text-slate-900 item-uom-select focus:ring-2 focus:ring-primary" data-idx="${idx}">
                      <option value="szt" ${it.uom === 'szt' ? 'selected' : ''}>szt</option>
                      <option value="m" ${it.uom === 'm' ? 'selected' : ''}>m</option>
                      <option value="kpl" ${it.uom === 'kpl' ? 'selected' : ''}>kpl</option>
                      <option value="kg" ${it.uom === 'kg' ? 'selected' : ''}>kg</option>
                    </select>
                  </div>

                  <!-- Stock badge if matched with Odoo -->
                  ${it.productId ? `
                    <span class="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-lg">
                      Stan Odoo: ${it.currentStock} ${it.uom}
                    </span>
                  ` : ''}

                  <!-- Delete button -->
                  <button type="button" class="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 btn-delete-item" data-idx="${idx}" title="Usuń ten wiersz">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- ═════════════════════════════════════════════════════════════════════
             LIVE PRO A4 WZ DOCUMENT PREVIEW (ELEGANT SLATE SHADES)
             ═════════════════════════════════════════════════════════════════════ -->
        <div class="flex flex-col items-center">
          <div class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            <span>Podgląd wydruku A4 (Elegancki styl biznesowy PRO)</span>
          </div>

          <div id="printable-wz-sheet" class="bg-white text-slate-950 border-2 border-slate-600 p-8 sm:p-12 shadow-2xl rounded-none w-full max-w-[850px] font-sans text-[12.5px] leading-relaxed select-text">
            
            <!-- Header Grid: 3 Clean Boxes -->
            <table class="w-full border-collapse border-2 border-slate-700 mb-0">
              <tr>
                <td class="border border-slate-600 p-3 text-center w-1/3 align-middle bg-slate-50/70">
                  <div class="font-extrabold text-sm text-slate-900" id="prev-issue-date-place">${wzState.issueDate} ${wzState.issuePlace}</div>
                  <div class="text-[9.5px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">Data i miejsce wystawienia</div>
                </td>
                <td class="border border-slate-600 p-3 text-center w-1/3 align-middle bg-slate-100">
                  <h2 class="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 m-0">Wydanie z magazynu (WZ)</h2>
                </td>
                <td class="border border-slate-600 p-3 text-center w-1/3 align-middle bg-slate-50/70">
                  <div class="font-black text-sm sm:text-base text-slate-950 font-mono" id="prev-wz-full-number">${formatFullWzNumber()}</div>
                </td>
              </tr>
              <tr>
                <td class="border border-slate-600 p-3.5 align-top w-1/2">
                  <div class="bg-slate-100 -m-3.5 mb-2.5 p-1.5 px-3 border-b border-slate-300 font-bold text-[10px] text-slate-700 uppercase tracking-wider">
                    Dostawca:
                  </div>
                  <div id="prev-supplier-block">${getFormattedSupplierHtml()}</div>
                </td>
                <td class="border border-slate-600 p-3.5 align-top w-1/2" colspan="2">
                  <div class="bg-slate-100 -m-3.5 mb-2.5 p-1.5 px-3 border-b border-slate-300 font-bold text-[10px] text-slate-700 uppercase tracking-wider">
                    Odbiorca:
                  </div>
                  <div id="prev-customer-block">${getFormattedCustomerHtml()}</div>
                </td>
              </tr>
              <tr class="bg-slate-50/60">
                <td class="border border-slate-600 p-2.5 align-middle">
                  <span class="text-slate-600 font-semibold">Numer zamówienia:</span> <strong class="text-slate-900 font-mono text-xs" id="prev-order-num">${wzState.orderNumber || '-'}</strong>
                </td>
                <td class="border border-slate-600 p-2.5 align-middle" colspan="2">
                  <span class="text-slate-600 font-semibold">Data zamówienia:</span> <strong class="text-slate-900 text-xs" id="prev-order-date">${wzState.orderDate || '-'}</strong>
                </td>
              </tr>
            </table>

            <!-- Goods / Items Table with Pro Header & Zebra Striping -->
            <table class="w-full border-collapse border-2 border-slate-700 -mt-[2px]">
              <thead>
                <tr class="bg-slate-200 text-slate-900 text-xs font-black uppercase tracking-wider">
                  <th class="border border-slate-600 py-2.5 px-2 text-center w-12">Lp.</th>
                  <th class="border border-slate-600 py-2.5 px-3 text-left">Nazwa towaru / usługi</th>
                  <th class="border border-slate-600 py-2.5 px-3 text-center w-24">Ilość</th>
                  <th class="border border-slate-600 py-2.5 px-3 text-center w-16">Jm</th>
                </tr>
              </thead>
              <tbody id="prev-items-tbody">
                ${wzState.items.map((it, idx) => `
                  <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}">
                    <td class="border border-slate-600 py-2 px-2 text-center font-mono font-bold text-slate-600">${idx + 1}</td>
                    <td class="border border-slate-600 py-2 px-3 font-bold text-slate-950">${it.name || '-'}</td>
                    <td class="border border-slate-600 py-2 px-3 text-center font-mono font-bold text-sm text-slate-950">${it.quantity}</td>
                    <td class="border border-slate-600 py-2 px-3 text-center text-slate-700 font-medium">${it.uom || 'szt'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Signatures Section -->
            <div class="mt-16 grid grid-cols-2 gap-8 px-4">
              <div class="flex flex-col items-start">
                <div class="w-4/5 border-t-2 border-slate-700 mb-1.5"></div>
                <div class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Odebrał(a)</div>
              </div>
              <div class="flex flex-col items-start">
                <div class="w-4/5 border-t-2 border-slate-700 mb-1.5"></div>
                <div class="text-[11px] text-slate-600">Wystawił(a): <strong class="text-slate-950" id="prev-issuer-signature">${wzState.issuerName}</strong></div>
              </div>
            </div>

          </div>
        </div>

      </main>

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL: ODOO PRODUCTS BROWSER / SELECTOR
           ═════════════════════════════════════════════════════════════════════ -->
      ${showOdooPickerModal ? `
        <div id="odoo-picker-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div class="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl flex flex-col gap-3 max-h-[85vh]">
            <div class="flex justify-between items-center border-b border-gray-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-600 text-2xl">inventory_2</span>
                <h2 class="font-bold text-gray-900 text-base">Wybierz produkt z bazy Odoo (Pozycja ${targetPickerItemIdx !== null ? targetPickerItemIdx + 1 : 1})</h2>
              </div>
              <button id="close-odoo-picker-btn" class="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Search input inside modal -->
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input id="picker-search-input" type="text" placeholder="Szukaj po numerze SKU, nazwie detalu, gatunku..." autofocus class="w-full pl-10 pr-4 py-2 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl text-sm font-bold" />
            </div>

            <!-- Products List -->
            <div id="picker-products-list" class="flex-1 overflow-y-auto flex flex-col gap-1.5 max-h-[50vh]">
              ${odooProductsList.map(p => `
                <div class="picker-prod-card flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer" 
                  data-sku="${p.sku}" data-name="${p.name}" data-id="${p.id}" data-qty="${p.quantity || 0}" data-loc="${p.locationId || 5}" data-uom="${p.uom || 'szt'}">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded text-xs">${p.sku}</span>
                      <span class="font-bold text-xs text-slate-800">${p.name}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">Lokacja: ${p.location || 'Magazyn'} • Kategoria: ID ${p.categoryId || '-'}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-mono font-bold text-xs text-slate-700">Stan: ${Number(p.quantity || 0).toFixed(1)} ${p.uom || 'szt'}</span>
                    <button type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg">Wybierz</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="flex justify-end pt-2 border-t border-gray-100">
              <button id="btn-close-picker-bottom" class="bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2 rounded-xl text-xs text-gray-800">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- ═════════════════════════════════════════════════════════════════════
           HISTORY MODAL
           ═════════════════════════════════════════════════════════════════════ -->
      ${showHistoryModal ? `
        <div id="history-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div class="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div class="flex justify-between items-center border-b border-gray-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-600 text-2xl">history</span>
                <h2 class="font-bold text-gray-900 text-base">Baza Wystawionych Dokumentów WZ (${getWzHistory().length})</h2>
              </div>
              <button id="close-history-modal-btn" class="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto flex flex-col gap-2.5">
              ${getWzHistory().length === 0 ? `
                <div class="text-center py-10 text-gray-400 text-xs font-bold flex flex-col items-center gap-2">
                  <span class="material-symbols-outlined text-4xl text-gray-300">folder_open</span>
                  <span>Brak zapisanych dokumentów WZ. Utwórz WZ i kliknij „Generuj WZ”.</span>
                </div>
              ` : getWzHistory().map(w => `
                <div class="flex flex-wrap justify-between items-center p-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100/80 transition-all gap-2">
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-slate-950">${w.formattedNumber || `Nr ${w.wzNum}/${w.wzMonth}/${w.wzYear}${w.wzSuffix || '/BM'}`}</span>
                      <span class="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">${w.issueDate}</span>
                    </div>
                    <div class="text-xs text-slate-700 font-semibold">${w.customer?.name || 'Brak odbiorcy'} • Zam: <span class="font-mono text-slate-900">${w.orderNumber}</span></div>
                    <div class="text-[11px] text-slate-500">
                      Pozycje (${w.items?.length || 0}): ${w.items?.map(i => `${i.name} (${i.quantity}${i.uom})`).slice(0, 3).join(', ')}${w.items?.length > 3 ? '...' : ''}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="btn-load-wz bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl active:scale-95 shadow-sm" data-id="${w.id}">
                      Wczytaj
                    </button>
                    <button class="btn-history-pdf bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl active:scale-95 shadow-sm flex items-center gap-1" data-id="${w.id}" title="Pobierz plik PDF">
                      <span class="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                      <span>PDF</span>
                    </button>
                    <button class="btn-del-wz text-rose-600 hover:bg-rose-50 p-2 rounded-xl" data-id="${w.id}" title="Usuń z bazy">
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

    const dismissStatus = container.querySelector('#btn-dismiss-status');
    if (dismissStatus) {
      dismissStatus.addEventListener('click', () => {
        statusBannerMsg = '';
        renderUI();
      });
    }

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

    // History Load, Download PDF and Delete handlers
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

    container.querySelectorAll('.btn-history-pdf').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const found = getWzHistory().find(w => w.id === id);
        if (found) {
          const oldState = { ...wzState };
          wzState = JSON.parse(JSON.stringify(found));
          showHistoryModal = false;
          renderUI();
          setTimeout(async () => {
            await downloadPdfFile(found);
          }, 200);
        }
      });
    });

    container.querySelectorAll('.btn-del-wz').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Czy na pewno usunąć ten dokument z bazy WZ?')) {
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
    if (inputMonth) {
      inputMonth.addEventListener('input', (e) => { 
        wzState.wzMonth = e.target.value;
        const next = getNextWzNumber(wzState.wzMonth, wzState.wzYear);
        wzState.wzNum = String(next.num);
        if (inputNum) inputNum.value = wzState.wzNum;
        updatePreview(); 
      });
    }
    if (inputYear) {
      inputYear.addEventListener('input', (e) => { 
        wzState.wzYear = e.target.value; 
        const next = getNextWzNumber(wzState.wzMonth, wzState.wzYear);
        wzState.wzNum = String(next.num);
        if (inputNum) inputNum.value = wzState.wzNum;
        updatePreview(); 
      });
    }
    if (inputSuffix) inputSuffix.addEventListener('input', (e) => { wzState.wzSuffix = e.target.value; updatePreview(); });

    // Dates and Places
    const inputIssueDate = container.querySelector('#input-issue-date');
    const inputIssuePlace = container.querySelector('#input-issue-place');
    const inputOrderNum = container.querySelector('#input-order-num');
    const inputOrderDate = container.querySelector('#input-order-date');

    if (inputIssueDate) {
      inputIssueDate.addEventListener('input', (e) => { 
        wzState.issueDate = e.target.value; 
        if (e.target.value) {
          const parts = e.target.value.split('-');
          if (parts.length === 3) {
            const y = parts[0];
            const m = parts[1];
            if (m !== wzState.wzMonth || y !== wzState.wzYear) {
              wzState.wzMonth = m;
              wzState.wzYear = y;
              const next = getNextWzNumber(m, y);
              wzState.wzNum = String(next.num);
              if (inputMonth) inputMonth.value = m;
              if (inputYear) inputYear.value = y;
              if (inputNum) inputNum.value = wzState.wzNum;
            }
          }
        }
        updatePreview(); 
      });
    }

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
          sku: '',
          productId: null,
          currentStock: 0,
          locationId: 5,
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

    // Autocomplete for Items
    container.querySelectorAll('.item-name-input').forEach(inp => {
      const idx = parseInt(inp.getAttribute('data-idx'), 10);
      const dropdown = container.querySelector(`#autocomplete-box-${idx}`);

      const showSuggestions = (query) => {
        if (!dropdown) return;
        const q = (query || '').toLowerCase().trim();
        if (!q) {
          dropdown.classList.add('hidden');
          return;
        }

        const matches = odooProductsList.filter(p => 
          (p.sku && p.sku.toLowerCase().includes(q)) || 
          (p.name && p.name.toLowerCase().includes(q))
        ).slice(0, 10);

        if (matches.length === 0) {
          dropdown.innerHTML = `
            <div class="p-2 text-center text-xs text-gray-500 font-medium">
              Pozycja niestandardowa: <strong>${query}</strong>
            </div>
          `;
          dropdown.classList.remove('hidden');
          return;
        }

        dropdown.innerHTML = matches.map(p => {
          // Format full label: e.g. "00229 - EC-VAC 0108000-004-01 - Podkladka gniazdo"
          const fullLabel = p.name.includes(p.sku) ? p.name : `${p.sku} - ${p.name}`;
          return `
            <div class="suggestion-item p-2 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-gray-100 last:border-none" 
              data-sku="${p.sku}" data-name="${fullLabel}" data-id="${p.id}" data-qty="${p.quantity || 0}" data-loc="${p.locationId || 5}" data-uom="${p.uom || 'szt'}">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-bold text-xs bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">${p.sku}</span>
                  <span class="font-bold text-xs text-slate-900">${p.name}</span>
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">Lokacja: ${p.location || 'Strefa składowania'}</div>
              </div>
              <div class="text-right">
                <span class="font-mono font-bold text-xs text-indigo-700">${Number(p.quantity || 0).toFixed(1)} ${p.uom || 'szt'}</span>
              </div>
            </div>
          `;
        }).join('');

        dropdown.classList.remove('hidden');

        dropdown.querySelectorAll('.suggestion-item').forEach(itemEl => {
          itemEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const selectedLabel = itemEl.getAttribute('data-name');
            const selectedSku = itemEl.getAttribute('data-sku');
            const selectedId = Number(itemEl.getAttribute('data-id'));
            const selectedQty = Number(itemEl.getAttribute('data-qty'));
            const selectedLoc = Number(itemEl.getAttribute('data-loc'));
            const selectedUom = itemEl.getAttribute('data-uom');

            inp.value = selectedLabel;
            wzState.items[idx].name = selectedLabel;
            wzState.items[idx].sku = selectedSku;
            wzState.items[idx].productId = selectedId;
            wzState.items[idx].currentStock = selectedQty;
            wzState.items[idx].locationId = selectedLoc;
            wzState.items[idx].uom = selectedUom;

            const uomSelect = container.querySelector(`.item-uom-select[data-idx="${idx}"]`);
            if (uomSelect) uomSelect.value = selectedUom;

            dropdown.classList.add('hidden');
            renderUI();
          });
        });
      };

      inp.addEventListener('input', (e) => {
        wzState.items[idx].name = e.target.value;
        // Check if matches SKU
        const matched = odooProductsList.find(p => p.sku.toLowerCase() === e.target.value.toLowerCase().trim());
        if (matched) {
          wzState.items[idx].productId = matched.id;
          wzState.items[idx].currentStock = Number(matched.quantity || 0);
          wzState.items[idx].locationId = matched.locationId || 5;
          wzState.items[idx].uom = matched.uom || 'szt';
        }
        showSuggestions(e.target.value);
        updatePreview();
      });

      inp.addEventListener('focus', (e) => {
        if (e.target.value) showSuggestions(e.target.value);
      });

      inp.addEventListener('blur', () => {
        setTimeout(() => {
          if (dropdown) dropdown.classList.add('hidden');
        }, 200);
      });
    });

    // Direct Odoo Picker Button Handler
    container.querySelectorAll('.btn-open-odoo-picker').forEach(btn => {
      btn.addEventListener('click', () => {
        targetPickerItemIdx = parseInt(btn.getAttribute('data-idx'), 10);
        showOdooPickerModal = true;
        renderUI();
      });
    });

    // Odoo Picker Modal Search & Selection
    if (showOdooPickerModal) {
      const pickerClose = container.querySelector('#close-odoo-picker-btn');
      const pickerCloseBottom = container.querySelector('#btn-close-picker-bottom');
      const pickerSearch = container.querySelector('#picker-search-input');
      const pickerList = container.querySelector('#picker-products-list');

      const closePicker = () => {
        showOdooPickerModal = false;
        renderUI();
      };

      [pickerClose, pickerCloseBottom].forEach(b => { if (b) b.addEventListener('click', closePicker); });

      if (pickerSearch && pickerList) {
        pickerSearch.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          const filtered = odooProductsList.filter(p => 
            (p.sku && p.sku.toLowerCase().includes(q)) || 
            (p.name && p.name.toLowerCase().includes(q))
          );

          pickerList.innerHTML = filtered.map(p => {
            const fullLabel = p.name.includes(p.sku) ? p.name : `${p.sku} - ${p.name}`;
            return `
              <div class="picker-prod-card flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer" 
                data-sku="${p.sku}" data-name="${fullLabel}" data-id="${p.id}" data-qty="${p.quantity || 0}" data-loc="${p.locationId || 5}" data-uom="${p.uom || 'szt'}">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded text-xs">${p.sku}</span>
                    <span class="font-bold text-xs text-slate-800">${p.name}</span>
                  </div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Lokacja: ${p.location || 'Magazyn'} • Kategoria: ID ${p.categoryId || '-'}</div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-mono font-bold text-xs text-slate-700">Stan: ${Number(p.quantity || 0).toFixed(1)} ${p.uom || 'szt'}</span>
                  <button type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg">Wybierz</button>
                </div>
              </div>
            `;
          }).join('');

          attachPickerCardEvents();
        });
      }

      const attachPickerCardEvents = () => {
        container.querySelectorAll('.picker-prod-card').forEach(card => {
          card.addEventListener('click', () => {
            const label = card.getAttribute('data-name');
            const sku = card.getAttribute('data-sku');
            const id = Number(card.getAttribute('data-id'));
            const qty = Number(card.getAttribute('data-qty'));
            const loc = Number(card.getAttribute('data-loc'));
            const uom = card.getAttribute('data-uom');

            if (targetPickerItemIdx !== null && wzState.items[targetPickerItemIdx]) {
              wzState.items[targetPickerItemIdx].name = label;
              wzState.items[targetPickerItemIdx].sku = sku;
              wzState.items[targetPickerItemIdx].productId = id;
              wzState.items[targetPickerItemIdx].currentStock = qty;
              wzState.items[targetPickerItemIdx].locationId = loc;
              wzState.items[targetPickerItemIdx].uom = uom;
            }
            closePicker();
          });
        });
      };

      attachPickerCardEvents();
    }

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
          wzState.items[0] = { id: 1, name: '', sku: '', productId: null, currentStock: 0, locationId: 5, quantity: 1, uom: 'szt' };
          renderUI();
        }
      });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // ACTION: GENERATE WZ (DEDUCT STOCK FROM ODOO + SAVE DB + DOWNLOAD PDF)
    // ═════════════════════════════════════════════════════════════════════════
    const btnSaveState = container.querySelector('#btn-save-wz-state');
    if (btnSaveState) {
      btnSaveState.addEventListener('click', async () => {
        isProcessing = true;
        btnSaveState.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span><span>ODEJMOWANIE ZE STANU ODOO...</span>';
        btnSaveState.disabled = true;

        let deductedCount = 0;
        let deductedSummary = [];

        try {
          // 1. Deduct Stock in Odoo 19 for matched items
          for (const it of wzState.items) {
            let pId = it.productId;
            let curStock = it.currentStock;
            let locId = it.locationId || 5;
            let sku = it.sku || it.name;

            // If productId not assigned, search in odooProductsList
            if (!pId && odooProductsList.length > 0) {
              const matched = odooProductsList.find(p => p.sku === it.name || (it.name && it.name.includes(p.sku)));
              if (matched) {
                pId = matched.id;
                curStock = Number(matched.quantity || 0);
                locId = matched.locationId || 5;
                sku = matched.sku;
              }
            }

            if (pId && it.quantity > 0) {
              const newQty = Math.max(0, Number((curStock - it.quantity).toFixed(2)));
              await applyStockAdjustment(pId, newQty, sku, curStock, locId);
              it.currentStock = newQty;
              deductedCount++;
              deductedSummary.push(`${sku} (-${it.quantity} ${it.uom})`);
            }
          }

          // 2. Save full WZ document to database
          saveWzDocument(wzState);

          // 3. Increment monthly counter
          incrementWzCounter(wzState.wzNum, wzState.wzMonth, wzState.wzYear);

          // 4. Generate & Download real PDF
          btnSaveState.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span><span>POBIERANIE PLIKU PDF...</span>';
          await downloadPdfFile(wzState);

          statusBannerType = 'success';
          statusBannerMsg = `Wystawiono WZ (${formatFullWzNumber()})! ${deductedCount > 0 ? `Zaktualizowano stan w Odoo 19 dla: ${deductedSummary.join(', ')}.` : 'Zapisano do bazy i pobrano PDF.'}`;

        } catch (err) {
          console.error('Error processing WZ stock adjustment:', err);
          statusBannerType = 'error';
          statusBannerMsg = `Błąd zapisu w Odoo: ${err.message || err}. Pobrano PDF i zapisano kopię lokalną.`;
          saveWzDocument(wzState);
          await downloadPdfFile(wzState);
        } finally {
          isProcessing = false;
          renderUI();
        }
      });
    }

    const btnDownloadHtml = container.querySelector('#btn-download-wz-html');
    if (btnDownloadHtml) {
      btnDownloadHtml.addEventListener('click', downloadHtmlFile);
    }

    const btnResetNew = container.querySelector('#btn-reset-new-wz');
    if (btnResetNew) {
      btnResetNew.addEventListener('click', () => {
        const next = getNextWzNumber(wzState.wzMonth, wzState.wzYear);
        wzState = {
          id: `WZ_${Date.now()}`,
          wzNum: String(next.num),
          wzMonth: next.month,
          wzYear: next.year,
          wzSuffix: '/BM',
          issueDate: new Date().toISOString().split('T')[0],
          issuePlace: 'MIELEC',
          orderNumber: `ZZ-73/${next.month}/${next.year}/EC`,
          orderDate: new Date().toISOString().split('T')[0],
          issuerName: wzState.issuerName,
          supplier: { ...DEFAULT_SUPPLIER },
          customer: { ...wzState.customer },
          items: [
            { id: 1, name: '', sku: '', productId: null, currentStock: 0, locationId: 5, quantity: 1, uom: 'szt' }
          ]
        };
        statusBannerMsg = '';
        renderUI();
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
        <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}">
          <td class="border border-slate-600 py-2 px-2 text-center font-mono font-bold text-slate-600">${idx + 1}</td>
          <td class="border border-slate-600 py-2 px-3 font-bold text-slate-950">${it.name || '-'}</td>
          <td class="border border-slate-600 py-2 px-3 text-center font-mono font-bold text-sm text-slate-950">${it.quantity}</td>
          <td class="border border-slate-600 py-2 px-3 text-center text-slate-700 font-medium">${it.uom || 'szt'}</td>
        </tr>
      `).join('');
    }
  }

  renderUI();
}
