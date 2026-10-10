// src/firebase/messaging.js
// Firebase Cloud Messaging (FCM) — Web Push plumbing cho DateWhere.
//
// Vai trò của file này:
//  - Xin quyền Notification + lấy FCM token (cần VITE_FIREBASE_VAPID_KEY).
//  - Lưu token theo từng user/coupleCode vào Firestore:
//      couples/{coupleCode}/fcmTokens/{userId} = { token, platform, updatedAt }
//  - Lắng nghe foreground message (khi app đang mở).
//
// GIỚI HẠN QUAN TRỌNG (đọc kỹ trước khi kỳ vọng như Messenger):
//  - Web KHÔNG thể tự bật sáng màn hình. Khi có push, CHÍNH HỆ ĐIỀU HÀNH
//    (Android/iOS) là bên bật sáng màn hình + rung + chuông + hiện banner.
//    Điều này chỉ xảy ra khi đã có server gửi push (FCM) tới thiết bị.
//  - Gửi FCM khi app đã tắt hẳn CẦN phía server (Cloud Function dùng
//    firebase-admin, trigger từ subcollection `pushQueue` mà client ghi ra).
//    Repo hiện chưa có thư mục functions/ nên vòng tròn đầy đủ sẽ hoàn tất
//    sau khi deploy Function mẫu trong README. Trước lúc đó, kênh nền thực tế
//    vẫn là ntfy.sh (giữ nguyên) + Firestore `pushQueue` cho tab nền.
//  - Nếu thiếu VAPID key hoặc trình duyệt không hỗ trợ Push, mọi hàm trả về
//    null/false một cách yên lặng — app KHÔNG crash, chỉ fallback về
//    in-app/toast + ntfy như cũ.

import { db, firebaseApp } from "./config.js";

/** VAPID public key — cấu hình qua .env (VITE_FIREBASE_VAPID_KEY). Thiếu = FCM tắt. */
export const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Kiểm tra trình duyệt có hỗ trợ Web Push hay không.
 * - Android Chrome/Edge/Samsung Internet: hỗ trợ đầy đủ.
 * - iOS: chỉ khi đã "Add to Home Screen" (PWA standalone) từ iOS 16.4+,
 *   và phải xin quyền từ trong PWA đã cài (không phải từ Safari tab).
 */
export const isPushSupported = () => {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
};

/** FCM chỉ hoạt động khi có đủ: firebase đã cấu hình + VAPID key + hỗ trợ Push. */
export const isFCMConfigured = () =>
  Boolean(FCM_VAPID_KEY) && firebaseApp !== null && isPushSupported();

const getPlatform = () => {
  try {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "web";
  } catch {
    return "web";
  }
};

/**
 * Dựng URL đăng ký firebase-messaging-sw.js, kèm public web config qua query string
 * (SW không đọc được import.meta.env nên phải truyền theo cách này — key này là
 * public theo thiết kế của Firebase, không phải secret).
 */
const buildMessagingSwUrl = () => {
  const base = import.meta.env.BASE_URL || "/Date_Where/";
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  });
  return `${base}firebase-messaging-sw.js?${params.toString()}`;
};

let fcmSwRegistrationPromise = null;

/**
 * Đăng ký SW riêng cho FCM (tách khỏi SW Workbox của vite-plugin-pwa).
 * Dùng chung scope/base để notification click mở đúng app.
 */
export const getFCMServiceWorkerRegistration = () => {
  if (fcmSwRegistrationPromise) return fcmSwRegistrationPromise;
  fcmSwRegistrationPromise = (async () => {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const scope = import.meta.env.BASE_URL || "/Date_Where/";
      const reg = await navigator.serviceWorker.register(buildMessagingSwUrl(), {
        scope,
      });
      return reg;
    } catch (err) {
      console.warn("[FCM] Không đăng ký được firebase-messaging-sw:", err);
      return null;
    }
  })();
  return fcmSwRegistrationPromise;
};

/**
 * Lấy FCM token của thiết bị này. Yêu cầu: đã granted quyền Notification
 * và đã có VAPID key. Thất bại → null (không throw).
 */
export const getFCMToken = async () => {
  if (!isFCMConfigured()) return null;
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    return null;
  }
  try {
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const registration = await getFCMServiceWorkerRegistration();
    if (!registration) return null;
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.warn("[FCM] getToken thất bại (thiếu VAPID/quyền/mạng?):", err);
    return null;
  }
};

/**
 * Lắng nghe message khi app đang mở (foreground). Trả về hàm unsubscribe.
 * Không hỗ trợ / chưa cấu hình → null.
 */
export const setupForegroundMessaging = async (onPayload) => {
  if (!isFCMConfigured()) return null;
  try {
    const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const messaging = getMessaging(firebaseApp);
    return onMessage(messaging, (payload) => {
      try {
        if (onPayload) onPayload(payload);
      } catch (err) {
        console.warn("[FCM] foreground handler lỗi:", err);
      }
    });
  } catch (err) {
    console.warn("[FCM] Không bật được foreground listener:", err);
    return null;
  }
};

/**
 * Lưu FCM token của user vào Firestore để server/Function biết gửi push cho ai.
 * couples/{coupleCode}/fcmTokens/{userId}
 */
export const saveFCMToken = async (coupleCode, userId, token) => {
  if (!db || !coupleCode || !userId || !token) return false;
  try {
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(
      doc(db, "couples", coupleCode, "fcmTokens", userId),
      { token, platform: getPlatform(), updatedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn("[FCM] Lưu token thất bại:", err);
    return false;
  }
};
