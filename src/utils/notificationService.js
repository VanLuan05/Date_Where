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

  const targetUrl = data.url || `${baseUrl}?tab=dates`;
  const options = {
    body,
    icon: defaultIcon,
    badge: defaultBadge,
    tag: tag || "date-where-reminder",
    renotify: true,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: targetUrl,
      ...data,
    },
  };

  try {
    // 1. Thử gửi qua Service Worker (chuẩn PWA trên Android và iOS Safari 16.4+)
    if ("serviceWorker" in navigator) {
      let reg = null;
      try {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SW ready timeout")), 1500)
          ),
        ]);
      } catch {
        try {
          reg = await navigator.serviceWorker.getRegistration();
        } catch {
          reg = null;
        }
      }

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

/**
 * Alias chuẩn: showNotification — dùng trong hook sendMessage & heartbeat
 * Ưu tiên Service Worker để thông báo hiển thị ngay cả khi app bị thu nhỏ/tắt.
 */
export const showNotification = showPhoneNotification;

/**
 * Chỉ bắn Notification HỆ THỐNG khi tab đang ẩn (tab khác / thu nhỏ app).
 * Khi user đang nhìn app thì dùng toast/âm thanh/rung + badge thay vì
 * notification hệ thống → tránh double-notify khó chịu.
 */
export const shouldShowSystemNotification = () => {
  if (getNotificationPermission() !== "granted") return false;
  if (typeof document === "undefined") return false;
  return document.hidden === true;
};

/**
 * Âm thanh "pop-ding" kiểu Messenger khi có tin nhắn mới (Web Audio, không cần file).
 * Trình duyệt có thể chặn autoplay trước khi user tương tác → catch im lặng.
 * @returns {boolean} true nếu đã phát
 */
export const playMessageSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Nốt 1: "pop" (880Hz, ngắn)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Nốt 2: "ding" (1174Hz, sau 90ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174, now + 0.09);
    gain2.gain.setValueAtTime(0.0001, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.18, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.36);

    setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {}
    }, 600);
    return true;
  } catch {
    return false;
  }
};

/**
 * Rung kiểu Messenger khi có tin nhắn (Android; iOS Safari bỏ qua an toàn).
 */
export const triggerMessageVibrate = (pattern = [80, 40, 80]) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      return navigator.vibrate(pattern);
    }
  } catch {}
  return false;
};

// ─── Remote Push Notification (Bridge ntfy.sh khi đối phương tắt app) ─────────

/**
 * Tạo tên topic riêng tư, mã hóa an toàn theo coupleCode và người nhận
 * Ví dụ: dw_dw8f2k_user2
 */
export const getPartnerTopic = (coupleCode, targetRole) => {
  if (!coupleCode || !targetRole) return "";
  const cleanCode = String(coupleCode).toLowerCase().replace(/[^a-z0-9]/g, "");
  const role = targetRole === "user2" || targetRole === "userB" ? "user2" : "user1";
  return `dw_${cleanCode}_${role}`;
};

/**
 * Lấy link đăng ký kênh thông báo riêng tư trên trình duyệt hoặc app ntfy
 */
export const getNtfyChannelUrl = (coupleCode, targetRole) => {
  const topic = getPartnerTopic(coupleCode, targetRole);
  return topic ? `https://ntfy.sh/${topic}` : "";
};

/**
 * Ghi 1 document vào Firestore `couples/{code}/pushQueue` để báo cho thiết bị
 * của đối phương — kể cả khi đối phương KHÔNG mở app nhưng còn service worker/
 * foreground listener, hoặc để Cloud Function (khi đã deploy) đọc và gửi FCM.
 *
 * Đây là giải pháp khả thi nhất khi repo chưa có thư mục functions/ và không
 * thể nhúng server key FCM vào client (bảo mật). Cloud Function mẫu đọc queue
 * này được mô tả trong README ("Thông báo đẩy nền").
 *
 * @returns {Promise<boolean>}
 */
export const queuePushNotification = async ({
  coupleCode,
  targetRole,
  sender = null,
  kind = "chat",
  title,
  body,
  url = null,
  tag = null,
}) => {
  if (!coupleCode || !targetRole) return false;
  try {
    const [{ db }, firestore] = await Promise.all([
      import("../firebase/config.js"),
      import("firebase/firestore"),
    ]);
    if (!db) return false;
    const { collection, addDoc, serverTimestamp } = firestore;
    await addDoc(collection(db, "couples", coupleCode, "pushQueue"), {
      targetRole,
      sender,
      kind,
      title: title || "DateWhere 💕",
      body: body || "",
      url,
      tag,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn("[Push] Ghi pushQueue thất bại:", err);
    return false;
  }
};

/**
 * Gửi thông báo từ xa đến thiết bị của đối phương (ngay cả khi app tắt hoàn toàn)
 * @param {Object} params
 * @param {string} params.coupleCode - Mã phòng chung
 * @param {string} params.targetRole - "user1" hoặc "user2"
 * @param {string} params.sender - role người gửi ("user1" | "user2", để bên nhận bỏ qua tin của chính mình)
 * @param {string} [params.kind] - "chat" | "date" | "heartbeat" | "mood"
 * @param {string} params.title - Tiêu đề thông báo
 * @param {string} params.body - Nội dung thông báo
 * @param {string} [params.url] - Link mở app khi bấm vào thông báo (kèm ?tab=chat...)
 * @param {string} [params.tag] - Tag định danh (trùng tag → OS gộp, tránh double-notify)
 * @param {Array<string>} [params.tags] - Emoji tag
 */
export const sendRemoteNotification = async ({
  coupleCode,
  targetRole,
  sender = null,
  kind = "chat",
  title,
  body,
  url,
  tag,
  tags = ["love_letter", "heart"],
}) => {
  if (!coupleCode || !targetRole) return false;

  const defaultUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "/Date_Where/";
  const clickUrl = url || defaultUrl;

  // 1) Ghi Firestore pushQueue (kênh báo hiệu chính cho app + Cloud Function tương lai)
  const queuePromise = queuePushNotification({
    coupleCode,
    targetRole,
    sender,
    kind,
    title,
    body,
    url: clickUrl,
    tag,
  });

  // 2) Giữ ntfy.sh làm kênh nền thực tế cho tới khi deploy Cloud Function gửi FCM.
  //    Người nhận cần mở link kênh 1 lần để subscribe (xem NotificationCenterModal).
  const topic = getPartnerTopic(coupleCode, targetRole);
  let ntfyOk = false;
  if (topic) {
    try {
      const payload = {
        topic,
        title: title || "DateWhere 💕",
        message: body || "",
        click: clickUrl,
        priority: 4, // Mức ưu tiên cao (rung + chuông trên Android/iOS)
        tags,
      };

      const res = await fetch("https://ntfy.sh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      ntfyOk = res.ok;
    } catch (err) {
      console.warn("[Push] Gửi thông báo nền từ xa thất bại:", err);
    }
  }

  const queued = await queuePromise;
  return ntfyOk || queued;
};

