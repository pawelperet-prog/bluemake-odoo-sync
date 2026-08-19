const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

const ODOO_URL = 'https://odo.domowyasystent.online/jsonrpc';
const DB = 'odoo';
const UID = 9;
const API_KEY = 'de5aa75b2e7d300edb383050742f785707bcea63';

async function rpc(model, method, args, kwargs = {}) {
  const res = await fetch(ODOO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [DB, UID, API_KEY, model, method, args, kwargs]
      },
      id: Date.now()
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function main() {
  const dir = path.join(os.homedir(), 'Desktop', 'bluemake');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  console.log(`[1/3] Znaleziono ${files.length} plikow do poprawy pozycji kodu QR.`);

  console.log('[2/3] Pobieranie informacji o zalacznikach z Odoo...');
  const attachments = await rpc('ir.attachment', 'search_read', [[
    ['res_model', 'in', ['product.template', 'product.product']],
    '|',
    ['mimetype', 'ilike', 'pdf'],
    ['name', 'ilike', '.pdf']
  ]], { fields: ['id', 'name', 'res_model', 'res_id'] });

  const products = await rpc('product.product', 'search_read', [[]], {
    fields: ['id', 'name', 'default_code', 'product_tmpl_id']
  });

  let processedCount = 0;
  let odooUpdatedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const filePath = path.join(dir, f);
    const buffer = fs.readFileSync(filePath);

    const matchSku = f.match(/^\[([^\]]+)\]_(.+)$/);
    const sku = matchSku ? matchSku[1] : (f.split('_')[0] || 'DETAL');
    const origName = matchSku ? matchSku[2] : f;

    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const qrPngBuffer = await QRCode.toBuffer(sku, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: { dark: '#000000', light: '#ffffff' }
      });

      const qrImage = await pdfDoc.embedPng(qrPngBuffer);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();

        // 1. Zamazanie starej pozycji w samym narozniku
        page.drawRectangle({
          x: width - 170,
          y: height - 90,
          width: 165,
          height: 85,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });

        // 2. Bezpieczna, elegancka pozycja wewnatrz ramki (odsunieta od krawedzi arkusza)
        const boxWidth = 135;
        const boxHeight = 60;
        
        // Odsuniecie w glab rysunku: 45pt z prawej (ok. 16mm), 25pt z gory
        const marginRight = 45;
        const marginTop = 25;

        const boxX = width - boxWidth - marginRight;
        const boxY = height - boxHeight - marginTop;

        // Biale tlo z wyrazna ciemna ramka
        page.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxWidth,
          height: boxHeight,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.15, 0.15, 0.15),
          borderWidth: 1.5,
        });

        // Belka naglowkowa
        page.drawRectangle({
          x: boxX,
          y: boxY + boxHeight - 16,
          width: boxWidth,
          height: 16,
          color: rgb(0.92, 0.94, 0.98),
          borderWidth: 0,
        });

        page.drawText('KOD DETALU / QR', {
          x: boxX + 6,
          y: boxY + boxHeight - 12,
          size: 7.5,
          font: fontBold,
          color: rgb(0.1, 0.2, 0.5),
        });

        // Kod QR w ramce
        const qrSize = 40;
        page.drawImage(qrImage, {
          x: boxX + 5,
          y: boxY + 2,
          width: qrSize,
          height: qrSize,
        });

        // Tekst SKU obok kodu QR
        page.drawText('SKU:', {
          x: boxX + qrSize + 10,
          y: boxY + boxHeight - 28,
          size: 7,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3),
        });

        page.drawText(String(sku).substring(0, 16), {
          x: boxX + qrSize + 10,
          y: boxY + boxHeight - 40,
          size: 10,
          font: fontBold,
          color: rgb(0.8, 0.1, 0.1),
        });

        page.drawText('BLUEMAKE', {
          x: boxX + qrSize + 10,
          y: boxY + 6,
          size: 6.5,
          font: fontBold,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      const modifiedBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, modifiedBytes);
      processedCount++;

      // Podmiana w Odoo
      const b64 = Buffer.from(modifiedBytes).toString('base64');
      let targetAtts = attachments.filter(a => 
        a.name.toLowerCase() === origName.toLowerCase() ||
        a.name.toLowerCase() === f.toLowerCase()
      );

      if (targetAtts.length === 0 && sku) {
        const p = products.find(prod => prod.default_code === sku);
        if (p) {
          targetAtts = attachments.filter(a => 
            (a.res_model === 'product.product' && a.res_id === p.id) ||
            (a.res_model === 'product.template' && Array.isArray(p.product_tmpl_id) && a.res_id === p.product_tmpl_id[0])
          );
        }
      }

      for (const att of targetAtts) {
        await rpc('ir.attachment', 'write', [[att.id], { datas: b64 }]);
        odooUpdatedCount++;
      }

      console.log(`[${i+1}/${files.length}] Poprawiono i zaktualizowano: ${f}`);
    } catch (err) {
      console.error(`Błąd przetwarzania ${f}:`, err.message);
    }
  }

  console.log('\n================ PODSUMOWANIE ================');
  console.log(`Poprawiono plikow na pulpicie: ${processedCount}/${files.length}`);
  console.log(`Zaktualizowano rekordow w Odoo: ${odooUpdatedCount}`);
}

main().catch(console.error);
