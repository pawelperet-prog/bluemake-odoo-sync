import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { sendZplViaMqtt } from '../services/mqttService.js';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let cachedOrdersManifest = null;

/**
 * Fetch list of order PDFs available in public /orders_pdf/
 */
export async function getOrdersManifest() {
  if (cachedOrdersManifest && cachedOrdersManifest.length > 0) {
    return cachedOrdersManifest;
  }
  try {
    const res = await fetch('/orders_pdf/orders_manifest.json');
    if (res.ok) {
      cachedOrdersManifest = await res.json();
      return cachedOrdersManifest;
    }
  } catch (err) {
    console.warn('Nie udało się pobrać orders_manifest.json:', err);
  }
  return [];
}

/**
 * Resolve PDF URL for a given order object
 */
export async function resolveOrderPdfUrl(order) {
  if (!order) return null;
  if (order.pdfUrl && typeof order.pdfUrl === 'string' && order.pdfUrl.trim() !== '') {
    return order.pdfUrl.startsWith('/') || order.pdfUrl.startsWith('http') 
      ? order.pdfUrl 
      : `/orders_pdf/${order.pdfUrl}`;
  }

  const ref = (order.orderRef || order.odooOrderName || '').trim();
  if (!ref) return null;

  const clean = ref.replace(/[\/\s]/g, '-');
  const cleanNoSuffix = clean.replace(/-(EC|ZN)$/i, '');

  const manifest = await getOrdersManifest();
  if (manifest && manifest.length > 0) {
    const exact = manifest.find(f => f.toLowerCase() === `${clean.toLowerCase()}.pdf`);
    if (exact) return `/orders_pdf/${encodeURIComponent(exact)}`;

    const noSuff = manifest.find(f => f.toLowerCase() === `${cleanNoSuffix.toLowerCase()}.pdf`);
    if (noSuff) return `/orders_pdf/${encodeURIComponent(noSuff)}`;

    const sub = manifest.find(f => f.toLowerCase().includes(cleanNoSuffix.toLowerCase()));
    if (sub) return `/orders_pdf/${encodeURIComponent(sub)}`;
  }

  return `/orders_pdf/${cleanNoSuffix}.pdf`;
}

/**
 * Slices specific pages from a PDF buffer by 0-based indices.
 * 100% Vector fidelity, no re-encoding of graphics or text.
 */
