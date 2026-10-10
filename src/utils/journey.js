/**
 * journey.js — Streak + Love Points + Countdown (Tuần 2 / Cụm 5)
 * Pure helpers, không phụ thuộc Firebase → dễ test, tương thích ngược.
 */
import { MILESTONE_MESSAGES } from "../data/mockData.js";

export const STREAK_BADGES = [7, 30, 100, 365, 1000];

export const POINTS = {
  COMPLETE_DATE: 50,
  WRITE_RECAP: 30,
  HEARTBEAT: 5,
  CHAT: 5,
  CHECKIN: 2,
};

export const DAILY_CAP = 30; // cap cho heartbeat/chat/checkin mỗi ngày (không cap complete/recap)

/** YYYY-MM-DD theo local timezone */
export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Số ngày chênh lệch giữa 2 key YYYY-MM-DD */
export const diffDays = (a, b) => {
  if (!a || !b) return null;
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  if (isNaN(da) || isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
};

export const defaultStats = () => ({
  streak: 0,
  lastActiveDate: "",
  points: 0,
  lastPointsDate: "",
  pointsToday: 0,
  unlockedBadges: [],
});

export const normalizeStats = (raw) => {
  const d = defaultStats();
  if (!raw || typeof raw !== "object") return d;
  return {
    streak: Number(raw.streak) >= 0 ? Number(raw.streak) : 0,
    lastActiveDate: typeof raw.lastActiveDate === "string" ? raw.lastActiveDate : "",
    points: Number(raw.points) >= 0 ? Number(raw.points) : 0,
    lastPointsDate: typeof raw.lastPointsDate === "string" ? raw.lastPointsDate : "",
    pointsToday: Number(raw.pointsToday) >= 0 ? Number(raw.pointsToday) : 0,
    unlockedBadges: Array.isArray(raw.unlockedBadges)
      ? raw.unlockedBadges.filter((x) => typeof x === "number")
      : [],
  };
};

/**
 * Tính stats mới khi check-in hằng ngày (mở app / heartbeat / chat / hoàn thành date).
 * +1 streak nếu qua ngày mới liên tiếp, reset về 1 nếu断 > 1 ngày.
 */
export const applyDailyCheckin = (prev, now = new Date()) => {
  const s = normalizeStats(prev);
  const today = todayKey(now);
  if (s.lastActiveDate === today) return { stats: s, changed: false };
  const gap = s.lastActiveDate ? diffDays(s.lastActiveDate, today) : null;
  const streak = gap === null ? 1 : gap === 1 ? s.streak + 1 : 1;
  return { stats: { ...s, streak, lastActiveDate: today }, changed: true };
};

/**
 * Cộng điểm có cap hằng ngày. category: 'capped' (heartbeat/chat/checkin) | 'uncapped' (complete/recap)
 * Trả về { stats, added } — added là số điểm thực tế được cộng (có thể < amount nếu chạm cap).
 */
export const applyPoints = (prev, amount, category = "capped", now = new Date()) => {
  const s = normalizeStats(prev);
  const today = todayKey(now);
  let base = s;
  if (s.lastPointsDate !== today) base = { ...s, lastPointsDate: today, pointsToday: 0 };
  if (category === "uncapped") {
    return { stats: { ...base, points: base.points + amount }, added: amount };
  }
  const room = Math.max(0, DAILY_CAP - base.pointsToday);
  const added = Math.min(room, amount);
  if (added <= 0) return { stats: base, added: 0 };
  return {
    stats: { ...base, points: base.points + added, pointsToday: base.pointsToday + added },
    added,
  };
};

/** Badge streak mới unlock (so sánh trước/sau) */
export const newlyUnlockedBadges = (prevStats, nextStats) => {
  const prev = new Set(normalizeStats(prevStats).unlockedBadges);
  const next = normalizeStats(nextStats);
  const fresh = STREAK_BADGES.filter((b) => next.streak >= b && !prev.has(b));
  return fresh;
};

/** Message cho badge: tái dùng MILESTONE_MESSAGES, fallback tự sinh */
export const badgeMessage = (days) => {
  const found = (MILESTONE_MESSAGES || []).find((m) => m.days === days);
  if (found) return found.message;
  return `Chạm mốc ${days} ngày streak! 🔥`;
};

/** Countdown tới date+time → {d,h,m,s,overdue} realtime */
export const countdownTo = (dateStr, timeStr, nowMs = Date.now()) => {
  if (!dateStr) return null;
  const t = timeStr && timeStr.trim() ? timeStr.trim() : "19:00";
  const iso = t.length === 5 ? `${t}:00` : t;
  const target = new Date(`${dateStr}T${iso}`).getTime();
  if (isNaN(target)) return null;
  let diff = target - nowMs;
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, overdue: true };
  const d = Math.floor(diff / 86400000);
  diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);
  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);
  diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return { d, h, m, s, overdue: false };
};

/** Ngày kỷ niệm yêu tiếp theo trong 100/365/… dựa trên startDate */
export const nextLoveAnniversary = (startDate, milestones = [100, 365, 500, 730, 1000], nowMs = Date.now()) => {
  if (!startDate) return null;
  const start = new Date(startDate + "T00:00:00").getTime();
  if (isNaN(start)) return null;
  const daysNow = Math.floor((nowMs - start) / 86400000);
  const next = milestones.filter((x) => x > daysNow).sort((a, b) => a - b)[0];
  if (!next) return null;
  const targetMs = start + next * 86400000;
  const remain = Math.max(0, Math.ceil((targetMs - nowMs) / 86400000));
  return { milestone: next, daysLeft: remain, targetDate: new Date(targetMs), message: badgeMessage(next) };
};
