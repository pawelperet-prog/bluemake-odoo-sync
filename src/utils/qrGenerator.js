/**
 * ISO/IEC 18004 Standard Compliant QR Code Generator with Reed-Solomon Error Correction
 * Produces crisp, high-contrast, standard vector SVG elements scan-ready by any phone camera / QR reader.
 */

export function generateQrSvg(text, options = {}) {
  const size = options.size || 200;
  const padding = options.padding !== undefined ? options.padding : 2;
  const color = options.color || '#000000';
  const bgColor = options.bgColor || '#ffffff';

  const matrix = createStandardQrMatrix(text || 'SKU');
  const count = matrix.length;
  const tileSize = (size - padding * 2) / count;

  let rects = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (padding + c * tileSize).toFixed(2);
        const y = (padding + r * tileSize).toFixed(2);
        const w = (tileSize + 0.05).toFixed(2);
        rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${color}" />`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}" />
    ${rects.join('')}
  </svg>`;
}

export function generateQrDataUrl(text, options = {}) {
  const svg = generateQrSvg(text, options);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Full Standard QR Code Generator (Version 2/3/4 with Reed-Solomon ECC Level M)
function createStandardQrMatrix(textStr) {
  const text = String(textStr || '');
  const len = text.length;

  // Auto select Version (V1: <= 14 chars, V2: <= 26 chars, V3: <= 42 chars, V4: <= 62 chars)
  let version = 1;
  if (len > 14) version = 2;
  if (len > 26) version = 3;
  if (len > 42) version = 4;

  const N = version * 4 + 17; // Matrix dimensions (V1=21, V2=25, V3=29, V4=33)

  // Setup Matrix grids
  const matrix = Array.from({ length: N }, () => Array(N).fill(false));
  const isReserved = Array.from({ length: N }, () => Array(N).fill(false));

  function setModule(row, col, val) {
    if (row >= 0 && row < N && col >= 0 && col < N) {
      matrix[row][col] = val;
      isReserved[row][col] = true;
    }
  }

  // 1. Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  function drawFinder(r0, c0) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = r0 + r, nc = c0 + c;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setModule(nr, nc, isBorder || isCenter);
        } else {
          setModule(nr, nc, false);
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  // 2. Timing Patterns
  for (let i = 8; i < N - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 3. Alignment Patterns (for Version >= 2)
  if (version >= 2) {
    const alignPos = version === 2 ? [18] : version === 3 ? [22] : [26];
    alignPos.forEach(ar => {
      alignPos.forEach(ac => {
        if (isReserved[ar][ac]) return;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isCenter = r === 0 && c === 0;
            setModule(ar + r, ac + c, isBorder || isCenter);
          }
        }
      });
    });
  }

  // 4. Reserve Format Info Area
  for (let i = 0; i < 9; i++) {
    setModule(8, i, false);
    setModule(i, 8, false);
    setModule(8, N - 1 - i, false);
    setModule(N - 1 - i, 8, false);
  }
  setModule(N - 8, 8, true);

  // 5. Build Standard Data Bits (Byte Mode + Length + Payload + Padding + RS ECC)
  const dataBits = [];

  // Mode: Byte Mode (0100)
  pushBits(dataBits, 0b0100, 4);

  // Count Indicator (8 bits for Version 1-9 in Byte Mode)
  pushBits(dataBits, len, 8);

  // Payload bytes
  for (let i = 0; i < len; i++) {
    pushBits(dataBits, text.charCodeAt(i) & 0xFF, 8);
  }

  // Capacity in Data Codewords for ECC Level M
  // V1-M: 16 data, 10 ecc | V2-M: 28 data, 16 ecc | V3-M: 44 data, 26 ecc | V4-M: 64 data, 36 ecc
  const capacityMap = { 1: 16, 2: 28, 3: 44, 4: 64 };
  const totalDataBytes = capacityMap[version] || 28;
  const eccCountMap = { 1: 10, 2: 16, 3: 26, 4: 36 };
  const totalEccBytes = eccCountMap[version] || 16;

  // Terminator (up to 4 zeroes)
  const remainingBitSpace = totalDataBytes * 8 - dataBits.length;
  const termBits = Math.min(4, Math.max(0, remainingBitSpace));
  pushBits(dataBits, 0, termBits);

  // Align to byte boundary
  while (dataBits.length % 8 !== 0) {
    dataBits.push(0);
  }

  // Convert to Data Codewords array
  const dataCodewords = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      b = (b << 1) | (dataBits[i + bit] || 0);
    }
    dataCodewords.push(b);
  }

  // Pad Codewords (0xEC, 0x11)
  let padToggle = false;
  while (dataCodewords.length < totalDataBytes) {
    dataCodewords.push(padToggle ? 0x11 : 0xEC);
    padToggle = !padToggle;
  }

  // Generate Reed-Solomon Error Correction Codewords
  const eccCodewords = generateReedSolomonEcc(dataCodewords, totalEccBytes);

  // Combine Data + ECC
  const finalBits = [];
  dataCodewords.concat(eccCodewords).forEach(byteVal => {
    pushBits(finalBits, byteVal, 8);
  });

  // 6. Populate Data Bits into Matrix Layout
  let bitIndex = 0;
  let direction = -1;
  let r = N - 1;

  for (let c = N - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing pattern column

    while (r >= 0 && r < N) {
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (!isReserved[r][col]) {
          const bitVal = bitIndex < finalBits.length ? finalBits[bitIndex++] === 1 : false;
          // Apply Standard Mask Pattern 0: (row + col) % 2 === 0
          const mask = (r + col) % 2 === 0;
          matrix[r][col] = bitVal ^ mask;
        }
      }
      r += direction;
    }
    direction = -direction;
    r += direction;
  }

  // 7. Write Format Information (Level M, Mask 0 -> 101010000010010 XOR 101010000010010 = 0x5412)
  // Standard format string for Level M, Mask Pattern 0: 0x5412
  const formatBits = 0x5412;
  for (let i = 0; i < 15; i++) {
    const val = ((formatBits >> (14 - i)) & 1) === 1;

    // Top-Left Format Area
    if (i < 6) matrix[8][i] = val;
    else if (i < 8) matrix[8][i + 1] = val;
    else if (i === 8) matrix[7][8] = val;
    else matrix[14 - i][8] = val;

    // Split Format Area (Top-Right / Bottom-Left)
    if (i < 7) matrix[N - 1 - i][8] = val;
    else matrix[8][N - 15 + i] = val;
  }

  return matrix;
}

function pushBits(arr, val, count) {
  for (let i = count - 1; i >= 0; i--) {
    arr.push((val >> i) & 1);
  }
}

// Galois Field GF(2^8) Reed-Solomon ECC Generator
function generateReedSolomonEcc(dataBytes, numEccBytes) {
  const gfExp = new Array(512);
  const gfLog = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    gfExp[i] = x;
    gfExp[i + 255] = x;
    gfLog[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11D : 0); // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
  }

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return gfExp[gfLog[a] + gfLog[b]];
  }

  // Generate Generator Polynomial for numEccBytes
  let genPoly = [1];
  for (let i = 0; i < numEccBytes; i++) {
    const nextPoly = new Array(genPoly.length + 1).fill(0);
    const root = gfExp[i];
    for (let j = 0; j < genPoly.length; j++) {
      nextPoly[j] ^= gfMul(genPoly[j], root);
      nextPoly[j + 1] ^= genPoly[j];
    }
    genPoly = nextPoly;
  }

  // Perform Polynomial Division
  const msgPoly = new Array(dataBytes.length + numEccBytes).fill(0);
  for (let i = 0; i < dataBytes.length; i++) {
    msgPoly[i] = dataBytes[i];
  }

  for (let i = 0; i < dataBytes.length; i++) {
    const coef = msgPoly[i];
    if (coef !== 0) {
      for (let j = 0; j < genPoly.length; j++) {
        msgPoly[i + j] ^= gfMul(genPoly[j], coef);
      }
    }
  }

  return msgPoly.slice(dataBytes.length);
}
