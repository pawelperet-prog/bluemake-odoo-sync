import { callOdooRpc } from './odooApi.js';
import { getCurrentOperator } from './authService.js';

const STORAGE_KEY_EMPLOYEES = 'bluemake_employees_v2';
const STORAGE_KEY_LEAVE_REQUESTS = 'bluemake_leave_requests_v2';
const STORAGE_KEY_EMPLOYEE_HISTORY = 'bluemake_employee_history_v2';

export const LEAVE_TYPES = [
  { id: 'VACATION', label: 'Urlop wypoczynkowy', icon: 'beach_access', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'ON_DEMAND', label: 'Urlop na żądanie', icon: 'bolt', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'SPECIAL', label: 'Urlop okolicznościowy', icon: 'celebration', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'UNPAID', label: 'Urlop bezpłatny', icon: 'money_off', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { id: 'SICK', label: 'Zwolnienie lekarskie (L4)', icon: 'medical_services', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'CHILD_CARE', label: 'Opieka nad dzieckiem', icon: 'family_restroom', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'TRAINING', label: 'Urlop szkoleniowy', icon: 'school', color: 'bg-blue-100 text-blue-800 border-blue-300' }
];

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp_1',
    odooEmployeeId: 2,
    name: 'Paweł Peret',
    shortName: 'Paweł',
    role: 'ADMIN',
    position: 'Zarząd / Automatyka',
    department: 'Zarząd & IT',
    email: 'p.peret@bluemake.eu',
    phone: '579655914',
    hireDate: '2023-01-01',
    annualLeaveLimit: 26,
    overdueLeaveDays: 0,
    manualLeaveAdjustments: 0,
    avatar: 'admin_panel_settings',
    medicalExamDate: '2025-03-10',
    medicalExamValidUntil: '2027-03-10',
    medicalExamNotes: 'Zdolny do pracy - stanowisko kierownicze / komputer',
    safetyTrainingDate: '2024-05-15',
    safetyTrainingValidUntil: '2029-05-15',
    forkliftLicense: 'UDT II WJO (Ważne do 2029)',
    craneLicense: 'Suwnice z poziomu roboczego (IIS)',
    sepLicense: 'SEP G1 E+D do 1kV',
    clothesSize: 'L / 52',
    shoesSize: '43',
    gearIssuedDate: '2026-01-10',
    iceContact: 'Telefon alarmowy: +48 791 228 899'
  },
  {
    id: 'emp_2',
    odooEmployeeId: 5,
    name: 'Mateusz Klimkowski',
    shortName: 'Mateusz',
    role: 'ADMIN',
    position: 'Właściciel / Kierownik Produkcji CNC',
    department: 'Produkcja CNC',
    email: 'm.klimkowski@bluemake.eu',
    phone: '+48 693 881 220',
    hireDate: '2023-01-01',
    annualLeaveLimit: 26,
    overdueLeaveDays: 0,
    manualLeaveAdjustments: 0,
    avatar: 'manage_accounts',
    medicalExamDate: '2025-02-20',
    medicalExamValidUntil: '2027-02-20',
    medicalExamNotes: 'Zdolny do pracy - hałas, maszyny w ruchu',
    safetyTrainingDate: '2024-04-10',
    safetyTrainingValidUntil: '2029-04-10',
    forkliftLicense: 'UDT II WJO (Ważne)',
    craneLicense: 'Suwnice z poziomu roboczego',
    sepLicense: 'SEP G1',
    clothesSize: 'XL / 54',
    shoesSize: '44',
    gearIssuedDate: '2026-01-10',
    iceContact: 'Telefon alarmowy: +48 693 881 220'
  },
  {
    id: 'emp_3',
    odooEmployeeId: 3,
    name: 'Szymon Klimkowski',
    shortName: 'Szymon',
    role: 'OPERATOR',
    position: 'Operator CNC / Tokarz',
    department: 'Obróbka Tokarska CNC',
    email: 'szymon@bluemake.eu',
    phone: '+48 500 112 334',
    hireDate: '2023-06-01',
    annualLeaveLimit: 26,
    overdueLeaveDays: 2,
    manualLeaveAdjustments: 0,
    avatar: 'precision_manufacturing',
    medicalExamDate: '2025-06-01',
    medicalExamValidUntil: '2027-06-01',
    medicalExamNotes: 'Zdolny do pracy - tokarki CNC, chłodziwa',
    safetyTrainingDate: '2024-06-15',
    safetyTrainingValidUntil: '2027-06-15',
    forkliftLicense: 'UDT II WJO',
    craneLicense: 'Suwnice / Wciągniki',
    sepLicense: '',
    clothesSize: 'M / 50',
    shoesSize: '42',
    gearIssuedDate: '2026-02-01',
    iceContact: 'Kontakt ICE: +48 500 112 334'
  },
  {
    id: 'emp_4',
    odooEmployeeId: 4,
    name: 'Patryk Majka',
    shortName: 'Patryk',
    role: 'OPERATOR',
    position: 'Operator CNC / Frezer',
    department: 'Obróbka Frezarska CNC',
    email: 'majka.patryk0606@gmail.com',
    phone: '+48 720 818 026',
    hireDate: '2023-09-01',
    annualLeaveLimit: 26,
    overdueLeaveDays: 0,
    manualLeaveAdjustments: 0,
    avatar: 'inventory',
    medicalExamDate: '2025-09-10',
    medicalExamValidUntil: '2027-09-10',
    medicalExamNotes: 'Zdolny do pracy - centra frezarskie CNC, hałas',
    safetyTrainingDate: '2024-09-20',
    safetyTrainingValidUntil: '2027-09-20',
    forkliftLicense: 'UDT II WJO',
    craneLicense: 'Suwnice / Żurawie',
    sepLicense: '',
    clothesSize: 'L / 52',
    shoesSize: '43',
    gearIssuedDate: '2026-02-01',
    iceContact: 'Kontakt ICE: +48 720 818 026'
  }
];

