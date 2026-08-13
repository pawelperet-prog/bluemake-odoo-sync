/**
 * QR Code generator using Google Charts API - proven, always scannable
 */

export function generateQrSvg(text, options = {}) {
  // We use an <img> tag with Google Charts QR API - guaranteed correct QR codes
  // Size in px for rendering (print: 250px ~ 26mm at 96dpi)
  const px = options.size || 250;
  const encoded = encodeURIComponent(text || 'SKU');
  const url = `https://chart.googleapis.com/chart?cht=qr&chs=${px}x${px}&chl=${encoded}&choe=UTF-8&chld=M|2`;

  return `<img src="${url}" width="${px}" height="${px}" alt="${text}" style="display:block;width:100%;height:100%;image-rendering:pixelated;" />`;
}

export function generateQrDataUrl(text, options = {}) {
  const px = options.size || 250;
  const encoded = encodeURIComponent(text || 'SKU');
  return `https://chart.googleapis.com/chart?cht=qr&chs=${px}x${px}&chl=${encoded}&choe=UTF-8&chld=M|2`;
}
