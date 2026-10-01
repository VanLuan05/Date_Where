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
  if (!days) return "Bắt đầu cuộc hành trình của đôi mình! 💕";
  let msg = "Mỗi ngày bên nhau đều là điều kỳ diệu! ✨";
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

/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 */
export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "0 đ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

/**
 * Tính toán thống kê ngân sách theo tháng
 * @param {Array} dates - Danh sách các buổi hẹn
 * @param {number} currentMonth - Tháng (0 - 11)
 * @param {number} currentYear - Năm (ví dụ: 2024, 2026)
 */
export const calculateMonthlyBudget = (dates = [], currentMonth, currentYear) => {
  const now = new Date();
  const m = currentMonth !== undefined ? currentMonth : now.getMonth();
  const y = currentYear !== undefined ? currentYear : now.getFullYear();

  let totalEstimated = 0;
  let totalActual = 0;
  let paidByUser1 = 0;
  let paidByUser2 = 0;
  let completedDatesCount = 0;

  dates.forEach((d) => {
    if (d.status === "cancelled") return;
    const dateObj = d.date
      ? new Date(d.date + "T00:00:00")
      : d.createdAt
      ? new Date(d.createdAt)
      : null;
    if (!dateObj || isNaN(dateObj.getTime())) return;

    if (dateObj.getMonth() === m && dateObj.getFullYear() === y) {
      const est = Number(d.budget?.estimatedCost) || 0;
      const act = Number(d.budget?.actualCost) || 0;
      const paidBy = d.budget?.paidBy || "split";

      totalEstimated += est;

      if (d.status === "completed") {
        completedDatesCount += 1;
        const effectiveActual = act > 0 ? act : est;
        totalActual += effectiveActual;

        if (paidBy === "user1" || paidBy === "userA") {
          paidByUser1 += effectiveActual;
        } else if (paidBy === "user2" || paidBy === "userB") {
          paidByUser2 += effectiveActual;
        } else {
          // Chia đôi 50/50
          paidByUser1 += effectiveActual / 2;
          paidByUser2 += effectiveActual / 2;
        }
      }
    }
  });

  return {
    totalEstimated,
    totalActual,
    paidByUser1,
    paidByUser2,
    completedDatesCount,
    month: m,
    year: y,
  };
};
