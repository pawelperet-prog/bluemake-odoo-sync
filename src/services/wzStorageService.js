/**
 * WZ (Wydanie z Magazynu) Storage & Numbering Service
 */

const STORAGE_KEY_WZ_HISTORY = 'bluemake_wz_history_v1';
const STORAGE_KEY_WZ_COUNTER = 'bluemake_wz_counter_v1';
const STORAGE_KEY_WZ_CUSTOMERS = 'bluemake_wz_customers_v1';

export const DEFAULT_SUPPLIER = {
  name: 'BLUEMAKE SPÓŁKA Z O.O.',
  address: '39-300 Mielec, Tuwima 39',
  nip: '8172210070',
  email: 'm.klimkowski@bluemake.eu'
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
  if (idx >= 0) {
    history[idx] = wzDoc;
  } else {
    history.unshift(wzDoc);
  }
  localStorage.setItem(STORAGE_KEY_WZ_HISTORY, JSON.stringify(history));
  return history;
}

export function deleteWzDocument(wzId) {
  const history = getWzHistory().filter(w => w.id !== wzId);
  localStorage.setItem(STORAGE_KEY_WZ_HISTORY, JSON.stringify(history));
  return history;
}

export function getNextWzNumber() {
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = String(now.getFullYear());
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WZ_COUNTER);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.year === currentYear && data.month === currentMonth) {
        return {
          num: data.nextNum || 1,
          month: currentMonth,
          year: currentYear,
          suffix: '/WZ/BM'
        };
      }
    }
  } catch (e) {}

  return {
    num: 1,
    month: currentMonth,
    year: currentYear,
    suffix: '/WZ/BM'
  };
}

export function incrementWzCounter(usedNum, month, year) {
  const nextNum = (parseInt(usedNum, 10) || 1) + 1;
  localStorage.setItem(STORAGE_KEY_WZ_COUNTER, JSON.stringify({
    nextNum,
    month,
    year
  }));
}
