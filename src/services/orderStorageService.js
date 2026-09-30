import { logAuditAction, getCurrentOperator } from './authService.js';

const ORDERS_STORAGE_KEY = 'bluemake_saved_orders_db_v4';

// Pre-seeded 2026 orders for all companies
export const INITIAL_ORDERS_2026 = [
  // --- EC ENGINEERING (W trakcie / Otwarte) ---
  {
    id: 'ORD_EC_ZZ_295_07_2026',
    orderRef: 'ZZ-295-07-2026',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-09-08',
    deliveryDate: '2026-09-08',
    productionStatus: 'IN_PRODUCTION', // 'IN_PRODUCTION' | 'PRODUCED'
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00068',
    odooOrderId: 68,
    items: [
      {
        id: 'ec_295_1',
        sku: '160W_300-3-04',
        name: 'Pantograf i wycieraczka (wałek drążony i rura główna ETC)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 28762.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_1_09_2026_ZN',
    orderRef: 'ZZ-1-09-2026-ZN',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-09-15',
    deliveryDate: '2026-09-15',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00069',
    odooOrderId: 69,
    items: [
      {
        id: 'ec_1_1',
        sku: '00365',
        name: 'Nowy wałek drążony - 3szt',
        orderedQty: 3,
        shippedQty: 3,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 250.00,
        uom: 'szt'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_72_09_2026',
    orderRef: 'ZZ-72/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-09-23',
    deliveryDate: '2026-09-23',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00070',
    odooOrderId: 70,
    items: [
      {
        id: 'ec_72_1',
        sku: '08294',
        name: 'Wsporniki malowane i prowadzenie',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 6720.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_190_08_2026',
    orderRef: 'ZZ-190/08/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-09-28',
    deliveryDate: '2026-09-28',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00071',
    odooOrderId: 71,
    items: [
      {
        id: 'ec_190_1',
        sku: 'PODNOZEK',
        name: 'Części do toalety i podnóżka',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 12362.90,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_8_09_2026',
    orderRef: 'ZZ-8/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-09-29',
    deliveryDate: '2026-09-29',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00072',
    odooOrderId: 72,
    items: [
      {
        id: 'ec_8_1',
        sku: '11018',
        name: 'Prototyp do panto - płyty rozdzielcze i bloki',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 760.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_69_09_2026',
    orderRef: 'ZZ-69/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-09-29',
    deliveryDate: '2026-09-29',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00073',
    odooOrderId: 73,
    items: [
      {
        id: 'ec_69_1',
        sku: '00434',
        name: 'Nowe półksiężyce (mały)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 7800.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_136_09_2026',
    orderRef: 'ZZ-136/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-13',
    deliveryDate: '2026-10-13',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00074',
    odooOrderId: 74,
    items: [
      {
        id: 'ec_136_1',
        sku: '00434',
        name: 'Półksiężyc PPD',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 11500.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_151_09_2026',
    orderRef: 'ZZ-151/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-14',
    deliveryDate: '2026-10-14',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00075',
    odooOrderId: 75,
    items: [
      {
        id: 'ec_151_1',
        sku: 'K0044',
        name: 'Usługa malowania i obróbki Wspornik napędu RAL 7021',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 6300.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_79_09_2026',
    orderRef: 'ZZ-79/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-15',
    deliveryDate: '2026-10-15',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00076',
    odooOrderId: 76,
    items: [
      {
        id: 'ec_79_1',
        sku: 'PANTOGRAF',
        name: 'Pantograf (bloki alu i wałki drążone)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 27594.30,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_184_09_2026',
    orderRef: 'ZZ-184-09-2026',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-15',
    deliveryDate: '2026-10-15',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00077',
    odooOrderId: 77,
    items: [
      {
        id: 'ec_184_1',
        sku: 'ODLEW',
        name: 'Usługa obróbki Ramię (Odlew)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 10044.00,
        uom: 'szt'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_23_09_2026',
    orderRef: 'ZZ-23-09-2026-ZN',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-19',
    deliveryDate: '2026-10-19',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00078',
    odooOrderId: 78,
    items: [
      {
        id: 'ec_23_1',
        sku: '00434',
        name: 'Półksiężyc PPD komplet',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 30360.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_220_09_2026',
    orderRef: 'ZZ-220/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-21',
    deliveryDate: '2026-10-21',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00079',
    odooOrderId: 79,
    items: [
      {
        id: 'ec_220_1',
        sku: '01353',
        name: 'Przepusty i tulejki montażowe itd.',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 16062.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_78_09_2026',
    orderRef: 'ZZ-78/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-10-28',
    deliveryDate: '2026-10-28',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00080',
    odooOrderId: 80,
    items: [
      {
        id: 'ec_78_1',
        sku: '00476',
        name: 'Rurka stabilizująca - tylko ofrezować',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 12496.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_EC_ZZ_241_09_2026',
    orderRef: 'ZZ-241/09/2026/EC',
    customerName: 'EC Engineering',
    category: 'EC Engineering',
    orderDate: '2026-11-04',
    deliveryDate: '2026-11-04',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'SYNCED_ODOO',
    odooOrderName: 'S00081',
    odooOrderId: 81,
    items: [
      {
        id: 'ec_241_1',
        sku: '120ECI_LIZBONA',
        name: 'Lizbona (Króćce, ceowniki, blokady, trzpienie)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 10964.00,
        uom: 'kpl'
      }
    ]
  },

  // --- MV CENTER ---
  {
    id: 'ORD_MVC_07_05_2026_1',
    orderRef: 'MVC-07.05.2026-V1',
    customerName: 'MV CENTER',
    category: 'MV CENTER',
    orderDate: '2026-05-07',
    deliveryDate: '2026-05-20',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'mvc_1',
        sku: 'MVC_OSL_V1',
        name: 'Osłona kamera linijkowa blok v1',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 1450.00,
        uom: 'szt'
      },
      {
        id: 'mvc_2',
        sku: 'MVC_OSL_V2',
        name: 'Osłona kamera linijkowa blok v2',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 1450.00,
        uom: 'szt'
      }
    ]
  },
  {
    id: 'ORD_MVC_07_05_2026_2',
    orderRef: 'MVC-07.05.2026-PO6',
    customerName: 'MV CENTER',
    category: 'MV CENTER',
    orderDate: '2026-05-07',
    deliveryDate: '2026-05-25',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'mvc_3',
        sku: 'MVC_UCHWYT_V2',
        name: 'Uchwyt podstawowy kamera linijkowa v2',
        orderedQty: 6,
        shippedQty: 6,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 420.00,
        uom: 'szt'
      }
    ]
  },

  // --- ZMJ ---
  {
    id: 'ORD_ZMJ_16_03_2026',
    orderRef: 'ZMJ-16.03.2026',
    customerName: 'ZMJ',
    category: 'ZMJ',
    orderDate: '2026-03-16',
    deliveryDate: '2026-03-24',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'zmj_1',
        sku: 'MFT.08.19.01',
        name: 'Detal MFT.08.19.01',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 1,
        productionStatus: 'PRODUCED',
        unitPrice: 850.00,
        uom: 'szt'
      },
      {
        id: 'zmj_2',
        sku: 'MFT.08.19.02',
        name: 'Detal MFT.08.19.02',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 1,
        productionStatus: 'PRODUCED',
        unitPrice: 920.00,
        uom: 'szt'
      }
    ]
  },
  {
    id: 'ORD_ZMJ_19_03_2026',
    orderRef: 'ZMJ-19.03.2026',
    customerName: 'ZMJ',
    category: 'ZMJ',
    orderDate: '2026-03-19',
    deliveryDate: '2026-03-24',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'zmj_3',
        sku: 'HVA.01.05.01',
        name: 'Detal HVA.01.05.01',
        orderedQty: 2,
        shippedQty: 2,
        producedQty: 2,
        productionStatus: 'PRODUCED',
        unitPrice: 380.00,
        uom: 'szt'
      },
      {
        id: 'zmj_4',
        sku: 'HVA.01.06.03',
        name: 'Detal HVA.01.06.03',
        orderedQty: 2,
        shippedQty: 2,
        producedQty: 2,
        productionStatus: 'PRODUCED',
        unitPrice: 420.00,
        uom: 'szt'
      }
    ]
  },

  // --- MATMONT ---
  {
    id: 'ORD_MATMONT_73_Z_09_2026',
    orderRef: '73-Z-09-2026 BLUEMAKE',
    customerName: 'MATMONT',
    category: 'MATMONT',
    orderDate: '2026-09-22',
    deliveryDate: '2026-10-10',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'mat_73_1',
        sku: 'MATMONT_ZLEC_73',
        name: 'Komplet detali frezowanych i toczonych (73-Z-09-2026)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 6800.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_MATMONT_42_Z_07_2026',
    orderRef: '42-Z-07-2026 BLUEMAKE',
    customerName: 'MATMONT',
    category: 'MATMONT',
    orderDate: '2026-07-22',
    deliveryDate: '2026-08-05',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'mat_42_1',
        sku: 'MATMONT_ZLEC_42',
        name: 'Zlecenie obróbki części maszyn (42-Z-07-2026)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 1,
        productionStatus: 'PRODUCED',
        unitPrice: 8400.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_MATMONT_002_NOWE',
    orderRef: 'MATMONT-002-NOWE',
    customerName: 'MATMONT',
    category: 'MATMONT',
    orderDate: '2026-05-13',
    deliveryDate: '2026-05-20',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      { id: 'mat_2_1', sku: 'CZESC01', name: 'Część01', orderedQty: 4, shippedQty: 4, producedQty: 4, productionStatus: 'PRODUCED', unitPrice: 280.00, uom: 'szt' },
      { id: 'mat_2_2', sku: 'CZESC03A', name: 'Część03a', orderedQty: 4, shippedQty: 4, producedQty: 4, productionStatus: 'PRODUCED', unitPrice: 320.00, uom: 'szt' },
      { id: 'mat_2_3', sku: 'CZESC_BL5', name: 'Część blaszana5', orderedQty: 4, shippedQty: 4, producedQty: 4, productionStatus: 'PRODUCED', unitPrice: 190.00, uom: 'szt' },
      { id: 'mat_2_4', sku: 'CZESC11', name: 'Część11', orderedQty: 4, shippedQty: 4, producedQty: 4, productionStatus: 'PRODUCED', unitPrice: 240.00, uom: 'szt' },
      { id: 'mat_2_5', sku: 'OS_PRY', name: 'Oś 1 szt pry', orderedQty: 1, shippedQty: 1, producedQty: 1, productionStatus: 'PRODUCED', unitPrice: 450.00, uom: 'szt' }
    ]
  },

  // --- ALPHA ---
  {
    id: 'ORD_ALPHA_I2601653',
    orderRef: 'I2601653',
    customerName: 'ALPHA TECHNOLOGY',
    category: 'ALPHA',
    orderDate: '2026-09-23',
    deliveryDate: '2026-10-07',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'alpha_1',
        sku: 'ALPHA_I2601653',
        name: 'Pakiet detali precyzyjnych ALPHA (I2601653)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 18485.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_ALPHA_I2601412',
    orderRef: 'Bluemake-I2601412',
    customerName: 'ALPHA TECHNOLOGY',
    category: 'ALPHA',
    orderDate: '2026-09-09',
    deliveryDate: '2026-09-18',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      { id: 'alpha_2', sku: 'ALPHA_1412', name: 'Zlecenie seryjne ALPHA I2601412', orderedQty: 1, shippedQty: 1, producedQty: 1, productionStatus: 'PRODUCED', unitPrice: 5200.00, uom: 'kpl' }
    ]
  },
  {
    id: 'ORD_ALPHA_I2601094',
    orderRef: 'Bluemake-I2601094',
    customerName: 'ALPHA TECHNOLOGY',
    category: 'ALPHA',
    orderDate: '2026-07-16',
    deliveryDate: '2026-07-28',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      { id: 'alpha_3', sku: 'ALPHA_1094', name: 'Zlecenie seryjne ALPHA I2601094', orderedQty: 1, shippedQty: 1, producedQty: 1, productionStatus: 'PRODUCED', unitPrice: 4800.00, uom: 'kpl' }
    ]
  },

  // --- NIKMET ---
  {
    id: 'ORD_NIKMET_BLM_04_2026',
    orderRef: 'BLM-04-2026',
    customerName: 'NIKMET',
    category: 'NIKMET',
    orderDate: '2026-07-30',
    deliveryDate: '2026-08-15',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'nik_4_1',
        sku: 'NIKMET_KAT_ALU',
        name: 'Kątowniki aluminiowe i kształtowniki',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 12400.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_NIKMET_BLM_02_2026',
    orderRef: 'BLM-02-2026',
    customerName: 'NIKMET',
    category: 'NIKMET',
    orderDate: '2026-05-24',
    deliveryDate: '2026-06-10',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'nik_2_1',
        sku: 'BU_6553919',
        name: 'Blachy - promienie (BU_6553919)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 18817.84,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_NIKMET_BLM_05_2026',
    orderRef: 'BLM-05-2026',
    customerName: 'NIKMET',
    category: 'NIKMET',
    orderDate: '2026-05-29',
    deliveryDate: '2026-06-15',
    productionStatus: 'IN_PRODUCTION',
    syncStatus: 'DRAFT',
    items: [
      {
        id: 'nik_5_1',
        sku: 'ZD_K_10_05_2026',
        name: 'Duże zam - elementy dodatkowe (ZD_K_10_05_2026)',
        orderedQty: 1,
        shippedQty: 1,
        producedQty: 0,
        productionStatus: 'IN_PRODUCTION',
        unitPrice: 14250.00,
        uom: 'kpl'
      }
    ]
  },
  {
    id: 'ORD_NIKMET_RAMOWE_KOSTKI',
    orderRef: 'ZD/K/6..11/03/2026',
    customerName: 'NIKMET',
    category: 'NIKMET',
    orderDate: '2026-03-24',
    deliveryDate: '2026-04-10',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      { id: 'nik_k6', sku: 'BU_6536550_L', name: 'Kostka BU_6536550 Lewy + Prawy', orderedQty: 50, shippedQty: 50, producedQty: 50, productionStatus: 'PRODUCED', unitPrice: 336.21, uom: 'kpl' },
      { id: 'nik_k7', sku: 'BU_6553919_L', name: 'Kostka BU_6553919 Lewy + Prawy', orderedQty: 50, shippedQty: 50, producedQty: 50, productionStatus: 'PRODUCED', unitPrice: 336.21, uom: 'kpl' },
      { id: 'nik_k8', sku: 'ZD_K_8_03', name: 'Kostki frezowane seria 8', orderedQty: 48, shippedQty: 48, producedQty: 48, productionStatus: 'PRODUCED', unitPrice: 323.28, uom: 'szt' },
      { id: 'nik_k10', sku: 'ZD_K_10_03', name: 'Kostki frezowane seria 10', orderedQty: 48, shippedQty: 48, producedQty: 48, productionStatus: 'PRODUCED', unitPrice: 323.28, uom: 'szt' },
      { id: 'nik_k11', sku: 'ZD_K_11_03', name: 'Kostki frezowane seria 11', orderedQty: 48, shippedQty: 48, producedQty: 48, productionStatus: 'PRODUCED', unitPrice: 323.28, uom: 'szt' }
    ]
  },
  {
    id: 'ORD_NIKMET_BLM_03_2026',
    orderRef: 'BLM-03-2026',
    customerName: 'NIKMET',
    category: 'NIKMET',
    orderDate: '2026-03-04',
    deliveryDate: '2026-03-20',
    productionStatus: 'PRODUCED',
    syncStatus: 'DRAFT',
    items: [
      { id: 'nik_3_1', sku: 'SZUFLADY', name: 'Szuflady aluminiowe kpl', orderedQty: 1, shippedQty: 1, producedQty: 1, productionStatus: 'PRODUCED', unitPrice: 9600.00, uom: 'kpl' }
    ]
  }
];

export function getSavedOrders() {
  try {
    const data = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading saved orders:', err);
  }
  // Initialize default 2026 orders
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS_2026));
  return INITIAL_ORDERS_2026;
}

export function saveOrderToDb(order, operatorName = null) {
  try {
    const orders = getSavedOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    const isNew = existingIndex < 0;
    
    const orderToSave = {
      ...order,
      updatedAt: new Date().toISOString(),
      createdAt: order.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      orders[existingIndex] = orderToSave;
    } else {
      orders.unshift(orderToSave);
    }

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    const itemsCount = Array.isArray(orderToSave.items) ? orderToSave.items.length : 0;
    logAuditAction({
      category: 'ORDER',
      action: isNew ? '📋 IMPORT ZAMÓWIENIA' : '📋 AKTUALIZACJA ZAMÓWIENIA',
      details: `Zamówienie ${orderToSave.orderRef || orderToSave.id} dla "${orderToSave.customerName || 'Klient'}" (${itemsCount} pozycji)`,
      operator: operatorName || getCurrentOperator()?.name,
      status: 'SUCCESS'
    });

    return orderToSave;
  } catch (err) {
    console.error('Error saving order:', err);
    return order;
  }
}

export function getOrderById(orderId) {
  const orders = getSavedOrders();
  return orders.find(o => o.id === orderId) || null;
}

export function toggleItemProductionStatus(orderId, itemId, operatorName = null) {
  const orders = getSavedOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  const item = order.items?.find(i => i.id === itemId);
  if (item) {
    const nextStatus = item.productionStatus === 'PRODUCED' ? 'IN_PRODUCTION' : 'PRODUCED';
    item.productionStatus = nextStatus;
    item.producedQty = nextStatus === 'PRODUCED' ? (item.shippedQty || item.orderedQty || 1) : 0;
    
    // Check entire order status
    const allProduced = order.items.every(i => i.productionStatus === 'PRODUCED');
    order.productionStatus = allProduced ? 'PRODUCED' : 'IN_PRODUCTION';
    order.updatedAt = new Date().toISOString();

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    logAuditAction({
      category: 'ORDER',
      action: nextStatus === 'PRODUCED' ? '✅ WYPRODUKOWANO DETAL' : '🔄 ROZPOCZĘTO PRODUKCJĘ',
      details: `${item.name} (${order.orderRef} - ${order.customerName}): status ${nextStatus}`,
      operator: operatorName || getCurrentOperator()?.name,
      status: 'SUCCESS'
    });

    return order;
  }
  return null;
}

export function toggleOrderProductionStatus(orderId, operatorName = null) {
  const orders = getSavedOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  const nextStatus = order.productionStatus === 'PRODUCED' ? 'IN_PRODUCTION' : 'PRODUCED';
  order.productionStatus = nextStatus;
  if (Array.isArray(order.items)) {
    order.items.forEach(it => {
      it.productionStatus = nextStatus;
      it.producedQty = nextStatus === 'PRODUCED' ? (it.shippedQty || it.orderedQty || 1) : 0;
    });
  }
  order.updatedAt = new Date().toISOString();

  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

  logAuditAction({
    category: 'ORDER',
    action: nextStatus === 'PRODUCED' ? '✅ WYPRODUKOWANO CAŁE ZAMÓWIENIE' : '🔄 ZAMÓWIENIE W PRODUKCJI',
    details: `${order.orderRef} (${order.customerName}): status ${nextStatus}`,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'SUCCESS'
  });

  return order;
}

export function setOrderProductionStatus(orderId, status = 'IN_PRODUCTION', operatorName = null) {
  const orders = getSavedOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  order.productionStatus = status;
  if (Array.isArray(order.items)) {
    order.items.forEach(it => {
      it.productionStatus = status;
      it.producedQty = status === 'PRODUCED' ? (it.shippedQty || it.orderedQty || 1) : 0;
    });
  }
  order.updatedAt = new Date().toISOString();

  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

  logAuditAction({
    category: 'ORDER',
    action: status === 'PRODUCED' ? '✅ ZREALIZOWANO ZAMÓWIENIE' : '⏳ PRZEKAZANO DO PRODUKCJI',
    details: `${order.orderRef} (${order.customerName}): status ${status}`,
    operator: operatorName || getCurrentOperator()?.name,
    status: 'SUCCESS'
  });

  return order;
}

export function setItemProductionStatus(orderId, itemId, status = 'IN_PRODUCTION', operatorName = null) {
  const orders = getSavedOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  const item = order.items?.find(i => i.id === itemId);
  if (item) {
    item.productionStatus = status;
    item.producedQty = status === 'PRODUCED' ? (item.shippedQty || item.orderedQty || 1) : 0;

    const allProduced = order.items.every(i => i.productionStatus === 'PRODUCED');
    order.productionStatus = allProduced ? 'PRODUCED' : 'IN_PRODUCTION';
    order.updatedAt = new Date().toISOString();

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    logAuditAction({
      category: 'ORDER',
      action: status === 'PRODUCED' ? '✅ WYPRODUKOWANO DETAL' : '⏳ DETAL W PRODUKCJI',
      details: `${item.name} (${order.orderRef} - ${order.customerName}): status ${status}`,
      operator: operatorName || getCurrentOperator()?.name,
      status: 'SUCCESS'
    });

    return order;
  }
  return null;
}

export function deleteOrderFromDb(orderId, operatorName = null) {
  try {
    const orders = getSavedOrders();
    const order = orders.find(o => o.id === orderId);
    const filtered = orders.filter(o => o.id !== orderId);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));

    logAuditAction({
      category: 'ORDER',
      action: '🗑️ USUNIĘCIE ZAMÓWIENIA',
      details: `Usunięto zamówienie ${order?.orderRef || orderId} ("${order?.customerName || 'Brak'}")`,
      operator: operatorName || getCurrentOperator()?.name,
      status: 'WARNING'
    });

    return true;
  } catch (err) {
    console.error('Error deleting order:', err);
    return false;
  }
}

export function updateOrderSyncStatus(orderId, syncStatus, odooInfo = {}, operatorName = null) {
  const order = getOrderById(orderId);
  if (order) {
    order.syncStatus = syncStatus; // 'DRAFT', 'SYNCED_ODOO', 'ERROR'
    if (odooInfo.odooOrderId) order.odooOrderId = odooInfo.odooOrderId;
    if (odooInfo.odooOrderName) order.odooOrderName = odooInfo.odooOrderName;
    if (odooInfo.lastSyncError !== undefined) order.lastSyncError = odooInfo.lastSyncError;

    logAuditAction({
      category: 'ORDER',
      action: syncStatus === 'SYNCED_ODOO' ? '🔄 SYNCHRONIZACJA ZAMÓWIENIA (ODOO)' : '⚠️ BŁĄD SYNCHRONIZACJI ZAMÓWIENIA',
      details: `Zamówienie ${order.orderRef || orderId}: status ${syncStatus} (Odoo SO: ${odooInfo.odooOrderName || '-'})`,
      operator: operatorName || getCurrentOperator()?.name,
      status: syncStatus === 'SYNCED_ODOO' ? 'SYNCHRONIZED' : 'ERROR',
      error: odooInfo.lastSyncError || null
    });

    return saveOrderToDb(order, operatorName);
  }
  return null;
}
