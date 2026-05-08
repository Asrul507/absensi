// ============================================================
// HOSPITALITY ATTENDANCE SYSTEM - Location Module
// File: location.js
// ============================================================

const Location = (() => {
  // ============================================================
  // HOTEL COORDINATES - Ganti sesuai lokasi hotel Anda
  // ============================================================
  const HOTEL_COORDS = {
    lat: -6.200000,   // Latitude hotel (ganti!)
    lng: 106.816666,  // Longitude hotel (ganti!)
    radius: 50,       // Radius dalam meter (default: 50m)
    name: 'Hotel Grand Nusantara' // Nama lokasi
  };

  let watchId = null;
  let lastPosition = null;

  // ============================================================
  // HAVERSINE FORMULA - Jarak antara dua titik GPS
  // ============================================================
  function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Jarak dalam meter
  }

  function toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // ============================================================
  // GET CURRENT POSITION
  // ============================================================
  function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser ini'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          lastPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          resolve(lastPosition);
        },
        (error) => {
          let message;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Akses lokasi ditolak. Izinkan akses lokasi di browser Anda.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Informasi lokasi tidak tersedia.';
              break;
            case error.TIMEOUT:
              message = 'Permintaan lokasi timeout. Pastikan GPS aktif.';
              break;
            default:
              message = 'Terjadi kesalahan saat mengambil lokasi.';
          }
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }

  // ============================================================
  // VALIDATE GEOFENCE
  // ============================================================
  async function validateGeofence() {
    try {
      const position = await getCurrentPosition();
      const distance = haversineDistance(
        position.lat, position.lng,
        HOTEL_COORDS.lat, HOTEL_COORDS.lng
      );

      const isInside = distance <= HOTEL_COORDS.radius;
      return {
        success: true,
        isInside,
        distance: Math.round(distance),
        position,
        hotelCoords: HOTEL_COORDS,
        message: isInside
          ? `Anda berada dalam area ${HOTEL_COORDS.name} (${Math.round(distance)}m)`
          : `Anda berada ${Math.round(distance)}m dari ${HOTEL_COORDS.name}. Harus berada dalam radius ${HOTEL_COORDS.radius}m.`
      };
    } catch (error) {
      return {
        success: false,
        isInside: false,
        message: error.message
      };
    }
  }

  // ============================================================
  // WATCH POSITION (Real-time tracking)
  // ============================================================
  function watchPosition(callback) {
    if (!navigator.geolocation) return;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        lastPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        const distance = haversineDistance(
          lastPosition.lat, lastPosition.lng,
          HOTEL_COORDS.lat, HOTEL_COORDS.lng
        );
        callback({ ...lastPosition, distance: Math.round(distance), isInside: distance <= HOTEL_COORDS.radius });
      },
      (error) => console.warn('Location watch error:', error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  // ============================================================
  // STOP WATCHING
  // ============================================================
  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // ============================================================
  // GET HOTEL CONFIG (for admin override)
  // ============================================================
  function getHotelConfig() {
    return { ...HOTEL_COORDS };
  }

  function setHotelConfig(lat, lng, radius, name) {
    HOTEL_COORDS.lat = lat;
    HOTEL_COORDS.lng = lng;
    HOTEL_COORDS.radius = radius || 50;
    if (name) HOTEL_COORDS.name = name;
  }

  return {
    getCurrentPosition,
    validateGeofence,
    watchPosition,
    stopWatch,
    haversineDistance,
    getHotelConfig,
    setHotelConfig,
    getLastPosition: () => lastPosition
  };
})();