export async function slicePdfByPageIndices(rawArrayBuffer, pageIndices) {
  if (!rawArrayBuffer || pageIndices.length === 0) {
    throw new Error('Brak danych PDF lub nie wybrano żadnych stron.');
  }

  // Clone buffer to avoid any detachment issues
  const bufferCopy = rawArrayBuffer.slice(0);
  const srcDoc = await PDFDocument.load(bufferCopy);
  const outDoc = await PDFDocument.create();

  const validIndices = pageIndices.filter(idx => idx >= 0 && idx < srcDoc.getPageCount());
  if (validIndices.length === 0) {
    throw new Error('Wybrane numery stron wykraczają poza zakres dokumentu.');
  }

  const copiedPages = await outDoc.copyPages(srcDoc, validIndices);
  copiedPages.forEach(p => outDoc.addPage(p));

  const slicedBytes = await outDoc.save();
  const blob = new Blob([slicedBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blobUrl,
    blob,
    bytes: slicedBytes,
    pageCount: validIndices.length,
    pageNumbers: validIndices.map(i => i + 1)
  };
}

/**
 * Slices ONLY the original barcode pages from an EC Engineering Purchase Order PDF (1:1 Vector Fidelity)
 * Fixes ArrayBuffer detachment by cleanly cloning buffers before worker execution.
 */
export async function sliceOriginalEcBarcodePdf(orderOrPdfUrl, onProgress = null) {
  let pdfUrl = null;
  let orderRef = '';

  if (typeof orderOrPdfUrl === 'string') {
    pdfUrl = orderOrPdfUrl;
  } else if (orderOrPdfUrl && typeof orderOrPdfUrl === 'object') {
    orderRef = orderOrPdfUrl.orderRef || orderOrPdfUrl.odooOrderName || '';
    pdfUrl = await resolveOrderPdfUrl(orderOrPdfUrl);
  }

  if (!pdfUrl) {
    throw new Error('Nie znaleziono pliku PDF powiązanego z tym zamówieniem.');
  }

  if (onProgress) onProgress('Pobieranie oryginalnego pliku PDF...');

  const resp = await fetch(pdfUrl);
  if (!resp.ok) {
    throw new Error(`Nie udało się otworzyć pliku PDF zamówienia (${resp.status} ${resp.statusText})`);
  }

  const rawBytes = await resp.arrayBuffer();

  // CLONE BUFFERS: PDF.js worker transfers and detaches buffers, so we must give it a separate copy!
  const pdfJsBuffer = rawBytes.slice(0);
  const pdfLibBuffer = rawBytes.slice(0);

  if (onProgress) onProgress('Analiza stron dokumentu...');

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfJsBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const barcodePageIndices = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(it => it.str).join(' ');

    const hasPriceOrVat = text.includes('23%') || 
                          text.includes('VAT') || 
                          text.includes('Cena') || 
                          text.includes('Wartość') || 
                          text.includes('Zamówienie na zakup') || 
                          text.includes('Upoważniamy') ||
                          text.includes('Warunki płatności') ||
                          text.includes('Warunki dostawy');

    const hasBarcodeMarkers = (text.includes('BLUEMAKE') || text.includes('szt') || text.includes('Szt') || text.includes('SZT')) &&
                              (text.includes('ZZ-') || text.includes('/EC') || text.includes('/ZN') || /\d{2}\.\d{2}\.\d{4}/.test(text));

    const isLegalFooterPage = text.includes('Sąd Rejonowy') && !text.includes('BLUEMAKE');

    if (!hasPriceOrVat && hasBarcodeMarkers && !isLegalFooterPage) {
      barcodePageIndices.push(i - 1);
    }
  }

  if (barcodePageIndices.length === 0) {
    return {
      success: false,
      reason: 'no_barcode_pages',
      pdfUrl,
      rawBytes: pdfLibBuffer,
      numPages,
      orderRef
    };
  }

  if (onProgress) onProgress(`Wycinanie ${barcodePageIndices.length} stron kodów 1:1...`);

  const sliceRes = await slicePdfByPageIndices(pdfLibBuffer, barcodePageIndices);

  return {
    success: true,
    blobUrl: sliceRes.blobUrl,
    blob: sliceRes.blob,
    bytes: sliceRes.bytes,
    pageNumbers: sliceRes.pageNumbers,
    pageCount: sliceRes.pageCount,
    totalPages: numPages,
    pdfUrl,
    rawBytes: pdfLibBuffer,
    orderRef
  };
}

/**
 * Interactive Modal allowing operator to choose which pages of the PDF to print.
 * Pre-selects barcode pages by default, lets user check/uncheck any pages.
 */
