/**
 * locationService.js
 * Dịch vụ định vị GPS cho tính năng Live Location của cặp đôi.
 * Sử dụng navigator.geolocation API chuẩn của trình duyệt.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const GEO_OPTIONS_HIGH = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
};

const GEO_OPTIONS_WATCH = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 3000,
};

// ─── Geolocation Core ─────────────────────────────────────────────────────────

/**
 * Kiểm tra trình duyệt có hỗ trợ Geolocation không
 * @returns {boolean}
 */
export const isGeolocationSupported = () => {
  return "geolocation" in navigator;
};

/**
 * Lấy tọa độ GPS hiện tại với độ chính xác cao.
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("Thiết bị không hỗ trợ định vị GPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Bạn chưa cho phép truy cập vị trí. Vui lòng bật quyền Location trong cài đặt trình duyệt."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Không thể xác định vị trí hiện tại. Vui lòng kiểm tra kết nối GPS."));
            break;
          case error.TIMEOUT:
            reject(new Error("Quá thời gian chờ lấy vị trí. Vui lòng thử lại."));
            break;
          default:
            reject(new Error("Không thể lấy vị trí. Vui lòng thử lại sau."));
        }
      },
      GEO_OPTIONS_HIGH
    );
  });
};

/**
 * Bắt đầu theo dõi vị trí liên tục (watchPosition).
 * @param {function} onUpdate - Callback nhận {lat, lng, accuracy} mỗi lần vị trí thay đổi
 * @param {function} onError - Callback nhận Error khi có lỗi
 * @returns {number} watchId — Dùng để clearWatch khi dừng
 */
export const startWatchingLocation = (onUpdate, onError) => {
  if (!isGeolocationSupported()) {
    onError?.(new Error("Thiết bị không hỗ trợ định vị GPS."));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate?.({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      onError?.(error);
    },
    GEO_OPTIONS_WATCH
  );

  return watchId;
};

/**
 * Dừng theo dõi vị trí.
 * @param {number} watchId - ID từ startWatchingLocation
 */
export const stopWatchingLocation = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// ─── Distance Calculation ─────────────────────────────────────────────────────

/**
 * Tính khoảng cách giữa 2 tọa độ theo công thức Haversine (đường chim bay).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Khoảng cách tính bằng mét
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Bán kính trái đất (mét)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Định dạng khoảng cách thân thiện cho người dùng.
 * @param {number} meters - Khoảng cách tính bằng mét
 * @returns {string} Ví dụ: "150 m", "3.2 km"
 */
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined || isNaN(meters)) return "—";
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// ─── Time Formatting ──────────────────────────────────────────────────────────

/**
 * Hiển thị thời gian cập nhật dạng thân thiện.
 * @param {string} isoDate - ISO date string
 * @returns {string} Ví dụ: "Vừa xong", "5 phút trước", "2 giờ trước"
 */
export const formatTimeAgo = (isoDate) => {
  if (!isoDate) return "Chưa cập nhật";

  const now = new Date();
  const updated = new Date(isoDate);
  const diffMs = now - updated;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 30) return "Vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return updated.toLocaleDateString("vi-VN");
};

// ─── Location Status Helpers ──────────────────────────────────────────────────

/**
 * Xác định trạng thái di chuyển dựa trên thời gian cập nhật.
 * @param {string} updatedAt - ISO date string
 * @param {string} currentStatus - Status hiện tại
 * @returns {'active' | 'on_the_way' | 'idle'}
 */
export const inferLocationStatus = (updatedAt, currentStatus) => {
  if (currentStatus === "on_the_way") return "on_the_way";
  if (!updatedAt) return "idle";

  const diffMin = (Date.now() - new Date(updatedAt).getTime()) / 60000;
  if (diffMin < 5) return "active";
  if (diffMin < 30) return "active";
  return "idle";
};

/**
 * Nhãn trạng thái thân thiện cho UI.
 * @param {'active' | 'on_the_way' | 'idle'} status
 * @returns {{label: string, emoji: string, color: string}}
 */
export const getStatusDisplay = (status) => {
  switch (status) {
    case "on_the_way":
      return { label: "Đang trên đường", emoji: "🚗", color: "text-emerald-600" };
    case "active":
      return { label: "Vừa cập nhật", emoji: "📡", color: "text-sky-600" };
    case "idle":
    default:
      return { label: "Không hoạt động", emoji: "💤", color: "text-stone-400" };
  }
};

/**
 * Kiểm tra quyền Geolocation đã được cấp chưa (Permissions API).
 * @returns {Promise<'granted' | 'denied' | 'prompt' | 'unsupported'>}
 */
export const checkGeolocationPermission = async () => {
  try {
    if (!navigator.permissions) return "unsupported";
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return "unsupported";
  }
};
