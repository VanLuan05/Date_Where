/**
 * weatherService.js
 * Dịch vụ dự báo thời tiết thông minh cho Date_Where sử dụng API Open-Meteo.
 * Tọa độ mặc định: TP. Hồ Chí Minh (10.8231, 106.6297)
 * Múi giờ: Asia/Bangkok
 */

const CACHE_KEY = "dw_weather_forecast_cache_v1";
const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 giờ

const DEFAULT_COORDS = {
  latitude: 10.8231,
  longitude: 106.6297,
  timezone: "Asia/Bangkok",
};

/**
 * Bảng giải mã WMO Weather Code sang tiếng Việt kèm lời khuyên lãng mạn
 */
export const getWeatherCondition = (code, rainProb = 0) => {
  // Code 0, 1: Trời nắng / quang đãng
  if (code === 0 || code === 1) {
    return {
      icon: "☀️",
      label: "Trời nắng đẹp",
      description: "Trời quang đãng, nắng ấm rực rỡ",
      advice: "Thời tiết rất đẹp để đi dạo, chụp ảnh đôi hoặc ngồi quán cafe ngoài trời rooftop ngắm hoàng hôn đó!",
      isRainy: false,
      color: "text-amber-500",
      bg: "bg-amber-50 border-amber-200",
    };
  }

  // Code 2, 3: Nhiều mây / Râm mát
  if (code === 2 || code === 3) {
    return {
      icon: "⛅",
      label: "Trời mát mẻ",
      description: "Trời râm mát, nhiều mây dễ chịu",
      advice: "Hôm ấy trời mát mẻ lý tưởng, hai đứa mình tha hồ lượn phố hóng gió nhé.",
      isRainy: false,
      color: "text-sky-500",
      bg: "bg-sky-50 border-sky-200",
    };
  }

  // Code 45, 48: Sương mù
  if (code === 45 || code === 48) {
    return {
      icon: "🌫️",
      label: "Có sương mù",
      description: "Trời nhiều sương, se lạnh",
      advice: "Trời nhiều sương và se lạnh, nhớ mặc ấm và nắm tay nhau thật chặt nha.",
      isRainy: false,
      color: "text-slate-500",
      bg: "bg-slate-50 border-slate-200",
    };
  }

  // Code 51-67, 80-82: Mưa phùn / Mưa rào
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || rainProb >= 40) {
    return {
      icon: "🌧️",
      label: "Có mưa rào",
      description: `Khả năng mưa ${rainProb}%`,
      advice: "Dự báo hôm ấy có mưa rào rải rác! Nhớ đem theo áo mưa đôi hoặc ưu tiên chọn quán có không gian ấm áp trong nhà nha.",
      isRainy: true,
      color: "text-blue-500",
      bg: "bg-blue-50 border-blue-200",
    };
  }

  // Code 71-77, 85-86: Trời tuyết / Lạnh buốt
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      icon: "❄️",
      label: "Trời lạnh",
      description: "Không khí se lạnh",
      advice: "Trời se lạnh, nhớ mặc ấm và cùng nhau thưởng thức một tách cacao nóng nhé.",
      isRainy: false,
      color: "text-cyan-500",
      bg: "bg-cyan-50 border-cyan-200",
    };
  }

  // Code 95-99: Mưa dông / Sấm sét
  if (code >= 95 && code <= 99) {
    return {
      icon: "⛈️",
      label: "Mưa dông lớn",
      description: "Có thể có dông sét",
      advice: "Trời có thể có dông lớn, hãy chọn quán gần nhà hoặc đi sớm để tránh ướt nhé.",
      isRainy: true,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-200",
    };
  }

  // Mặc định
  return {
    icon: "🌤️",
    label: "Thời tiết ổn định",
    description: "Thời tiết ôn hòa dễ chịu",
    advice: "Chúc hai bạn có một buổi hẹn hò thật nhiều kỷ niệm ngọt ngào và hạnh phúc!",
    isRainy: false,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
  };
};

/**
 * Lấy toàn bộ dữ liệu dự báo 16 ngày từ Open-Meteo (có cache sessionStorage)
 */
export const fetchWeatherForecastData = async () => {
  try {
    const hasSessionStorage =
      typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

    // 1. Kiểm tra cache trong sessionStorage
    if (hasSessionStorage) {
      const cachedStr = sessionStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
          }
        } catch (e) {
          // Cache hỏng thì bỏ qua
        }
      }
    }

    // 2. Gọi Open-Meteo API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_COORDS.latitude}&longitude=${DEFAULT_COORDS.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(DEFAULT_COORDS.timezone)}&forecast_days=16`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !data.daily || !Array.isArray(data.daily.time)) {
      throw new Error("Dữ liệu Open-Meteo không đúng định dạng");
    }

    // 3. Lưu vào cache
    if (hasSessionStorage) {
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: data.daily,
          })
        );
      } catch (e) {
        // Quota exceeded hoặc private mode
      }
    }

    return data.daily;
  } catch (error) {
    console.warn("Lỗi khi tải dự báo thời tiết Open-Meteo:", error);

    // Fallback: nếu có cache cũ dù hết hạn vẫn dùng tạm
    if (typeof window !== "undefined" && typeof window.sessionStorage !== "undefined") {
      try {
        const fallbackStr = sessionStorage.getItem(CACHE_KEY);
        if (fallbackStr) {
          const fallback = JSON.parse(fallbackStr);
          if (fallback?.data) return fallback.data;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }
};

/**
 * Lấy dự báo thời tiết cho một ngày cụ thể (YYYY-MM-DD)
 * @param {string} dateStr - Ngày dạng "YYYY-MM-DD"
 * @returns {Promise<Object>}
 */
export const getWeatherForecastForDate = async (dateStr) => {
  if (!dateStr) {
    return { available: false, message: "Chưa chọn ngày hẹn" };
  }

  // Chuẩn hóa dateStr sang "YYYY-MM-DD"
  const formattedDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;

  const daily = await fetchWeatherForecastData();
  if (!daily || !daily.time || daily.time.length === 0) {
    return {
      available: false,
      error: true,
      message: "Không thể kết nối dịch vụ thời tiết lúc này.",
    };
  }

  const times = daily.time;
  const firstDate = times[0];
  const lastDate = times[times.length - 1];

  // Nếu ngày trong quá khứ
  if (formattedDate < firstDate) {
    return {
      available: false,
      isPast: true,
      message: "Buổi hẹn đã diễn ra.",
    };
  }

  // Nếu ngày quá xa (vượt quá 16 ngày)
  if (formattedDate > lastDate) {
    return {
      available: false,
      tooFar: true,
      message: "Thời tiết sẽ được cập nhật khi gần đến ngày hẹn (trong vòng 14 ngày tới) ✨",
    };
  }

  const index = times.indexOf(formattedDate);
  if (index === -1) {
    return {
      available: false,
      tooFar: true,
      message: "Thời tiết sẽ được cập nhật khi gần đến ngày hẹn (trong vòng 14 ngày tới) ✨",
    };
  }

  const weatherCode = daily.weather_code[index];
  const tempMax = Math.round(daily.temperature_2m_max[index]);
  const tempMin = Math.round(daily.temperature_2m_min[index]);
  const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[index] : 0;

  const condition = getWeatherCondition(weatherCode, rainProb);

  return {
    available: true,
    date: formattedDate,
    weatherCode,
    tempMax,
    tempMin,
    rainProb,
    ...condition,
  };
};
