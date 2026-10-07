import { logAuditAction, getCurrentOperator } from './authService.js';

const ORDERS_STORAGE_KEY = 'bluemake_saved_orders_db_v14';

// Complete combined database: All Odoo synced orders (59 orders) + All external companies (MV CENTER, ZMJ, MATMONT, ALPHA, NIKMET, KINAR, Husqvarna)
export const INITIAL_ORDERS_2026 = [
  {
    "id": "ORD_S00081_ZZ-241_09_2026_EC",
    "orderRef": "ZZ-241/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-23",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00081",
    "odooOrderId": 77,
    "items": [
      {
        "id": "item_zz-241-09-2026_1",
        "symbol": "200EC_0203110-011-08",
        "sku": "01144",
        "name": "Podkładka spawalnicza duża",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 76.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_2",
        "symbol": "200EC_0203110-012-08",
        "sku": "01145",
        "name": "Podkładka spawalnicza mała",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 76.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_3",
        "symbol": "120ECI_0203110-006-07",
        "sku": "01606",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 272.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_4",
        "symbol": "120ECI_0203110-007-07",
        "sku": "01607",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 272.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_5",
        "symbol": "120ECI_0203110-004-07",
        "sku": "01605",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 272.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_6",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 212.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_7",
        "symbol": "120ECI_0203110-005-07",
        "sku": "02185",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 272.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_8",
        "symbol": "120ECI_0206110-001-07",
        "sku": "01645",
        "name": "Trzpień prowadzący",
        "revision": "A",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 170.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_9",
        "symbol": "120ECI_0206110-002-07",
        "sku": "01646",
        "name": "Kapturek sprężyny",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 76.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_10",
        "symbol": "120ECI_0206110-003-07",
        "sku": "01647",
        "name": "Blokada",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_11",
        "symbol": "120ECI_0206110-006-07",
        "sku": "01650",
        "name": "Trzpień",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 76.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_12",
        "symbol": "120eci_0206110-054-07",
        "sku": "04637",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 102.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_13",
        "symbol": "120ECI_0206110-005-07",
        "sku": "01649",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 127.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_14",
        "symbol": "120ECI_0206110-007-07",
        "sku": "01651",
        "name": "Ceownik",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 340.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_15",
        "symbol": "120ECI 0301110-004-03",
        "sku": "04425",
        "name": "Profil główny tylny",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 187.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_16",
        "symbol": "120ECI 0600122-002-01",
        "sku": "08887",
        "name": "Tuleja",
        "revision": "B",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 535.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_17",
        "symbol": "120ECI 0600110-001-01",
        "sku": "08904",
        "name": "Króciec dachowy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 467.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_18",
        "symbol": "120ECI 0600110-004-01",
        "sku": "08907",
        "name": "Tuleja przepustu",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 127.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_19",
        "symbol": "120ECI 0600100-002-01",
        "sku": "08987",
        "name": "Uchwyt dolny",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 408.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_20",
        "symbol": "120ECI 0600100-003-01",
        "sku": "08988",
        "name": "Tuleja",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 119.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_21",
        "symbol": "120ECI 0601110-013-01",
        "sku": "08932",
        "name": "Profil",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 365.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_22",
        "symbol": "120ECI 0601110-040-01",
        "sku": "08938",
        "name": "Blacha",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-09-2026_23",
        "symbol": "120ECI 0601130-007-01",
        "sku": "08951",
        "name": "Podkładka 0,5mm",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 55.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-241-09-2026.pdf"
  },
  {
    "id": "ORD_S00080_ZZ-78_09_2026_EC",
    "orderRef": "ZZ-78/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-09",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00080",
    "odooOrderId": 76,
    "items": [
      {
        "id": "item_zz-78-09-2026_1",
        "symbol": "160T 500-6-01",
        "sku": "00476",
        "name": "Rura stabilizująca 160ECT",
        "revision": "",
        "orderedQty": 88.0,
        "shippedQty": 88.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 142.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-78-09-2026_2",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-78-09-2026.pdf"
  },
  {
    "id": "ORD_S00079_ZZ-220_09_2026_EC",
    "orderRef": "ZZ-220/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-23",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00079",
    "odooOrderId": 75,
    "items": [
      {
        "id": "item_zz-220-09-2026_1",
        "symbol": "EC-WE-31WEBc-600000-005-02",
        "sku": "10698",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-220-09-2026_2",
        "symbol": "HF6 120000-005-02",
        "sku": "01353",
        "name": "Tulejka montażowa",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-220-09-2026_3",
        "symbol": "TCC30_521000-003-01",
        "sku": "10431",
        "name": "Tuleja",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 46.75,
        "uom": "szt"
      },
      {
        "id": "item_zz-220-09-2026_4",
        "symbol": "EC_WE-AAA-211000-002-01",
        "sku": "10212",
        "name": "Króciec",
        "revision": "",
        "orderedQty": 18.0,
        "shippedQty": 18.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 25.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-220-09-2026_5",
        "symbol": "160ECT-05_800-1-01",
        "sku": "11025",
        "name": "Blacha plyty sterowania",
        "revision": "B",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-220-09-2026_6",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-220-09-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-23-09-2026-ZN.pdf"
  },
  {
    "id": "ORD_S00077_ZZ-184-09-2026",
    "orderRef": "ZZ-184-09-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-17",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00077",
    "odooOrderId": 73,
    "items": [
      {
        "id": "item_zz-184-09-2026_1",
        "symbol": "EC-WE-36WE-320000-001-04",
        "sku": "K0063",
        "name": "Usługa obróbki Ramię (Odlew)",
        "revision": "B",
        "orderedQty": 124.0,
        "shippedQty": 124.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 81.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-184-09-2026.pdf"
  },
  {
    "id": "ORD_S00076_ZZ-79_09_2026_EC",
    "orderRef": "ZZ-79/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-09",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00076",
    "odooOrderId": 72,
    "items": [
      {
        "id": "item_zz-79-09-2026_1",
        "symbol": "PCU-01-000-03-02",
        "sku": "11256",
        "name": "Blok rozdzielczy",
        "revision": "A",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 603.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-09-2026_2",
        "symbol": "PCU-01-000-04-03",
        "sku": "11257",
        "name": "Trojnik rozdzielczy",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-09-2026_3",
        "symbol": "160W 210-2-01",
        "sku": "00357",
        "name": "Tuleja 1",
        "revision": "B",
        "orderedQty": 40.0,
        "shippedQty": 40.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-09-2026_4",
        "symbol": "160W 900-2-06",
        "sku": "00419",
        "name": "Pierścień (nakrętka)",
        "revision": "",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-09-2026_5",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-09-2026_6",
        "symbol": "160W 210-2-03",
        "sku": "00358",
        "name": "Tuleja 2",
        "revision": "B",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 95.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-79-09-2026.pdf"
  },
  {
    "id": "ORD_S00075_ZZ-151_09_2026_EC",
    "orderRef": "ZZ-151/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-15",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00075",
    "odooOrderId": 71,
    "items": [
      {
        "id": "item_zz-151-09-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 315.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-151-09-2026.pdf"
  },
  {
    "id": "ORD_S00074_ZZ-136_09_2026_EC",
    "orderRef": "ZZ-136/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-15",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00074",
    "odooOrderId": 70,
    "items": [
      {
        "id": "item_zz-136-09-2026_1",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-136-09-2026.pdf"
  },
  {
    "id": "ORD_S00073_ZZ-69_09_2026_EC",
    "orderRef": "ZZ-69/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-08",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00073",
    "odooOrderId": 69,
    "items": [
      {
        "id": "item_zz-69-09-2026_1",
        "symbol": "160W_200-3-06",
        "sku": "11045",
        "name": "OCYNK Księżyc systemu OHD + obróbka",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-69-09-2026.pdf"
  },
  {
    "id": "ORD_S00072_ZZ-8_09_2026_EC",
    "orderRef": "ZZ-8/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-01",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00072",
    "odooOrderId": 68,
    "items": [
      {
        "id": "item_zz-8-09-2026_1",
        "symbol": "PCU-03-000-01-01",
        "sku": "11555",
        "name": "Blacha plyty sterowania",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 170.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-8-09-2026_2",
        "symbol": "PCU-03-000-04-01",
        "sku": "11556",
        "name": "Blok rozdzielczy 2",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 490.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-8-09-2026_3",
        "symbol": "PCU-03-000-05-01",
        "sku": "11557",
        "name": "Wspornik filtra",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 100.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-8-09-2026.pdf"
  },
  {
    "id": "ORD_S00071_ZZ-190_08_2026_EC",
    "orderRef": "ZZ-190/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-08-27",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00071",
    "odooOrderId": 67,
    "items": [
      {
        "id": "item_zz-190-08-2026_1",
        "symbol": "HF6 140000-001-02",
        "sku": "01382",
        "name": "Oś",
        "revision": "A",
        "orderedQty": 18.0,
        "shippedQty": 18.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_2",
        "symbol": "HF6140000-014-01",
        "sku": "02794",
        "name": "Pręcik",
        "revision": "E",
        "orderedQty": 17.0,
        "shippedQty": 17.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_3",
        "symbol": "HF6140000-006-01",
        "sku": "01386",
        "name": "Tulejka 1",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 17.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_4",
        "symbol": "HF6 140000-007-01",
        "sku": "01387",
        "name": "Tulejka 2",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 27.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_5",
        "symbol": "HF6_140000-015-01",
        "sku": "02795",
        "name": "Krzywka (Poliamid)",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 32.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_6",
        "symbol": "ST-BVG_132000-012-01",
        "sku": "11619",
        "name": "Pręt gwintowany krańcówki",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 38.3,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_7",
        "symbol": "ST-BVG_132000-010-01",
        "sku": "11617",
        "name": "Uchwyt lewy",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 16.2,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_8",
        "symbol": "ST-BVG_132000-011-02",
        "sku": "11618",
        "name": "Uchwyt prawy",
        "revision": "",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_9",
        "symbol": "ST-BVG_110000-006-01",
        "sku": "11615",
        "name": "Blaszka pod prowadnik",
        "revision": "",
        "orderedQty": 16.0,
        "shippedQty": 16.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 11.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_10",
        "symbol": "ST-BVG_100000-008-03",
        "sku": "11622",
        "name": "Wahadło",
        "revision": "",
        "orderedQty": 16.0,
        "shippedQty": 16.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 255.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_11",
        "symbol": "ST-BVG_110000-005-02",
        "sku": "11616",
        "name": "Blacha gwintowana",
        "revision": "",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 44.2,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_12",
        "symbol": "ST-BVG 160000-001-03",
        "sku": "08027",
        "name": "Klamka",
        "revision": "",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_13",
        "symbol": "ST-BVG 160000-002-03",
        "sku": "08028",
        "name": "Podpora",
        "revision": "",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 135.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-190-08-2026_14",
        "symbol": "ST-BVG 170000-003-01",
        "sku": "08853",
        "name": "Adapter",
        "revision": "",
        "orderedQty": 7.0,
        "shippedQty": 7.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-190-08-2026.pdf"
  },
  {
    "id": "ORD_S00070_ZZ-72_09_2026_EC",
    "orderRef": "ZZ-72/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-08",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00070",
    "odooOrderId": 66,
    "items": [
      {
        "id": "item_zz-72-09-2026_1",
        "symbol": "160W 911-4-00",
        "sku": "K0029",
        "name": "Usługa obróbki Prowadzenie 160EC",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-72-09-2026_2",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 315.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-72-09-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-1-09-2026-ZN.pdf"
  },
  {
    "id": "ORD_S00068_ZZ-295-07-2026",
    "orderRef": "ZZ-295-07-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-29",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00068",
    "odooOrderId": 64,
    "items": [
      {
        "id": "item_zz-295-07-2026_1",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 40.0,
        "shippedQty": 40.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-295-07-2026_2",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 40.0,
        "shippedQty": 40.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      },
      {
        "id": "item_zz-295-07-2026_3",
        "symbol": "EC-WE_111DEa-200000-002-01",
        "sku": "10365",
        "name": "Tuleja dystansowa",
        "revision": "",
        "orderedQty": 24.0,
        "shippedQty": 24.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-295-07-2026_4",
        "symbol": "EC-WE_111DEa-200000-003-01",
        "sku": "10363",
        "name": "Dystans maskujacy",
        "revision": "",
        "orderedQty": 24.0,
        "shippedQty": 24.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-295-07-2026_5",
        "symbol": "EC_WE-111DEa_600000-005-02",
        "sku": "11542",
        "name": "Przepust 111DEa",
        "revision": "",
        "orderedQty": 32.0,
        "shippedQty": 32.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-295-07-2026_6",
        "symbol": "ec-we-36we-240000-001-03_A",
        "sku": "03502",
        "name": "Wałek",
        "revision": "",
        "orderedQty": 29.0,
        "shippedQty": 29.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-295-07-2026.pdf"
  },
  {
    "id": "ORD_S00046_ZZ-119_03_2026_EC",
    "orderRef": "ZZ-119/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-11",
    "deliveryDate": "2026-07-28",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00046",
    "odooOrderId": 46,
    "items": [
      {
        "id": "item_zz-119-03-2026_1",
        "symbol": "160S 220-5-01",
        "sku": "00362",
        "name": "Krzywka EC Pomalowana",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 370.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-119-03-2026_2",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      },
      {
        "id": "item_zz-119-03-2026_3",
        "symbol": "EC-VAC 0108000-005-01",
        "sku": "00228",
        "name": "Podkladka uszczelniajaca",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-119-03-2026_4",
        "symbol": "EC-WE-31WEBc-600000-005-01",
        "sku": "10698",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 75.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-119-03-2026.pdf"
  },
  {
    "id": "ORD_S00045_ZZ-106_04_2026_EC",
    "orderRef": "ZZ-106/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-10",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00045",
    "odooOrderId": 45,
    "items": [
      {
        "id": "item_zz-106-04-2026_1",
        "symbol": "160W 911-4-00",
        "sku": "K0029",
        "name": "Usługa obróbki Prowadzenie 160EC",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-106-04-2026.pdf"
  },
  {
    "id": "ORD_S00044_ZZ-105_03_2026_EC",
    "orderRef": "ZZ-105/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-10",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00044",
    "odooOrderId": 44,
    "items": [
      {
        "id": "item_zz-105-03-2026_1",
        "symbol": "160T-01 950-1-02",
        "sku": "04373",
        "name": "Ucho montażowe napędu",
        "revision": "",
        "orderedQty": 70.0,
        "shippedQty": 70.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-105-03-2026.pdf"
  },
  {
    "id": "ORD_S00043_ZZ-90_04_2026_EC",
    "orderRef": "ZZ-90/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-09",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00043",
    "odooOrderId": 43,
    "items": [
      {
        "id": "item_zz-90-04-2026_1",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-90-04-2026.pdf"
  },
  {
    "id": "ORD_S00042_ZZ-78-04-2026",
    "orderRef": "ZZ-78-04-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-09",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00042",
    "odooOrderId": 42,
    "items": [
      {
        "id": "item_zz-78-04-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-78-04-2026.pdf"
  },
  {
    "id": "ORD_S00041_ZZ-67_04_2026_EC",
    "orderRef": "ZZ-67/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-09",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00041",
    "odooOrderId": 41,
    "items": [
      {
        "id": "item_zz-67-04-2026_1",
        "symbol": "160W 900-2-06",
        "sku": "00419",
        "name": "Pierścień (nakrętka)",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "szt"
      },
      {
        "id": "item_zz-67-04-2026_2",
        "symbol": "EC-VAC_0103200-001-01",
        "sku": "11528",
        "name": "Sruba zaslepienia misy",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-67-04-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-64-03-2026-ZN.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-21-03-2026-ZN.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-20-04-2026-ZN.pdf"
  },
  {
    "id": "ORD_S00037_ZZ-34-03-2026",
    "orderRef": "ZZ-34-03-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-03",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00037",
    "odooOrderId": 37,
    "items": [
      {
        "id": "item_zz-34-03-2026_1",
        "symbol": "PCU-01-000-04-02",
        "sku": "11257",
        "name": "Trojnik rozdzielczy",
        "revision": "",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_2",
        "symbol": "PCU-01-000-03-02",
        "sku": "11256",
        "name": "Blok rozdzielczy",
        "revision": "A",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 603.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_3",
        "symbol": "160ECT-05_800-1-03",
        "sku": "11015",
        "name": "Blok rozdzielczy 2",
        "revision": "A",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 425.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_4",
        "symbol": "160ECT-05_800-1-04",
        "sku": "11016",
        "name": "Blok rozdzielczy 3",
        "revision": "A",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 610.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_5",
        "symbol": "160ECT-05_800-1-05",
        "sku": "11022",
        "name": "Podpora regulatora",
        "revision": "",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 165.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_6",
        "symbol": "PCU-01-000-04-02",
        "sku": "11257",
        "name": "Trojnik rozdzielczy",
        "revision": "",
        "orderedQty": 16.0,
        "shippedQty": 16.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_7",
        "symbol": "160ECT-05_800-1-03",
        "sku": "11015",
        "name": "Blok rozdzielczy 2",
        "revision": "A",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 425.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_8",
        "symbol": "160ECT-05_800-1-04",
        "sku": "11016",
        "name": "Blok rozdzielczy 3",
        "revision": "A",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 610.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_9",
        "symbol": "160ECT-05_800-1-05",
        "sku": "11022",
        "name": "Podpora regulatora",
        "revision": "",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 165.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_10",
        "symbol": "160ECT-05_800-1-01",
        "sku": "11025",
        "name": "Blacha plyty sterowania",
        "revision": "B",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_11",
        "symbol": "160ECT-05_800-1-02",
        "sku": "11018",
        "name": "Blok rozdzielczy 1",
        "revision": "B",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 410.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-03-2026_12",
        "symbol": "160ECT-05_800-1-02",
        "sku": "11018",
        "name": "Blok rozdzielczy 1",
        "revision": "B",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 410.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-34-03-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-32-03-2026-ZN.pdf"
  },
  {
    "id": "ORD_S00035_ZZ-9_03_2026_EC",
    "orderRef": "ZZ-9/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-02",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00035",
    "odooOrderId": 35,
    "items": [
      {
        "id": "item_zz-9-03-2026_1",
        "symbol": "EC-WE-36WE-320000-001-04",
        "sku": "K0063",
        "name": "Usługa obróbki Ramię (Odlew)",
        "revision": "B",
        "orderedQty": 106.0,
        "shippedQty": 106.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 81.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-9-03-2026.pdf"
  },
  {
    "id": "ORD_S00034_ZZ-8_03_2026_EC",
    "orderRef": "ZZ-8/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-02",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00034",
    "odooOrderId": 34,
    "items": [
      {
        "id": "item_zz-8-03-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-8-03-2026.pdf"
  },
  {
    "id": "ORD_S00033_ZZ-269_05_2026_EC",
    "orderRef": "ZZ-269/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-27",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00033",
    "odooOrderId": 33,
    "items": [
      {
        "id": "item_zz-269-05-2026_1",
        "symbol": "160W 911-4-00",
        "sku": "K0029",
        "name": "Usługa obróbki Prowadzenie 160EC",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-269-05-2026-przeniesiono.pdf"
  },
  {
    "id": "ORD_S00032_ZZ-259_05_2026_EC",
    "orderRef": "ZZ-259/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-27",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00032",
    "odooOrderId": 32,
    "items": [
      {
        "id": "item_zz-259-05-2026_1",
        "symbol": "160T 310-4-01",
        "sku": "00467",
        "name": "Rura wzdłużna gięta 2 00472 160T 310-4-02 (L) 50 szt 50,00 2 500,00 23% 2026-08-25 Wspornik trójkątny ECT lewy 3 00471 160T 310-4-03 (P) 50 szt 50,00 2 500,00 23% 2026-08-25 Wspornik trójkątny ECT prawy",
        "revision": "",
        "orderedQty": 70.0,
        "shippedQty": 70.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.93,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-259-05-2026.pdf"
  },
  {
    "id": "ORD_S00031_ZZ-215_03_2026_EC",
    "orderRef": "ZZ-215/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-18",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00031",
    "odooOrderId": 31,
    "items": [
      {
        "id": "item_zz-215-03-2026_1",
        "symbol": "160T 210-4-02",
        "sku": "00464",
        "name": "Wspornik stabilizatora ECT",
        "revision": "",
        "orderedQty": 37.0,
        "shippedQty": 37.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 19.53,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_2",
        "symbol": "160T 210-4-03",
        "sku": "00465",
        "name": "Tarcza ECT",
        "revision": "A",
        "orderedQty": 81.0,
        "shippedQty": 81.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 8.69,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_3",
        "symbol": "160T 310-4-04",
        "sku": "00473",
        "name": "Dźwignia ECT",
        "revision": "",
        "orderedQty": 106.0,
        "shippedQty": 106.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 20.62,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_4",
        "symbol": "160T 310-4-05",
        "sku": "00468",
        "name": "Blacha łącząca",
        "revision": "",
        "orderedQty": 104.0,
        "shippedQty": 104.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 28.39,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_5",
        "symbol": "160T 320-4-03",
        "sku": "00480",
        "name": "Blaszka",
        "revision": "",
        "orderedQty": 100.0,
        "shippedQty": 100.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1.1,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_6",
        "symbol": "160T 640-4-01",
        "sku": "00481",
        "name": "Podstawa lotki",
        "revision": "A",
        "orderedQty": 41.0,
        "shippedQty": 41.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 38.64,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_7",
        "symbol": "160T 640-4-02",
        "sku": "00483",
        "name": "Winglet 1",
        "revision": "",
        "orderedQty": 38.0,
        "shippedQty": 38.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 8.38,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_8",
        "symbol": "160T 640-4-03",
        "sku": "00482",
        "name": "Winglet 2",
        "revision": "",
        "orderedQty": 37.0,
        "shippedQty": 37.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.98,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_9",
        "symbol": "160T-01 020-1-01",
        "sku": "04385",
        "name": "Stelaż ADD 160T-01",
        "revision": "C",
        "orderedQty": 32.0,
        "shippedQty": 32.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.71,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_10",
        "symbol": "160T-01 030-1-01",
        "sku": "04383",
        "name": "Daszek zaworu PPD 160T-01",
        "revision": "",
        "orderedQty": 17.0,
        "shippedQty": 17.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.7,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_11",
        "symbol": "160T-01 100-2-13",
        "sku": "04366",
        "name": "Wspornik zaworu ADD",
        "revision": "",
        "orderedQty": 29.0,
        "shippedQty": 29.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_12",
        "symbol": "160W 000-2-08",
        "sku": "00433",
        "name": "Daszek zaworu PPD",
        "revision": "",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 5.52,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_13",
        "symbol": "160W 020-3-01",
        "sku": "00435",
        "name": "Stelaż ADD",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 36.58,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_14",
        "symbol": "160W 100-2-10",
        "sku": "00328",
        "name": "Mocowanie linki",
        "revision": "",
        "orderedQty": 66.0,
        "shippedQty": 66.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 2.06,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_15",
        "symbol": "160W 210-2-04",
        "sku": "00359",
        "name": "Żebro ramienia dolnego",
        "revision": "A",
        "orderedQty": 90.0,
        "shippedQty": 90.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 5.29,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_16",
        "symbol": "160W 210-2-08",
        "sku": "00361",
        "name": "Ucho prądowe dolne",
        "revision": "A",
        "orderedQty": 88.0,
        "shippedQty": 88.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 3.84,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_17",
        "symbol": "160W 310-3-08",
        "sku": "00376",
        "name": "Ucho prądowe górne",
        "revision": "A",
        "orderedQty": 113.0,
        "shippedQty": 113.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1.65,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_18",
        "symbol": "160W 310-3-10",
        "sku": "00474",
        "name": "Wspornik domykający",
        "revision": "",
        "orderedQty": 105.0,
        "shippedQty": 105.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.55,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_19",
        "symbol": "160W 610-2-03",
        "sku": "00394",
        "name": "Płytka prowadnika",
        "revision": "",
        "orderedQty": 176.0,
        "shippedQty": 176.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 2.83,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_20",
        "symbol": "160W 910-3-01",
        "sku": "00428",
        "name": "Blacha napędu gięta",
        "revision": "",
        "orderedQty": 44.0,
        "shippedQty": 44.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 92.4,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_21",
        "symbol": "160W 910-3-02",
        "sku": "00429",
        "name": "Wzmocnienie napedu",
        "revision": "",
        "orderedQty": 201.0,
        "shippedQty": 201.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 18.07,
        "uom": "szt"
      },
      {
        "id": "item_zz-215-03-2026_22",
        "symbol": "160W 911-3-02",
        "sku": "00431",
        "name": "Płytka prowadząca",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.74,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-215-03-2026.pdf"
  },
  {
    "id": "ORD_S00030_ZZ-192_03_2026_EC",
    "orderRef": "ZZ-192/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-17",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00030",
    "odooOrderId": 30,
    "items": [
      {
        "id": "item_zz-192-03-2026_1",
        "symbol": "160T-01 100-1-04",
        "sku": "08294",
        "name": "Wspornik napędu",
        "revision": "D",
        "orderedQty": 80.0,
        "shippedQty": 80.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_2",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 130.0,
        "shippedQty": 130.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_3",
        "symbol": "EC-WE-31WEBc-600000-005-02",
        "sku": "10698",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 24.0,
        "shippedQty": 24.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_4",
        "symbol": "160T 310-4-01",
        "sku": "00467",
        "name": "Rura wzdłużna gięta",
        "revision": "",
        "orderedQty": 80.0,
        "shippedQty": 80.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.93,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_5",
        "symbol": "160T-01 100-1-05",
        "sku": "04358",
        "name": "Wspornik ramienia dolnego",
        "revision": "A",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_6",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_7",
        "symbol": "160T 500-6-01",
        "sku": "00476",
        "name": "Rura stabilizująca 160ECT",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 142.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-192-03-2026_8",
        "symbol": "160W 210-2-01",
        "sku": "00357",
        "name": "Tuleja 1",
        "revision": "B",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-192-03-2026.pdf"
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
        "id": "ORD_S00029_ZZ-190_02_2026_EC_1",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-190-02-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-149-04-2026.pdf"
  },
  {
    "id": "ORD_S00027_ZZ-133_05_2026_EC",
    "orderRef": "ZZ-133/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-13",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00027",
    "odooOrderId": 27,
    "items": [
      {
        "id": "item_zz-133-05-2026_1",
        "symbol": "ST-BVG 170000-003-01",
        "sku": "08853",
        "name": "Adapter",
        "revision": "",
        "orderedQty": 46.0,
        "shippedQty": 46.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-133-05-2026_2",
        "symbol": "P500_257300-004-05",
        "sku": "01371",
        "name": "Cięgno",
        "revision": "",
        "orderedQty": 94.0,
        "shippedQty": 94.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-133-05-2026_3",
        "symbol": "P500_257300-005-03",
        "sku": "01372",
        "name": "Oś",
        "revision": "",
        "orderedQty": 94.0,
        "shippedQty": 94.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 63.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-133-05-2026.pdf"
  },
  {
    "id": "ORD_S00026_ZZ-62_04_2026_EC",
    "orderRef": "ZZ-62/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-09",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00026",
    "odooOrderId": 26,
    "items": [
      {
        "id": "item_zz-62-04-2026_1",
        "symbol": "HF6 140000-001-02",
        "sku": "01382",
        "name": "Oś",
        "revision": "A",
        "orderedQty": 44.0,
        "shippedQty": 44.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 54.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_2",
        "symbol": "HF6 140000-007-01",
        "sku": "01387",
        "name": "Tulejka 2",
        "revision": "",
        "orderedQty": 38.0,
        "shippedQty": 38.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 29.16,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_3",
        "symbol": "HF6_140000-015-01",
        "sku": "02795",
        "name": "Krzywka (Poliamid)",
        "revision": "",
        "orderedQty": 37.0,
        "shippedQty": 37.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 34.56,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_4",
        "symbol": "HF6140000-006-01",
        "sku": "01386",
        "name": "Tulejka 1",
        "revision": "",
        "orderedQty": 39.0,
        "shippedQty": 39.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 18.36,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_5",
        "symbol": "HF6140000-014-01",
        "sku": "02794",
        "name": "Pręcik",
        "revision": "E",
        "orderedQty": 48.0,
        "shippedQty": 48.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 48.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_6",
        "symbol": "P400_257000-004-02",
        "sku": "00599",
        "name": "Sworzeń",
        "revision": "",
        "orderedQty": 79.0,
        "shippedQty": 79.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.12,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_7",
        "symbol": "P400_257000-005-01",
        "sku": "00600",
        "name": "Przycisk",
        "revision": "",
        "orderedQty": 67.0,
        "shippedQty": 67.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 66.96,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_8",
        "symbol": "P400_257000-006-02",
        "sku": "00601",
        "name": "Obudowa przycisku",
        "revision": "",
        "orderedQty": 67.0,
        "shippedQty": 67.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 54.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_9",
        "symbol": "P400_257000-007-03",
        "sku": "00602",
        "name": "Nakrętka przycisku",
        "revision": "",
        "orderedQty": 69.0,
        "shippedQty": 69.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 48.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_10",
        "symbol": "P500_257000-003-03",
        "sku": "01408",
        "name": "Oś",
        "revision": "",
        "orderedQty": 1026.0,
        "shippedQty": 1026.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.02,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_11",
        "symbol": "P500_257300-004-05",
        "sku": "01371",
        "name": "Cięgno",
        "revision": "",
        "orderedQty": 256.0,
        "shippedQty": 256.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 75.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_12",
        "symbol": "P500_257300-005-03",
        "sku": "01372",
        "name": "Oś",
        "revision": "",
        "orderedQty": 256.0,
        "shippedQty": 256.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 68.04,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_13",
        "symbol": "ST-BVG 100000-003-02",
        "sku": "09110",
        "name": "Sworzen",
        "revision": "",
        "orderedQty": 93.0,
        "shippedQty": 93.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 18.9,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_14",
        "symbol": "ST-BVG 160000-001-03",
        "sku": "08027",
        "name": "Klamka",
        "revision": "",
        "orderedQty": 46.0,
        "shippedQty": 46.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 135.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_15",
        "symbol": "ST-BVG 160000-002-03",
        "sku": "08028",
        "name": "Podpora",
        "revision": "",
        "orderedQty": 33.0,
        "shippedQty": 33.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 145.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_16",
        "symbol": "ST-BVG_100000-008-02",
        "sku": "11622",
        "name": "Wahadło",
        "revision": "",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 255.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_17",
        "symbol": "ST-BVG_110000-005-02",
        "sku": "11616",
        "name": "Blacha gwintowana",
        "revision": "",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 44.2,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_18",
        "symbol": "ST-BVG_110000-006-01",
        "sku": "11615",
        "name": "Blaszka pod prowadnik",
        "revision": "",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 11.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_19",
        "symbol": "ST-BVG_132000-010-01",
        "sku": "11617",
        "name": "Uchwyt lewy",
        "revision": "",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 16.2,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_20",
        "symbol": "ST-BVG_132000-011-01",
        "sku": "11618",
        "name": "Uchwyt prawy",
        "revision": "",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-62-04-2026_21",
        "symbol": "ST-BVG_132000-012-01",
        "sku": "11619",
        "name": "Pręt gwintowany krańcówki",
        "revision": "",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 38.3,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-62-04-2026.pdf"
  },
  {
    "id": "ORD_S00024_ZZ-35_05_2026_EC",
    "orderRef": "ZZ-35/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-05",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00024",
    "odooOrderId": 24,
    "items": [
      {
        "id": "item_zz-35-05-2026_1",
        "symbol": "EC_WE-AAA-211000-002-01",
        "sku": "10212",
        "name": "Króciec",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 25.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_2",
        "symbol": "EC-WE-60WE-310000-008-01",
        "sku": "10786",
        "name": "Palak lewy dlugi",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_3",
        "symbol": "HF6 120000-005-02",
        "sku": "01353",
        "name": "Tulejka montażowa",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_4",
        "symbol": "EC-WE-60WE-310000-007-01",
        "sku": "10785",
        "name": "Palak lewy krotki",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_5",
        "symbol": "ec-we-36we-240000-001-03_A",
        "sku": "03502",
        "name": "Wałek",
        "revision": "",
        "orderedQty": 38.0,
        "shippedQty": 38.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_6",
        "symbol": "EC_WE-111DEa_600000-005-02",
        "sku": "11542",
        "name": "Przepust 111DEa",
        "revision": "",
        "orderedQty": 32.0,
        "shippedQty": 32.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_7",
        "symbol": "EC-WE_111DEa-200000-002-01",
        "sku": "10365",
        "name": "Tuleja dystansowa",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-35-05-2026_8",
        "symbol": "EC-WE_111DEa-200000-003-01",
        "sku": "10363",
        "name": "Dystans maskujacy Stawka Netto (PLN) VAT (PLN) Brutto (PLN) Razem: 12 072,00 2 776,56 14 848,56 W tym: 23% 12 072,00 2 776,56 14 848,56 Razem do zapłaty: 14 848,56 PLN Słownie: czternaście tysięcy osiemset czterdzieści osiem PLN 56/100",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-35-05-2026.pdf"
  },
  {
    "id": "ORD_S00023_ZZ-34_05_2026_EC",
    "orderRef": "ZZ-34/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-05",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00023",
    "odooOrderId": 23,
    "items": [
      {
        "id": "item_zz-34-05-2026_1",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 120.0,
        "shippedQty": 120.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_2",
        "symbol": "160T-01 100-1-05",
        "sku": "04358",
        "name": "Wspornik ramienia dolnego",
        "revision": "A",
        "orderedQty": 100.0,
        "shippedQty": 100.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_3",
        "symbol": "160T-01 100-1-04",
        "sku": "08294",
        "name": "Wspornik napędu",
        "revision": "D",
        "orderedQty": 100.0,
        "shippedQty": 100.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_4",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_5",
        "symbol": "160T-01 100-1-09",
        "sku": "04362",
        "name": "Blacha",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_6",
        "symbol": "160W 900-2-06",
        "sku": "00419",
        "name": "Pierścień (nakrętka)",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_7",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-05-2026_8",
        "symbol": "160S 220-5-01",
        "sku": "00362",
        "name": "Krzywka EC Pomalowana",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 370.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-34-05-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-48-02-2026-ZN.pdf"
  },
  {
    "id": "ORD_S00022_ZZ-27_05_2026_EC",
    "orderRef": "ZZ-27/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-05",
    "deliveryDate": "2026-05-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00022",
    "odooOrderId": 22,
    "items": [
      {
        "id": "item_zz-27-05-2026_1",
        "symbol": "200EC_0208100-002-08",
        "sku": "01081",
        "name": "Dystans",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 90.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_2",
        "symbol": "120ECI_0206110-005-07",
        "sku": "01649",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_3",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_4",
        "symbol": "120eci_0206110-054-07",
        "sku": "04637",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 43.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_5",
        "symbol": "120ECI_0206110-001-07",
        "sku": "01645",
        "name": "Trzpień prowadzący",
        "revision": "A",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 54.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_6",
        "symbol": "120ECI_0206110-003-07",
        "sku": "01647",
        "name": "Blokada",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_7",
        "symbol": "120ECI_0206110-006-07",
        "sku": "01650",
        "name": "Trzpień",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_8",
        "symbol": "120ECI_0206110-007-07",
        "sku": "01651",
        "name": "Ceownik",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 150.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_9",
        "symbol": "RC10_720000-003-02",
        "sku": "02666",
        "name": "Wałek osi poziomej",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_10",
        "symbol": "RC10_760000-007-01",
        "sku": "06962",
        "name": "Wspornik poliamidowy lewy",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 200.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-27-05-2026_11",
        "symbol": "RC10_760000-008-01",
        "sku": "06961",
        "name": "Wspornik poliamidowy prawy",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 200.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-27-05-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/26-00715.pdf"
  },
  {
    "id": "ORD_S00018_ZZ-15_02_2026_EC",
    "orderRef": "ZZ-15/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-03",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00018",
    "odooOrderId": 18,
    "items": [
      {
        "id": "item_zz-15-02-2026_1",
        "symbol": "P400_257000-007-03",
        "sku": "00602",
        "name": "Nakrętka przycisku",
        "revision": "",
        "orderedQty": 17.0,
        "shippedQty": 17.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-15-02-2026.pdf"
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
    ],
    "pdfUrl": "/orders_pdf/ZZ-296-11-2025.pdf"
  },
  {
    "id": "ORD_S00016_ZZ-139_02_2026_EC",
    "orderRef": "ZZ-139/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-19",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00016",
    "odooOrderId": 16,
    "items": [
      {
        "id": "item_zz-139-02-2026_1",
        "symbol": "EC-WE-60WE-410000-001-01",
        "sku": "10787",
        "name": "Palak prawy krotki",
        "revision": "",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 77.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-139-02-2026_2",
        "symbol": "EC-WE-60WE-410000-002-01",
        "sku": "10788",
        "name": "Palak prawy dlugi",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 77.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-139-02-2026.pdf"
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
        "id": "item_zz-190-02-2026_1",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-190-02-2026.pdf"
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
        "id": "item_zz-191-02-2026_1",
        "symbol": "EC_WE-AAA-211000-002-01",
        "sku": "10212",
        "name": "Króciec",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 25.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-191-02-2026_2",
        "symbol": "EC_WE-AAA-120000-005-01",
        "sku": "09761",
        "name": "Pręt gw. Regulacja",
        "revision": "A",
        "orderedQty": 24.0,
        "shippedQty": 24.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-191-02-2026_3",
        "symbol": "EC_WE-AAA-120000-007-02",
        "sku": "09755",
        "name": "Tuleja",
        "revision": "A",
        "orderedQty": 21.0,
        "shippedQty": 21.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.9,
        "uom": "szt"
      },
      {
        "id": "item_zz-191-02-2026_4",
        "symbol": "EC-VAC 0108000-005-01",
        "sku": "00228",
        "name": "Podkladka uszczelniajaca",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-191-02-2026_5",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-191-02-2026.pdf"
  },
  {
    "id": "ORD_S00013_ZZ-138_02_2026_EC",
    "orderRef": "ZZ-138/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-19",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PARTIALLY_PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00013",
    "odooOrderId": 13,
    "items": [
      {
        "id": "item_zz-138-02-2026_1",
        "symbol": "160W 900-2-06",
        "sku": "00419",
        "name": "Pierścień (nakrętka)",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "szt"
      },
      {
        "id": "item_zz-138-02-2026_2",
        "symbol": "160T-01 100-1-05",
        "sku": "04358",
        "name": "Wspornik ramienia dolnego",
        "revision": "A",
        "orderedQty": 55.0,
        "shippedQty": 55.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-138-02-2026_3",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-138-02-2026_4",
        "symbol": "160T-01 100-1-04",
        "sku": "08294",
        "name": "Wspornik napędu",
        "revision": "D",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "szt"
      },
      {
        "id": "item_zz-138-02-2026_5",
        "symbol": "160T-01 100-1-09",
        "sku": "04362",
        "name": "Blacha",
        "revision": "",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-138-02-2026_6",
        "symbol": "160T 500-6-01",
        "sku": "00476",
        "name": "Rura stabilizująca 160ECT",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 142.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-138-02-2026_7",
        "symbol": "160W 200-4-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 220.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-138-02-2026.pdf"
  },
  {
    "id": "ORD_S00002_ZZ-29-01-2026",
    "orderRef": "ZZ-29-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-08",
    "deliveryDate": "2026-02-25",
    "productionStatus": "PARTIALLY_PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00002",
    "odooOrderId": 2,
    "items": [
      {
        "id": "item_zz-29-01-2026_1",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 120.0,
        "shippedQty": 120.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_2",
        "symbol": "EC-VAC 0108000-005-01",
        "sku": "00228",
        "name": "Podkladka uszczelniajaca",
        "revision": "",
        "orderedQty": 57.0,
        "shippedQty": 57.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_3",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 57.0,
        "shippedQty": 57.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_4",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_5",
        "symbol": "160ECT-05_800-1-01",
        "sku": "11025",
        "name": "Blacha plyty sterowania",
        "revision": "B",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_6",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_7",
        "symbol": "160W 900-2-06",
        "sku": "00419",
        "name": "Pierścień (nakrętka)",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "szt"
      },
      {
        "id": "item_zz-29-01-2026_8",
        "symbol": "160W 210-2-01",
        "sku": "00357",
        "name": "Tuleja 1",
        "revision": "B",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-29-01-2026.pdf"
  },
  {
    "id": "ORD_S00012_ZZ-227_01_2026_EC",
    "orderRef": "ZZ-227/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-21",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00012",
    "odooOrderId": 12,
    "items": [
      {
        "id": "item_zz-227-01-2026_1",
        "symbol": "EC_WE-111DEa_600000-005-02",
        "sku": "11542",
        "name": "Przepust 111DEa",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-227-01-2026_2",
        "symbol": "EC_WE-111DEa_600000-005-02",
        "sku": "11542",
        "name": "Przepust 111DEa",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-227-01-2026.pdf"
  },
  {
    "id": "ORD_S00011_ZZ-154_01_2026_EC",
    "orderRef": "ZZ-154/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-14",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00011",
    "odooOrderId": 11,
    "items": [
      {
        "id": "item_zz-154-01-2026_1",
        "symbol": "160S 220-5-01",
        "sku": "00362",
        "name": "Krzywka EC Pomalowana",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 270.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-154-01-2026_2",
        "symbol": "P400_257000-005-01",
        "sku": "00600",
        "name": "Przycisk",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 62.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-154-01-2026_3",
        "symbol": "P400_257000-006-02",
        "sku": "00601",
        "name": "Obudowa przycisku",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-154-01-2026_4",
        "symbol": "P400_257000-007-03",
        "sku": "00602",
        "name": "Nakrętka przycisku",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-154-01-2026.pdf"
  },
  {
    "id": "ORD_S00010_ZZ-134_01_2026_EC",
    "orderRef": "ZZ-134/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-13",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00010",
    "odooOrderId": 10,
    "items": [
      {
        "id": "item_zz-134-01-2026_1",
        "symbol": "TCC30-02_140000-004-01",
        "sku": "11265",
        "name": "Wspornik filtra",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-134-01-2026.pdf"
  },
  {
    "id": "ORD_S00009_ZZ-73_01_2026_EC",
    "orderRef": "ZZ-73/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-09",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00009",
    "odooOrderId": 9,
    "items": [
      {
        "id": "item_zz-73-01-2026_1",
        "symbol": "TCC30-02_110000-003-01",
        "sku": "11289",
        "name": "Slizg",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 100.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-73-01-2026.pdf"
  },
  {
    "id": "ORD_S00008_ZZ-34_02_2026_EC",
    "orderRef": "ZZ-34/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-05",
    "deliveryDate": "2026-02-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00008",
    "odooOrderId": 8,
    "items": [
      {
        "id": "item_zz-34-02-2026_1",
        "symbol": "P400_257000-005-01",
        "sku": "00600",
        "name": "Przycisk",
        "revision": "",
        "orderedQty": 17.0,
        "shippedQty": 17.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 62.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-02-2026_2",
        "symbol": "P400_257000-006-02",
        "sku": "00601",
        "name": "Obudowa przycisku",
        "revision": "",
        "orderedQty": 17.0,
        "shippedQty": 17.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-02-2026_3",
        "symbol": "160W_200-2-06_A",
        "sku": "11045",
        "name": "OCYNK Księżyc systemu OHD + obróbka",
        "revision": "",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-34-02-2026.pdf"
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
        "id": "item_zz-180-02-2026_1",
        "symbol": "RC10_721000-007-01",
        "sku": "02570",
        "name": "Oś sprężyna",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-180-02-2026.pdf"
  },
  {
    "id": "ORD_S00006_ZZ-313_01_2026_EC",
    "orderRef": "ZZ-313/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-30",
    "deliveryDate": "2026-02-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00006",
    "odooOrderId": 6,
    "items": [
      {
        "id": "item_zz-313-01-2026_1",
        "symbol": "TCC30_100000-001-04",
        "sku": "07611",
        "name": "Wał podnoszenia",
        "revision": "A",
        "orderedQty": 22.0,
        "shippedQty": 22.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 212.5,
        "uom": "szt"
      },
      {
        "id": "item_zz-313-01-2026_2",
        "symbol": "TCC30_130000-019-01",
        "sku": "07619",
        "name": "Odbój",
        "revision": "",
        "orderedQty": 18.0,
        "shippedQty": 18.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 45.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-313-01-2026_3",
        "symbol": "TCC30_130000-036-01",
        "sku": "11139",
        "name": "Podkladka wibroizolatora",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 13.3,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-313-01-2026.pdf"
  },
  {
    "id": "ORD_S00005_ZZ-152-01-2026",
    "orderRef": "ZZ-152-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-14",
    "deliveryDate": "2026-01-22",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00005",
    "odooOrderId": 5,
    "items": [
      {
        "id": "item_zz-152-01-2026_1",
        "symbol": "160ECT-05_800-1-02",
        "sku": "11018",
        "name": "Blok rozdzielczy 1",
        "revision": "B",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 410.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-01-2026_2",
        "symbol": "160ECT-05_800-1-03",
        "sku": "11015",
        "name": "Blok rozdzielczy 2",
        "revision": "A",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 425.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-01-2026_3",
        "symbol": "160ECT-05_800-1-04",
        "sku": "11016",
        "name": "Blok rozdzielczy 3",
        "revision": "A",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 610.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-01-2026_4",
        "symbol": "160ECT-05_800-1-05",
        "sku": "11022",
        "name": "Podpora regulatora",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 165.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-152-01-2026.pdf"
  },
  {
    "id": "ORD_S00004_ZZ-59-01-2026",
    "orderRef": "ZZ-59-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-08",
    "deliveryDate": "2026-01-20",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00004",
    "odooOrderId": 4,
    "items": [
      {
        "id": "item_zz-59-01-2026_1",
        "symbol": "RC10_767200-003-02",
        "sku": "04626",
        "name": "Podkładka",
        "revision": "",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-59-01-2026_2",
        "symbol": "EC-VAC_0103200-001-01",
        "sku": "11528",
        "name": "Sruba zaslepienia misy",
        "revision": "",
        "orderedQty": 32.0,
        "shippedQty": 32.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-59-01-2026.pdf"
  },
  {
    "id": "ORD_S00003_ZZ-31-01-2026",
    "orderRef": "ZZ-31-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-08",
    "deliveryDate": "2026-01-20",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00003",
    "odooOrderId": 3,
    "items": [
      {
        "id": "item_zz-31-01-2026_1",
        "symbol": "RC10_767200-001-02",
        "sku": "04623",
        "name": "Zakuwka pancerz 1",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-31-01-2026_2",
        "symbol": "RC10_767200-002-03",
        "sku": "04625",
        "name": "Zakuwka linka 1",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-31-01-2026_3",
        "symbol": "RC10_767200-004-01",
        "sku": "04627",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-31-01-2026_4",
        "symbol": "RC10_721000-007-01",
        "sku": "02570",
        "name": "Oś sprężyna",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-31-01-2026_5",
        "symbol": "RC10_721100-003-02",
        "sku": "02568",
        "name": "Oś głowicy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 440.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-31-01-2026.pdf"
  },
  {
    "id": "ORD_S00001_ZZ-5-01-2026",
    "orderRef": "ZZ-5-01-2026",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-07",
    "deliveryDate": "2026-01-11",
    "productionStatus": "PRODUCED",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "S00001",
    "odooOrderId": 1,
    "items": [
      {
        "id": "item_zz-5-01-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-5-01-2026.pdf"
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
        "id": "item_zz-330-10-2025_1",
        "symbol": "P400_257000-006-02",
        "sku": "00601",
        "name": "Obudowa przycisku",
        "revision": "",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      }
    ],
    "pdfUrl": "/orders_pdf/ZZ-330-10-2025.pdf"
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
    "pdfUrl": "/orders_pdf/73-Z-09-2026%20BLUEMAKE.pdf",
    "items": [
      {
        "id": "item_73-z-09_1",
        "symbol": "Fazowanie blach",
        "sku": "MAT-FAZ-01",
        "name": "Fazowanie blach na próbki spawalnicze",
        "revision": "",
        "orderedQty": 48.0,
        "shippedQty": 48.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 20.0,
        "uom": "szt."
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
    "pdfUrl": "/orders_pdf/42-Z-07-2026%20BLUEMAKE.pdf",
    "items": [
      {
        "id": "item_42-z-07_1",
        "symbol": "Wrzeciono",
        "sku": "X39CrMo17-1",
        "name": "Wrzeciono z mat. X39CrMo17-1",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 855.0,
        "uom": "szt."
      },
      {
        "id": "item_42-z-07_2",
        "symbol": "Nakrętka",
        "sku": "BA1032",
        "name": "Nakrętka BA1032",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 1200.0,
        "uom": "szt."
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
        "id": "item_i2601653_1",
        "symbol": "LIC-444269-2090402-02-FR1",
        "sku": "LIC-444269-2090402-02-FR1",
        "name": "Frezowanie otw. fasolowych +otw gw LIC-444269-2090402-02 Stellplatte 200x200x15 4L 4G Źr. zam.: 607825",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 41.0,
        "uom": "szt."
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
        "id": "item_i2601412_1",
        "symbol": "WTC-3043336",
        "sku": "WTC-3043336",
        "name": "Gewindebuchse M8x20 RD13,8x34LG %r. zam.:",
        "revision": "",
        "orderedQty": 700.0,
        "shippedQty": 700.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 4.9,
        "uom": "szt."
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
        "id": "item_i2601094_1",
        "symbol": "WTC-3043336",
        "sku": "WTC-3043336",
        "name": "Gewindebuchse M8x20 RD13,8x34LG %r. zam.:",
        "revision": "",
        "orderedQty": 710.0,
        "shippedQty": 710.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 9.0,
        "uom": "szt."
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_04_2026",
    "orderRef": "BLM-04-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "7.05.2026",
    "deliveryDate": "2026-05-15",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zam%C3%B3wienie%20nr%20BLM-04-2026.pdf",
    "items": [
      {
        "id": "item_blm-04-2026_1",
        "symbol": "PR_2191401,",
        "sku": "PR_2191401,",
        "name": "PR_2191401, materiał AW-6060 T66 Kątownik 160x60x8",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 100.0,
        "uom": "szt."
      },
      {
        "id": "item_blm-04-2026_2",
        "symbol": "PR_2191403,",
        "sku": "PR_2191403,",
        "name": "PR_2191403, materiał AW-6060 T66 Kątownik 80x50x8",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130.0,
        "uom": "szt."
      },
      {
        "id": "item_blm-04-2026_3",
        "symbol": "PR_2205131,",
        "sku": "PR_2205131,",
        "name": "PR_2205131, materiał AW-6082 T6 T-Profil 80x50x5",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt."
      },
      {
        "id": "item_blm-04-2026_4",
        "symbol": "PR_2202601,",
        "sku": "PR_2202601,",
        "name": "PR_2202601, materiał AW-6060 T66 U-Profil 60x35x5x6",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 115.0,
        "uom": "szt."
      },
      {
        "id": "item_blm-04-2026_5",
        "symbol": "PR_2201955,",
        "sku": "PR_2201955,",
        "name": "PR_2201955, materiał AW-6082 T6 T-Profil 80x50x5",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 75.0,
        "uom": "szt."
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_02_2026",
    "orderRef": "BLM-02-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "17.03.2026",
    "deliveryDate": "2026-04-06",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zam%C3%B3wienie%20nr%20BLM-02-2026.pdf",
    "items": [
      {
        "id": "item_blm-02-2026_1",
        "symbol": "13000124",
        "sku": "13000124",
        "name": "13000124 usługa frezowania wg rys. BU_6553919_001",
        "revision": "",
        "orderedQty": 496.0,
        "shippedQty": 496.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.13,
        "uom": "szt."
      },
      {
        "id": "item_blm-02-2026_2",
        "symbol": "13000125",
        "sku": "13000125",
        "name": "13000125 usługa frezowania wg rys. BU_6553919_002",
        "revision": "",
        "orderedQty": 496.0,
        "shippedQty": 496.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.13,
        "uom": "szt."
      }
    ]
  },
  {
    "id": "ORD_NIKMET_BLM_05_2026",
    "orderRef": "BLM-05-2026",
    "customerName": "NIKMET",
    "category": "NIKMET",
    "orderDate": "29.05.2026",
    "deliveryDate": "2026-06-02",
    "productionStatus": "PRODUCED",
    "syncStatus": "DRAFT",
    "pdfUrl": "/orders_pdf/Zam%C3%B3wienie%20nr%20BLM-05-2026.pdf",
    "items": [
      {
        "id": "item_blm-05-2026_1",
        "symbol": "13000124",
        "sku": "13000124",
        "name": "13000124 usługa frezowania wg rys. BU_6553919_001",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.13,
        "uom": "szt."
      },
      {
        "id": "item_blm-05-2026_2",
        "symbol": "13000125",
        "sku": "13000125",
        "name": "13000125 usługa frezowania wg rys. BU_6553919_002",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.13,
        "uom": "szt."
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
    "pdfUrl": "/orders_pdf/Zam%C3%B3wienie%20nr%20BLM-03-2026.pdf",
    "items": [
      {
        "id": "nik_3_1",
        "sku": "CLA_C1_2026_SZ_02",
        "name": "Komplet obrzeży aluminiowych (Obrzeże 1..6 + Uchwyt) - 13 kpl",
        "orderedQty": 13,
        "shippedQty": 13,
        "producedQty": 13,
        "productionStatus": "PRODUCED",
        "unitPrice": 450.0,
        "uom": "kpl"
      }
    ]
  },
  {
    "id": "ORD_AUTO_I2600167",
    "orderRef": "I2600167",
    "customerName": "ALPHA TECHNOLOGY",
    "category": "ALPHA TECHNOLOGY",
    "orderDate": "2026-02-02",
    "deliveryDate": "2026-02-02",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "I2600167",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/Bluemake-I2600167.pdf",
    "items": [
      {
        "id": "item_i2600167_1",
        "symbol": "WTC-80033514",
        "sku": "WTC-80033514",
        "name": "SLEEVE REAR WASH fi 27X18 %r. zam.:",
        "revision": "",
        "orderedQty": 1500.0,
        "shippedQty": 1500.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 8.4,
        "uom": "szt."
      },
      {
        "id": "item_i2600167_2",
        "symbol": "WTC-3043336",
        "sku": "WTC-3043336",
        "name": "Gewindebuchse M8x20 RD13,8x34LG %r. zam.:",
        "revision": "",
        "orderedQty": 4400.0,
        "shippedQty": 4400.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 4.9,
        "uom": "szt."
      },
      {
        "id": "item_i2600167_3",
        "symbol": "WTC-3004902",
        "sku": "WTC-3004902",
        "name": "SLEEVE REAR WASH SW27X43 %r. zam.:",
        "revision": "",
        "orderedQty": 740.0,
        "shippedQty": 740.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 13.7,
        "uom": "szt."
      }
    ]
  },
  {
    "id": "ORD_AUTO_I2600168",
    "orderRef": "I2600168",
    "customerName": "ALPHA TECHNOLOGY",
    "category": "ALPHA TECHNOLOGY",
    "orderDate": "2026-02-02",
    "deliveryDate": "2026-02-02",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "I2600168",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/Bluemake-I2600168.pdf",
    "items": [
      {
        "id": "item_i2600168_1",
        "symbol": "WTC-80033514",
        "sku": "WTC-80033514",
        "name": "SLEEVE REAR WASH fi 27X18 %r. zam.:",
        "revision": "",
        "orderedQty": 500.0,
        "shippedQty": 500.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 8.4,
        "uom": "szt."
      },
      {
        "id": "item_i2600168_2",
        "symbol": "WTC-3043336",
        "sku": "WTC-3043336",
        "name": "Gewindebuchse M8x20 RD13,8x34LG %r. zam.:",
        "revision": "",
        "orderedQty": 2000.0,
        "shippedQty": 2000.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 4.9,
        "uom": "szt."
      },
      {
        "id": "item_i2600168_3",
        "symbol": "WTC-3004902",
        "sku": "WTC-3004902",
        "name": "SLEEVE REAR WASH SW27X43 %r. zam.:",
        "revision": "",
        "orderedQty": 250.0,
        "shippedQty": 250.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 13.7,
        "uom": "szt."
      }
    ]
  },
  {
    "id": "ORD_AUTO_I2600215",
    "orderRef": "I2600215",
    "customerName": "ALPHA TECHNOLOGY",
    "category": "ALPHA TECHNOLOGY",
    "orderDate": "2026-02-10",
    "deliveryDate": "2026-02-10",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "I2600215",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/Bluemake-I2600215.pdf",
    "items": [
      {
        "id": "item_i2600215_1",
        "symbol": "LIC-519915-2139848-02",
        "sku": "LIC-519915-2139848-02",
        "name": "Nabe für Hebel %r. zam.:",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 83.0,
        "uom": "szt."
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_111_07_2026",
    "orderRef": "ZZ-111/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-09",
    "deliveryDate": "2026-07-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-111/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-111-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-111-07-2026_1",
        "symbol": "TCC30_521000-003-01",
        "sku": "10431",
        "name": "Tuleja",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-111-07-2026_2",
        "symbol": "ST-BVG 170000-003-01",
        "sku": "08853",
        "name": "Adapter",
        "revision": "",
        "orderedQty": 7.0,
        "shippedQty": 7.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-111-07-2026_3",
        "symbol": "ST-BVG_100000-012-01",
        "sku": "11663",
        "name": "Zaślepka siłownika",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_113_07_2026",
    "orderRef": "ZZ-113/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-09",
    "deliveryDate": "2026-07-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-113/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-113-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-113-07-2026_1",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-113-07-2026_2",
        "symbol": "EC-WE-31WEBc-600000-005-02",
        "sku": "10698",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 22.0,
        "shippedQty": 22.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_120_03_2026",
    "orderRef": "ZZ-120/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-11",
    "deliveryDate": "2026-03-11",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-120/03/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-120-03-2026.pdf",
    "items": [
      {
        "id": "item_zz-120-03-2026_1",
        "symbol": "160W 200-4-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 81.0,
        "shippedQty": 81.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 220.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_132_05_2026",
    "orderRef": "ZZ-132/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-13",
    "deliveryDate": "2026-05-13",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-132/05/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-132-05-2026.pdf",
    "items": [
      {
        "id": "item_zz-132-05-2026_1",
        "symbol": "EC_WE-AAA-120000-007-02",
        "sku": "09755",
        "name": "Tuleja",
        "revision": "A",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.9,
        "uom": "szt"
      },
      {
        "id": "item_zz-132-05-2026_2",
        "symbol": "EC-WE-60WE-200000-005-01",
        "sku": "10769",
        "name": "Podkladka gumowa",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-132-05-2026_3",
        "symbol": "EC-WE-60WE-200000-004-01",
        "sku": "10770",
        "name": "Tuleja dystansowa",
        "revision": "A",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 46.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-132-05-2026_4",
        "symbol": "EC-WE-60WE-240000-001-01",
        "sku": "10776",
        "name": "Korba lewego ramienia",
        "revision": "A",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 87.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-132-05-2026_5",
        "symbol": "EC-WE-60WE-220000-001-01",
        "sku": "10774",
        "name": "Korba silnika",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-132-05-2026_6",
        "symbol": "EC_WE-AAA-120000-005-01",
        "sku": "09761",
        "name": "Pręt gw. Regulacja",
        "revision": "A",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_135_04_2026",
    "orderRef": "ZZ-135/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-14",
    "deliveryDate": "2026-04-14",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-135/04/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-135-04-2026.pdf",
    "items": [
      {
        "id": "item_zz-135-04-2026_1",
        "symbol": "RC10_767200-001-02",
        "sku": "04623",
        "name": "Zakuwka pancerz 1",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-135-04-2026_2",
        "symbol": "RC10_767200-003-02",
        "sku": "04626",
        "name": "Podkładka",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_14_09_2026",
    "orderRef": "ZZ-14/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-02",
    "deliveryDate": "2026-09-02",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-14/09/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-14-09-2026.pdf",
    "items": [
      {
        "id": "item_zz-14-09-2026_1",
        "symbol": "EC-WE-60WE-270000-003-01",
        "sku": "10780",
        "name": "Korba prawego ramienia",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-14-09-2026_2",
        "symbol": "EC-WE-60WE-220000-001-01",
        "sku": "10774",
        "name": "Korba silnika",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_141_03_2026",
    "orderRef": "ZZ-141/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-12",
    "deliveryDate": "2026-03-12",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-141/03/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-141-03-2026.pdf",
    "items": [
      {
        "id": "item_zz-141-03-2026_1",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-03-2026_2",
        "symbol": "120ECI_0203110-004-07",
        "sku": "01605",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-03-2026_3",
        "symbol": "120ECI_0203110-006-07",
        "sku": "01606",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-03-2026_4",
        "symbol": "120ECI_0203110-007-07",
        "sku": "01607",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-03-2026_5",
        "symbol": "120ECI_0203110-005-07",
        "sku": "02185",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-03-2026_6",
        "symbol": "200EC_0203110-011-08",
        "sku": "01144",
        "name": "Podkładka spawalnicza duża",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-03-2026_7",
        "symbol": "200EC_0203110-012-08",
        "sku": "01145",
        "name": "Podkładka spawalnicza mała",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_141_09_2026",
    "orderRef": "ZZ-141/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-15",
    "deliveryDate": "2026-09-15",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-141/09/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-141-09-2026.pdf",
    "items": [
      {
        "id": "item_zz-141-09-2026_1",
        "symbol": "RC10_720000-003-02",
        "sku": "02666",
        "name": "Wałek osi poziomej",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 375.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-09-2026_2",
        "symbol": "RC10_760000-008-01",
        "sku": "06961",
        "name": "Wspornik poliamidowy prawy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-141-09-2026_3",
        "symbol": "RC10_760000-007-01",
        "sku": "06962",
        "name": "Wspornik poliamidowy lewy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_150_04_2026",
    "orderRef": "ZZ-150/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-16",
    "deliveryDate": "2026-04-16",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-150/04/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-150-04-2026.pdf",
    "items": [
      {
        "id": "item_zz-150-04-2026_1",
        "symbol": "RC10_767200-002-03",
        "sku": "04625",
        "name": "Zakuwka linka 1",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-150-04-2026_2",
        "symbol": "RC10_767200-004-01",
        "sku": "04627",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_151_04_2026",
    "orderRef": "ZZ-151/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-16",
    "deliveryDate": "2026-04-16",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-151/04/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-151-04-2026.pdf",
    "items": [
      {
        "id": "item_zz-151-04-2026_1",
        "symbol": "EC_WE-AAA-120000-007-02",
        "sku": "09755",
        "name": "Tuleja",
        "revision": "A",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.9,
        "uom": "szt"
      },
      {
        "id": "item_zz-151-04-2026_2",
        "symbol": "EC_WE-AAA-120000-005-01",
        "sku": "09761",
        "name": "Pręt gw. Regulacja",
        "revision": "A",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-151-04-2026_3",
        "symbol": "ec-we-36we-240000-001-03_A",
        "sku": "03502",
        "name": "Wałek",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-151-04-2026_4",
        "symbol": "EC-WE-31WEBc-600000-005-02",
        "sku": "10698",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_152_06_2026",
    "orderRef": "ZZ-152/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-18",
    "deliveryDate": "2026-06-18",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-152/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-152-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-152-06-2026_1",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_2",
        "symbol": "120ECI_0203110-006-07",
        "sku": "01606",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_3",
        "symbol": "120ECI_0203110-007-07",
        "sku": "01607",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_4",
        "symbol": "200EC_0203110-011-08",
        "sku": "01144",
        "name": "Podkładka spawalnicza duża",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_5",
        "symbol": "200EC_0203110-012-08",
        "sku": "01145",
        "name": "Podkładka spawalnicza mała",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_6",
        "symbol": "120ECI_0203110-004-07",
        "sku": "01605",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_7",
        "symbol": "120ECI_0203110-005-07",
        "sku": "02185",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_8",
        "symbol": "HF6 140000-001-02",
        "sku": "01382",
        "name": "Oś",
        "revision": "A",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_9",
        "symbol": "HF6140000-006-01",
        "sku": "01386",
        "name": "Tulejka 1",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 27.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-152-06-2026_10",
        "symbol": "HF6 140000-007-01",
        "sku": "01387",
        "name": "Tulejka 2",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 37.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_153_01_2026",
    "orderRef": "ZZ-153/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-14",
    "deliveryDate": "2026-01-14",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-153/01/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-153-01-2026.pdf",
    "items": [
      {
        "id": "item_zz-153-01-2026_1",
        "symbol": "EC_WE_111DEa_600000-005-01",
        "sku": "10362",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-153-01-2026_2",
        "symbol": "EC_WE-AAA-114000-002-02",
        "sku": "01432",
        "name": "Wałek korby",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 52.3,
        "uom": "szt"
      },
      {
        "id": "item_zz-153-01-2026_3",
        "symbol": "EC_WE-AAA-211000-002-01",
        "sku": "10212",
        "name": "Króciec",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 25.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-153-01-2026_4",
        "symbol": "EC-WE_111DEa-200000-002-01",
        "sku": "10365",
        "name": "Tuleja dystansowa",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-153-01-2026_5",
        "symbol": "EC-WE_111DEa-200000-003-01",
        "sku": "10363",
        "name": "Dystans maskujacy",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-153-01-2026_6",
        "symbol": "EC-WE-60WE-200000-004-01",
        "sku": "10770",
        "name": "Tuleja dystansowa",
        "revision": "A",
        "orderedQty": 18.0,
        "shippedQty": 18.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 46.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-153-01-2026_7",
        "symbol": "EC-WE-60WE-200000-005-01",
        "sku": "10769",
        "name": "Podkladka gumowa",
        "revision": "",
        "orderedQty": 16.0,
        "shippedQty": 16.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_154_06_2026",
    "orderRef": "ZZ-154/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-18",
    "deliveryDate": "2026-06-18",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-154/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-154-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-154-06-2026_1",
        "symbol": "EC-WE_111DEa-200000-003-01",
        "sku": "10363",
        "name": "Dystans maskujacy",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-154-06-2026_2",
        "symbol": "EC-WE_111DEa-200000-002-01",
        "sku": "10365",
        "name": "Tuleja dystansowa",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_174_07_2026",
    "orderRef": "ZZ-174/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-15",
    "deliveryDate": "2026-07-15",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-174/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-174-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-174-07-2026_1",
        "symbol": "ST-BVG 170000-003-01",
        "sku": "08853",
        "name": "Adapter",
        "revision": "",
        "orderedQty": 7.0,
        "shippedQty": 7.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_2",
        "symbol": "ST-BVG 160000-001-03",
        "sku": "08027",
        "name": "Klamka",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_3",
        "symbol": "ST-BVG_100000-012-01",
        "sku": "11663",
        "name": "Zaślepka siłownika",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 17.31,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_4",
        "symbol": "ST-BVG 160000-002-03",
        "sku": "08028",
        "name": "Podpora",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 135.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_5",
        "symbol": "HF6 140000-001-02",
        "sku": "01382",
        "name": "Oś",
        "revision": "A",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_6",
        "symbol": "ST-BVG_110000-006-01",
        "sku": "11615",
        "name": "Blaszka pod prowadnik",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 11.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_7",
        "symbol": "HF6140000-006-01",
        "sku": "01386",
        "name": "Tulejka 1",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 17.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_8",
        "symbol": "HF6 140000-007-01",
        "sku": "01387",
        "name": "Tulejka 2",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 27.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-174-07-2026_9",
        "symbol": "HF6_140000-015-01",
        "sku": "02795",
        "name": "Krzywka (Poliamid)",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 32.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_175_07_2026",
    "orderRef": "ZZ-175/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-15",
    "deliveryDate": "2026-07-15",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-175/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-175-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-175-07-2026_1",
        "symbol": "EC-WE-31WEBc-600000-005-02",
        "sku": "10698",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-175-07-2026_2",
        "symbol": "EC_WE-AAA-120000-007-02",
        "sku": "09755",
        "name": "Tuleja",
        "revision": "A",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.9,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_179_03_2026",
    "orderRef": "ZZ-179/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-16",
    "deliveryDate": "2026-03-16",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-179/03/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-179-03-2026.pdf",
    "items": [
      {
        "id": "item_zz-179-03-2026_1",
        "symbol": "RC10_720000-003-02",
        "sku": "02666",
        "name": "Wałek osi poziomej",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 375.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-179-03-2026_2",
        "symbol": "RC10_760000-007-01",
        "sku": "06962",
        "name": "Wspornik poliamidowy lewy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-179-03-2026_3",
        "symbol": "RC10_760000-008-01",
        "sku": "06961",
        "name": "Wspornik poliamidowy prawy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_182_09_2026",
    "orderRef": "ZZ-182/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-16",
    "deliveryDate": "2026-09-16",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-182/09/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-182-09-2026.pdf",
    "items": [
      {
        "id": "item_zz-182-09-2026_1",
        "symbol": "RC10_767200-003-02",
        "sku": "04626",
        "name": "Podkładka",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 14.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-182-09-2026_2",
        "symbol": "RC10_767200-001-02",
        "sku": "04623",
        "name": "Zakuwka pancerz 1",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-182-09-2026_3",
        "symbol": "RC10_767200-002-03",
        "sku": "04625",
        "name": "Zakuwka linka 1",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-182-09-2026_4",
        "symbol": "RC10_767200-004-01",
        "sku": "04627",
        "name": "Przepust",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_19_08_2026",
    "orderRef": "ZZ-19/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-08-04",
    "deliveryDate": "2026-08-04",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-19/08/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-19-08-2026.pdf",
    "items": [
      {
        "id": "item_zz-19-08-2026_1",
        "symbol": "160S 220-5-01",
        "sku": "00362",
        "name": "Krzywka EC Pomalowana",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 385.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_197_08_2026",
    "orderRef": "ZZ-197/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-08-27",
    "deliveryDate": "2026-08-27",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-197/08/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-197-08-2026.pdf",
    "items": [
      {
        "id": "item_zz-197-08-2026_1",
        "symbol": "EC_WE-AAA-120000-005-01",
        "sku": "09761",
        "name": "Pręt gw. Regulacja",
        "revision": "A",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-197-08-2026_2",
        "symbol": "ec-we-36we-240000-001-03_A",
        "sku": "03502",
        "name": "Wałek",
        "revision": "",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_198_01_2026",
    "orderRef": "ZZ-198/01/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-01-16",
    "deliveryDate": "2026-01-16",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-198/01/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-198-01-2026.pdf",
    "items": [
      {
        "id": "item_zz-198-01-2026_1",
        "symbol": "PCU-02-000-01-01",
        "sku": "11538",
        "name": "Blacha plyty sterowania 3 11539 PCU-02-000-03-01 8 szt 490 0,00 23% 2026-01-26 Blok rodzielczy",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 137.62,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_206_07_2026",
    "orderRef": "ZZ-206/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-15",
    "deliveryDate": "2026-07-15",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-206/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-206-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-206-07-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 315.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_209_07_2026",
    "orderRef": "ZZ-209/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-16",
    "deliveryDate": "2026-07-16",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-209/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-209-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-209-07-2026_1",
        "symbol": "160W 911-4-00",
        "sku": "K0029",
        "name": "Usługa obróbki Prowadzenie 160EC",
        "revision": "",
        "orderedQty": 40.0,
        "shippedQty": 40.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_212_05_2026",
    "orderRef": "ZZ-212/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-21",
    "deliveryDate": "2026-05-21",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-212/05/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-212-05-2026.pdf",
    "items": [
      {
        "id": "item_zz-212-05-2026_1",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      },
      {
        "id": "item_zz-212-05-2026_2",
        "symbol": "EC-VAC 0108000-005-01",
        "sku": "00228",
        "name": "Podkladka uszczelniajaca",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_217_02_2026",
    "orderRef": "ZZ-217/02/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-02-27",
    "deliveryDate": "2026-02-27",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-217/02/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-217-02-2026.pdf",
    "items": [
      {
        "id": "item_zz-217-02-2026_1",
        "symbol": "120ECI_0206110-007-07",
        "sku": "01651",
        "name": "Ceownik",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 225.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_2",
        "symbol": "120ECI 0301110-004-03",
        "sku": "04425",
        "name": "Profil główny tylny",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 75.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_3",
        "symbol": "120ECI_0302120-001-01",
        "sku": "04446",
        "name": "Dźwignia siłownika elektrycznego",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_4",
        "symbol": "120ECI_0206110-002-07",
        "sku": "01646",
        "name": "Kapturek sprężyny",
        "revision": "",
        "orderedQty": 16.0,
        "shippedQty": 16.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 22.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_5",
        "symbol": "120ECI_0206110-003-07",
        "sku": "01647",
        "name": "Blokada",
        "revision": "",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_6",
        "symbol": "120ECI_0206110-006-07",
        "sku": "01650",
        "name": "Trzpień",
        "revision": "",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_7",
        "symbol": "120ECI_0206110-001-07",
        "sku": "01645",
        "name": "Trzpień prowadzący",
        "revision": "A",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 54.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_8",
        "symbol": "120eci_0206110-054-07",
        "sku": "04637",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 14.0,
        "shippedQty": 14.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 43.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-217-02-2026_9",
        "symbol": "120ECI_0206110-005-07",
        "sku": "01649",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 7.0,
        "shippedQty": 7.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_241_07_2026",
    "orderRef": "ZZ-241/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-21",
    "deliveryDate": "2026-07-21",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-241/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-241-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-241-07-2026_1",
        "symbol": "160ECT-02_030-1-01",
        "sku": "11083",
        "name": "Wspornik ADD+OHD",
        "revision": "",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 68.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-07-2026_2",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-07-2026_3",
        "symbol": "EC-VAC 0108000-005-01",
        "sku": "00228",
        "name": "Podkladka uszczelniajaca",
        "revision": "",
        "orderedQty": 53.0,
        "shippedQty": 53.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-07-2026_4",
        "symbol": "EC-WE_111DEa-200000-002-01",
        "sku": "10365",
        "name": "Tuleja dystansowa",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-07-2026_5",
        "symbol": "EC-WE_111DEa-200000-003-01",
        "sku": "10363",
        "name": "Dystans maskujacy",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 110.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-07-2026_6",
        "symbol": "EC_WE-111DEa_600000-005-02",
        "sku": "11542",
        "name": "Przepust 111DEa",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 85.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-241-07-2026_7",
        "symbol": "ec-we-36we-240000-001-03_A",
        "sku": "03502",
        "name": "Wałek",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_244_06_2026",
    "orderRef": "ZZ-244/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-23",
    "deliveryDate": "2026-06-23",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-244/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-244-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-244-06-2026_1",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 120.0,
        "shippedQty": 120.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-244-06-2026_2",
        "symbol": "160T 500-6-01",
        "sku": "00476",
        "name": "Rura stabilizująca 160ECT",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 142.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-244-06-2026_3",
        "symbol": "160W 210-2-03",
        "sku": "00358",
        "name": "Tuleja 2",
        "revision": "B",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 95.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-244-06-2026_4",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-244-06-2026_5",
        "symbol": "160W 900-2-06",
        "sku": "00419",
        "name": "Pierścień (nakrętka) 6 00472 160T 310-4-02 (L) 40 szt 50,00 2 000,00 23% 2026-10-05 Wspornik trójkątny ECT lewy",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 30.02,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_245_06_2026",
    "orderRef": "ZZ-245/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-23",
    "deliveryDate": "2026-06-23",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-245/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-245-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-245-06-2026_1",
        "symbol": "ec-we-36we-240000-001-03_A",
        "sku": "03502",
        "name": "Wałek",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 190.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_247_03_2026",
    "orderRef": "ZZ-247/03/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-03-25",
    "deliveryDate": "2026-03-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-247/03/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-247-03-2026.pdf",
    "items": [
      {
        "id": "item_zz-247-03-2026_1",
        "symbol": "PCU-02-000-01-02",
        "sku": "11538",
        "name": "Blacha plyty sterowania",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_254_05_2026",
    "orderRef": "ZZ-254/05/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-05-27",
    "deliveryDate": "2026-05-27",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-254/05/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-254-05-2026.pdf",
    "items": [
      {
        "id": "item_zz-254-05-2026_1",
        "symbol": "ST-BVG_100000-011-01",
        "sku": "11636",
        "name": "Sworzeń wahadła",
        "revision": "",
        "orderedQty": 203.0,
        "shippedQty": 203.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 24.11,
        "uom": "szt"
      },
      {
        "id": "item_zz-254-05-2026_2",
        "symbol": "ST-BVG_100000-012-01",
        "sku": "11663",
        "name": "Zaślepka siłownika",
        "revision": "",
        "orderedQty": 52.0,
        "shippedQty": 52.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 17.31,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_271_06_2026",
    "orderRef": "ZZ-271/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-25",
    "deliveryDate": "2026-06-25",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-271/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-271-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-271-06-2026_1",
        "symbol": "EC-WE-36WE-320000-001-04",
        "sku": "K0063",
        "name": "Usługa obróbki Ramię (Odlew)",
        "revision": "B",
        "orderedQty": 51.0,
        "shippedQty": 51.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 81.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_28_10_2026",
    "orderRef": "ZZ-28/10/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-10-02",
    "deliveryDate": "2026-10-02",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-28/10/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-28-10-2026.pdf",
    "items": [
      {
        "id": "item_zz-28-10-2026_1",
        "symbol": "200EC_0203110-011-08",
        "sku": "01144",
        "name": "Podkładka spawalnicza duża",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 90.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_2",
        "symbol": "200EC_0203110-012-08",
        "sku": "01145",
        "name": "Podkładka spawalnicza mała",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 90.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_3",
        "symbol": "120ECI_0206110-001-07",
        "sku": "01645",
        "name": "Trzpień prowadzący",
        "revision": "A",
        "orderedQty": 26.0,
        "shippedQty": 26.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_4",
        "symbol": "120ECI_0206110-002-07",
        "sku": "01646",
        "name": "Kapturek sprężyny",
        "revision": "",
        "orderedQty": 26.0,
        "shippedQty": 26.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_5",
        "symbol": "120ECI_0206110-003-07",
        "sku": "01647",
        "name": "Blokada",
        "revision": "",
        "orderedQty": 26.0,
        "shippedQty": 26.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 80.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_6",
        "symbol": "120ECI_0206110-006-07",
        "sku": "01650",
        "name": "Trzpień",
        "revision": "",
        "orderedQty": 26.0,
        "shippedQty": 26.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 74.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_7",
        "symbol": "120eci_0206110-054-07",
        "sku": "04637",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 26.0,
        "shippedQty": 26.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 95.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_8",
        "symbol": "120ECI_0206110-007-07",
        "sku": "01651",
        "name": "Ceownik",
        "revision": "",
        "orderedQty": 16.0,
        "shippedQty": 16.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_9",
        "symbol": "120ECI_0206110-005-07",
        "sku": "01649",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 13.0,
        "shippedQty": 13.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 118.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_10",
        "symbol": "120ECI_0203110-006-07",
        "sku": "01606",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 320.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_11",
        "symbol": "120ECI_0203110-007-07",
        "sku": "01607",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 320.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_12",
        "symbol": "120ECI 0301110-004-03",
        "sku": "04425",
        "name": "Profil główny tylny",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 220.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_13",
        "symbol": "120ECI_0302120-001-01",
        "sku": "04446",
        "name": "Dźwignia siłownika elektrycznego",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_14",
        "symbol": "120ECI_0203110-004-07",
        "sku": "01605",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 320.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_15",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 250.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-28-10-2026_16",
        "symbol": "120ECI_0203110-005-07",
        "sku": "02185",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 320.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_292_09_2026",
    "orderRef": "ZZ-292/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-30",
    "deliveryDate": "2026-09-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-292/09/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-292-09-2026.pdf",
    "items": [
      {
        "id": "item_zz-292-09-2026_1",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_293_07_2026",
    "orderRef": "ZZ-293/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-29",
    "deliveryDate": "2026-07-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-293/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-293-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-293-07-2026_1",
        "symbol": "PCU-01-000-03-02",
        "sku": "11256",
        "name": "Blok rozdzielczy",
        "revision": "A",
        "orderedQty": 18.0,
        "shippedQty": 18.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 603.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-293-07-2026_2",
        "symbol": "PCU-02-000-01-02",
        "sku": "11538",
        "name": "Blacha plyty sterowania",
        "revision": "",
        "orderedQty": 10.0,
        "shippedQty": 10.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 130.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-293-07-2026_3",
        "symbol": "PCU-01-000-04-03",
        "sku": "11257",
        "name": "Trojnik rozdzielczy",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_294_07_2026",
    "orderRef": "ZZ-294/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-29",
    "deliveryDate": "2026-07-29",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-294/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-294-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-294-07-2026_1",
        "symbol": "HF6 140000-001-02",
        "sku": "01382",
        "name": "Oś",
        "revision": "A",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 70.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_2",
        "symbol": "ST-BVG_132000-010-01",
        "sku": "11617",
        "name": "Uchwyt lewy",
        "revision": "",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 28.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_3",
        "symbol": "ST-BVG_132000-011-02",
        "sku": "11618",
        "name": "Uchwyt prawy",
        "revision": "",
        "orderedQty": 9.0,
        "shippedQty": 9.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 27.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_4",
        "symbol": "HF6_140000-015-01",
        "sku": "02795",
        "name": "Krzywka (Poliamid)",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 60.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_5",
        "symbol": "ST-BVG_132000-012-01",
        "sku": "11619",
        "name": "Pręt gwintowany krańcówki",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 55.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_6",
        "symbol": "ST-BVG 160000-001-03",
        "sku": "08027",
        "name": "Klamka",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_7",
        "symbol": "ST-BVG 160000-002-03",
        "sku": "08028",
        "name": "Podpora",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 135.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_8",
        "symbol": "HF6140000-006-01",
        "sku": "01386",
        "name": "Tulejka 1",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 17.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_9",
        "symbol": "HF6 140000-007-01",
        "sku": "01387",
        "name": "Tulejka 2",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 27.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-294-07-2026_10",
        "symbol": "HF6140000-014-01",
        "sku": "02794",
        "name": "Pręcik",
        "revision": "E",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 60.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_319_07_2026",
    "orderRef": "ZZ-319/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-30",
    "deliveryDate": "2026-07-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-319/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-319-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-319-07-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 36.0,
        "shippedQty": 36.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 315.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_32_10_2026",
    "orderRef": "ZZ-32/10/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-10-02",
    "deliveryDate": "2026-10-02",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-32/10/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-32-10-2026.pdf",
    "items": [
      {
        "id": "item_zz-32-10-2026_1",
        "symbol": "160T-01 100-1-05",
        "sku": "04358",
        "name": "Wspornik ramienia dolnego",
        "revision": "A",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-32-10-2026_2",
        "symbol": "160T-01 100-1-04",
        "sku": "08294",
        "name": "Wspornik napędu",
        "revision": "D",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "szt"
      },
      {
        "id": "item_zz-32-10-2026_3",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-32-10-2026_4",
        "symbol": "RC10_721000-007-01",
        "sku": "02570",
        "name": "Oś sprężyna",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-32-10-2026_5",
        "symbol": "RC10_721100-003-02",
        "sku": "02568",
        "name": "Oś głowicy",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 440.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_321_07_2026",
    "orderRef": "ZZ-321/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-30",
    "deliveryDate": "2026-07-30",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-321/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-321-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-321-07-2026_1",
        "symbol": "200EC_0203110-011-08",
        "sku": "01144",
        "name": "Podkładka spawalnicza duża",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-321-07-2026_2",
        "symbol": "200EC_0203110-012-08",
        "sku": "01145",
        "name": "Podkładka spawalnicza mała",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-321-07-2026_3",
        "symbol": "120ECI_0203110-006-07",
        "sku": "01606",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-321-07-2026_4",
        "symbol": "120ECI_0203110-007-07",
        "sku": "01607",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-321-07-2026_5",
        "symbol": "120ECI_0203110-004-07",
        "sku": "01605",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-321-07-2026_6",
        "symbol": "120ECI_0203110-005-07",
        "sku": "02185",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-321-07-2026_7",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_329_07_2026",
    "orderRef": "ZZ-329/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-31",
    "deliveryDate": "2026-07-31",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-329/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-329-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-329-07-2026_1",
        "symbol": "EC-WE-60WE-310000-007-01",
        "sku": "10785",
        "name": "Palak lewy krotki",
        "revision": "",
        "orderedQty": 5.0,
        "shippedQty": 5.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-329-07-2026_2",
        "symbol": "EC-WE-60WE-310000-008-01",
        "sku": "10786",
        "name": "Palak lewy dlugi",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-329-07-2026_3",
        "symbol": "EC-WE-60WE-410000-001-01",
        "sku": "10787",
        "name": "Palak prawy krotki",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 122.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-329-07-2026_4",
        "symbol": "EC-WE-60WE-410000-002-01",
        "sku": "10788",
        "name": "Palak prawy dlugi",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 122.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_34_07_2026",
    "orderRef": "ZZ-34/07/2026/ZN",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-06",
    "deliveryDate": "2026-07-31",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-34/07/2026/ZN",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/zz-34_07_2026_ec.pdf",
    "items": [
      {
        "id": "item_zz-34-07-2026_1",
        "symbol": "ST-BVG 160000-001-03",
        "sku": "08027",
        "name": "Klamka *08027*",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 125.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-34-07-2026_2",
        "symbol": "ST-BVG 160000-002-03",
        "sku": "08028",
        "name": "Podpora *08028* Stawka Netto (PLN) VAT (PLN) Brutto (PLN) Razem: 645,00 148,35 793,35 W tym: 23% 645,00 148,35 793,35 Razem do zapłaty: 793,35 PLN Słownie: siedemset dziewięćdziesiąt trzy PLN 35/100",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 135.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_38_09_2026",
    "orderRef": "ZZ-38/09/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-09-03",
    "deliveryDate": "2026-09-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-38/09/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-38-09-2026.pdf",
    "items": [
      {
        "id": "item_zz-38-09-2026_1",
        "symbol": "160S 220-5-01",
        "sku": "00362",
        "name": "Krzywka EC Pomalowana",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 385.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-38-09-2026_2",
        "symbol": "EC-VAC 0108000-005-01",
        "sku": "00228",
        "name": "Podkladka uszczelniajaca",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 21.6,
        "uom": "szt"
      },
      {
        "id": "item_zz-38-09-2026_3",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 50.0,
        "shippedQty": 50.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_48_07_2026",
    "orderRef": "ZZ-48/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-07",
    "deliveryDate": "2026-07-07",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-48/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-48-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-48-07-2026_1",
        "symbol": "160T-01 950-1-00",
        "sku": "K0044",
        "name": "Usługa malowania i obróbki Wspornik napędu RAL 7021",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 300.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_51_06_2026",
    "orderRef": "ZZ-51/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-03",
    "deliveryDate": "2026-06-03",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-51/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-51-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-51-06-2026_1",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 130.0,
        "shippedQty": 130.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_2",
        "symbol": "160T-01 950-1-02",
        "sku": "04373",
        "name": "Ucho montażowe napędu",
        "revision": "",
        "orderedQty": 40.0,
        "shippedQty": 40.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 6.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_3",
        "symbol": "160W 210-2-01",
        "sku": "00357",
        "name": "Tuleja 1",
        "revision": "B",
        "orderedQty": 55.0,
        "shippedQty": 55.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_4",
        "symbol": "160T 210-5-01",
        "sku": "00463",
        "name": "Rura główna ECT",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 260.1,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_5",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 30.0,
        "shippedQty": 30.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_6",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 48.0,
        "shippedQty": 48.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_7",
        "symbol": "PCU-02-000-03-01",
        "sku": "11539",
        "name": "Blok rodzielczy",
        "revision": "A",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 490.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-51-06-2026_8",
        "symbol": "160T-01 100-1-04",
        "sku": "08294",
        "name": "Wspornik napędu",
        "revision": "D",
        "orderedQty": 35.0,
        "shippedQty": 35.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 105.3,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_63_06_2026",
    "orderRef": "ZZ-63/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-09",
    "deliveryDate": "2026-06-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-63/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-63-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-63-06-2026_1",
        "symbol": "TCC30_100000-003-03",
        "sku": "07614",
        "name": "Izolator potencjometru 2",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 270.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-63-06-2026_2",
        "symbol": "TCC30_100000-004-04",
        "sku": "07615",
        "name": "Wałek potencjometru",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 119.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-63-06-2026_3",
        "symbol": "TCC30_100000-009-04",
        "sku": "07622",
        "name": "Szpilka specjalna M10",
        "revision": "",
        "orderedQty": 19.0,
        "shippedQty": 19.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 153.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-63-06-2026_4",
        "symbol": "TCC30_100000-014-05",
        "sku": "07627",
        "name": "Wał dlugi",
        "revision": "",
        "orderedQty": 7.0,
        "shippedQty": 7.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 140.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-63-06-2026_5",
        "symbol": "TCC30_130000-033-01",
        "sku": "11117",
        "name": "Sworzen",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 60.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-63-06-2026_6",
        "symbol": "TCC30_140000-016-01",
        "sku": "11670",
        "name": "Mocowanie wiazki",
        "revision": "",
        "orderedQty": 12.0,
        "shippedQty": 12.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 43.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_64_08_2026",
    "orderRef": "ZZ-64/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-08-12",
    "deliveryDate": "2026-08-12",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-64/08/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-64-08-2026.pdf",
    "items": [
      {
        "id": "item_zz-64-08-2026_1",
        "symbol": "120ECI_0203130-001-07",
        "sku": "01617",
        "name": "Rura drążka ślizgacza",
        "revision": "",
        "orderedQty": 1.0,
        "shippedQty": 1.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 210.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_65_08_2026",
    "orderRef": "ZZ-65/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-08-12",
    "deliveryDate": "2026-08-12",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-65/08/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-65-08-2026.pdf",
    "items": [
      {
        "id": "item_zz-65-08-2026_1",
        "symbol": "160W 200-5-05",
        "sku": "00434",
        "name": "OCYNK Księżyc systemu PPD + obróbka",
        "revision": "",
        "orderedQty": 100.0,
        "shippedQty": 100.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 230.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_72_06_2026",
    "orderRef": "ZZ-72/06/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-06-09",
    "deliveryDate": "2026-06-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-72/06/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-72-06-2026.pdf",
    "items": [
      {
        "id": "item_zz-72-06-2026_1",
        "symbol": "EC_WE-AAA-120000-007-02",
        "sku": "09755",
        "name": "Tuleja",
        "revision": "A",
        "orderedQty": 24.0,
        "shippedQty": 24.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 7.9,
        "uom": "szt"
      },
      {
        "id": "item_zz-72-06-2026_2",
        "symbol": "EC_WE-AAA-120000-005-01",
        "sku": "09761",
        "name": "Pręt gw. Regulacja",
        "revision": "A",
        "orderedQty": 15.0,
        "shippedQty": 15.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_72_10_2026",
    "orderRef": "ZZ-72/10/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-10-06",
    "deliveryDate": "2026-10-06",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-72/10/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-72-10-2026.pdf",
    "items": [
      {
        "id": "item_zz-72-10-2026_1",
        "symbol": "160W 911-4-00",
        "sku": "K0029",
        "name": "Usługa obróbki Prowadzenie 160EC",
        "revision": "",
        "orderedQty": 20.0,
        "shippedQty": 20.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 42.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_75_10_2026",
    "orderRef": "ZZ-75/10/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-10-06",
    "deliveryDate": "2026-10-06",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-75/10/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-75-10-2026.pdf",
    "items": [
      {
        "id": "item_zz-75-10-2026_1",
        "symbol": "EC-WE-E36C-310000-001-01",
        "sku": "11776",
        "name": "Pałąk 1",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-75-10-2026_2",
        "symbol": "EC-WE-E36C-310000-002-01",
        "sku": "11777",
        "name": "Pałąk 2",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_79_07_2026",
    "orderRef": "ZZ-79/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-08",
    "deliveryDate": "2026-07-08",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-79/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-79-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-79-07-2026_1",
        "symbol": "160S 220-5-01",
        "sku": "00362",
        "name": "Krzywka EC Pomalowana",
        "revision": "",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 370.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-07-2026_2",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 100.0,
        "shippedQty": 100.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-07-2026_3",
        "symbol": "EC-VAC_0103200-001-01",
        "sku": "11528",
        "name": "Sruba zaslepienia misy",
        "revision": "",
        "orderedQty": 8.0,
        "shippedQty": 8.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 40.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_79_10_2026",
    "orderRef": "ZZ-79/10/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-10-06",
    "deliveryDate": "2026-10-06",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-79/10/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-79-10-2026.pdf",
    "items": [
      {
        "id": "item_zz-79-10-2026_1",
        "symbol": "160W 300-3-04",
        "sku": "00365",
        "name": "Wałek drążony",
        "revision": "",
        "orderedQty": 25.0,
        "shippedQty": 25.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 172.8,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-10-2026_2",
        "symbol": "160W 210-2-01",
        "sku": "00357",
        "name": "Tuleja 1",
        "revision": "B",
        "orderedQty": 40.0,
        "shippedQty": 40.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 269.24,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-10-2026_3",
        "symbol": "160W 600-3-02",
        "sku": "00389",
        "name": "Poprzeczka",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 35.21,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-10-2026_4",
        "symbol": "EC-VAC 0108000-004-01",
        "sku": "00229",
        "name": "Podkladka gniazdo",
        "revision": "",
        "orderedQty": 60.0,
        "shippedQty": 60.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 47.52,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-10-2026_5",
        "symbol": "PCU-01-000-03-02",
        "sku": "11256",
        "name": "Blok rozdzielczy",
        "revision": "A",
        "orderedQty": 6.0,
        "shippedQty": 6.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 603.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-10-2026_6",
        "symbol": "PCU-01-000-04-03",
        "sku": "11257",
        "name": "Trojnik rozdzielczy",
        "revision": "",
        "orderedQty": 11.0,
        "shippedQty": 11.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 171.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-79-10-2026_7",
        "symbol": "PCU-02-000-03-01",
        "sku": "11539",
        "name": "Blok rodzielczy",
        "revision": "A",
        "orderedQty": 7.0,
        "shippedQty": 7.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 490.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_80_07_2026",
    "orderRef": "ZZ-80/07/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-07-08",
    "deliveryDate": "2026-07-08",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-80/07/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-80-07-2026.pdf",
    "items": [
      {
        "id": "item_zz-80-07-2026_1",
        "symbol": "120ECI_0203110-006-07",
        "sku": "01606",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-80-07-2026_2",
        "symbol": "120ECI_0203110-007-07",
        "sku": "01607",
        "name": "Blacha mocująca",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 160.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-80-07-2026_3",
        "symbol": "200EC_0203110-011-08",
        "sku": "01144",
        "name": "Podkładka spawalnicza duża",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-80-07-2026_4",
        "symbol": "200EC_0203110-012-08",
        "sku": "01145",
        "name": "Podkładka spawalnicza mała",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 50.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-80-07-2026_5",
        "symbol": "120ECI_0203110-004-07",
        "sku": "01605",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      },
      {
        "id": "item_zz-80-07-2026_6",
        "symbol": "120ECI_0203110-005-07",
        "sku": "02185",
        "name": "Ucho przegubu",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 215.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_81_10_2026",
    "orderRef": "ZZ-81/10/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-10-06",
    "deliveryDate": "2026-10-06",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-81/10/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-81-10-2026.pdf",
    "items": [
      {
        "id": "item_zz-81-10-2026_1",
        "symbol": "RC10_769000-001-01",
        "sku": "04553",
        "name": "Łącznik",
        "revision": "",
        "orderedQty": 2.0,
        "shippedQty": 2.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 33.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_87_08_2026",
    "orderRef": "ZZ-87/08/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-08-13",
    "deliveryDate": "2026-08-13",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-87/08/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-87-08-2026.pdf",
    "items": [
      {
        "id": "item_zz-87-08-2026_1",
        "symbol": "ST-BVG_100000-008-03",
        "sku": "11622",
        "name": "Wahadło",
        "revision": "",
        "orderedQty": 4.0,
        "shippedQty": 4.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 340.0,
        "uom": "szt"
      }
    ]
  },
  {
    "id": "ORD_AUTO_ZZ_93_04_2026",
    "orderRef": "ZZ-93/04/2026/EC",
    "customerName": "EC Engineering",
    "category": "EC Engineering",
    "orderDate": "2026-04-09",
    "deliveryDate": "2026-04-09",
    "productionStatus": "IN_PRODUCTION",
    "syncStatus": "SYNCED_ODOO",
    "odooOrderName": "ZZ-93/04/2026/EC",
    "odooOrderId": null,
    "pdfUrl": "/orders_pdf/ZZ-93-04-2026.pdf",
    "items": [
      {
        "id": "item_zz-93-04-2026_1",
        "symbol": "120eci_0206110-054-07",
        "sku": "04637",
        "name": "Tuleja ślizgowa",
        "revision": "",
        "orderedQty": 3.0,
        "shippedQty": 3.0,
        "producedQty": 0,
        "productionStatus": "IN_PRODUCTION",
        "unitPrice": 128.0,
        "uom": "szt"
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

export function getOrderYear(order) {
  if (!order) return '2026';
  // 1. Check orderRef for 4-digit year (2020 - 2035)
  if (order.orderRef && typeof order.orderRef === 'string') {
    const m = order.orderRef.match(/[\/\-_](202[0-9]|203[0-9])(?:\b|[\/\-_])/);
    if (m) return m[1];
    // Check 2-digit year at delimiter, e.g. /26, -26, /25
    const m2 = order.orderRef.match(/[\/\-_](2[4-9])(?:\b|[\/\-_])/);
    if (m2) return `20${m2[1]}`;
  }
  // 2. Check orderDate YYYY-MM-DD
  if (order.orderDate && typeof order.orderDate === 'string') {
    const m = order.orderDate.match(/^(202[0-9]|203[0-9])/);
    if (m) return m[1];
  }
  // 3. Check deliveryDate YYYY-MM-DD
  if (order.deliveryDate && typeof order.deliveryDate === 'string') {
    const m = order.deliveryDate.match(/^(202[0-9]|203[0-9])/);
    if (m) return m[1];
  }
  // 4. Check ID
  if (order.id && typeof order.id === 'string') {
    const m = order.id.match(/[\/\-_](202[0-9]|203[0-9])[\/\-_]/);
    if (m) return m[1];
  }
  return '2026';
}

export function getAvailableOrderYears() {
  const orders = getSavedOrders();
  const years = new Set(['2025', '2026', '2027']);
  orders.forEach(o => {
    const y = getOrderYear(o);
    if (y) years.add(y);
  });
  return Array.from(years).sort().reverse();
}

export function getAnnualOrdersSummary() {
  const orders = getSavedOrders();
  const availableYears = getAvailableOrderYears();
  const summaryMap = {};

  availableYears.forEach(y => {
    summaryMap[y] = {
      year: y,
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      archivedOrders: 0,
      totalPieces: 0,
      totalNetto: 0,
      totalBrutto: 0
    };
  });

  orders.forEach(o => {
    const y = getOrderYear(o);
    if (!summaryMap[y]) {
      summaryMap[y] = {
        year: y,
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        archivedOrders: 0,
        totalPieces: 0,
        totalNetto: 0,
        totalBrutto: 0
      };
    }
    const stat = summaryMap[y];
    stat.totalOrders++;
    if (o.productionStatus === 'ARCHIVED') stat.archivedOrders++;
    else if (o.productionStatus === 'PRODUCED') stat.completedOrders++;
    else stat.activeOrders++;

    if (Array.isArray(o.items)) {
      o.items.forEach(it => {
        const q = parseFloat(it.shippedQty || it.orderedQty || 0);
        const p = parseFloat(it.unitPrice || 0);
        stat.totalPieces += q;
        stat.totalNetto += q * p;
      });
    }
    stat.totalBrutto = stat.totalNetto * 1.23;
  });

  return summaryMap;
}


