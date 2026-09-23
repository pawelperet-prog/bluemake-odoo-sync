import { callOdooRpc } from './odooApi.js';
import { getCurrentOperator } from './authService.js';

const STORAGE_KEY_EMPLOYEES = 'bluemake_employees_v1';
const STORAGE_KEY_LEAVE_REQUESTS = 'bluemake_leave_requests_v1';

export const LEAVE_TYPES = [
  { id: 'VACATION', label: 'Urlop wypoczynkowy', icon: 'beach_access', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'ON_DEMAND', label: 'Urlop na żądanie', icon: 'bolt', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'SPECIAL', label: 'Urlop okolicznościowy', icon: 'celebration', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'UNPAID', label: 'Urlop bezpłatny', icon: 'money_off', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { id: 'SICK', label: 'Zwolnienie lekarskie (L4)', icon: 'medical_services', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'CHILD_CARE', label: 'Opieka nad dzieckiem', icon: 'family_restroom', color: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp_1',
    name: 'Paweł Peret',
    shortName: 'Paweł',
    role: 'ADMIN',
    position: 'Zarząd / Automatyka',
    email: 'p.peret@bluemake.eu',
    phone: '+48 791 228 899',
    annualLeaveLimit: 26,
    avatar: 'admin_panel_settings',
    odooPartnerId: 6
  },
  {
    id: 'emp_2',
    name: 'Mateusz Klimkowski',
    shortName: 'Mateusz',
    role: 'ADMIN',
    position: 'Kierownik Produkcji / CNC',
    email: 'm.klimkowski@bluemake.eu',
    phone: '+48 693 881 220',
    annualLeaveLimit: 26,
    avatar: 'manage_accounts',
    odooPartnerId: 8
  },
  {
    id: 'emp_3',
    name: 'Szymon',
    shortName: 'Szymon',
    role: 'OPERATOR',
    position: 'Operator CNC / Magazynier',
    email: 'szymon@bluemake.eu',
    phone: '+48 500 112 334',
    annualLeaveLimit: 26,
    avatar: 'precision_manufacturing',
    odooPartnerId: null
  },
  {
    id: 'emp_4',
    name: 'Patryk',
    shortName: 'Patryk',
    role: 'OPERATOR',
    position: 'Operator CNC / Magazynier',
    email: 'patryk@bluemake.eu',
    phone: '+48 500 223 445',
    annualLeaveLimit: 26,
    avatar: 'inventory',
    odooPartnerId: null
  }
];

export function getEmployees() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading employees:', e);
  }
  localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  return INITIAL_EMPLOYEES;
}

export function saveEmployees(list) {
  localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(list));
}

export function saveEmployee(emp) {
  const list = getEmployees();
  const idx = list.findIndex(e => e.id === emp.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...emp };
  } else {
    list.push({ ...emp, id: emp.id || `emp_${Date.now()}` });
  }
  saveEmployees(list);
  return list;
}

export function deleteEmployee(id) {
  const list = getEmployees().filter(e => e.id !== id);
  saveEmployees(list);
  return list;
}

export function getLeaveRequests() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LEAVE_REQUESTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading leave requests:', e);
  }
  // Initial demo records
  const initialLeaves = [
    {
      id: 'leave_101',
      employeeId: 'emp_3',
      employeeName: 'Szymon',
      leaveType: 'VACATION',
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      daysCount: 5,
      status: 'APPROVED', // 'APPROVED' | 'PENDING' | 'REJECTED'
      notes: 'Urlop jesienny wypoczynkowy',
      createdAt: '2026-09-20T10:00:00.000Z',
      submittedBy: 'Szymon',
      approvedBy: 'Mateusz Klimkowski'
    }
  ];
  localStorage.setItem(STORAGE_KEY_LEAVE_REQUESTS, JSON.stringify(initialLeaves));
  return initialLeaves;
}

export function saveLeaveRequests(list) {
  localStorage.setItem(STORAGE_KEY_LEAVE_REQUESTS, JSON.stringify(list));
}

export function calculateWorkingDays(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (start > end) return 0;

  let workingDays = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return workingDays;
}

export function saveLeaveRequest(request) {
  const list = getLeaveRequests();
  const workingDays = calculateWorkingDays(request.startDate, request.endDate);
  const fullRequest = {
    ...request,
    daysCount: workingDays,
    id: request.id || `leave_${Date.now()}`,
    createdAt: request.createdAt || new Date().toISOString(),
    status: request.status || 'PENDING'
  };

  const idx = list.findIndex(r => r.id === fullRequest.id);
  if (idx >= 0) {
    list[idx] = fullRequest;
  } else {
    list.unshift(fullRequest);
  }
  saveLeaveRequests(list);
  return fullRequest;
}

