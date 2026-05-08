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
  MAX_RETRIES: 3,
  CACHE_DURATION: 5 * 60 * 1000, // 5 menit
};

// ============================================================
// REQUEST CACHE
// ============================================================

const requestCache = new Map();

function getCacheKey(action, params) {
  return `${action}:${JSON.stringify(params)}`;
}

function getFromCache(action, params) {
  const key = getCacheKey(action, params);
  const cached = requestCache.get(key);

  if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_DURATION) {
    console.log('✅ Using cached response for:', action);
    return cached.data;
  }

  return null;
}

function setCache(action, params, data) {
  const key = getCacheKey(action, params);
  requestCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function clearCache() {
  requestCache.clear();
  console.log('✅ Cache cleared');
}

// ============================================================
// CORE API CALLER WITH RETRY LOGIC
// ============================================================

async function apiCall(action, params = {}, useCache = true) {
  // Check cache first for GET-like operations
  if (useCache && !['login', 'changePassword', 'createUser', 'updateUser', 'createSchedule', 'updateSchedule', 'submitRequest', 'approveRequest', 'rejectRequest'].includes(action)) {
    const cached = getFromCache(action, params);
    if (cached) return cached;
  }

  // Validate params
  if (!validateParams(action, params)) {
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Parameter tidak valid',
    };
  }

  const token = localStorage.getItem('hotelToken');
  const body = { action, ...params };
  if (token && !params.token) body.token = token;

  let lastError = null;

  // Retry logic
  for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

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

      // Cache successful response
      if (useCache && data.success) {
        setCache(action, params, data);
      }

      return data;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt}/${API_CONFIG.MAX_RETRIES} failed:`, err.message);

      if (attempt < API_CONFIG.MAX_RETRIES) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  return getErrorResponse(lastError);
}

// ============================================================
// ERROR HANDLING
// ============================================================

function getErrorResponse(error) {
  console.error('❌ API Error:', error);

  if (error.name === 'AbortError') {
    return {
      success: false,
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout. Cek koneksi internet Anda.',
    };
  }

  if (error.message.includes('Failed to fetch')) {
    return {
      success: false,
      code: 'CONNECTION_ERROR',
      message: 'Koneksi gagal. Periksa kembali URL API atau koneksi internet.',
    };
  }

  return {
    success: false,
    code: 'UNKNOWN_ERROR',
    message: 'Koneksi gagal: ' + error.message,
  };
}

// ============================================================
// PARAMETER VALIDATION
// ============================================================

function validateParams(action, params) {
  const rules = {
    login: (p) => p.email && p.password,
    changePassword: (p) => p.oldPassword && p.newPassword,
    createUser: (p) => p.name && p.email,
    updateUser: (p) => p.id && p.name,
    deleteUser: (p) => p.id,
    createSchedule: (p) => p.date && p.shift,
    updateSchedule: (p) => p.id && p.date,
    deleteSchedule: (p) => p.id,
    submitRequest: (p) => p.tipe && p.detail,
    rejectRequest: (p) => p.id && p.alasan,
  };

  if (rules[action]) {
    return rules[action](params);
  }

  return true; // No validation rule, assume valid
}

// ============================================================
// AUTH API
// ============================================================

const AuthAPI = {
  login: (email, password) => apiCall('login', { email, password }, false),
  changePassword: (oldPassword, newPassword) =>
    apiCall('changePassword', { oldPassword, newPassword }, false),
  logout: () => {
    clearCache();
    localStorage.removeItem('hotelToken');
    localStorage.removeItem('hotelUser');
  },
};

// ============================================================
// USER API
// ============================================================

const UserAPI = {
  getAll: () => apiCall('getUsers'),
  getProfile: () => apiCall('getProfile'),
  create: (data) => apiCall('createUser', data, false),
  update: (data) => apiCall('updateUser', data, false),
  delete: (id) => apiCall('deleteUser', { id }, false),
};

// ============================================================
// ATTENDANCE API
// ============================================================

const AttendanceAPI = {
  clockIn: (lat, lng, foto) => apiCall('clockIn', { lat, lng, foto }, false),
  clockOut: (lat, lng, foto) => apiCall('clockOut', { lat, lng, foto }, false),
  getTodayStatus: () => apiCall('getTodayStatus'),
  getHistory: (params = {}) => apiCall('getAttendance', params),
  getStats: (params = {}) => apiCall('getAttendanceStats', params),
};

// ============================================================
// SCHEDULE API
// ============================================================

const ScheduleAPI = {
  getAll: (params = {}) => apiCall('getSchedules', params),
  getMySchedule: (params = {}) => apiCall('getMySchedule', params),
  create: (data) => apiCall('createSchedule', data, false),
  update: (data) => apiCall('updateSchedule', data, false),
  delete: (id) => apiCall('deleteSchedule', { id }, false),
};

// ============================================================
// REQUEST API
// ============================================================

const RequestAPI = {
  submit: (tipe, detail, lampiran) => apiCall('submitRequest', { tipe, detail, lampiran }, false),
  getAll: (params = {}) => apiCall('getRequests', params),
  approve: (id) => apiCall('approveRequest', { id }, false),
  reject: (id, alasan) => apiCall('rejectRequest', { id, alasan }, false),
};

// ============================================================
// REPORT API
// ============================================================

const ReportAPI = {
  getDashboard: () => apiCall('getDashboard'),
  getReport: (params = {}) => apiCall('getReport', params),
  exportCSV: (params = {}) => apiCall('exportCSV', params, false),
};

// ============================================================
// LOG API
// ============================================================

const LogAPI = {
  getAll: (limit = 100) => apiCall('getLogs', { limit }),
};

// ============================================================
// NOTIFICATION API
// ============================================================

const NotificationAPI = {
  getAll: (limit = 50) => apiCall('getNotifications', { limit }),
  markAsRead: (id) => apiCall('markNotificationAsRead', { id }, false),
  delete: (id) => apiCall('deleteNotification', { id }, false),
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function isTokenValid() {
  const token = localStorage.getItem('hotelToken');
  return token != null;
}

function getStoredUser() {
  const userJson = localStorage.getItem('hotelUser');
  return userJson ? JSON.parse(userJson) : null;
}

function clearAllData() {
  AuthAPI.logout();
  clearCache();
}

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
  notification: NotificationAPI,
  config: API_CONFIG,
  utils: {
    isTokenValid,
    getStoredUser,
    clearAllData,
    clearCache,
  },
};