export function getEmployees() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES) || localStorage.getItem('bluemake_employees_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default fields are filled
        const enriched = parsed.map(e => ({
          overdueLeaveDays: 0,
          manualLeaveAdjustments: 0,
          medicalExamDate: '',
          medicalExamValidUntil: '',
          medicalExamNotes: '',
          safetyTrainingDate: '',
          safetyTrainingValidUntil: '',
          forkliftLicense: '',
          craneLicense: '',
          sepLicense: '',
          clothesSize: '',
          shoesSize: '',
          gearIssuedDate: '',
          iceContact: '',
          ...e
        }));
        return enriched;
      }
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

export function getEmployeeById(id) {
  const list = getEmployees();
  return list.find(e => e.id === id || String(e.odooEmployeeId) === String(id)) || null;
}

export function saveEmployee(emp, operatorName = null) {
  const list = getEmployees();
  const op = operatorName || getCurrentOperator()?.name || 'Operator';
  const isNew = !emp.id || !list.some(e => e.id === emp.id);

  let updatedList;
  if (isNew) {
    const newEmp = {
      ...emp,
      id: emp.id || `emp_${Date.now()}`,
      shortName: emp.shortName || emp.name.split(' ')[0],
      avatar: emp.avatar || 'person'
    };
    list.push(newEmp);
    updatedList = list;

    logEmployeeHistory({
      action: '➕ DODANIE PRACOWNIKA',
      details: `Dodano nowego pracownika: ${newEmp.name} (${newEmp.position || 'Brak stanowiska'})`,
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      operator: op
    });
  } else {
    const idx = list.findIndex(e => e.id === emp.id);
    const oldEmp = list[idx];
    list[idx] = { ...oldEmp, ...emp };
    updatedList = list;

    logEmployeeHistory({
      action: '✏️ EDYCJA DANYCH PRACOWNIKA',
      details: `Zaktualizowano dane pracownika ${emp.name} (Badania, BHP, Urlopy, Stanowisko)`,
      employeeId: emp.id,
      employeeName: emp.name,
      operator: op
    });
  }

  saveEmployees(updatedList);
  return updatedList;
}

export function deleteEmployee(id, operatorName = null) {
  const list = getEmployees();
  const emp = list.find(e => e.id === id);
  const op = operatorName || getCurrentOperator()?.name || 'Operator';
  const updated = list.filter(e => e.id !== id);
  saveEmployees(updated);

  if (emp) {
    logEmployeeHistory({
      action: '🗑️ USUNIĘCIE PRACOWNIKA',
      details: `Usunięto profil pracownika: ${emp.name}`,
      employeeId: emp.id,
      employeeName: emp.name,
      operator: op
    });
  }
  return updated;
}