export function updateLeaveRequestStatus(id, newStatus, reviewerName = null) {
  const list = getLeaveRequests();
  const req = list.find(r => r.id === id);
  if (req) {
    req.status = newStatus;
    if (newStatus === 'APPROVED') req.approvedBy = reviewerName || 'Zarząd Bluemake';
    if (newStatus === 'REJECTED') req.rejectedBy = reviewerName || 'Zarząd Bluemake';
    saveLeaveRequests(list);
    return req;
  }
  return null;
}

export function deleteLeaveRequest(id) {
  const list = getLeaveRequests().filter(r => r.id !== id);
  saveLeaveRequests(list);
  return list;
}

export function getEmployeeLeaveStats(empId, year = new Date().getFullYear()) {
  const employees = getEmployees();
  const emp = employees.find(e => e.id === empId);
  const limit = emp ? (emp.annualLeaveLimit || 26) : 26;

  const allLeaves = getLeaveRequests().filter(r => {
    if (r.employeeId !== empId) return false;
    const leaveYear = new Date(r.startDate).getFullYear();
    return leaveYear === year;
  });

  const approvedLeaves = allLeaves.filter(r => r.status === 'APPROVED');
  const usedVacationDays = approvedLeaves
    .filter(r => r.leaveType === 'VACATION' || r.leaveType === 'ON_DEMAND')
    .reduce((sum, r) => sum + (r.daysCount || 0), 0);

  const pendingDays = allLeaves
    .filter(r => r.status === 'PENDING')
    .reduce((sum, r) => sum + (r.daysCount || 0), 0);

  const sickDays = approvedLeaves
    .filter(r => r.leaveType === 'SICK')
    .reduce((sum, r) => sum + (r.daysCount || 0), 0);

  const remainingDays = Math.max(0, limit - usedVacationDays);

  return {
    limit,
    usedVacationDays,
    pendingDays,
    sickDays,
    remainingDays,
    totalRequests: allLeaves.length
  };
}

/**
 * Generate Mailto Link for Leave Request Notification
 */
export function buildLeaveMailtoUrl(request) {
  const recipients = ['p.peret@bluemake.eu', 'm.klimkowski@bluemake.eu'].join(',');
  const typeObj = LEAVE_TYPES.find(t => t.id === request.leaveType) || { label: 'Urlop' };
  
  const subject = encodeURIComponent(`[Urlop Bluemake] Wniosek urlopowy: ${request.employeeName} (${request.startDate} - ${request.endDate})`);
  const body = encodeURIComponent(
`Dzień dobry,

Zgłoszenie urlopowe w systemie Bluemake Industrial:

Pracownik: ${request.employeeName}
Rodzaj nieobecności: ${typeObj.label}
Termin: od ${request.startDate} do ${request.endDate}
Liczba dni roboczych: ${request.daysCount} dni
Status wniosku: ${request.status === 'APPROVED' ? 'ZATWIERDZONY' : (request.status === 'REJECTED' ? 'ODRZUCONY' : 'OCZEKUJE NA ZATWIERDZENIE')}
${request.notes ? `Uwagi / Powód: ${request.notes}` : ''}

Wysłano z aplikacji warsztatowej Bluemake Sync
Data zgłoszenia: ${new Date().toLocaleString('pl-PL')}`
  );

  return `mailto:${recipients}?subject=${subject}&body=${body}`;
}

/**
 * Send Live Notification into Odoo Discuss Channel #Wszystko & Managers
 */
export async function sendLeaveNotificationToOdoo(request) {
  const typeObj = LEAVE_TYPES.find(t => t.id === request.leaveType) || { label: 'Urlop' };
  const statusLabel = request.status === 'APPROVED' ? '✅ ZATWIERDZONY' : (request.status === 'REJECTED' ? '❌ ODRZUCONY' : '⏳ OCZEKUJE');

  const msgHtml = `
🏖️ <strong>ZGŁOSZENIE URLOPOWE (Bluemake):</strong><br/>
Pracownik: <strong>${request.employeeName}</strong><br/>
Typ: <strong>${typeObj.label}</strong><br/>
Termin: <strong>${request.startDate}</strong> do <strong>${request.endDate}</strong> (<strong>${request.daysCount} dni roboczych</strong>)<br/>
Status: <strong>${statusLabel}</strong><br/>
${request.notes ? `Komentarz: <em>${request.notes}</em><br/>` : ''}
<small>Zgłoszono przez: ${request.submittedBy || 'Aplikacja warsztatowa'} • ${new Date().toLocaleString('pl-PL')}</small>
  `.trim();

  try {
    await callOdooRpc('mail.message', 'create', [{
      model: 'discuss.channel',
      res_id: 11, // #Wszystko channel
      body: msgHtml,
      message_type: 'comment',
      subtype_id: 1,
      partner_ids: [6, 8] // Paweł Peret & Mateusz Klimkowski
    }]);
    return { success: true };
  } catch (err) {
    console.warn('Nie udało się wysłać powiadomienia urlopowego do Odoo:', err);
    return { success: false, error: err.message };
  }
}
