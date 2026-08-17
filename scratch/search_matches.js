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

async function searchAttachments() {
  const terms = ['00359', '210-2-04', '04383', '210-4-02', '310-4-05', '640-4-01', 'PCU', '132000', 'ec-vac_000010', 'ZN000000', 'PPD', '160W_200-5-05'];
  for (const term of terms) {
    const res = await rpc('ir.attachment', 'search_read', [[['name', 'ilike', term]]], {
      fields: ['id', 'name', 'res_model', 'res_id']
    });
    console.log(`Wyniki dla '${term}':`, res);
  }
}
searchAttachments().catch(console.error);
