/**
 * Service for Managing Soft Jaws (Szczęki Miękkie) Database
 * Persistence via LocalStorage + Odoo metadata integration
 */

const LOCAL_STORAGE_SOFT_JAWS_KEY = 'bluemake_soft_jaws_db_v1';

// Default initial sample soft jaws
const SAMPLE_JAWS = [
  {
    id: 'SZ-00601',
    productSku: '00601',
    productName: '160W 210-2-04 - Obudowa / Korpus',
    productId: 412,
    operation: 'OP2 - Frezowanie spodu i fazowanie',
    location: 'Szafa A / Półka 2',
    viseType: 'Imadło Gerardi 150mm',
    status: 'READY', // 'READY' | 'IN_USE' | 'TO_MAKE'
    photo: null,
    notes: 'Baza na lewym zderzaku. Docisk 30 Nm. Program: O20601_OP2.NC',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getSoftJaws() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SOFT_JAWS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading soft jaws:', e);
  }
  // Initialize with sample jaws
  localStorage.setItem(LOCAL_STORAGE_SOFT_JAWS_KEY, JSON.stringify(SAMPLE_JAWS));
  return SAMPLE_JAWS;
}

export function saveSoftJawsList(list) {
  localStorage.setItem(LOCAL_STORAGE_SOFT_JAWS_KEY, JSON.stringify(list));
}

/**
 * Extracts base SKU from Jaw ID (e.g. 'SZ-00329-OP2' -> '00329', 'SZ-00329' -> '00329')
 */
export function extractBaseSkuFromJawId(jawId) {
  if (!jawId) return '';
  const clean = String(jawId).trim().toUpperCase();
  const match = clean.match(/^SZ[-_]([A-Z0-9]+)(?:[-_]OP(\d+))?/i);
  if (match) {
    return match[1];
  }
  return clean.replace(/^SZ[-_]/i, '').split('-')[0];
}

export function getJawsById(id) {
  if (!id) return null;
  const list = getSoftJaws();
  const searchId = String(id).trim().toUpperCase();
  return list.find(j => j.id.toUpperCase() === searchId) || null;
}

export function getJawsByProductSku(sku) {
  if (!sku) return [];
  const list = getSoftJaws();
  const searchSku = String(sku).trim().toUpperCase();
  return list.filter(j => {
    if (j.productSku && j.productSku.toUpperCase() === searchSku) return true;
    const baseSku = extractBaseSkuFromJawId(j.id);
    return baseSku.toUpperCase() === searchSku || j.id.toUpperCase().includes(searchSku);
  });
}

export function saveJawsRecord(record) {
  if (!record || !record.id) throw new Error('Brak identyfikatora szczęk (np. SZ-00329)');
  
  const list = getSoftJaws();
  const normalizedId = String(record.id).trim().toUpperCase();
  const now = new Date().toISOString();

  const existingIndex = list.findIndex(j => j.id.toUpperCase() === normalizedId);

  const cleanRecord = {
    ...record,
    id: normalizedId,
    productSku: record.productSku ? String(record.productSku).trim() : '',
    productName: record.productName || 'Detal CNC',
    productId: record.productId || null,
    operation: record.operation || 'OP1',
    location: record.location || 'Warsztat / Szafa Narzędziowa',
    viseType: record.viseType || 'Imadło maszynowe',
    status: record.status || 'READY',
    photo: record.photo || null,
    notes: record.notes || '',
    updatedAt: now
  };

  if (existingIndex >= 0) {
    list[existingIndex] = {
      ...list[existingIndex],
      ...cleanRecord,
      createdAt: list[existingIndex].createdAt || now
    };
  } else {
    cleanRecord.createdAt = now;
    list.unshift(cleanRecord);
  }

  saveSoftJawsList(list);
  return cleanRecord;
}

export function deleteJawsRecord(id) {
  if (!id) return false;
  const list = getSoftJaws();
  const normalizedId = String(id).trim().toUpperCase();
  const filtered = list.filter(j => j.id.toUpperCase() !== normalizedId);
  saveSoftJawsList(filtered);
  return true;
}
