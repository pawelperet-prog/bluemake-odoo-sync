# Specyfikacja Integracji Odoo 19 - Magazyn Prętów

## Konfiguracja API
- **URL:** https://odo.domowyasystent.online/jsonrpc
- **Baza:** odoo
- **UID:** 9
- **Klucz API:** de5aa75b2e7d300edb383050742f785707bcea63

## Logika Aplikacji
1. **Pobieranie:**
   - Produkty: `product.product`, `categ_id = 4`, `active = true`.
   - Stany: `stock.quant`, `location_id = 5`.
2. **Aktualizacja (Inventory Adjustment):**
   - `stock.quant` -> `create` (inventory_quantity).
   - `stock.quant` -> `action_apply_inventory` (ID z kroku create).
3. **QR Code:** Mapowanie `default_code` na produkt.

## Ekrany do zaprojektowania:
1. **Dashboard/Lista:** Przegląd stanów magazynowych.
2. **Skaner QR:** Interfejs kamery do identyfikacji prętów.
3. **Karta Produktu:** Szczegóły i formularz "Ucięcia" (zmiany ilości).
4. **Historia/Status:** Potwierdzenie wysłania danych do Odoo.