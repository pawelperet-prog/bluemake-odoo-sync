const fetch = globalThis.fetch;

async function rpc(model, method, args, kwargs = {}) {
  const payload = {
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
  };
  const res = await fetch('https://odo.domowyasystent.online/jsonrpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(JSON.stringify(data.error));
  }
  return data.result;
}

async function main() {
  console.log('Fetching all product templates & products...');

  // Get all product templates
  const templates = await rpc('product.template', 'search_read', [[]], {
    fields: ['id', 'name', 'default_code', 'categ_id', 'type', 'active', 'product_variant_ids']
  });

  console.log(`Found ${templates.length} product templates.`);

  // Get all product.product
  const products = await rpc('product.product', 'search_read', [[]], {
    fields: ['id', 'name', 'default_code', 'categ_id', 'type', 'active', 'product_tmpl_id']
  });
  console.log(`Found ${products.length} product variants.`);

  // Check ir.attachment
  const attachments = await rpc('ir.attachment', 'search_read', [[
    ['res_model', 'in', ['product.template', 'product.product', 'mrp.bom', 'mrp.production']]
  ]], {
    fields: ['id', 'name', 'res_model', 'res_id', 'mimetype', 'file_size', 'type']
  });
  console.log(`Found ${attachments.length} attachments on product/mrp models.`);

  // Also check all ir.attachment in general
  const allAttachments = await rpc('ir.attachment', 'search_read', [[]], {
    fields: ['id', 'name', 'res_model', 'res_id', 'mimetype', 'file_size']
  });
  console.log(`Found ${allAttachments.length} total attachments in system.`);

  // Let's filter templates excluding "Surowiec" (categ_id[0] === 4 or name containing surowiec)
  const nonSurowceTemplates = templates.filter(t => {
    const categName = t.categ_id ? t.categ_id[1] : '';
    const categId = t.categ_id ? t.categ_id[0] : 0;
    return categId !== 4 && !categName.toLowerCase().includes('surow') && t.active;
  });

  console.log(`\n=== Non-Surowce Templates (${nonSurowceTemplates.length}) ===`);
  for (const t of nonSurowceTemplates) {
    const tmplAttachments = allAttachments.filter(a => 
      (a.res_model === 'product.template' && a.res_id === t.id) ||
      (a.res_model === 'product.product' && t.product_variant_ids && t.product_variant_ids.includes(a.res_id)) ||
      (a.name && t.default_code && a.name.includes(t.default_code))
    );

    const pdfAttachments = tmplAttachments.filter(a => 
      (a.mimetype && a.mimetype.includes('pdf')) || 
      (a.name && a.name.toLowerCase().endsWith('.pdf'))
    );

    console.log(`\nID: ${t.id} | Code: ${t.default_code || 'BRAK'} | Name: ${t.name} | Categ: ${t.categ_id ? t.categ_id[1] : 'BRAK'}`);
    console.log(`   PDFs (${pdfAttachments.length}):`, pdfAttachments.map(a => `${a.name} (${a.res_model} #${a.res_id})`));
    if (pdfAttachments.length === 0) {
      console.log(`   --> BRAK PDF!`);
    }
  }

  console.log('\n--- All Attachments in system ---');
  for (const a of allAttachments) {
    if (a.mimetype === 'application/pdf' || (a.name && a.name.endsWith('.pdf'))) {
      console.log(`PDF: ID ${a.id} | Name: ${a.name} | Model: ${a.res_model} | ResID: ${a.res_id}`);
    }
  }
}

main().catch(console.error);
