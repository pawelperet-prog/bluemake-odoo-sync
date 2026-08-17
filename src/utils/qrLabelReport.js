import { renderQrInDom } from './qrGenerator.js';

/**
 * Generate full standalone HTML document for 50mm x 30mm Printable QR Code Labels
 */
export function generateQrLabelsHtml(products, autoPrint = false) {
  const activeProducts = (products || []).filter(p => p.sku && p.sku.trim().length > 0);

  const labelCardsHtml = activeProducts.map((p, i) => {
    const sku = (p.sku || '').replace(/"/g, '&quot;');
    const name = (p.name || 'Produkt').replace(/"/g, '&quot;');

    return `
      <div class="qr-label-card">
        <div class="qr-column">
          <div class="qr-target" data-qr="${sku}"></div>
        </div>
        <div class="text-column">
          <div class="sku-badge">${sku}</div>
          <div class="prod-name">${name}</div>
          <div class="label-footer">
            <span>ID: ${p.id}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Etykiety QR 50x30mm - Bluemake</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <style>
    @page {
      size: 50mm 30mm !important;
      margin: 0mm !important;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background-color: #f1f5f9;
      padding: 16px;
      color: #000000;
    }

    .no-print {
      max-width: 600px;
      margin: 0 auto 16px;
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #cbd5e1;
      text-align: center;
    }

    .no-print h1 {
      font-size: 16px;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .no-print p {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 12px;
    }

    .btn-print {
      background: #ff6b00;
      color: #ffffff;
      font-weight: 700;
      padding: 12px 28px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 15px;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(255,107,0,0.3);
    }

    .btn-print:hover {
      background: #e66000;
    }

    .labels-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }

    .qr-label-card {
      width: 50mm;
      height: 30mm;
      background: #ffffff;
      border: 1px dashed #94a3b8;
      border-radius: 2mm;
      padding: 1.5mm;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1.5mm;
      overflow: hidden;
      box-sizing: border-box;
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
      overflow: hidden;
    }

    .qr-column .qr-target,
    .qr-column img,
    .qr-column canvas {
      width: 26mm !important;
      height: 26mm !important;
      max-width: 26mm !important;
      max-height: 26mm !important;
      display: block !important;
      image-rendering: pixelated !important;
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
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10pt;
      font-weight: 900;
      color: #000000;
      background: #f8fafc;
      padding: 1px 3px;
      border: 1px solid #000000;
      border-radius: 1px;
      line-height: 1.1;
      word-break: break-all;
    }

    .prod-name {
      font-size: 8pt;
      font-weight: 800;
      color: #000000;
      line-height: 1.15;
      max-height: 14mm;
      overflow: hidden;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .label-footer {
      display: flex;
      justify-content: space-between;
      font-size: 5.5pt;
      font-weight: 800;
      color: #000000;
      border-top: 1px solid #000000;
      padding-top: 1px;
    }

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
        display: flex !important;
      }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <h1>🏷️ Etykiety 50mm x 30mm (${activeProducts.length} szt.)</h1>
    <p>Gotowe do druku na drukarce etykiet (Zebra, itp.)</p>
    <button onclick="triggerPrint()" class="btn-print">🖨️ DRUKUJ TERAZ</button>
  </div>

  <div class="labels-grid">
    ${labelCardsHtml}
  </div>

  <script>
    function renderAllQrs() {
      document.querySelectorAll('.qr-target').forEach(function(el) {
        var code = el.getAttribute('data-qr');
        if (code && !el.dataset.done) {
          el.dataset.done = '1';
          new QRCode(el, {
            text: code,
            width: 200,
            height: 200,
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      });
    }

    function triggerPrint() {
      window.print();
    }

    document.addEventListener("DOMContentLoaded", function() {
      renderAllQrs();
      ${autoPrint ? `setTimeout(function() { triggerPrint(); }, 400);` : ''}
    });
  </script>
</body>
</html>`;
}

/**
 * Open Single QR Label print modal
 */
export function openSingleQrLabelWindow(product) {
  if (!product) return;
  openQrLabelsWindow([product]);
}

/**
 * Open In-App Printable QR Label Modal with direct 1-click print
 */
export function openQrLabelsWindow(products) {
  const existing = document.getElementById('qr-modal-backdrop');
  if (existing) existing.remove();

  const activeProducts = (products || []).filter(p => p.sku && p.sku.trim().length > 0);
  if (activeProducts.length === 0) return;

  const labelCardsPreviewHtml = activeProducts.map(p => {
    const sku = (p.sku || '').replace(/"/g, '&quot;');
    const name = (p.name || 'Produkt').replace(/"/g, '&quot;');

    return `
      <div style="
        width: 290px;
        height: 174px;
        background: #ffffff;
        border: 1px solid #94a3b8;
        border-radius: 6px;
        padding: 8px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        overflow: hidden;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      ">
        <div style="width:140px;height:140px;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#ffffff;">
          <div data-qr="${sku}" style="width:140px;height:140px;"></div>
        </div>
        <div style="flex:1;min-width:0;height:140px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;">
          <div style="font-family:monospace;font-size:13px;font-weight:900;color:#000000;background:#f1f5f9;padding:2px 4px;border:1px solid #000000;border-radius:2px;word-break:break-all;line-height:1.2;">${sku}</div>
          <div style="font-size:11px;font-weight:800;color:#000000;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${name}</div>
          <div style="display:flex;justify-content:flex-start;font-size:9px;font-weight:800;color:#000000;border-top:1px solid #000000;padding-top:2px;">
            <span>ID: ${p.id}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div id="qr-modal-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-3">
      <div class="bg-white rounded-2xl p-4 max-w-xl w-full shadow-2xl flex flex-col gap-3 max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#ff6b00] text-2xl">qr_code_2</span>
            <div>
              <h2 class="font-bold text-gray-900 text-base">Etykiety QR (50x30mm)</h2>
              <p class="text-xs text-gray-500">${activeProducts.length} ${activeProducts.length === 1 ? 'pozycja' : 'pozycji'}</p>
            </div>
          </div>
          <button id="close-qr-modal-btn" class="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Single Clean Print Button -->
        <div class="flex flex-col gap-2">
          <button id="btn-direct-print-now" class="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-base shadow-lg uppercase transition-transform active:scale-98">
            <span class="material-symbols-outlined text-2xl">print</span>
            DRUKUJ (${activeProducts.length} szt. 50x30mm)
          </button>
          <div class="flex justify-between items-center text-[11px] text-gray-500 px-1">
            <span>Format: 50mm x 30mm</span>
            <button id="btn-open-in-tab" class="text-indigo-600 hover:underline font-bold">Otwórz pełny arkusz ↗</button>
          </div>
        </div>

        <!-- Preview Grid -->
        <div class="flex flex-wrap gap-3 justify-center p-3 bg-slate-100 rounded-xl max-h-[50vh] overflow-y-auto border border-slate-200">
          ${labelCardsPreviewHtml}
        </div>

        <!-- Footer -->
        <div class="pt-1 border-t border-gray-100 flex justify-end">
          <button id="btn-close-modal-bottom" class="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs hover:bg-gray-200">
            ZAMKNIJ
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('qr-modal-backdrop');

  // Render QR codes in preview
  renderQrInDom(backdrop);

  const closeModal = () => backdrop.remove();
  document.getElementById('close-qr-modal-btn').addEventListener('click', closeModal);
  document.getElementById('btn-close-modal-bottom').addEventListener('click', closeModal);

  // 1-Click Print: Creates print frame and triggers native window.print()
  document.getElementById('btn-direct-print-now').addEventListener('click', () => {
    printLabelsDirectly(activeProducts);
  });

  // Open Full Sheet in New Tab (useful for saving or inspecting)
  document.getElementById('btn-open-in-tab').addEventListener('click', () => {
    openPrintableBlobSheet(activeProducts);
  });
}

/**
 * Direct Print via In-App Hidden Iframe (Opens standard print dialog with 50x30mm CSS)
 */
function printLabelsDirectly(products) {
  const fullHtml = generateQrLabelsHtml(products, true);

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
}

/**
 * Open Printable Blob Sheet HTML in new tab for Mobile Android/iOS System Print
 */
function openPrintableBlobSheet(products) {
  const html = generateQrLabelsHtml(products, false);
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
