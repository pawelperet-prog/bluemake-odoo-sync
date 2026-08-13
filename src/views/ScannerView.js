import { Html5Qrcode } from 'html5-qrcode';
import { getProducts } from '../services/odooApi.js';

export function renderScannerView(container, navigateTo) {
  container.innerHTML = `
    <!-- TopAppBar -->
    <header class="flex justify-between items-center px-margin-mobile h-touch-target-min w-full bg-surface z-50 sticky top-0 border-b border-outline-variant/30">
      <div id="nav-back" class="flex items-center gap-stack-sm text-on-surface-variant active:scale-95 transition-transform duration-100 hover:bg-surface-container-high rounded p-1 cursor-pointer">
        <span class="material-symbols-outlined">arrow_back</span>
      </div>
      <div class="font-headline-md text-headline-md font-bold text-primary truncate px-2">
        Bluemake
      </div>
      <div id="hdr-history" class="flex items-center gap-stack-sm text-on-surface-variant active:scale-95 transition-transform duration-100 hover:bg-surface-container-high rounded p-1 cursor-pointer">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">cloud_done</span>
      </div>
    </header>

    <!-- Main Scanner Canvas -->
    <main class="flex-1 relative bg-tertiary overflow-hidden flex flex-col">
      <!-- Camera Container -->
      <div id="qr-reader" class="absolute inset-0 w-full h-full object-cover"></div>

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
          <div class="mt-stack-lg px-margin-mobile text-center">
            <p class="font-headline-md text-headline-md text-surface-container-lowest bg-tertiary/50 px-4 py-2 rounded-lg inline-block shadow-lg border border-surface-container-lowest/10">
              Zeskanuj kod QR z pręta
            </p>
          </div>

          <!-- Manual Code Input Fallback -->
          <div class="mt-4 w-full max-w-xs px-4 pointer-events-auto flex gap-2">
            <input id="manual-sku-input" type="text" placeholder="Wpisz SKU ręcznie (np. S355-FI20)" class="w-full bg-surface-container-lowest/90 text-on-surface px-3 py-2 rounded text-body-md font-mono focus:ring-2 focus:ring-secondary uppercase"/>
            <button id="manual-sku-btn" class="bg-secondary text-on-secondary px-4 py-2 rounded font-bold hover:bg-secondary-container">OK</button>
          </div>
        </div>
      </div>

      <!-- Flashlight / Actions -->
      <div class="absolute top-stack-md right-margin-mobile flex flex-col gap-stack-md z-20">
        <button id="toggle-torch" class="w-touch-target-min h-touch-target-min rounded-full bg-surface-container-lowest/10 backdrop-blur-md border border-surface-container-lowest/30 flex items-center justify-center text-surface-container-lowest hover:bg-surface-container-lowest/20 active:scale-95 transition-all">
          <span class="material-symbols-outlined">flashlight_on</span>
        </button>
      </div>

      <!-- Scan Success Indicator -->
      <div class="absolute inset-0 bg-surface-container-lowest/90 z-30 flex flex-col items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300" id="scan-success">
        <div class="w-16 h-16 rounded-full bg-[#4CAF50] flex items-center justify-center mb-stack-md">
          <span class="material-symbols-outlined text-surface-container-lowest !text-4xl fill">check</span>
        </div>
        <p class="font-headline-md text-headline-md text-primary">Kod odczytany!</p>
        <p id="success-sku-label" class="font-body-md text-body-md text-on-surface-variant mt-stack-sm">Ładowanie karty produktu...</p>
      </div>
    </main>

    <!-- BottomNavBar -->
    <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface px-margin-mobile pb-2 md:hidden" style="box-shadow: 0 -1px 10px rgba(0,0,0,0.05);">
      <button id="nav-dashboard" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded-xl active:scale-90 transition-all duration-150 h-full w-full max-w-[80px]">
        <span class="material-symbols-outlined mb-1">dashboard</span>
        <span class="font-label-caps text-label-caps truncate">Dashboard</span>
      </button>
      <button class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 active:scale-90 transition-all duration-150 h-full w-full max-w-[80px]">
        <span class="material-symbols-outlined mb-1 fill">barcode_scanner</span>
        <span class="font-label-caps text-label-caps truncate">Scanner</span>
      </button>
      <button id="nav-history" class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-highest rounded-xl active:scale-90 transition-all duration-150 h-full w-full max-w-[80px]">
        <span class="material-symbols-outlined mb-1">history</span>
        <span class="font-label-caps text-label-caps truncate">History</span>
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

    const products = await getProducts();
    const matched = products ? products.find(p => 
      (p.sku && p.sku.toUpperCase() === codeClean) || 
      (p.barcode && p.barcode.toUpperCase() === codeClean) || 
      (p.default_code && String(p.default_code).toUpperCase() === codeClean) || 
      p.id.toString() === codeClean
    ) : null;
    
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
    
    const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
      const minDim = Math.min(viewfinderWidth, viewfinderHeight);
      const boxSize = Math.floor(minDim * 0.75);
      return { width: Math.max(220, boxSize), height: Math.max(220, boxSize) };
    };

    html5QrcodeScanner.start(
      {
        facingMode: "environment",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 }
      },
      {
        fps: 15,
        qrbox: qrboxFunction,
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      },
      (decodedText) => handleScannedCode(decodedText),
      () => {}
    ).catch(err => {
      console.warn('HD camera stream fallback to default environment camera:', err);
      html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScannedCode(decodedText),
        () => {}
      ).catch(e => console.warn('Camera failed:', e));
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

  container.querySelector('#nav-back').addEventListener('click', () => {
    if (html5QrcodeScanner) html5QrcodeScanner.stop().catch(() => {});
    navigateTo('dashboard');
  });
  container.querySelector('#nav-dashboard').addEventListener('click', () => {
    if (html5QrcodeScanner) html5QrcodeScanner.stop().catch(() => {});
    navigateTo('dashboard');
  });
  container.querySelector('#nav-history').addEventListener('click', () => {
    if (html5QrcodeScanner) html5QrcodeScanner.stop().catch(() => {});
    navigateTo('history');
  });
}
