import { sendZplViaMqtt, getMqttConfig } from '../services/mqttService.js';

const ZEBRA_STORAGE_KEY = 'zebra_printer_ip';

export function getZebraIp() {
  return localStorage.getItem(ZEBRA_STORAGE_KEY) || '';
}

export function saveZebraIp(ip) {
  localStorage.setItem(ZEBRA_STORAGE_KEY, ip.trim());
}

/**
 * Generate ZPL for a single 50x30mm label with QR code
 * Label dimensions: 500 dots wide x 300 dots high (at 203dpi: ~63x38mm)
 * We target 50x30mm at 203dpi = ~400 x 240 dots
 */
export function generateZplLabel(product) {
  const sku = (product.sku || 'SKU').substring(0, 30);
  const name = (product.name || 'Produkt').substring(0, 40);
  const qty = Number(product.quantity || 0).toFixed(1);
  const uom = product.uom || 'm';

  // 50x30mm at 203dpi = 400x240 dots
  // QR code left column: ~220x220 dots (X=5, Y=10)
  // Text right column: X=235, various Y positions

  // Truncate name to fit (2 lines max ~18 chars each at font size)
  const nameLine1 = name.substring(0, 20);
  const nameLine2 = name.length > 20 ? name.substring(20, 38) : '';

  return [
    '^XA',                                          // Start label
    '^PW400',                                       // Print width: 400 dots (50mm @203dpi)
    '^LL240',                                       // Label length: 240 dots (30mm @203dpi)
    '^LH0,0',                                       // Label home position
    '^CI28',                                        // Encoding UTF-8
    // QR Code - left column, takes ~220x220 dots
    `^FO5,10`,                                      // Field origin X=5, Y=10
    `^BQN,2,5`,                                     // QR code, model 2, magnification 5 (gives ~220px)
    `^FDMM,A${sku}^FS`,                             // QR data = SKU
    // SKU badge - right column
    `^FO232,10`,
    `^A0N,20,20`,                                   // Font 0, size 20x20 dots
    `^FD${sku}^FS`,
    // Product name line 1
    `^FO232,40`,
    `^A0N,16,16`,
    `^FD${nameLine1}^FS`,
    // Product name line 2 (if long)
    ...(nameLine2 ? [`^FO232,60`, `^A0N,16,16`, `^FD${nameLine2}^FS`] : []),
    // Footer line
    `^FO232,200`,
    `^A0N,14,14`,
    `^FDID:${product.id} Stan:${qty}${uom}^FS`,
    '^XZ'                                           // End label
  ].join('\n');
}

/**
 * Generate ZPL for multiple labels (concatenated)
 */
export function generateZplBatch(products) {
  return products.map(p => generateZplLabel(p)).join('\n');
}

/**
 * Send ZPL string to Zebra printer via fetch (requires CORS proxy or local server)
 * Falls back to download if direct send fails
 */
export async function sendZplToPrinter(zpl, printerIp) {
  if (!printerIp) {
    throw new Error('Brak adresu IP drukarki Zebra. Ustaw go w Ustawienia → Drukarka.');
  }

  // Try direct fetch to printer port 9100 - works if browser and printer on same LAN
  // Note: browsers block raw TCP, so we use a small HTTP trick via fetch to Zebra's built-in HTTP
  // Zebra printers have HTTP interface on port 80 with /zpl endpoint
  const url = `http://${printerIp}/zpl`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `zpl=${encodeURIComponent(zpl)}`,
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) return { success: true };
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // If direct HTTP fails, offer download
    throw new Error(`Nie udało się połączyć z drukarką (${printerIp}): ${err.message}`);
  }
}

/**
 * Download ZPL as .zpl file (can be drag-dropped to Zebra printer share)
 */
export function downloadZpl(zpl, filename = 'etykiety_zebra.zpl') {
  const blob = new Blob([zpl], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 500);
}

/**
 * Open Zebra print configuration modal
 */
