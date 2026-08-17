const fetch = globalThis.fetch;

async function rpc(model, method, args, kwargs = {}) {
  const res = await fetch('https://odo.domowyasystent.online/jsonrpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service: 'object', method: 'execute_kw', args: ['odoo', 9, 'de5aa75b2e7d300edb383050742f785707bcea63', model, method, args, kwargs] },
      id: 1
    })
  });
  return (await res.json()).result;
}

async function detailedCheck() {
  // Check all products including inactive
  const allTemplates = await rpc('product.template', 'search_read', [[]], {
    fields: ['id', 'name', 'default_code', 'categ_id', 'type', 'active', 'product_variant_ids', 'create_date', 'write_date']
  });

  const attachments = await rpc('ir.attachment', 'search_read', [
    ['|', ['mimetype', 'ilike', 'pdf'], ['name', 'ilike', '.pdf']]
  ], {
    fields: ['id', 'name', 'res_model', 'res_id', 'mimetype', 'file_size']
  });

  console.log(`Wszystkich szablonów produktów: ${allTemplates.length}`);
  console.log(`Wszystkich załączników PDF: ${attachments.length}`);

  const byCategory = {};
  for (const t of allTemplates) {
    const catName = t.categ_id ? t.categ_id[1] : 'BRAK KATEGORII';
    if (!byCategory[catName]) byCategory[catName] = [];
    byCategory[catName].push(t);
  }

  for (const [catName, prods] of Object.entries(byCategory)) {
    console.log(`\n=== Kategoria: ${catName} (Razem: ${prods.length}) ===`);
    const missing = [];
    const ok = [];

    for (const p of prods) {
      const variantIds = p.product_variant_ids || [];
      const pAtts = attachments.filter(a => 
        (a.res_model === 'product.template' && a.res_id === p.id) ||
        (a.res_model === 'product.product' && variantIds.includes(a.res_id))
      );
      if (pAtts.length > 0) {
        ok.push({ ...p, atts: pAtts });
      } else {
        missing.push(p);
      }
    }

    console.log(`   Posiada PDF: ${ok.length}`);
    console.log(`   BRAK PDF: ${missing.length}`);
    if (catName !== 'Surowiec' && missing.length > 0) {
      console.log(`   -> Lista brakujących w '${catName}':`);
      missing.forEach(m => {
        console.log(`      • [ID ${m.id}] [Kod: ${m.default_code || 'brak'}] ${m.name}`);
      });
    }
  }
}

detailedCheck().catch(console.error);
