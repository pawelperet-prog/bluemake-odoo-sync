import { verifySitePassword } from '../services/authService.js';

/**
 * Master Site Security Gatekeeper View
 * Protects the entire application with master password 'Szymon_Mateusz2025'
 */
export function renderSiteGateView(container, onUnlocked) {
  let showPass = false;
  let errorMsg = '';
  let isShaking = false;

  function render() {
    container.innerHTML = `
      <div class="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 select-none relative overflow-hidden">
        
        <!-- Glowing background effects -->
        <div class="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
        <div class="fixed -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="fixed -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative w-full max-w-md bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 ${isShaking ? 'animate-bounce' : ''}">
          
          <!-- Shield Icon & Lock Header -->
          <div class="flex flex-col items-center text-center gap-2">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25 mb-1">
              <span class="material-symbols-outlined text-4xl">lock</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight text-white uppercase">Dostęp Zastrzeżony</h1>
            <p class="text-xs font-bold text-slate-400 max-w-xs">Aplikacja wewnętrzna Bluemake Sp. z o.o. Wprowadź hasło główne, aby odblokować system.</p>
          </div>

          <!-- Password Form -->
          <form id="gate-form" class="w-full flex flex-col gap-4">
            
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Hasło dostępowe:</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-xl pointer-events-none">key</span>
                <input 
                  id="gate-password-input" 
                  type="${showPass ? 'text' : 'password'}" 
                  placeholder="Wpisz hasło..." 
                  autocomplete="current-password"
                  autofocus
                  class="w-full pl-11 pr-11 py-3 bg-slate-800/90 border-2 ${errorMsg ? 'border-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-blue-500'} rounded-2xl text-white font-mono text-sm focus:outline-none transition-colors"
                />
                <button 
                  type="button" 
                  id="btn-toggle-eye" 
                  class="absolute right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  title="${showPass ? 'Ukryj hasło' : 'Pokaż hasło'}"
                >
                  <span class="material-symbols-outlined text-xl">${showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            ${errorMsg ? `
              <div class="text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-800 p-2.5 rounded-xl flex items-center gap-2">
                <span class="material-symbols-outlined text-rose-400 text-lg">error</span>
                <span>${errorMsg}</span>
              </div>
            ` : ''}

            <button 
              type="submit" 
              id="btn-unlock-site" 
              class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-black py-3.5 px-4 rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-1"
            >
              <span class="material-symbols-outlined text-xl">lock_open</span>
              <span>ODBLOKUJ SYSTEM</span>
            </button>
          </form>

          <!-- Footer Info -->
          <div class="text-[11px] text-slate-500 text-center font-medium">
            Bluemake System Synchronizacji Odoo 19 • SSL Protected
          </div>

        </div>
      </div>
    `;

    const form = container.querySelector('#gate-form');
    const input = container.querySelector('#gate-password-input');
    const eyeBtn = container.querySelector('#btn-toggle-eye');

    if (eyeBtn) {
      eyeBtn.addEventListener('click', () => {
        showPass = !showPass;
        render();
        const reInput = container.querySelector('#gate-password-input');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) {
          errorMsg = 'Wpisz hasło dostępowe.';
          render();
          return;
        }

        if (verifySitePassword(val)) {
          errorMsg = '';
          onUnlocked();
        } else {
          errorMsg = 'Nieprawidłowe hasło dostępowe. Odmowa dostępu.';
          isShaking = true;
          render();
          setTimeout(() => {
            isShaking = false;
          }, 1000);
        }
      });
    }
  }

  render();
}
