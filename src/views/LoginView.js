import { getUsers, changeUserPin, setLoggedIn } from '../services/authService.js';

/**
 * Dedicated Fullscreen Login View with 4 Users, PIN pad & First-Login PIN Change Flow
 */
export function renderLoginView(container, navigateTo) {
  let users = getUsers();
  let selectedOperator = users[0]; // Default Paweł
  let currentPin = '';
  let errorMessage = '';

  // State: 'LOGIN' | 'FORCE_CHANGE_PIN' | 'FORCE_CONFIRM_PIN'
  let viewMode = 'LOGIN';
  let newPinTemp = '';
  let confirmPinTemp = '';

  function render() {
    users = getUsers();
    // Refresh selected operator data
    selectedOperator = users.find(u => u.id === selectedOperator.id) || users[0];

    container.innerHTML = `
      <div class="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 select-none">
        
        <!-- Background Glow -->
        <div class="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

        <div class="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-5">
          
          <!-- Logo & Brand Header -->
          <div class="flex flex-col items-center text-center gap-1.5">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
              <span class="material-symbols-outlined text-3xl">warehouse</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight text-white uppercase">Bluemake Magazyn</h1>
            <p class="text-xs font-bold text-slate-400">System Produkcji & Synchronizacji Odoo 19</p>
          </div>

          ${viewMode === 'LOGIN' ? `
            <!-- 4 Operators Selection Grid -->
            <div class="w-full flex flex-col gap-2">
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Wybierz Profil Operatora:</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${users.map(op => {
                  const isSelected = selectedOperator.id === op.id;
                  const isAdmin = op.role === 'ADMIN';
                  return `
                    <button type="button" class="btn-select-op flex flex-col items-center p-2.5 rounded-2xl border transition-all ${isSelected ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 scale-105' : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'}" data-op-id="${op.id}">
                      <span class="material-symbols-outlined text-2xl mb-1">${op.avatar}</span>
                      <span class="text-xs font-black truncate max-w-full text-center">${op.name}</span>
                      <span class="text-[9px] font-bold ${isAdmin ? 'text-amber-300' : 'text-slate-400'}">${isAdmin ? '👑 ADMIN' : '📦 OPR'}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- PIN Code Display -->
            <div class="w-full flex flex-col items-center gap-2">
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Wprowadź PIN dla: <strong class="text-blue-400">${selectedOperator.name}</strong>
              </label>
              
              <div class="flex items-center gap-3 my-1">
                ${[0, 1, 2, 3].map(i => {
                  const filled = currentPin.length > i;
                  return `
                    <div class="w-4 h-4 rounded-full border-2 transition-all duration-150 ${filled ? 'bg-blue-500 border-blue-400 scale-125 shadow-md shadow-blue-500/50' : 'bg-slate-800 border-slate-700'}"></div>
                  `;
                }).join('')}
              </div>

              ${errorMessage ? `
                <div class="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">error</span>
                  <span>${errorMessage}</span>
                </div>
              ` : `
                <div class="text-[11px] text-slate-500">Domyślny PIN startowy: <strong>1234</strong></div>
              `}
            </div>

            <!-- Touch Keypad -->
            <div class="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
                <button type="button" class="btn-keypad h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-bold text-xl transition-all active:scale-95 shadow-sm flex items-center justify-center p-3" data-num="${num}">
                  ${num}
                </button>
              `).join('')}
              <button type="button" id="btn-clear-pin" class="h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center p-3">
                C
              </button>
              <button type="button" class="btn-keypad h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-bold text-xl transition-all active:scale-95 shadow-sm flex items-center justify-center p-3" data-num="0">
                0
              </button>
              <button type="button" id="btn-backspace-pin" class="h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-bold transition-all active:scale-95 flex items-center justify-center p-3">
                <span class="material-symbols-outlined text-2xl">backspace</span>
              </button>
            </div>
          ` : `
            <!-- First Login: Mandatory PIN Change Screen -->
            <div class="w-full flex flex-col items-center gap-4 text-center">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl">key</span>
              </div>
              <div>
                <h3 class="font-bold text-lg text-white">Pierwsze Logowanie: Zmień Kod PIN</h3>
                <p class="text-xs text-slate-400 mt-0.5">Użytkownik: <strong class="text-blue-400">${selectedOperator.name}</strong></p>
                <p class="text-xs text-amber-300 font-bold mt-1">
                  ${viewMode === 'FORCE_CHANGE_PIN' ? '1. Wprowadź swój nowy, unikalny 4-cyfrowy PIN' : '2. Wprowadź ponownie ten sam PIN, aby potwierdzić'}
                </p>
              </div>

              <!-- PIN Dots for new PIN -->
              <div class="flex items-center gap-3 my-1">
                ${[0, 1, 2, 3].map(i => {
                  const activePin = viewMode === 'FORCE_CHANGE_PIN' ? newPinTemp : confirmPinTemp;
                  const filled = activePin.length > i;
                  return `
                    <div class="w-4 h-4 rounded-full border-2 transition-all duration-150 ${filled ? 'bg-amber-500 border-amber-400 scale-125 shadow-md shadow-amber-500/50' : 'bg-slate-800 border-slate-700'}"></div>
                  `;
                }).join('')}
              </div>

              ${errorMessage ? `
                <div class="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">error</span>
                  <span>${errorMessage}</span>
                </div>
              ` : ''}

              <!-- Touch Keypad for PIN Change -->
              <div class="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
                  <button type="button" class="btn-keypad-change h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-bold text-xl transition-all active:scale-95 shadow-sm flex items-center justify-center p-3" data-num="${num}">
                    ${num}
                  </button>
                `).join('')}
                <button type="button" id="btn-cancel-change" class="h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center p-3">
                  ANULUJ
                </button>
                <button type="button" class="btn-keypad-change h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-bold text-xl transition-all active:scale-95 shadow-sm flex items-center justify-center p-3" data-num="0">
                  0
                </button>
                <button type="button" id="btn-backspace-change" class="h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-bold transition-all active:scale-95 flex items-center justify-center p-3">
                  <span class="material-symbols-outlined text-2xl">backspace</span>
                </button>
              </div>
            </div>
          `}

          <!-- Footer info -->
          <div class="text-[10px] text-slate-500 text-center">
            Bezpieczny węzeł Odoo 19 • Paweł, Mateusz (Admin) • Szymon, Patryk (Magazyn)
          </div>

        </div>
      </div>
    `;

    bindEvents();
  }

  function handleLoginSuccess() {
    if (!selectedOperator.hasChangedPin || selectedOperator.pin === '1234') {
      // Force PIN change
      viewMode = 'FORCE_CHANGE_PIN';
      newPinTemp = '';
      confirmPinTemp = '';
      errorMessage = '';
      currentPin = '';
      render();
    } else {
      setLoggedIn(selectedOperator);
      navigateTo('dashboard');
    }
  }

  function checkLoginPin() {
    if (currentPin.length === 4) {
      if (currentPin === selectedOperator.pin) {
        errorMessage = '';
        handleLoginSuccess();
      } else {
        errorMessage = 'Nieprawidłowy kod PIN!';
        currentPin = '';
        render();
      }
    }
  }

  function handleNewPinInput() {
    if (viewMode === 'FORCE_CHANGE_PIN') {
      if (newPinTemp.length === 4) {
        if (newPinTemp === '1234') {
          errorMessage = 'Nowy PIN nie może być domyślnym 1234!';
          newPinTemp = '';
          render();
          return;
        }
        viewMode = 'FORCE_CONFIRM_PIN';
        confirmPinTemp = '';
        errorMessage = '';
        render();
      }
    } else if (viewMode === 'FORCE_CONFIRM_PIN') {
      if (confirmPinTemp.length === 4) {
        if (confirmPinTemp === newPinTemp) {
          // Success! Save permanently
          changeUserPin(selectedOperator.id, newPinTemp);
          alert(`🎉 PIN dla ${selectedOperator.name} został pomyślnie zmieniony i zapisany!`);
          setLoggedIn(selectedOperator);
          navigateTo('dashboard');
        } else {
          errorMessage = 'Kody PIN nie zgadzają się! Spróbuj ponownie.';
          viewMode = 'FORCE_CHANGE_PIN';
          newPinTemp = '';
          confirmPinTemp = '';
          render();
        }
      }
    }
  }

  function bindEvents() {
    // Operator Selection
    container.querySelectorAll('.btn-select-op').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const opId = Number(e.currentTarget.getAttribute('data-op-id'));
        const found = users.find(o => o.id === opId);
        if (found) {
          selectedOperator = found;
          currentPin = '';
          errorMessage = '';
          render();
        }
      });
    });

    // Login Keypad
    container.querySelectorAll('.btn-keypad').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-num');
        if (currentPin.length < 4) {
          currentPin += val;
          errorMessage = '';
          render();
          if (currentPin.length === 4) {
            setTimeout(checkLoginPin, 100);
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

    // PIN Change Keypad
    container.querySelectorAll('.btn-keypad-change').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-num');
        if (viewMode === 'FORCE_CHANGE_PIN') {
          if (newPinTemp.length < 4) {
            newPinTemp += val;
            render();
            if (newPinTemp.length === 4) setTimeout(handleNewPinInput, 100);
          }
        } else if (viewMode === 'FORCE_CONFIRM_PIN') {
          if (confirmPinTemp.length < 4) {
            confirmPinTemp += val;
            render();
            if (confirmPinTemp.length === 4) setTimeout(handleNewPinInput, 100);
          }
        }
      });
    });

    container.querySelector('#btn-cancel-change')?.addEventListener('click', () => {
      viewMode = 'LOGIN';
      currentPin = '';
      newPinTemp = '';
      confirmPinTemp = '';
      errorMessage = '';
      render();
    });

    container.querySelector('#btn-backspace-change')?.addEventListener('click', () => {
      if (viewMode === 'FORCE_CHANGE_PIN' && newPinTemp.length > 0) {
        newPinTemp = newPinTemp.slice(0, -1);
        render();
      } else if (viewMode === 'FORCE_CONFIRM_PIN' && confirmPinTemp.length > 0) {
        confirmPinTemp = confirmPinTemp.slice(0, -1);
        render();
      }
    });
  }

  render();
}
