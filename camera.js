// ============================================================
// camera.js - Camera Handler
// Hotel Attendance System
// ============================================================

class CameraHandler {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.isCameraActive = false;
  }

  /**
   * Request camera permission and open camera
   */
  async openCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera tidak didukung oleh browser ini');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.isCameraActive = true;
      return { success: true, message: 'Camera berhasil dibuka' };
    } catch (err) {
      console.error('Camera error:', err);
      return {
        success: false,
        message: this.getCameraError(err),
      };
    }
  }

  /**
   * Capture photo from video stream
   */
  capturePhoto() {
    if (!this.stream) {
      return { success: false, message: 'Camera tidak aktif' };
    }

    try {
      const video = document.querySelector('video');
      if (!video) {
        return { success: false, message: 'Video element tidak ditemukan' };
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);

      const photoData = canvas.toDataURL('image/jpeg', 0.8);

      return {
        success: true,
        photo: photoData,
        timestamp: new Date(),
      };
    } catch (err) {
      console.error('Capture error:', err);
      return {
        success: false,
        message: 'Gagal mengambil foto: ' + err.message,
      };
    }
  }

  /**
   * Close camera
   */
  closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
      this.isCameraActive = false;
    }
  }

  /**
   * Clock In with photo
   */
  async clockInWithPhoto() {
    try {
      // Open camera
      const cameraResult = await this.openCamera();
      if (!cameraResult.success) {
        throw new Error(cameraResult.message);
      }

      // Get location
      const locationResult = await initLocationServices();
      if (!locationResult || !locationResult.success) {
        this.closeCamera();
        throw new Error('Gagal mendapatkan lokasi');
      }

      // Show camera modal
      this.showCameraModal('clockIn', locationResult);
    } catch (err) {
      if (window.app) {
        window.app.showAlert(`❌ ${err.message}`, 'error');
      }
    }
  }

  /**
   * Clock Out with photo
   */
  async clockOutWithPhoto() {
    try {
      // Open camera
      const cameraResult = await this.openCamera();
      if (!cameraResult.success) {
        throw new Error(cameraResult.message);
      }

      // Get location
      const locationResult = await initLocationServices();
      if (!locationResult || !locationResult.success) {
        this.closeCamera();
        throw new Error('Gagal mendapatkan lokasi');
      }

      // Show camera modal
      this.showCameraModal('clockOut', locationResult);
    } catch (err) {
      if (window.app) {
        window.app.showAlert(`❌ ${err.message}`, 'error');
      }
    }
  }

  /**
   * Show camera modal
   */
  showCameraModal(action, locationData) {
    const modalHtml = `
      <div id="camera-modal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl p-6 max-w-md w-full mx-4">
          <h2 class="text-2xl font-bold text-white mb-4 text-center">
            ${action === 'clockIn' ? '📸 Clock In' : '📸 Clock Out'}
          </h2>
          
          <video id="camera-stream" autoplay playsinline class="w-full h-64 bg-black rounded-xl mb-4"></video>
          
          <div class="space-y-3">
            <button id="capture-btn" class="w-full py-3 bg-white text-purple-900 font-bold rounded-xl hover:bg-opacity-90">
              📷 Ambil Foto
            </button>
            <button id="cancel-btn" class="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
              ❌ Batal
            </button>
          </div>
          
          <div class="mt-4 p-3 bg-white bg-opacity-10 rounded-lg text-blue-100 text-sm">
            <p><strong>📍 Lokasi:</strong> ${locationData.coordinates}</p>
            <p><strong>🎯 Akurasi:</strong> ${locationData.accuracy}</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Attach video stream
    const videoElement = document.getElementById('camera-stream');
    if (videoElement && this.stream) {
      videoElement.srcObject = this.stream;
    }

    // Handle capture
    document.getElementById('capture-btn').addEventListener('click', async () => {
      const photoResult = this.capturePhoto();
      if (photoResult.success) {
        await this.submitAttendance(
          action,
          photoResult.photo,
          locationData.latitude,
          locationData.longitude
        );
        this.closeCameraModal();
      }
    });

    // Handle cancel
    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeCameraModal();
    });
  }

  /**
   * Close camera modal
   */
  closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    if (modal) {
      modal.remove();
    }
    this.closeCamera();
  }

  /**
   * Submit attendance data
   */
  async submitAttendance(action, photo, latitude, longitude) {
    try {
      if (window.app) {
        window.app.showAlert('⏳ Mengirim data...', 'info');
      }

      let response;
      if (action === 'clockIn') {
        response = await HotelAPI.attendance.clockIn(latitude, longitude, photo);
      } else {
        response = await HotelAPI.attendance.clockOut(latitude, longitude, photo);
      }

      if (response.success) {
        if (window.app) {
          window.app.showAlert(`✅ ${action === 'clockIn' ? 'Clock In' : 'Clock Out'} berhasil!`, 'success');
          window.app.loadPage('home');
        }
      } else {
        if (window.app) {
          window.app.showAlert(`❌ ${response.message}`, 'error');
        }
      }
    } catch (err) {
      if (window.app) {
        window.app.showAlert(`❌ Error: ${err.message}`, 'error');
      }
    }
  }

  /**
   * Get camera error message
   */
  getCameraError(error) {
    if (error.name === 'NotAllowedError') {
      return 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.';
    } else if (error.name === 'NotFoundError') {
      return 'Kamera tidak ditemukan di perangkat ini.';
    } else if (error.name === 'NotSupportedError') {
      return 'Browser tidak mendukung akses kamera.';
    } else if (error.name === 'NotReadableError') {
      return 'Kamera sedang digunakan oleh aplikasi lain.';
    } else {
      return 'Error kamera: ' + error.message;
    }
  }
}

// ==================== INITIALIZE ====================

const camera = new CameraHandler();
window.camera = camera; // Make it globally accessible
