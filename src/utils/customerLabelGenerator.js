import { sendZplViaMqtt } from '../services/mqttService.js';

/**
 * Generate Printable Logistics Barcode Label for Customer Orders (Matching Page 3 of EC Engineering PO)
 * Supports Zebra Thermal Printer (ZPL via MQTT/ESP32) and Browser Printable HTML (50x30mm or 100x70mm)
 */

export function generateCustomerBarcodeZpl(item, orderRef, customerName = 'BLUEMAKE') {
  const sku = (item.sku || '00000').trim();
  const symbol = (item.symbol || item.sku || '').trim();
  const name = (item.name || '').replace(`${symbol} - `, '').trim();
  const qty = `${Number(item.shippedQty || item.orderedQty || 1).toFixed(2).replace('.', ',')} szt`;
  const dateStr = new Date().toLocaleDateString('pl-PL');
  const ref = (orderRef || '').trim();

  // ZPL for 50x30mm / 70x50mm Thermal Label with Code 128
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

export function printCustomerLabelsHtml(order) {
  const items = order.items || [];
  const orderRef = order.orderRef || '';
  const dateStr = new Date().toLocaleDateString('pl-PL');

  const labelsHtml = items.map((item, idx) => {
    const sku = (item.sku || '00000').trim();
    const symbol = (item.symbol || item.sku || '').trim();
    const name = (item.name || '').replace(`${symbol} - `, '').trim();
    const qty = `${Number(item.shippedQty || item.orderedQty || 1).toFixed(2).replace('.', ',')} szt`;

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
