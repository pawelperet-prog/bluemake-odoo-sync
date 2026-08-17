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

async function testBatch() {
  const templates = await rpc('product.template', 'search_read', [
    [['categ_id', '=', 5]]
  ], {
    fields: ['id', 'name', 'default_code', 'product_variant_ids']
  });

  console.log(`Liczba szablonów produktów w kategorii 'Produkt' (ID 5): ${templates.length}`);

  const attachments = await rpc('ir.attachment', 'search_read', [
    [['res_model', 'in', ['product.template', 'product.product']], '|', ['mimetype', 'ilike', 'pdf'], ['name', 'ilike', '.pdf']]
  ], {
    fields: ['id', 'name', 'res_model', 'res_id', 'file_size']
  });

  console.log(`Liczba powiązanych załączników PDF: ${attachments.length}`);
}

testBatch().catch(console.error);
