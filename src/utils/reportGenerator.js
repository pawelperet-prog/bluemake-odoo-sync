/**
 * Steel Grade Color Theme Mapping
 */
const GRADE_COLORS = {
  'S355': { text: '#b45309', bg: '#fef3c7', border: '#fde68a', accent: '#d97706' },
  'S235': { text: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', accent: '#2563eb' },
  'C45': { text: '#047857', bg: '#d1fae5', border: '#a7f3d0', accent: '#059669' },
  '42CRMO4': { text: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe', accent: '#7c3aed' },
  '16MNCR5': { text: '#be185d', bg: '#fce7f3', border: '#fbcfe8', accent: '#db2777' },
  'INNE': { text: '#334155', bg: '#f1f5f9', border: '#e2e8f0', accent: '#475569' }
};

export function extractGrade(sku, name) {
  const text = ((sku || '') + ' ' + (name || '')).toUpperCase();
  const match = text.match(/(S355|S235|S275|C45|42CRMO4|16MNCR5|41CR4)/);
  return match ? match[1] : 'INNE';
}

function getGradeColor(grade) {
  return GRADE_COLORS[grade] || GRADE_COLORS['INNE'];
}

/**
 * Generate Standalone Printable HTML Report
 */
export function generateRawMaterialsHtml(products) {
  const rawMaterials = (products || []).filter(p => p.isRawMaterial || p.categoryId === 4);
  const nowStr = new Date().toLocaleString('pl-PL', { dateStyle: 'full', timeStyle: 'short' });

  // Group by Grade
  const grouped = {};
  rawMaterials.forEach(p => {
    const grade = extractGrade(p.sku, p.name);
    if (!grouped[grade]) grouped[grade] = [];
    grouped[grade].push(p);
  });

  const gradesSorted = Object.keys(grouped).sort();

  // Calculate Summary
  let totalItemsCount = rawMaterials.length;
  let totalMetersSum = rawMaterials.reduce((acc, p) => acc + (typeof p.quantity === 'number' ? p.quantity : 0), 0);

  const gradeSectionsHtml = gradesSorted.map(grade => {
    const items = grouped[grade];
    const color = getGradeColor(grade);
    const gradeMetersSum = items.reduce((acc, p) => acc + (typeof p.quantity === 'number' ? p.quantity : 0), 0);

    const rowsHtml = items.map((item, idx) => `
      <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-200 text-sm">
        <td class="py-2.5 px-3 font-mono font-bold text-slate-800">${item.sku}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-900">${item.name}</td>
        <td class="py-2.5 px-3 text-slate-600">${item.location || 'Strefa 5'}</td>
        <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-base">
          ${Number(item.quantity).toFixed(1)} <span class="text-xs text-slate-500 font-normal">${item.uom || 'm'}</span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="mb-8 break-inside-avoid">
        <!-- Grade Header Banner -->
        <div class="flex justify-between items-center px-4 py-2.5 rounded-t-lg border border-b-0" style="background-color: ${color.bg}; border-color: ${color.border};">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase shadow-sm" style="background-color: ${color.accent}; color: #ffffff;">
              GATUNEK
            </span>
            <h2 class="text-lg font-bold uppercase tracking-wide" style="color: ${color.text};">${grade}</h2>
            <span class="text-xs text-slate-500 font-medium">(${items.length} pozycji)</span>
          </div>
          <div class="text-sm font-bold font-mono" style="color: ${color.text};">
            SUMA: ${gradeMetersSum.toFixed(1)} m
          </div>
        </div>

        <!-- Items Table -->
        <div class="border border-slate-300 rounded-b-lg overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                <th class="py-2 px-3 w-1/4">Symbol / SKU</th>
                <th class="py-2 px-3 w-2/5">Nazwa Surowca</th>
                <th class="py-2 px-3">Lokacja</th>
                <th class="py-2 px-3 text-right">Stan Magazynowy</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Bluemake - Zestawienie Surowców Magazynowych</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; color: black !important; padding: 0 !important; }
      .print-shadow-none { shadow: none !important; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-900 font-sans p-6 min-h-screen">
  
  <!-- Action Bar (Hidden when printing) -->
  <div class="no-print max-w-5xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-md border border-slate-200 flex justify-between items-center">
    <div class="flex items-center gap-2">
      <span class="text-2xl">📋</span>
      <div>
        <h1 class="font-bold text-slate-800 text-lg">Raport Surowców Magazynowych</h1>
        <p class="text-xs text-slate-500">Wygenerowano: ${nowStr}</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button onclick="window.print()" class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded flex items-center gap-1.5 shadow-sm text-sm uppercase">
        🖨️ Druktuj / Zapisz PDF
      </button>
      <button onclick="downloadHtml()" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded flex items-center gap-1.5 shadow-sm text-sm uppercase">
        📥 Pobierz Plik HTML
      </button>
    </div>
  </div>

  <!-- Document Body (A4 Layout) -->
  <div class="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-slate-200">
    
    <!-- Document Header -->
    <header class="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-3xl font-black text-amber-600 tracking-tight">Bluemake</span>
          <span class="text-xs bg-slate-800 text-white px-2 py-0.5 rounded font-bold uppercase">Magazyn Surowców</span>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mt-1 uppercase">Zestawienie Surowców Stalowych według Gatunku</h1>
      </div>
      <div class="text-right">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Data raportu</p>
        <p class="text-sm font-semibold text-slate-800">${nowStr}</p>
      </div>
    </header>

    <!-- Summary Stats Pill -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
      <div>
        <span class="text-xs font-bold text-slate-500 uppercase block">Łączna liczba pozycji</span>
        <span class="text-xl font-black text-slate-900">${totalItemsCount}</span>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-500 uppercase block">Liczba gatunków stali</span>
        <span class="text-xl font-black text-amber-600">${gradesSorted.length}</span>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-500 uppercase block">Suma długości surowców</span>
        <span class="text-xl font-black text-slate-900">${totalMetersSum.toFixed(1)} m</span>
      </div>
    </div>

    <!-- Grade Sections -->
    ${gradeSectionsHtml}

    <!-- Footer -->
    <footer class="mt-12 border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-400">
      <p>Bluemake Industrial Sync • Raport Surowców Odoo 19</p>
      <p>Strona 1 z 1</p>
    </footer>

  </div>

  <script>
    function downloadHtml() {
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Zestawienie_Surowcow_Bluemake.html';
      a.click();
    }
  </script>
</body>
</html>`;
}

/**
 * Open Printable Report in New Window
 */
export function openReportWindow(products) {
  const html = generateRawMaterialsHtml(products);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    // Fallback: trigger download
    downloadReportHtml(products);
  }
}

/**
 * Download Report HTML File
 */
export function downloadReportHtml(products) {
  const html = generateRawMaterialsHtml(products);
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Zestawienie_Surowcow_Bluemake_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
}
