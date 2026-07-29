/**
 * Utility for Steel Weight Calculations & Grade Parsing
 */

export const STEEL_GRADES = ['S355', '1.4301', 'HM', 'HMT', 'S235', 'C45', '42CRMO4', '16MNCR5'];

export function parseMaterialType(sku = '', name = '') {
  const text = (sku + ' ' + name).toUpperCase();
  if (text.includes('BLACHA') || text.startsWith('BL-') || text.includes('2500X1250')) {
    return 'BLACHA';
  }
  if (text.includes('PŁASKOWNIK') || text.includes('PLASKOWNIK') || text.startsWith('PL-')) {
    return 'PŁASKOWNIK';
  }
  if (text.includes('PRĘT') || text.includes('PRET') || text.includes('FI')) {
    return 'PRĘT';
  }
  return 'INNE';
}

export function parseSteelGrade(sku = '', name = '') {
  const text = (sku + ' ' + name).toUpperCase();
  if (text.includes('1.4301') || text.includes('304') || text.includes('NIERDZEWKA')) return '1.4301';
  if (text.includes('HMT')) return 'HMT';
  if (text.includes('HM')) return 'HM';
  if (text.includes('S355')) return 'S355';
  if (text.includes('S235')) return 'S235';
  if (text.includes('C45')) return 'C45';
  if (text.includes('42CRMO4')) return '42CRMO4';
  if (text.includes('16MNCR5')) return '16MNCR5';
  return 'INNE';
}

/**
 * Calculate weight in kg based on shape, dimensions, and quantity
 */
export function calculateWeightKg(product) {
  const text = ((product.sku || '') + ' ' + (product.name || '')).toUpperCase();
  const type = parseMaterialType(product.sku, product.name);
  const grade = parseSteelGrade(product.sku, product.name);
  const qty = typeof product.quantity === 'number' ? product.quantity : 0;

  // Density: Carbon steel = 7.85 kg/dm3 (7850 kg/m3), Stainless 1.4301 = 7.93 kg/dm3 (7930 kg/m3)
  const density = (grade === '1.4301') ? 7930 : 7850;

  if (type === 'BLACHA') {
    // Standard format 2500x1250mm (2.5m x 1.25m = 3.125 m2)
    // Extract thickness in mm (e.g. 3MM or 1.5MM)
    const matchThick = text.match(/([0-9]+(?:\.[0-9]+)?)\s*MM/);
    const thicknessMm = matchThick ? parseFloat(matchThick[1]) : 2.0;

    // Weight per sheet (kg) = 2.5m * 1.25m * (thicknessMm / 1000m) * density (kg/m3)
    const weightPerSheet = 2.5 * 1.25 * (thicknessMm / 1000.0) * density;
    return Number((weightPerSheet * qty).toFixed(2));
  } 
  else if (type === 'PRĘT') {
    // Extract diameter FI (e.g. FI 40 -> 40mm)
    const matchFi = text.match(/FI\s*([0-9]+)/);
    const diameterMm = matchFi ? parseFloat(matchFi[1]) : 30.0;
    const radiusM = (diameterMm / 2.0) / 1000.0;

    // Weight per meter (kg/m) = PI * r^2 * 1m * density
    const weightPerMeter = Math.PI * Math.pow(radiusM, 2) * density;
    return Number((weightPerMeter * qty).toFixed(2));
  }
  else if (type === 'PŁASKOWNIK') {
    // Extract dimensions e.g. 10X50 -> 10mm x 50mm
    const matchDim = text.match(/([0-9]+)X([0-9]+)/);
    const tMm = matchDim ? parseFloat(matchDim[1]) : 10.0;
    const wMm = matchDim ? parseFloat(matchDim[2]) : 50.0;

    // Weight per meter (kg/m) = (tMm/1000) * (wMm/1000) * 1m * density
    const weightPerMeter = (tMm / 1000.0) * (wMm / 1000.0) * density;
    return Number((weightPerMeter * qty).toFixed(2));
  }
  else {
    // Default fallback: 10kg per unit
    return Number((10.0 * qty).toFixed(2));
  }
}

/**
 * Format steel specs text (e.g. 2500x1250x3mm)
 */
export function formatSpecs(product) {
  const text = ((product.sku || '') + ' ' + (product.name || '')).toUpperCase();
  const type = parseMaterialType(product.sku, product.name);

  if (type === 'BLACHA') {
    const matchThick = text.match(/([0-9]+(?:\.[0-9]+)?)\s*MM/);
    const thick = matchThick ? matchThick[1] : '2';
    return `2500 x 1250 x ${thick} mm`;
  }
  if (type === 'PRĘT') {
    const matchFi = text.match(/FI\s*([0-9]+)/);
    const fi = matchFi ? matchFi[1] : '30';
    return `Ø ${fi} mm (Pręt)`;
  }
  if (type === 'PŁASKOWNIK') {
    const matchDim = text.match(/([0-9]+)X([0-9]+)/);
    return matchDim ? `${matchDim[1]} x ${matchDim[2]} mm` : 'Płaskownik';
  }
  return 'Wymiar wg SKU';
}
