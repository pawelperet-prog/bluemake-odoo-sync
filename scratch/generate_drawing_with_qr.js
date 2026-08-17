import fs from 'fs';
import path from 'path';
import os from 'os';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function rpc(model, method, args, kwargs = {}) {
  const res = await fetch('https://odo.domowyasystent.online/jsonrpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          'odoo',
          9,
          'de5aa75b2e7d300edb383050742f785707bcea63',
          model,
          method,
          args,
          kwargs
        ]
      },
      id: Date.now()
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function run() {
  console.log('Szukam produktu z rysunkiem technicznym...');

  // Find products in 'Produkt' category with default_code and attachment
  const prods = await rpc('product.template', 'search_read', [
    [['categ_id', '=', 5], ['default_code', '!=', false]]
  ], {
    fields: ['id', 'name', 'default_code'],
    limit: 20
  });

  let selectedProd = null;
  let selectedAttachment = null;

  for (const p of prods) {
    const atts = await rpc('ir.attachment', 'search_read', [
      [['res_model', '=', 'product.template'], ['res_id', '=', p.id], ['mimetype', 'ilike', 'pdf']]
    ], {
      fields: ['id', 'name', 'datas', 'file_size']
    });

    if (atts.length > 0 && atts[0].datas) {
      selectedProd = p;
      selectedAttachment = atts[0];
      break;
    }
  }

  if (!selectedProd) {
    throw new Error('Nie znaleziono produktu z plikiem PDF!');
  }

  console.log(`Wybrano produkt: [${selectedProd.default_code}] ${selectedProd.name}`);
  console.log(`Załącznik PDF: ${selectedAttachment.name} (rozmiar: ${selectedAttachment.file_size} B)`);

  // Decode PDF base64
  const pdfBuffer = Buffer.from(selectedAttachment.datas, 'base64');

  // Generate QR code as PNG buffer
  // In our system, QR code contains the SKU / default_code (e.g. '00465')
  const qrCodeText = selectedProd.default_code;
  const qrPngBuffer = await QRCode.toBuffer(qrCodeText, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  console.log(`Liczba stron w dokumencie: ${pages.length}`);

  // Place QR stamp on all pages (or at least page 1) in the top-right corner
  pages.forEach((page, pageIndex) => {
    const { width, height } = page.getSize();
    console.log(`Strona ${pageIndex + 1}: ${width} x ${height} pt`);

    // Dimensions of the QR badge box
    const boxWidth = 140;
    const boxHeight = 65;
    const margin = 15; // margin from top and right border

    const boxX = width - boxWidth - margin;
    const boxY = height - boxHeight - margin;

    // Draw background white box with dark border to ensure maximum contrast and clear drawing boundary
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.1, 0.1, 0.1),
      borderWidth: 1.5,
    });

    // Inner subtle header strip
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

    // Draw QR image
    const qrSize = 42;
    page.drawImage(qrImage, {
      x: boxX + 5,
      y: boxY + 4,
      width: qrSize,
      height: qrSize,
    });

    // Draw text info next to QR
    const textX = boxX + qrSize + 10;
    
    page.drawText(`KOD SKU:`, {
      x: textX,
      y: boxY + 34,
      size: 7,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(`${selectedProd.default_code}`, {
      x: textX,
      y: boxY + 22,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`ID: ${selectedProd.id}`, {
      x: textX,
      y: boxY + 8,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  const modifiedPdfBytes = await pdfDoc.save();

  // Save to Desktop
  const homeDir = os.homedir();
  const desktopPath = path.join(homeDir, 'Desktop');
  const sanitizedFileName = `RYSUNEK_QR_${selectedProd.default_code}_${selectedAttachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const outPath = path.join(desktopPath, sanitizedFileName);

  fs.writeFileSync(outPath, modifiedPdfBytes);
  console.log(`\nSUKCES! Plik został zapisany na pulpicie:`);
  console.log(outPath);
}

run().catch(console.error);
