// Service quản lý thông báo nhắc hẹn trên điện thoại (PWA & Web Notifications)
// Tự động nhắc trước 1 ngày (24 tiếng) và khi còn 12, 9, 3, 1 tiếng.

export const REMINDER_MILESTONES = [
  {
    id: "24h",
    minHours: 12,
    maxHours: 24,
    label: "Trước 1 ngày",
    title: (placeName) => `💌 Ngày mai đôi mình có hẹn hò!`,
    body: (placeName, timeStr) =>
      `Chỉ còn 1 ngày nữa là đến buổi hẹn tại ${placeName}${timeStr ? ` lúc ${timeStr}` : ""}. Nhớ chuẩn bị đồ thật đẹp nhé! 💕`,
    badge: "1 ngày nữa",
    emoji: "💌",
  },
  {
    id: "12h",
    minHours: 9,
    maxHours: 12,
    label: "Còn 12 tiếng",
    title: (placeName) => `⏰ Còn 12 tiếng nữa đến giờ hẹn!`,
    body: (placeName, timeStr) =>
      `Đếm ngược từng giờ để gặp người ấy tại ${placeName} nè 🌸`,
    badge: "12 tiếng nữa",
    emoji: "⏰",
  },
  {
    id: "9h",
    minHours: 3,
    maxHours: 9,
    label: "Còn 9 tiếng",
    title: (placeName) => `✨ Còn 9 tiếng nữa thôi!`,
    body: (placeName, timeStr) =>
      `Hai đứa sắp được đi hẹn hò ở ${placeName} rồi, chuẩn bị tinh thần thật vui vẻ nhé! ☕`,
    badge: "9 tiếng nữa",
    emoji: "✨",
  },
  {
    id: "3h",
    minHours: 1,
    maxHours: 3,
    label: "Còn 3 tiếng",
    title: (placeName) => `👗 Còn 3 tiếng nữa - Chuẩn bị đồ thôi!`,
    body: (placeName, timeStr) =>
      `Chỉ còn 3 tiếng nữa là gặp nhau tại ${placeName}. Lên đồ và kiểm tra tư trang nào! 💖`,
    badge: "3 tiếng nữa",
    emoji: "👗",
  },
  {
    id: "1h",
    minHours: 0,
    maxHours: 1,
    label: "Còn 1 tiếng",
    title: (placeName) => `🚀 Còn 1 tiếng nữa - Sắp đến giờ hẹn!`,
    body: (placeName, timeStr) =>
      `Xuất phát thôi kẻo trễ hẹn tại ${placeName} nhé! Người ấy đang chờ bạn đó 💑`,
    badge: "1 tiếng nữa",
    emoji: "🚀",
  },
];

/**
 * Kiểm tra trạng thái cấp quyền thông báo
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};

/**
 * Yêu cầu người dùng cấp quyền thông báo
 * @returns {Promise<'granted' | 'denied' | 'default' | 'unsupported'>}
 */
export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Gửi thông báo chào mừng xác nhận
      await showPhoneNotification({
        title: "🔔 Đã bật thông báo hẹn hò!",
        body: "Date_Where sẽ tự động gửi thông báo đến điện thoại trước 1 ngày và nhắc tiếp khi còn 12, 9, 3, 1 tiếng 💕",
        tag: "date-where-welcome",
      });
    }
    return permission;
  } catch (error) {
    console.warn("Lỗi khi xin quyền thông báo:", error);
    return Notification.permission;
  }
};

/**
 * Gửi thông báo đến thiết bị (qua Service Worker PWA hoặc Notification API)
 */
export const showPhoneNotification = async ({
  title,
  body,
  tag,
  data = {},
  icon,
  badge,
}) => {
  if (getNotificationPermission() !== "granted") {
    return false;
  }

  const baseUrl = import.meta.env.BASE_URL || "/Date_Where/";
  const defaultIcon = icon || `${baseUrl}pwa-192x192.png`;
  const defaultBadge = badge || `${baseUrl}favicon.svg`;

  const options = {
    body,
    icon: defaultIcon,
    badge: defaultBadge,
    tag: tag || "date-where-reminder",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: `${baseUrl}?tab=dates`,
      ...data,
    },
  };

  try {
    // 1. Thử gửi qua Service Worker (chuẩn PWA trên Android và iOS Safari 16.4+)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        dispatchInAppEvent(title, body, tag);
        return true;
      }
    }

    // 2. Fallback sang Notification API thông thường
    if ("Notification" in window) {
      new Notification(title, options);
      dispatchInAppEvent(title, body, tag);
      return true;
    }
  } catch (error) {
    console.warn("Lỗi khi bắn thông báo native:", error);
    // Vẫn bắn sự kiện in-app để người dùng nhìn thấy banner trong ứng dụng
    dispatchInAppEvent(title, body, tag);
  }

  return false;
};