export async function openPdfPageSelectorModal(order, { openPreviewModal = null, onStatusChange = null } = {}) {
  try {
    if (onStatusChange) onStatusChange('Ładowanie dokumentu PDF...');

    let pdfUrl = await resolveOrderPdfUrl(order);
    if (!pdfUrl) {
      alert(`Brak pliku PDF dla zlecenia ${order.orderRef || order.odooOrderName || ''}`);
      return;
    }

    const resp = await fetch(pdfUrl);
    if (!resp.ok) {
      throw new Error(`Nie udało się pobrać pliku PDF: status ${resp.status}`);
    }

    const rawBytes = await resp.arrayBuffer();
    const pdfJsBuffer = rawBytes.slice(0);
    const pdfLibBuffer = rawBytes.slice(0);

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfJsBuffer) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pageMeta = [];
    const barcodeIndices = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(it => it.str).join(' ');

      const hasPriceOrVat = text.includes('23%') || 
                            text.includes('VAT') || 
                            text.includes('Cena') || 
                            text.includes('Wartość') || 
                            text.includes('Zamówienie na zakup') || 
                            text.includes('Upoważniamy') ||
                            text.includes('Warunki płatności') ||
                            text.includes('Warunki dostawy');

      const hasBarcodeMarkers = (text.includes('BLUEMAKE') || text.includes('szt') || text.includes('Szt') || text.includes('SZT')) &&
                                (text.includes('ZZ-') || text.includes('/EC') || text.includes('/ZN') || /\d{2}\.\d{2}\.\d{4}/.test(text));

      const isLegal = text.includes('Sąd Rejonowy') && !text.includes('BLUEMAKE');
      const isBarcode = !hasPriceOrVat && hasBarcodeMarkers && !isLegal;

      if (isBarcode) barcodeIndices.push(i - 1);

      pageMeta.push({
        pageIndex: i - 1,
        pageNumber: i,
        isBarcode,
        snippet: text.trim().substring(0, 45)
      });
    }

    // Remove existing modal if any
    const existing = document.getElementById('pdf-page-selector-modal');
    if (existing) existing.remove();

    const orderRef = order.orderRef || order.odooOrderName || 'Zamówienie';

    // Build modal markup
    const modalHtml = `
      <div id="pdf-page-selector-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 animate-fadeIn">
        <div class="bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
          
          <!-- Header -->
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500">print</span>
                Drukuj strony z PDF zamówienia
              </h3>
              <p class="text-xs text-slate-400 font-mono mt-0.5">${orderRef} (Łącznie ${numPages} str.)</p>
            </div>
            <button id="close-page-selector-modal" class="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Quick presets -->
          <div class="flex flex-wrap items-center gap-2 text-xs">
            ${barcodeIndices.length > 0 ? `
              <button type="button" id="btn-select-only-barcodes" class="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold hover:bg-amber-500/30 cursor-pointer flex items-center gap-1 active:scale-95">
                <span class="material-symbols-outlined text-[15px]">barcode</span>
                <span>Tylko Kody Kreskowe (${barcodeIndices.length} str.)</span>
              </button>
            ` : ''}
            <button type="button" id="btn-select-all-pages" class="px-2.5 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-semibold hover:bg-slate-700 cursor-pointer">
              Wszystkie
            </button>
            <button type="button" id="btn-clear-pages" class="px-2.5 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-semibold hover:bg-slate-700 cursor-pointer">
              Odznacz
            </button>
          </div>

          <p class="text-[11px] text-slate-400">
            Zaznacz strony, które chcesz wydrukować. Dokument zostanie ucięty 1:1 bez modyfikacji i bez cen:
          </p>

          <!-- Checkboxes Grid -->
          <div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/40">
            ${pageMeta.map(p => `
              <label class="flex items-center justify-between p-2 rounded-lg border ${p.isBarcode ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800 bg-slate-900/60'} hover:bg-slate-800/80 cursor-pointer transition-colors text-xs">
                <div class="flex items-center gap-2">
                  <input type="checkbox" value="${p.pageIndex}" class="page-select-checkbox rounded text-amber-500 w-4 h-4 cursor-pointer" ${p.isBarcode || (barcodeIndices.length === 0 && p.pageNumber === 1) ? 'checked' : ''} />
                  <span class="font-bold text-white">Strona ${p.pageNumber}</span>
                </div>
                ${p.isBarcode ? `
                  <span class="text-[9px] bg-amber-500/30 text-amber-300 border border-amber-500/50 px-1.5 py-0.5 rounded font-mono font-bold">KODY EC</span>
                ` : `
                  <span class="text-[9px] text-slate-500 font-mono">DOK</span>
                `}
              </label>
            `).join('')}
          </div>

          <!-- Footer Actions -->
          <div class="flex justify-between items-center border-t border-slate-800 pt-3 gap-2">
            <button type="button" id="btn-cancel-page-selector" class="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer">
              Anuluj
            </button>
            <button type="button" id="btn-execute-print-pages" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer transition-all">
              <span class="material-symbols-outlined text-[18px]">print</span>
              <span>DRUKUJ WYBRANE STRONY (1:1)</span>
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('pdf-page-selector-modal');

    const closeModal = () => modalEl.remove();

    modalEl.querySelector('#close-page-selector-modal')?.addEventListener('click', closeModal);
    modalEl.querySelector('#btn-cancel-page-selector')?.addEventListener('click', closeModal);

    modalEl.querySelector('#btn-select-only-barcodes')?.addEventListener('click', () => {
      modalEl.querySelectorAll('.page-select-checkbox').forEach(cb => {
        const idx = parseInt(cb.value, 10);
        cb.checked = barcodeIndices.includes(idx);
      });
    });

    modalEl.querySelector('#btn-select-all-pages')?.addEventListener('click', () => {
      modalEl.querySelectorAll('.page-select-checkbox').forEach(cb => cb.checked = true);
    });

    modalEl.querySelector('#btn-clear-pages')?.addEventListener('click', () => {
      modalEl.querySelectorAll('.page-select-checkbox').forEach(cb => cb.checked = false);
    });

    modalEl.querySelector('#btn-execute-print-pages')?.addEventListener('click', async () => {
      const selected = Array.from(modalEl.querySelectorAll('.page-select-checkbox:checked')).map(cb => parseInt(cb.value, 10));

      if (selected.length === 0) {
        alert('Proszę zaznaczyć przynajmniej jedną stronę do wydruku.');
        return;
      }

      const btn = modalEl.querySelector('#btn-execute-print-pages');
      btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span><span>Wycinanie stron...</span>`;
      btn.disabled = true;

      try {
        const sliceRes = await slicePdfByPageIndices(pdfLibBuffer, selected);
        closeModal();

        const title = `Czysty PDF (${selected.length} str: ${sliceRes.pageNumbers.join(', ')}) - ${orderRef}`;

        if (openPreviewModal) {
          openPreviewModal(sliceRes.blobUrl, title);
        }

        const printWin = window.open(sliceRes.blobUrl, '_blank');
        if (!printWin && !openPreviewModal) {
          alert('Przeglądarka zablokowała wyskakujące okno wydruku. Zezwól na wyskakujące okna dla pestkalink.pl');
        }
      } catch (err) {
        alert(`Błąd wycinania stron: ${err.message || err}`);
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">print</span><span>DRUKUJ WYBRANE STRONY (1:1)</span>`;
        btn.disabled = false;
      }
    });

  } catch (err) {
    console.error('Błąd otwierania selektora stron PDF:', err);
    alert(`Błąd odczytu pliku PDF: ${err.message || err}`);
  } finally {
    if (onStatusChange) onStatusChange(null);
  }
}

