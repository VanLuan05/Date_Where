/* DateWhere — Firebase Cloud Messaging Service Worker (background push)
 * ─────────────────────────────────────────────────────────────────────────────
 * File này PHẢI nằm ở public/firebase-messaging-sw.js (không bundle qua Vite)
 * và được đăng ký lazy từ src/firebase/messaging.js kèm public web config
 * qua query string (?apiKey=...&projectId=...).
 *
 * Nhiệm vụ: nhận background message từ FCM khi PWA/tab đã ĐÓNG và gọi
 * self.registration.showNotification(...) theo đúng yêu cầu.
 *
 * SỰ THẬT VỀ "MÀN HÌNH SÁNG NHƯ MESSENGER":
 *  - Web KHÔNG có API nào để tự bật sáng màn hình. Khi push tới, CHÍNH HỆ
 *    ĐIỀU HÀNH (Android/iOS) là bên bật sáng màn hình + rung + chuông + hiện
 *    banner — giống hệt cách Messenger hoạt động (Messenger cũng nhờ OS).
 *  - Điều kiện cần: (1) đã granted quyền Notification, (2) đã cài PWA
 *    (đặc biệt trên iOS: bắt buộc Add to Home Screen từ iOS 16.4+),
 *    (3) có server/Cloud Function gửi FCM tới token đã lưu.
 *
 * Nếu chưa cấu hình (thiếu apiKey/projectId) → file vẫn cài đặt thành công
 * nhưng chỉ chạy fallback push/click handler bên dưới, KHÔNG crash.
 */

const DEFAULT_ICON = "/Date_Where/pwa-192x192.png";
const DEFAULT_BADGE = "/Date_Where/favicon.svg";
const DEFAULT_URL = "/Date_Where/?tab=chat";

/* Đọc public web config do app truyền qua query string của script URL. */
function readConfigFromQuery() {
  try {
    const params = new URLSearchParams(self.location.search || "");
    const cfg = {
      apiKey: params.get("apiKey") || "",
      authDomain: params.get("authDomain") || "",
      projectId: params.get("projectId") || "",
      storageBucket: params.get("storageBucket") || "",
      messagingSenderId: params.get("messagingSenderId") || "",
      appId: params.get("appId") || "",
    };
    return cfg.apiKey && cfg.projectId ? cfg : null;
  } catch {
    return null;
  }
}

function buildOptions(data, fallbackTitle) {
  return {
    title: data.title || fallbackTitle || "DateWhere 💕",
    options: {
      body: (data.body || "").substring(0, 120),
      icon: data.icon || DEFAULT_ICON,
      badge: data.badge || DEFAULT_BADGE,
      // Rung kiểu Messenger: 2 nhịp ngắn + 1 nhịp dài (Android; iOS do OS quyết định)
      vibrate: [200, 100, 200, 100, 300],
      tag: data.tag || "datewhere-push",
      renotify: true,
      silent: false,
      data: {
        // Bấm vào notification → mở lại app đúng tab chat
        url: data.url || DEFAULT_URL,
        sender: data.sender || "",
        kind: data.kind || "chat",
      },
    },
  };
}

const firebaseConfig = readConfigFromQuery();

if (firebaseConfig) {
  try {
    importScripts(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
    );
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // FCM background message (app đóng / màn hình tắt):
    // OS tự sáng màn hình + hiện notification này.
    messaging.onBackgroundMessage((payload) => {
      const data = (payload && payload.data) || {};
      // Ưu tiên notification payload chuẩn FCM, fallback sang data payload tự định nghĩa
      const merged = {
        title:
          (payload.notification && payload.notification.title) || data.title,
        body:
          (payload.notification && payload.notification.body) || data.body || "",
        icon:
          (payload.notification && payload.notification.image) ||
          data.icon ||
          DEFAULT_ICON,
        tag: data.tag,
        url: data.url || (data.click_action) || DEFAULT_URL,
        sender: data.sender,
        kind: data.kind,
      };
      const { title, options } = buildOptions(merged);
      self.registration.showNotification(title, options);
    });
  } catch (err) {
    console.warn("[FCM-SW] Khởi tạo Firebase thất bại, dùng fallback handler:", err);
  }
} else {
  console.warn(
    "[FCM-SW] Chưa có Firebase web config (thiếu query ?apiKey=...). " +
      "Hãy cấu hình .env đầy đủ + bật push trong app. Fallback handler vẫn hoạt động."
  );
}

/* ── Fallback: push event dạng tự do (ntfy / Web Push thủ công) ──────────── */
self.addEventListener("push", (event) => {
  // Nếu FCM SDK đã xử lý (có firebaseConfig) thì vẫn hiển thị được,
  // nhưng tránh double khi payload là FCM chuẩn đã qua onBackgroundMessage.
  if (!event.data) return;
  let parsed = {};
  try {
    parsed = event.data.json() || {};
  } catch {
    parsed = { body: event.data.text() || "" };
  }
  // Payload FCM chuẩn có messageId + đã được SDK hiển thị → bỏ qua để khỏi trùng
  if (parsed && (parsed.messageId || parsed.from)) return;
  const flat = {
    title: parsed.title,
    body: parsed.body || parsed.message || "",
    icon: parsed.icon,
    badge: parsed.badge,
    tag: parsed.tag || (parsed.id ? `dw-${parsed.id}` : undefined),
    url: (parsed.data && parsed.data.url) || parsed.click || undefined,
  };
  if (!flat.title && !flat.body) return;
  const { title, options } = buildOptions(flat);
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Bấm vào notification → focus tab có sẵn (đúng URL chat) hoặc mở app ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          try {
            if ("navigate" in client) await client.navigate(targetUrl);
          } catch {}
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[FCM-SW] Notification dismissed:", event.notification.tag);
});
