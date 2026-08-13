import { generateQrSvg, renderQrInDom } from './qrGenerator.js';

/**
 * Generate HTML string for 50mm x 30mm Printable QR Code Labels
 */
export function generateQrLabelsHtml(products) {
  const activeProducts = (products || []).filter(p => p.sku && p.sku.trim().length > 0);
  const nowStr = new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });

  const labelCardsHtml = activeProducts.map((p, i) => {
    const sku = p.sku;
    const name = p.name || 'Produkt';
    const uom = p.uom || 'm';

    return `
      <div class="qr-label-card">
        <div class="qr-column">
          <div id="qr-blob-${i}" data-code="${sku.replace(/"/g,'&quot;')}"></div>
        </div>
        
        <div class="text-column">
          <div class="sku-badge">${sku}</div>
          <div class="product-name" title="${name}">${name}</div>
          <div class="label-footer">
            <span>Odoo ID: ${p.id}</span>
            <span>Stan: ${Number(p.quantity || 0).toFixed(1)}${uom}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Etykiety QR 50x30mm - Bluemake Odoo</title>
  <style>
    @page {
      size: 50mm 30mm !important;
      margin: 0mm !important;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }

    body { background-color: #cbd5e1; padding: 20px; }

    .no-print {
      max-width: 800px;
      margin: 0 auto 20px;
      background: #ffffff;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border: 1px solid #94a3b8;
    }
    
    .no-print h1 { font-size: 18px; color: #0f172a; margin-bottom: 6px; font-weight: bold; }
    .no-print p { font-size: 13px; color: #334155; line-height: 1.4; }
    .btn-print {
      background: #ff6b00;
      color: #fff;
      font-weight: bold;
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 12px;
      text-transform: uppercase;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .labels-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .qr-label-card {
      width: 50mm;
      height: 30mm;
      background: #ffffff;
      border: 1px dashed #64748b;
      border-radius: 2mm;
      padding: 1.5mm;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1.5mm;
      overflow: hidden;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .qr-column {
      width: 26mm;
      height: 26mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }

    .qr-column svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .text-column {
      flex: 1;
      min-width: 0;
      height: 26mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .sku-badge {
      font-family: monospace;
      font-size: 11pt;
      font-weight: 900;
      color: #000000;
      background: #f1f5f9;
      padding: 1px 3px;
      border-radius: 1px;
      border: 1px solid #000000;
      line-height: 1.1;
      word-break: break-all;
    }

    .product-name {
      font-size: 8.5pt;
      font-weight: 900;
      color: #000000;
      line-height: 1.15;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
    }

    .label-footer {
      display: flex;
      justify-content: space-between;
      font-size: 5.5pt;
      font-weight: 900;
      color: #000000;
      border-top: 1px solid #000;
      padding-top: 1px;
    }

    /* Print Specific Styles for 50x30mm Label Printers */
    @media print {
      @page {
        size: 50mm 30mm !important;
        margin: 0mm !important;
      }

      html, body {
        width: 50mm !important;
        height: 30mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .no-print {
        display: none !important;
      }

      .labels-grid {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 50mm !important;
        background: transparent !important;
      }

      .qr-label-card {
        width: 50mm !important;
        height: 30mm !important;
        max-width: 50mm !important;
        max-height: 30mm !important;
        margin: 0 !important;
        padding: 1.5mm !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        float: none !important;
        background: #ffffff !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <h1>🏷️ Etykiety Kodów QR (50mm x 30mm)</h1>
      <p>Wygenerowano ${activeProducts.length} etykiet z systemu Odoo • ${nowStr}</p>
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn-primary">
        🖨️ DRUKUJ ETYKIETY (50x30mm)
      </button>
      <button onclick="downloadHtml()" class="btn-secondary">
        📥 POBIERZ PLIK HTML
      </button>
    </div>
  </div>

  <div class="labels-grid">
    ${labelCardsHtml}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('[data-code]').forEach(function(el) {
        var code = el.getAttribute('data-code');
        if (code) {
          new QRCode(el, { text: code, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
        }
      });
    });
    function downloadHtml() {
      var blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Bluemake_Kody_QR_50x30mm.html';
      a.click();
    }
  <\/script>
</body>
</html>`;
}

export function openSingleQrLabelWindow(product) {
  if (!product) return;
  openQrLabelsWindow([product]);
}

/**
 * Open In-App Printable QR Label Modal (Compatible with Mobile Android/iOS & Desktop)
 */
export function openQrLabelsWindow(products) {
  const existing = document.getElementById('qr-modal-backdrop');
  if (existing) existing.remove();

  const activeProducts = (products || []).filter(p => p.sku && p.sku.trim().length > 0);

  const labelCardsPreviewHtml = activeProducts.map(p => {
    const sku = p.sku;
    const name = p.name || 'Produkt';
    const uom = p.uom || 'm';
    const safeSku = sku.replace(/"/g, '&quot;');

    return `
      <div class="qr-label-card bg-white border border-slate-300 rounded p-1.5 flex flex-row items-center justify-between gap-1.5 shadow-sm overflow-hidden" style="width: 50mm; height: 30mm; flex-shrink: 0;">
        <div class="w-[26mm] h-[26mm] flex-shrink-0 flex items-center justify-center bg-white">
          <div data-qr="${safeSku}" style="width:100%;height:100%;"></div>
        </div>
        
        <div class="flex-1 min-w-0 h-[26mm] flex flex-col justify-between overflow-hidden">
          <div class="font-mono text-[11pt] font-black text-black bg-slate-100 px-1 border border-black rounded-sm leading-tight break-all">${sku}</div>
          <div class="text-[8.5pt] font-black text-black leading-tight line-clamp-3 overflow-hidden text-ellipsis">${name}</div>
          <div class="flex justify-between text-[5.5pt] font-bold text-black border-t border-black pt-0.5">
            <span>ID: ${p.id}</span>
            <span>Stan: ${Number(p.quantity || 0).toFixed(1)}${uom}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div id="qr-modal-backdrop" class="fixed inset-0 bg-primary/70 backdrop-blur-md z-[150] flex items-center justify-center p-3">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-xl p-4 max-w-2xl w-full shadow-2xl flex flex-col gap-3 max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-outline-variant pb-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#ff6b00] text-2xl">qr_code_2</span>
            <div>
              <h2 class="font-bold text-primary text-base">Podgląd i Druk Etykiet QR (50x30mm)</h2>
              <p class="text-xs text-on-surface-variant">Liczba pozycji: ${activeProducts.length}</p>
            </div>
          </div>
          <button id="close-qr-modal-btn" class="p-1.5 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Controls -->
        <div class="flex flex-col sm:flex-row gap-2 justify-between items-center bg-surface-container p-2.5 rounded-lg border border-outline-variant/40">
          <span class="text-xs font-bold text-primary flex items-center gap-1">
            <span class="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
            Etykiety w formacie 50x30mm
          </span>
          
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <!-- Button 1: Direct System Print -->
            <button id="btn-print-modal-direct" class="flex-1 sm:flex-initial bg-[#ff6b00] hover:bg-[#e66000] text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center justify-center gap-1 shadow-md uppercase transition-transform active:scale-95">
              <span class="material-symbols-outlined text-[18px]">print</span> DRUKUJ (SYSTEM)
            </button>

            <!-- Button 2: Open Printable Blob Sheet (Mobile Friendly) -->
            <button id="btn-open-print-sheet" class="flex-1 sm:flex-initial bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1 shadow-md uppercase transition-transform active:scale-95">
              <span class="material-symbols-outlined text-[18px]">open_in_new</span> ARKUSZ DRUKU
            </button>

            <!-- Button 3: Download HTML File -->
            <button id="btn-download-modal-file" class="bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1 border border-outline-variant uppercase">
              <span class="material-symbols-outlined text-[18px]">download</span> POBIERZ PLIK
            </button>
          </div>
        </div>

        <!-- Preview Grid -->
        <div class="flex flex-wrap gap-3 justify-center p-3 bg-slate-200 rounded-lg max-h-[55vh] overflow-y-auto border border-slate-300">
          ${labelCardsPreviewHtml}
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-outline-variant flex justify-between items-center">
          <p class="text-[11px] text-on-surface-variant">Na telefonach z Androidem użyj przycisku <strong>ARKUSZ DRUKU</strong> lub <strong>POBIERZ PLIK</strong></p>
          <button id="btn-close-modal-bottom" class="bg-surface-container-high text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-surface-container-highest">
            ZAMKNIJ
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('qr-modal-backdrop');

  // Render QR codes into [data-qr] placeholder divs via qrcodejs CDN
  renderQrInDom(backdrop);
  const closeBtn = document.getElementById('close-qr-modal-btn');
  const closeBottomBtn = document.getElementById('btn-close-modal-bottom');
  const printBtn = document.getElementById('btn-print-modal-direct');
  const openSheetBtn = document.getElementById('btn-open-print-sheet');
  const downloadBtn = document.getElementById('btn-download-modal-file');

  const closeModal = () => backdrop.remove();
  closeBtn.addEventListener('click', closeModal);
  closeBottomBtn.addEventListener('click', closeModal);

  downloadBtn.addEventListener('click', () => {
    downloadQrLabelsHtml(activeProducts);
  });

  printBtn.addEventListener('click', () => {
    printLabelsDirectly(activeProducts);
  });

  openSheetBtn.addEventListener('click', () => {
    openPrintableBlobSheet(activeProducts);
  });
}

/**
 * Open Printable Blob Sheet HTML in new tab/blob for Mobile Android/iOS System Print Manager
 */
function openPrintableBlobSheet(products) {
  const html = generateQrLabelsHtml(products);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = blobUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 1000);
}

/**
 * Direct Print via In-App Hidden Iframe
 */
function printLabelsDirectly(products) {
  const fullHtml = generateQrLabelsHtml(products);

  const existingFrame = document.getElementById('app-print-frame');
  if (existingFrame) existingFrame.remove();

  const printFrame = document.createElement('iframe');
  printFrame.id = 'app-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.style.visibility = 'hidden';

  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print error:', e);
      window.print();
    }
  }, 350);
}

export function downloadQrLabelsHtml(products) {
  const html = generateQrLabelsHtml(products);
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Bluemake_Kody_QR_50x30mm_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
}
