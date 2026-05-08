// ============================================================
// script.js - Main Application Logic
// Hotel Attendance System
// ============================================================

class HotelAttendanceApp {
  constructor() {
    this.currentUser = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  /**
   * Initialize Application
   */
  async init() {
    console.log('🚀 Initializing app...');
    this.setupEventListeners();
    this.checkOnlineStatus();
    
    // Small delay untuk memastikan DOM siap
    setTimeout(() => {
      this.checkAuthentication();
    }, 100);
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    console.log('📌 Setting up event listeners...');
    
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
      console.log('✅ Login form listener attached');
    } else {
      console.warn('⚠️ Login form not found');
    }

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
      console.log('✅ Logout button listener attached');
    }

    // Navigation Items
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 0) {
      navItems.forEach((btn) => {
        btn.addEventListener('click', (e) => this.handleNavigation(e));
      });
      console.log(`✅ ${navItems.length} nav items listener attached`);
    }

    // Online/Offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showAlert('✅ Kembali Online', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showAlert('❌ Tidak Ada Koneksi Internet', 'error');
    });
  }

  /**
   * Handle login
   */
  async handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt...');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    console.log(`Email: ${email}, Password: ${password}`);

    // Validation
    if (!this.validateEmail(email)) {
      this.showAlert('❌ Email tidak valid', 'error');
      return;
    }

    if (password.length < 6) {
      this.showAlert('❌ Password minimal 6 karakter', 'error');
      return;
    }

    if (!this.isOnline) {
      this.showAlert('⚠️ Mode offline - menggunakan demo data', 'info');
    }

    // Show loading
    const btn = document.querySelector('#login-form button');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Menghubungkan...';
    btn.disabled = true;

    try {
      let response;

      // Try API call if online
      if (this.isOnline && window.HotelAPI) {
        console.log('📡 Trying API call...');
        response = await HotelAPI.auth.login(email, password);
      } else {
        // Use mock data for demo
        console.log('📦 Using mock data for demo...');
        response = {
          success: true,
          token: 'demo-token-' + Date.now(),
          user: {
            id: 1,
            name: 'Demo User',
            email: email,
            role: 'Employee',
          }
        };
      }

      console.log('Response:', response);

      if (response && response.success) {
        // Save token dan user
        localStorage.setItem('hotelToken', response.token);
        localStorage.setItem('hotelUser', JSON.stringify(response.user));
        this.currentUser = response.user;

        console.log('✅ Login successful!');
        this.showAlert('✅ Login berhasil!', 'success');
        
        setTimeout(() => {
          this.showDashboard();
        }, 500);
      } else {
        const errorMsg = response?.message || 'Login gagal';
        console.error('❌ Login failed:', errorMsg);
        this.showAlert(`❌ ${errorMsg}`, 'error');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      this.showAlert(`❌ Error: ${err.message}`, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  /**
   * Check authentication status
   */
  checkAuthentication() {
    console.log('🔍 Checking authentication...');
    
    const token = localStorage.getItem('hotelToken');
    const user = localStorage.getItem('hotelUser');

    console.log('Token:', token ? '✅ Found' : '❌ Not found');
    console.log('User:', user ? '✅ Found' : '❌ Not found');

    if (token && user) {
      try {
        this.currentUser = JSON.parse(user);
        console.log('✅ User data loaded:', this.currentUser);
        this.showDashboard();
      } catch (err) {
        console.error('❌ Error parsing user:', err);
        this.showLogin();
      }
    } else {
      console.log('ℹ️ No authentication - showing login');
      this.showLogin();
    }
  }

  /**
   * Show login section
   */
  showLogin() {
    console.log('👁️ Showing login section');
    
    const loginSection = document.getElementById('login-section');
    const mainDashboard = document.getElementById('main-dashboard');
    
    if (loginSection) {
      loginSection.classList.remove('hidden');
      console.log('✅ Login section visible');
    }
    if (mainDashboard) {
      mainDashboard.classList.add('hidden');
      console.log('✅ Dashboard hidden');
    }
    
    // Clear form
    const form = document.getElementById('login-form');
    if (form) form.reset();
  }

  /**
   * Show dashboard
   */
  showDashboard() {
    console.log('👁️ Showing dashboard');
    
    const loginSection = document.getElementById('login-section');
    const mainDashboard = document.getElementById('main-dashboard');
    
    if (loginSection) {
      loginSection.classList.add('hidden');
      console.log('✅ Login section hidden');
    }
    if (mainDashboard) {
      mainDashboard.classList.remove('hidden');
      console.log('✅ Dashboard visible');
    }
    
    this.updateUserInfo();
    this.loadPage('home');
  }

  /**
   * Update user info in navbar
   */
  updateUserInfo() {
    console.log('📝 Updating user info...');
    
    if (this.currentUser) {
      const userNameEl = document.getElementById('user-name');
      const userRoleEl = document.getElementById('user-role');
      const avatarEl = document.getElementById('user-avatar');
      
      if (userNameEl) {
        userNameEl.textContent = this.currentUser.name || 'User';
        console.log('✅ User name updated');
      }
      if (userRoleEl) {
        userRoleEl.textContent = this.currentUser.role || 'Employee';
        console.log('✅ User role updated');
      }
      
      if (avatarEl) {
        const firstLetter = (this.currentUser.name || 'U').charAt(0).toUpperCase();
        avatarEl.textContent = firstLetter;
        console.log('✅ Avatar updated');
      }
    }
  }

  /**
   * Handle navigation
   */
  handleNavigation(e) {
    const page = e.currentTarget.dataset.page;
    console.log(`📄 Navigating to: ${page}`);
    
    // Update active button
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.remove('active-nav');
      btn.classList.add('opacity-50');
    });
    
    e.currentTarget.classList.add('active-nav');
    e.currentTarget.classList.remove('opacity-50');
    
    this.loadPage(page);
  }

  /**
   * Load page content
   */
  async loadPage(page) {
    console.log(`⏳ Loading page: ${page}`);
    
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
      console.error('❌ Content area not found');
      return;
    }
    
    contentArea.innerHTML = '<div class="text-center text-white">⏳ Memuat...</div>';

    try {
      switch (page) {
        case 'home':
          await this.renderHome();
          break;
        case 'attendance':
          await this.renderAttendance();
          break;
        case 'history':
          await this.renderHistory();
          break;
        case 'profile':
          await this.renderProfile();
          break;
        default:
          await this.renderHome();
      }
      console.log(`✅ Page ${page} loaded`);
    } catch (err) {
      console.error(`❌ Error loading page ${page}:`, err);
      contentArea.innerHTML = `<div class="text-red-300">❌ Error: ${err.message}</div>`;
    }
  }

  /**
   * Render Home Page
   */
  async renderHome() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    const response = {
      clockIn: '08:00 AM',
      clockOut: null,
      workingHours: '-',
    };
    
    let statusHtml = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white mb-6">📊 Dashboard Hari Ini</h2>
        
        <div class="glass-card p-6 rounded-2xl">
          <h3 class="text-white font-semibold mb-4">Status Kehadiran</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-white">
              <span>Clock In:</span>
              <span class="font-bold">${response.clockIn ? response.clockIn : '⏳ Belum'}</span>
            </div>
            <div class="flex justify-between text-white">
              <span>Clock Out:</span>
              <span class="font-bold">${response.clockOut ? response.clockOut : '⏳ Belum'}</span>
            </div>
            <div class="flex justify-between text-white border-t border-white border-opacity-20 pt-3">
              <span>Total Jam Kerja:</span>
              <span class="font-bold text-green-300">${response.workingHours || '-'}</span>
            </div>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
          <h3 class="text-white font-semibold mb-4">🎯 Aksi Cepat</h3>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="app.quickAction('clockIn')" class="glass-btn py-3 rounded-xl text-white font-semibold hover:bg-white hover:bg-opacity-20">
              ⏰ Clock In
            </button>
            <button onclick="app.quickAction('clockOut')" class="glass-btn py-3 rounded-xl text-white font-semibold hover:bg-white hover:bg-opacity-20">
              🔔 Clock Out
            </button>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
          <h3 class="text-white font-semibold mb-4">📌 Informasi Penting</h3>
          <p class="text-blue-100 text-sm leading-relaxed">
            Selamat datang di sistem absensi hotel. Pastikan Anda melakukan clock in dan clock out tepat waktu setiap harinya.
          </p>
        </div>
      </div>
    `;
    
    contentArea.innerHTML = statusHtml;
  }

  /**
   * Render Attendance Page
   */
  async renderAttendance() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white mb-6">📸 Absensi</h2>
        
        <div class="glass-card p-6 rounded-2xl text-center">
          <div id="camera-preview" class="w-full h-64 bg-black rounded-xl mb-4 flex items-center justify-center text-white">
            <span>📷 Preview Kamera (Development)</span>
          </div>
          
          <div class="space-y-3">
            <button onclick="app.clockInAction()" class="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">
              ✅ Clock In dengan Foto
            </button>
            <button onclick="app.clockOutAction()" class="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition">
              ❌ Clock Out dengan Foto
            </button>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
          <h3 class="text-white font-semibold mb-3">📍 Informasi Lokasi</h3>
          <div id="location-info" class="text-blue-100 text-sm space-y-2">
            <p>Mengambil lokasi...</p>
          </div>
        </div>
      </div>
    `;

    // Get location
    try {
      const locationInfo = await initLocationServices();
      if (locationInfo && locationInfo.success) {
        const locationHtml = `
          <p><strong>Lat:</strong> ${locationInfo.latitude.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${locationInfo.longitude.toFixed(6)}</p>
          <p><strong>Akurasi:</strong> ${locationInfo.accuracy}</p>
        `;
        const locEl = document.getElementById('location-info');
        if (locEl) locEl.innerHTML = locationHtml;
      } else {
        const locEl = document.getElementById('location-info');
        if (locEl) locEl.innerHTML = '<p class="text-yellow-300">⚠️ Lokasi tidak tersedia</p>';
      }
    } catch (err) {
      console.error('Location error:', err);
      const locEl = document.getElementById('location-info');
      if (locEl) locEl.innerHTML = `<p class="text-red-300">❌ ${err.message}</p>`;
    }
  }

  /**
   * Clock In Action
   */
  async clockInAction() {
    this.showAlert('📸 Fitur Clock In sedang dikembangkan', 'info');
  }

  /**
   * Clock Out Action
   */
  async clockOutAction() {
    this.showAlert('📸 Fitur Clock Out sedang dikembangkan', 'info');
  }

  /**
   * Render History Page
   */
  async renderHistory() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    const response = {
      data: [
        { date: '2026-05-08', clockIn: '08:00 AM', clockOut: '05:00 PM', status: 'present' },
        { date: '2026-05-07', clockIn: '08:15 AM', clockOut: '05:30 PM', status: 'present' },
        { date: '2026-05-06', clockIn: '08:00 AM', clockOut: '05:00 PM', status: 'present' },
      ]
    };
    
    let historyHtml = `
      <h2 class="text-2xl font-bold text-white mb-6">📋 Riwayat Absensi</h2>
      <div class="space-y-3">
    `;

    if (response.data && response.data.length > 0) {
      response.data.forEach((record) => {
        historyHtml += `
          <div class="glass-card p-4 rounded-xl">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-white font-semibold">${record.date || 'N/A'}</p>
                <p class="text-blue-200 text-sm">In: ${record.clockIn || '-'} | Out: ${record.clockOut || '-'}</p>
              </div>
              <span class="text-2xl">${record.status === 'present' ? '✅' : '❌'}</span>
            </div>
          </div>
        `;
      });
    } else {
      historyHtml += '<p class="text-blue-200">Belum ada riwayat absensi</p>';
    }

    historyHtml += '</div>';
    contentArea.innerHTML = historyHtml;
  }

  /**
   * Render Profile Page
   */
  async renderProfile() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    const profileHtml = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white mb-6">👤 Profil Saya</h2>
        
        <div class="glass-card p-6 rounded-2xl text-center">
          <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center font-bold text-purple-900 mx-auto mb-4 text-2xl">
            ${(this.currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <h3 class="text-white text-xl font-bold mb-2">${this.currentUser?.name || 'User'}</h3>
          <p class="text-blue-200 mb-4">${this.currentUser?.email || 'email@example.com'}</p>
          <p class="text-blue-100"><strong>Jabatan:</strong> ${this.currentUser?.role || 'Employee'}</p>
        </div>

        <div class="glass-card p-6 rounded-2xl space-y-3">
          <h3 class="text-white font-semibold mb-4">⚙️ Pengaturan</h3>
          <button onclick="app.changePassword()" class="w-full py-3 glass-btn text-white rounded-xl hover:bg-white hover:bg-opacity-20">
            🔐 Ubah Password
          </button>
          <button onclick="app.logout()" class="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">
            🚪 Logout
          </button>
        </div>
      </div>
    `;

    contentArea.innerHTML = profileHtml;
  }

  /**
   * Quick action handler
   */
  async quickAction(action) {
    if (action === 'clockIn') {
      this.clockInAction();
    } else if (action === 'clockOut') {
      this.clockOutAction();
    }
  }

  /**
   * Change password
   */
  changePassword() {
    const oldPassword = prompt('Masukkan password lama:');
    if (!oldPassword) return;

    const newPassword = prompt('Masukkan password baru (minimal 6 karakter):');
    if (!newPassword || newPassword.length < 6) {
      this.showAlert('❌ Password minimal 6 karakter', 'error');
      return;
    }

    const confirmPassword = prompt('Konfirmasi password baru:');
    if (newPassword !== confirmPassword) {
      this.showAlert('❌ Password tidak cocok', 'error');
      return;
    }

    this.showAlert('✅ Password berhasil diubah (demo)', 'success');
  }

  /**
   * Logout
   */
  logout() {
    if (!confirm('Yakin ingin logout?')) return;

    localStorage.removeItem('hotelToken');
    localStorage.removeItem('hotelUser');
    this.currentUser = null;
    
    console.log('🚪 Logout successful');
    this.showLogin();
    this.showAlert('✅ Logout berhasil', 'success');
  }

  /**
   * Show alert message
   */
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-semibold max-w-sm z-50 animate-bounce`;

    if (type === 'success') {
      alertDiv.style.backgroundColor = '#10b981';
    } else if (type === 'error') {
      alertDiv.style.backgroundColor = '#ef4444';
    } else {
      alertDiv.style.backgroundColor = '#3b82f6';
    }

    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    console.log(`[${type.toUpperCase()}] ${message}`);

    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Check online status
   */
  checkOnlineStatus() {
    this.isOnline = navigator.onLine;
    console.log(`📡 Online status: ${this.isOnline ? '✅ Online' : '❌ Offline'}`);
    if (!this.isOnline) {
      this.showAlert('⚠️ Anda sedang offline', 'error');
    }
  }
}

// ==================== INITIALIZE ====================

console.log('📦 Starting application...');
const app = new HotelAttendanceApp();
window.app = app;
console.log('✅ Application ready! app = ', app);
