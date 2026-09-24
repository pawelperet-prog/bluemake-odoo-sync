import { logAuditAction, getCurrentOperator } from './authService.js';

/**
 * Service for Managing Cut Blanks / BOM Buffers (Pocięte przygotówki pod detal)
 * Persistence via LocalStorage
 */

const LOCAL_STORAGE_CUT_BUFFERS_KEY = 'bluemake_cut_buffers_db_v1';

// Initial sample cut buffer
const SAMPLE_BUFFERS = [
  {
    id: 'BOM-00329',
    productSku: '00329',
    productName: '160W 210-2-04 - Korpus / Detal',
    productId: 412,
    rawMaterialSku: 'RM-FL-50X20-S355',
    rawMaterialName: 'Płaskownik 50x20 S355',
    grade: 'S355',
    dimensions: '50x20 x 140mm',
    cutLengthMm: 140,
    quantity: 40,
    location: 'Paleta P-12',
    operator: 'Paweł',
    dateFormatted: new Date().toLocaleDateString('pl-PL'),
    createdAt: new Date().toISOString()
  }
];

export function getCutBuffers() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CUT_BUFFERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading cut buffers:', e);
  }
  localStorage.setItem(LOCAL_STORAGE_CUT_BUFFERS_KEY, JSON.stringify(SAMPLE_BUFFERS));
  return SAMPLE_BUFFERS;
}

export function saveCutBuffersList(list) {
  localStorage.setItem(LOCAL_STORAGE_CUT_BUFFERS_KEY, JSON.stringify(list));
}

export function getCutBufferBySku(sku) {
  if (!sku) return null;
  const list = getCutBuffers();
  const searchSku = String(sku).trim().toUpperCase();
  return list.find(b => 
    (b.productSku && b.productSku.toUpperCase() === searchSku) ||
    b.id.toUpperCase() === `BOM-${searchSku}`
  ) || null;
}

export function getCutBufferById(id) {
  if (!id) return null;
  const list = getCutBuffers();
  const searchId = String(id).trim().toUpperCase();
  return list.find(b => b.id.toUpperCase() === searchId) || null;
}

export function saveCutBufferRecord(record, operatorName = null) {
  if (!record || !record.productSku) throw new Error('Brak numeru SKU detalu');

  const list = getCutBuffers();
  const sku = String(record.productSku).trim().toUpperCase();
  const id = record.id || `BOM-${sku}`;
  const now = new Date().toISOString();

  const cleanRecord = {
    ...record,
    id: id.toUpperCase(),
    productSku: sku,
    productName: record.productName || 'Detal CNC',
    productId: record.productId || null,
    rawMaterialSku: record.rawMaterialSku || '',
    rawMaterialName: record.rawMaterialName || 'Surowiec',
    grade: (record.grade || 'S355').toUpperCase(),
    dimensions: record.dimensions || `${record.cutLengthMm || 140}mm`,
    cutLengthMm: Number(record.cutLengthMm) || 140,
    quantity: Number(record.quantity) || 1,
    location: record.location || 'Paleta buforowa',
    operator: record.operator || operatorName || getCurrentOperator()?.name || 'Operator',
    dateFormatted: new Date().toLocaleDateString('pl-PL'),
    updatedAt: now
  };

  const existingIndex = list.findIndex(b => b.id.toUpperCase() === cleanRecord.id.toUpperCase() || b.productSku.toUpperCase() === sku);
  const isNew = existingIndex < 0;

  if (existingIndex >= 0) {
    list[existingIndex] = {
      ...list[existingIndex],
      ...cleanRecord
    };
  } else {
    cleanRecord.createdAt = now;
    list.unshift(cleanRecord);
  }

  saveCutBuffersList(list);

  logAuditAction({
    category: 'STOCK',
    action: isNew ? '✂️ UCIĘCIE PRZYGOTÓWKI (BOM)' : '✂️ AKTUALIZACJA BUFORA BOM',
    details: `Ucięto ${cleanRecord.quantity} szt. ${cleanRecord.dimensions} dla ${cleanRecord.productSku} (Lokalizacja: ${cleanRecord.location})`,
    sku: cleanRecord.productSku,
    operator: cleanRecord.operator,
    status: 'SUCCESS'
  });

  return cleanRecord;
}

export function deleteCutBufferRecord(idOrSku, operatorName = null) {
  if (!idOrSku) return false;
  const list = getCutBuffers();
  const search = String(idOrSku).trim().toUpperCase();
  const found = list.find(b => b.id.toUpperCase() === search || b.productSku.toUpperCase() === search);
  const filtered = list.filter(b => b.id.toUpperCase() !== search && b.productSku.toUpperCase() !== search);
  saveCutBuffersList(filtered);

  logAuditAction({
    category: 'STOCK',
    action: '🗑️ USUNIĘCIE / ZUŻYCIE BUFORA BOM',
    details: `Oznaczono bufor ${found?.id || search} (${found?.quantity || 0} szt. dla ${found?.productSku || search}) jako zużyty`,
    sku: found?.productSku,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'INFO'
  });

  return true;
}
