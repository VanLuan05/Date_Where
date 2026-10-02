// Geocoding and Map Utilities for DateWhere (OpenStreetMap & Nominatim)

export const DEFAULT_CENTER = [10.7769, 106.7009]; // Trung tâm TP. Hồ Chí Minh
export const DEFAULT_ZOOM = 13;

// In-memory cache to respect Nominatim rate limits and improve performance
const geoCache = new Map([
  ["27 ngo duc ke", [10.7738, 106.7042]],
  ["the workshop coffee", [10.7738, 106.7042]],
  ["21 han thuyen", [10.7797, 106.6976]],
  ["propaganda bistro", [10.7797, 106.6976]],
  ["bui vien", [10.7672, 106.6934]],
  ["bui vien walking street", [10.7672, 106.6934]],
  ["70 le loi", [10.7744, 106.7003]],
  ["l'usine dong khoi", [10.7744, 106.7003]],
  ["quan 1", [10.7756, 106.7004]],
  ["quan 3", [10.7845, 106.6844]],
  ["quan 2", [10.7872, 106.7321]],
  ["thao dien", [10.8035, 106.7336]],
  ["binh thanh", [10.8018, 106.7112]],
  ["phu nhuan", [10.7992, 106.6803]],
  ["ho con rua", [10.7826, 106.6961]],
  ["nha tho duc ba", [10.7798, 106.6990]],
  ["pho di bo nguyen hue", [10.7740, 106.7032]],
]);

/**
 * Lấy tọa độ từ địa chỉ thông qua API miễn phí Nominatim của OpenStreetMap
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<[number, number] | null>} Tọa độ [lat, lng] hoặc null
 */
export const getCoordinatesFromAddress = async (address) => {
  if (!address || typeof address !== "string" || address.trim().length === 0) {
    return null;
  }

  const cleanAddr = address.trim().toLowerCase();

  // Kiểm tra cache trước
  for (const [key, coords] of geoCache.entries()) {
    if (cleanAddr.includes(key)) {
      return coords;
    }
  }

  try {
    const query = encodeURIComponent(`${address}, TP Hồ Chí Minh, Việt Nam`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "DateWhereCoupleApp/1.0",
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        // Lưu vào cache
        geoCache.set(cleanAddr, coords);
        return coords;
      }
    }
  } catch (error) {
    console.warn("Geocoding fetch warning:", error?.message || error);
  }

  return null;
};

/**
 * Tạo tọa độ phân tán ổn định quanh trung tâm TP.HCM nếu không geocode được
 * Đảm bảo các quán không bị đè cùng một tọa độ
 */
export const getDeterministicCoords = (keyString = "", index = 0) => {
  let hash = 0;
  const str = String(keyString || index);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const seed = Math.abs(hash) + index * 1000;
  // Bán kính khoảng 0.015 - 0.035 độ (~1.5 - 3.5 km từ trung tâm Quận 1)
  const angle = ((seed % 360) * Math.PI) / 180;
  const radius = 0.01 + (seed % 25) * 0.0012;

  const lat = DEFAULT_CENTER[0] + radius * Math.sin(angle);
  const lng = DEFAULT_CENTER[1] + radius * Math.cos(angle) * 1.05;

  return [parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))];
};

/**
 * Đảm bảo mọi quán đều có tọa độ hợp lệ [lat, lng]
 */
export const ensurePlaceCoordinates = (place, index = 0) => {
  if (
    place?.coordinates &&
    Array.isArray(place.coordinates) &&
    place.coordinates.length === 2 &&
    !isNaN(place.coordinates[0]) &&
    !isNaN(place.coordinates[1])
  ) {
    return place.coordinates;
  }

  // Thử tìm trong cache theo tên hoặc địa chỉ
  const nameKey = (place.name || "").toLowerCase();
  const addrKey = (place.address || "").toLowerCase();
  for (const [key, coords] of geoCache.entries()) {
    if (nameKey.includes(key) || addrKey.includes(key)) {
      return coords;
    }
  }

  return getDeterministicCoords(place.id || place.name || place.address, index);
};

/**
 * Tính khoảng cách tương đối giữa 2 tọa độ (Haversine, tính bằng km)
 */
export const calculateDistanceKm = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371; // Bán kính trái đất km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};
