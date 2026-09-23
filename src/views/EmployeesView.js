import { 
  getEmployees, 
  saveEmployee, 
  deleteEmployee, 
  getLeaveRequests, 
  saveLeaveRequest, 
  updateLeaveRequestStatus, 
  deleteLeaveRequest, 
  getEmployeeLeaveStats, 
  calculateWorkingDays, 
  buildLeaveMailtoUrl, 
  sendLeaveNotificationToOdoo, 
  LEAVE_TYPES 
} from '../services/employeeService.js';
import { getCurrentOperator, isAdmin } from '../services/authService.js';

export function renderEmployeesView(container, navigateTo) {
  const currentOp = getCurrentOperator();
  const isOpAdmin = isAdmin();

  let activeTab = 'LEAVES'; // 'LEAVES' | 'EMPLOYEES' | 'CALENDAR'
  let filterEmployee = 'ALL';
  let filterStatus = 'ALL';
  let showNewLeaveModal = false;
  let showNewEmployeeModal = false;
  let statusBanner = null;

  function renderUI() {
    const employees = getEmployees();
    const allRequests = getLeaveRequests();

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter requests
    const filteredRequests = allRequests.filter(r => {
      if (filterEmployee !== 'ALL' && r.employeeId !== filterEmployee) return false;
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      return true;
    });

    container.innerHTML = `
      <!-- Top Header -->
      <header class="fixed top-0 left-0 w-full z-50 bg-surface border-b border-outline-variant h-touch-target-min flex justify-between items-center px-margin-mobile">
        <div class="flex items-center gap-2">
          <button id="btn-back" class="text-primary hover:bg-surface-container-high rounded-full p-2 transition-transform duration-100 active:scale-95 flex items-center justify-center" title="Wróć do Magazynu">
            <span class="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-600 text-2xl">badge</span>
            <div>
              <h1 class="font-headline-md font-bold text-primary tracking-tight text-base sm:text-lg">Pracownicy & Ewidencja Urlopowa</h1>
              <p class="text-[10px] text-slate-500 font-medium hidden sm:block">Zarządzanie kadrą, wnioski urlopowe i powiadomienia e-mail</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-open-leave-modal" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-transform active:scale-95">
            <span class="material-symbols-outlined text-[18px]">beach_access</span>
            <span>NOWY WNIOSEK URLOPOWY</span>
          </button>
          ${isOpAdmin ? `
            <button id="btn-open-employee-modal" class="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg hidden sm:flex items-center gap-1 shadow-md transition-transform active:scale-95">
              <span class="material-symbols-outlined text-[18px]">person_add</span>
              <span>DODAJ PRACOWNIKA</span>
            </button>
          ` : ''}
        </div>
      </header>

      <main class="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md flex flex-col gap-4 mt-14 mb-24">
        
        <!-- Status Toast Banner -->
        ${statusBanner ? `
          <div class="p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            statusBanner.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
          }">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-lg">${statusBanner.type === 'success' ? 'check_circle' : 'error'}</span>
              <span>${statusBanner.msg}</span>
            </div>
            <button id="btn-close-banner" class="text-slate-500 hover:text-slate-800 p-1">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ` : ''}

        <!-- Employee Cards Grid -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">groups</span>
              <span>Zespół Bluemake & Stan Dni Urlopowych (${new Date().getFullYear()})</span>
            </h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${employees.map(emp => {
              const stats = getEmployeeLeaveStats(emp.id);
              
              // Check if currently on leave today
              const onLeaveNow = allRequests.some(r => 
                r.employeeId === emp.id && 
                r.status === 'APPROVED' && 
                r.startDate <= todayStr && 
                r.endDate >= todayStr
              );

              return `
                <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2.5">
                        <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                          <span class="material-symbols-outlined text-2xl">${emp.avatar || 'account_circle'}</span>
                        </div>
                        <div>
                          <div class="font-bold text-slate-900 text-sm">${emp.name}</div>
                          <div class="text-[11px] text-slate-500">${emp.position || 'Pracownik'}</div>
                        </div>
                      </div>
                      <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        onLeaveNow 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }">
                        ${onLeaveNow ? '🏖️ NA URLOPIE' : '🟢 W PRACY'}
                      </span>
                    </div>

                    <!-- Leave Meter / Statistics -->
                    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-3 space-y-1 text-xs">
                      <div class="flex justify-between font-medium text-slate-700">
                        <span>Pula roczna:</span>
                        <strong class="text-slate-900 font-mono">${stats.limit} dni</strong>
                      </div>
                      <div class="flex justify-between font-medium text-slate-700">
                        <span>Wykorzystane:</span>
                        <strong class="text-amber-700 font-mono">${stats.usedVacationDays} dni</strong>
                      </div>
                      <div class="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                        <span>Pozostało urlopu:</span>
                        <span class="font-mono text-sm">${stats.remainingDays} dni</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <button type="button" class="btn-quick-leave flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] py-1.5 rounded-lg border border-indigo-200 flex items-center justify-center gap-1 transition-colors" data-id="${emp.id}" data-name="${emp.name}">
                      <span class="material-symbols-outlined text-[14px]">add_circle</span>
                      <span>Zgłoś urlop</span>
                    </button>
                    <a href="mailto:${emp.email}" class="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100" title="Wyślij e-mail (${emp.email})">
                      <span class="material-symbols-outlined text-[18px]">mail</span>
                    </a>
                    ${isOpAdmin && emp.role !== 'ADMIN' ? `
                      <button type="button" class="btn-del-emp text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50" data-id="${emp.id}" title="Usuń pracownika">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Filter & Search Section for Leave Requests -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-600">event_note</span>
              <h2 class="font-bold text-slate-900 text-sm sm:text-base">Rejestr Wniosków Urlopowych i Nieobecności</h2>
              <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full font-mono">${filteredRequests.length}</span>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <!-- Filter by Employee -->
              <select id="filter-emp-select" class="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500">
                <option value="ALL" ${filterEmployee === 'ALL' ? 'selected' : ''}>Wszyscy pracownicy</option>
                ${employees.map(e => `
                  <option value="${e.id}" ${filterEmployee === e.id ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </select>

              <!-- Filter by Status -->
              <select id="filter-status-select" class="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500">
                <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>Wszystkie statusy</option>
                <option value="APPROVED" ${filterStatus === 'APPROVED' ? 'selected' : ''}>✅ Zatwierdzone</option>
                <option value="PENDING" ${filterStatus === 'PENDING' ? 'selected' : ''}>⏳ Oczekujące</option>
                <option value="REJECTED" ${filterStatus === 'REJECTED' ? 'selected' : ''}>❌ Odrzucone</option>
              </select>
            </div>
          </div>

          <!-- Leave Requests Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr class="bg-slate-100 text-slate-800 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                  <th class="py-2.5 px-3">Pracownik</th>
                  <th class="py-2.5 px-3">Rodzaj urlopu</th>
                  <th class="py-2.5 px-3 text-center">Termin nieobecności</th>
                  <th class="py-2.5 px-3 text-center">Dni</th>
                  <th class="py-2.5 px-3 text-center">Status</th>
                  <th class="py-2.5 px-3">Komentarz / Uwagi</th>
                  <th class="py-2.5 px-3 text-right">Powiadomienia & Akcje</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredRequests.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-8 text-center text-slate-400 font-medium">
                      Brak zarejestrowanych wniosków urlopowych dla wybranych filtrów.
                    </td>
                  </tr>
                ` : filteredRequests.map(r => {
                  const typeObj = LEAVE_TYPES.find(t => t.id === r.leaveType) || { label: r.leaveType, color: 'bg-slate-100 text-slate-800 border-slate-300', icon: 'event' };
                  const mailtoLink = buildLeaveMailtoUrl(r);

                  return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-3 px-3 font-bold text-slate-900">
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[18px] text-slate-400">person</span>
                          <span>${r.employeeName}</span>
                        </div>
                      </td>
                      <td class="py-3 px-3">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${typeObj.color}">
                          <span class="material-symbols-outlined text-[13px]">${typeObj.icon}</span>
                          <span>${typeObj.label}</span>
                        </span>
                      </td>
                      <td class="py-3 px-3 text-center font-mono font-medium text-slate-800">
                        ${r.startDate} <span class="text-slate-400">→</span> ${r.endDate}
                      </td>
                      <td class="py-3 px-3 text-center font-mono font-bold text-indigo-700 text-sm">
                        ${r.daysCount} dni
                      </td>
                      <td class="py-3 px-3 text-center">
                        ${r.status === 'APPROVED' ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span class="material-symbols-outlined text-[13px]">check_circle</span> Zatwierdzony
                          </span>
                        ` : (r.status === 'REJECTED' ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span class="material-symbols-outlined text-[13px]">cancel</span> Odrzucony
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <span class="material-symbols-outlined text-[13px]">hourglass_top</span> Oczekuje
                          </span>
                        `)}
                      </td>
                      <td class="py-3 px-3 text-slate-600 max-w-[200px] truncate" title="${r.notes || ''}">
                        ${r.notes || '<span class="text-slate-300 italic">Brak uwag</span>'}
                      </td>
                      <td class="py-3 px-3 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <!-- Email notification button -->
                          <a href="${mailtoLink}" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-indigo-200 transition-colors" title="Wyślij powiadomienie e-mail">
                            <span class="material-symbols-outlined text-[15px]">send</span>
                            <span class="hidden sm:inline">E-mail</span>
                          </a>

                          <!-- Odoo Discuss alert button -->
                          <button type="button" class="btn-send-odoo bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-purple-200 transition-colors" data-id="${r.id}" title="Wyślij alert do Odoo (#Wszystko)">
                            <span class="material-symbols-outlined text-[15px]">forum</span>
                            <span class="hidden sm:inline">Odoo</span>
                          </button>

                          ${isOpAdmin && r.status === 'PENDING' ? `
                            <button type="button" class="btn-approve-req bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded transition-colors" data-id="${r.id}" title="Zatwierdź wniosek">
                              <span class="material-symbols-outlined text-[16px]">done</span>
                            </button>
                            <button type="button" class="btn-reject-req bg-rose-600 hover:bg-rose-700 text-white p-1 rounded transition-colors" data-id="${r.id}" title="Odrzuć wniosek">
                              <span class="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          ` : ''}

                          <button type="button" class="btn-del-req text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors" data-id="${r.id}" title="Usuń wpis">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL: NOWY WNIOSEK URLOPOWY
           ═════════════════════════════════════════════════════════════════════ -->
      ${showNewLeaveModal ? `
        <div id="leave-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div class="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3">
            <div class="flex justify-between items-center border-b border-slate-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-600 text-2xl">beach_access</span>
                <h2 class="font-bold text-slate-900 text-base">Nowe Zgłoszenie Urlopowe</h2>
              </div>
              <button id="close-leave-modal-btn" class="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="leave-request-form" class="flex flex-col gap-3">
              <!-- Employee selector -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Pracownik *</label>
                <select id="leave-emp-select" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900" required>
                  ${employees.map(e => `
                    <option value="${e.id}" data-name="${e.name}" ${currentOp && currentOp.name === e.shortName ? 'selected' : ''}>${e.name} (${e.position})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Leave type -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Rodzaj nieobecności *</label>
                <select id="leave-type-select" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900" required>
                  ${LEAVE_TYPES.map(t => `
                    <option value="${t.id}">${t.label}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Dates Range -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Data od (początek) *</label>
                  <input type="date" id="leave-start-date" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900" value="${todayStr}" required />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Data do (koniec) *</label>
                  <input type="date" id="leave-end-date" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900" value="${todayStr}" required />
                </div>
              </div>

              <!-- Working days counter preview -->
              <div class="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 flex items-center justify-between text-xs font-bold text-indigo-950">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-indigo-600 text-[18px]">calendar_month</span>
                  <span>Wyliczone dni robocze:</span>
                </div>
                <span id="leave-days-badge" class="font-mono text-sm bg-indigo-600 text-white px-2 py-0.5 rounded">1 dzień</span>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Uwagi / Cel urlopu (opcjonalnie)</label>
                <textarea id="leave-notes" rows="2" placeholder="np. Wyjazd rodzinny, sprawa urzędowa..." class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"></textarea>
              </div>

              <!-- Options for notifications -->
              <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="chk-send-email" class="rounded text-indigo-600" checked />
                  <span>Otwórz powiadomienie e-mail do Zarządu (p.peret, m.klimkowski)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="chk-send-odoo" class="rounded text-indigo-600" checked />
                  <span>Wyślij powiadomienie na czat Odoo (#Wszystko)</span>
                </label>
              </div>

              <div class="flex gap-2 pt-2 border-t border-slate-200">
                <button type="button" id="btn-cancel-leave" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg transition-colors">
                  ANULUJ
                </button>
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-md flex items-center justify-center gap-1 transition-transform active:scale-95">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  <span>ZAPISZ WNIOSEK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL: DODAJ NOWEGO PRACOWNIKA
           ═════════════════════════════════════════════════════════════════════ -->
      ${showNewEmployeeModal ? `
        <div id="employee-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3">
            <div class="flex justify-between items-center border-b border-slate-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-slate-800 text-2xl">person_add</span>
                <h2 class="font-bold text-slate-900 text-base">Dodaj Pracownika</h2>
              </div>
              <button id="close-emp-modal-btn" class="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="new-employee-form" class="flex flex-col gap-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Imię i Nazwisko *</label>
                <input type="text" id="emp-name" placeholder="np. Jan Kowalski" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900" required />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Stanowisko / Rola *</label>
                <input type="text" id="emp-position" placeholder="np. Frezer CNC / Tokarz" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900" required />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input type="email" id="emp-email" placeholder="jan@bluemake.eu" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Telefon</label>
                  <input type="tel" id="emp-phone" placeholder="+48 ..." class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Roczny wymiar urlopu (dni) *</label>
                <input type="number" id="emp-limit" value="26" min="1" max="50" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900" required />
              </div>

              <div class="flex gap-2 pt-2 border-t border-slate-200">
                <button type="button" id="btn-cancel-emp" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg transition-colors">
                  ANULUJ
                </button>
                <button type="submit" class="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-lg shadow-md transition-transform active:scale-95">
                  DODAJ
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    `;

    attachEvents();
  }

  function attachEvents() {
    // Navigation back
    container.querySelector('#btn-back')?.addEventListener('click', () => navigateTo('dashboard'));

    // Close Banner
    container.querySelector('#btn-close-banner')?.addEventListener('click', () => {
      statusBanner = null;
      renderUI();
    });

    // Modals triggers
    container.querySelector('#btn-open-leave-modal')?.addEventListener('click', () => {
      showNewLeaveModal = true;
      renderUI();
    });

    container.querySelector('#btn-open-employee-modal')?.addEventListener('click', () => {
      showNewEmployeeModal = true;
      renderUI();
    });

    container.querySelector('#close-leave-modal-btn')?.addEventListener('click', () => {
      showNewLeaveModal = false;
      renderUI();
    });

    container.querySelector('#btn-cancel-leave')?.addEventListener('click', () => {
      showNewLeaveModal = false;
      renderUI();
    });

    container.querySelector('#close-emp-modal-btn')?.addEventListener('click', () => {
      showNewEmployeeModal = false;
      renderUI();
    });

    container.querySelector('#btn-cancel-emp')?.addEventListener('click', () => {
      showNewEmployeeModal = false;
      renderUI();
    });

    // Quick leave request from employee card
    container.querySelectorAll('.btn-quick-leave').forEach(btn => {
      btn.addEventListener('click', () => {
        const empId = btn.getAttribute('data-id');
        showNewLeaveModal = true;
        renderUI();
        const select = container.querySelector('#leave-emp-select');
        if (select) select.value = empId;
      });
    });

    // Delete employee
    container.querySelectorAll('.btn-del-emp').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Czy na pewno chcesz usunąć tego pracownika z listy?')) {
          deleteEmployee(id);
          statusBanner = { type: 'success', msg: 'Usunięto pracownika z listy.' };
          renderUI();
        }
      });
    });

    // Filters change
    container.querySelector('#filter-emp-select')?.addEventListener('change', (e) => {
      filterEmployee = e.target.value;
      renderUI();
    });

    container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderUI();
    });

    // Leave days calculation inside modal
    const startInput = container.querySelector('#leave-start-date');
    const endInput = container.querySelector('#leave-end-date');
    const daysBadge = container.querySelector('#leave-days-badge');

    const updateCalcDays = () => {
      if (startInput && endInput && daysBadge) {
        const count = calculateWorkingDays(startInput.value, endInput.value);
        daysBadge.textContent = `${count} ${count === 1 ? 'dzień roboczy' : (count < 5 ? 'dni robocze' : 'dni roboczych')}`;
      }
    };

    if (startInput && endInput) {
      startInput.addEventListener('change', () => {
        if (endInput.value < startInput.value) endInput.value = startInput.value;
        updateCalcDays();
      });
      endInput.addEventListener('change', updateCalcDays);
    }

    // Submit Leave Form
    const leaveForm = container.querySelector('#leave-request-form');
    if (leaveForm) {
      leaveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empSelect = container.querySelector('#leave-emp-select');
        const empId = empSelect.value;
        const empName = empSelect.options[empSelect.selectedIndex].getAttribute('data-name') || empSelect.options[empSelect.selectedIndex].text;
        const leaveType = container.querySelector('#leave-type-select').value;
        const startDate = container.querySelector('#leave-start-date').value;
        const endDate = container.querySelector('#leave-end-date').value;
        const notes = container.querySelector('#leave-notes').value.trim();
        const shouldSendEmail = container.querySelector('#chk-send-email')?.checked;
        const shouldSendOdoo = container.querySelector('#chk-send-odoo')?.checked;

        const newReq = saveLeaveRequest({
          employeeId: empId,
          employeeName: empName,
          leaveType,
          startDate,
          endDate,
          notes,
          submittedBy: currentOp ? currentOp.name : 'Operator',
          status: isOpAdmin ? 'APPROVED' : 'PENDING'
        });

        showNewLeaveModal = false;

        // Odoo chat alert
        if (shouldSendOdoo) {
          sendLeaveNotificationToOdoo(newReq).catch(() => {});
        }

        // Email mailto trigger
        if (shouldSendEmail) {
          const mailtoUrl = buildLeaveMailtoUrl(newReq);
          window.open(mailtoUrl, '_blank');
        }

        statusBanner = { 
          type: 'success', 
          msg: `Zapisano wniosek urlopowy dla ${empName} (${newReq.daysCount} dni: ${startDate} - ${endDate})! ${shouldSendOdoo ? 'Wysłano powiadomienie do Odoo.' : ''}` 
        };
        renderUI();
      });
    }

    // Submit New Employee Form
    const empForm = container.querySelector('#new-employee-form');
    if (empForm) {
      empForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#emp-name').value.trim();
        const position = container.querySelector('#emp-position').value.trim();
        const email = container.querySelector('#emp-email').value.trim();
        const phone = container.querySelector('#emp-phone').value.trim();
        const limit = parseInt(container.querySelector('#emp-limit').value, 10) || 26;

        saveEmployee({
          name,
          shortName: name.split(' ')[0],
          role: 'OPERATOR',
          position,
          email: email || `${name.toLowerCase().replace(/\s+/g, '')}@bluemake.eu`,
          phone,
          annualLeaveLimit: limit,
          avatar: 'person'
        });

        showNewEmployeeModal = false;
        statusBanner = { type: 'success', msg: `Dodano nowego pracownika: ${name}.` };
        renderUI();
      });
    }

    // Odoo Send Button on Table Row
    container.querySelectorAll('.btn-send-odoo').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const req = getLeaveRequests().find(r => r.id === id);
        if (req) {
          btn.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">sync</span>';
          const res = await sendLeaveNotificationToOdoo(req);
          if (res.success) {
            statusBanner = { type: 'success', msg: `Wysłano powiadomienie o urlopie ${req.employeeName} do Odoo (#Wszystko)!` };
          } else {
            statusBanner = { type: 'error', msg: `Błąd wysyłania do Odoo: ${res.error}` };
          }
          renderUI();
        }
      });
    });

    // Approve / Reject actions
    container.querySelectorAll('.btn-approve-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        updateLeaveRequestStatus(id, 'APPROVED', currentOp ? currentOp.name : 'Admin');
        statusBanner = { type: 'success', msg: 'Zatwierdzono wniosek urlopowy.' };
        renderUI();
      });
    });

    container.querySelectorAll('.btn-reject-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        updateLeaveRequestStatus(id, 'REJECTED', currentOp ? currentOp.name : 'Admin');
        statusBanner = { type: 'success', msg: 'Odrzucono wniosek urlopowy.' };
        renderUI();
      });
    });

    // Delete request
    container.querySelectorAll('.btn-del-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Czy na pewno chcesz usunąć ten wniosek urlopowy?')) {
          deleteLeaveRequest(id);
          statusBanner = { type: 'success', msg: 'Usunięto wniosek urlopowy.' };
          renderUI();
        }
      });
    });
  }

  renderUI();
}
