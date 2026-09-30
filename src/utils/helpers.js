// Helper utilities for DateWhere

export const getDaysTogether = (startDate) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

export const getMilestoneMessage = (days, milestones) => {
  if (!days) return "Bat dau cuoc hanh trinh cua doi minh! ??";
  let msg = "Moi ngay ben nhau deu la dieu ky dieu! ??";
  for (const m of milestones) {
    if (days >= m.days) msg = m.message;
  }
  return msg;
};

export const getNextMilestone = (days, milestones) => {
  for (const m of milestones) {
    if (days < m.days) return m;
  }
  return null;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return "";
  const formatted = formatDate(dateStr);
  return timeStr ? `${timeStr} - ${formatted}` : formatted;
};

export const isUpcoming = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const pickRandom = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

export const LOCAL_STORAGE_KEY = "datewhere_v1";

export const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveToStorage = (data) => {
  try {
    if (data === null) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
};