/**
 * Sync Employees from Odoo 19 (hr.employee)
 */
export async function syncEmployeesFromOdoo() {
  try {
    const odooEmps = await callOdooRpc('hr.employee', 'search_read', [[]], {
      fields: ['id', 'name', 'work_email', 'work_phone', 'job_title', 'department_id']
    });

    if (Array.isArray(odooEmps) && odooEmps.length > 0) {
      const currentList = getEmployees();
      let addedCount = 0;
      let updatedCount = 0;

      odooEmps.forEach(oEmp => {
        if (!oEmp.name || oEmp.name === 'Administrator') return;

        const existingIdx = currentList.findIndex(e => 
          (e.odooEmployeeId && e.odooEmployeeId === oEmp.id) || 
          (e.name.toLowerCase().trim() === oEmp.name.toLowerCase().trim())
        );

        if (existingIdx >= 0) {
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            odooEmployeeId: oEmp.id,
            name: oEmp.name,
            position: oEmp.job_title || currentList[existingIdx].position || 'Pracownik',
            email: oEmp.work_email || currentList[existingIdx].email || '',
            phone: oEmp.work_phone || currentList[existingIdx].phone || '',
          };
          updatedCount++;
        } else {
          currentList.push({
            id: `emp_odoo_${oEmp.id}`,
            odooEmployeeId: oEmp.id,
            name: oEmp.name,
            shortName: oEmp.name.split(' ')[0],
            role: (oEmp.name.includes('Peret') || oEmp.name.includes('Mateusz')) ? 'ADMIN' : 'OPERATOR',
            position: oEmp.job_title || 'Pracownik',
            department: Array.isArray(oEmp.department_id) ? oEmp.department_id[1] : 'Produkcja CNC',
            email: oEmp.work_email || `${oEmp.name.toLowerCase().replace(/\s+/g, '')}@bluemake.eu`,
            phone: oEmp.work_phone || '',
            annualLeaveLimit: 26,
            overdueLeaveDays: 0,
            manualLeaveAdjustments: 0,
            avatar: 'person',
            medicalExamDate: '',
            medicalExamValidUntil: '',
            medicalExamNotes: '',
            safetyTrainingDate: '',
            safetyTrainingValidUntil: '',
            forkliftLicense: '',
            craneLicense: '',
            sepLicense: '',
            clothesSize: '',
            shoesSize: '',
            gearIssuedDate: '',
            iceContact: ''
          });
          addedCount++;
        }
      });

      saveEmployees(currentList);
      logEmployeeHistory({
        action: '🔄 SYNCHRONIZACJA Z ODOO',
        details: `Zsynchronizowano pracowników z Odoo: zaktualizowano ${updatedCount}, dodano ${addedCount}.`,
        operator: getCurrentOperator()?.name || 'Operator'
      });

      return { success: true, addedCount, updatedCount, total: currentList.length };
    }
    return { success: false, error: 'Brak pracowników w Odoo.' };
  } catch (err) {
    console.error('Błąd synchronizacji pracowników z Odoo:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Manual Leave Adjustments (Dodaj / Odejmij dni / Zmień pulę z rejestrem KTO zmienił)
 */
export function adjustEmployeeLeave({ employeeId, type, daysDelta, reason, operatorName = null }) {
  const employees = getEmployees();
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return { success: false, error: 'Nie znaleziono pracownika' };

  const op = operatorName || getCurrentOperator()?.name || 'Operator';
  const delta = Number(daysDelta);

  if (isNaN(delta) || delta === 0) {
    return { success: false, error: 'Nieprawidłowa liczba dni' };
  }

  const prevAdjustments = emp.manualLeaveAdjustments || 0;
  const prevOverdue = emp.overdueLeaveDays || 0;
  const prevLimit = emp.annualLeaveLimit || 26;

  let actionName = '';
  let detailsText = '';

  if (type === 'ADJUSTMENT') {
    emp.manualLeaveAdjustments = prevAdjustments + delta;
    actionName = delta > 0 ? `➕ KOREKTA URLOPU (+${delta} dni)` : `➖ KOREKTA URLOPU (${delta} dni)`;
    detailsText = `Korekta bilansu urlopowego dla ${emp.name}: ${delta > 0 ? '+' : ''}${delta} dni. Powód: ${reason || 'Korekta ręczna'}`;
  } else if (type === 'OVERDUE') {
    emp.overdueLeaveDays = Math.max(0, prevOverdue + delta);
    actionName = `📅 ZMIANA URLOPU ZALEGŁEGO (${delta > 0 ? '+' : ''}${delta} dni)`;
    detailsText = `Zmiana puli urlopu zaległego dla ${emp.name} z ${prevOverdue} na ${emp.overdueLeaveDays} dni. Powód: ${reason || 'Rozliczenie roku'}`;
  } else if (type === 'LIMIT') {
    emp.annualLeaveLimit = Math.max(1, delta);
    actionName = `⚙️ ZMIANA LIMITU ROCZNEGO (${delta} dni)`;
    detailsText = `Zmiana rocznego wymiaru urlopu dla ${emp.name} z ${prevLimit} na ${emp.annualLeaveLimit} dni. Powód: ${reason || 'Zmiana etatu / uprawnień'}`;
  }

  saveEmployees(employees);

  logEmployeeHistory({
    action: actionName,
    details: detailsText,
    employeeId: emp.id,
    employeeName: emp.name,
    operator: op
  });

  return { success: true, employee: emp };
}

/**
 * Leave Requests & Working Days Calculations
 */
export function getLeaveRequests() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LEAVE_REQUESTS) || localStorage.getItem('bluemake_leave_requests_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading leave requests:', e);
  }
  const initialLeaves = [
    {
      id: 'leave_101',
      employeeId: 'emp_3',
      employeeName: 'Szymon Klimkowski',
      leaveType: 'VACATION',
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      daysCount: 5,
      status: 'APPROVED',
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
    const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
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
  const op = request.submittedBy || getCurrentOperator()?.name || 'Operator';

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

  logEmployeeHistory({
    action: '🏖️ WNIOSEK URLOPOWY',
    details: `Złożono wniosek urlopowy dla ${fullRequest.employeeName}: ${fullRequest.startDate} → ${fullRequest.endDate} (${workingDays} dni roboczych). Status: ${fullRequest.status}`,
    employeeId: fullRequest.employeeId,
    employeeName: fullRequest.employeeName,
    operator: op
  });

  return fullRequest;
}

export function updateLeaveRequestStatus(id, newStatus, reviewerName = null) {
  const list = getLeaveRequests();
  const req = list.find(r => r.id === id);
  if (req) {
    const op = reviewerName || getCurrentOperator()?.name || 'Zarząd';
    req.status = newStatus;
    if (newStatus === 'APPROVED') req.approvedBy = op;
    if (newStatus === 'REJECTED') req.rejectedBy = op;
    saveLeaveRequests(list);

    logEmployeeHistory({
      action: newStatus === 'APPROVED' ? '✅ ZATWIERDZENIE URLOPU' : '❌ ODRZUCENIE URLOPU',
      details: `${newStatus === 'APPROVED' ? 'Zatwierdzono' : 'Odrzucono'} wniosek urlopowy dla ${req.employeeName} (${req.startDate} - ${req.endDate}, ${req.daysCount} dni)`,
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      operator: op
    });

    return req;
  }
  return null;
}

export function deleteLeaveRequest(id, operatorName = null) {
  const list = getLeaveRequests();
  const req = list.find(r => r.id === id);
  const op = operatorName || getCurrentOperator()?.name || 'Operator';
  const updated = list.filter(r => r.id !== id);
  saveLeaveRequests(updated);

  if (req) {
    logEmployeeHistory({
      action: '🗑️ USUNIĘCIE WNIOSKU URLOPOWEGO',
      details: `Usunięto wniosek urlopowy dla ${req.employeeName} (${req.startDate} - ${req.endDate})`,
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      operator: op
    });
  }
  return updated;
}

export function getEmployeeLeaveStats(empId, year = new Date().getFullYear()) {
  const employees = getEmployees();
  const emp = employees.find(e => e.id === empId);
  const limit = emp ? (emp.annualLeaveLimit || 26) : 26;
  const overdue = emp ? (emp.overdueLeaveDays || 0) : 0;
  const adjustments = emp ? (emp.manualLeaveAdjustments || 0) : 0;
  const totalPool = limit + overdue + adjustments;

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

  const remainingDays = Math.max(0, totalPool - usedVacationDays);

  return {
    limit,
    overdue,
    adjustments,
    totalPool,
    usedVacationDays,
    pendingDays,
    sickDays,
    remainingDays,
    totalRequests: allLeaves.length
  };
}

/**
 * Health & Safety (BHP & Medycyna Pracy) Status Checker
 */
export function getBhpAndMedicalStatus(emp) {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  // Medical Exam
  let medicalStatus = 'OK'; // 'OK' | 'EXPIRING' | 'EXPIRED' | 'MISSING'
  let medicalDaysLeft = null;
  if (!emp.medicalExamValidUntil) {
    medicalStatus = 'MISSING';
  } else {
    const medExp = new Date(emp.medicalExamValidUntil);
    const diffTime = medExp - now;
    medicalDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (medicalDaysLeft < 0) medicalStatus = 'EXPIRED';
    else if (medicalDaysLeft <= 30) medicalStatus = 'EXPIRING';
  }

  // Safety Training (BHP)
  let safetyStatus = 'OK';
  let safetyDaysLeft = null;
  if (!emp.safetyTrainingValidUntil) {
    safetyStatus = 'MISSING';
  } else {
    const safeExp = new Date(emp.safetyTrainingValidUntil);
    const diffTime = safeExp - now;
    safetyDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (safetyDaysLeft < 0) safetyStatus = 'EXPIRED';
    else if (safetyDaysLeft <= 30) safetyStatus = 'EXPIRING';
  }

  const hasUrgentIssue = medicalStatus === 'EXPIRED' || medicalStatus === 'EXPIRING' || safetyStatus === 'EXPIRED' || safetyStatus === 'EXPIRING';

  return {
    medicalStatus,
    medicalDaysLeft,
    safetyStatus,
    safetyDaysLeft,
    hasUrgentIssue
  };
}

export function getAllBhpAlerts() {
  const employees = getEmployees();
  const alerts = [];

  employees.forEach(emp => {
    const status = getBhpAndMedicalStatus(emp);
    if (status.medicalStatus === 'EXPIRED') {
      alerts.push({
        empId: emp.id,
        empName: emp.name,
        type: 'MEDICAL',
        severity: 'DANGER',
        msg: `Przeterminowane badania lekarskie! (Wygasły: ${emp.medicalExamValidUntil})`
      });
    } else if (status.medicalStatus === 'EXPIRING') {
      alerts.push({
        empId: emp.id,
        empName: emp.name,
        type: 'MEDICAL',
        severity: 'WARNING',
        msg: `Badania lekarskie wygasają za ${status.medicalDaysLeft} dni (${emp.medicalExamValidUntil})`
      });
    }

    if (status.safetyStatus === 'EXPIRED') {
      alerts.push({
        empId: emp.id,
        empName: emp.name,
        type: 'SAFETY',
        severity: 'DANGER',
        msg: `Przeterminowane szkolenie BHP! (Wygasło: ${emp.safetyTrainingValidUntil})`
      });
    } else if (status.safetyStatus === 'EXPIRING') {
      alerts.push({
        empId: emp.id,
        empName: emp.name,
        type: 'SAFETY',
        severity: 'WARNING',
        msg: `Szkolenie BHP wygasa za ${status.safetyDaysLeft} dni (${emp.safetyTrainingValidUntil})`
      });
    }
  });

  return alerts;
}

/**
 * Audit History - Who Changed What in Employees & Leave
 */
export function logEmployeeHistory({ action, details, employeeId = null, employeeName = null, operator = null }) {
  try {
    const logs = getEmployeeHistory();
    const op = operator || getCurrentOperator()?.name || 'Operator';
    const entry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('pl-PL'),
      operator: op,
      employeeId: employeeId || '',
      employeeName: employeeName || 'Ogólne',
      action: action || 'OPERACJA',
      details: details || ''
    };
    logs.unshift(entry);
    localStorage.setItem(STORAGE_KEY_EMPLOYEE_HISTORY, JSON.stringify(logs.slice(0, 500)));
    return entry;
  } catch (e) {
    console.warn('Could not save employee history log:', e);
  }
}

export function getEmployeeHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_EMPLOYEE_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Mailto & Odoo Notifications
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
