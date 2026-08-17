import { getOdooConfig, saveOdooConfig, checkApiStatus } from '../services/odooApi.js';
import { getMqttConfig, saveMqttConfig, testMqttConnection, sendZplViaMqtt, generateProductZpl } from '../services/mqttService.js';

export function openSettingsModal(onSavedCallback) {
  const existing = document.getElementById('settings-modal-backdrop');
  if (existing) existing.remove();

  const config = getOdooConfig();
  const mqttCfg = getMqttConfig();

  const modalHtml = `
    <div id="settings-modal-backdrop" class="fixed inset-0 bg-primary/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-2xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-2xl">settings</span>
            <h2 class="font-headline-md font-bold text-primary text-lg">Ustawienia Systemu</h2>
          </div>
          <button id="close-modal-btn" class="text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Tab Selector -->
        <div class="flex bg-surface-container p-1 rounded-xl border border-outline-variant/40 gap-1">
          <button id="tab-btn-odoo" type="button" class="tab-settings-btn flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-on-primary shadow-sm">
            <span class="material-symbols-outlined text-[18px]">database</span>
            <span>1. ODOO 19 API</span>
          </button>
          <button id="tab-btn-mqtt" type="button" class="tab-settings-btn flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-on-surface-variant hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-[18px]">print</span>
            <span>2. DRUKARKA MQTT (ZEBRA)</span>
          </button>
        </div>

        <!-- TAB 1: ODOO CONFIG -->
        <div id="panel-settings-odoo" class="flex flex-col gap-3 font-body-md">
          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Adres URL API (JSON-RPC)</label>
            <input id="cfg-url" type="text" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.url}" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Nazwa Bazy Danych</label>
              <input id="cfg-db" type="text" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.db}" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">UID Użytkownika</label>
              <input id="cfg-uid" type="number" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.uid}" />
            </div>
          </div>

          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Klucz API / Hasło (API Key)</label>
            <input id="cfg-key" type="password" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.apiKey}" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">ID Lokalizacji (Magazyn)</label>
              <input id="cfg-loc" type="number" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.locationId}" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">ID Kategorii Surowców</label>
              <input id="cfg-cat" type="number" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono" value="${config.categoryId}" />
            </div>
          </div>
        </div>

        <!-- TAB 2: MQTT ZEBRA CLOUD CONFIG -->
        <div id="panel-settings-mqtt" class="hidden flex flex-col gap-3 font-body-md">
          <div class="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
            <span class="material-symbols-outlined text-indigo-600 text-lg flex-shrink-0">cloud</span>
            <div>
              <b>Druk z dowolnego miejsca na świecie (Zebra MQTT / HiveMQ):</b><br/>
              Wpisz dane brokera MQTT. Drukarka Zebra na hali odbiera komendy ZPL przez swój temat (Topic) i drukuje natychmiast po 1 kliknięciu.
            </div>
          </div>

          <label class="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant cursor-pointer">
            <input id="cfg-mqtt-enabled" type="checkbox" ${mqttCfg.enabled ? 'checked' : ''} class="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer" />
            <div class="flex flex-col">
              <span class="text-xs font-bold text-gray-900 uppercase">Włącz bezpośredni druk przez MQTT (1-Klik)</span>
              <span class="text-[11px] text-gray-500">Kliknięcie „Drukuj” wysyła ZPL prosto do Zebry przez chmurę</span>
            </div>
          </label>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div class="sm:col-span-2">
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Host Brokera (np. HiveMQ / Mosquitto)</label>
              <input id="cfg-mqtt-host" type="text" placeholder="np. xxxxx.s1.eu.hivemq.cloud lub broker.hivemq.com" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono" value="${mqttCfg.host}" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Port WSS</label>
              <input id="cfg-mqtt-port" type="number" placeholder="8884" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono" value="${mqttCfg.port || 8884}" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Użytkownik (Username)</label>
              <input id="cfg-mqtt-user" type="text" placeholder="Opcjonalnie" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono" value="${mqttCfg.username || ''}" />
            </div>
            <div>
              <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Hasło (Password)</label>
              <input id="cfg-mqtt-pass" type="password" placeholder="Opcjonalnie" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono" value="${mqttCfg.password || ''}" />
            </div>
          </div>

          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1 text-xs font-bold">Temat MQTT (Topic Drukarki Zebra)</label>
            <input id="cfg-mqtt-topic" type="text" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono font-bold text-primary" value="${mqttCfg.topic || 'bluemake/printers/zebra'}" />
          </div>
        </div>

        <!-- Status Banner -->
        <div id="test-status-banner" class="hidden p-3 rounded-xl text-xs font-bold flex items-center gap-2"></div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-outline-variant">
          <button id="test-conn-btn" class="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-outline-variant transition-colors">
            <span class="material-symbols-outlined text-[18px]">wifi_find</span>
            <span id="test-btn-text">TESTUJ POŁĄCZENIE</span>
          </button>
          <button id="save-cfg-btn" class="flex-1 bg-primary hover:bg-tertiary text-on-primary font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">save</span>
            ZAPISZ USTAWIENIA
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
  const testBtnText = document.getElementById('test-btn-text');

  const tabOdoo = document.getElementById('tab-btn-odoo');
  const tabMqtt = document.getElementById('tab-btn-mqtt');
  const panelOdoo = document.getElementById('panel-settings-odoo');
  const panelMqtt = document.getElementById('panel-settings-mqtt');

  let activeTab = 'odoo';

  const switchTab = (tab) => {
    activeTab = tab;
    tabOdoo.className = `tab-settings-btn flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${tab === 'odoo' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`;
    tabMqtt.className = `tab-settings-btn flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${tab === 'mqtt' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`;

    panelOdoo.classList.toggle('hidden', tab !== 'odoo');
    panelMqtt.classList.toggle('hidden', tab !== 'mqtt');
    banner.classList.add('hidden');

    testBtnText.textContent = tab === 'odoo' ? 'TESTUJ ODOO API' : 'TESTUJ BROKER MQTT';
  };

  tabOdoo.addEventListener('click', () => switchTab('odoo'));
  tabMqtt.addEventListener('click', () => switchTab('mqtt'));

  closeBtn.addEventListener('click', () => backdrop.remove());

  const getOdooFormValues = () => ({
    url: document.getElementById('cfg-url').value.trim(),
    db: document.getElementById('cfg-db').value.trim(),
    uid: parseInt(document.getElementById('cfg-uid').value) || 9,
    apiKey: document.getElementById('cfg-key').value.trim(),
    locationId: parseInt(document.getElementById('cfg-loc').value) || 5,
    categoryId: parseInt(document.getElementById('cfg-cat').value) || 4
  });

  const getMqttFormValues = () => ({
    enabled: document.getElementById('cfg-mqtt-enabled').checked,
    host: document.getElementById('cfg-mqtt-host').value.trim(),
    port: parseInt(document.getElementById('cfg-mqtt-port').value) || 8884,
    protocol: 'wss',
    path: '/mqtt',
    username: document.getElementById('cfg-mqtt-user').value.trim(),
    password: document.getElementById('cfg-mqtt-pass').value.trim(),
    topic: document.getElementById('cfg-mqtt-topic').value.trim() || 'bluemake/printers/zebra'
  });

  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true;
    banner.className = 'hidden p-3 rounded-xl text-xs font-bold';

    if (activeTab === 'odoo') {
      testBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> SPRAWDZANIE ODOO...';
      saveOdooConfig(getOdooFormValues());
      const status = await checkApiStatus();
      banner.classList.remove('hidden');

      if (status.connected) {
        banner.className = 'p-3 rounded-xl text-xs font-bold bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-2';
        banner.innerHTML = `<span class="material-symbols-outlined text-emerald-600">check_circle</span> Połączono pomyślnie z Odoo ${status.serverVersion}!`;
      } else {
        banner.className = 'p-3 rounded-xl text-xs font-bold bg-rose-100 border border-rose-300 text-rose-900 flex items-center gap-2';
        banner.innerHTML = `<span class="material-symbols-outlined text-rose-600">error</span> Błąd Odoo: ${status.error || 'Brak odpowiedzi'}`;
      }
      testBtn.disabled = false;
      testBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">wifi_find</span> TESTUJ ODOO API';
    } else {
      testBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> ŁĄCZENIE Z MQTT...';
      const currentMqtt = getMqttFormValues();
      saveMqttConfig(currentMqtt);

      try {
        await testMqttConnection(currentMqtt);
        banner.className = 'p-3 rounded-xl text-xs font-bold bg-emerald-100 border border-emerald-300 text-emerald-900 flex flex-col gap-2';
        banner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>Połączono pomyślnie z brokerem MQTT (${currentMqtt.host})!</span>
          </div>
          <button id="send-test-label-btn" type="button" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[16px]">print</span>
            WYŚLIJ TESTOWY WYDRUK ZPL DO ZEBRY
          </button>
        `;
        banner.classList.remove('hidden');

        document.getElementById('send-test-label-btn').addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[16px]">sync</span> DRUKOWANIE...';
          try {
            const testZpl = generateProductZpl({
              id: 999,
              sku: 'TEST-304_Ø24',
              name: 'Pręt testowy Gat.304 Ø24',
              quantity: 12.0
            });
            await sendZplViaMqtt(testZpl);
            btn.innerHTML = '✅ WYDRUK WYSŁANY DO ZEBRY!';
          } catch (err) {
            btn.innerHTML = '❌ Błąd druku: ' + err.message;
            btn.disabled = false;
          }
        });
      } catch (err) {
        banner.className = 'p-3 rounded-xl text-xs font-bold bg-rose-100 border border-rose-300 text-rose-900 flex items-center gap-2';
        banner.innerHTML = `<span class="material-symbols-outlined text-rose-600">error</span> Błąd MQTT: ${err.message}`;
        banner.classList.remove('hidden');
      }

      testBtn.disabled = false;
      testBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">wifi_find</span> TESTUJ BROKER MQTT';
    }
  });

  saveBtn.addEventListener('click', () => {
    saveOdooConfig(getOdooFormValues());
    saveMqttConfig(getMqttFormValues());
    backdrop.remove();
    if (onSavedCallback) onSavedCallback();
  });
}