/**
 * High-level function: opens page selector modal so user can pick exact pages
 */
export async function openAndPrintEcBarcodePdf(order, { openModal = null, onStatusChange = null } = {}) {
  return await openPdfPageSelectorModal(order, { openPreviewModal: openModal, onStatusChange });
}

/**
 * Generate ZPL for thermal printer
 */
export function generateCustomerBarcodeZpl(item, orderRef, customerName = 'BLUEMAKE') {
  const sku = (item.sku || '00000').trim();
  const symbol = (item.symbol || item.sku || '').trim();
  const name = (item.name || '').replace(`${symbol} - `, '').trim();
  const qty = `${Number(item.shippedQty || item.orderedQty || 1).toFixed(2).replace('.', ',')} szt`;
  const dateStr = new Date().toLocaleDateString('pl-PL');
  const ref = (orderRef || '').trim();

  return `^XA
^PW400
^LL240
^PON
^FO20,15^A0N,22,22^FD${sku}^FS
^FO150,15^A0N,20,20^FD${symbol.substring(0, 20)}^FS
^FO20,40^BY2,2,45^BCN,45,N,N,N^FD${sku}^FS
^FO20,95^A0N,18,18^FD${name.substring(0, 26)}^FS
^FO20,120^A0N,18,18^FDBLUEMAKE^FS
^FO20,145^A0N,20,20^FB150,1,0,L^FD${qty}^FS
^FO20,170^A0N,16,16^FD${dateStr}^FS
^FO180,120^BY1.5,2,35^BCN,35,N,N,N^FD${ref}^FS
^FO180,165^A0N,16,16^FD${ref.substring(0, 22)}^FS
^XZ`;
}

/**
 * Standard synthetic label generator (HTML/JsBarcode fallback)
 */
