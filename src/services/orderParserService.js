import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Parse Multi-Page PDF Document into Structured Customer Order Data
 */
export async function parseOrderPdf(fileOrArrayBuffer) {
  let arrayBuffer;
  if (fileOrArrayBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrArrayBuffer;
  } else if (fileOrArrayBuffer instanceof Blob || fileOrArrayBuffer instanceof File) {
    arrayBuffer = await fileOrArrayBuffer.arrayBuffer();
  } else {
    throw new Error('Nieprawidłowy format pliku PDF');
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let allPagesText = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Sort items by Y descending, then X ascending for natural line order
    const items = textContent.items.map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5]
    }));

    // Group by line threshold (~5px)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) return b.y - a.y;
      return a.x - b.x;
    });

    let lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of items) {
      if (lastY === null || Math.abs(item.y - lastY) <= 5) {
        currentLine.push(item.str);
      } else {
        if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
        currentLine = [item.str];
      }
      lastY = item.y;
    }
    if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());

    const pageJoined = lines.join('\n');
    allPagesText.push(pageJoined);
    fullText += `\n--- STRONA ${pageNum} ---\n` + pageJoined;
  }

  return extractOrderDetailsFromText(fullText, allPagesText);
}

/**
 * Extract Structured Order from Combined Text
 */
