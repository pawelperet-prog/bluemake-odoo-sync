import { DEFAULT_OPERATORS, setLoggedIn } from '../services/authService.js';

/**
 * Dedicated Fullscreen Login View for Bluemake Workshop & Warehouse
 */
export function renderLoginView(container, navigateTo) {
  let selectedOperator = DEFAULT_OPERATORS[0]; // Paweł Peret
  let currentPin = '';
  let errorMessage = '';

  function render() {
    container.innerHTML = `
      <div class="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 select-none">
        
        <!-- Background Glow -->
        <div class="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

        <div class="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6">
          
          <!-- Logo & Brand Header -->
          <div class="flex flex-col items-center text-center gap-1.5">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
              <span class="material-symbols-outlined text-4xl">warehouse</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight text-white uppercase">Bluemake Magazyn</h1>
            <p class="text-xs font-bold text-slate-400">System Produkcji & Synchronizacji Odoo 19</p>
          </div>

          <!-- Operator Selection Tabs -->
          <div class="w-full flex flex-col gap-2">
            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Wybierz Operatora:</label>
            <div class="grid grid-cols-3 gap-2">
              ${DEFAULT_OPERATORS.map(op => {
                const isSelected = selectedOperator.id === op.id;
                return `
                  <button type="button" class="btn-select-op flex flex-col items-center p-2.5 rounded-2xl border transition-all ${isSelected ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 scale-105' : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'}" data-op-id="${op.id}">
                    <span class="material-symbols-outlined text-2xl mb-1">${op.avatar}</span>
                    <span class="text-[11px] font-bold truncate max-w-full text-center">${op.name.split(' ')[0]}</span>
                    <span class="text-[9px] opacity-75 font-semibold">${op.role}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- PIN Code Display -->
          <div class="w-full flex flex-col items-center gap-2">
            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wprowadź Kod PIN:</label>
            
            <div class="flex items-center gap-3 my-1">
              ${[0, 1, 2, 3].map(i => {
                const filled = currentPin.length > i;
                return `
                  <div class="w-4 h-4 rounded-full border-2 transition-all duration-150 ${filled ? 'bg-blue-500 border-blue-400 scale-125 shadow-md shadow-blue-500/50' : 'bg-slate-800 border-slate-700'}"></div>
                `;
              }).join('')}
            </div>

            ${errorMessage ? `
              <div class="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-bounce">
                <span class="material-symbols-outlined text-base">error</span>
                <span>${errorMessage}</span>
              </div>
            ` : `
              <div class="text-[11px] text-slate-500">Domyślny PIN: Paweł (1234), Magazynier (0000)</div>
            `}
          </div>

          <!-- Touch Numeric Keypad -->
          <div class="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
              <button type="button" class="btn-keypad h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-bold text-xl transition-all active:scale-95 shadow-sm flex items-center justify-center" data-num="${num}">
                ${num}
              </button>
            `).join('')}
            <button type="button" id="btn-clear-pin" class="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center">
              C
            </button>
            <button type="button" class="btn-keypad h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-bold text-xl transition-all active:scale-95 shadow-sm flex items-center justify-center" data-num="0">
              0
            </button>
            <button type="button" id="btn-backspace-pin" class="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-bold transition-all active:scale-95 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">backspace</span>
            </button>
          </div>

          <!-- Footer info -->
          <div class="text-[11px] text-slate-500 text-center">
            Zalogowano do węzła Odoo: <strong>odo.domowyasystent.online</strong>
          </div>

        </div>
      </div>
    `;

    bindEvents();
  }

  function checkPin() {
    if (currentPin.length === 4) {
      if (currentPin === selectedOperator.pin) {
        errorMessage = '';
        setLoggedIn(selectedOperator);
        navigateTo('dashboard');
      } else {
        errorMessage = 'Nieprawidłowy kod PIN!';
        currentPin = '';
        render();
      }
    }
  }

  function bindEvents() {
    container.querySelectorAll('.btn-select-op').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const opId = Number(e.currentTarget.getAttribute('data-op-id'));
        const found = DEFAULT_OPERATORS.find(o => o.id === opId);
        if (found) {
          selectedOperator = found;
          currentPin = '';
          errorMessage = '';
          render();
        }
      });
    });

    container.querySelectorAll('.btn-keypad').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-num');
        if (currentPin.length < 4) {
          currentPin += val;
          errorMessage = '';
          render();
          if (currentPin.length === 4) {
            setTimeout(checkPin, 100);
          }
        }
      });
    });

    container.querySelector('#btn-clear-pin')?.addEventListener('click', () => {
      currentPin = '';
      errorMessage = '';
      render();
    });

    container.querySelector('#btn-backspace-pin')?.addEventListener('click', () => {
      if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        errorMessage = '';
        render();
      }
    });

    // Keyboard support
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (currentPin.length < 4) {
          currentPin += e.key;
          errorMessage = '';
          render();
          if (currentPin.length === 4) {
            setTimeout(checkPin, 100);
          }
        }
      } else if (e.key === 'Backspace') {
        if (currentPin.length > 0) {
          currentPin = currentPin.slice(0, -1);
          errorMessage = '';
          render();
        }
      } else if (e.key === 'Escape') {
        currentPin = '';
        errorMessage = '';
        render();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { once: true });
  }

  render();
}
