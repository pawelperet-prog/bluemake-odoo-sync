import { getCurrentOperator, logoutOperator, lockSite, verifyAndChangePin } from '../services/authService.js';

/**
 * Operator Profile & Security Modal
 */
export function openOperatorModal(navigateTo) {
  const existing = document.getElementById('operator-modal-backdrop');
  if (existing) existing.remove();

  const activeOp = getCurrentOperator();
  if (!activeOp) return;

  const isAdmin = activeOp.role === 'ADMIN' || activeOp.role === 'Administrator';

  let mode = 'VIEW'; // 'VIEW' | 'CHANGE_PIN'
  let oldPin = '';
  let newPin = '';
  let confirmPin = '';
  let errorMsg = '';
  let successMsg = '';

  const backdrop = document.createElement('div');
  backdrop.id = 'operator-modal-backdrop';
  backdrop.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 select-none';

  function renderModal() {
    backdrop.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-400 text-2xl">account_circle</span>
            <h3 class="font-bold text-white text-base">Profil Operatora</h3>
          </div>
          <button id="btn-close-op-modal" class="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        ${mode === 'VIEW' ? `
          <!-- Operator Info Card -->
          <div class="flex flex-col items-center bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 gap-2 text-center">
            <div class="w-16 h-16 rounded-2xl ${isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'} flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined text-4xl">${activeOp.avatar || 'person'}</span>
            </div>
            <div>
              <h4 class="font-black text-lg text-white">${activeOp.name}</h4>
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'}">
                ${isAdmin ? '👑 Administrator Systemu' : '📦 Magazynier / Operator'}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 pt-1">
            <button id="btn-modal-change-pin" class="w-full bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all">
              <span class="material-symbols-outlined text-base text-blue-400">key</span>
              <span>Zmień Mój Kod PIN</span>
            </button>

            <button id="btn-modal-logout" class="w-full bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-amber-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all">
              <span class="material-symbols-outlined text-base text-amber-400">logout</span>
              <span>Wyloguj / Przełącz Operatora</span>
            </button>

            <button id="btn-modal-lock-site" class="w-full bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-600 text-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-900/60 transition-all">
              <span class="material-symbols-outlined text-base text-rose-400">lock</span>
              <span>Zablokuj Aplikację (Hasło Główne)</span>
            </button>
          </div>
        ` : `
          <!-- Change PIN Form -->
          <div class="flex flex-col gap-3">
            <h4 class="font-bold text-sm text-amber-400 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-lg">key</span>
              <span>Zmiana Kodu PIN dla ${activeOp.name}</span>
            </h4>

            <div class="flex flex-col gap-2">
              <div>
                <label class="text-[11px] font-bold text-slate-300 block mb-1">Obecny PIN (4 cyfry):</label>
                <input id="input-old-pin" type="password" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-blue-500" value="${oldPin}" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-slate-300 block mb-1">Nowy PIN (4 cyfry):</label>
                <input id="input-new-pin" type="password" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-blue-500" value="${newPin}" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-slate-300 block mb-1">Powtórz Nowy PIN:</label>
                <input id="input-confirm-pin" type="password" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-blue-500" value="${confirmPin}" />
              </div>
            </div>

            ${errorMsg ? `
              <div class="text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-800 p-2 rounded-xl flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">error</span>
                <span>${errorMsg}</span>
              </div>
            ` : ''}

            ${successMsg ? `
              <div class="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800 p-2 rounded-xl flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">check_circle</span>
                <span>${successMsg}</span>
              </div>
            ` : ''}

            <div class="flex gap-2 pt-2">
              <button id="btn-cancel-change-pin" type="button" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors">
                Anuluj
              </button>
              <button id="btn-save-new-pin" type="button" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md">
                Zapisz PIN
              </button>
            </div>
          </div>
        `}

      </div>
    `;

    backdrop.querySelector('#btn-close-op-modal')?.addEventListener('click', () => backdrop.remove());

    if (mode === 'VIEW') {
      backdrop.querySelector('#btn-modal-change-pin')?.addEventListener('click', () => {
        mode = 'CHANGE_PIN';
        oldPin = '';
        newPin = '';
        confirmPin = '';
        errorMsg = '';
        successMsg = '';
        renderModal();
      });

      backdrop.querySelector('#btn-modal-logout')?.addEventListener('click', () => {
        backdrop.remove();
        logoutOperator();
        navigateTo('login');
      });

      backdrop.querySelector('#btn-modal-lock-site')?.addEventListener('click', () => {
        backdrop.remove();
        lockSite();
        navigateTo('login');
      });
    } else {
      const inOld = backdrop.querySelector('#input-old-pin');
      const inNew = backdrop.querySelector('#input-new-pin');
      const inConf = backdrop.querySelector('#input-confirm-pin');

      inOld?.addEventListener('input', (e) => { oldPin = e.target.value.trim(); });
      inNew?.addEventListener('input', (e) => { newPin = e.target.value.trim(); });
      inConf?.addEventListener('input', (e) => { confirmPin = e.target.value.trim(); });

      backdrop.querySelector('#btn-cancel-change-pin')?.addEventListener('click', () => {
        mode = 'VIEW';
        errorMsg = '';
        renderModal();
      });

      backdrop.querySelector('#btn-save-new-pin')?.addEventListener('click', () => {
        if (!oldPin || oldPin.length !== 4) {
          errorMsg = 'Wpisz poprawny obecny 4-cyfrowy PIN.';
          renderModal();
          return;
        }
        if (!newPin || newPin.length !== 4) {
          errorMsg = 'Nowy PIN musi mieć dokładnie 4 cyfry.';
          renderModal();
          return;
        }
        if (newPin !== confirmPin) {
          errorMsg = 'Nowe kody PIN nie są identyczne!';
          renderModal();
          return;
        }

        const res = verifyAndChangePin(activeOp.id, oldPin, newPin);
        if (res.success) {
          successMsg = 'PIN został pomyślnie zmieniony!';
          errorMsg = '';
          renderModal();
          setTimeout(() => {
            backdrop.remove();
          }, 1200);
        } else {
          errorMsg = res.error || 'Błąd zmiany PIN.';
          renderModal();
        }
      });
    }
  }

  document.body.appendChild(backdrop);
  renderModal();
}
