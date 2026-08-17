import fs from 'fs';
import path from 'path';
import os from 'os';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Use local fast connection directly to Odoo container
const ODOO_URL = process.env.ODOO_URL || 'http://192.168.1.65:8069/jsonrpc';
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

function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
}

async function processAll() {
  const desktopDir = path.join(os.homedir(), 'Desktop', 'bluemake');
  if (!fs.existsSync(desktopDir)) {
    fs.mkdirSync(desktopDir, { recursive: true });
  }

  console.log(`[1/4] Pobieram szablony produktów z kategorii 'Produkt' (ID 5)...`);
  const products = await rpc('product.template', 'search_read', [
    [['categ_id', '=', 5]]
  ], {
    fields: ['id', 'name', 'default_code', 'product_variant_ids', 'categ_id']
  });

  console.log(`Znaleziono ${products.length} produktów.`);

  console.log(`[2/4] Pobieram powiązania załączników PDF...`);
  const attachments = await rpc('ir.attachment', 'search_read', [
    [['res_model', '=', 'product.template'], '|', ['mimetype', 'ilike', 'pdf'], ['name', 'ilike', '.pdf']]
  ], {
    fields: ['id', 'name', 'res_id', 'file_size', 'mimetype']
  });

  console.log(`Znaleziono ${attachments.length} załączników PDF w bazie.`);

  const missingProducts = [];
  const processed = [];
  const errors = [];

  console.log(`\n[3/4] Nakładanie kodów QR, zapis na pulpicie i aktualizacja bazy Odoo...`);

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const prodAtts = attachments.filter(a => a.res_id === prod.id);

    if (prodAtts.length === 0) {
      missingProducts.push(prod);
      console.log(`[${i + 1}/${products.length}] ❌ BRAK PDF: [ID ${prod.id}] Kod: ${prod.default_code || '(brak)'} - ${prod.name}`);
      continue;
    }

    for (const att of prodAtts) {
      try {
        console.log(`[${i + 1}/${products.length}] 🔄 Przetwarzam: [ID ${prod.id}] ${prod.default_code || prod.name} (${att.name})...`);

        // Fetch attachment binary datas
        const attData = await rpc('ir.attachment', 'read', [[att.id], ['datas']]);
        const pdfBase64 = attData[0]?.datas;

        if (!pdfBase64) {
          console.warn(`   ⚠️ Brak danych datas dla załącznika #${att.id}`);
          continue;
        }

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

        // Generate QR code for SKU
        const qrValue = prod.default_code || `PROD_${prod.id}`;
        const qrPngBuffer = await QRCode.toBuffer(qrValue, {
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
          const boxWidth = 140;
          const boxHeight = 65;
          const margin = 15;

          const boxX = width - boxWidth - margin;
          const boxY = height - boxHeight - margin;

          // Background white box with clean solid border
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.1, 0.1, 0.1),
            borderWidth: 1.5,
          });

          // Top title bar
          page.drawRectangle({
            x: boxX,
            y: boxY + boxHeight - 16,
            width: boxWidth,
            height: 16,
            color: rgb(0.93, 0.95, 0.98),
            borderColor: rgb(0.1, 0.1, 0.1),
            borderWidth: 0,
          });

          page.drawText('KOD DETALU / QR', {
            x: boxX + 6,
            y: boxY + boxHeight - 12,
            size: 7.5,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
          });

          // QR Image
          const qrSize = 42;
          page.drawImage(qrImage, {
            x: boxX + 5,
            y: boxY + 4,
            width: qrSize,
            height: qrSize,
          });

          // Label texts
          const textX = boxX + qrSize + 10;
          page.drawText(`KOD SKU:`, {
            x: textX,
            y: boxY + 34,
            size: 7,
            font: fontRegular,
            color: rgb(0.4, 0.4, 0.4),
          });

          const displayCode = (prod.default_code || '').substring(0, 14);
          page.drawText(displayCode || `ID:${prod.id}`, {
            x: textX,
            y: boxY + 22,
            size: 10.5,
            font: fontBold,
            color: rgb(0, 0, 0),
          });

          page.drawText(`ID: ${prod.id}`, {
            x: textX,
            y: boxY + 8,
            size: 7.5,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          });
        }

        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

        // Save to Desktop/bluemake/
        const fileName = sanitizeFilename(`${prod.default_code ? `[${prod.default_code}]_` : ''}${att.name}`);
        const localFilePath = path.join(desktopDir, fileName);
        fs.writeFileSync(localFilePath, modifiedPdfBytes);

        // Update in Odoo
        await rpc('ir.attachment', 'write', [
          [att.id],
          { datas: modifiedBase64 }
        ]);

        processed.push({
          productId: prod.id,
          code: prod.default_code,
          name: prod.name,
          attId: att.id,
          fileName: fileName
        });
        console.log(`   ✅ Zapisano -> ${fileName} i zaktualizowano w Odoo (#${att.id})`);
      } catch (err) {
        console.error(`   ❌ Błąd dla produktu #${prod.id} (${att.name}):`, err.message);
        errors.push({ id: prod.id, name: prod.name, error: err.message });
      }
    }
  }

  console.log(`\n================== PODSUMOWANIE ==================`);
  console.log(`✅ Pomyślnie przetworzono i zaktualizowano: ${processed.length} rysunków PDF`);
  console.log(`📁 Wszystkie pliki zapisane na Pulpicie w: ${desktopDir}`);
  console.log(`❌ Produkty bez rysunku PDF: ${missingProducts.length}`);
  console.log(`⚠️ Błędy: ${errors.length}`);
}

processAll().catch(console.error);
