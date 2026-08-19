import { sendLowStockAlert, ODOO_MANAGERS, ODOO_DISCUSS_CHANNELS } from '../services/odooApi.js';
import { getCurrentOperator } from '../services/authService.js';

/**
 * Open Low Stock Alert / Replenishment Modal for Odoo 19 (Discuss Channels & Users)
 */
export function openLowStockAlertModal(product, onSentCallback = null) {
  const existing = document.getElementById('low-stock-modal-backdrop');
  if (existing) existing.remove();

  const currentProduct = product || {
    id: 101,
    sku: 'S355-FI20',
    name: 'Pręt okrągły',
    quantity: 2.5,
    uom: 'm'
  };

  const operator = getCurrentOperator();
  const qtyNum = Number(currentProduct.quantity || 0).toFixed(1);

  const html = `
    <div id="low-stock-modal-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-rose-500/80 rounded-2xl p-5 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex justify-between items-start border-b border-rose-200 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 flex-shrink-0">
              <span class="material-symbols-outlined text-3xl">campaign</span>
            </div>
            <div>
              <h2 class="font-headline-md text-base font-bold text-rose-900 leading-tight">🚨 Zgłoszenie na Czat Odoo</h2>
              <p class="text-xs text-rose-700 mt-0.5">Powiadomienie do kanałów Odoo Discuss (Stan &lt; 5.0m)</p>
            </div>
          </div>
          <button id="close-alert-modal-btn" class="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Product Summary Box -->
        <div class="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="font-mono text-sm font-bold bg-white px-2.5 py-0.5 rounded border border-rose-300 text-rose-900">${currentProduct.sku}</span>
            <div class="flex items-center gap-1.5 bg-rose-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
              <span>STAN:</span>
              <span class="text-sm">${qtyNum} ${currentProduct.uom || 'm'}</span>
            </div>
          </div>
          <p class="font-bold text-sm text-gray-900 leading-tight">${currentProduct.name}</p>
          <div class="flex justify-between text-xs text-gray-500 pt-1 border-t border-rose-200/60">
            <span>Odoo ID: ${currentProduct.id}</span>
            <span>Lokalizacja: ${currentProduct.location || 'Magazyn'}</span>
          </div>
        </div>

        <!-- Odoo Discuss Channels Selection -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px] text-indigo-600">forum</span>
            Wybierz kanały czatu w Odoo:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${ODOO_DISCUSS_CHANNELS.map(c => `
              <label class="flex items-center gap-2 p-2.5 bg-surface-container rounded-lg border border-outline-variant/50 hover:border-indigo-500 cursor-pointer transition-all">
                <input type="checkbox" name="alert-channel" value="${c.id}" ${c.checked ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600" />
                <span class="text-xs font-bold text-gray-900">${c.name}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Recipients Mentions Selection -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px] text-rose-600">alternate_email</span>
            Oznacz osoby w wiadomości (@wzmianka):
          </label>
          <div class="flex flex-col gap-2 bg-surface-container p-2.5 rounded-xl border border-outline-variant/40">
            ${ODOO_MANAGERS.map(m => `
              <label class="flex items-center gap-3 p-2 bg-white rounded-lg border border-outline-variant/50 hover:border-rose-500 cursor-pointer transition-all">
                <input type="checkbox" name="alert-recipient" value="${m.partnerId}" checked class="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600" />
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-xs font-bold text-gray-900">${m.name}</span>
                  <span class="text-[11px] text-gray-500 font-mono">${m.email}</span>
                </div>
                <span class="material-symbols-outlined text-rose-500 text-[18px]">account_circle</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Optional Operator Note -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Opcjonalna notatka / powód zgłoszenia:
          </label>
          <textarea id="alert-custom-note" rows="2" placeholder="np. Pilne zapotrzebowanie – zostało mało na następną zmianę / projekt #402" class="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"></textarea>
        </div>

        <!-- Status / Error Banner -->
        <div id="alert-status-banner" class="hidden p-3 rounded-xl text-xs font-bold"></div>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-1">
          <button id="cancel-alert-btn" class="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold py-3 px-4 rounded-xl text-xs uppercase transition-colors">
            Anuluj
          </button>
          <button id="send-alert-now-btn" class="flex-[2] bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">send</span>
            WYŚLIJ NA CZAT ODOO
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const backdrop = document.getElementById('low-stock-modal-backdrop');
  const closeBtn = document.getElementById('close-alert-modal-btn');
  const cancelBtn = document.getElementById('cancel-alert-btn');
  const sendBtn = document.getElementById('send-alert-now-btn');
  const noteInput = document.getElementById('alert-custom-note');
  const banner = document.getElementById('alert-status-banner');

  const closeModal = () => backdrop.remove();
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  sendBtn.addEventListener('click', async () => {
    const checkedChannels = Array.from(backdrop.querySelectorAll('input[name="alert-channel"]:checked')).map(cb => Number(cb.value));
    const checkedRecipients = Array.from(backdrop.querySelectorAll('input[name="alert-recipient"]:checked')).map(cb => Number(cb.value));

    if (checkedChannels.length === 0 && checkedRecipients.length === 0) {
      banner.className = 'bg-amber-100 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-bold block';
      banner.textContent = '⚠️ Zaznacz przynajmniej jeden kanał czatu (np. #Materiał).';
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = `
      <span class="material-symbols-outlined text-[18px] animate-spin">sync</span>
      WYSYŁANIE NA CZAT...
    `;

    const note = noteInput.value.trim();
    const res = await sendLowStockAlert({
      productId: currentProduct.id,
      sku: currentProduct.sku,
      name: currentProduct.name,
      currentQuantity: currentProduct.quantity,
      uom: currentProduct.uom || 'm',
      location: currentProduct.location,
      operatorName: operator ? operator.name : 'Operator Magazynu',
      channelIds: checkedChannels.length > 0 ? checkedChannels : [9],
      recipientPartnerIds: checkedRecipients,
      customNote: note
    });

    if (res.success) {
      banner.className = 'bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold block';
      banner.innerHTML = `✅ <b>Wysłano na czat Odoo!</b> Wiadomość pojawiła się w kanale <b>#Materiał</b> z powiadomieniem dla wybranych osób.`;
      
      sendBtn.className = 'flex-[2] bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2';
      sendBtn.innerHTML = `
        <span class="material-symbols-outlined text-[18px]">check_circle</span>
        ALERT WYSŁANY
      `;

      if (onSentCallback) onSentCallback();

      setTimeout(() => {
        closeModal();
      }, 1400);
    } else {
      sendBtn.disabled = false;
      sendBtn.innerHTML = `
        <span class="material-symbols-outlined text-[18px]">send</span>
        SPRÓBUJ PONOWNIE
      `;
      banner.className = 'bg-rose-100 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs font-bold block';
      banner.textContent = `❌ ${res.error}`;
    }
  });
}
