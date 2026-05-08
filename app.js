// ============================================================
// app.js - Main Application Logic
// Hotel Attendance System
// ============================================================

class HotelApp {
  constructor() {
    this.currentPage = 'home';
    this.currentUser = null;
  }

  // ============================================================
  // INIT
  // ============================================================

  async init() {
    console.log('🚀 App initialized');

    const storedUser = this.getStoredUser();
    const token = localStorage.getItem('hotelToken');

    if (storedUser && token) {
      this.currentUser = storedUser;
      this.showDashboard();
      this.loadPage('home');
    } else {
      this.showLogin();
    }

    this.bindLoginForm();
    this.bindLogout();
    this.bindNavigation();

    if (window.lucide) lucide.createIcons();
  }

  // ============================================================
  // AUTH
  // ============================================================

  bindLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.showAlert('Email dan password wajib diisi!', 'error');
      return;
    }

    this.setLoginLoading(true);

    try {
      const response = await HotelAPI.auth.login(email, password);

      if (response && response.success) {
        const token = response.token || response.data?.token || 'valid';
        const user = response.user || response.data;

        localStorage.setItem('hotelToken', token);
        localStorage.setItem('hotelUser', JSON.stringify(user));
        this.currentUser = user;

        this.showAlert('✅ Login berhasil!', 'success');
        setTimeout(() => {
          this.showDashboard();
          this.loadPage('home');
        }, 800);
      } else {
        this.showAlert('❌ ' + (response?.message || 'Email atau password salah!'), 'error');
      }
    } catch (err) {
      this.showAlert('❌ Gagal terhubung ke server.', 'error');
    }

    this.setLoginLoading(false);
  }

  bindLogout() {
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (confirm('Yakin ingin keluar?')) {
        HotelAPI.auth.logout();
        this.currentUser = null;
        this.showLogin();
      }
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        this.loadPage(page);
        navItems.forEach((n) => { n.classList.remove('active-nav'); n.classList.add('opacity-50'); });
        item.classList.add('active-nav');
        item.classList.remove('opacity-50');
      });
    });
  }

  loadPage(page) {
    this.currentPage = page;
    const content = document.getElementById('content-area');
    if (!content) return;

    switch (page) {
      case 'home': this.renderHome(content); break;
      case 'attendance': this.renderAttendance(content); break;
      case 'history': this.renderHistory(content); break;
      case 'profile': this.renderProfile(content); break;
      default: this.renderHome(content);
    }

    if (window.lucide) lucide.createIcons();
  }

  // ============================================================
  // SHOW / HIDE
  // ============================================================

  showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('login-form')?.reset();
  }

  showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');

    if (this.currentUser) {
      const name = this.currentUser.name || this.currentUser.nama || 'Karyawan';
      const role = this.currentUser.role || this.currentUser.jabatan || 'Staff';
      document.getElementById('user-name').textContent = name;
      document.getElementById('user-role').textContent = role;
      document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
    }
  }

  // ============================================================
  // PAGE: HOME
  // ============================================================

  async renderHome(content) {
    const user = this.currentUser || {};
    const name = user.name || user.nama || 'Karyawan';
    const now = new Date();
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const tanggal = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    content.innerHTML = `
      <div class="space-y-4">
        <div class="text-white">
          <h2 class="text-2xl font-bold">Halo, ${name}! 👋</h2>
          <p class="text-blue-200 opacity-70 text-sm">${tanggal}</p>
          <p id="live-clock" class="text-white text-3xl font-bold mt-1">${jam}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl">
          <p class="text-white opacity-70 text-sm mb-2">Status Hari Ini</p>
          <div id="status-content"><p class="text-blue-200">⏳ Memuat status...</p></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button id="btn-clockin" class="glass-btn p-4 rounded-2xl text-white text-center hover:scale-95 transition-all">
            <div class="text-3xl mb-2">🟢</div>
            <div class="font-bold">Clock In</div>
            <div class="text-xs opacity-70">Absen Masuk</div>
          </button>
          <button id="btn-clockout" class="glass-btn p-4 rounded-2xl text-white text-center hover:scale-95 transition-all">
            <div class="text-3xl mb-2">🔴</div>
            <div class="font-bold">Clock Out</div>
            <div class="text-xs opacity-70">Absen Keluar</div>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="glass-card p-3 rounded-xl text-center">
            <p class="text-blue-200 text-xs">Jabatan</p>
            <p class="text-white font-bold">${user.role || user.jabatan || '-'}</p>
          </div>
          <div class="glass-card p-3 rounded-xl text-center">
            <p class="text-blue-200 text-xs">Departemen</p>
            <p class="text-white font-bold">${user.department || user.departemen || '-'}</p>
          </div>
        </div>
      </div>
    `;

    // Live clock
    setInterval(() => {
      const el = document.getElementById('live-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }, 1000);

    this.loadTodayStatus();

    document.getElementById('btn-clockin')?.addEventListener('click', () => {
      window.camera?.clockInWithPhoto();
    });
    document.getElementById('btn-clockout')?.addEventListener('click', () => {
      window.camera?.clockOutWithPhoto();
    });
  }

  async loadTodayStatus() {
    const el = document.getElementById('status-content');
    if (!el) return;
    try {
      const res = await HotelAPI.attendance.getTodayStatus();
      if (res && res.success) {
        const d = res.data || res;
        el.innerHTML = `
          <div class="flex justify-between text-white">
            <div><p class="text-xs text-blue-200">Clock In</p><p class="font-bold text-green-300">${d.clockIn || d.jam_masuk || '-'}</p></div>
            <div><p class="text-xs text-blue-200">Clock Out</p><p class="font-bold text-red-300">${d.clockOut || d.jam_keluar || '-'}</p></div>
            <div><p class="text-xs text-blue-200">Status</p><p class="font-bold text-yellow-300">${d.status || 'Hadir'}</p></div>
          </div>`;
      } else {
        el.innerHTML = `<p class="text-yellow-300">⚠️ Belum ada absensi hari ini</p>`;
      }
    } catch {
      el.innerHTML = `<p class="text-red-300">❌ Gagal memuat status</p>`;
    }
  }

  // ============================================================
  // PAGE: ATTENDANCE
  // ============================================================

  renderAttendance(content) {
    content.innerHTML = `
      <div class="space-y-4 text-white">
        <h2 class="text-2xl font-bold">📸 Absensi</h2>
        <p class="text-blue-200 text-sm">Pilih jenis absensi</p>
        <button id="att-clockin" class="w-full glass-btn p-5 rounded-2xl text-left hover:scale-95 transition-all">
          <div class="flex items-center gap-4">
            <span class="text-4xl">🟢</span>
            <div><p class="font-bold text-lg">Clock In</p><p class="text-blue-200 text-sm">Absen masuk kerja</p></div>
          </div>
        </button>
        <button id="att-clockout" class="w-full glass-btn p-5 rounded-2xl text-left hover:scale-95 transition-all">
          <div class="flex items-center gap-4">
            <span class="text-4xl">🔴</span>
            <div><p class="font-bold text-lg">Clock Out</p><p class="text-blue-200 text-sm">Absen keluar kerja</p></div>
          </div>
        </button>
        <div class="glass-card p-4 rounded-2xl text-sm text-blue-200">
          <p>⚠️ Pastikan:</p>
          <p>• Izin kamera diaktifkan</p>
          <p>• GPS/Lokasi diaktifkan</p>
          <p>• Koneksi internet stabil</p>
        </div>
      </div>
    `;

    document.getElementById('att-clockin')?.addEventListener('click', () => window.camera?.clockInWithPhoto());
    document.getElementById('att-clockout')?.addEventListener('click', () => window.camera?.clockOutWithPhoto());
  }

  // ============================================================
  // PAGE: HISTORY
  // ============================================================

  async renderHistory(content) {
    content.innerHTML = `
      <div class="space-y-4 text-white">
        <h2 class="text-2xl font-bold">📋 Riwayat Absensi</h2>
        <div id="history-list"><p class="text-blue-200">⏳ Memuat riwayat...</p></div>
      </div>
    `;

    try {
      const res = await HotelAPI.attendance.getHistory();
      const el = document.getElementById('history-list');
      if (!el) return;

      if (res && res.success && res.data?.length > 0) {
        el.innerHTML = res.data.map((item) => `
          <div class="glass-card p-4 rounded-xl mb-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-bold">${item.tanggal || item.date || '-'}</p>
                <p class="text-sm text-blue-200">Masuk: ${item.jam_masuk || item.clockIn || '-'}</p>
                <p class="text-sm text-blue-200">Keluar: ${item.jam_keluar || item.clockOut || '-'}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold ${this.getStatusColor(item.status)}">${item.status || 'Hadir'}</span>
            </div>
          </div>
        `).join('');
      } else {
        el.innerHTML = `<p class="text-blue-200">Belum ada riwayat absensi.</p>`;
      }
    } catch (err) {
      document.getElementById('history-list').innerHTML = `<p class="text-red-300">❌ Gagal memuat riwayat</p>`;
    }
  }

  getStatusColor(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('hadir') || s.includes('present')) return 'bg-green-500 text-white';
    if (s.includes('telat') || s.includes('late')) return 'bg-yellow-500 text-black';
    if (s.includes('absen') || s.includes('absent')) return 'bg-red-500 text-white';
    return 'bg-blue-500 text-white';
  }

  // ============================================================
  // PAGE: PROFILE
  // ============================================================

  renderProfile(content) {
    const user = this.currentUser || {};
    const name = user.name || user.nama || '-';
    content.innerHTML = `
      <div class="space-y-4 text-white">
        <h2 class="text-2xl font-bold">👤 Profil Saya</h2>
        <div class="glass-card p-6 rounded-2xl text-center">
          <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center text-purple-900 text-3xl font-bold mx-auto mb-4">
            ${name.charAt(0).toUpperCase()}
          </div>
          <h3 class="text-xl font-bold">${name}</h3>
          <p class="text-blue-200">${user.role || user.jabatan || '-'}</p>
          <p class="text-blue-200 text-sm">${user.email || '-'}</p>
        </div>
        <div class="glass-card p-4 rounded-2xl space-y-3">
          <div class="flex justify-between">
            <span class="text-blue-200">ID Karyawan</span>
            <span class="font-bold">${user.id || user.employeeId || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-blue-200">Departemen</span>
            <span class="font-bold">${user.department || user.departemen || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-blue-200">Shift</span>
            <span class="font-bold">${user.shift || '-'}</span>
          </div>
        </div>
        <button id="btn-logout-profile" class="w-full py-4 bg-red-600 text-white font-bold rounded-2xl">
          🚪 Keluar
        </button>
      </div>
    `;

    document.getElementById('btn-logout-profile')?.addEventListener('click', () => {
      if (confirm('Yakin ingin keluar?')) {
        HotelAPI.auth.logout();
        this.currentUser = null;
        this.showLogin();
      }
    });
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  showAlert(message, type = 'info') {
    document.getElementById('app-alert')?.remove();

    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    const el = document.createElement('div');
    el.id = 'app-alert';
    el.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-white font-bold shadow-xl ${colors[type] || colors.info}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  setLoginLoading(isLoading) {
    const btn = document.querySelector('#login-form button[type="submit"]');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? '⏳ Memproses...' : 'MASUK KE SISTEM';
  }

  getStoredUser() {
    try {
      const u = localStorage.getItem('hotelUser');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }
}

// ============================================================
// START
// ============================================================

const app = new HotelApp();
window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());