/**
 * loveConcierge.js (Cụm 7) — V1 rule-based thuần, không cần API key.
 * Input: places, matchedFreeDays, forecastMap (Open-Meteo), budget, couple.
 * Output: top 3 quán, top 3 slot hẹn, gợi ý quà/dress-code/plan theo dịp.
 *
 * Để sẵn interface `async getAIPlan()` + TODO cắm Gemini via Cloud Function sau.
 */
import { calculateDistanceKm, DEFAULT_CENTER } from "./geoService.js";

const midPoint = (partnerLocations) => {
  const pts = [partnerLocations?.user1, partnerLocations?.user2].filter(
    (p) => p && isFinite(p.lat) && isFinite(p.lng)
  );
  if (pts.length === 0) return DEFAULT_CENTER;
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  return [lat, lng];
};

const placeCoords = (place, idx = 0) => {
  if (isFinite(place?.lat) && isFinite(place?.lng)) return [place.lat, place.lng];
  if (Array.isArray(place?.coordinates) && place.coordinates.length === 2) return place.coordinates;
  // fallback: rải đều quanh trung tâm theo index (ổn định, không cần network)
  const angle = ((idx * 47) % 360) * (Math.PI / 180);
  return [DEFAULT_CENTER[0] + 0.015 * Math.sin(angle), DEFAULT_CENTER[1] + 0.015 * Math.cos(angle)];
};

/** Điểm quán: chưa đi +3, favorite +2, rating cao +0~2, gần midpoint +0~2 */
export const scorePlace = (place, idx, center) => {
  let score = 0;
  const reasons = [];
  if (!place.visited) { score += 3; reasons.push("chưa đi"); }
  if (place.favorite) { score += 2; reasons.push("đã thả tim"); }
  const r = Number(place.rating) || 0;
  score += Math.min(2, r / 2.5);
  if (r >= 4) reasons.push(`${r}/5 sao`);
  const d = calculateDistanceKm(center, placeCoords(place, idx));
  if (d !== null) {
    if (d <= 2) { score += 2; reasons.push(`${d}km — rất gần`); }
    else if (d <= 5) { score += 1; reasons.push(`${d}km — khá gần`); }
  }
  return { score: Math.round(score * 10) / 10, reasons, distKm: d };
};

export const suggestPlaces = (places = [], partnerLocations = null, topN = 3) => {
  const center = midPoint(partnerLocations);
  return (places || [])
    .map((p, i) => ({ place: p, ...scorePlace(p, i, center) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

/** Điểm slot: cùng rảnh (có sẵn trong matched), không mưa +2, cuối tuần +1, giờ vàng 18-21h +1 */
export const scoreSlot = (slot, forecastMap = {}) => {
  let score = 5; // đã cùng rảnh = nền tảng
  const reasons = ["hai đứa cùng rảnh"];
  const fc = forecastMap?.[slot.dateStr];
  if (fc) {
    if (fc.isRainy) { score -= 2; reasons.push(`mưa ${fc.rainProb ?? "?"}% ☔`); }
    else { score += 2; reasons.push(`đẹp ${fc.tempMin ?? ""}-${fc.tempMax ?? ""}°C ☀️`); }
  }
  const d = new Date(slot.dateStr + "T00:00:00");
  const dow = d.getDay();
  if (dow === 0 || dow === 6) { score += 1; reasons.push("cuối tuần"); }
  const hour = parseInt(String(slot.slot === "evening" ? "19" : slot.slot === "morning" ? "9" : slot.time || "19").slice(0, 2), 10);
  if (hour >= 18 && hour <= 21) { score += 1; reasons.push("giờ vàng hẹn hò"); }
  return { score, reasons };
};

const SLOT_TIME = { morning: "09:00", afternoon: "15:00", evening: "19:30", all: "19:00" };

export const suggestSlots = (matchedFreeDays = [], forecastMap = {}, topN = 3) => {
  return (matchedFreeDays || [])
    .filter((s) => s && s.dateStr && new Date(s.dateStr + "T00:00:00") >= new Date(new Date().toDateString()))
    .map((s) => ({
      ...s,
      time: s.time || SLOT_TIME[s.slot] || "19:00",
      ...scoreSlot(s, forecastMap),
    }))
    .sort((a, b) => b.score - a.score || a.dateStr.localeCompare(b.dateStr))
    .slice(0, topN);
};

/** Gợi ý quà / dress-code / plan theo dịp */
export const suggestOccasion = (kind = "anniversary", budgetAvg = 300000) => {
  const fancy = budgetAvg >= 500000;
  const lib = {
    anniversary: {
      gift: fancy ? "Vòng tay đôi khắc ngày yêu 💍" : "Thư tay + album ảnh in tay 💌",
      dress: "Tone trắng/be, váy hoa pastel — chụp ảnh kỷ niệm đẹp",
      plan: "Ăn tối rooftop → dạo phố → trao quà lúc 20:00 + chụp polaroid",
    },
    birthday: {
      gift: "Bánh kem mini + món quà theo wishlist của người ấy 🎂",
      dress: "Lịch sự, có điểm nhấn — chuẩn bị 1 bất ngờ nhỏ",
      plan: "Cafe sáng → tặng quà trưa → tối quây quần bên bạn bè/gia đình",
    },
    valentine: {
      gift: "Hoa hồng + socola + thiệp viết tay 🌹",
      dress: "Đỏ/hồng — dress-code đôi càng tình cảm",
      plan: "Đặt bàn trước 1 tuần, đến sớm 15 phút, tắt điện thoại 1 tiếng bên nhau",
    },
    casual: {
      gift: "Món ăn vặt người ấy thích + sticker dán điện thoại 🍿",
      dress: "Thoải mái, giày dễ đi — sẵn sàng lượn phố",
      plan: "Cafe → đi dạo → ăn vặt → kết bằng 1 tấm ảnh check-in",
    },
  };
  return lib[kind] || lib.casual;
};

export const detectOccasion = (couple, dates = []) => {
  const now = new Date();
  // sinh nhật / valentine đơn giản theo tháng ngày
  if (now.getMonth() === 1 && now.getDate() >= 10 && now.getDate() <= 16) return "valentine";
  const upcoming = (dates || []).find((d) => d.status === "upcoming" && /sinh nhật|birthday/i.test(`${d.notes || ""} ${d.placeName || ""}`));
  if (upcoming) return "birthday";
  return "anniversary";
};

export const avgBudget = (dates = []) => {
  const vals = (dates || [])
    .map((d) => Number(d.budget?.actualCost || d.budget?.estimatedCost || 0))
    .filter((x) => x > 0);
  if (!vals.length) return 300000;
  return Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
};

/**
 * TODO (sau này): cắm Gemini via Cloud Function để viết lời mời + lịch trình chi tiết.
 * Client gọi POST /api/aiPlan (Firebase Functions httpsCallable) — KHÔNG nhúng API key ở client.
 * V1 hiện tại trả rule-based ngay để dùng offline được.
 */
export const getAIPlan = async ({ places, matchedFreeDays, forecastMap, dates, couple, partnerLocations }) => {
  const topPlaces = suggestPlaces(places, partnerLocations, 3);
  const topSlots = suggestSlots(matchedFreeDays, forecastMap, 3);
  const occasionKind = detectOccasion(couple, dates);
  const occasion = suggestOccasion(occasionKind, avgBudget(dates));
  return {
    source: "rule-based-v1",
    topPlaces,
    topSlots,
    occasion: { kind: occasionKind, ...occasion },
    // TODO: const ai = await httpsCallable('aiPlan')({...}); merge ai.text vào đây
  };
};
