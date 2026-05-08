// ============================================================
// camera.js - Camera Integration Module
// Hotel Attendance System
// ============================================================

const CameraModule = (() => {
  let stream = null;
  let videoEl = null;
  let canvasEl = null;
  let currentFacingMode = 'user'; // front camera default

  // ============================================================
  // INIT CAMERA
  // ============================================================

  async function init(videoElement, canvasElement) {
    videoEl = videoElement;
    canvasEl = canvasElement;
    return await startStream();
  }

  async function startStream(facingMode = 'user') {
    stopStream();
    currentFacingMode = facingMode;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoEl) {
        videoEl.srcObject = stream;
        await videoEl.play();
      }

      return { success: true };
    } catch (err) {
      let message = 'Kamera tidak dapat diakses';
      if (err.name === 'NotAllowedError') message = 'Izin kamera ditolak. Aktifkan izin kamera di browser.';
      else if (err.name === 'NotFoundError') message = 'Kamera tidak ditemukan di perangkat ini.';
      else if (err.name === 'NotReadableError') message = 'Kamera sedang digunakan oleh aplikasi lain.';
      return { success: false, message };
    }
  }

  // ============================================================
  // STOP STREAM
  // ============================================================

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (videoEl) videoEl.srcObject = null;
  }

  // ============================================================
  // CAPTURE PHOTO → BASE64
  // ============================================================

  function capturePhoto(quality = 0.7) {
    if (!videoEl || !canvasEl) {
      return { success: false, message: 'Kamera belum diinisialisasi' };
    }

    if (videoEl.readyState < 2) {
      return { success: false, message: 'Video belum siap' };
    }

    const width = videoEl.videoWidth || 640;
    const height = videoEl.videoHeight || 480;

    canvasEl.width = width;
    canvasEl.height = height;

    const ctx = canvasEl.getContext('2d');

    // Mirror flip for front camera
    if (currentFacingMode === 'user') {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, -width, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(videoEl, 0, 0, width, height);
    }

    // Add timestamp watermark
    const now = new Date();
    const timeStr = now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, height - 30, width, 30);
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`📍 ${timeStr}`, 8, height - 10);

    const base64 = canvasEl.toDataURL('image/jpeg', quality);
    return { success: true, base64, width, height };
  }

  // ============================================================
  // SWITCH CAMERA (front/back)
  // ============================================================

  async function switchCamera() {
    const newMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return await startStream(newMode);
  }

  // ============================================================
  // CHECK SUPPORT
  // ============================================================

  function isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // ============================================================
  // CREATE CAMERA UI COMPONENT
  // ============================================================

  function createCameraModal(onCapture) {
    const overlay = document.createElement('div');
    overlay.className = 'camera-overlay';
    overlay.innerHTML = `
      <div class="camera-modal glass-card">
        <div class="camera-header">
          <h3><i data-lucide="camera"></i> Foto Selfie</h3>
          <button class="btn-icon close-camera" id="closeCameraBtn">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="camera-body">
          <div class="video-container">
            <video id="cameraVideo" autoplay muted playsinline class="camera-video"></video>
            <canvas id="cameraCanvas" class="camera-canvas" style="display:none"></canvas>
            <div class="camera-frame-overlay">
              <div class="face-guide"></div>
            </div>
          </div>
          <div class="camera-status" id="cameraStatus">
            <span class="status-dot"></span> Mempersiapkan kamera...
          </div>
        </div>
        <div class="camera-controls">
          <button class="btn-icon switch-cam" id="switchCamBtn" title="Ganti Kamera">
            <i data-lucide="refresh-cw"></i>
          </button>
          <button class="btn-capture" id="captureBtn" disabled>
            <div class="capture-ring"></div>
            <div class="capture-dot"></div>
          </button>
          <button class="btn-icon retake-btn" id="retakeBtn" style="display:none" title="Ulangi">
            <i data-lucide="rotate-ccw"></i>
          </button>
        </div>
        <div class="captured-preview" id="capturedPreview" style="display:none">
          <img id="previewImg" alt="Foto selfie" />
          <div class="preview-actions">
            <button class="btn btn-secondary" id="retakeBtn2">
              <i data-lucide="rotate-ccw"></i> Ulangi
            </button>
            <button class="btn btn-primary" id="confirmBtn">
              <i data-lucide="check"></i> Gunakan Foto
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const video = overlay.querySelector('#cameraVideo');
    const canvas = overlay.querySelector('#cameraCanvas');
    const captureBtn = overlay.querySelector('#captureBtn');
    const switchBtn = overlay.querySelector('#switchCamBtn');
    const statusEl = overlay.querySelector('#cameraStatus');
    const preview = overlay.querySelector('#capturedPreview');
    const previewImg = overlay.querySelector('#previewImg');
    let capturedBase64 = null;

    // Init camera
    init(video, canvas).then(result => {
      if (result.success) {
        captureBtn.disabled = false;
        statusEl.innerHTML = '<span class="status-dot active"></span> Kamera aktif — Posisikan wajah Anda';
      } else {
        statusEl.innerHTML = `<span class="status-dot error"></span> ${result.message}`;
      }
    });

    // Capture
    captureBtn.addEventListener('click', () => {
      captureBtn.classList.add('flash');
      setTimeout(() => captureBtn.classList.remove('flash'), 300);

      const result = capturePhoto(0.7);
      if (result.success) {
        capturedBase64 = result.base64;
        previewImg.src = capturedBase64;
        preview.style.display = 'block';
        video.style.display = 'none';
        captureBtn.style.display = 'none';
        switchBtn.style.display = 'none';
      }
    });

    // Retake
    const handleRetake = () => {
      preview.style.display = 'none';
      video.style.display = 'block';
      captureBtn.style.display = 'flex';
      switchBtn.style.display = 'flex';
      capturedBase64 = null;
    };

    overlay.querySelector('#retakeBtn2')?.addEventListener('click', handleRetake);

    // Confirm
    overlay.querySelector('#confirmBtn')?.addEventListener('click', () => {
      if (capturedBase64 && onCapture) onCapture(capturedBase64);
      closeModal();
    });

    // Switch camera
    switchBtn.addEventListener('click', async () => {
      statusEl.innerHTML = '<span class="status-dot"></span> Mengganti kamera...';
      const result = await switchCamera();
      if (result.success) {
        statusEl.innerHTML = '<span class="status-dot active"></span> Kamera aktif';
      } else {
        statusEl.innerHTML = `<span class="status-dot error"></span> ${result.message}`;
      }
    });

    // Close
    const closeModal = () => {
      stopStream();
      overlay.remove();
    };

    overlay.querySelector('#closeCameraBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    // Reload lucide icons
    if (window.lucide) lucide.createIcons();

    return overlay;
  }

  return {
    init,
    startStream,
    stopStream,
    capturePhoto,
    switchCamera,
    isSupported,
    createCameraModal,
  };
})();

window.CameraModule = CameraModule;
