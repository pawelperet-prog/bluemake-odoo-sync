const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function updateAllPdfsInOdoo() {
  const dir = path.join(os.homedir(), 'Desktop', 'bluemake');
  if (!fs.existsSync(dir)) {
    throw new Error('Folder ' + dir + ' nie istnieje!');
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  console.log('Znaleziono ' + files.length + ' plikow PDF w ' + dir);

  console.log('Pobieranie listy zalacznikow z bazy Odoo...');
  const attachments = await rpc('ir.attachment', 'search_read', [[
    ['res_model', 'in', ['product.template', 'product.product']],
    '|',
    ['mimetype', 'ilike', 'pdf'],
    ['name', 'ilike', '.pdf']
  ]], { fields: ['id', 'name', 'res_model', 'res_id', 'file_size'] });

  console.log('Pobieranie produktow z Odoo...');
  const products = await rpc('product.product', 'search_read', [[]], {
    fields: ['id', 'name', 'default_code', 'product_tmpl_id']
  });

  let updatedCount = 0;
  let errors = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const filePath = path.join(dir, f);
    const fileBytes = fs.readFileSync(filePath);
    const b64Data = fileBytes.toString('base64');

    const matchSku = f.match(/^\[([^\]]+)\]_(.+)$/);
    const sku = matchSku ? matchSku[1] : null;
    const origName = matchSku ? matchSku[2] : f;

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

    if (targetAtts.length === 0) {
      console.warn('[' + (i+1) + '/' + files.length + '] Brak zalacznika w Odoo dla: ' + f);
      continue;
    }

    for (const att of targetAtts) {
      try {
        await rpc('ir.attachment', 'write', [
          [att.id],
          { datas: b64Data }
        ]);
        updatedCount++;
        console.log('[' + (i+1) + '/' + files.length + '] Zaktualizowano w Odoo: #' + att.id + ' (' + att.name + ')');
      } catch (err) {
        console.error('[' + (i+1) + '/' + files.length + '] Blad zapisu #' + att.id + ':', err.message);
        errors.push({ file: f, attId: att.id, error: err.message });
      }
    }
  }

  console.log('\n================ PODSUMOWANIE ================');
  console.log('Pomyslnie zaktualizowano w Odoo zalacznikow: ' + updatedCount);
  console.log('Bledy: ' + errors.length);
}

updateAllPdfsInOdoo().catch(console.error);