export function printCustomerLabelsHtml(orderOrCustomer, customItems = null) {
  let orderRef = '';
  let customerName = 'EC Engineering';
  let rawItems = [];

  if (orderOrCustomer && typeof orderOrCustomer === 'object') {
    orderRef = orderOrCustomer.orderRef || orderOrCustomer.orderNumber || orderOrCustomer.odooOrderName || '';
    customerName = orderOrCustomer.customerName || orderOrCustomer.category || 'EC Engineering';
    rawItems = customItems || orderOrCustomer.items || [];
  } else if (typeof orderOrCustomer === 'string') {
    customerName = orderOrCustomer;
    rawItems = customItems || [];
    orderRef = rawItems[0]?.orderRef || '';
  }

  if (!rawItems || rawItems.length === 0) {
    alert('Brak pozycji towarowych w zamówieniu do wygenerowania etykiet.');
    return;
  }

  const hasProduced = rawItems.some(it => it.producedQty !== undefined && parseFloat(it.producedQty) > 0);
  const items = hasProduced ? rawItems.filter(it => (it.producedQty !== undefined ? parseFloat(it.producedQty) : (parseFloat(it.orderedQty) || 1)) > 0) : rawItems;

  const dateStr = new Date().toLocaleDateString('pl-PL');

  const labelsHtml = items.map((item) => {
    const sku = (item.sku || '00000').trim();
    const symbol = (item.symbol || item.sku || '').trim();
    const name = (item.name || '').replace(`${symbol} - `, '').trim();
    const qVal = item.producedQty !== undefined && parseFloat(item.producedQty) > 0 
      ? parseFloat(item.producedQty) 
      : parseFloat(item.shippedQty || item.quantity || item.orderedQty || 1);
    const qty = `${Number(qVal).toFixed(2).replace('.', ',')} szt`;

    return `
      <div class="customer-label-card">
        <div class="header-row">
          <span class="sku-text">${sku}</span>
          <span class="symbol-text">${symbol}</span>
        </div>
        
        <div class="barcode-container">
          <svg class="barcode-sku" jsbarcode-value="${sku}" jsbarcode-format="CODE128" jsbarcode-width="2" jsbarcode-height="45" jsbarcode-displayValue="false"></svg>
        </div>

        <div class="product-title">${name}</div>
        <div class="company-badge">BLUEMAKE</div>

        <div class="footer-grid">
          <div class="qty-date-col">
            <div class="qty-val">${qty}</div>
            <div class="date-val">${dateStr}</div>
          </div>
          <div class="po-barcode-col">
            <svg class="barcode-po" jsbarcode-value="${orderRef}" jsbarcode-format="CODE128" jsbarcode-width="1.3" jsbarcode-height="30" jsbarcode-displayValue="false"></svg>
            <div class="po-text">${orderRef}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const fullDoc = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Etykiety Wysyłkowe do Paczki - ${orderRef}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    @page {
      size: 70mm 50mm !important;
      margin: 0mm !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    body {
      background: #f1f5f9;
      padding: 16px;
    }
    .no-print {
      max-width: 600px;
      margin: 0 auto 16px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .btn-print {
      background: #ff6b00;
      color: white;
      font-weight: bold;
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 15px;
    }
    .labels-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .customer-label-card {
      width: 70mm;
      height: 50mm;
      background: white;
      padding: 3mm 4mm;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      position: relative;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }
    .sku-text {
      font-size: 14px;
      font-family: monospace;
    }
    .symbol-text {
      font-size: 12px;
      color: #1e293b;
    }
    .barcode-container {
      margin: 2px 0;
      text-align: left;
    }
    .product-title {
      font-size: 11px;
      font-weight: bold;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .company-badge {
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.5px;
    }
    .footer-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 2px;
    }
    .qty-val {
      font-size: 13px;
      font-weight: 900;
      color: #000;
    }
    .date-val {
      font-size: 9px;
      color: #64748b;
    }
    .po-barcode-col {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .po-text {
      font-size: 9px;
      font-family: monospace;
      font-weight: bold;
      color: #334155;
    }
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .customer-label-card {
        border: none !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <h2 style="font-size: 16px; margin-bottom: 8px;">Etykiety Wysyłkowe do Paczki dla Klienta (Code 128)</h2>
    <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Zamówienie: <strong>${orderRef}</strong> • Ilość etykiet: ${items.length}</p>
    <button class="btn-print" onclick="window.print()">🖨️ DRUKUJ ETYKIETY</button>
  </div>

  <div class="labels-container">
    ${labelsHtml}
  </div>

  <script>
    window.onload = function() {
      try {
        JsBarcode(".barcode-sku").init();
        JsBarcode(".barcode-po").init();
      } catch(e) {
        console.error(e);
      }
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullDoc);
    printWindow.document.close();
  }
}
