// ============================================================
// location.js - Geolocation Module
// Hotel Attendance System
// ============================================================

const LocationModule = (() => {
  // ============================================================
  // HOTEL COORDINATES (Override via API_CONFIG or set here)
  // ============================================================
  const HOTEL_CONFIG = {
    lat: -6.200000,    // ← Ganti dengan latitude hotel Anda
    lng: 106.816666,   // ← Ganti dengan longitude hotel Anda
    radius: 50,        // radius dalam meter
    name: 'Hotel Lokasi Kerja',
  };

  let lastPosition = null;
  let watchId = null;

  // ============================================================
  // HAVERSINE FORMULA
  // Menghitung jarak antara dua titik koordinat dalam meter
  // ============================================================

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius bumi dalam meter
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
      + Math.cos(φ1) * Math.cos(φ2)
      * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // jarak dalam meter
  }

  // ============================================================
  // CHECK IF USER IS WITHIN RADIUS
  // ============================================================

  function isWithinRadius(userLat, userLng, config = HOTEL_CONFIG) {
    const distance = haversineDistance(userLat, userLng, config.lat, config.lng);
    return {
      isValid: distance <= config.radius,
      distance: Math.round(distance),
      maxRadius: config.radius,
    };
  }

  // ============================================================
  // GET CURRENT POSITION (Promise-based)
  // ============================================================

  function getCurrentPosition(highAccuracy = true) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini'));
        return;
      }

      const options = {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          lastPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(lastPosition);
        },
        (error) => {
          let message = 'Gagal mendapatkan lokasi';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Izin lokasi ditolak. Aktifkan GPS di browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
              break;
            case error.TIMEOUT:
              message = 'Timeout mendapatkan lokasi. Coba lagi.';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  // ============================================================
  // VALIDATE LOCATION FOR ATTENDANCE
  // Returns: { valid, distance, lat, lng, message }
  // ============================================================

  async function validateAttendanceLocation() {
    try {
      const position = await getCurrentPosition(true);
      const check = isWithinRadius(position.lat, position.lng);

      return {
        valid: check.isValid,
        distance: check.distance,
        maxRadius: check.maxRadius,
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        message: check.isValid
          ? `✓ Anda berada ${check.distance}m dari lokasi kerja`
          : `✗ Anda berada ${check.distance}m dari lokasi kerja (maks. ${check.maxRadius}m)`,
      };
    } catch (err) {
      return {
        valid: false,
        distance: null,
        lat: null,
        lng: null,
        message: err.message,
      };
    }
  }

  // ============================================================
  // WATCH POSITION (continuous)
  // ============================================================

  function startWatch(onUpdate) {
    if (!navigator.geolocation) return;
    stopWatch();

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        lastPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        const check = isWithinRadius(lastPosition.lat, lastPosition.lng);
        if (onUpdate) onUpdate({ ...lastPosition, ...check });
      },
      (err) => console.warn('Location watch error:', err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // ============================================================
  // UI COMPONENT: Location Status Widget
  // ============================================================

  function createLocationWidget(container) {
    const widget = document.createElement('div');
    widget.className = 'location-widget';
    widget.innerHTML = `
      <div class="location-status checking">
        <div class="loc-icon">
          <div class="loc-pulse"></div>
          <i data-lucide="map-pin"></i>
        </div>
        <div class="loc-info">
          <span class="loc-label">Memeriksa lokasi...</span>
          <span class="loc-detail" id="locDetail">Mohon aktifkan GPS</span>
        </div>
        <div class="loc-badge" id="locBadge">
          <i data-lucide="loader-2" class="spinning"></i>
        </div>
      </div>
      <div class="distance-bar" id="distanceBar" style="display:none">
        <div class="distance-fill" id="distanceFill"></div>
        <span class="distance-label" id="distanceLabel"></span>
      </div>
    `;

    if (container) container.appendChild(widget);
    if (window.lucide) lucide.createIcons();
    return widget;
  }

  function updateLocationWidget(widget, result) {
    const statusEl = widget.querySelector('.location-status');
    const detailEl = widget.querySelector('#locDetail');
    const badgeEl = widget.querySelector('#locBadge');
    const barEl = widget.querySelector('#distanceBar');
    const fillEl = widget.querySelector('#distanceFill');
    const labelEl = widget.querySelector('#distanceLabel');
    const iconEl = widget.querySelector('.loc-icon');

    if (!statusEl) return;

    statusEl.className = 'location-status ' + (result.valid ? 'valid' : 'invalid');

    if (detailEl) detailEl.textContent = result.message;

    if (badgeEl) {
      badgeEl.innerHTML = result.valid
        ? '<i data-lucide="check-circle"></i>'
        : '<i data-lucide="x-circle"></i>';
    }

    if (result.distance !== null && barEl) {
      barEl.style.display = 'block';
      const pct = Math.min(100, (result.distance / HOTEL_CONFIG.radius) * 100);
      if (fillEl) {
        fillEl.style.width = pct + '%';
        fillEl.style.background = result.valid
          ? 'linear-gradient(90deg, #10b981, #34d399)'
          : 'linear-gradient(90deg, #ef4444, #f87171)';
      }
      if (labelEl) labelEl.textContent = `${result.distance}m / ${HOTEL_CONFIG.radius}m`;
    }

    if (window.lucide) lucide.createIcons();
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  return {
    haversineDistance,
    isWithinRadius,
    getCurrentPosition,
    validateAttendanceLocation,
    startWatch,
    stopWatch,
    createLocationWidget,
    updateLocationWidget,
    getLastPosition: () => lastPosition,
    config: HOTEL_CONFIG,
  };
})();

window.LocationModule = LocationModule;
