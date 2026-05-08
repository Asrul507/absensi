// ============================================================
// HOSPITALITY ATTENDANCE SYSTEM - Camera Module
// File: camera.js
// ============================================================

const Camera = (() => {
  let stream = null;
  let videoElement = null;
  let canvasElement = null;

  // ============================================================
  // INITIALIZE CAMERA
  // ============================================================
  async function init(videoId = 'camera-video', canvasId = 'camera-canvas') {
    videoElement = document.getElementById(videoId);
    canvasElement = document.getElementById(canvasId);

    if (!videoElement || !canvasElement) {
      throw new Error('Elemen kamera tidak ditemukan di halaman');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser tidak mendukung kamera. Gunakan HTTPS.');
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      videoElement.srcObject = stream;
      await videoElement.play();
      return true;
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Akses kamera ditolak. Izinkan akses kamera di browser Anda.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        throw new Error('Gagal mengakses kamera: ' + error.message);
      }
    }
  }

  // ============================================================
  // CAPTURE PHOTO -> BASE64
  // ============================================================
  function capture(quality = 0.7) {
    if (!videoElement || !canvasElement) {
      throw new Error('Kamera belum diinisialisasi');
    }

    const ctx = canvasElement.getContext('2d');
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Mirror the image (selfie mode)
    ctx.translate(canvasElement.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvasElement.toDataURL('image/jpeg', quality);
  }

  // ============================================================
  // STOP CAMERA STREAM
  // ============================================================
  function stop() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  // ============================================================
  // CHECK CAMERA AVAILABILITY
  // ============================================================
  async function checkAvailability() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      return cameras.length > 0;
    } catch {
      return false;
    }
  }

  // ============================================================
  // GET CAMERA STATUS
  // ============================================================
  function isActive() {
    return stream !== null && stream.active;
  }

  return { init, capture, stop, checkAvailability, isActive };
})();
