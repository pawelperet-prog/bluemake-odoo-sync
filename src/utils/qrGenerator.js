/**
 * 100% Reliable QRCode generator using QRCode.js
 */

export function loadQrLib() {
  if (window.QRCode) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

/**
 * Render QR codes into all [data-qr] containers in the provided root element
 */
export async function renderQrInDom(container) {
  if (!window.QRCode) {
    await loadQrLib();
  }
  const root = container || document;
  const elements = root.querySelectorAll('[data-qr]');
  elements.forEach((el) => {
    if (el.dataset.qrDone === '1') return;
    el.dataset.qrDone = '1';
    const text = el.getAttribute('data-qr');
    if (!text) return;

    el.innerHTML = '';
    const size = Math.max(120, el.offsetWidth || el.offsetHeight || 180);
    try {
      new window.QRCode(el, {
        text: text,
        width: size,
        height: size,
        correctLevel: window.QRCode.CorrectLevel.M
      });
      const img = el.querySelector('img');
      const canvas = el.querySelector('canvas');
      if (img) {
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.imageRendering = 'pixelated';
      }
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.imageRendering = 'pixelated';
      }
    } catch (err) {
      console.warn('QRCode render error for', text, err);
    }
  });
}
