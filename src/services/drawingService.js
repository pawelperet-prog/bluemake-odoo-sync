import { getProductAttachments, getAttachmentData } from './odooApi.js';

let cachedDrawingsManifest = null;

/**
 * Fetch list of drawing files available in public /orders_pdf/
 */
export async function getDrawingsManifest() {
  if (cachedDrawingsManifest && cachedDrawingsManifest.length > 0) {
    return cachedDrawingsManifest;
  }
  try {
    const res = await fetch('/orders_pdf/drawings_manifest.json');
    if (res.ok) {
      cachedDrawingsManifest = await res.json();
      return cachedDrawingsManifest;
    }
  } catch (err) {
    console.warn('Nie udało się pobrać drawings_manifest.json, używam fallbacku', err);
  }
  return [];
}

/**
 * Find drawing PDF file by SKU, symbol, or name
 * First checks local /orders_pdf/ (over 400 drawings), then falls back to Odoo attachments
 */
export async function findItemDrawingPdf(sku, symbol, name) {
  const normSku = (sku || '').trim().toLowerCase();
  const normSym = (symbol || '').trim().toLowerCase().replace(/[\s\-_]/g, '');
  const normName = (name || '').trim().toLowerCase();

  const manifest = await getDrawingsManifest();

  if (manifest && manifest.length > 0) {
    // 1. Match by SKU (if valid SKU and not dummy ZN000000)
    if (normSku && normSku !== 'zn000000' && normSku.length >= 4) {
      const bySku = manifest.find(f => {
        const lower = f.toLowerCase();
        return lower.startsWith(normSku + ' ') || 
               lower.startsWith(normSku + '-') || 
               lower.startsWith(normSku + '_') || 
               lower.includes(normSku);
      });
      if (bySku) {
        return {
          url: `/orders_pdf/${encodeURIComponent(bySku)}`,
          fileName: bySku,
          source: 'local'
        };
      }
    }

    // 2. Match by Symbol (normalized alphanumeric)
    if (normSym && normSym.length >= 4) {
      const bySym = manifest.find(f => {
        const fNorm = f.toLowerCase().replace(/\.pdf$/i, '').replace(/[\s\-_]/g, '');
        return fNorm.includes(normSym) || normSym.includes(fNorm);
      });
      if (bySym) {
        return {
          url: `/orders_pdf/${encodeURIComponent(bySym)}`,
          fileName: bySym,
          source: 'local'
        };
      }
    }

    // 3. Match by partial drawing filename
    if (normSku && normSku.length >= 3) {
      const byPartial = manifest.find(f => f.toLowerCase().includes(normSku));
      if (byPartial) {
        return {
          url: `/orders_pdf/${encodeURIComponent(byPartial)}`,
          fileName: byPartial,
          source: 'local'
        };
      }
    }
  }

  // 4. Fallback: Search in Odoo Attachments (ir.attachment)
  try {
    let atts = await getProductAttachments(null, null, sku || symbol);
    if ((!atts || atts.length === 0) && symbol && symbol !== sku) {
      atts = await getProductAttachments(null, null, symbol);
    }
    if ((!atts || atts.length === 0) && name) {
      atts = await getProductAttachments(null, null, name);
    }

    if (atts && atts.length > 0) {
      const attData = await getAttachmentData(atts[0].id);
      if (attData && attData.datas) {
        const byteCharacters = atob(attData.datas);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        return {
          url: blobUrl,
          fileName: atts[0].name || `${sku || symbol}.pdf`,
          source: 'odoo'
        };
      }
    }
  } catch (err) {
    console.warn('Błąd wyszukiwania rysunku w Odoo:', err);
  }

  return null;
}
