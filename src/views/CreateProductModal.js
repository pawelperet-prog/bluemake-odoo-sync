import { createNewProduct, getCategories } from '../services/odooApi.js';

export async function openCreateProductModal(onCreatedCallback) {
  const existing = document.getElementById('create-prod-backdrop');
  if (existing) existing.remove();

  const categories = await getCategories();

  const categoryOptions = categories.map(c => `
    <option value="${c.id}" ${c.id === 4 ? 'selected' : ''}>${c.complete_name || c.name} (ID: ${c.id})</option>
  `).join('');

  const modalHtml = `
    <div id="create-prod-backdrop" class="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#ff6b00]">add_box</span>
            <h2 class="font-headline-md font-bold text-primary">Dodaj Nowy Pręt / Materiał</h2>
          </div>
          <button id="close-create-btn" class="text-on-surface-variant hover:text-primary p-1">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="create-product-form" class="flex flex-col gap-3 font-body-md">
          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1">Nazwa Pręta / Materiału *</label>
            <input id="new-name" type="text" placeholder="np. Pręt okrągły S355 FI 60" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1">Symbol / SKU *</label>
              <input id="new-sku" type="text" placeholder="np. S355-FI60" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono uppercase" required />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1">Stan Początkowy (m / szt) *</label>
              <input id="new-qty" type="number" step="0.1" min="0" value="12.5" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono font-bold" required />
            </div>
          </div>

          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1">Kategoria w Odoo</label>
            <select id="new-cat" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-bold text-primary">
              ${categoryOptions}
            </select>
          </div>

          <div id="create-msg-banner" class="hidden p-3 rounded text-sm font-bold flex items-center gap-2 mt-2"></div>

          <div class="flex gap-2 pt-3 border-t border-outline-variant mt-2">
            <button type="button" id="cancel-create-btn" class="flex-1 bg-surface-container-high text-primary font-label-caps py-3 rounded font-bold">
              ANULUJ
            </button>
            <button type="submit" id="submit-create-btn" class="flex-1 bg-[#ff6b00] hover:bg-[#e66000] text-white font-label-caps py-3 rounded font-bold flex items-center justify-center gap-1 shadow-md uppercase">
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              UTWÓRZ W ODOO
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('create-prod-backdrop');
  const closeBtn = document.getElementById('close-create-btn');
  const cancelBtn = document.getElementById('cancel-create-btn');
  const form = document.getElementById('create-product-form');
  const submitBtn = document.getElementById('submit-create-btn');
  const banner = document.getElementById('create-msg-banner');

  const closeModal = () => backdrop.remove();
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> TWORZENIE W ODOO...';

    const name = document.getElementById('new-name').value.trim();
    const sku = document.getElementById('new-sku').value.trim().toUpperCase();
    const qty = parseFloat(document.getElementById('new-qty').value) || 0;
    const catId = parseInt(document.getElementById('new-cat').value);

    const res = await createNewProduct({ name, sku, initialQuantity: qty, categoryId: catId });
    banner.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');

    if (res.success) {
      banner.classList.add('bg-green-100', 'text-green-800');
      banner.innerHTML = `<span class="material-symbols-outlined text-green-600">check_circle</span> Utworzono pręt ${sku} z początkowym stanem ${qty}m!`;
      setTimeout(() => {
        closeModal();
        if (onCreatedCallback) onCreatedCallback();
      }, 1200);
    } else {
      banner.classList.add('bg-red-100', 'text-red-800');
      banner.innerHTML = `<span class="material-symbols-outlined text-red-600">error</span> Błąd dodawania: ${res.error}`;
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">add_circle</span> UTWÓRZ W ODOO';
    }
  });
}
