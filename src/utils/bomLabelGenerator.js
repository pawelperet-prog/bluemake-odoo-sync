/**
 * QR Code Label Generator for Cut Blanks / BOM Buffers (50x30mm / Zebra ZPL & Browser Print)
 */

export function generateBomZpl(buf) {
  const code = buf.id || `BOM-${buf.productSku || '00000'}`;
  const sku = buf.productSku || '';
  const grade = buf.grade || 'S355';
  const qty = buf.quantity || 1;
  const location = buf.location || 'Paleta';
  const dims = buf.dimensions || `${buf.cutLengthMm || 140}mm`;
  const name = (buf.productName || 'Detal CNC').substring(0, 26);

  // 50x30mm (203 DPI, 400x240 dots)
  return `
^XA
^PW400
^LL240
^PON
^LH0,0

; Header
^FO15,10^A0N,18,18^FD*** PRZYGOTOWKI BOM (CIETE) ***^FS

; QR Code (BOM-00329)
^FO15,35^BQN,2,4^FDQA,${code}^FS

; Code ID & Grade
^FO125,35^A0N,28,28^FD${code}^FS
^FO125,65^A0N,22,22^FDGATUNEK: ${grade}^FS

; Qty & Dimensions
^FO125,95^A0N,20,20^FDILOSC: ${qty} SZT.^FS
^FO125,120^A0N,16,16^FDWymiar: ${dims}^FS
^FO125,142^A0N,16,16^FDDetal: ${sku} - ${name}^FS

; Location bar
^FO15,190^GB370,40,2^FS
^FO25,200^A0N,20,20^FDLOK: ${location}^FS

^XZ
  `.trim();
}

export function printBomLabelHtml(buf) {
  const code = buf.id || `BOM-${buf.productSku || '00000'}`;
  const sku = buf.productSku || '';
  const grade = (buf.grade || 'S355').toUpperCase();
  const qty = buf.quantity || 1;
  const location = buf.location || 'Paleta buforowa';
  const dims = buf.dimensions || `${buf.cutLengthMm || 140}mm`;
  const name = buf.productName || 'Detal CNC';
  const date = buf.dateFormatted || new Date().toLocaleDateString('pl-PL');

  const printWindow = window.open('', '_blank', 'width=550,height=600');
  if (!printWindow) {
    alert('Zablokowano okno wydruku. Zezwól na okna popup.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <title>Etykieta BOM: ${code}</title>
      <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
      <style>
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .label-card {
          width: 50mm;
          height: 30mm;
          background: #fff;
          border: 1px solid #000;
          padding: 1.8mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-inside: avoid;
          overflow: hidden;
        }
        .header-tag {
          font-size: 6.5pt;
          font-weight: 900;
          text-align: center;
          letter-spacing: 0.5px;
          border-bottom: 0.8px solid #000;
          padding-bottom: 0.4mm;
          text-transform: uppercase;
        }
        .main-row {
          display: flex;
          align-items: center;
          gap: 2mm;
          flex: 1;
          padding: 0.8mm 0;
        }
        .qr-box {
          width: 17mm;
          height: 17mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .info-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex: 1;
          overflow: hidden;
          line-height: 1.15;
        }
        .code-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .bom-code {
          font-size: 10.5pt;
          font-weight: 900;
          letter-spacing: -0.3px;
        }
        .grade-badge {
          font-size: 8pt;
          font-weight: 900;
          background: #000;
          color: #fff;
          padding: 0.5mm 1.5mm;
          border-radius: 2px;
        }
        .qty-row {
          font-size: 8pt;
          font-weight: 900;
          color: #000;
          margin-top: 0.5mm;
        }
        .meta-text {
          font-size: 6.5pt;
          color: #222;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bottom-bar {
          background: #000;
          color: #fff;
          font-size: 7pt;
          font-weight: 800;
          padding: 0.8mm 1.5mm;
          display: flex;
          justify-content: space-between;
          border-radius: 1px;
        }
        .actions-panel {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
        .btn {
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: bold;
          font-size: 12px;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-close {
          background: #475569;
        }
        @media print {
          body {
            background: none;
            padding: 0;
            min-height: auto;
          }
          .actions-panel {
            display: none !important;
          }
          .label-card {
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="label-card">
        <div class="header-tag">📦 PRZYGOTÓWKI BOM (CIĘTE) • BLUEMAKE</div>
        
        <div class="main-row">
          <div id="qrcode" class="qr-box"></div>
          <div class="info-col">
            <div class="code-row">
              <div class="bom-code">${code}</div>
              <div class="grade-badge">${grade}</div>
            </div>
            <div class="qty-row">ILOŚĆ: <strong>${qty} SZT.</strong></div>
            <div class="meta-text">WYMIAR: <strong>${dims}</strong></div>
            <div class="meta-text">DETAL: ${sku} - ${name}</div>
          </div>
        </div>

        <div class="bottom-bar">
          <span>LOK: ${location}</span>
          <span>${date}</span>
        </div>
      </div>

      <div class="actions-panel">
        <button class="btn" onclick="window.print()">🖨️ DRUKUJ ETYKIETĘ</button>
        <button class="btn btn-close" onclick="window.close()">ZAMKNIJ</button>
      </div>

      <script>
        new QRCode(document.getElementById("qrcode"), {
          text: "${code}",
          width: 60,
          height: 60,
          correctLevel: QRCode.CorrectLevel.M
        });
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
