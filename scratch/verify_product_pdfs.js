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
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function analyze() {
  const categories = await rpc('product.category', 'search_read', [[]], {
    fields: ['id', 'name', 'complete_name']
  });
  console.log('Kategorie w Odoo:', categories);

  const rawMaterialCatIds = categories
    .filter(c => c.name.toLowerCase().includes('surow') || c.complete_name.toLowerCase().includes('surow'))
    .map(c => c.id);
  console.log('ID kategorii surowców (wykluczane):', rawMaterialCatIds);

  const templates = await rpc('product.template', 'search_read', [[]], {
    fields: ['id', 'name', 'default_code', 'categ_id', 'type', 'active', 'product_variant_ids', 'create_date']
  });

  const attachments = await rpc('ir.attachment', 'search_read', [
    ['|', ['mimetype', 'ilike', 'pdf'], ['name', 'ilike', '.pdf']]
  ], {
    fields: ['id', 'name', 'res_model', 'res_id', 'mimetype', 'file_size']
  });

  console.log(`Pobrano szablonów produktów: ${templates.length}`);
  console.log(`Pobrano wszystkich załączników PDF: ${attachments.length}`);

  const productsToCheck = templates.filter(t => {
    const catId = t.categ_id ? t.categ_id[0] : null;
    return !rawMaterialCatIds.includes(catId);
  });

  console.log(`\nLiczba produktów do weryfikacji (bez surowców): ${productsToCheck.length}`);

  const missingPdf = [];
  const withPdf = [];

  for (const p of productsToCheck) {
    const variantIds = p.product_variant_ids || [];
    
    // Find matching attachments
    const matched = attachments.filter(a => {
      if (a.res_model === 'product.template' && a.res_id === p.id) return true;
      if (a.res_model === 'product.product' && variantIds.includes(a.res_id)) return true;
      return false;
    });

    if (matched.length === 0) {
      // Check if maybe attachment is named similarly to code or name
      const fuzzyMatched = attachments.filter(a => {
        if (p.default_code && a.name.toLowerCase().includes(p.default_code.toLowerCase())) return true;
        return false;
      });

      missingPdf.push({
        id: p.id,
        code: p.default_code || '(brak kodu)',
        name: p.name,
        category: p.categ_id ? p.categ_id[1] : 'Brak',
        active: p.active,
        fuzzyMatches: fuzzyMatched.map(f => `${f.name} (model: ${f.res_model}, res_id: ${f.res_id})`)
      });
    } else {
      withPdf.push({
        id: p.id,
        code: p.default_code || '(brak kodu)',
        name: p.name,
        category: p.categ_id ? p.categ_id[1] : 'Brak',
        pdfs: matched.map(m => m.name)
      });
    }
  }

  console.log(`\n================ WYNIKI ANALIZY ================`);
  console.log(`Produkty Z załącznikiem PDF: ${withPdf.length}`);
  console.log(`Produkty BEZ załącznika PDF: ${missingPdf.length}`);

  if (missingPdf.length > 0) {
    console.log(`\nLISTA PRODUKTÓW BEZ ZAŁĄCZNIKA PDF:`);
    missingPdf.forEach((item, idx) => {
      console.log(`${idx + 1}. [ID ${item.id}] [Kod: ${item.code}] ${item.name} (Kategoria: ${item.category})`);
      if (item.fuzzyMatches.length > 0) {
        console.log(`   * Uwaga: Znaleziono pasujący załącznik w bazie, ale nie podpięty bezpośrednio: ${item.fuzzyMatches.join(', ')}`);
      }
    });
  } else {
    console.log('\nWszystkie produkty (poza surowcami) posiadają przypisany plik PDF!');
  }

  // Check also if any attachments exist on raw materials or orphaned
  const orphanedPdf = attachments.filter(a => {
    if (a.res_model === 'product.template') {
      const tmpl = templates.find(t => t.id === a.res_id);
      return !tmpl;
    }
    return false;
  });
  if (orphanedPdf.length > 0) {
    console.log(`\nSieroce załączniki PDF (produkt usunięty?):`, orphanedPdf.map(o => o.name));
  }
}

analyze().catch(console.error);
