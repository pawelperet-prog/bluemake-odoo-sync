/**
 * QR Code Label Generator for CNC Soft Jaws (50x30mm / Zebra ZPL & Browser Print)
 */

export function generateJawZpl(jaw) {
  const code = jaw.id || 'SZ-00000';
  const sku = jaw.productSku || '';
  const name = (jaw.productName || 'Detal CNC').substring(0, 30);
  const location = (jaw.location || 'Warsztat').substring(0, 22);
  const vise = (jaw.viseType || 'Imadło').substring(0, 22);
  const op = (jaw.operation || 'OP1').substring(0, 22);

  // Standard ZPL for 50x30mm (203 DPI, 400x240 dots)
  return `
^XA
^PW400
^LL240
^PON
^LH0,0

; Header
^FO15,10^A0N,18,18^FD*** SZCZEKI MIEKKIE CNC ***^FS

; QR Code (Code: SZ-00329)
^FO15,35^BQN,2,4^FDQA,${code}^FS

; Jaw ID (Large font)
^FO125,35^A0N,30,30^FD${code}^FS

; Product SKU & Name
^FO125,70^A0N,18,18^FDDetal: ${sku}^FS
^FO125,92^A0N,16,16^FD${name}^FS

; Operation & Vise
^FO125,120^A0N,16,16^FD${op}^FS
^FO125,142^A0N,16,16^FD${vise}^FS

; Location bar at bottom
^FO15,190^GB370,40,2^FS
^FO25,200^A0N,20,20^FDLOK: ${location}^FS

^XZ
  `.trim();
}

export function printJawLabelHtml(jaw) {
  const code = jaw.id || 'SZ-00000';
  const sku = jaw.productSku || '';
  const name = jaw.productName || 'Detal CNC';
  const location = jaw.location || 'Warsztat / Szafa';
  const vise = jaw.viseType || 'Imadło maszynowe';
  const op = jaw.operation || 'OP1';
  const notes = jaw.notes || '';

  const printWindow = window.open('', '_blank', 'width=550,height=600');
  if (!printWindow) {
    alert('Zablokowano wyskakujące okno wydruku. Zezwól na okna popup.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <title>Etykieta Szczęk: ${code}</title>
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
          padding: 2mm;
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
          padding-bottom: 0.5mm;
          text-transform: uppercase;
        }
        .main-row {
          display: flex;
          align-items: center;
          gap: 2mm;
          flex: 1;
          padding: 1mm 0;
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
        .jaw-code {
          font-size: 11pt;
          font-weight: 900;
          letter-spacing: -0.3px;
        }
        .product-ref {
          font-size: 7.5pt;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
        <div class="header-tag">🗜️ SZCZĘKI MIĘKKIE CNC • SAMARKA</div>
        
        <div class="main-row">
          <div id="qrcode" class="qr-box"></div>
          <div class="info-col">
            <div class="jaw-code">${code}</div>
            <div class="product-ref">DETAL: ${sku}</div>
            <div class="meta-text">${name}</div>
            <div class="meta-text">⚙️ ${op}</div>
            <div class="meta-text">🏷️ GRAWERKA: <strong>${code}</strong></div>
          </div>
        </div>

        <div class="bottom-bar">
          <span>LOK: ${location}</span>
          <span>${code}</span>
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
