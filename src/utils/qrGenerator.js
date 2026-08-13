/**
 * QR Code helper - placeholder divs populated by qrcodejs library (CDN)
 * Same approach as etykiety_qr_50x30mm_gotowe.html - proven to work
 */

let qrLibPromise = null;

export function loadQrLib() {
  if (window.QRCode) return Promise.resolve();
  if (qrLibPromise) return qrLibPromise;
  qrLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return qrLibPromise;
}

/**
 * Returns a placeholder div with data-qr attribute.
 * Call renderQrInDom() after inserting into DOM.
 */
export function generateQrSvg(text) {
  const safe = (text || 'SKU').replace(/"/g, '&quot;');
  return `<div data-qr="${safe}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"></div>`;
}

/**
 * After injecting HTML containing [data-qr] divs into the DOM,
 * call this function to render QR codes via qrcodejs.
 */
export async function renderQrInDom(container) {
  await loadQrLib();
  const divs = (container || document).querySelectorAll('[data-qr]');
  divs.forEach(el => {
    if (el.dataset.qrDone) return;
    el.dataset.qrDone = '1';
    const code = el.getAttribute('data-qr');
    // Use actual pixel size of container, fallback to 150
    const sz = Math.max(64, el.offsetWidth || el.offsetHeight || 150);
    try {
      new window.QRCode(el, {
        text: code,
        width: sz,
        height: sz,
        correctLevel: window.QRCode.CorrectLevel.M
      });
      // Force canvas to fill parent
      const canvas = el.querySelector('canvas');
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
      const img = el.querySelector('img');
      if (img) {
        img.style.width = '100%';
        img.style.height = '100%';
      }
    } catch (e) {
      console.warn('QR render error for', code, e);
    }
  });
}

