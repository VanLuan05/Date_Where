# Functions — DateWhere Push (Cụm 8)

Cloud Function đọc `couples/{code}/pushQueue/{id}` → gửi FCM tới `fcmTokens` → xóa doc.

## Deploy (1 lần)

```bash
npm i -g firebase-tools
firebase login
firebase use --add   # chọn project của bạn
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Cấu hình client để nhận FCM

1. Firebase Console → Project settings → Cloud Messaging → tạo Web Push key,填 vào `.env`:
   `VITE_FIREBASE_VAPID_KEY=...`
2. App đã đăng ký `public/firebase-messaging-sw.js` lazy + lưu token vào
   `couples/{code}/fcmTokens/{userId}` (xem `src/hooks/usePushNotifications.js`).
3. Gửi thử: tạo 1 doc trong `pushQueue` → check Functions logs:
   `firebase functions:log --only sendPushOnQueue`

## Fallback khi chưa deploy

- Client vẫn nghe `pushQueue` realtime (foreground) + ntfy.sh nền như cũ —
  không vỡ tính năng. Deploy function chỉ giúp **gửi FCM khi app tắt hẳn**.
