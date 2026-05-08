// ============================================================
// location.js - Location & GPS Handler
// Hotel Attendance System
// ============================================================

class LocationManager {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.isWatching = false;
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(options = {}) {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 0,
    } = options;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          resolve(this.currentPosition);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(this.getLocationError(error));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }

  /**
   * Watch position changes (continuous)
   */
  watchPosition(callback, options = {}) {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 0,
    } = options;

    if (!navigator.geolocation) {
      console.error('Geolocation tidak didukung');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        };
        this.isWatching = true;
        callback(this.currentPosition);
      },
      (error) => {
        console.error('Watch position error:', error);
        callback(null, this.getLocationError(error));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }

  /**
   * Stop watching position
   */
  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
      console.log('Stopped watching position');
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return {
      km: distance,
      meters: distance * 1000,
    };
  }

  /**
   * Check if location is within geofence
   */
  isWithinGeofence(lat1, lon1, lat2, lon2, radiusKm = 0.5) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance.km <= radiusKm;
  }

  /**
   * Format coordinates
   */
  formatCoordinates(latitude, longitude) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  /**
   * Handle geolocation errors
   */
  getLocationError(error) {
    const errors = {
      [error.PERMISSION_DENIED]: 'Izin lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.',
      [error.POSITION_UNAVAILABLE]: 'Informasi lokasi tidak tersedia.',
      [error.TIMEOUT]: 'Request lokasi timeout. Coba lagi.',
    };

    return new Error(errors[error.code] || 'Error tidak diketahui');
  }

  /**
   * Get current position with formatted output
   */
  async getFormattedPosition() {
    try {
      const position = await this.getCurrentPosition();
      return {
        success: true,
        coordinates: this.formatCoordinates(position.latitude, position.longitude),
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: Math.round(position.accuracy) + ' m',
        timestamp: position.timestamp,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

// ==================== INITIALIZE ====================

const locationManager = new LocationManager();

/**
 * Initialize location services
 * Call this when needed
 */
async function initLocationServices() {
  try {
    const result = await locationManager.getFormattedPosition();
    if (result.success) {
      console.log('✅ Location initialized:', result);
      return result;
    } else {
      console.error('❌ Location error:', result.error);
      return null;
    }
  } catch (err) {
    console.error('Location initialization error:', err);
    return null;
  }
}

// Make locationManager globally accessible (NOT window.location to avoid conflict with browser API)
window.locationManager = locationManager;
window.initLocationServices = initLocationServices;
