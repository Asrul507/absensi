// ============================================================
// api.js - API Connection Manager
// Hotel Attendance System
// ============================================================
// INSTRUKSI SETUP:
// 1. Deploy kode.gs sebagai Web App di Google Apps Script
// 2. Salin URL deployment (format: https://script.google.com/macros/s/XXXX/exec)
// 3. Ganti nilai BASE_URL di bawah ini dengan URL tersebut
// ============================================================

const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxw4D9irBqL4V0Ywrh6KXviAIhbHn1jpdQR1VPPK-VnNiW9I_1he_4BA7OkOnQ5nmES/exec',
  TIMEOUT: 30000, // 30 detik
};

// ============================================================
// CORE API CALLER
// ============================================================

async function apiCall(action, params = {}) {
  const token = localStorage.getItem('hotelToken');
  const body = { action, ...params };
  if (token && !params.token) body.token = token;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // GAS requires text/plain to avoid CORS preflight
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timeout. Cek koneksi internet Anda.' };
    }
    return { success: false, message: 'Koneksi gagal: ' + err.message };
  }
}

// ============================================================
// AUTH API
// ============================================================

const AuthAPI = {
  login: (email, password) => apiCall('login', { email, password }),
  changePassword: (oldPassword, newPassword) =>
    apiCall('changePassword', { oldPassword, newPassword }),
};

// ============================================================
// USER API
// ============================================================

const UserAPI = {
  getAll: () => apiCall('getUsers'),
  create: (data) => apiCall('createUser', data),
  update: (data) => apiCall('updateUser', data),
  delete: (id) => apiCall('deleteUser', { id }),
};

// ============================================================
// ATTENDANCE API
// ============================================================

const AttendanceAPI = {
  clockIn: (lat, lng, foto) => apiCall('clockIn', { lat, lng, foto }),
  clockOut: (lat, lng, foto) => apiCall('clockOut', { lat, lng, foto }),
  getTodayStatus: () => apiCall('getTodayStatus'),
  getHistory: (params = {}) => apiCall('getAttendance', params),
};

// ============================================================
// SCHEDULE API
// ============================================================

const ScheduleAPI = {
  getAll: (params = {}) => apiCall('getSchedules', params),
  create: (data) => apiCall('createSchedule', data),
  update: (data) => apiCall('updateSchedule', data),
  delete: (id) => apiCall('deleteSchedule', { id }),
};

// ============================================================
// REQUEST API
// ============================================================

const RequestAPI = {
  submit: (tipe, detail, lampiran) => apiCall('submitRequest', { tipe, detail, lampiran }),
  getAll: (params = {}) => apiCall('getRequests', params),
  approve: (id) => apiCall('approveRequest', { id }),
  reject: (id, alasan) => apiCall('rejectRequest', { id, alasan }),
};

// ============================================================
// REPORT API
// ============================================================

const ReportAPI = {
  getDashboard: () => apiCall('getDashboard'),
  getReport: (params = {}) => apiCall('getReport', params),
  exportCSV: (params = {}) => apiCall('exportCSV', params),
};

// ============================================================
// LOG API
// ============================================================

const LogAPI = {
  getAll: (limit = 100) => apiCall('getLogs', { limit }),
};

// ============================================================
// EXPORT (available globally)
// ============================================================

window.HotelAPI = {
  call: apiCall,
  auth: AuthAPI,
  user: UserAPI,
  attendance: AttendanceAPI,
  schedule: ScheduleAPI,
  request: RequestAPI,
  report: ReportAPI,
  log: LogAPI,
  config: API_CONFIG,
};
