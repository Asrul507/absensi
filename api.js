// ============================================================
// HOSPITALITY ATTENDANCE SYSTEM - API Manager
// File: api.js
// ============================================================
// INSTRUKSI SETUP:
// 1. Deploy kode.gs di Google Apps Script sebagai Web App
//    (Execute as: Me | Who has access: Anyone)
// 2. Copy URL deployment (format: https://script.google.com/macros/s/xxxx/exec)
// 3. Paste URL tersebut ke BASE_URL di bawah ini
// ============================================================

const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbx0StbSVZXiY0MZ_AfiCDqxqNzUSHSbnB_6BJgRCTpDr32Sf5JJJwHCesIcxkMZXn5a/exec',
  // Contoh: 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxx/exec'
  TIMEOUT: 30000,
};

// ============================================================
// CORE REQUEST FUNCTION
// ============================================================
async function apiRequest(method, params = {}, body = null) {
  const url = new URL(API_CONFIG.BASE_URL);

  if (method === 'GET') {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, v);
    });
  }

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  options.signal = controller.signal;

  try {
    const response = await fetch(url.toString(), options);
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Periksa koneksi internet Anda.');
    }
    throw error;
  }
}

// ============================================================
// AUTH API
// ============================================================
const AuthAPI = {
  login: (email, password) =>
    apiRequest('POST', {}, { action: 'login', email, password }),

  changePassword: (userId, oldPassword, newPassword) =>
    apiRequest('POST', {}, { action: 'changePassword', userId, oldPassword, newPassword }),

  getServerTime: () =>
    apiRequest('GET', { action: 'getServerTime' }),
};

// ============================================================
// ATTENDANCE API
// ============================================================
const AttendanceAPI = {
  clockIn: (userId, lat, lng, foto) =>
    apiRequest('POST', {}, { action: 'clockIn', userId, lat, lng, foto }),

  clockOut: (userId) =>
    apiRequest('POST', {}, { action: 'clockOut', userId }),

  getAttendance: (userId = null, dateFrom = null, dateTo = null) =>
    apiRequest('GET', { action: 'getAttendance', userId, dateFrom, dateTo }),

  getDashboardStats: () =>
    apiRequest('GET', { action: 'getDashboardStats' }),

  exportCSV: (dateFrom, dateTo) =>
    apiRequest('GET', { action: 'exportCSV', dateFrom, dateTo }),
};

// ============================================================
// USERS API
// ============================================================
const UsersAPI = {
  getUsers: () =>
    apiRequest('GET', { action: 'getUsers' }),

  createUser: (data) =>
    apiRequest('POST', {}, { action: 'createUser', ...data }),

  updateUser: (data) =>
    apiRequest('POST', {}, { action: 'updateUser', ...data }),

  deleteUser: (id, adminEmail) =>
    apiRequest('POST', {}, { action: 'deleteUser', id, adminEmail }),
};

// ============================================================
// SCHEDULES API
// ============================================================
const SchedulesAPI = {
  getSchedules: (userId = null, date = null) =>
    apiRequest('GET', { action: 'getSchedules', userId, date }),

  createSchedule: (data) =>
    apiRequest('POST', {}, { action: 'createSchedule', ...data }),

  updateSchedule: (data) =>
    apiRequest('POST', {}, { action: 'updateSchedule', ...data }),

  deleteSchedule: (id, adminEmail) =>
    apiRequest('POST', {}, { action: 'deleteSchedule', id, adminEmail }),
};

// ============================================================
// REQUESTS API
// ============================================================
const RequestsAPI = {
  getRequests: (userId = null, status = null) =>
    apiRequest('GET', { action: 'getRequests', userId, status }),

  submitRequest: (userId, tipe, detail, lampiran = null) =>
    apiRequest('POST', {}, { action: 'submitRequest', userId, tipe, detail, lampiran }),

  approveRequest: (id, adminEmail) =>
    apiRequest('POST', {}, { action: 'approveRequest', id, adminEmail }),

  rejectRequest: (id, adminEmail) =>
    apiRequest('POST', {}, { action: 'rejectRequest', id, adminEmail }),
};

// ============================================================
// LOGS API
// ============================================================
const LogsAPI = {
  getLogs: () =>
    apiRequest('GET', { action: 'getLogs' }),
};

// ============================================================
// CHECK IF API IS CONFIGURED
// ============================================================
function isAPIConfigured() {
  return API_CONFIG.BASE_URL && API_CONFIG.BASE_URL !== 'PASTE_YOUR_GAS_WEB_APP_URL_HERE';
}
