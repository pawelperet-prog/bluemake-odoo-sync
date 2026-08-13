import { generateQrSvg } from './qrGenerator.js';

/**
 * Generate 50mm x 30mm Printable QR Code Labels HTML
 */
export function generateQrLabelsHtml(products) {
  const activeProducts = (products || []).filter(p => p.sku && p.sku.trim().length > 0);
  const nowStr = new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });

  const labelCardsHtml = activeProducts.map(p => {
    const sku = p.sku;
    const name = p.name || 'Produkt';
    const category = p.categoryName || (p.categoryId === 4 ? 'Surowiec' : 'Produkt');
    const uom = p.uom || 'm';
    const qrSvg = generateQrSvg(sku, { size: 140, padding: 1 });

    return `
      <div class="qr-label-card">
        <div class="label-header">
          <span class="brand">BLUEMAKE</span>
          <span class="sku-badge">${sku}</span>
        </div>
        
        <div class="label-body">
          <div class="qr-wrapper">
            ${qrSvg}
          </div>
          <div class="info-wrapper">
            <div class="product-name" title="${name}">${name}</div>
            <div class="product-meta">
              <span class="meta-item">Strefa 5</span>
              <span class="meta-item font-mono font-bold">${Number(p.quantity || 0).toFixed(1)} ${uom}</span>
            </div>
          </div>
        </div>

        <div class="label-footer">
          <span>Odoo ID: ${p.id}</span>
          <span>${category}</span>
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
    /* CSS Reset & General Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 20px;
    }

    .no-print {
      max-w: 1000px;
      margin: 0 auto 20px auto;
      background: #ffffff;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e2e8f0;
    }

    .no-print h1 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }

    .no-print p {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .btn-group {
      display: flex;
      gap: 10px;
    }

    button {
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      border: none;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
    }

    .btn-primary {
      background-color: #ff6b00;
      color: #ffffff;
    }

    .btn-primary:hover {
      background-color: #e66000;
    }

    .btn-secondary {
      background-color: #1e293b;
      color: #ffffff;
    }

    .btn-secondary:hover {
      background-color: #0f172a;
    }

    /* Screen Grid Display */
    .labels-container {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* 50mm x 30mm Label Box Exact Specs */
    .qr-label-card {
      width: 50mm;
      height: 30mm;
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 2mm;
      padding: 1.5mm 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
      position: relative;
    }

    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 0.5pt solid #e2e8f0;
      padding-bottom: 1px;
    }

    .brand {
      font-size: 5pt;
      font-weight: 900;
      color: #ff6b00;
      letter-spacing: 0.5px;
    }

    .sku-badge {
      font-family: monospace;
      font-size: 7.5pt;
      font-weight: 800;
      color: #0f172a;
      background: #f8fafc;
      padding: 0 2px;
      border-radius: 1px;
      border: 0.3pt solid #cbd5e1;
    }

    .label-body {
      display: flex;
      align-items: center;
      gap: 2mm;
      flex: 1;
      margin: 1px 0;
    }

    .qr-wrapper {
      width: 19mm;
      height: 19mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-wrapper svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .info-wrapper {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1px;
    }

    .product-name {
      font-size: 6pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.15;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
    }

    .product-meta {
      display: flex;
      gap: 3px;
      font-size: 5.5pt;
      color: #475569;
      margin-top: 1px;
    }

    .meta-item {
      background: #f1f5f9;
      padding: 0.5px 2px;
      border-radius: 1px;
    }

    .label-footer {
      display: flex;
      justify-content: space-between;
      font-size: 4.5pt;
      color: #94a3b8;
      border-top: 0.4pt solid #f1f5f9;
      padding-top: 1px;
      font-weight: 600;
    }

    /* Print Specific Styles for 50x30mm Label Printers & Sticker Sheets */
    @media print {
      .no-print {
        display: none !important;
      }

      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .labels-container {
        display: block !important;
        margin: 0 !important;
        max-width: none !important;
      }

      .qr-label-card {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 50mm !important;
        height: 30mm !important;
        page-break-after: always !important;
        break-after: page !important;
        float: none !important;
      }

      @page {
        size: 50mm 30mm;
        margin: 0;
      }
    }
  </style>
</head>
<body>

  <!-- Controls (Hidden on Print) -->
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

  <!-- Label Grid / Sheet -->
  <div class="labels-container">
    ${labelCardsHtml}
  </div>

  <script>
    function downloadHtml() {
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Bluemake_Kody_QR_50x30mm.html';
      a.click();
    }
  </script>
</body>
</html>`;
}

export function openSingleQrLabelWindow(product) {
  if (!product) return;
  openQrLabelsWindow([product]);
}

export function openQrLabelsWindow(products) {
  const html = generateQrLabelsHtml(products);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    downloadQrLabelsHtml(products);
  }
}

export function downloadQrLabelsHtml(products) {
  const html = generateQrLabelsHtml(products);
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Bluemake_Kody_QR_50x30mm_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
}
