/**
 * Operator Authentication & Warehouse Audit Log Service
 */

const LOCAL_STORAGE_OPERATOR_KEY = 'bluemake_active_operator';
const LOCAL_STORAGE_LOGGED_IN_KEY = 'bluemake_is_logged_in';

// Pre-configured default operators
export const DEFAULT_OPERATORS = [
  { id: 1, name: 'Paweł Peret', role: 'Administrator', pin: '1234', avatar: 'admin_panel_settings' },
  { id: 2, name: 'Magazynier (Shift 1)', role: 'Magazynier', pin: '0000', avatar: 'inventory' },
  { id: 3, name: 'Operator Cięcia', role: 'Operator', pin: '1111', avatar: 'precision_manufacturing' }
];

export function isUserLoggedIn() {
  return localStorage.getItem(LOCAL_STORAGE_LOGGED_IN_KEY) === 'true';
}

export function setLoggedIn(operator) {
  localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_KEY, 'true');
  saveCurrentOperator(operator);
}

export function getCurrentOperator() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OPERATOR_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_OPERATORS[0];
}

export function saveCurrentOperator(operator) {
  localStorage.setItem(LOCAL_STORAGE_OPERATOR_KEY, JSON.stringify(operator));
}

export function logoutOperator() {
  localStorage.removeItem(LOCAL_STORAGE_LOGGED_IN_KEY);
  localStorage.removeItem(LOCAL_STORAGE_OPERATOR_KEY);
}

/**
 * Open Login / Switch Operator Modal
 */
export function openLoginModal(onSuccessCallback) {
  const existing = document.getElementById('login-modal-backdrop');
  if (existing) existing.remove();

  const current = getCurrentOperator();

  const operatorOptions = DEFAULT_OPERATORS.map(op => `
    <option value="${op.id}" ${op.id === current?.id ? 'selected' : ''}>
      ${op.name} (${op.role})
    </option>
  `).join('');

  const modalHtml = `
    <div id="login-modal-backdrop" class="fixed inset-0 bg-primary/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest border-2 border-primary rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
        
        <!-- Header -->
        <div class="flex items-center gap-3 border-b border-outline-variant pb-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <span class="material-symbols-outlined text-2xl">lock</span>
          </div>
          <div>
            <h2 class="font-headline-md font-bold text-primary text-lg">Logowanie Magazynowe</h2>
            <p class="text-xs text-on-surface-variant">Wybierz profil operatora i podaj PIN</p>
          </div>
        </div>

        <!-- Login Form -->
        <form id="login-form" class="flex flex-col gap-3 font-body-md">
          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Wybierz Operatora *</label>
            <select id="login-operator-select" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-bold text-primary">
              ${operatorOptions}
              <option value="CUSTOM">Inny operator (wpisz imię)...</option>
            </select>
          </div>

          <div id="custom-op-wrapper" class="hidden">
            <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Imię i Nazwisko Operatora *</label>
            <input id="custom-op-name" type="text" placeholder="np. Jan Kowalski" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-bold text-primary" />
          </div>

          <div>
            <label class="font-label-caps text-on-surface-variant block mb-1 font-bold text-xs">Kod PIN Autoryzacyjny *</label>
            <input id="login-pin-input" type="password" maxlength="6" placeholder="Wpisz PIN (np. 1234)" class="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-body-md font-mono text-center font-bold text-xl tracking-widest" required />
            <p class="text-[11px] text-on-surface-variant/70 mt-1">Domyślny PIN administratora: <strong>1234</strong> | Magazynier: <strong>0000</strong></p>
          </div>

          <div id="login-error-banner" class="hidden p-2.5 rounded text-xs font-bold bg-red-100 text-red-800 flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]">error</span>
            <span id="login-error-text">Nieprawidłowy kod PIN.</span>
          </div>

          <div class="flex gap-2 pt-2 border-t border-outline-variant mt-1">
            <button type="submit" id="submit-login-btn" class="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-label-caps py-3 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-md uppercase transition-transform active:scale-95">
              <span class="material-symbols-outlined text-[20px]">login</span>
              ZALOGUJ OPERATORA
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('login-modal-backdrop');
  const form = document.getElementById('login-form');
  const select = document.getElementById('login-operator-select');
  const customWrapper = document.getElementById('custom-op-wrapper');
  const customInput = document.getElementById('custom-op-name');
  const pinInput = document.getElementById('login-pin-input');
  const banner = document.getElementById('login-error-banner');
  const errorText = document.getElementById('login-error-text');

  select.addEventListener('change', () => {
    if (select.value === 'CUSTOM') {
      customWrapper.classList.remove('hidden');
      customInput.required = true;
    } else {
      customWrapper.classList.add('hidden');
      customInput.required = false;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    banner.classList.add('hidden');

    const pin = pinInput.value.trim();
    let selectedOp = null;

    if (select.value === 'CUSTOM') {
      const customName = customInput.value.trim();
      if (!customName) return;
      selectedOp = {
        id: Date.now(),
        name: customName,
        role: 'Operator',
        pin: pin || '0000',
        avatar: 'person'
      };
    } else {
      const found = DEFAULT_OPERATORS.find(o => o.id === parseInt(select.value));
      if (found) {
        if (found.pin && found.pin !== pin) {
          errorText.textContent = 'Nieprawidłowy kod PIN. Spróbuj ponownie.';
          banner.classList.remove('hidden');
          return;
        }
        selectedOp = found;
      }
    }

    if (selectedOp) {
      saveCurrentOperator(selectedOp);
      backdrop.remove();
      if (onSuccessCallback) onSuccessCallback(selectedOp);
    }
  });
}
