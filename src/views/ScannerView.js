import { Html5Qrcode } from 'html5-qrcode';
import { getProducts } from '../services/odooApi.js';

export function renderScannerView(container, navigateTo) {
  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="flex justify-between items-center px-4 h-14 w-full bg-surface z-50 sticky top-0 border-b border-outline-variant/30 shadow-sm">
      <button id="nav-back" class="flex items-center gap-1.5 text-primary font-bold text-sm bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all rounded-lg px-3 py-1.5 cursor-pointer">
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        <span>WRÓĆ</span>
      </button>
      <div class="font-headline-md text-headline-md font-bold text-primary truncate px-2">
        Skaner Kodów QR
      </div>
      <button id="btn-close-scanner-top" class="flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all rounded-lg px-2.5 py-1.5 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">close</span>
        <span>ZAMKNIJ</span>
      </button>
    </header>

    <!-- Main Scanner Canvas -->
    <main class="flex-1 relative bg-tertiary overflow-hidden flex flex-col pb-20">
      <!-- Camera Container -->
      <div id="qr-reader" class="absolute inset-0 w-full h-full object-cover"></div>

      <!-- Floating Direct Exit Button (Always visible on top of camera) -->
      <div class="absolute top-4 left-4 z-40 pointer-events-auto">
        <button id="btn-floating-exit" class="flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-full shadow-2xl active:scale-95 transition-all hover:bg-black">
          <span class="material-symbols-outlined text-rose-400 text-[18px]">close</span>
          <span>ANULUJ SKANOWANIE</span>
        </button>
      </div>

      <!-- Semi-transparent overlay to focus on the scanner frame -->
      <div class="absolute inset-0 flex flex-col pointer-events-none z-10">
        <!-- Top block -->
        <div class="flex-1 bg-tertiary/70 backdrop-blur-[2px]"></div>
        <!-- Middle row with cutout -->
        <div class="flex h-64 md:h-80 w-full">
          <!-- Left block -->
          <div class="flex-1 bg-tertiary/70 backdrop-blur-[2px]"></div>
          <!-- The Scanner Frame Cutout -->
          <div id="scanner-cutout" class="w-64 md:w-80 h-full relative cursor-pointer pointer-events-auto">
            <!-- Frame Borders (Industrial corners) -->
            <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-surface-container-lowest"></div>
            <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-surface-container-lowest"></div>
            <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-surface-container-lowest"></div>
            <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-surface-container-lowest"></div>
            <!-- Inner border -->
            <div class="absolute inset-0 border border-surface-container-lowest/30"></div>
            <!-- Animated Scan Line -->
            <div class="absolute left-0 right-0 h-[2px] bg-secondary shadow-[0_0_8px_rgba(168,54,57,0.8)] animate-scanline z-20"></div>
          </div>
          <!-- Right block -->
          <div class="flex-1 bg-tertiary/70 backdrop-blur-[2px]"></div>
        </div>
        <!-- Bottom block -->
        <div class="flex-1 bg-tertiary/70 backdrop-blur-[2px] relative flex flex-col items-center">
          <div class="mt-4 px-margin-mobile text-center">
            <p class="font-headline-md text-headline-md text-surface-container-lowest bg-tertiary/60 px-4 py-1.5 rounded-lg inline-block shadow-lg border border-surface-container-lowest/10 text-sm">
              Zeskanuj kod QR z detalu / pręta
            </p>
          </div>

          <!-- Manual Code Input Fallback -->
          <div class="mt-3 w-full max-w-xs px-4 pointer-events-auto flex gap-2">
            <input id="manual-sku-input" type="text" placeholder="Wpisz SKU lub ID ręcznie..." class="w-full bg-surface-container-lowest/90 text-on-surface px-3 py-2 rounded text-body-md font-mono focus:ring-2 focus:ring-secondary uppercase shadow"/>
            <button id="manual-sku-btn" class="bg-secondary text-on-secondary px-4 py-2 rounded font-bold hover:bg-secondary-container shadow">OK</button>
          </div>

          <!-- Extra Big Back Button at Bottom of Overlay -->
          <div class="mt-3 pointer-events-auto pb-4">
            <button id="btn-bottom-exit" class="text-xs text-white/80 hover:text-white underline flex items-center gap-1 font-bold py-1 px-3">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Wróć do listy materiałów</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Flashlight / Actions -->
      <div class="absolute top-4 right-4 flex flex-col gap-stack-md z-40">
        <button id="toggle-torch" class="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-black/80 active:scale-95 transition-all shadow-lg">
          <span class="material-symbols-outlined text-[20px]">flashlight_on</span>
        </button>
      </div>

      <!-- Scan Success Indicator -->
      <div class="absolute inset-0 bg-surface-container-lowest/90 z-50 flex flex-col items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300" id="scan-success">
        <div class="w-16 h-16 rounded-full bg-[#4CAF50] flex items-center justify-center mb-stack-md">
          <span class="material-symbols-outlined text-surface-container-lowest !text-4xl fill">check</span>
        </div>
        <p class="font-headline-md text-headline-md text-primary">Kod odczytany!</p>
        <p id="success-sku-label" class="font-body-md text-body-md text-on-surface-variant mt-stack-sm">Ładowanie karty produktu...</p>
      </div>
    </main>

    <!-- BottomNavBar -->
    <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface px-margin-mobile border-t border-outline-variant/30 md:hidden pointer-events-auto shadow-lg">
      <button id="nav-dashboard" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded-xl active:scale-90 transition-all duration-150 h-full w-full max-w-[80px]">
        <span class="material-symbols-outlined mb-0.5 text-[22px]">dashboard</span>
        <span class="font-label-caps text-[10px] truncate font-bold">Pulpit</span>
      </button>
      <button class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 active:scale-90 transition-all duration-150 h-full w-full max-w-[80px]">
        <span class="material-symbols-outlined mb-0.5 text-[22px] fill">barcode_scanner</span>
        <span class="font-label-caps text-[10px] truncate font-bold">Skaner</span>
      </button>
      <button id="nav-history" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded-xl active:scale-90 transition-all duration-150 h-full w-full max-w-[80px]">
        <span class="material-symbols-outlined mb-0.5 text-[22px]">history</span>
        <span class="font-label-caps text-[10px] truncate font-bold">Historia</span>
      </button>
    </nav>
  `;

  let html5QrcodeScanner = null;

  async function handleScannedCode(code) {
    const codeClean = code.trim().toUpperCase();
    const successOverlay = container.querySelector('#scan-success');
    const skuLabel = container.querySelector('#success-sku-label');
    
    skuLabel.textContent = `SKU: ${codeClean}`;
    successOverlay.classList.remove('opacity-0', 'pointer-events-none');
    successOverlay.classList.add('opacity-100');

    if (html5QrcodeScanner) {
      try {
        await html5QrcodeScanner.stop();
      } catch (e) {
        console.log('Scanner stopped');
      }
    }

    // Check if scanned code is a Soft Jaw QR Code (SZ-[SKU], e.g. SZ-00329)
    if (codeClean.startsWith('SZ-') || codeClean.startsWith('SZ_')) {
      const jawCode = codeClean.replace('_', '-');
      setTimeout(() => {
        navigateTo('jaws', jawCode);
      }, 1000);
      return;
    }

    const products = await getProducts();

    function normalizeCode(str) {
      if (!str) return '';
      return String(str)
        .toUpperCase()
        .replace(/[Ø⌀]/g, 'FI')
        .replace(/[\s\-_]/g, '');
    }

    const normScanned = normalizeCode(codeClean);

    const matched = products ? products.find(p => {
      if (p.sku && p.sku.toUpperCase() === codeClean) return true;
      if (p.barcode && p.barcode.toUpperCase() === codeClean) return true;
      if (p.default_code && String(p.default_code).toUpperCase() === codeClean) return true;
      if (p.id.toString() === codeClean) return true;

      // Normalized fallback (matches FI vs Ø, hyphen vs underscore)
      if (p.sku && normalizeCode(p.sku) === normScanned) return true;
      if (p.barcode && normalizeCode(p.barcode) === normScanned) return true;
      if (p.default_code && normalizeCode(p.default_code) === normScanned) return true;

      return false;
    }) : null;
    
    setTimeout(() => {
      if (matched) {
        navigateTo('product', matched);
      } else {
        navigateTo('product', {
          id: 101,
          sku: codeClean || 'S355-FI20',
          name: `Pręt ${codeClean}`,
          quantity: 15.5,
          uom: 'm',
          location: 'Strefa 5'
        });
      }
    }, 1200);
  }

  try {
    html5QrcodeScanner = new Html5Qrcode("qr-reader");

    const qrboxFn = (w, h) => {
      const s = Math.floor(Math.min(w, h) * 0.72);
      return { width: Math.max(200, s), height: Math.max(200, s) };
    };

    // Start with simple environment camera — works on ALL phones
    html5QrcodeScanner.start(
      { facingMode: "environment" },
      {
        fps: 12,
        qrbox: qrboxFn,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true }
      },
      (decodedText) => handleScannedCode(decodedText),
      () => {}
    ).catch(err => {
      console.warn('Camera start failed, trying any camera:', err);
      // Last fallback: any available camera
      html5QrcodeScanner.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => handleScannedCode(decodedText),
        () => {}
      ).catch(e => {
        console.error('All camera attempts failed:', e);
        const reader = document.getElementById('qr-reader');
        if (reader) {
          reader.innerHTML = `<div style="color:white;padding:20px;text-align:center;"><p style="font-size:18px;">⚠️ Brak dostępu do kamery</p><p style="font-size:13px;margin-top:8px;">Użyj pola tekstowego poniżej i wpisz SKU ręcznie.</p></div>`;
        }
      });
    });
  } catch (err) {
    console.warn('Html5Qrcode init error:', err);
  }


  const manualInput = container.querySelector('#manual-sku-input');
  const manualBtn = container.querySelector('#manual-sku-btn');
  const submitManual = () => {
    if (manualInput.value.trim()) {
      handleScannedCode(manualInput.value.trim());
    }
  };
  manualBtn.addEventListener('click', submitManual);
  manualInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitManual(); });

  const safeExit = (target = 'dashboard') => {
    if (html5QrcodeScanner) {
      try {
        html5QrcodeScanner.stop().catch(() => {});
      } catch (e) {}
    }
    navigateTo(target);
  };

  container.querySelector('#nav-back')?.addEventListener('click', () => safeExit('dashboard'));
  container.querySelector('#btn-close-scanner-top')?.addEventListener('click', () => safeExit('dashboard'));
  container.querySelector('#btn-floating-exit')?.addEventListener('click', () => safeExit('dashboard'));
  container.querySelector('#btn-bottom-exit')?.addEventListener('click', () => safeExit('dashboard'));
  container.querySelector('#nav-dashboard')?.addEventListener('click', () => safeExit('dashboard'));
  container.querySelector('#nav-history')?.addEventListener('click', () => safeExit('history'));
}