export function openZebraPrintModal(products, onClose) {
  const existing = document.getElementById('zebra-modal-backdrop');
  if (existing) existing.remove();

  const savedIp = getZebraIp();
  const activeProducts = (products || []).filter(p => p.sku && p.sku.trim());
  const mqttCfg = getMqttConfig();

  const html = `
    <div id="zebra-modal-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-3">
      <div class="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl flex flex-col gap-4">
        
        <div class="flex justify-between items-center border-b border-gray-200 pb-3">
          <div class="flex items-center gap-2">
            <span style="font-size:28px;">🦓</span>
            <div>
              <h2 class="font-bold text-gray-900 text-lg">Drukarka Zebra — Druk ZPL</h2>
              <p class="text-xs text-gray-500">${activeProducts.length} etykiet • 50×30mm</p>
            </div>
          </div>
          <button id="zebra-close" class="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <!-- Status -->
        <div id="zebra-status" class="hidden bg-green-50 border border-green-200 rounded-lg p-3 text-sm font-bold text-green-800"></div>
        <div id="zebra-error" class="hidden bg-red-50 border border-red-200 rounded-lg p-3 text-sm font-bold text-red-700"></div>

        <!-- Action buttons -->
        <div class="flex flex-col gap-2.5">
          <!-- 1. Primary Cloud Print via MQTT / WebLink Bridge -->
          <button id="zebra-cloud-send" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm uppercase shadow-lg active:scale-95 transition-all">
            <span class="material-symbols-outlined text-xl">cloud_sync</span>
            🖨️ DRUKUJ PRZEZ CHMURĘ (mqtt.pestkalink.pl)
          </button>
          <div class="text-[11px] text-center text-gray-500">
            Serwer mostka: <b class="font-mono text-indigo-700">${mqttCfg.host || 'mqtt.pestkalink.pl'}</b>
          </div>

          <div class="border-t border-gray-100 my-1"></div>

          <!-- Secondary options -->
          <button id="zebra-download" class="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase active:scale-95 transition-transform">
            📥 POBIERZ PLIK .ZPL (Do wgrania na drukarkę)
          </button>
        </div>

        <!-- Direct LAN Section (Accordion) -->
        <details class="border border-gray-200 rounded-lg">
          <summary class="px-3 py-2 text-xs font-bold text-gray-600 cursor-pointer select-none">⚙️ Zaawansowane: Druk bezpośredni po lokalnym IP (LAN)</summary>
          <div class="p-3 bg-gray-50 rounded-b-lg space-y-2">
            <div class="flex gap-2">
              <input id="zebra-ip" type="text" placeholder="np. 192.168.1.51" value="${savedIp}"
                class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:border-orange-500 focus:outline-none" />
              <button id="zebra-save-ip" class="bg-white hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-gray-300">
                Zapisz IP
              </button>
            </div>
            <div class="flex gap-2">
              <button id="zebra-send" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-lg text-xs uppercase">
                Drukuj po LAN (${activeProducts.length} szt.)
              </button>
              <button id="zebra-single" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg text-xs uppercase">
                Tylko 1 szt. (LAN)
              </button>
            </div>
          </div>
        </details>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const backdrop = document.getElementById('zebra-modal-backdrop');
  const closeBtn = document.getElementById('zebra-close');
  const ipInput = document.getElementById('zebra-ip');
  const saveIpBtn = document.getElementById('zebra-save-ip');
  const cloudSendBtn = document.getElementById('zebra-cloud-send');
  const sendBtn = document.getElementById('zebra-send');
  const downloadBtn = document.getElementById('zebra-download');
  const singleBtn = document.getElementById('zebra-single');
  const statusEl = document.getElementById('zebra-status');
  const errorEl = document.getElementById('zebra-error');

  const close = () => { backdrop.remove(); if (onClose) onClose(); };
  closeBtn.addEventListener('click', close);

  const showStatus = (msg) => {
    statusEl.textContent = msg;
    statusEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
  };
  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
    statusEl.classList.add('hidden');
  };

  // 1. Cloud Send (Default & Reliable)
  cloudSendBtn.addEventListener('click', async () => {
    cloudSendBtn.disabled = true;
    cloudSendBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">sync</span> WYSYŁANIE DO CHMURY...';
    try {
      const zpl = generateZplBatch(activeProducts);
      await sendZplViaMqtt(zpl);
      showStatus(`✅ Wysłano ${activeProducts.length} etykiet przez chmurę (${mqttCfg.host || 'mqtt.pestkalink.pl'}) do drukarki Zebra!`);
      cloudSendBtn.innerHTML = '✅ WYDRUK WYSŁANY!';
      setTimeout(close, 1800);
    } catch (e) {
      showError(`Błąd druku przez chmurę: ${e.message}`);
      cloudSendBtn.disabled = false;
      cloudSendBtn.innerHTML = '🖨️ DRUKUJ PRZEZ CHMURĘ (mqtt.pestkalink.pl)';
    }
  });

  saveIpBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (ip) { saveZebraIp(ip); showStatus(`✅ Zapisano adres IP: ${ip}`); }
  });

  downloadBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (ip) saveZebraIp(ip);
    const zpl = generateZplBatch(activeProducts);
    downloadZpl(zpl, `Bluemake_Zebra_${activeProducts.length}etykiet.zpl`);
    showStatus('📥 Plik ZPL pobrany. Prześlij go do drukarki przez sieć lub USB.');
  });

  if (singleBtn) {
    singleBtn.addEventListener('click', async () => {
      const ip = ipInput.value.trim();
      if (!ip) { showError('Wpisz adres IP drukarki.'); return; }
      saveZebraIp(ip);
      const zpl = generateZplLabel(activeProducts[0]);
      singleBtn.disabled = true;
      try {
        await sendZplToPrinter(zpl, ip);
        showStatus('✅ Wysłano! Sprawdź drukarkę.');
      } catch (e) {
        showError(`${e.message}\n\nUżyj przycisku "DRUKUJ PRZEZ CHMURĘ" lub pobierz plik.`);
      } finally { singleBtn.disabled = false; }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const ip = ipInput.value.trim();
      if (!ip) { showError('Wpisz adres IP drukarki.'); return; }
      saveZebraIp(ip);
      const zpl = generateZplBatch(activeProducts);
      sendBtn.disabled = true;
      sendBtn.textContent = '⏳ Wysyłanie...';
      try {
        await sendZplToPrinter(zpl, ip);
        showStatus(`✅ Wysłano ${activeProducts.length} etykiet do drukarki ${ip}!`);
      } catch (e) {
        showError(`${e.message}\n\nUżyj przycisku "DRUKUJ PRZEZ CHMURĘ" lub pobierz plik.`);
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = `Drukuj po LAN (${activeProducts.length} szt.)`;
      }
    });
  }
}
