// src/hooks/usePushNotifications.js
// Hook đăng ký + nhận thông báo đẩy kiểu Messenger cho DateWhere.
//
// Luồng hoạt động:
//  1. enablePush(): xin quyền Notification → lấy FCM token → lưu vào
//     couples/{code}/fcmTokens/{role}. Thiếu VAPID/quyền bị deny/không hỗ trợ
//     → trả về trạng thái, KHÔNG throw, KHÔNG crash.
//  2. Tự động (silent) đăng ký lại token khi permission đã granted sẵn.
//  3. Foreground FCM (onMessage): phát âm thanh + rung, và chỉ bắn Notification
//     hệ thống khi `document.hidden === true` (đang ở tab khác / thu nhỏ app).
//     Bỏ qua tin do chính mình gửi (so sánh data.sender với role hiện tại).
//  4. Firestore `pushQueue` listener (fallback khi chưa có Function gửi FCM):
//     bắt document mới gửi cho mình → âm thanh/rung + Notification hệ thống nếu
//     tab đang ẩn. Dùng tag trùng với sender để OS gộp, tránh double-notify.

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../firebase/config.js";
import {
  getNotificationPermission,
  showNotification,
  playMessageSound,
  triggerMessageVibrate,
} from "../utils/notificationService.js";
import {
  isPushSupported,
  isFCMConfigured,
  getFCMToken,
  saveFCMToken,
  setupForegroundMessaging,
} from "../firebase/messaging.js";

const normalizeRole = (role) => (role === "user1" || role === "userA" ? "user1" : "user2");

export const usePushNotifications = (coupleCode, userId) => {
  const role = normalizeRole(userId);
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [fcmToken, setFcmToken] = useState(null);
  const [pushSupported] = useState(() => isPushSupported());
  const [fcmReady] = useState(() => isFCMConfigured());
  const [error, setError] = useState(null);

  const roleRef = useRef(role);
  roleRef.current = role;
  const seenPushIdsRef = useRef(new Set());

  /** Xin quyền + đăng ký FCM token (gọi từ nút "Bật thông báo nền"). */
  const enablePush = useCallback(async () => {
    setError(null);
    if (!isPushSupported()) {
      setPermission("unsupported");
      return "unsupported";
    }
    try {
      if (!("Notification" in window)) {
        setPermission("unsupported");
        return "unsupported";
      }
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res !== "granted") return res; // "denied" | "default": tôn trọng, không spam hỏi lại
      const token = await getFCMToken(); // null nếu thiếu VAPID key → fallback ntfy
      if (token) {
        setFcmToken(token);
        if (db && coupleCode) {
          await saveFCMToken(coupleCode, roleRef.current, token);
        }
      }
      return res;
    } catch (err) {
      console.warn("[Push] enablePush lỗi:", err);
      setError("Không bật được thông báo đẩy trên thiết bị này.");
      return getNotificationPermission();
    }
  }, [coupleCode]);

  // Tự động đăng ký/làm mới token khi quyền đã granted sẵn (không hỏi lại user).
  useEffect(() => {
    if (!db || !coupleCode) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getFCMToken();
        if (!cancelled && token) {
          setFcmToken(token);
          await saveFCMToken(coupleCode, roleRef.current, token);
        }
      } catch {
        // Im lặng: thiếu VAPID/mạng yếu không được làm phiền user
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coupleCode]);

  // Foreground FCM: chỉ hiện Notification hệ thống khi tab đang ẩn.
  useEffect(() => {
    let unsubscribe = null;
    let cancelled = false;
    (async () => {
      try {
        unsubscribe = await setupForegroundMessaging((payload) => {
          const data = (payload && payload.data) || {};
          if (data.sender && data.sender === roleRef.current) return; // tin của chính mình
          const title =
            (payload.notification && payload.notification.title) || data.title || "DateWhere 💕";
          const body =
            (payload.notification && payload.notification.body) || data.body || "";
          playMessageSound();
          triggerMessageVibrate();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("dw-push-message", { detail: { title, body, ...data } })
            );
          }
          if (typeof document !== "undefined" && document.hidden) {
            showNotification({
              title,
              body: String(body).substring(0, 100),
              tag: data.tag || `fcm-${Date.now()}`,
              data: { url: data.url },
            }).catch(() => {});
          }
        });
      } catch {
        // FCM chưa cấu hình → bỏ qua yên lặng
      }
    })();
    return () => {
      cancelled = true;
      try {
        if (unsubscribe) unsubscribe();
      } catch {}
    };
  }, []);

  // Fallback: nghe Firestore pushQueue khi chưa có Cloud Function gửi FCM.
  // Query equality-only (không orderBy) để KHÔNG đòi composite index.
  useEffect(() => {
    if (!db || !coupleCode) return;
    let unsubscribe = null;
    (async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const q = query(
          collection(db, "couples", coupleCode, "pushQueue"),
          where("targetRole", "==", roleRef.current)
        );
        const mountTime = Date.now();
        unsubscribe = onSnapshot(
          q,
          (snap) => {
            snap.docChanges().forEach((chg) => {
              if (chg.type !== "added") return;
              const id = chg.doc.id;
              if (seenPushIdsRef.current.has(id)) return;
              seenPushIdsRef.current.add(id);
              // Giữ Set gọn nhẹ
              if (seenPushIdsRef.current.size > 200) {
                const first = seenPushIdsRef.current.values().next().value;
                seenPushIdsRef.current.delete(first);
              }
              const d = chg.doc.data() || {};
              if (d.sender && d.sender === roleRef.current) return; // chính mình gửi
              const createdMs =
                d.createdAt && typeof d.createdAt.toMillis === "function"
                  ? d.createdAt.toMillis()
                  : mountTime;
              if (createdMs < mountTime - 5000) return; // bỏ qua lịch sử cũ
              playMessageSound();
              triggerMessageVibrate();
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("dw-push-message", { detail: { id, ...d } })
                );
              }
              // Chỉ bắn Notification hệ thống khi tab đang ẩn → không double-notify
              // với handler onSnapshot messages trong useAppState (dùng chung tag).
              if (typeof document !== "undefined" && document.hidden) {
                showNotification({
                  title: d.title || "DateWhere 💕",
                  body: String(d.body || "").substring(0, 100),
                  tag: d.tag || `pq-${id}`,
                  data: { url: d.url },
                }).catch(() => {});
              }
            });
          },
          () => {
            // Lỗi quyền/mạng → im lặng, app vẫn chạy bằng ntfy + in-app
          }
        );
      } catch {
        // Firestore chưa sẵn sàng → bỏ qua
      }
    })();
    return () => {
      try {
        if (unsubscribe) unsubscribe();
      } catch {}
    };
  }, [coupleCode]);

  // Cập nhật lại trạng thái quyền khi user quay lại app (có thể vừa đổi trong Settings).
  useEffect(() => {
    const refresh = () => setPermission(getNotificationPermission());
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return {
    permission, // 'granted' | 'denied' | 'default' | 'unsupported'
    pushSupported,
    fcmReady, // true khi đã có VAPID key + hỗ trợ Push
    fcmToken,
    error,
    enablePush,
  };
};

export default usePushNotifications;
