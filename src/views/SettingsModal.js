import { getOdooConfig, saveOdooConfig, checkApiStatus } from '../services/odooApi.js';

export function openSettingsModal(onSavedCallback) {
  const existing = document.getElementById('settings-modal-backdrop');
  if (existing) existing.remove();

  const config = getOdooConfig();

  const modalHtml = `
    <div id="settings-modal-backdrop" class="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">settings_remote</span>
            <h2 class="font-headline-md font-bold text-primary">Konfiguracja Odoo 19 API</h2>
          </div>
          <button id="close-modal-btn" class="text-on-surface-variant hover:text-primary p-1">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex flex-col gap-3 font-body-md">
          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1">Adres URL API (JSON-RPC)</label>
            <input id="cfg-url" type="text" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.url}" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1">Nazwa Bazy Data</label>
              <input id="cfg-db" type="text" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.db}" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1">UID Użytkownika</label>
              <input id="cfg-uid" type="number" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.uid}" />
            </div>
          </div>

          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1">Klucz API / Hasło (API Key)</label>
            <input id="cfg-key" type="password" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.apiKey}" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1">ID Lokalizacji (Magazyn)</label>
              <input id="cfg-loc" type="number" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.locationId}" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1">ID Kategorii Prętów</label>
              <input id="cfg-cat" type="number" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.categoryId}" />
            </div>
          </div>
        </div>

        <div id="test-status-banner" class="hidden p-3 rounded text-sm font-bold flex items-center gap-2"></div>

        <div class="flex gap-2 pt-2 border-t border-outline-variant">
          <button id="test-conn-btn" class="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-caps py-3 rounded font-bold border border-outline-variant flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[18px]">wifi_find</span>
            TESTUJ POŁĄCZENIE
          </button>
          <button id="save-cfg-btn" class="flex-1 bg-primary hover:bg-tertiary text-on-primary font-label-caps py-3 rounded font-bold flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[18px]">save</span>
            ZAPISZ I UROCHOM
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('settings-modal-backdrop');
  const closeBtn = document.getElementById('close-modal-btn');
  const testBtn = document.getElementById('test-conn-btn');
  const saveBtn = document.getElementById('save-cfg-btn');
  const banner = document.getElementById('test-status-banner');

  closeBtn.addEventListener('click', () => backdrop.remove());

  const getFormValues = () => ({
    url: document.getElementById('cfg-url').value.trim(),
    db: document.getElementById('cfg-db').value.trim(),
    uid: parseInt(document.getElementById('cfg-uid').value) || 9,
    apiKey: document.getElementById('cfg-key').value.trim(),
    locationId: parseInt(document.getElementById('cfg-loc').value) || 5,
    categoryId: parseInt(document.getElementById('cfg-cat').value) || 4
  });

  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> SPRAWDZANIE...';
    
    // Temporarily save form values to test
    saveOdooConfig(getFormValues());

    const status = await checkApiStatus();
    banner.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');

    if (status.connected) {
      banner.classList.add('bg-green-100', 'text-green-800');
      banner.innerHTML = `<span class="material-symbols-outlined text-green-600">check_circle</span> Połączono pomyślnie z Odoo ${status.serverVersion}!`;
    } else {
      banner.classList.add('bg-red-100', 'text-red-800');
      banner.innerHTML = `<span class="material-symbols-outlined text-red-600">error</span> Błąd połączenia: ${status.error || 'Brak odpowiedzi'}`;
    }

    testBtn.disabled = false;
    testBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">wifi_find</span> TESTUJ POŁĄCZENIE';
  });

  saveBtn.addEventListener('click', () => {
    saveOdooConfig(getFormValues());
    backdrop.remove();
    if (onSavedCallback) onSavedCallback();
  });
}
