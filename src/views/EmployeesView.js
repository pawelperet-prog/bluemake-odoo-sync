import { 
  getEmployees, 
  saveEmployee, 
  deleteEmployee, 
  syncEmployeesFromOdoo,
  adjustEmployeeLeave,
  addEmployeeComment,
  updateEmployeeQuickNotes,
  getLeaveRequests, 
  saveLeaveRequest, 
  updateLeaveRequestStatus, 
  deleteLeaveRequest, 
  getEmployeeLeaveStats, 
  calculateWorkingDays, 
  buildLeaveMailtoUrl, 
  sendLeaveNotificationToOdoo, 
  getBhpAndMedicalStatus,
  getAllBhpAlerts,
  buildMedicalExamAlertMailto,
  sendMedicalExamAlertToOdoo,
  getEmployeeHistory,
  LEAVE_TYPES 
} from '../services/employeeService.js';
import { getCurrentOperator, isAdmin } from '../services/authService.js';

export function renderEmployeesView(container, navigateTo) {
  const currentOp = getCurrentOperator();
  const isOpAdmin = isAdmin();

  // Active Tab: 'LEAVES' | 'BHP' | 'CARDS' | 'HISTORY'
  let activeTab = 'LEAVES';
  let filterEmployee = 'ALL';
  let filterStatus = 'ALL';

  // Modals state
  let showNewLeaveModal = false;
  let showNewEmployeeModal = false;
  let showAdjustLeaveModal = false;
  let selectedEmployeeDetail = null; // When set, opens full detail & comments modal
  let editingEmployee = null; // if set, open edit form modal
  let adjustingEmployee = null; // if set, open adjust leave modal
  let isSyncingOdoo = false;
  let statusBanner = null;

  function renderUI() {
    const employees = getEmployees();
    const allRequests = getLeaveRequests();
    const historyLogs = getEmployeeHistory();
    const bhpAlerts = getAllBhpAlerts();
    const todayStr = new Date().toISOString().split('T')[0];

    // Refresh selected employee reference if open
    if (selectedEmployeeDetail) {
      selectedEmployeeDetail = employees.find(e => e.id === selectedEmployeeDetail.id) || selectedEmployeeDetail;
    }

    // Filter requests
    const filteredRequests = allRequests.filter(r => {
      if (filterEmployee !== 'ALL' && r.employeeId !== filterEmployee) return false;
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      return true;
    });

    container.innerHTML = `
      <!-- Top Header -->
      <header class="fixed top-0 left-0 w-full z-50 bg-slate-900 border-b border-slate-800 h-14 flex justify-between items-center px-4 sm:px-6 select-none shadow-lg">
        <div class="flex items-center gap-3">
          <button id="btn-back" class="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full p-2 transition-transform active:scale-95 flex items-center justify-center" title="Wróć do Magazynu">
            <span class="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <span class="material-symbols-outlined text-xl">badge</span>
            </div>
            <div>
              <h1 class="font-black text-white tracking-tight text-sm sm:text-base">Kadry, Urlopy & BHP Bluemake</h1>
              <p class="text-[10px] text-slate-400 hidden sm:block">Zarządzanie zespołem, badania medycyny pracy, szkolenia BHP & Odoo</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Sync with Odoo -->
          <button id="btn-sync-odoo" class="bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-600/50 font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-sm" title="Pobierz i zsynchronizuj pracowników i urlopy z Odoo 19">
            <span class="material-symbols-outlined text-[16px] ${isSyncingOdoo ? 'animate-spin' : ''}">sync</span>
            <span class="hidden sm:inline">${isSyncingOdoo ? 'Pobieranie...' : 'Pobierz z Odoo'}</span>
          </button>

          <!-- New Leave Request -->
          <button id="btn-open-leave-modal" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95">
            <span class="material-symbols-outlined text-[16px]">beach_access</span>
            <span class="hidden sm:inline">NOWY WNIOSEK</span>
            <span class="sm:hidden">URLOP</span>
          </button>

          <!-- Add Employee -->
          <button id="btn-open-employee-modal" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95">
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            <span class="hidden md:inline">DODAJ PRACOWNIKA</span>
          </button>
        </div>
      </header>

      <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 mt-14 mb-20">
        
        <!-- Status Toast Banner -->
        ${statusBanner ? `
          <div class="p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            statusBanner.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700' : 'bg-rose-950/80 text-rose-200 border border-rose-700'
          }">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-lg">${statusBanner.type === 'success' ? 'check_circle' : 'error'}</span>
              <span>${statusBanner.msg}</span>
            </div>
            <button id="btn-close-banner" class="text-slate-400 hover:text-white p-1">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ` : ''}

        <!-- BHP & Medical Exams Warning Alert (if any issues) -->
        ${bhpAlerts.length > 0 ? `
          <div class="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-2xl">health_and_safety</span>
              </div>
              <div>
                <h3 class="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Ważne terminy BHP & Medycyny Pracy</span>
                  <span class="bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px]">${bhpAlerts.length}</span>
                </h3>
                <div class="text-[11px] text-amber-200/90 mt-0.5 space-y-0.5">
                  ${bhpAlerts.slice(0, 3).map(a => `
                    <div class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-[13px] ${a.severity === 'DANGER' ? 'text-rose-400' : 'text-amber-400'}">
                        ${a.severity === 'DANGER' ? 'cancel' : 'warning'}
                      </span>
                      <strong>${a.empName}:</strong> <span>${a.msg}</span>
                    </div>
                  `).join('')}
                  ${bhpAlerts.length > 3 ? `<div class="italic text-[10px] text-amber-300">...oraz ${bhpAlerts.length - 3} inne zgłoszenia</div>` : ''}
                </div>
              </div>
            </div>
            <button type="button" id="btn-switch-to-bhp" class="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 self-end sm:self-center transition-all shadow-sm">
              <span>ZOBACZ BHP</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        ` : ''}

        <!-- Tab Selector Navigation -->
        <div class="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 gap-1 overflow-x-auto select-none shadow-sm">
          <button id="tab-btn-leaves" type="button" class="tab-nav-btn flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'LEAVES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}">
            <span class="material-symbols-outlined text-[18px]">beach_access</span>
            <span>1. Urlopy & Wnioski</span>
          </button>
          <button id="tab-btn-bhp" type="button" class="tab-nav-btn flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'BHP' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}">
            <span class="material-symbols-outlined text-[18px]">health_and_safety</span>
            <span>2. Badania & BHP</span>
            ${bhpAlerts.length > 0 ? `<span class="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">${bhpAlerts.length}</span>` : ''}
          </button>
          <button id="tab-btn-cards" type="button" class="tab-nav-btn flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'CARDS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}">
            <span class="material-symbols-outlined text-[18px]">groups</span>
            <span>3. Karty & Komentarze</span>
          </button>
          <button id="tab-btn-history" type="button" class="tab-nav-btn flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}">
            <span class="material-symbols-outlined text-[18px]">history</span>
            <span>4. Historia Zmian</span>
            <span class="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.2 rounded-full font-mono">${historyLogs.length}</span>
          </button>
        </div>

        <!-- ═════════════════════════════════════════════════════════════════════
             TAB 1: URLOPY & WNIOSKI
             ═════════════════════════════════════════════════════════════════════ -->
        ${activeTab === 'LEAVES' ? `
          <!-- Employee Leave Cards Grid -->
          <div>
            <div class="flex justify-between items-center mb-2 px-1">
              <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-indigo-400">calendar_month</span>
                <span>Bilans Dni Urlopowych 2026 (Kliknij w pracownika aby wejść w profil)</span>
              </h2>
              <span class="text-[11px] text-slate-500">Zalogowany: <strong>${currentOp ? currentOp.name : 'Operator'}</strong></span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              ${employees.map(emp => {
                const stats = getEmployeeLeaveStats(emp.id);
                const onLeaveNow = allRequests.some(r => 
                  r.employeeId === emp.id && 
                  r.status === 'APPROVED' && 
                  r.startDate <= todayStr && 
                  r.endDate >= todayStr
                );

                return `
                  <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col justify-between hover:border-indigo-500/60 transition-all cursor-pointer card-click-employee" data-id="${emp.id}">
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2.5">
                          <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold shadow-inner">
                            <span class="material-symbols-outlined text-2xl">${emp.avatar || 'person'}</span>
                          </div>
                          <div>
                            <div class="font-bold text-white text-sm hover:text-indigo-300 transition-colors">${emp.name}</div>
                            <div class="text-[11px] text-slate-400 truncate max-w-[140px]">${emp.position || 'Pracownik'}</div>
                          </div>
                        </div>
                        <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          onLeaveNow 
                            ? 'bg-amber-950 text-amber-300 border border-amber-700' 
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }">
                          ${onLeaveNow ? '🏖️ URLOP' : '🟢 W PRACY'}
                        </span>
                      </div>

                      <!-- Leave Stats Meter -->
                      <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1.5 text-xs">
                        <div class="flex justify-between text-slate-400">
                          <span>Pula roczna:</span>
                          <strong class="text-slate-200 font-mono">${stats.limit} dni</strong>
                        </div>
                        <div class="flex justify-between text-slate-400">
                          <span>Wykorzystane urlopy:</span>
                          <strong class="text-amber-400 font-mono">${stats.usedVacationDays} dni</strong>
                        </div>
                        <div class="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800">
                          <span>Pozostało do wykorzystania:</span>
                          <span class="font-mono text-sm bg-emerald-950 px-2 py-0.2 rounded border border-emerald-800">${stats.remainingDays} dni</span>
                        </div>
                      </div>

                      ${emp.notes ? `
                        <div class="text-[11px] text-slate-400 italic truncate mb-2" title="${emp.notes}">
                          💬 ${emp.notes}
                        </div>
                      ` : ''}
                    </div>

                    <!-- Actions on Card -->
                    <div class="flex items-center gap-1.5 pt-2 border-t border-slate-800" onclick="event.stopPropagation();">
                      <button type="button" class="btn-quick-leave flex-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white font-bold text-[11px] py-1.5 rounded-lg border border-indigo-500/40 flex items-center justify-center gap-1 transition-colors" data-id="${emp.id}">
                        <span class="material-symbols-outlined text-[14px]">beach_access</span>
                        <span>Zgłoś urlop</span>
                      </button>
                      
                      <button type="button" class="btn-open-adjust-modal bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[11px] px-2 py-1.5 rounded-lg border border-slate-700 transition-colors" data-id="${emp.id}" title="Zmień / Dodaj / Odejmij dni urlopowe">
                        <span>± Korekta</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Leave Requests Register Table -->
          <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-400">event_note</span>
                <h2 class="font-bold text-white text-sm sm:text-base">Rejestr Wniosków Urlopowych i Nieobecności</h2>
                <span class="bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full font-mono">${filteredRequests.length}</span>
              </div>

              <!-- Filter controls -->
              <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <select id="filter-emp-select" class="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold px-2.5 py-1.5 focus:outline-none focus:border-indigo-500">
                  <option value="ALL" ${filterEmployee === 'ALL' ? 'selected' : ''}>Wszyscy pracownicy</option>
                  ${employees.map(e => `
                    <option value="${e.id}" ${filterEmployee === e.id ? 'selected' : ''}>${e.name}</option>
                  `).join('')}
                </select>

                <select id="filter-status-select" class="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold px-2.5 py-1.5 focus:outline-none focus:border-indigo-500">
                  <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>Wszystkie statusy</option>
                  <option value="APPROVED" ${filterStatus === 'APPROVED' ? 'selected' : ''}>✅ Zatwierdzone</option>
                  <option value="PENDING" ${filterStatus === 'PENDING' ? 'selected' : ''}>⏳ Oczekujące</option>
                  <option value="REJECTED" ${filterStatus === 'REJECTED' ? 'selected' : ''}>❌ Odrzucone</option>
                </select>
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                    <th class="py-2.5 px-3">Pracownik</th>
                    <th class="py-2.5 px-3">Typ urlopu</th>
                    <th class="py-2.5 px-3 text-center">Termin nieobecności</th>
                    <th class="py-2.5 px-3 text-center">Dni robocze</th>
                    <th class="py-2.5 px-3 text-center">Status</th>
                    <th class="py-2.5 px-3">Uwagi / Cel</th>
                    <th class="py-2.5 px-3 text-right">Powiadomienia & Akcje</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-medium">
                  ${filteredRequests.length === 0 ? `
                    <tr>
                      <td colspan="7" class="py-8 text-center text-slate-500 font-medium">
                        Brak zarejestrowanych wniosków urlopowych dla wybranych filtrów.
                      </td>
                    </tr>
                  ` : filteredRequests.map(r => {
                    const typeObj = LEAVE_TYPES.find(t => t.id === r.leaveType) || { label: r.leaveType, color: 'bg-slate-800 text-slate-300 border-slate-700', icon: 'event' };
                    const mailtoLink = buildLeaveMailtoUrl(r);

                    return `
                      <tr class="hover:bg-slate-800/40 transition-colors">
                        <td class="py-3 px-3 font-bold text-white">
                          <div class="flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[17px] text-slate-400">person</span>
                            <span>${r.employeeName}</span>
                          </div>
                        </td>
                        <td class="py-3 px-3">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${typeObj.color}">
                            <span class="material-symbols-outlined text-[13px]">${typeObj.icon}</span>
                            <span>${typeObj.label}</span>
                          </span>
                        </td>
                        <td class="py-3 px-3 text-center font-mono text-slate-200">
                          ${r.startDate} <span class="text-slate-500">→</span> ${r.endDate}
                        </td>
                        <td class="py-3 px-3 text-center font-mono font-black text-indigo-400 text-sm">
                          ${r.daysCount} dni
                        </td>
                        <td class="py-3 px-3 text-center">
                          ${r.status === 'APPROVED' ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <span class="material-symbols-outlined text-[13px]">check_circle</span> Zatwierdzony
                            </span>
                          ` : (r.status === 'REJECTED' ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              <span class="material-symbols-outlined text-[13px]">cancel</span> Odrzucony
                            </span>
                          ` : `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              <span class="material-symbols-outlined text-[13px]">hourglass_top</span> Oczekuje
                            </span>
                          `)}
                        </td>
                        <td class="py-3 px-3 text-slate-400 max-w-[180px] truncate" title="${r.notes || ''}">
                          ${r.notes || '<span class="text-slate-600 italic">Brak uwag</span>'}
                        </td>
                        <td class="py-3 px-3 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <a href="${mailtoLink}" class="bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors" title="Wyślij e-mail do Zarządu">
                              <span class="material-symbols-outlined text-[15px]">mail</span>
                              <span class="hidden sm:inline">E-mail</span>
                            </a>

                            <button type="button" class="btn-send-odoo bg-purple-950/60 hover:bg-purple-900 text-purple-300 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-purple-800 transition-colors" data-id="${r.id}" title="Wyślij powiadomienie do Odoo (#Wszystko)">
                              <span class="material-symbols-outlined text-[15px]">forum</span>
                              <span class="hidden sm:inline">Odoo</span>
                            </button>

                            ${isOpAdmin && r.status === 'PENDING' ? `
                              <button type="button" class="btn-approve-req bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-lg transition-colors shadow-sm" data-id="${r.id}" title="Zatwierdź wniosek">
                                <span class="material-symbols-outlined text-[16px]">done</span>
                              </button>
                              <button type="button" class="btn-reject-req bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-lg transition-colors shadow-sm" data-id="${r.id}" title="Odrzuć wniosek">
                                <span class="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            ` : ''}

                            <button type="button" class="btn-del-req text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors" data-id="${r.id}" title="Usuń wniosek">
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
        ` : ''}

        <!-- ═════════════════════════════════════════════════════════════════════
             TAB 2: BADANIA OKRESOWE & BHP & UPRAWNIENIA
             ═════════════════════════════════════════════ -->
        ${activeTab === 'BHP' ? `
          <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col gap-4">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-400">health_and_safety</span>
                <div>
                  <h2 class="font-bold text-white text-base">Ewidencja Badań Lekarskich, Szkoleń BHP & Uprawnień</h2>
                  <p class="text-[11px] text-slate-400">Powiadomienia e-mail o badaniach kierowane do: <strong>m.klimkowski@bluemake.eu</strong></p>
                </div>
              </div>
              <span class="text-xs text-slate-400">Pracownicy: <strong>${employees.length}</strong></span>
            </div>

            <!-- Comprehensive BHP Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                    <th class="py-2.5 px-3">Pracownik / Stanowisko</th>
                    <th class="py-2.5 px-3 text-center">Badania Medycyny Pracy</th>
                    <th class="py-2.5 px-3 text-center">Szkolenie BHP</th>
                    <th class="py-2.5 px-3">Uprawnienia UDT / Maszyny</th>
                    <th class="py-2.5 px-3 text-center">Odzież Robocza</th>
                    <th class="py-2.5 px-3 text-right">Powiadomienia & Akcje</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-medium">
                  ${employees.map(emp => {
                    const status = getBhpAndMedicalStatus(emp);
                    const mailtoBhp = buildMedicalExamAlertMailto(emp);

                    return `
                      <tr class="hover:bg-slate-800/40 transition-colors">
                        <td class="py-3 px-3">
                          <div class="font-bold text-white text-sm cursor-pointer hover:text-indigo-400 transition-colors card-click-employee" data-id="${emp.id}">${emp.name}</div>
                          <div class="text-[11px] text-slate-400">${emp.position || 'Pracownik'}</div>
                          <div class="text-[10px] text-indigo-400">${emp.assignedMachine || emp.department || 'Produkcja CNC'}</div>
                        </td>

                        <!-- Medycyna Pracy -->
                        <td class="py-3 px-3 text-center">
                          ${emp.medicalExamValidUntil ? `
                            <div class="inline-flex flex-col items-center">
                              <span class="font-mono font-bold ${
                                status.medicalStatus === 'EXPIRED' ? 'text-rose-400 font-black' : (status.medicalStatus === 'EXPIRING' ? 'text-amber-400' : 'text-emerald-400')
                              }">
                                ${emp.medicalExamValidUntil}
                              </span>
                              <span class="text-[9px] px-2 py-0.2 rounded-full font-bold mt-0.5 ${
                                status.medicalStatus === 'EXPIRED' ? 'bg-rose-950 text-rose-300 border border-rose-800' : (status.medicalStatus === 'EXPIRING' ? `bg-amber-950 text-amber-300 border border-amber-800` : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
                              }">
                                ${status.medicalStatus === 'EXPIRED' ? '⛔ PRZETERMINOWANE' : (status.medicalStatus === 'EXPIRING' ? `⚠️ Wygasa (${status.medicalDaysLeft}d)` : '🟢 Ważne')}
                              </span>
                              ${emp.medicalExamNotes ? `<span class="text-[9px] text-slate-400 max-w-[120px] truncate mt-0.5" title="${emp.medicalExamNotes}">${emp.medicalExamNotes}</span>` : ''}
                            </div>
                          ` : `
                            <span class="text-slate-500 italic text-[11px]">Brak danych</span>
                          `}
                        </td>

                        <!-- Szkolenie BHP -->
                        <td class="py-3 px-3 text-center">
                          ${emp.safetyTrainingValidUntil ? `
                            <div class="inline-flex flex-col items-center">
                              <span class="font-mono font-bold ${
                                status.safetyStatus === 'EXPIRED' ? 'text-rose-400 font-black' : (status.safetyStatus === 'EXPIRING' ? 'text-amber-400' : 'text-emerald-400')
                              }">
                                ${emp.safetyTrainingValidUntil}
                              </span>
                              <span class="text-[9px] px-2 py-0.2 rounded-full font-bold mt-0.5 ${
                                status.safetyStatus === 'EXPIRED' ? 'bg-rose-950 text-rose-300 border border-rose-800' : (status.safetyStatus === 'EXPIRING' ? `bg-amber-950 text-amber-300 border border-amber-800` : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
                              }">
                                ${status.safetyStatus === 'EXPIRED' ? '⛔ PRZETERMINOWANE' : (status.safetyStatus === 'EXPIRING' ? `⚠️ Wygasa (${status.safetyDaysLeft}d)` : '🟢 Ważne')}
                              </span>
                            </div>
                          ` : `
                            <span class="text-slate-500 italic text-[11px]">Brak danych</span>
                          `}
                        </td>

                        <!-- Uprawnienia -->
                        <td class="py-3 px-3 text-xs">
                          <div class="space-y-0.5">
                            ${emp.forkliftLicense ? `<div class="text-emerald-300 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">forklift</span><span>${emp.forkliftLicense}</span></div>` : ''}
                            ${emp.craneLicense ? `<div class="text-blue-300 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">precision_manufacturing</span><span>${emp.craneLicense}</span></div>` : ''}
                            ${emp.sepLicense ? `<div class="text-amber-300 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">bolt</span><span>${emp.sepLicense}</span></div>` : ''}
                            ${!emp.forkliftLicense && !emp.craneLicense && !emp.sepLicense ? `<span class="text-slate-500 italic">Brak wpisanych uprawnień</span>` : ''}
                          </div>
                        </td>

                        <!-- Odzież i Buty -->
                        <td class="py-3 px-3 text-center text-xs">
                          <div class="font-mono">
                            <div>Ubranie: <strong class="text-white">${emp.clothesSize || '-'}</strong></div>
                            <div>Buty: <strong class="text-white">${emp.shoesSize || '-'}</strong></div>
                          </div>
                        </td>

                        <!-- Actions (Send Mail to Mateusz & Edit) -->
                        <td class="py-3 px-3 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <a href="${mailtoBhp}" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors" title="Wyślij e-mail o badaniach do Mateusza (m.klimkowski@bluemake.eu)">
                              <span class="material-symbols-outlined text-[15px]">outgoing_mail</span>
                              <span class="hidden md:inline">Mail do Mateusza</span>
                            </a>

                            <button type="button" class="btn-card-details bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1" data-id="${emp.id}" title="Wejdź w pełną kartę pracownika">
                              <span class="material-symbols-outlined text-[15px]">open_in_new</span>
                              <span>Karta</span>
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
        ` : ''}

        <!-- ═════════════════════════════════════════════════════════════════════
             TAB 3: KARTY PRACOWNIKÓW & KOMENTARZE
             ═════════════════════════════════════════════════════════════════════ -->
        ${activeTab === 'CARDS' ? `
          <div>
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-indigo-400">groups</span>
                <span>Karty Pracowników & Podpięte Komentarze (${employees.length})</span>
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${employees.map(emp => {
                const stats = getEmployeeLeaveStats(emp.id);
                const bhp = getBhpAndMedicalStatus(emp);
                const isUserAdmin = emp.role === 'ADMIN';
                const commentsCount = Array.isArray(emp.commentsList) ? emp.commentsList.length : 0;

                return `
                  <div class="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between gap-4 hover:border-indigo-500/60 transition-all cursor-pointer card-click-employee" data-id="${emp.id}">
                    <div>
                      <!-- Header Card -->
                      <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-14 h-14 rounded-2xl ${isUserAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'} flex items-center justify-center shadow-md">
                            <span class="material-symbols-outlined text-3xl">${emp.avatar || 'person'}</span>
                          </div>
                          <div>
                            <h3 class="font-black text-lg text-white hover:text-indigo-300 transition-colors">${emp.name}</h3>
                            <div class="text-xs font-bold text-slate-300">${emp.position || 'Pracownik'}</div>
                            <div class="text-[11px] text-indigo-400 font-medium">${emp.assignedMachine || emp.department || 'Produkcja CNC'}</div>
                          </div>
                        </div>

                        <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isUserAdmin ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                          ${isUserAdmin ? '👑 ZARZĄD' : '📦 OPERATOR'}
                        </span>
                      </div>

                      <!-- Key Info Grid -->
                      <div class="grid grid-cols-2 gap-2 my-3 text-xs">
                        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          <span class="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Urlop 2026:</span>
                          <div class="text-emerald-400 font-bold font-mono">Pozostało: ${stats.remainingDays} dni</div>
                          <div class="text-slate-400 text-[11px]">Wykorzystano: ${stats.usedVacationDays}d / ${stats.limit}d</div>
                        </div>

                        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          <span class="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Badania Okresowe:</span>
                          <div class="font-mono font-bold ${bhp.medicalStatus === 'EXPIRED' ? 'text-rose-400' : (bhp.medicalStatus === 'EXPIRING' ? 'text-amber-400' : 'text-slate-200')}">
                            ${emp.medicalExamValidUntil || 'Brak daty'}
                          </div>
                          <div class="text-[10px] text-slate-400">${emp.medicalExamNotes || 'Zdolny do pracy'}</div>
                        </div>
                      </div>

                      <!-- Notes / Comments Snippet -->
                      <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
                        <div class="flex justify-between items-center text-[10.5px] font-bold text-slate-400">
                          <span class="flex items-center gap-1 text-indigo-300">
                            <span class="material-symbols-outlined text-[14px]">chat</span>
                            <span>Podpięte Komentarze (${commentsCount})</span>
                          </span>
                          <span class="text-slate-500 font-normal">Kliknij kartę aby otworzyć</span>
                        </div>
                        <p class="text-[11.5px] text-slate-300 line-clamp-2 italic">
                          ${emp.notes || (commentsCount > 0 ? emp.commentsList[0].text : 'Brak przypisanych notatek. Kliknij, aby dodać komentarz...')}
                        </p>
                      </div>
                    </div>

                    <!-- Bottom Action Buttons -->
                    <div class="flex items-center gap-2 pt-2 border-t border-slate-800" onclick="event.stopPropagation();">
                      <button type="button" class="btn-card-details flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors" data-id="${emp.id}">
                        <span class="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Otwórz Profil & Komentarze</span>
                      </button>

                      <button type="button" class="btn-edit-emp-profile bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs p-2 rounded-xl border border-slate-700 transition-colors" data-id="${emp.id}" title="Edytuj dane & BHP">
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      <button type="button" class="btn-open-adjust-modal bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs p-2 rounded-xl border border-slate-700 transition-colors" data-id="${emp.id}" title="Korekta urlopu">
                        <span class="material-symbols-outlined text-[16px]">tune</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ═════════════════════════════════════════════════════════════════════
             TAB 4: HISTORIA ZMIAN & AUDYT (KTO ZMIENIŁ CO)
             ═════════════════════════════════════════════════════════════════════ -->
        ${activeTab === 'HISTORY' ? `
          <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col gap-3">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-400">history</span>
                <h2 class="font-bold text-white text-base">Dziennik Audytu Zmian Kadrowych, Komentarzy & Urlopowych</h2>
              </div>
              <span class="text-xs text-slate-400">Zarejestrowane zdarzenia: <strong>${historyLogs.length}</strong></span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                    <th class="py-2.5 px-3">Data i Czas</th>
                    <th class="py-2.5 px-3">Kto Zmienił (Operator)</th>
                    <th class="py-2.5 px-3">Pracownik</th>
                    <th class="py-2.5 px-3">Rodzaj Operacji</th>
                    <th class="py-2.5 px-3">Szczegóły / Powód</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-medium">
                  ${historyLogs.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-8 text-center text-slate-500 font-medium">
                        Brak zarejestrowanych operacji w historii.
                      </td>
                    </tr>
                  ` : historyLogs.map(log => `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        ${log.dateFormatted}
                      </td>
                      <td class="py-3 px-3 font-bold text-indigo-300">
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[16px] text-indigo-400">account_circle</span>
                          <span>${log.operator}</span>
                        </div>
                      </td>
                      <td class="py-3 px-3 font-bold text-white">
                        ${log.employeeName || '-'}
                      </td>
                      <td class="py-3 px-3">
                        <span class="inline-block px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-bold text-[11px] text-slate-200">
                          ${log.action}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-slate-300 max-w-md">
                        ${log.details}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

      </main>

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL 1: KARTA SZCZEGÓŁÓW PRACOWNIKA & KOMENTARZE
           ═════════════════════════════════════════════════════════════════════ -->
      ${selectedEmployeeDetail ? `
        <div id="detail-modal-backdrop" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 select-none">
          <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            <!-- Header Modal -->
            <div class="flex justify-between items-start border-b border-slate-800 pb-3">
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-lg">
                  <span class="material-symbols-outlined text-3xl">${selectedEmployeeDetail.avatar || 'person'}</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-black text-xl text-white">${selectedEmployeeDetail.name}</h3>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedEmployeeDetail.role === 'ADMIN' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                      ${selectedEmployeeDetail.role === 'ADMIN' ? '👑 ZARZĄD' : '📦 OPERATOR'}
                    </span>
                  </div>
                  <p class="text-xs text-indigo-300 font-bold">${selectedEmployeeDetail.position || 'Pracownik'} • <span class="text-slate-400 font-normal">${selectedEmployeeDetail.department || 'Produkcja CNC'}</span></p>
                  <p class="text-[11px] text-slate-400">Maszyna: <strong class="text-slate-200">${selectedEmployeeDetail.assignedMachine || 'Główny Park Maszynowy'}</strong></p>
                </div>
              </div>

              <button id="close-detail-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <!-- SECTION 1: BADANIA OKRESOWE & BHP WITH SEND MAIL BUTTON -->
            <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800/80 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-amber-400 text-xl">health_and_safety</span>
                  <h4 class="font-bold text-white text-sm">Badania Okresowe (Medycyna Pracy) & BHP</h4>
                </div>

                <!-- Send Alert Mail to Mateusz Button -->
                <div class="flex items-center gap-2">
                  <a href="${buildMedicalExamAlertMailto(selectedEmployeeDetail)}" class="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95" title="Wyślij powiadomienie e-mail o badaniach do m.klimkowski@bluemake.eu">
                    <span class="material-symbols-outlined text-[16px]">outgoing_mail</span>
                    <span>Wyślij Mail do Mateusza</span>
                  </a>
                  <button type="button" class="btn-send-med-odoo bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all" data-id="${selectedEmployeeDetail.id}" title="Wyślij alert do Odoo (#Wszystko)">
                    <span class="material-symbols-outlined text-[15px]">forum</span>
                    <span>Odoo</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span class="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Ważność Badań Lekarskich:</span>
                  <div class="font-mono font-bold text-sm ${getBhpAndMedicalStatus(selectedEmployeeDetail).medicalStatus === 'EXPIRED' ? 'text-rose-400' : 'text-emerald-400'}">
                    ${selectedEmployeeDetail.medicalExamValidUntil || 'Brak daty'}
                  </div>
                  <div class="text-[10.5px] text-slate-400 mt-0.5">${selectedEmployeeDetail.medicalExamNotes || 'Zdolny do pracy'}</div>
                </div>

                <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span class="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Szkolenie BHP:</span>
                  <div class="font-mono font-bold text-sm text-slate-200">
                    Ważne do: ${selectedEmployeeDetail.safetyTrainingValidUntil || 'Brak daty'}
                  </div>
                  <div class="text-[10.5px] text-indigo-300 mt-0.5">${selectedEmployeeDetail.forkliftLicense || selectedEmployeeDetail.craneLicense || 'BHP ogólne'}</div>
                </div>

                <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span class="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Odzież Robocza & ICE:</span>
                  <div class="font-mono text-slate-200">Rozmiar: <strong>${selectedEmployeeDetail.clothesSize || '-'}</strong> | Buty: <strong>${selectedEmployeeDetail.shoesSize || '-'}</strong></div>
                  <div class="text-[10.5px] text-amber-300 mt-0.5">${selectedEmployeeDetail.iceContact || 'Brak kontaktu ICE'}</div>
                </div>
              </div>
            </div>

            <!-- SECTION 2: KOMENTARZE & NOTATKI PODPIĘTE POD PRACOWNIKA -->
            <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div class="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-400 text-xl">chat</span>
                  <h4 class="font-bold text-white text-sm">Podpięte Komentarze & Notatki</h4>
                </div>
                <span class="text-xs text-slate-400">Wpisów: <strong>${Array.isArray(selectedEmployeeDetail.commentsList) ? selectedEmployeeDetail.commentsList.length : 0}</strong></span>
              </div>

              <!-- Quick Main Note Field -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-slate-400">Główna Notatka Kadrowo-Techniczna:</label>
                <div class="flex gap-2">
                  <input type="text" id="input-quick-note" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" value="${selectedEmployeeDetail.notes || ''}" placeholder="Wpisz stałą notatkę / ustalenia dla pracownika..." />
                  <button type="button" id="btn-save-quick-note" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md transition-all active:scale-95">
                    Zapisz
                  </button>
                </div>
              </div>

              <!-- Add New Comment Box -->
              <form id="form-add-comment" class="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
                <label class="text-[11px] font-bold text-slate-400">Dodaj nowy komentarz z datą i podpisem (${currentOp ? currentOp.name : 'Operator'}):</label>
                <div class="flex gap-2">
                  <input type="text" id="input-new-comment-text" placeholder="np. Zgłosił chęć urlopu w sierpniu, wydano nowe narzędzia..." class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" required />
                  <button type="submit" class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1 transition-all active:scale-95">
                    <span class="material-symbols-outlined text-[15px] text-indigo-400">send</span>
                    <span>Dodaj</span>
                  </button>
                </div>
              </form>

              <!-- Comments List Timeline -->
              <div class="flex flex-col gap-2 max-h-48 overflow-y-auto mt-1">
                ${Array.isArray(selectedEmployeeDetail.commentsList) && selectedEmployeeDetail.commentsList.length > 0 ? selectedEmployeeDetail.commentsList.map(c => `
                  <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs flex flex-col gap-1">
                    <div class="flex justify-between items-center text-[10.5px]">
                      <span class="font-bold text-indigo-300 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px]">person</span>
                        <span>${c.author || 'Operator'}</span>
                      </span>
                      <span class="font-mono text-slate-500">${c.dateFormatted}</span>
                    </div>
                    <p class="text-slate-200">${c.text}</p>
                  </div>
                `).join('') : `
                  <p class="text-xs text-slate-500 italic text-center py-2">Brak wpisów w historii komentarzy.</p>
                `}
              </div>
            </div>

            <!-- SECTION 3: URLOPY & BILANS -->
            <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-500 block">Bilans Urlopowy 2026:</span>
                <div class="text-emerald-400 font-bold text-sm font-mono">
                  Pozostało: ${getEmployeeLeaveStats(selectedEmployeeDetail.id).remainingDays} dni
                </div>
                <div class="text-slate-400 text-[11px]">
                  Pula roczna: ${getEmployeeLeaveStats(selectedEmployeeDetail.id).limit}d | Wykorzystano: ${getEmployeeLeaveStats(selectedEmployeeDetail.id).usedVacationDays}d
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button type="button" class="btn-quick-leave bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs px-3 py-2 rounded-xl border border-indigo-500/40 transition-colors" data-id="${selectedEmployeeDetail.id}">
                  Zgłoś urlop
                </button>
                <button type="button" class="btn-open-adjust-modal bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition-colors" data-id="${selectedEmployeeDetail.id}">
                  ± Korekta dni
                </button>
              </div>
            </div>

            <!-- Bottom Close & Edit Button -->
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" id="btn-edit-from-detail" class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors">
                <span class="material-symbols-outlined text-[16px] text-indigo-400">edit</span>
                <span>Edytuj Wszystkie Dane</span>
              </button>
              <button type="button" id="btn-close-detail" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-colors">
                Zamknij
              </button>
            </div>

          </div>
        </div>
      ` : ''}

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL 2: NOWY WNIOSEK URLOPOWY
           ═════════════════════════════════════════════════════════════════════ -->
      ${showNewLeaveModal ? `
        <div id="leave-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 select-none">
          <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-400 text-2xl">beach_access</span>
                <h3 class="font-bold text-white text-base">Nowe Zgłoszenie Urlopowe</h3>
              </div>
              <button id="close-leave-modal-btn" class="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form id="leave-request-form" class="flex flex-col gap-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Pracownik *</label>
                <select id="leave-emp-select" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 font-bold text-white focus:outline-none focus:border-indigo-500" required>
                  ${employees.map(e => `
                    <option value="${e.id}" data-name="${e.name}" ${currentOp && (currentOp.name === e.shortName || currentOp.name === e.name) ? 'selected' : ''}>${e.name} (${e.position})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Rodzaj nieobecności *</label>
                <select id="leave-type-select" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 font-bold text-white focus:outline-none focus:border-indigo-500" required>
                  ${LEAVE_TYPES.map(t => `
                    <option value="${t.id}">${t.label}</option>
                  `).join('')}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Data od (początek) *</label>
                  <input type="date" id="leave-start-date" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-white focus:outline-none focus:border-indigo-500" value="${todayStr}" required />
                </div>
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Data do (koniec) *</label>
                  <input type="date" id="leave-end-date" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-white focus:outline-none focus:border-indigo-500" value="${todayStr}" required />
                </div>
              </div>

              <div class="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800 flex items-center justify-between text-xs font-bold text-indigo-200">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-400 text-lg">calendar_month</span>
                  <span>Wyliczone dni robocze:</span>
                </div>
                <span id="leave-days-badge" class="font-mono text-sm bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg shadow-sm">1 dzień</span>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Uwagi / Cel urlopu (opcjonalnie)</label>
                <textarea id="leave-notes" rows="2" placeholder="np. Urlop wypoczynkowy, wyjazd..." class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"></textarea>
              </div>

              <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="chk-send-email" class="rounded text-indigo-600 bg-slate-800 border-slate-700" checked />
                  <span>Otwórz powiadomienie e-mail do Zarządu (p.peret, m.klimkowski)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="chk-send-odoo" class="rounded text-indigo-600 bg-slate-800 border-slate-700" checked />
                  <span>Wyślij powiadomienie na czat Odoo (#Wszystko)</span>
                </label>
              </div>

              <div class="flex gap-2 pt-2 border-t border-slate-800">
                <button type="button" id="btn-cancel-leave" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-colors">
                  ANULUJ
                </button>
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  <span>ZAPISZ WNIOSEK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL 3: RĘCZNA KOREKTA DNI URLOPOWYCH (± DNI)
           ═════════════════════════════════════════════════════════════════════ -->
      ${showAdjustLeaveModal && adjustingEmployee ? `
        <div id="adjust-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 select-none">
          <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-400 text-2xl">tune</span>
                <div>
                  <h3 class="font-bold text-white text-base">Korekta Dni Urlopowych</h3>
                  <p class="text-[11px] text-slate-400">Pracownik: <strong class="text-indigo-400">${adjustingEmployee.name}</strong></p>
                </div>
              </div>
              <button id="close-adjust-modal-btn" class="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form id="adjust-leave-form" class="flex flex-col gap-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Typ korekty *</label>
                <select id="adjust-type-select" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 font-bold text-white focus:outline-none focus:border-indigo-500" required>
                  <option value="ADJUSTMENT">Dodaj / Odejmij dni urlopowe (np. za nadgodziny/soboty)</option>
                  <option value="OVERDUE">Zmień zaległy urlop z poprzedniego roku</option>
                  <option value="LIMIT">Zmień roczny wymiar urlopu (np. 20 lub 26 dni)</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Wartość / Liczba dni *</label>
                <input type="number" id="adjust-days-input" placeholder="np. +2 lub -1 lub 26" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-indigo-500" value="1" required />
                <p class="text-[10px] text-slate-400 mt-1">Użyj wartości dodatniej (np. 2) aby dodać dni, lub ujemnej (np. -1) aby odjąć.</p>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Powód zmiany (widoczny w historii) *</label>
                <input type="text" id="adjust-reason-input" placeholder="np. Odbiór za pracę w sobotę, wyrównanie bilansu..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500" required />
              </div>

              <div class="flex gap-2 pt-2 border-t border-slate-800">
                <button type="button" id="btn-cancel-adjust" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-colors">
                  ANULUJ
                </button>
                <button type="submit" class="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">check</span>
                  <span>ZATWIERDŹ KOREKTĘ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- ═════════════════════════════════════════════════════════════════════
           MODAL 4: DODAJ LUB EDYTUJ PRACOWNIKA (DANE + BHP + URLOPY)
           ═════════════════════════════════════════════════════════════════════ -->
      ${showNewEmployeeModal ? `
        <div id="emp-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 select-none">
          <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-400 text-2xl">${editingEmployee ? 'edit_note' : 'person_add'}</span>
                <div>
                  <h3 class="font-bold text-white text-base">${editingEmployee ? `Edycja Danych: ${editingEmployee.name}` : 'Dodaj Nowego Pracownika'}</h3>
                  <p class="text-[11px] text-slate-400">Dane kontaktowe, wymiar urlopu, badania okresowe i szkolenia BHP</p>
                </div>
              </div>
              <button id="close-emp-modal-btn" class="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form id="employee-full-form" class="flex flex-col gap-4 text-xs">
              
              <!-- SECTION 1: DANE PODSTAWOWE -->
              <div>
                <h4 class="font-bold text-indigo-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">person</span>
                  <span>1. Dane Podstawowe & Kontakt</span>
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Imię i Nazwisko *</label>
                    <input type="text" id="f-emp-name" placeholder="np. Jan Kowalski" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-bold text-white" value="${editingEmployee?.name || ''}" required />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Stanowisko *</label>
                    <input type="text" id="f-emp-pos" placeholder="np. Operator CNC / Frezer" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" value="${editingEmployee?.position || ''}" required />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Przypisana Maszyna / Obszar</label>
                    <input type="text" id="f-emp-machine" placeholder="np. Tokarka Doosan Puma / Haas VF-4" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" value="${editingEmployee?.assignedMachine || 'Produkcja CNC'}" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Rola w systemie</label>
                    <select id="f-emp-role" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                      <option value="OPERATOR" ${editingEmployee?.role === 'OPERATOR' ? 'selected' : ''}>📦 Operator Magazynu / Produkcji</option>
                      <option value="ADMIN" ${editingEmployee?.role === 'ADMIN' ? 'selected' : ''}>👑 Administrator / Zarząd</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">E-mail</label>
                    <input type="email" id="f-emp-email" placeholder="jan@bluemake.eu" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" value="${editingEmployee?.email || ''}" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Telefon</label>
                    <input type="tel" id="f-emp-phone" placeholder="+48 ..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white" value="${editingEmployee?.phone || ''}" />
                  </div>
                </div>
              </div>

              <!-- SECTION 2: URLOPY -->
              <div class="border-t border-slate-800 pt-3">
                <h4 class="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">beach_access</span>
                  <span>2. Urlopy & Wymiar</span>
                </h4>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Roczna pula urlopu (dni) *</label>
                    <input type="number" id="f-emp-limit" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-white" value="${editingEmployee?.annualLeaveLimit || 20}" min="1" max="60" required />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Urlop zaległy z ub. roku (dni)</label>
                    <input type="number" id="f-emp-overdue" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-white" value="${editingEmployee?.overdueLeaveDays || 0}" min="0" max="60" />
                  </div>
                </div>
              </div>

              <!-- SECTION 3: MEDYCYNA PRACY & BHP -->
              <div class="border-t border-slate-800 pt-3">
                <h4 class="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">health_and_safety</span>
                  <span>3. Badania Lekarskie & Szkolenia BHP</span>
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Badania: Data wykonania</label>
                    <input type="date" id="f-emp-med-date" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white" value="${editingEmployee?.medicalExamDate || ''}" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Badania: Ważne do (Termin)</label>
                    <input type="date" id="f-emp-med-valid" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white font-bold" value="${editingEmployee?.medicalExamValidUntil || ''}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-300 mb-1">Medycyna Pracy: Orzeczenie / Notatki</label>
                    <input type="text" id="f-emp-med-notes" placeholder="np. Zdolny do pracy - hałas, maszyny w ruchu" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" value="${editingEmployee?.medicalExamNotes || ''}" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">BHP: Data szkolenia</label>
                    <input type="date" id="f-emp-bhp-date" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white" value="${editingEmployee?.safetyTrainingDate || ''}" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">BHP: Ważne do (Termin)</label>
                    <input type="date" id="f-emp-bhp-valid" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white font-bold" value="${editingEmployee?.safetyTrainingValidUntil || ''}" />
                  </div>
                </div>
              </div>

              <!-- SECTION 4: UPRAWNIENIA, ODZIEŻ & ICE -->
              <div class="border-t border-slate-800 pt-3">
                <h4 class="font-bold text-purple-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>4. Uprawnienia, Odzież BHP, ICE & Komentarz</span>
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Uprawnienia Wózki Widłowe (UDT)</label>
                    <input type="text" id="f-emp-forklift" placeholder="np. UDT II WJO (Ważne do 2029)" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" value="${editingEmployee?.forkliftLicense || ''}" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Uprawnienia Suwnice / Żurawie</label>
                    <input type="text" id="f-emp-crane" placeholder="np. Suwnice IIS z poziomu roboczego" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" value="${editingEmployee?.craneLicense || ''}" />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block font-bold text-slate-300 mb-1">Rozmiar ubrania</label>
                      <input type="text" id="f-emp-clothes" placeholder="np. L / 52" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" value="${editingEmployee?.clothesSize || ''}" />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-300 mb-1">Rozmiar butów</label>
                      <input type="text" id="f-emp-shoes" placeholder="np. 43" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" value="${editingEmployee?.shoesSize || ''}" />
                    </div>
                  </div>
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Kontakt Alarmowy ICE</label>
                    <input type="text" id="f-emp-ice" placeholder="np. Żona Anna: +48 600 123 456" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-medium" value="${editingEmployee?.iceContact || ''}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-300 mb-1">Główny Komentarz / Notatka Podpięta</label>
                    <textarea id="f-emp-notes" rows="2" placeholder="Wpisz uwagi, specyfikację pracy, ustalenia..." class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">${editingEmployee?.notes || ''}</textarea>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 pt-3 border-t border-slate-800">
                <button type="button" id="btn-cancel-emp-form" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-colors">
                  ANULUJ
                </button>
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  <span>ZAPISZ PRACOWNIKA</span>
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
    container.querySelector('#btn-back')?.addEventListener('click', () => navigateTo('dashboard'));

    container.querySelector('#btn-close-banner')?.addEventListener('click', () => {
      statusBanner = null;
      renderUI();
    });

    // Tab buttons
    container.querySelector('#tab-btn-leaves')?.addEventListener('click', () => { activeTab = 'LEAVES'; renderUI(); });
    container.querySelector('#tab-btn-bhp')?.addEventListener('click', () => { activeTab = 'BHP'; renderUI(); });
    container.querySelector('#tab-btn-cards')?.addEventListener('click', () => { activeTab = 'CARDS'; renderUI(); });
    container.querySelector('#tab-btn-history')?.addEventListener('click', () => { activeTab = 'HISTORY'; renderUI(); });
    container.querySelector('#btn-switch-to-bhp')?.addEventListener('click', () => { activeTab = 'BHP'; renderUI(); });

    // Sync Odoo button
    container.querySelector('#btn-sync-odoo')?.addEventListener('click', async () => {
      isSyncingOdoo = true;
      renderUI();
      const res = await syncEmployeesFromOdoo();
      isSyncingOdoo = false;
      if (res.success) {
        statusBanner = { type: 'success', msg: `Zsynchronizowano z Odoo 19: pracownicy (zaktualizowano ${res.updatedCount}, dodano ${res.addedCount}), pobrano ${res.leavesCount} wniosków urlopowych.` };
      } else {
        statusBanner = { type: 'error', msg: `Błąd synchronizacji z Odoo: ${res.error}` };
      }
      renderUI();
    });

    // Click on employee card to open Employee Detail Modal
    container.querySelectorAll('.card-click-employee').forEach(card => {
      card.addEventListener('click', () => {
        const empId = card.getAttribute('data-id');
        selectedEmployeeDetail = getEmployees().find(e => e.id === empId);
        if (selectedEmployeeDetail) {
          renderUI();
        }
      });
    });

    container.querySelectorAll('.btn-card-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const empId = btn.getAttribute('data-id');
        selectedEmployeeDetail = getEmployees().find(e => e.id === empId);
        if (selectedEmployeeDetail) {
          renderUI();
        }
      });
    });

    // Close Detail Modal
    container.querySelector('#close-detail-modal-btn')?.addEventListener('click', () => {
      selectedEmployeeDetail = null;
      renderUI();
    });
    container.querySelector('#btn-close-detail')?.addEventListener('click', () => {
      selectedEmployeeDetail = null;
      renderUI();
    });

    // Save Quick Note inside Detail Modal
    container.querySelector('#btn-save-quick-note')?.addEventListener('click', () => {
      if (selectedEmployeeDetail) {
        const noteInput = container.querySelector('#input-quick-note');
        if (noteInput) {
          updateEmployeeQuickNotes(selectedEmployeeDetail.id, noteInput.value, currentOp ? currentOp.name : 'Operator');
          statusBanner = { type: 'success', msg: `Zapisano notatkę główną dla ${selectedEmployeeDetail.name}.` };
          renderUI();
        }
      }
    });

    // Add Comment inside Detail Modal
    const commentForm = container.querySelector('#form-add-comment');
    if (commentForm && selectedEmployeeDetail) {
      commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const commentInput = container.querySelector('#input-new-comment-text');
        if (commentInput && commentInput.value.trim()) {
          addEmployeeComment(selectedEmployeeDetail.id, commentInput.value.trim(), currentOp ? currentOp.name : 'Operator');
          commentInput.value = '';
          statusBanner = { type: 'success', msg: `Dodano komentarz do profilu ${selectedEmployeeDetail.name}.` };
          renderUI();
        }
      });
    }

    // Edit from Detail Modal
    container.querySelector('#btn-edit-from-detail')?.addEventListener('click', () => {
      if (selectedEmployeeDetail) {
        editingEmployee = selectedEmployeeDetail;
        selectedEmployeeDetail = null;
        showNewEmployeeModal = true;
        renderUI();
      }
    });

    // Send Medical Exam Alert to Odoo from Detail Modal
    container.querySelectorAll('.btn-send-med-odoo').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const emp = getEmployees().find(e => e.id === id);
        if (emp) {
          btn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">sync</span>';
          const res = await sendMedicalExamAlertToOdoo(emp);
          if (res.success) {
            statusBanner = { type: 'success', msg: `Wysłano alert o badaniach ${emp.name} do Odoo (#Wszystko)!` };
          } else {
            statusBanner = { type: 'error', msg: `Błąd wysyłania do Odoo: ${res.error}` };
          }
          renderUI();
        }
      });
    });

    // Modals triggers
    container.querySelector('#btn-open-leave-modal')?.addEventListener('click', () => {
      showNewLeaveModal = true;
      renderUI();
    });

    container.querySelector('#btn-open-employee-modal')?.addEventListener('click', () => {
      editingEmployee = null;
      showNewEmployeeModal = true;
      renderUI();
    });

    container.querySelector('#close-leave-modal-btn')?.addEventListener('click', () => { showNewLeaveModal = false; renderUI(); });
    container.querySelector('#btn-cancel-leave')?.addEventListener('click', () => { showNewLeaveModal = false; renderUI(); });
    container.querySelector('#close-emp-modal-btn')?.addEventListener('click', () => { showNewEmployeeModal = false; renderUI(); });
    container.querySelector('#btn-cancel-emp-form')?.addEventListener('click', () => { showNewEmployeeModal = false; renderUI(); });
    container.querySelector('#close-adjust-modal-btn')?.addEventListener('click', () => { showAdjustLeaveModal = false; renderUI(); });
    container.querySelector('#btn-cancel-adjust')?.addEventListener('click', () => { showAdjustLeaveModal = false; renderUI(); });

    // Quick leave request from card
    container.querySelectorAll('.btn-quick-leave').forEach(btn => {
      btn.addEventListener('click', () => {
        const empId = btn.getAttribute('data-id');
        showNewLeaveModal = true;
        renderUI();
        const select = container.querySelector('#leave-emp-select');
        if (select) select.value = empId;
      });
    });

    // Open Adjust Leave Modal
    container.querySelectorAll('.btn-open-adjust-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const empId = btn.getAttribute('data-id');
        adjustingEmployee = getEmployees().find(e => e.id === empId);
        if (adjustingEmployee) {
          showAdjustLeaveModal = true;
          renderUI();
        }
      });
    });

    // Edit Employee Profile & BHP
    container.querySelectorAll('.btn-edit-emp-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        const empId = btn.getAttribute('data-id');
        editingEmployee = getEmployees().find(e => e.id === empId);
        if (editingEmployee) {
          showNewEmployeeModal = true;
          renderUI();
        }
      });
    });

    // Filters
    container.querySelector('#filter-emp-select')?.addEventListener('change', (e) => {
      filterEmployee = e.target.value;
      renderUI();
    });

    container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderUI();
    });

    // Calc working days inside leave modal
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
      leaveForm.addEventListener('submit', (e) => {
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

        if (shouldSendOdoo) {
          sendLeaveNotificationToOdoo(newReq).catch(() => {});
        }

        if (shouldSendEmail) {
          const mailtoUrl = buildLeaveMailtoUrl(newReq);
          window.open(mailtoUrl, '_blank');
        }

        statusBanner = { 
          type: 'success', 
          msg: `Zapisano wniosek urlopowy dla ${empName} (${newReq.daysCount} dni: ${startDate} - ${endDate})! ${shouldSendOdoo ? 'Wysłano do Odoo.' : ''}` 
        };
        renderUI();
      });
    }

    // Submit Adjust Leave Form
    const adjustForm = container.querySelector('#adjust-leave-form');
    if (adjustForm && adjustingEmployee) {
      adjustForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = container.querySelector('#adjust-type-select').value;
        const daysDelta = parseFloat(container.querySelector('#adjust-days-input').value);
        const reason = container.querySelector('#adjust-reason-input').value.trim();

        const res = adjustEmployeeLeave({
          employeeId: adjustingEmployee.id,
          type,
          daysDelta,
          reason,
          operatorName: currentOp ? currentOp.name : 'Operator'
        });

        showAdjustLeaveModal = false;
        adjustingEmployee = null;

        if (res.success) {
          statusBanner = { type: 'success', msg: `Pomyślnie zaktualizowano bilans urlopowy pracownika. Zmiana została zapisana w historii.` };
        } else {
          statusBanner = { type: 'error', msg: res.error || 'Błąd zapisu korekty.' };
        }
        renderUI();
      });
    }

    // Submit Full Employee Form (Add or Edit)
    const empForm = container.querySelector('#employee-full-form');
    if (empForm) {
      empForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#f-emp-name').value.trim();
        const position = container.querySelector('#f-emp-pos').value.trim();
        const machine = container.querySelector('#f-emp-machine').value.trim();
        const role = container.querySelector('#f-emp-role').value;
        const email = container.querySelector('#f-emp-email').value.trim();
        const phone = container.querySelector('#f-emp-phone').value.trim();
        const limit = parseInt(container.querySelector('#f-emp-limit').value, 10) || 20;
        const overdue = parseInt(container.querySelector('#f-emp-overdue').value, 10) || 0;

        const medicalExamDate = container.querySelector('#f-emp-med-date').value;
        const medicalExamValidUntil = container.querySelector('#f-emp-med-valid').value;
        const medicalExamNotes = container.querySelector('#f-emp-med-notes').value.trim();
        const safetyTrainingDate = container.querySelector('#f-emp-bhp-date').value;
        const safetyTrainingValidUntil = container.querySelector('#f-emp-bhp-valid').value;

        const forkliftLicense = container.querySelector('#f-emp-forklift').value.trim();
        const craneLicense = container.querySelector('#f-emp-crane').value.trim();
        const clothesSize = container.querySelector('#f-emp-clothes').value.trim();
        const shoesSize = container.querySelector('#f-emp-shoes').value.trim();
        const iceContact = container.querySelector('#f-emp-ice').value.trim();
        const notes = container.querySelector('#f-emp-notes').value.trim();

        saveEmployee({
          id: editingEmployee ? editingEmployee.id : null,
          odooEmployeeId: editingEmployee ? editingEmployee.odooEmployeeId : null,
          name,
          shortName: name.split(' ')[0],
          role,
          position,
          assignedMachine: machine,
          email: email || `${name.toLowerCase().replace(/\s+/g, '')}@bluemake.eu`,
          phone,
          annualLeaveLimit: limit,
          overdueLeaveDays: overdue,
          medicalExamDate,
          medicalExamValidUntil,
          medicalExamNotes,
          safetyTrainingDate,
          safetyTrainingValidUntil,
          forkliftLicense,
          craneLicense,
          clothesSize,
          shoesSize,
          iceContact,
          notes,
          avatar: editingEmployee ? editingEmployee.avatar : (role === 'ADMIN' ? 'admin_panel_settings' : 'person')
        }, currentOp ? currentOp.name : 'Operator');

        showNewEmployeeModal = false;
        editingEmployee = null;
        statusBanner = { type: 'success', msg: `Zapisano dane pracownika: ${name}.` };
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
          deleteLeaveRequest(id, currentOp ? currentOp.name : 'Operator');
          statusBanner = { type: 'success', msg: 'Usunięto wniosek urlopowy.' };
          renderUI();
        }
      });
    });
  }

  renderUI();
}
