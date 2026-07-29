/**
 * Polish Steel Market Reference Prices (Ceny Rynkowe Stali w Polsce PLN/kg)
 */

export const DEFAULT_MARKET_PRICES = {
  // Steel Grades (zł/kg)
  'S355': 4.50,
  'S235': 4.15,
  '1.4301': 17.50,
  'HM': 5.80,
  'HMT': 6.20,
  'C45': 5.10,
  '42CRMO4': 7.80,
  '16MNCR5': 6.90,
  'DEFAULT': 4.50
};

/**
 * Detailed Spec-Based Reference Price Finder
 * e.g. Pręt FI12 S355, Blacha 1.4301 2mm...
 */
export function getMarketReferencePrice(sku = '', name = '', grade = 'S355') {
  const text = ((sku || '') + ' ' + (name || '')).toUpperCase();

  // Stainless 1.4301
  if (grade === '1.4301' || text.includes('1.4301') || text.includes('304')) {
    return 17.50;
  }
  
  // High alloy / Hard steel
  if (grade === '42CRMO4') return 7.80;
  if (grade === '16MNCR5') return 6.90;
  if (grade === 'HMT') return 6.20;
  if (grade === 'HM') return 5.80;
  if (grade === 'C45') return 5.10;

  // Small diameter rods (e.g. FI 12) have a small drawing surcharge (+0.30 zł/kg)
  if (text.includes('FI12') || text.includes('FI 12')) {
    return 4.80; // Pręt FI12 S355
  }
  if (text.includes('FI10') || text.includes('FI 10') || text.includes('FI16')) {
    return 4.70;
  }

  // Carbon Steels
  if (grade === 'S235') return 4.15;
  if (grade === 'S355') return 4.50;

  return DEFAULT_MARKET_PRICES[grade] || DEFAULT_MARKET_PRICES['DEFAULT'];
}