export function extractOrderDetailsFromText(fullText, pages = []) {
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 1. Numer zamówienia (np. ZZ-330/10/2025/EC, ZAM/2026/01, PO-12345)
  let orderRef = '';
  const orderRefMatch = fullText.match(/(?:nr|numer|zamówienie\s+na\s+zakup\s+nr|zamówienie\s+nr)\s*[:.]?\s*([A-Z0-9_\-\/]{4,35})/i) ||
                        fullText.match(/\b(ZZ-[A-Z0-9_\-\/]+)\b/i) ||
                        fullText.match(/\b(PO-[A-Z0-9_\-\/]+)\b/i);
  if (orderRefMatch) {
    orderRef = orderRefMatch[1].trim();
  }

  // 2. Klient (np. EC Engineering, Comarch, ABB, etc.)
  let customerName = 'EC Engineering Sp. z o.o.';
  if (/EC\s*Engineering/i.test(fullText)) {
    customerName = 'EC Engineering Sp. z o.o.';
  } else {
    // Try to find company name near top
    const compMatch = fullText.match(/(?:Nabywca|Klient|Kupujący|Zamawiający|Odbiorca)\s*[:.]?\s*([^\n\r]{3,60})/i);
    if (compMatch) customerName = compMatch[1].trim();
  }

  // 3. Daty
  let orderDate = new Date().toISOString().split('T')[0];
  const dateMatch = fullText.match(/(?:Data\s+wystawienia|Data\s+zamówienia|Wystawiono|Data)\s*[:.]?\s*(\d{4}[-.\/]\d{2}[-.\/]\d{2}|\d{2}[-.\/]\d{2}[-.\/]\d{4})/i);
  if (dateMatch) {
    const rawDate = dateMatch[1].replace(/[\.\/]/g, '-');
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      orderDate = rawDate;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
      const p = rawDate.split('-');
      orderDate = `${p[2]}-${p[1]}-${p[0]}`;
    }
  }

  let deliveryDate = orderDate;
  const delMatch = fullText.match(/(?:Data\s+realizacji|Termin\s+dostawy|Termin\s+realizacji|Dostawa\s+do)\s*[:.]?\s*(\d{4}[-.\/]\d{2}[-.\/]\d{2}|\d{2}[-.\/]\d{2}[-.\/]\d{4})/i);
  if (delMatch) {
    const rawDel = delMatch[1].replace(/[\.\/]/g, '-');
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDel)) {
      deliveryDate = rawDel;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDel)) {
      const p = rawDel.split('-');
      deliveryDate = `${p[2]}-${p[1]}-${p[0]}`;
    }
  }

  // 4. Pozycje zamówienia (Tabela)
  const items = [];
  
  // Wyszukiwanie pozycji tabelarycznych typu:
  // 00601 P400_257000-006-02 2025-10-21 11 szt 50,00 550,00 23%
  // lub Lp | Kod | Nazwa | Ilość | Cena
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern A: Comarch ERP XL standard order line
    // e.g. "1  00601  P400_257000-006-02  Obudowa przycisku  11 szt  50,00"
    const comarchMatch = line.match(/^(\d{1,3})\s+([A-Za-z0-9_\-\.]{3,20})\s+([A-Za-z0-9_\-\.]{3,35})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*(szt|m|kg|kpl)?\s+(\d+(?:[.,]\d+)?)/i);
    
    if (comarchMatch) {
      const lp = parseInt(comarchMatch[1], 10);
      const sku = comarchMatch[2].trim();
      const symbol = comarchMatch[3].trim();
      let name = comarchMatch[4].trim();
      const qty = parseFloat(comarchMatch[5].replace(',', '.'));
      const uom = comarchMatch[6] || 'szt';
      const price = parseFloat(comarchMatch[7].replace(',', '.'));

      items.push({
        id: `line_${Date.now()}_${items.length}`,
        lp,
        sku,
        symbol,
        name: `${symbol} - ${name}`,
        orderedQty: qty,
        shippedQty: qty,
        uom,
        unitPrice: price,
        vat: 23,
        isPrototype: /^zn/i.test(sku) || /^proto/i.test(sku) || /^p_/i.test(sku),
        inStock: 0,
        odooProductId: null
      });
      continue;
    }

    // Pattern B: SKU + Drawing + Qty in line (np. "00601 P400_257000-006-02 ... 11 szt 50,00")
    const flexibleMatch = line.match(/\b([0-9]{4,6}|[A-Z0-9_\-]{4,15})\s+([A-Z0-9_\-\.]{5,35})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*(szt|m|kg)?\s+(\d+(?:[.,]\d+)?)/i);
    if (flexibleMatch && !line.includes('Zamówienie') && !line.includes('Comarch') && !line.includes('Strona')) {
      const sku = flexibleMatch[1].trim();
      const symbol = flexibleMatch[2].trim();
      let name = flexibleMatch[3].trim();
      const qty = parseFloat(flexibleMatch[4].replace(',', '.'));
      const uom = flexibleMatch[5] || 'szt';
      const price = parseFloat(flexibleMatch[6].replace(',', '.'));

      if (!isNaN(qty) && qty > 0 && !items.some(it => it.sku === sku && it.symbol === symbol)) {
        items.push({
          id: `line_${Date.now()}_${items.length}`,
          lp: items.length + 1,
          sku,
          symbol,
          name: `${symbol} - ${name}`,
          orderedQty: qty,
          shippedQty: qty,
          uom,
          unitPrice: price,
          vat: 23,
          isPrototype: /^zn/i.test(sku) || /^proto/i.test(sku),
          inStock: 0,
          odooProductId: null
        });
      }
    }
  }

  // Jeśli nie dopasowało standardowej tabeli, wyszukajmy kody rysunków lub kody 5-cyfrowe
  if (items.length === 0) {
    const rawMatches = fullText.match(/\b([0-9]{5})\b[^\n]*\b([A-Z0-9_]{5,30}\-[0-9]{2,3})\b/g);
    if (rawMatches) {
      rawMatches.forEach((rm, idx) => {
        const parts = rm.split(/\s+/);
        items.push({
          id: `line_${Date.now()}_${idx}`,
          lp: idx + 1,
          sku: parts[0],
          symbol: parts[1] || parts[0],
          name: parts[1] ? `${parts[1]} (Detal)` : `Detal ${parts[0]}`,
          orderedQty: 1,
          shippedQty: 1,
          uom: 'szt',
          unitPrice: 50.0,
          vat: 23,
          isPrototype: /^zn/i.test(parts[0]),
          inStock: 0,
          odooProductId: null
        });
      });
    }
  }

  return {
    id: `ORD_${Date.now()}`,
    orderRef: orderRef || `ZAM-${new Date().toISOString().slice(2,10).replace(/-/g,'')}`,
    customerName: customerName || 'Klient',
    orderDate,
    deliveryDate,
    notes: '',
    items,
    syncStatus: 'DRAFT',
    rawText: fullText
  };
}