/**
 * Bắn sự kiện in-app để giao diện hiện toast đẹp mắt khi đang mở ứng dụng
 */
const dispatchInAppEvent = (title, body, tag) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("dw-date-reminder", {
        detail: { title, body, tag, timestamp: Date.now() },
      })
    );
  }
};

// ─── Quản lý cờ đã gửi trong LocalStorage ───────────────────────────────────

const getReminderStorageKey = (dateId, milestoneId) =>
  `dw_remind_sent_${dateId}_${milestoneId}`;

export const isReminderSent = (dateId, milestoneId) => {
  if (!dateId || !milestoneId) return false;
  try {
    return localStorage.getItem(getReminderStorageKey(dateId, milestoneId)) === "1";
  } catch {
    return false;
  }
};

export const markReminderSent = (dateId, milestoneId) => {
  if (!dateId || !milestoneId) return;
  try {
    localStorage.setItem(getReminderStorageKey(dateId, milestoneId), "1");
  } catch (e) {
    console.warn("Lưu cờ thông báo thất bại:", e);
  }
};

/**
 * Tính số giờ còn lại đến buổi hẹn
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeStr - HH:mm
 * @returns {number | null} Số giờ còn lại (float), âm nếu đã qua
 */
export const getHoursUntilDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim().length > 0 ? timeStr.trim() : "19:00";
  const isoTime = time.length === 5 ? `${time}:00` : time;
  const target = new Date(`${dateStr}T${isoTime}`);
  if (isNaN(target.getTime())) return null;

  const diffMs = target.getTime() - Date.now();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Quét toàn bộ danh sách buổi hẹn sắp tới và tự động gửi thông báo theo các mốc 24h, 12h, 9h, 3h, 1h
 * @param {Array} dates - Danh sách các buổi hẹn
 * @returns {Promise<Array>} Danh sách các thông báo đã kích hoạt
 */
export const checkAndTriggerDateReminders = async (dates = []) => {
  if (!Array.isArray(dates) || dates.length === 0) return [];

  const triggered = [];

  for (const dateItem of dates) {
    if (dateItem.status !== "upcoming" || !dateItem.date) continue;

    const hoursUntil = getHoursUntilDate(dateItem.date, dateItem.time);
    if (hoursUntil === null || hoursUntil <= 0) continue;

    // Tìm mốc phù hợp
    for (const milestone of REMINDER_MILESTONES) {
      if (hoursUntil > milestone.minHours && hoursUntil <= milestone.maxHours) {
        // Kiểm tra xem đã gửi mốc này chưa
        if (!isReminderSent(dateItem.id, milestone.id)) {
          const placeName = dateItem.placeName || "địa điểm bí mật";
          const title = milestone.title(placeName);
          const body = milestone.body(placeName, dateItem.time);
          const tag = `date-reminder-${dateItem.id}-${milestone.id}`;

          await showPhoneNotification({
            title,
            body,
            tag,
            data: { dateId: dateItem.id, milestoneId: milestone.id },
          });

          markReminderSent(dateItem.id, milestone.id);
          triggered.push({
            dateId: dateItem.id,
            placeName,
            milestone: milestone.id,
            title,
            body,
          });
        }
        break; // Mỗi lần quét chỉ kích hoạt mốc phù hợp nhất hiện tại
      }
    }
  }

  return triggered;
};

/**
 * Gửi thông báo thử nghiệm để người dùng kiểm tra trên điện thoại
 */
export const sendTestReminderNotification = async (placeName = "DateWhere") => {
  return await showPhoneNotification({
    title: "💌 Thử nghiệm: Ngày mai đôi mình có hẹn hò!",
    body: `Chỉ còn 1 ngày nữa là đến buổi hẹn tại ${placeName}. Thông báo trên điện thoại hoạt động hoàn hảo! ✨`,
    tag: `test-date-reminder-${Date.now()}`,
  });
};
