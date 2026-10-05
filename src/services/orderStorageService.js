import { logAuditAction, getCurrentOperator } from './authService.js';

const ORDERS_STORAGE_KEY = 'bluemake_saved_orders_db_v11';

// Complete combined database: All Odoo synced orders (59 orders) + All external companies (MV CENTER, ZMJ, MATMONT, ALPHA, NIKMET, KINAR, Husqvarna)
export const INITIAL_ORDERS_2026 = [
  {
    "id": "ORD_S00081_ZZ-241_09_2026_EC",
    "orderRef": "ZZ-241/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00081",
    "odooOrderId": 77,
    "items": [
      {
        "id": "s00081_1",
        "symbol": "ZZ-241",
        "sku": "ZZ-241/09/2026/EC - Lizbona",
        "name": "ZZ-241/09/2026/EC - Lizbona",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 10964,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00080_ZZ-78_09_2026_EC",
    "orderRef": "ZZ-78/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00080",
    "odooOrderId": 76,
    "items": [
      {
        "id": "s00080_1",
        "symbol": "ZZ-78",
        "sku": "ZZ-78/09/2026/EC - rurka stabi",
        "name": "ZZ-78/09/2026/EC - rurka stabilizujaca - tylko ofrezowac",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 12496,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00079_ZZ-220_09_2026_EC",
    "orderRef": "ZZ-220/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00079",
    "odooOrderId": 75,
    "items": [
      {
        "id": "s00079_1",
        "symbol": "ZZ-220",
        "sku": "ZZ-220/09/2026/EC - Przepusty ",
        "name": "ZZ-220/09/2026/EC - Przepusty i tulejki montazowe itd.",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 16062,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00078_ZZ-23-09-2026-ZN",
    "orderRef": "ZZ-23-09-2026-ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00078",
    "odooOrderId": 74,
    "items": [
      {
        "id": "s00078_1",
        "symbol": "ZZ-23",
        "sku": "ZZ-23-09-2026-ZN - Polksiezyc",
        "name": "ZZ-23-09-2026-ZN - Polksiezyc",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30360,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00077_ZZ-184-09-2026",
    "orderRef": "ZZ-184-09-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00077",
    "odooOrderId": 73,
    "items": [
      {
        "id": "s00077_1",
        "symbol": "ZZ-184",
        "sku": "ZZ-184-09-2026 - Usluga obrobk",
        "name": "ZZ-184-09-2026 - Usluga obrobki Ramie (Odlew)",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 10044,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00076_ZZ-79_09_2026_EC",
    "orderRef": "ZZ-79/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00076",
    "odooOrderId": 72,
    "items": [
      {
        "id": "s00076_1",
        "symbol": "ZZ-79",
        "sku": "ZZ-79/09/2026/EC - pantograf (",
        "name": "ZZ-79/09/2026/EC - pantograf (bloki alu i walki drazone)",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 27594.3,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00075_ZZ-151_09_2026_EC",
    "orderRef": "ZZ-151/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00075",
    "odooOrderId": 71,
    "items": [
      {
        "id": "s00075_1",
        "symbol": "ZZ-151",
        "sku": "ZZ-151/09/2026/EC - Usluga mal",
        "name": "ZZ-151/09/2026/EC - Usluga malowania i obrobki Wspornik napedu RAL 7021",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6300,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00074_ZZ-136_09_2026_EC",
    "orderRef": "ZZ-136/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00074",
    "odooOrderId": 70,
    "items": [
      {
        "id": "s00074_1",
        "symbol": "ZZ-136",
        "sku": "ZZ-136/09/2026/EC - Polksiezyc",
        "name": "ZZ-136/09/2026/EC - Polksiezyc",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 11500,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00073_ZZ-69_09_2026_EC",
    "orderRef": "ZZ-69/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00073",
    "odooOrderId": 69,
    "items": [
      {
        "id": "s00073_1",
        "symbol": "ZZ-69",
        "sku": "ZZ-69/09/2026/EC - nowe polksi",
        "name": "ZZ-69/09/2026/EC - nowe polksiezyce (maly)",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7800,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00072_ZZ-8_09_2026_EC",
    "orderRef": "ZZ-8/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00072",
    "odooOrderId": 68,
    "items": [
      {
        "id": "s00072_1",
        "symbol": "ZZ-8",
        "sku": "ZZ-8/09/2026/EC - prototyp do ",
        "name": "ZZ-8/09/2026/EC - prototyp do panto - plyty rozdzielcze i bloki",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 760,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00071_ZZ-190_08_2026_EC",
    "orderRef": "ZZ-190/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00071",
    "odooOrderId": 67,
    "items": [
      {
        "id": "s00071_1",
        "symbol": "ZZ-190",
        "sku": "ZZ-190/08/2026/EC - toaleta i ",
        "name": "ZZ-190/08/2026/EC - toaleta i podnozek",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 12362.9,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00070_ZZ-72_09_2026_EC",
    "orderRef": "ZZ-72/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00070",
    "odooOrderId": 66,
    "items": [
      {
        "id": "s00070_1",
        "symbol": "ZZ-72",
        "sku": "ZZ-72/09/2026/EC - wsporniki m",
        "name": "ZZ-72/09/2026/EC - wsporniki malowane i prowadzenie",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6720,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00069_ZZ-1-09-2026-ZN",
    "orderRef": "ZZ-1-09-2026-ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00069",
    "odooOrderId": 65,
    "items": [
      {
        "id": "s00069_1",
        "symbol": "ZZ-1",
        "sku": "ZZ-1-09-2026-ZN - nowy walek d",
        "name": "ZZ-1-09-2026-ZN - nowy walek drazony - 3szt",
        "orderedQty": 3,
        "shippedQty": 3,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00068_ZZ-295-07-2026",
    "orderRef": "ZZ-295-07-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00068",
    "odooOrderId": 64,
    "items": [
      {
        "id": "s00068_1",
        "symbol": "ZZ-295",
        "sku": "ZZ-295-07-2026 - pantograf i w",
        "name": "ZZ-295-07-2026 - pantograf i wycieraczka (walek drazony i rura glowna ETC)",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 28762,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00046_ZZ-119_03_2026_EC",
    "orderRef": "ZZ-119/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-28",
    "deliveryDate": "2026-07-28",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00046",
    "odooOrderId": 46,
    "items": [
      {
        "id": "s00046_1",
        "symbol": "00362",
        "sku": "00362",
        "name": "[00362] 160S 220-5-01 - Krzywka EC Pomalowana",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 370,
        "uom": "Szt"
      },
      {
        "id": "s00046_2",
        "symbol": "00229",
        "sku": "00229",
        "name": "[00229] EC-VAC 0108000-004-01 - Podkladka gniazdo",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00045_ZZ-106_04_2026_EC",
    "orderRef": "ZZ-106/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00045",
    "odooOrderId": 45,
    "items": [
      {
        "id": "s00045_1",
        "symbol": "K0029",
        "sku": "K0029",
        "name": "[K0029] nie wiem co to",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00044_ZZ-105_03_2026_EC",
    "orderRef": "ZZ-105/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00044",
    "odooOrderId": 44,
    "items": [
      {
        "id": "s00044_1",
        "symbol": "04373",
        "sku": "04373",
        "name": "[04373] 160T-01 950-1-02 -  Ucho montażowe napędu",
        "orderedQty": 70,
        "shippedQty": 70,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00043_ZZ-90_04_2026_EC",
    "orderRef": "ZZ-90/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00043",
    "odooOrderId": 43,
    "items": [
      {
        "id": "s00043_1",
        "symbol": "00434",
        "sku": "00434",
        "name": "[00434] 160W 200-3-06 - Księżyc systemu PPD + obróbka",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00042_ZZ-78-04-2026",
    "orderRef": "ZZ-78-04-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00042",
    "odooOrderId": 42,
    "items": [
      {
        "id": "s00042_1",
        "symbol": "K0044",
        "sku": "K0044",
        "name": "[K0044] Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "orderedQty": 35,
        "shippedQty": 35,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00041_ZZ-67_04_2026_EC",
    "orderRef": "ZZ-67/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00041",
    "odooOrderId": 41,
    "items": [
      {
        "id": "s00041_1",
        "symbol": "00419",
        "sku": "00419",
        "name": "[00419] 160W 900-2-06 - Pierścień (nakrętka)",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "Szt"
      },
      {
        "id": "s00041_2",
        "symbol": "11528",
        "sku": "11528",
        "name": "[11528] EC-VAC_0103200-001-01 - Sruba zaslepienia misy",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00040_ZZ-64_03_2026_ZN",
    "orderRef": "ZZ-64/03/2026/ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00040",
    "odooOrderId": 40,
    "items": [
      {
        "id": "s00040_1",
        "symbol": "S00040_1",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 310,
        "uom": "Szt"
      },
      {
        "id": "s00040_2",
        "symbol": "S00040_2",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110,
        "uom": "Szt"
      },
      {
        "id": "s00040_3",
        "symbol": "S00040_3",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 180,
        "uom": "Szt"
      },
      {
        "id": "s00040_4",
        "symbol": "S00040_4",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 410,
        "uom": "Szt"
      },
      {
        "id": "s00040_5",
        "symbol": "S00040_5",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 25,
        "uom": "Szt"
      },
      {
        "id": "s00040_6",
        "symbol": "S00040_6",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35,
        "uom": "Szt"
      },
      {
        "id": "s00040_7",
        "symbol": "S00040_7",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35,
        "uom": "Szt"
      },
      {
        "id": "s00040_8",
        "symbol": "S00040_8",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 2,
        "shippedQty": 2,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 38,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00039_ZZ-21_03_2026_ZN",
    "orderRef": "ZZ-21/03/2026/ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00039",
    "odooOrderId": 39,
    "items": [
      {
        "id": "s00039_1",
        "symbol": "S00039_1",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 3200,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00038_ZZ-20_04_2026_ZN",
    "orderRef": "ZZ-20/04/2026/ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00038",
    "odooOrderId": 38,
    "items": [
      {
        "id": "s00038_1",
        "symbol": "S00038_1",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110,
        "uom": "Szt"
      },
      {
        "id": "s00038_2",
        "symbol": "S00038_2",
        "sku": "ZN000000",
        "name": "ZN000000",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 430,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00037_ZZ-34-03-2026",
    "orderRef": "ZZ-34-03-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00037",
    "odooOrderId": 37,
    "items": [
      {
        "id": "s00037_1",
        "symbol": "11257",
        "sku": "11257",
        "name": "[11257] PCU-01-000-04-02 - Trojnik rozdzielczy",
        "orderedQty": 15,
        "shippedQty": 15,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171,
        "uom": "Szt"
      },
      {
        "id": "s00037_2",
        "symbol": "11256",
        "sku": "11256",
        "name": "[11256] PCU-01-000-03-02 - Blok rozdzielczy",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 603,
        "uom": "Szt"
      },
      {
        "id": "s00037_3",
        "symbol": "11015",
        "sku": "11015",
        "name": "[11015] 160ECT-05_800-1-03 - Blok rozdzielczy 2",
        "orderedQty": 9,
        "shippedQty": 9,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 425,
        "uom": "Szt"
      },
      {
        "id": "s00037_4",
        "symbol": "11016",
        "sku": "11016",
        "name": "[11016] Blok rozdzielczy 3",
        "orderedQty": 9,
        "shippedQty": 9,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 610,
        "uom": "Szt"
      },
      {
        "id": "s00037_5",
        "symbol": "11022",
        "sku": "11022",
        "name": "[11022] 160ECT-05_800-1-05 -  Podpora regulatora",
        "orderedQty": 9,
        "shippedQty": 9,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 165,
        "uom": "Szt"
      },
      {
        "id": "s00037_6",
        "symbol": "11257",
        "sku": "11257",
        "name": "[11257] PCU-01-000-04-02 - Trojnik rozdzielczy",
        "orderedQty": 16,
        "shippedQty": 16,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171,
        "uom": "Szt"
      },
      {
        "id": "s00037_7",
        "symbol": "11015",
        "sku": "11015",
        "name": "[11015] 160ECT-05_800-1-03 - Blok rozdzielczy 2",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 425,
        "uom": "Szt"
      },
      {
        "id": "s00037_8",
        "symbol": "11016",
        "sku": "11016",
        "name": "[11016] 160ECT-05_800-1-04 - Blok rozdzielczy 3",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 610,
        "uom": "Szt"
      },
      {
        "id": "s00037_9",
        "symbol": "11022",
        "sku": "11022",
        "name": "[11022] 160ECT-05_800-1-05 -  Podpora regulatora",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 165,
        "uom": "Szt"
      },
      {
        "id": "s00037_10",
        "symbol": "11025",
        "sku": "11025",
        "name": "[11025] 160ECT-05_800-1-01_B - Blacha plyty sterowania",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130,
        "uom": "Szt"
      },
      {
        "id": "s00037_11",
        "symbol": "11018",
        "sku": "11018",
        "name": "[11018] 160ECT-05_800-1-02 - Blok rozdzielczy 1",
        "orderedQty": 9,
        "shippedQty": 9,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 410,
        "uom": "Szt"
      },
      {
        "id": "s00037_12",
        "symbol": "11018",
        "sku": "11018",
        "name": "[11018] 160ECT-05_800-1-02 - Blok rozdzielczy 1",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 410,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00036_ZZ-32_03_2026_ZN",
    "orderRef": "ZZ-32/03/2026/ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00036",
    "odooOrderId": 36,
    "items": [
      {
        "id": "s00036_1",
        "symbol": "S00036_1",
        "sku": "prototyp księżyc PPD 160W_200-",
        "name": "prototyp księżyc PPD 160W_200-5-05",
        "orderedQty": 2,
        "shippedQty": 2,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00035_ZZ-9_03_2026_EC",
    "orderRef": "ZZ-9/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00035",
    "odooOrderId": 35,
    "items": [
      {
        "id": "s00035_1",
        "symbol": "K0063",
        "sku": "K0063",
        "name": "[K0063] EC-WE-36WE-320000-001-04 - Usługa obróbki Ramię (Odlew)",
        "orderedQty": 106,
        "shippedQty": 106,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 81,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00034_ZZ-8_03_2026_EC",
    "orderRef": "ZZ-8/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00034",
    "odooOrderId": 34,
    "items": [
      {
        "id": "s00034_1",
        "symbol": "K0044",
        "sku": "K0044",
        "name": "[K0044] Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00033_ZZ-269_05_2026_EC",
    "orderRef": "ZZ-269/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00033",
    "odooOrderId": 33,
    "items": [
      {
        "id": "s00033_1",
        "symbol": "K0029",
        "sku": "K0029",
        "name": "[K0029] 160w_911-3-02_A- Plytka prowadzaca (kopiuj)",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00032_ZZ-259_05_2026_EC",
    "orderRef": "ZZ-259/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00032",
    "odooOrderId": 32,
    "items": [
      {
        "id": "s00032_1",
        "symbol": "00476",
        "sku": "00476",
        "name": "[00476] 160T 500-5-01 - Rura stabilizująca 160ECT",
        "orderedQty": 70,
        "shippedQty": 70,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.93,
        "uom": "Szt"
      },
      {
        "id": "s00032_2",
        "symbol": "00472",
        "sku": "00472",
        "name": "[00472] 160T 310-4-03 (L) - Wspornik trójkątny ECT Lewy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00032_3",
        "symbol": "00471",
        "sku": "00471",
        "name": "[00471] 160T 310-4-03 (P) - Wspornik trójkątny ECT prawy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00031_ZZ-215_03_2026_EC",
    "orderRef": "ZZ-215/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00031",
    "odooOrderId": 31,
    "items": [
      {
        "id": "s00031_1",
        "symbol": "00464",
        "sku": "00464",
        "name": "[00464] 160T_210-4-02 - Wspornik stabilizatora ECT",
        "orderedQty": 37,
        "shippedQty": 37,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 19.53,
        "uom": "Szt"
      },
      {
        "id": "s00031_2",
        "symbol": "00465",
        "sku": "00465",
        "name": "[00465] 160T_210 - 4-03_A_Tarcza_ECT",
        "orderedQty": 81,
        "shippedQty": 81,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 8.69,
        "uom": "Szt"
      },
      {
        "id": "s00031_3",
        "symbol": "00473",
        "sku": "00473",
        "name": "[00473] 160T_310-4-04 - Dzwignia ECT",
        "orderedQty": 106,
        "shippedQty": 106,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 20.62,
        "uom": "Szt"
      },
      {
        "id": "s00031_4",
        "symbol": "00468",
        "sku": "00468",
        "name": "[00468] 160T_310-4-05 - Blacha laczaca",
        "orderedQty": 104,
        "shippedQty": 104,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 28.39,
        "uom": "Szt"
      },
      {
        "id": "s00031_5",
        "symbol": "00480",
        "sku": "00480",
        "name": "[00480] 160T_320-4-03 - Blaszka lotki",
        "orderedQty": 100,
        "shippedQty": 100,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1.1,
        "uom": "Szt"
      },
      {
        "id": "s00031_6",
        "symbol": "00481",
        "sku": "00481",
        "name": "[00481] 160T_640-4-01_a podstawa lotki",
        "orderedQty": 41,
        "shippedQty": 41,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 38.64,
        "uom": "Szt"
      },
      {
        "id": "s00031_7",
        "symbol": "00483",
        "sku": "00483",
        "name": "[00483] 160T_640-4-02 - Winglet 1",
        "orderedQty": 38,
        "shippedQty": 38,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 8.38,
        "uom": "Szt"
      },
      {
        "id": "s00031_8",
        "symbol": "00482",
        "sku": "00482",
        "name": "[00482] 160T_640-4-03 - Winglet 2",
        "orderedQty": 37,
        "shippedQty": 37,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.98,
        "uom": "Szt"
      },
      {
        "id": "s00031_9",
        "symbol": "04385",
        "sku": "04385",
        "name": "[04385] 160T-01 020-1-01 - Stelaż ADD 160T-01",
        "orderedQty": 32,
        "shippedQty": 32,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.71,
        "uom": "Szt"
      },
      {
        "id": "s00031_10",
        "symbol": "04383",
        "sku": "04383",
        "name": "[04383] 160T-01 030-1-01 - Daszek zaworu PPD 160T-01",
        "orderedQty": 17,
        "shippedQty": 17,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.7,
        "uom": "Szt"
      },
      {
        "id": "s00031_11",
        "symbol": "04366",
        "sku": "04366",
        "name": "[04366] 160T-01 100-2-13 - Wspornik zaworu ADD",
        "orderedQty": 29,
        "shippedQty": 29,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.5,
        "uom": "Szt"
      },
      {
        "id": "s00031_12",
        "symbol": "00433",
        "sku": "00433",
        "name": "[00433] 160W_000-2-08 - Daszek PPD",
        "orderedQty": 14,
        "shippedQty": 14,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 5.52,
        "uom": "Szt"
      },
      {
        "id": "s00031_13",
        "symbol": "00435",
        "sku": "00435",
        "name": "[00435] 160W_020-3-01 - Stelaz ADD",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 36.58,
        "uom": "Szt"
      },
      {
        "id": "s00031_14",
        "symbol": "00328",
        "sku": "00328",
        "name": "[00328] 160W_100-2-10 - Mocowanie linki",
        "orderedQty": 66,
        "shippedQty": 66,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 2.06,
        "uom": "Szt"
      },
      {
        "id": "s00031_15",
        "symbol": "00359",
        "sku": "00359",
        "name": "[00359] 160W 210-2-04 - Żebro ramienia dolnego",
        "orderedQty": 90,
        "shippedQty": 90,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 5.29,
        "uom": "Szt"
      },
      {
        "id": "s00031_16",
        "symbol": "00361",
        "sku": "00361",
        "name": "[00361] 160W 210-2-08 - Ucho prądowe dolne",
        "orderedQty": 88,
        "shippedQty": 88,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 3.84,
        "uom": "Szt"
      },
      {
        "id": "s00031_17",
        "symbol": "00376",
        "sku": "00376",
        "name": "[00376] 160W 310-3-08 - Ucho prądowe górne",
        "orderedQty": 113,
        "shippedQty": 113,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1.65,
        "uom": "Szt"
      },
      {
        "id": "s00031_18",
        "symbol": "00474",
        "sku": "00474",
        "name": "[00474] 160W 310-3-10 - Wspornik domykający",
        "orderedQty": 105,
        "shippedQty": 105,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.55,
        "uom": "Szt"
      },
      {
        "id": "s00031_19",
        "symbol": "00394",
        "sku": "00394",
        "name": "[00394] 160W_610-2-03 - Plytka prowadnika",
        "orderedQty": 176,
        "shippedQty": 176,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 2.83,
        "uom": "Szt"
      },
      {
        "id": "s00031_20",
        "symbol": "00428",
        "sku": "00428",
        "name": "[00428] 160W_910-3-01 - Blacha gieta",
        "orderedQty": 44,
        "shippedQty": 44,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 92.4,
        "uom": "Szt"
      },
      {
        "id": "s00031_21",
        "symbol": "00429",
        "sku": "00429",
        "name": "[00429] 160W_910-3-02 - Wzmocnienie",
        "orderedQty": 201,
        "shippedQty": 201,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 18.07,
        "uom": "Szt"
      },
      {
        "id": "s00031_22",
        "symbol": "00431",
        "sku": "00431",
        "name": "[00431] 160w_911-3-02_A- Plytka prowadzaca",
        "orderedQty": 25,
        "shippedQty": 25,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.74,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00030_ZZ-192_03_2026_EC",
    "orderRef": "ZZ-192/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00030",
    "odooOrderId": 30,
    "items": [
      {
        "id": "s00030_1",
        "symbol": "08294",
        "sku": "08294",
        "name": "[08294] 160T-01 100-1-04 - Wspornik napędu",
        "orderedQty": 80,
        "shippedQty": 80,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "Szt"
      },
      {
        "id": "s00030_2",
        "symbol": "00389",
        "sku": "00389",
        "name": "[00389] 160W 600-3-02 - Poprzeczka",
        "orderedQty": 130,
        "shippedQty": 130,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "Szt"
      },
      {
        "id": "s00030_3",
        "symbol": "10698",
        "sku": "10698",
        "name": "[10698] EC-WE-31WEBc-600000-005-01 - Przepust",
        "orderedQty": 24,
        "shippedQty": 24,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80,
        "uom": "Szt"
      },
      {
        "id": "s00030_4",
        "symbol": "00467",
        "sku": "00467",
        "name": "[00467] 160T 310-4-01 - Rura wzdłużna gięta",
        "orderedQty": 80,
        "shippedQty": 80,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.93,
        "uom": "Szt"
      },
      {
        "id": "s00030_5",
        "symbol": "04358",
        "sku": "04358",
        "name": "[04358] 160T-01 100-1-05 - Wspornik ramienia dolnego",
        "orderedQty": 60,
        "shippedQty": 60,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "Szt"
      },
      {
        "id": "s00030_6",
        "symbol": "00365",
        "sku": "00365",
        "name": "[00365] 160W 300-3-04 - Wałek drążony",
        "orderedQty": 35,
        "shippedQty": 35,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "Szt"
      },
      {
        "id": "s00030_7",
        "symbol": "00476",
        "sku": "00476",
        "name": "[00476] 160T 500-5-01 - Rura stabilizująca 160ECT",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 142,
        "uom": "Szt"
      },
      {
        "id": "s00030_8",
        "symbol": "00357",
        "sku": "00357",
        "name": "[00357] 160W 210-2-01 - Tuleja 1",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00029_ZZ-190_02_2026_EC",
    "orderRef": "ZZ-190/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00029",
    "odooOrderId": 29,
    "items": [
      {
        "id": "s00029_1",
        "symbol": "00471",
        "sku": "00471",
        "name": "[00471] 160T 310-4-03 (P) - Wspornik trójkątny ECT prawy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00029_2",
        "symbol": "00472",
        "sku": "00472",
        "name": "[00472] 160T 310-4-03 (L) - Wspornik trójkątny ECT Lewy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00029_3",
        "symbol": "00463",
        "sku": "00463",
        "name": "[00463] 160T 210-5-01 - Rura główna ECT",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00028_ZZ-149_04_2026_EC",
    "orderRef": "ZZ-149/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00028",
    "odooOrderId": 28,
    "items": [
      {
        "id": "s00028_1",
        "symbol": "00471",
        "sku": "00471",
        "name": "[00471] 160T 310-4-03 (P) - Wspornik trójkątny ECT prawy",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00028_2",
        "symbol": "00472",
        "sku": "00472",
        "name": "[00472] 160T 310-4-03 (L) - Wspornik trójkątny ECT Lewy",
        "orderedQty": 28,
        "shippedQty": 28,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00027_ZZ-133_05_2026_EC",
    "orderRef": "ZZ-133/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00027",
    "odooOrderId": 27,
    "items": [
      {
        "id": "s00027_1",
        "symbol": "08853",
        "sku": "08853",
        "name": "[08853] ST-BVG 170000-003-01 - Adapter",
        "orderedQty": 46,
        "shippedQty": 46,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70,
        "uom": "Szt"
      },
      {
        "id": "s00027_2",
        "symbol": "01371",
        "sku": "01371",
        "name": "[01371] P500_257300-004-05 - Cięgno",
        "orderedQty": 94,
        "shippedQty": 94,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70,
        "uom": "Szt"
      },
      {
        "id": "s00027_3",
        "symbol": "01372",
        "sku": "01372",
        "name": "[01372] P500_257300-005-03 - Oś",
        "orderedQty": 94,
        "shippedQty": 94,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 63,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00026_ZZ-62_04_2026_EC",
    "orderRef": "ZZ-62/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00026",
    "odooOrderId": 26,
    "items": [
      {
        "id": "s00026_1",
        "symbol": "01382",
        "sku": "01382",
        "name": "[01382] HF6 140000-001-02 - Oś A",
        "orderedQty": 44,
        "shippedQty": 44,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 54,
        "uom": "Szt"
      },
      {
        "id": "s00026_2",
        "symbol": "01387",
        "sku": "01387",
        "name": "[01387] HF6 140000-007-01 - Tulejka 2",
        "orderedQty": 38,
        "shippedQty": 38,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 29.16,
        "uom": "Szt"
      },
      {
        "id": "s00026_3",
        "symbol": "02795",
        "sku": "02795",
        "name": "[02795] HF6_140000-015-01 - Krzywka (Poliamid)",
        "orderedQty": 37,
        "shippedQty": 37,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 34.56,
        "uom": "Szt"
      },
      {
        "id": "s00026_4",
        "symbol": "01386",
        "sku": "01386",
        "name": "[01386] HF6140000-006-01 - Tulejka 1",
        "orderedQty": 39,
        "shippedQty": 39,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 18.36,
        "uom": "Szt"
      },
      {
        "id": "s00026_5",
        "symbol": "02794",
        "sku": "02794",
        "name": "[02794] HF6140000-014-01 - Pręcik",
        "orderedQty": 48,
        "shippedQty": 48,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 48.6,
        "uom": "Szt"
      },
      {
        "id": "s00026_6",
        "symbol": "00599",
        "sku": "00599",
        "name": "[00599] P400_257000-004-02 - Sworzeń",
        "orderedQty": 79,
        "shippedQty": 79,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.12,
        "uom": "Szt"
      },
      {
        "id": "s00026_7",
        "symbol": "00600",
        "sku": "00600",
        "name": "[00600] P400_257000-005-01 - Przycisk",
        "orderedQty": 67,
        "shippedQty": 67,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 66.96,
        "uom": "Szt"
      },
      {
        "id": "s00026_8",
        "symbol": "00601",
        "sku": "00601",
        "name": "[00601] P400_257000-006-01 - Obudowa przycisku",
        "orderedQty": 67,
        "shippedQty": 67,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 54,
        "uom": "Szt"
      },
      {
        "id": "s00026_9",
        "symbol": "00602",
        "sku": "00602",
        "name": "[00602] P400_257000-007-02 - Nakrętka przycisku",
        "orderedQty": 69,
        "shippedQty": 69,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 48.6,
        "uom": "Szt"
      },
      {
        "id": "s00026_10",
        "symbol": "01408",
        "sku": "01408",
        "name": "[01408] P500_257000-003-03 - Oś",
        "orderedQty": 1026,
        "shippedQty": 1026,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.02,
        "uom": "Szt"
      },
      {
        "id": "s00026_11",
        "symbol": "01371",
        "sku": "01371",
        "name": "[01371] P500_257300-004-05 - Cięgno",
        "orderedQty": 256,
        "shippedQty": 256,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 75.6,
        "uom": "Szt"
      },
      {
        "id": "s00026_12",
        "symbol": "01372",
        "sku": "01372",
        "name": "[01372] P500_257300-005-03 - Oś",
        "orderedQty": 256,
        "shippedQty": 256,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 68.04,
        "uom": "Szt"
      },
      {
        "id": "s00026_13",
        "symbol": "09110",
        "sku": "09110",
        "name": "[09110] ST-BVG 100000-003-02 - Sworzen",
        "orderedQty": 93,
        "shippedQty": 93,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 18.9,
        "uom": "Szt"
      },
      {
        "id": "s00026_14",
        "symbol": "08027",
        "sku": "08027",
        "name": "[08027] ST-BVG 160000-001-03 - Klamka",
        "orderedQty": 46,
        "shippedQty": 46,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 135,
        "uom": "Szt"
      },
      {
        "id": "s00026_15",
        "symbol": "08028",
        "sku": "08028",
        "name": "[08028] ST-BVG 160000-002-03 - Podpora",
        "orderedQty": 33,
        "shippedQty": 33,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 145.8,
        "uom": "Szt"
      },
      {
        "id": "s00026_16",
        "symbol": "11622",
        "sku": "11622",
        "name": "[11622] ST-BVG_100000-008-02 - Wahadło",
        "orderedQty": 51,
        "shippedQty": 51,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 255,
        "uom": "Szt"
      },
      {
        "id": "s00026_17",
        "symbol": "11616",
        "sku": "11616",
        "name": "[11616] ST-BVG_110000-005-02 - Blacha gwintowana",
        "orderedQty": 51,
        "shippedQty": 51,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 44.2,
        "uom": "Szt"
      },
      {
        "id": "s00026_18",
        "symbol": "11615",
        "sku": "11615",
        "name": "[11615] ST-BVG_110000-006-01 - Blaszka pod prowadnik",
        "orderedQty": 51,
        "shippedQty": 51,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 11,
        "uom": "Szt"
      },
      {
        "id": "s00026_19",
        "symbol": "11617",
        "sku": "11617",
        "name": "[11617] ST-BVG_132000-010-01 - Uchwyt lewy",
        "orderedQty": 51,
        "shippedQty": 51,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 16.2,
        "uom": "Szt"
      },
      {
        "id": "s00026_20",
        "symbol": "11618",
        "sku": "11618",
        "name": "[11618] ST-BVG_132000-011-01 - Uchwyt prawy",
        "orderedQty": 51,
        "shippedQty": 51,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.5,
        "uom": "Szt"
      },
      {
        "id": "s00026_21",
        "symbol": "11619",
        "sku": "11619",
        "name": "[11619] ST-BVG_132000-012-01 - Pręt gwintowany krańcówki",
        "orderedQty": 51,
        "shippedQty": 51,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 38.3,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00024_ZZ-35_05_2026_EC",
    "orderRef": "ZZ-35/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00024",
    "odooOrderId": 24,
    "items": [
      {
        "id": "s00024_1",
        "symbol": "10212",
        "sku": "10212",
        "name": "[10212] EC_WE-AAA-211000-002-01 - Króciec",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 25,
        "uom": "Szt"
      },
      {
        "id": "s00024_2",
        "symbol": "10786",
        "sku": "10786",
        "name": "[10786] EC-WE-60WE-310000-008-01 - Palak lewy dlugi",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125,
        "uom": "Szt"
      },
      {
        "id": "s00024_3",
        "symbol": "01353",
        "sku": "01353",
        "name": "[01353] HF6 120000-005-02 - Tulejka montażowa",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40,
        "uom": "Szt"
      },
      {
        "id": "s00024_4",
        "symbol": "10785",
        "sku": "10785",
        "name": "[10785] EC-WE-60WE-310000-007-01 - Palak lewy krotki",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125,
        "uom": "Szt"
      },
      {
        "id": "s00024_5",
        "symbol": "03502",
        "sku": "03502",
        "name": "[03502] ec-we-36we-240000-001-03_A - Wałek",
        "orderedQty": 38,
        "shippedQty": 38,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190,
        "uom": "Szt"
      },
      {
        "id": "s00024_6",
        "symbol": "11542",
        "sku": "11542",
        "name": "[11542] EC_WE-111DEa_600000-005-02 - Przepust 111DEa",
        "orderedQty": 32,
        "shippedQty": 32,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85,
        "uom": "Szt"
      },
      {
        "id": "s00024_7",
        "symbol": "10365",
        "sku": "10365",
        "name": "[10365] EC-WE_36WE-111DEa-200000-002-01 - Tulejka dystansowa",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24,
        "uom": "Szt"
      },
      {
        "id": "s00024_8",
        "symbol": "10363",
        "sku": "10363",
        "name": "[10363] EC-WE_111DEa-200000-003-01 - Dystans maskujacy",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00023_ZZ-34_05_2026_EC",
    "orderRef": "ZZ-34/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00023",
    "odooOrderId": 23,
    "items": [
      {
        "id": "s00023_1",
        "symbol": "00389",
        "sku": "00389",
        "name": "[00389] 160W 600-3-02 - Poprzeczka",
        "orderedQty": 120,
        "shippedQty": 120,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "Szt"
      },
      {
        "id": "s00023_2",
        "symbol": "04358",
        "sku": "04358",
        "name": "[04358] 160T-01 100-1-05 - Wspornik ramienia dolnego",
        "orderedQty": 100,
        "shippedQty": 100,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "Szt"
      },
      {
        "id": "s00023_3",
        "symbol": "08294",
        "sku": "08294",
        "name": "[08294] 160T-01 100-1-04 - Wspornik napędu",
        "orderedQty": 100,
        "shippedQty": 100,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "Szt"
      },
      {
        "id": "s00023_4",
        "symbol": "00365",
        "sku": "00365",
        "name": "[00365] 160W 300-3-04 - Wałek drążony",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "Szt"
      },
      {
        "id": "s00023_5",
        "symbol": "04362",
        "sku": "04362",
        "name": "[04362] 160T-01 100-1-09 - Blacha",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.8,
        "uom": "Szt"
      },
      {
        "id": "s00023_6",
        "symbol": "00419",
        "sku": "00419",
        "name": "[00419] 160W 900-2-06 - Pierścień (nakrętka)",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "Szt"
      },
      {
        "id": "s00023_7",
        "symbol": "00463",
        "sku": "00463",
        "name": "[00463] 160T 210-5-01 - Rura główna ECT",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "Szt"
      },
      {
        "id": "s00023_8",
        "symbol": "00362",
        "sku": "00362",
        "name": "[00362] 160S 220-5-01 - Krzywka EC Pomalowana",
        "orderedQty": 10,
        "shippedQty": 10,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 370,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00021_ZZ-48_02_2026_ZN",
    "orderRef": "ZZ-48/02/2026/ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00021",
    "odooOrderId": 21,
    "items": [
      {
        "id": "s00021_1",
        "symbol": "11257",
        "sku": "11257",
        "name": "[11257] PCU-01-000-04-02 - Trojnik rozdzielczy",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171,
        "uom": "Szt"
      },
      {
        "id": "s00021_2",
        "symbol": "ec-vac_000010_002_01",
        "sku": "ec-vac_000010_002_01",
        "name": "ec-vac_000010_002_01",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 60,
        "uom": "Szt"
      },
      {
        "id": "s00021_3",
        "symbol": "ec-vac_000010_003_01",
        "sku": "ec-vac_000010_003_01",
        "name": "ec-vac_000010_003_01",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00022_ZZ-27_05_2026_EC",
    "orderRef": "ZZ-27/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00022",
    "odooOrderId": 22,
    "items": [
      {
        "id": "s00022_1",
        "symbol": "01081",
        "sku": "01081",
        "name": "[01081] 200EC_0208100-002-08 - Dystans",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210,
        "uom": "Szt"
      },
      {
        "id": "s00022_2",
        "symbol": "01649",
        "sku": "01649",
        "name": "[01649] 120ECI_0206110-005-07 - Tuleja ślizgowa",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33,
        "uom": "Szt"
      },
      {
        "id": "s00022_3",
        "symbol": "01617",
        "sku": "01617",
        "name": "[01617] 120ECI_0203130-001-07 - Rura drążka ślizgacza",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210,
        "uom": "Szt"
      },
      {
        "id": "s00022_4",
        "symbol": "04637",
        "sku": "04637",
        "name": "[04637] 120eci_0206110-054-07 - Tuleja ślizgowa",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 65,
        "uom": "Szt"
      },
      {
        "id": "s00022_5",
        "symbol": "01645",
        "sku": "01645",
        "name": "[01645] 120ECI_0206110-001-07 - Trzpień prowadzący",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 120,
        "uom": "Szt"
      },
      {
        "id": "s00022_6",
        "symbol": "01647",
        "sku": "01647",
        "name": "[01647] 120ECI_0206110-003-07 - Blokada",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 67,
        "uom": "Szt"
      },
      {
        "id": "s00022_7",
        "symbol": "01650",
        "sku": "01650",
        "name": "[01650] 120ECI_0206110-006-07 - Trzpień",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40,
        "uom": "Szt"
      },
      {
        "id": "s00022_8",
        "symbol": "01651",
        "sku": "01651",
        "name": "[01651] 120ECI_0206110-007-07 - Ceownik",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 150,
        "uom": "Szt"
      },
      {
        "id": "s00022_9",
        "symbol": "02666",
        "sku": "02666",
        "name": "[02666] RC10_720000-003-02 - Wałek osi poziomej",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250,
        "uom": "Szt"
      },
      {
        "id": "s00022_10",
        "symbol": "06962",
        "sku": "06962",
        "name": "[06962] RC10_760000-007-01 - Wspornik poliamidowy lewy",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 200,
        "uom": "Szt"
      },
      {
        "id": "s00022_11",
        "symbol": "06961",
        "sku": "06961",
        "name": "[06961] RC10_760000-008-01 - Wspornik poliamidowy prawy",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 200,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00019_ZAM-26-00715-MC",
    "orderRef": "ZAM-26-00715-MC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-26",
    "deliveryDate": "2026-02-26",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00019",
    "odooOrderId": 19,
    "items": [
      {
        "id": "s00019_1",
        "symbol": "S00019_1",
        "sku": "k3000",
        "name": "k3000",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 390,
        "uom": "Szt"
      },
      {
        "id": "s00019_2",
        "symbol": "PMC16434/009",
        "sku": "PMC16434/009",
        "name": "[PMC16434/009] PMC16434/009",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 150,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00018_ZZ-15_02_2026_EC",
    "orderRef": "ZZ-15/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00018",
    "odooOrderId": 18,
    "items": [
      {
        "id": "s00018_1",
        "symbol": "00602",
        "sku": "00602",
        "name": "[00602] P400_257000-007-02 - Nakrętka przycisku",
        "orderedQty": 17,
        "shippedQty": 17,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00017_ZZ-296_11_2025_EC",
    "orderRef": "ZZ-296/11/2025/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00017",
    "odooOrderId": 17,
    "items": [
      {
        "id": "s00017_1",
        "symbol": "00471",
        "sku": "00471",
        "name": "[00471] 160T 310-4-03 (P) - Wspornik trójkątny ECT prawy",
        "orderedQty": 70,
        "shippedQty": 70,
        "producedQty": 70,
        "productionStatus": "PRODUCED",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00017_2",
        "symbol": "00472",
        "sku": "00472",
        "name": "[00472] 160T 310-4-03 (L) - Wspornik trójkątny ECT Lewy",
        "orderedQty": 70,
        "shippedQty": 70,
        "producedQty": 70,
        "productionStatus": "PRODUCED",
        "unitPrice": 50,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00016_ZZ-139_02_2026_EC",
    "orderRef": "ZZ-139/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00016",
    "odooOrderId": 16,
    "items": [
      {
        "id": "s00016_1",
        "symbol": "10787",
        "sku": "10787",
        "name": "[10787] EC-WE-60WE-410000-001-01 - Palak prawy krotki",
        "orderedQty": 9,
        "shippedQty": 9,
        "producedQty": 9,
        "productionStatus": "PRODUCED",
        "unitPrice": 77,
        "uom": "Szt"
      },
      {
        "id": "s00016_2",
        "symbol": "10788",
        "sku": "10788",
        "name": "[10788] EC-WE-60WE-410000-002-01 - Palak prawy dlugi",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 6,
        "productionStatus": "PRODUCED",
        "unitPrice": 77,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00015_ZZ-190_02_2026_EC",
    "orderRef": "ZZ-190/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00015",
    "odooOrderId": 15,
    "items": [
      {
        "id": "s00015_1",
        "symbol": "00471",
        "sku": "00471",
        "name": "[00471] 160T 310-4-03 (P) - Wspornik trójkątny ECT prawy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00015_2",
        "symbol": "00472",
        "sku": "00472",
        "name": "[00472] 160T 310-4-03 (L) - Wspornik trójkątny ECT Lewy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00015_3",
        "symbol": "00463",
        "sku": "00463",
        "name": "[00463] 160T 210-5-01 - Rura główna ECT",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00014_ZZ-191_02_2026_EC",
    "orderRef": "ZZ-191/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PARTIALLY_PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00014",
    "odooOrderId": 14,
    "items": [
      {
        "id": "s00014_1",
        "symbol": "10212",
        "sku": "10212",
        "name": "[10212] EC_WE-AAA-211000-002-01 - Króciec",
        "orderedQty": 3,
        "shippedQty": 3,
        "producedQty": 3,
        "productionStatus": "PRODUCED",
        "unitPrice": 25,
        "uom": "Szt"
      },
      {
        "id": "s00014_2",
        "symbol": "09761",
        "sku": "09761",
        "name": "[09761] EC_WE-AAA-120000-005-01 - Pręt gw. Regulacja",
        "orderedQty": 24,
        "shippedQty": 24,
        "producedQty": 15,
        "productionStatus": "PARTIALLY_PRODUCED",
        "unitPrice": 47,
        "uom": "Szt"
      },
      {
        "id": "s00014_3",
        "symbol": "09755",
        "sku": "09755",
        "name": "[09755] EC_WE-AAA-120000-007-02 - Tuleja",
        "orderedQty": 21,
        "shippedQty": 21,
        "producedQty": 21,
        "productionStatus": "PRODUCED",
        "unitPrice": 7.9,
        "uom": "Szt"
      },
      {
        "id": "s00014_4",
        "symbol": "00228",
        "sku": "00228",
        "name": "[00228] EC-VAC 0108000-005-01 - Podkladka uszczelniajaca",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "Szt"
      },
      {
        "id": "s00014_5",
        "symbol": "00229",
        "sku": "00229",
        "name": "[00229] EC-VAC 0108000-004-01 - Podkladka gniazdo",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00013_ZZ-138_02_2026_EC",
    "orderRef": "ZZ-138/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PARTIALLY_PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00013",
    "odooOrderId": 13,
    "items": [
      {
        "id": "s00013_1",
        "symbol": "00419",
        "sku": "00419",
        "name": "[00419] 160W 900-2-06 - Pierścień (nakrętka)",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 50,
        "productionStatus": "PRODUCED",
        "unitPrice": 30.02,
        "uom": "Szt"
      },
      {
        "id": "s00013_2",
        "symbol": "04358",
        "sku": "04358",
        "name": "[04358] 160T-01 100-1-05 - Wspornik ramienia dolnego",
        "orderedQty": 55,
        "shippedQty": 55,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "Szt"
      },
      {
        "id": "s00013_3",
        "symbol": "00389",
        "sku": "00389",
        "name": "[00389] 160W 600-3-02 - Poprzeczka",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 50,
        "productionStatus": "PRODUCED",
        "unitPrice": 35.21,
        "uom": "Szt"
      },
      {
        "id": "s00013_4",
        "symbol": "08294",
        "sku": "08294",
        "name": "[08294] 160T-01 100-1-04 - Wspornik napędu",
        "orderedQty": 35,
        "shippedQty": 35,
        "producedQty": 35,
        "productionStatus": "PRODUCED",
        "unitPrice": 105.3,
        "uom": "Szt"
      },
      {
        "id": "s00013_5",
        "symbol": "04362",
        "sku": "04362",
        "name": "[04362] 160T-01 100-1-09 - Blacha",
        "orderedQty": 35,
        "shippedQty": 35,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.8,
        "uom": "Szt"
      },
      {
        "id": "s00013_6",
        "symbol": "00476",
        "sku": "00476",
        "name": "[00476] 160T 500-5-01 - Rura stabilizująca 160ECT",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 142,
        "uom": "Szt"
      },
      {
        "id": "s00013_7",
        "symbol": "00434",
        "sku": "00434",
        "name": "[00434] 160W 200-3-06 - Księżyc systemu PPD + obróbka",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 220,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00002_ZZ-29-01-2026",
    "orderRef": "ZZ-29-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PARTIALLY_PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00002",
    "odooOrderId": 2,
    "items": [
      {
        "id": "s00002_1",
        "symbol": "00389",
        "sku": "00389",
        "name": "[00389] 160W 600-3-02 - Poprzeczka",
        "orderedQty": 120,
        "shippedQty": 120,
        "producedQty": 120,
        "productionStatus": "PRODUCED",
        "unitPrice": 35.21,
        "uom": "Szt"
      },
      {
        "id": "s00002_2",
        "symbol": "00228",
        "sku": "00228",
        "name": "[00228] EC-VAC 0108000-005-01 - Podkladka uszczelniajaca",
        "orderedQty": 57,
        "shippedQty": 57,
        "producedQty": 35,
        "productionStatus": "PARTIALLY_PRODUCED",
        "unitPrice": 21.6,
        "uom": "Szt"
      },
      {
        "id": "s00002_3",
        "symbol": "00229",
        "sku": "00229",
        "name": "[00229] EC-VAC 0108000-004-01 - Podkladka gniazdo",
        "orderedQty": 57,
        "shippedQty": 57,
        "producedQty": 37,
        "productionStatus": "PARTIALLY_PRODUCED",
        "unitPrice": 47.52,
        "uom": "Szt"
      },
      {
        "id": "s00002_4",
        "symbol": "00365",
        "sku": "00365",
        "name": "[00365] 160W 300-3-04 - Wałek drążony",
        "orderedQty": 60,
        "shippedQty": 60,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "Szt"
      },
      {
        "id": "s00002_5",
        "symbol": "11025",
        "sku": "11025",
        "name": "[11025] 160ECT-05_800-1-01_B",
        "orderedQty": 20,
        "shippedQty": 20,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130,
        "uom": "Szt"
      },
      {
        "id": "s00002_6",
        "symbol": "00463",
        "sku": "00463",
        "name": "[00463] 160T 210-5-01 - Rura główna ECT",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "Szt"
      },
      {
        "id": "s00002_7",
        "symbol": "00419",
        "sku": "00419",
        "name": "[00419] 160W 900-2-06 - Pierścień (nakrętka)",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 30,
        "productionStatus": "PRODUCED",
        "unitPrice": 30.02,
        "uom": "Szt"
      },
      {
        "id": "s00002_8",
        "symbol": "00357",
        "sku": "00357",
        "name": "[00357] 160W 210-2-01 - Tuleja 1",
        "orderedQty": 30,
        "shippedQty": 30,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "Szt"
      },
      {
        "id": "s00002_9",
        "symbol": "00228",
        "sku": "00228",
        "name": "[00228] EC-VAC 0108000-005-01 - Podkladka uszczelniajaca",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "Szt"
      },
      {
        "id": "s00002_10",
        "symbol": "00229",
        "sku": "00229",
        "name": "[00229] EC-VAC 0108000-004-01 - Podkladka gniazdo",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00012_ZZ-227_01_2026_EC",
    "orderRef": "ZZ-227/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00012",
    "odooOrderId": 12,
    "items": [
      {
        "id": "s00012_1",
        "symbol": "11542",
        "sku": "11542",
        "name": "[11542] EC_WE-111DEa_600000-005-02 - Przepust 111DEa",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85,
        "uom": "Szt"
      },
      {
        "id": "s00012_2",
        "symbol": "11542",
        "sku": "11542",
        "name": "[11542] EC_WE-111DEa_600000-005-02 - Przepust 111DEa",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00011_ZZ-154_01_2026_EC",
    "orderRef": "ZZ-154/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00011",
    "odooOrderId": 11,
    "items": [
      {
        "id": "s00011_1",
        "symbol": "00362",
        "sku": "00362",
        "name": "[00362] 160S 220-5-01 - Krzywka EC Pomalowana",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 270,
        "uom": "Szt"
      },
      {
        "id": "s00011_2",
        "symbol": "00600",
        "sku": "00600",
        "name": "[00600] P400_257000-005-01 - Przycisk",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 62,
        "uom": "Szt"
      },
      {
        "id": "s00011_3",
        "symbol": "00601",
        "sku": "00601",
        "name": "[00601] P400_257000-006-01 - Obudowa przycisku",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00011_4",
        "symbol": "00602",
        "sku": "00602",
        "name": "[00602] P400_257000-007-02 - Nakrętka przycisku",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00010_ZZ-134_01_2026_EC",
    "orderRef": "ZZ-134/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00010",
    "odooOrderId": 10,
    "items": [
      {
        "id": "s00010_1",
        "symbol": "11265",
        "sku": "11265",
        "name": "[11265] TCC30-02_140000-004-01 - Wspornik filtra",
        "orderedQty": 3,
        "shippedQty": 3,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00009_ZZ-73_01_2026_EC",
    "orderRef": "ZZ-73/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00009",
    "odooOrderId": 9,
    "items": [
      {
        "id": "s00009_1",
        "symbol": "11289",
        "sku": "11289",
        "name": "[11289] TCC30-02_110000-003-01 - Slizg",
        "orderedQty": 3,
        "shippedQty": 3,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 100,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00008_ZZ-34_02_2026_EC",
    "orderRef": "ZZ-34/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-25",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00008",
    "odooOrderId": 8,
    "items": [
      {
        "id": "s00008_1",
        "symbol": "00600",
        "sku": "00600",
        "name": "[00600] P400_257000-005-01 - Przycisk",
        "orderedQty": 17,
        "shippedQty": 17,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 62,
        "uom": "Szt"
      },
      {
        "id": "s00008_2",
        "symbol": "00601",
        "sku": "00601",
        "name": "[00601] P400_257000-006-01 - Obudowa przycisku",
        "orderedQty": 17,
        "shippedQty": 17,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      },
      {
        "id": "s00008_3",
        "symbol": "11045",
        "sku": "11045",
        "name": "[11045] 160W_200-2-06_A  OCYNK Księżyc systemu OHD + obróbka",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00007_zz-180_02_2026_ec",
    "orderRef": "zz-180/02/2026/ec",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-24",
    "deliveryDate": "2026-02-24",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00007",
    "odooOrderId": 7,
    "items": [
      {
        "id": "s00007_1",
        "symbol": "02570",
        "sku": "02570",
        "name": "[02570] RC10_721000-007-01 - Oś sprężyna",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 4,
        "productionStatus": "PRODUCED",
        "unitPrice": 80,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00006_ZZ-313_01_2026_EC",
    "orderRef": "ZZ-313/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-09",
    "deliveryDate": "2026-02-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00006",
    "odooOrderId": 6,
    "items": [
      {
        "id": "s00006_1",
        "symbol": "07611",
        "sku": "07611",
        "name": "[07611] TCC30_100000-001-04 - Wał podnoszenia",
        "orderedQty": 22,
        "shippedQty": 22,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 212.5,
        "uom": "Szt"
      },
      {
        "id": "s00006_2",
        "symbol": "07619",
        "sku": "07619",
        "name": "[07619] TCC30_130000-019-01 - Odbój",
        "orderedQty": 18,
        "shippedQty": 18,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45,
        "uom": "Szt"
      },
      {
        "id": "s00006_3",
        "symbol": "11139",
        "sku": "11139",
        "name": "[11139] TCC30_130000-036-01 - Podkladka wibroizolatora",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 13.3,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00005_ZZ-152-01-2026",
    "orderRef": "ZZ-152-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-22",
    "deliveryDate": "2026-01-22",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00005",
    "odooOrderId": 5,
    "items": [
      {
        "id": "s00005_1",
        "symbol": "11018",
        "sku": "11018",
        "name": "[11018] 160ECT-05_800-1-02 - Blok rozdzielczy 1",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 12,
        "productionStatus": "PRODUCED",
        "unitPrice": 410,
        "uom": "Szt"
      },
      {
        "id": "s00005_2",
        "symbol": "11015",
        "sku": "11015",
        "name": "[11015] 160ECT-05_800-1-03 - Blok rozdzielczy 2",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 12,
        "productionStatus": "PRODUCED",
        "unitPrice": 425,
        "uom": "Szt"
      },
      {
        "id": "s00005_3",
        "symbol": "11257",
        "sku": "11257",
        "name": "[11016] 160ECT-05_800-1-04 - Blok rozdzielczy 3",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 12,
        "productionStatus": "PRODUCED",
        "unitPrice": 610,
        "uom": "Szt"
      },
      {
        "id": "s00005_4",
        "symbol": "11022",
        "sku": "11022",
        "name": "[11022] 160ECT-05_800-1-05 -  Podpora regulatora",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 12,
        "productionStatus": "PRODUCED",
        "unitPrice": 165,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00004_ZZ-59-01-2026",
    "orderRef": "ZZ-59-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-20",
    "deliveryDate": "2026-01-20",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00004",
    "odooOrderId": 4,
    "items": [
      {
        "id": "s00004_1",
        "symbol": "04626",
        "sku": "04626",
        "name": "[04626] RC10_767200-003-02_podkladka",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14,
        "uom": "Szt"
      },
      {
        "id": "s00004_2",
        "symbol": "11528",
        "sku": "11528",
        "name": "[11528] EC-VAC_0103200-001-01 - Sruba zaslepienia misy",
        "orderedQty": 32,
        "shippedQty": 32,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00003_ZZ-31-01-2026",
    "orderRef": "ZZ-31-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-20",
    "deliveryDate": "2026-01-20",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00003",
    "odooOrderId": 3,
    "items": [
      {
        "id": "s00003_1",
        "symbol": "04623",
        "sku": "04623",
        "name": "[04623] RC10_767200-001-02 - Zakuwka pancerz 1",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80,
        "uom": "Szt"
      },
      {
        "id": "s00003_2",
        "symbol": "04625",
        "sku": "04625",
        "name": "[04625] RC10_767200-002-03 - Zakuwka linka 1",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110,
        "uom": "Szt"
      },
      {
        "id": "s00003_3",
        "symbol": "04627",
        "sku": "04627",
        "name": "[04627] RC10_767200-004-01 - Przepust",
        "orderedQty": 5,
        "shippedQty": 5,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250,
        "uom": "Szt"
      },
      {
        "id": "s00003_4",
        "symbol": "02570",
        "sku": "02570",
        "name": "[02570] RC10_721000-007-01 - Oś sprężyna",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40,
        "uom": "Szt"
      },
      {
        "id": "s00003_5",
        "symbol": "02568",
        "sku": "02568",
        "name": "[02568] RC10_721100-003-02 - Oś głowicy",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 440,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00001_ZZ-5-01-2026",
    "orderRef": "ZZ-5-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-11",
    "deliveryDate": "2026-01-11",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00001",
    "odooOrderId": 1,
    "items": [
      {
        "id": "s00001_1",
        "symbol": "K0044",
        "sku": "K0044",
        "name": "[K0044] Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 12,
        "productionStatus": "PRODUCED",
        "unitPrice": 300,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_S00051_ZZ-330_10_2025_EC",
    "orderRef": "ZZ-330/10/2025/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2025-10-15",
    "deliveryDate": "2025-10-15",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00051",
    "odooOrderId": 47,
    "items": [
      {
        "id": "s00051_1",
        "symbol": "P400_257000-006",
        "sku": "00601",
        "name": "P400_257000-006-02 - Obudowa przycisku",
        "orderedQty": 11,
        "shippedQty": 11,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50,
        "uom": "Szt"
      }
    ]
  },
  {
    "id": "ORD_MVC_07_05_2026_1",
    "orderRef": "MVC-07.05.2026-V1",
    "customerName": "MV CENTER",
    "category": "MV CENTER",
    "orderDate": "2026-05-07",
    "deliveryDate": "2026-05-20",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "DRAFT",
    "items": [
      {
        "id": "mvc_1",
        "sku": "MVC_OSL_V1",
        "name": "OsĹ‚ona kamera linijkowa blok v1",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1450,
        "uom": "szt"
      },
      {
        "id": "mvc_2",
        "sku": "MVC_OSL_V2",
        "name": "OsĹ‚ona kamera linijkowa blok v2",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1450,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_MVC_07_05_2026_2",
    "orderRef": "MVC-07.05.2026-PO6",
    "customerName": "MV CENTER",
    "category": "MV CENTER",
    "orderDate": "2026-05-07",
    "deliveryDate": "2026-05-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "DRAFT",
    "items": [
      {
        "id": "mvc_3",
        "sku": "MVC_UCHWYT_V2",
        "name": "Uchwyt podstawowy kamera linijkowa v2",
        "orderedQty": 6,
        "shippedQty": 6,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 420,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_ZMJ_16_03_2026",
    "orderRef": "ZMJ-16.03.2026",
    "customerName": "ZMJ",
    "category": "ZMJ",
    "orderDate": "2026-03-16",
    "deliveryDate": "2026-03-24",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "items": [
      {
        "id": "zmj_1",
        "sku": "MFT.08.19.01",
        "name": "Detal MFT.08.19.01",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 1,
        "productionStatus": "PRODUCED",
        "unitPrice": 850,
        "uom": "szt"
      },
      {
        "id": "zmj_2",
        "sku": "MFT.08.19.02",
        "name": "Detal MFT.08.19.02",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 1,
        "productionStatus": "PRODUCED",
        "unitPrice": 920,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_ZMJ_19_03_2026",
    "orderRef": "ZMJ-19.03.2026",
    "customerName": "ZMJ",
    "category": "ZMJ",
    "orderDate": "2026-03-19",
    "deliveryDate": "2026-03-24",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "items": [
      {
        "id": "zmj_3",
        "sku": "HVA.01.05.01",
        "name": "Detal HVA.01.05.01",
        "orderedQty": 2,
        "shippedQty": 2,
        "producedQty": 2,
        "productionStatus": "PRODUCED",
        "unitPrice": 380,
        "uom": "szt"
      },
      {
        "id": "zmj_4",
        "sku": "HVA.01.06.03",
        "name": "Detal HVA.01.06.03",
        "orderedQty": 2,
        "shippedQty": 2,
        "producedQty": 2,
        "productionStatus": "PRODUCED",
        "unitPrice": 420,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_MATMONT_73_Z_09_2026",
    "orderRef": "73-Z-09-2026 BLUEMAKE",
    "customerName": "MATMONT",
    "category": "MATMONT",
    "orderDate": "2026-09-10",
    "deliveryDate": "2026-09-15",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/MATMONT-73.pdf",
    "items": [
      {
        "id": "mat_73_1",
        "symbol": "Fazowanie blach",
        "sku": "Fazowanie blach na próbki spawalnicze",
        "name": "Fazowanie blach na próbki spawalnicze (wg rys. palnika)",
        "orderedQty": 48,
        "shippedQty": 48,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 20.00,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_MATMONT_42_Z_07_2026",
    "orderRef": "42-Z-07-2026 BLUEMAKE",
    "customerName": "MATMONT",
    "category": "MATMONT",
    "orderDate": "2026-07-01",
    "deliveryDate": "2026-07-04",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/MATMONT-42.pdf",
    "items": [
      {
        "id": "mat_42_1",
        "symbol": "35.001.32.000.002.0",
        "sku": "35.001.32.000.002.0",
        "name": "Wrzeciono z mat. X39CrMo17-1 (Zasuwa odcinająca S15 DN100 PN250)",
        "orderedQty": 3,
        "shippedQty": 3,
        "producedQty": 3,
        "productionStatus": "PRODUCED",
        "unitPrice": 855.00,
        "uom": "szt"
      },
      {
        "id": "mat_42_2",
        "symbol": "35.001.32.000.003.0",
        "sku": "35.001.32.000.003.0",
        "name": "Nakrętka BA1032 (Nakrętka wrzeciona - Zasuwa odcinająca S15 DN100 PN250)",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 4,
        "productionStatus": "PRODUCED",
        "unitPrice": 1200.00,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_MATMONT_002_NOWE",
    "orderRef": "MATMONT-002-NOWE",
    "customerName": "MATMONT",
    "category": "MATMONT",
    "orderDate": "2026-05-13",
    "deliveryDate": "2026-05-20",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "items": [
      {
        "id": "mat_2_1",
        "symbol": "CZESC01",
        "sku": "CZESC01",
        "name": "Część01",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 4,
        "productionStatus": "PRODUCED",
        "unitPrice": 280,
        "uom": "szt"
      },
      {
        "id": "mat_2_2",
        "symbol": "CZESC03A",
        "sku": "CZESC03A",
        "name": "Część03a",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 4,
        "productionStatus": "PRODUCED",
        "unitPrice": 320,
        "uom": "szt"
      },
      {
        "id": "mat_2_3",
        "symbol": "CZESC_BL5",
        "sku": "CZESC_BL5",
        "name": "Część blaszana 5",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 4,
        "productionStatus": "PRODUCED",
        "unitPrice": 190,
        "uom": "szt"
      },
      {
        "id": "mat_2_4",
        "symbol": "CZESC11",
        "sku": "CZESC11",
        "name": "Część 11",
        "orderedQty": 4,
        "shippedQty": 4,
        "producedQty": 4,
        "productionStatus": "PRODUCED",
        "unitPrice": 240,
        "uom": "szt"
      },
      {
        "id": "mat_2_5",
        "symbol": "OS_PRY",
        "sku": "OS_PRY",
        "name": "Oś 1 szt pry",
        "orderedQty": 1,
        "shippedQty": 1,
        "producedQty": 1,
        "productionStatus": "PRODUCED",
        "unitPrice": 450,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_ALPHA_I2601653",
    "orderRef": "I2601653",
    "customerName": "ALPHA TECHNOLOGY",
    "category": "ALPHA",
    "orderDate": "2026-09-22",
    "deliveryDate": "2026-09-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/I2601653.pdf",
    "items": [
      {
        "id": "alpha_1",
        "symbol": "LIC-444269",
        "sku": "LIC-444269-2090402-02-FR1",
        "name": "LIC-444269-2090402-02 Stellplatte 200x200x15 4L 4G (Frezowanie otw. fasolowych +otw gw)",
        "orderedQty": 12,
        "shippedQty": 12,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 41.00,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_ALPHA_I2601412",
    "orderRef": "Bluemake-I2601412",
    "customerName": "ALPHA TECHNOLOGY",
    "category": "ALPHA",
    "orderDate": "2026-08-05",
    "deliveryDate": "2026-09-11",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Bluemake-I2601412.pdf",
    "items": [
      {
        "id": "alpha_2",
        "symbol": "WTC-3043336",
        "sku": "WTC-3043336",
        "name": "Gewindebuchse M8x20 RD13,8x34LG",
        "orderedQty": 700,
        "shippedQty": 700,
        "producedQty": 700,
        "productionStatus": "PRODUCED",
        "unitPrice": 4.90,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_ALPHA_I2601094",
    "orderRef": "Bluemake-I2601094",
    "customerName": "ALPHA TECHNOLOGY",
    "category": "ALPHA",
    "orderDate": "2026-06-16",
    "deliveryDate": "2026-06-30",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Bluemake-I2601094.pdf",
    "items": [
      {
        "id": "alpha_3",
        "symbol": "WTC-3043336",
        "sku": "WTC-3043336",
        "name": "Gewindebuchse M8x20 RD13,8x34LG",
        "orderedQty": 710,
        "shippedQty": 710,
        "producedQty": 710,
        "productionStatus": "PRODUCED",
        "unitPrice": 9.00,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_04_2026",
    "orderRef": "BLM-04-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "2026-05-07",
    "deliveryDate": "2026-05-15",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zamówienie nr BLM-04-2026.pdf",
    "items": [
      {
        "id": "nik_4_1",
        "symbol": "PR_2191401",
        "sku": "PR_2191401",
        "name": "PR_2191401, materiał AW-6060 T66 Kątownik 160x60x8",
        "orderedQty": 25,
        "shippedQty": 25,
        "producedQty": 25,
        "productionStatus": "PRODUCED",
        "unitPrice": 100.00,
        "uom": "szt"
      },
      {
        "id": "nik_4_2",
        "symbol": "PR_2191403",
        "sku": "PR_2191403",
        "name": "PR_2191403, materiał AW-6060 T66 Kątownik 80x50x8",
        "orderedQty": 25,
        "shippedQty": 25,
        "producedQty": 25,
        "productionStatus": "PRODUCED",
        "unitPrice": 130.00,
        "uom": "szt"
      },
      {
        "id": "nik_4_3",
        "symbol": "PR_2205131",
        "sku": "PR_2205131",
        "name": "PR_2205131, materiał AW-6082 T6 T-Profil 80x50x5",
        "orderedQty": 25,
        "shippedQty": 25,
        "producedQty": 25,
        "productionStatus": "PRODUCED",
        "unitPrice": 85.00,
        "uom": "szt"
      },
      {
        "id": "nik_4_4",
        "symbol": "PR_2202601",
        "sku": "PR_2202601",
        "name": "PR_2202601, materiał AW-6060 T66 U-Profil 60x35x5x6",
        "orderedQty": 25,
        "shippedQty": 25,
        "producedQty": 25,
        "productionStatus": "PRODUCED",
        "unitPrice": 115.00,
        "uom": "szt"
      },
      {
        "id": "nik_4_5",
        "symbol": "PR_2201955",
        "sku": "PR_2201955",
        "name": "PR_2201955, materiał AW-6082 T6 T-Profil 80x50x5",
        "orderedQty": 25,
        "shippedQty": 25,
        "producedQty": 25,
        "productionStatus": "PRODUCED",
        "unitPrice": 75.00,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_02_2026",
    "orderRef": "BLM-02-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "2026-03-17",
    "deliveryDate": "2026-04-06",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zamówienie nr BLM-02-2026.pdf",
    "items": [
      {
        "id": "nik_2_1",
        "symbol": "BU_6553919_001",
        "sku": "13000124",
        "name": "13000124 usługa frezowania wg rys. BU_6553919_001",
        "orderedQty": 496,
        "shippedQty": 496,
        "producedQty": 496,
        "productionStatus": "PRODUCED",
        "unitPrice": 33.13,
        "uom": "szt"
      },
      {
        "id": "nik_2_2",
        "symbol": "BU_6553919_002",
        "sku": "13000125",
        "name": "13000125 usługa frezowania wg rys. BU_6553919_002",
        "orderedQty": 496,
        "shippedQty": 496,
        "producedQty": 496,
        "productionStatus": "PRODUCED",
        "unitPrice": 33.13,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_05_2026",
    "orderRef": "BLM-05-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "2026-05-29",
    "deliveryDate": "2026-06-02",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zamówienie nr BLM-05-2026.pdf",
    "items": [
      {
        "id": "nik_5_1",
        "symbol": "BU_6553919_001",
        "sku": "13000124",
        "name": "13000124 usługa frezowania wg rys. BU_6553919_001",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 8,
        "productionStatus": "PRODUCED",
        "unitPrice": 33.13,
        "uom": "szt"
      },
      {
        "id": "nik_5_2",
        "symbol": "BU_6553919_002",
        "sku": "13000125",
        "name": "13000125 usługa frezowania wg rys. BU_6553919_002",
        "orderedQty": 8,
        "shippedQty": 8,
        "producedQty": 8,
        "productionStatus": "PRODUCED",
        "unitPrice": 33.13,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_NIKMET_RAMOWE_KOSTKI",
    "orderRef": "ZD/K/6..11/03/2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "2026-03-24",
    "deliveryDate": "2026-04-10",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "items": [
      {
        "id": "nik_k6",
        "sku": "BU_6536550_L",
        "name": "Kostka BU_6536550 Lewy + Prawy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 50,
        "productionStatus": "PRODUCED",
        "unitPrice": 336.21,
        "uom": "kpl"
      },
      {
        "id": "nik_k7",
        "sku": "BU_6553919_L",
        "name": "Kostka BU_6553919 Lewy + Prawy",
        "orderedQty": 50,
        "shippedQty": 50,
        "producedQty": 50,
        "productionStatus": "PRODUCED",
        "unitPrice": 336.21,
        "uom": "kpl"
      },
      {
        "id": "nik_k8",
        "sku": "ZD_K_8_03",
        "name": "Kostki frezowane seria 8",
        "orderedQty": 48,
        "shippedQty": 48,
        "producedQty": 48,
        "productionStatus": "PRODUCED",
        "unitPrice": 323.28,
        "uom": "szt"
      },
      {
        "id": "nik_k10",
        "sku": "ZD_K_10_03",
        "name": "Kostki frezowane seria 10",
        "orderedQty": 48,
        "shippedQty": 48,
        "producedQty": 48,
        "productionStatus": "PRODUCED",
        "unitPrice": 323.28,
        "uom": "szt"
      },
      {
        "id": "nik_k11",
        "sku": "ZD_K_11_03",
        "name": "Kostki frezowane seria 11",
        "orderedQty": 48,
        "shippedQty": 48,
        "producedQty": 48,
        "productionStatus": "PRODUCED",
        "unitPrice": 323.28,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_03_2026",
    "orderRef": "BLM-03-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "2026-03-20",
    "deliveryDate": "2026-03-30",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zamówienie nr BLM-03-2026.pdf",
    "items": [
      {
        "id": "nik_3_1",
        "sku": "CLA_C1_2026_SZ_02",
        "name": "Komplet obrzeży aluminiowych (Obrzeże 1..6 + Uchwyt) - 13 kpl",
        "orderedQty": 13,
        "shippedQty": 13,
        "producedQty": 13,
        "productionStatus": "PRODUCED",
        "unitPrice": 450.00,
        "uom": "kpl"
      }
    ]
  }
];

export function getSavedOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS_2026));
      return INITIAL_ORDERS_2026;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_ORDERS_2026.length) {
      console.log('Upgrading orders storage to full combined database (' + INITIAL_ORDERS_2026.length + ' orders)...');
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS_2026));
      return INITIAL_ORDERS_2026;
    }
    return parsed;
  } catch (e) {
    console.error('Błąd odczytu zleceń z localStorage:', e);
    return INITIAL_ORDERS_2026;
  }
}

export function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Błąd zapisu zleceń do localStorage:', e);
  }
}

export function saveOrderToDb(order) {
  const orders = getSavedOrders();
  const idx = orders.findIndex(o => o.id === order.id || (order.odooOrderName && o.odooOrderName === order.odooOrderName));
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...order };
  } else {
    orders.unshift(order);
  }
  saveOrders(orders);
  return order;
}

export function deleteOrderFromDb(orderId) {
  const orders = getSavedOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  saveOrders(filtered);
  logAuditAction('USUNIECIE_ZAMOWIENIA', { orderId });
  return filtered;
}

export function updateOrderStatus(orderId, newStatus) {
  return setOrderProductionStatus(orderId, newStatus);
}

export function setOrderProductionStatus(orderId, newStatus) {
  const orders = getSavedOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    const oldStatus = orders[idx].productionStatus;
    orders[idx].productionStatus = newStatus;
    if (newStatus === 'PRODUCED') {
      orders[idx].items = (orders[idx].items || []).map(it => ({
        ...it,
        productionStatus: 'PRODUCED',
        producedQty: it.orderedQty
      }));
    } else if (newStatus === 'IN_PRODUCTION') {
      orders[idx].items = (orders[idx].items || []).map(it => ({
        ...it,
        productionStatus: 'IN_PRODUCTION',
        producedQty: 0
      }));
    }
    saveOrders(orders);
    logAuditAction('ZMIANA_STATUSU_ZAMOWIENIA', {
      orderId,
      numer: orders[idx].orderRef || orders[idx].odooOrderName,
      oldStatus,
      newStatus
    });
    return orders[idx];
  }
  return null;
}

export function toggleOrderProductionStatus(orderId) {
  const orders = getSavedOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  const nextStatus = order.productionStatus === 'PRODUCED' ? 'IN_PRODUCTION' : 'PRODUCED';
  return setOrderProductionStatus(orderId, nextStatus);
}

export function updateItemProducedQty(orderId, itemId, qty) {
  const orders = getSavedOrders();
  const orderIdx = orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) return null;

  const order = orders[orderIdx];
  const itemIdx = (order.items || []).findIndex(it => it.id === itemId);
  if (itemIdx === -1) return null;

  const item = order.items[itemIdx];
  const targetQty = Number(qty) || 0;
  item.producedQty = Math.max(0, targetQty);

  if (item.producedQty >= item.orderedQty) {
    item.productionStatus = 'PRODUCED';
  } else if (item.producedQty > 0) {
    item.productionStatus = 'PARTIALLY_PRODUCED';
  } else {
    item.productionStatus = 'IN_PRODUCTION';
  }

  const allProduced = order.items.every(it => it.productionStatus === 'PRODUCED');
  const anyProduced = order.items.some(it => it.productionStatus === 'PRODUCED' || it.productionStatus === 'PARTIALLY_PRODUCED');

  if (allProduced) {
    order.productionStatus = 'PRODUCED';
  } else if (anyProduced) {
    order.productionStatus = 'PARTIALLY_PRODUCED';
  } else {
    order.productionStatus = 'IN_PRODUCTION';
  }

  saveOrders(orders);
  logAuditAction('ZMIANA_ILOSCI_WYPRODUKOWANEJ', {
    orderId,
    itemId,
    symbol: item.symbol,
    producedQty: item.producedQty,
    orderedQty: item.orderedQty,
    itemStatus: item.productionStatus,
    orderStatus: order.productionStatus
  });

  return { order, item };
}

export function setItemProductionStatus(orderId, itemId, newStatus) {
  const orders = getSavedOrders();
  const orderIdx = orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) return null;

  const order = orders[orderIdx];
  const itemIdx = (order.items || []).findIndex(it => it.id === itemId);
  if (itemIdx === -1) return null;

  const item = order.items[itemIdx];
  const oldStatus = item.productionStatus;
  item.productionStatus = newStatus;

  if (newStatus === 'PRODUCED') {
    item.producedQty = item.orderedQty;
  } else if (newStatus === 'IN_PRODUCTION') {
    item.producedQty = 0;
  }

  const allProduced = order.items.every(it => it.productionStatus === 'PRODUCED');
  const anyProduced = order.items.some(it => it.productionStatus === 'PRODUCED' || it.productionStatus === 'PARTIALLY_PRODUCED');

  if (allProduced) {
    order.productionStatus = 'PRODUCED';
  } else if (anyProduced) {
    order.productionStatus = 'PARTIALLY_PRODUCED';
  } else {
    order.productionStatus = 'IN_PRODUCTION';
  }

  saveOrders(orders);
  logAuditAction('ZMIANA_STATUSU_POZYCJI', {
    orderId,
    itemId,
    symbol: item.symbol,
    oldStatus,
    newStatus
  });

  return { order, item };
}

export function toggleItemProductionStatus(orderId, itemId) {
  const orders = getSavedOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  const item = (order.items || []).find(it => it.id === itemId);
  if (!item) return null;
  const nextStatus = item.productionStatus === 'PRODUCED' ? 'IN_PRODUCTION' : 'PRODUCED';
  return setItemProductionStatus(orderId, itemId, nextStatus);
}

export function updateOrderSyncStatus(orderId, syncStatus, odooOrderName = null, odooOrderId = null) {
  const orders = getSavedOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].syncStatus = syncStatus;
    if (odooOrderName) orders[idx].odooOrderName = odooOrderName;
    if (odooOrderId) orders[idx].odooOrderId = odooOrderId;
    saveOrders(orders);
    return orders[idx];
  }
  return null;
}

export function archiveOrder(orderId) {
  const orders = getSavedOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    const oldStatus = orders[idx].productionStatus;
    orders[idx].productionStatus = 'ARCHIVED';
    orders[idx].archivedAt = new Date().toISOString();
    saveOrders(orders);
    logAuditAction('ARCHIWIZACJA_ZAMOWIENIA', {
      orderId,
      numer: orders[idx].orderRef || orders[idx].odooOrderName,
      oldStatus
    });
    return orders[idx];
  }
  return null;
}

export function unarchiveOrder(orderId) {
  const orders = getSavedOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].productionStatus = 'PRODUCED';
    delete orders[idx].archivedAt;
    saveOrders(orders);
    logAuditAction('PRZYWROCENIE_Z_ARCHIWUM', {
      orderId,
      numer: orders[idx].orderRef || orders[idx].odooOrderName
    });
    return orders[idx];
  }
  return null;
}

export function setOrderPdf(orderId, pdfUrl, pdfName) {
  const orders = getSavedOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].pdfUrl = pdfUrl;
    orders[idx].pdfName = pdfName || pdfUrl.split('/').pop();
    saveOrders(orders);
    logAuditAction('PODPIECIE_PDF_ZLECENIA', {
      orderId,
      pdfUrl,
      pdfName
    });
    return orders[idx];
  }
  return null;
}

