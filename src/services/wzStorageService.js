/**
 * WZ (Wydanie z Magazynu) Storage & Monthly Numbering Service
 */

const STORAGE_KEY_WZ_HISTORY = 'bluemake_wz_history_v2';
const STORAGE_KEY_WZ_COUNTERS = 'bluemake_wz_monthly_counters_v2';
const STORAGE_KEY_WZ_CUSTOMERS = 'bluemake_wz_customers_v2';

export const DEFAULT_SUPPLIER = {
  name: 'BLUEMAKE Sp. z o.o.',
  address: 'ul. Tuwima 39, 39-300 Mielec',
  nip: '8172210070',
  email: 'm.klimkowski@bluemake.eu, www.bluemake.eu'
};

export const DEFAULT_CUSTOMERS = [
  {
    id: 'cust_ec_eng',
    name: 'EC Engineering Sp. z o.o.',
    address: 'ul. Armii Krajowej 28, 30-150 Kraków',
    nip: 'PL9452024663',
    regon: '35690824',
    contact: 'office@ec-e.pl, www.ec-e.pl'
  },
  {
    id: 'cust_husqvarna',
    name: 'Husqvarna Poland Sp. z o.o.',
    address: 'ul. Wysockiego 15A, 03-371 Warszawa',
    nip: '5240103440',
    regon: '010156942',
    contact: 'kontakt@husqvarna.pl'
  }
];

export function getSavedCustomers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_CUSTOMERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading WZ customers:', e);
  }
  localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
  return DEFAULT_CUSTOMERS;
}

export function saveCustomer(customer) {
  const list = getSavedCustomers();
  const existingIdx = list.findIndex(c => c.id === customer.id || (customer.nip && c.nip === customer.nip));
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...customer };
  } else {
    list.unshift({ ...customer, id: customer.id || `cust_${Date.now()}` });
  }
  localStorage.setItem(STORAGE_KEY_WZ_CUSTOMERS, JSON.stringify(list));
  return list;
}

export function getWzHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error loading WZ history:', e);
    return [];
  }
}

export function saveWzDocument(wzDoc) {
  const history = getWzHistory();
  const idx = history.findIndex(w => w.id === wzDoc.id);
  const docWithMeta = {
    ...wzDoc,
    savedAt: new Date().toISOString(),
    formattedNumber: `Nr ${wzDoc.wzNum}/${wzDoc.wzMonth}/${wzDoc.wzYear}${wzDoc.wzSuffix || '/BM'}`
  };

  if (idx >= 0) {
    history[idx] = docWithMeta;
  } else {
    history.unshift(docWithMeta);
  }
  localStorage.setItem(STORAGE_KEY_WZ_HISTORY, JSON.stringify(history));
  return history;
}

export function deleteWzDocument(wzId) {
  const history = getWzHistory().filter(w => w.id !== wzId);
  localStorage.setItem(STORAGE_KEY_WZ_HISTORY, JSON.stringify(history));
  return history;
}

/**
 * Get the next WZ number for a given month and year (resets automatically every month to 1)
 */
export function getNextWzNumber(targetMonth = null, targetYear = null) {
  const now = new Date();
  const month = targetMonth || String(now.getMonth() + 1).padStart(2, '0');
  const year = targetYear || String(now.getFullYear());
  const key = `${year}-${month}`;
  
  try {
    const savedCounters = localStorage.getItem(STORAGE_KEY_WZ_COUNTERS);
    if (savedCounters) {
      const counters = JSON.parse(savedCounters);
      if (counters[key] !== undefined && counters[key] !== null) {
        return {
          num: counters[key],
          month: month,
          year: year,
          suffix: '/BM'
        };
      }
    }
  } catch (e) {}

  // Also check history for highest number in this month/year
  const history = getWzHistory();
  const monthDocs = history.filter(w => w.wzMonth === month && w.wzYear === year);
  if (monthDocs.length > 0) {
    const maxNum = Math.max(...monthDocs.map(w => parseInt(w.wzNum, 10) || 0));
    return {
      num: maxNum + 1,
      month: month,
      year: year,
      suffix: '/BM'
    };
  }

  return {
    num: 1,
    month: month,
    year: year,
    suffix: '/BM'
  };
}

/**
 * Increment and save counter for a specific month and year
 */
export function incrementWzCounter(usedNum, month, year) {
  const m = String(month).padStart(2, '0');
  const y = String(year);
  const key = `${y}-${m}`;

  let counters = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_COUNTERS);
    if (saved) counters = JSON.parse(saved);
  } catch (e) {}

  const currentVal = counters[key] || parseInt(usedNum, 10) || 1;
  const nextNum = Math.max((parseInt(usedNum, 10) || 1) + 1, currentVal + 1);
  
  counters[key] = nextNum;
  localStorage.setItem(STORAGE_KEY_WZ_COUNTERS, JSON.stringify(counters));
  return nextNum;
}
