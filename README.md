# DateWhere 💕 — Không gian riêng của đôi mình (React + Vite + Tailwind + Firebase PWA)

## 🔔 Thông báo đẩy nền kiểu Messenger (chat khi tắt app / tắt màn hình)

**Cách hoạt động hiện tại:**
1. Khi A nhắn tin (`sendMessage`), app ghi tin nhắn vào Firestore (realtime như cũ) + ghi 1 document báo hiệu vào `couples/{code}/pushQueue` + gửi ntfy tới topic riêng của B.
2. **App đang mở (tab khác / chat đóng):** B nghe realtime → kêu "pop-ding" + rung + badge đỏ; chỉ bắn Notification hệ thống khi tab đang ẩn (`document.hidden`) → không double-notify tin của chính mình.
3. **App nền / đã đóng:** `public/firebase-messaging-sw.js` nhận background message FCM → `showNotification(title, { body, icon, badge, vibrate, tag, data: { url } })`. Bấm vào → mở lại app đúng tab chat (`?tab=chat`).
4. FCM token từng user lưu tại `couples/{code}/fcmTokens/{userId}` (cần `VITE_FIREBASE_VAPID_KEY` trong `.env`, xem `.env.example`).

**Sự thật cần biết:** web không thể tự bật sáng màn hình — khi push tới, **chính hệ điều hành** bật sáng + rung + chuông (giống hệt Messenger). Điều kiện: đã cho phép Notification + đã cài PWA (iOS bắt buộc "Add to Home Screen", iOS 16.4+).

**Cách test (2 thiết bị / 2 browser):**
1. Cả 2 máy ghép đôi cùng `coupleCode`, mở Hộp thông báo (🔔) → bấm "Bật thông báo nền" → cho phép Notification.
2. Máy B: chuyển sang tab khác / thu nhỏ app / tắt màn hình (giữ PWA đã cài).
3. Máy A: nhắn tin trong ChatWidget → máy B phải kêu + rung + hiện banner; bấm banner → mở đúng khung chat, badge đã đọc.

**Giới hạn còn lại:**
- Gửi FCM khi app **tắt hẳn** cần Cloud Function (dùng `firebase-admin`, trigger `onCreate` trên `pushQueue` → gửi tới token trong `fcmTokens` → xóa doc queue). Repo chưa có `functions/` nên vòng này hoàn tất sau khi deploy Function; trước lúc đó kênh nền thực tế là ntfy (máy nhận mở link kênh 1 lần để subscribe) + Firestore realtime khi app còn chạy ngầm.
- iOS: push nền chỉ tới PWA đã cài màn hình chính; xin quyền từ trong PWA, không phải tab Safari.
- Không có `VITE_FIREBASE_VAPID_KEY` thật → FCM tắt lặng lẽ, app vẫn chạy bình thường (không crash).

---
Dưới đây là template gốc của Vite:

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
