/**
 * functions/index.js (Cụm 8)
 * onDocumentCreated('couples/{code}/pushQueue/{id}')
 *   → đọc fcmTokens của phòng → gửi FCM (title/body từ push doc) → xóa doc.
 * Giữ fallback ntfy/client hiện tại nếu chưa deploy: client vẫn đọc pushQueue
 * realtime + ntfy.sh như cũ, function chỉ là kênh nền bổ sung.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.sendPushOnQueue = onDocumentCreated("couples/{code}/pushQueue/{pushId}", async (event) => {
  const { code, pushId } = event.params;
  const data = event.data?.data();
  if (!data) return;
  const { targetRole, title, body, url, tag } = data;

  try {
    // Đọc tokens của đối phương (docs fcmTokens/{userId} có field role)
    const toksSnap = await db.collection(`couples/${code}/fcmTokens`).get();
    const tokens = [];
    toksSnap.forEach((d) => {
      const t = d.data();
      if (t && t.token && (!targetRole || t.role === targetRole || d.id === targetRole)) {
        tokens.push(t.token);
      }
    });
    // Fallback: nếu không lọc được theo role, gửi cho tất cả token trong phòng
    if (tokens.length === 0) {
      toksSnap.forEach((d) => {
        const t = d.data();
        if (t && t.token) tokens.push(t.token);
      });
    }
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: title || "DateWhere 💕",
          body: body || "",
        },
        data: {
          url: url || "/Date_Where/",
          tag: tag || pushId,
          code,
        },
        tokens,
      };
      const resp = await admin.messaging().sendEachForMulticast(message);
      console.log(`[push] code=${code} sent=${resp.successCount} fail=${resp.failureCount}`);
    } else {
      console.log(`[push] code=${code} no tokens, skip FCM (client/ntfy fallback still works)`);
    }
  } catch (err) {
    console.error("[push] send error:", err);
  }

  // Xóa doc queue sau khi xử lý để receiver không đọc lại
  try {
    await event.data.ref.delete();
  } catch (err) {
    console.warn("[push] delete queue doc failed:", err?.message || err);
  }
});
