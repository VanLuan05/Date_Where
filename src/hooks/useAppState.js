/**
 * useAppState.js
 * Hook trung tâm quản lý trạng thái toàn ứng dụng DateWhere.
 *
 * Hỗ trợ 2 chế độ:
 *  - FIREBASE MODE: Real-time sync qua Firestore onSnapshot
 *  - OFFLINE MODE : Fallback về localStorage nếu Firebase chưa cấu hình
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  limitToLast,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import confetti from "canvas-confetti";
import { db } from "../firebase/config.js";
import { INITIAL_COUPLE } from "../data/mockData.js";
import { DEMO_PLACES, DEMO_DATES } from "../data/demoSeed.js";
import {
  loadFromStorage,
  saveToStorage,
  generateId,
} from "../utils/helpers.js";
import {
  getCurrentLocation,
  startWatchingLocation,
  stopWatchingLocation,
} from "../utils/locationService.js";
import {
  triggerHeartbeatHaptic,
  triggerLightTap,
} from "../utils/hapticService.js";
import {
  showNotification,
  sendRemoteNotification,
  playMessageSound,
  triggerMessageVibrate,
} from "../utils/notificationService.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const COUPLE_CODE_KEY = "datewhere_coupleCode";
const DEVICE_ROLE_KEY = "date_where_device_role";
const CURRENT_USER_KEY = "datewhere_currentUser";

const isFirebaseMode = db !== null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Lấy coupleCode đang dùng từ localStorage */
const getSavedCoupleCode = () => localStorage.getItem(COUPLE_CODE_KEY) || null;
const saveCoupleCode = (code) => {
  if (code) localStorage.setItem(COUPLE_CODE_KEY, code);
  else localStorage.removeItem(COUPLE_CODE_KEY);
};

/** Đọc device role từ localStorage (ưu tiên date_where_device_role) */
const getSavedDeviceRole = () => {
  return (
    localStorage.getItem(DEVICE_ROLE_KEY) ||
    localStorage.getItem(CURRENT_USER_KEY) ||
    "user1"
  );
};

const saveDeviceRole = (role) => {
  if (role) {
    localStorage.setItem(DEVICE_ROLE_KEY, role);
    localStorage.setItem(CURRENT_USER_KEY, role);
  }
};

// ─── Notification Storage & History ───────────────────────────────────────────
const NOTIFICATIONS_STORAGE_KEY = "dw_user_notifications";

const getSavedNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ─── Legacy Mock Place & Date Purge ───────────────────────────────────────────
// Nhận diện các địa điểm và lịch hẹn mẫu mặc định cũ để loại bỏ hoàn toàn
const LEGACY_MOCK_PLACE_IDS = new Set(["place-1", "place-2", "place-3", "place-4"]);
const LEGACY_MOCK_PLACE_NAMES = new Set([
  "The Workshop Coffee",
  "Propaganda Bistro",
  "Bui Vien Walking Street",
  "L'Usine Dong Khoi",
]);
const LEGACY_MOCK_DATE_IDS = new Set(["date-1", "date-2"]);

export const isLegacyMockPlace = (place) => {
  if (!place) return false;
  return (
    LEGACY_MOCK_PLACE_IDS.has(place.id) ||
    LEGACY_MOCK_PLACE_NAMES.has(place.name)
  );
};

export const isLegacyMockDate = (dateItem) => {
  if (!dateItem) return false;
  return (
    LEGACY_MOCK_DATE_IDS.has(dateItem.id) ||
    LEGACY_MOCK_PLACE_NAMES.has(dateItem.placeName)
  );
};

// ─── Data Sanitizer & Fallback Defaults ───────────────────────────────────────
export const sanitizeCoupleData = (data) => {
  if (!data || typeof data !== "object") return null;
  const rawPlaces = Array.isArray(data.places) ? data.places : [];
  const safePlaces = rawPlaces.filter((p) => !isLegacyMockPlace(p));

  const rawDates = Array.isArray(data.dates) ? data.dates : [];
  const safeDates = rawDates
    .filter((d) => !isLegacyMockDate(d))
    .map((d) => ({
      ...d,
      budget: d?.budget || { estimatedCost: 0, actualCost: 0, paidBy: "split" },
      recap: d?.recap || null,
    }));

  return {
    ...data,
    places: safePlaces,
    dates: safeDates,
    availability: data.availability || { user1: [], user2: [] },
    liveTouch: data.liveTouch || null,
    messages: Array.isArray(data.messages) ? data.messages : [],
    partnerLocations: data.partnerLocations || {
      user1: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
      user2: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
    },
    blindSwipes: data.blindSwipes || {},
  };
};

// ─── Firebase helpers ─────────────────────────────────────────────────────────
const getCoupleRef = (coupleCode) => doc(db, "couples", coupleCode);
const getMessagesRef = (coupleCode) => collection(db, "couples", coupleCode, "messages");
const MESSAGES_LIMIT = 100;

/**
 * Ghi mảng places/dates theo kiểu read-modify-write trong transaction
 * để 2 máy cùng thêm/sửa không ghi đè lẫn nhau (chống race/lost-update).
 * Trả về mảng mới sau khi ghi (hoặc null nếu lỗi).
 */
const transactArrayField = async (coupleCode, field, mutator) => {
  if (!db || !coupleCode) return null;
  const ref = getCoupleRef(coupleCode);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.exists() && Array.isArray(snap.data()[field])
        ? snap.data()[field]
        : [];
      const next = mutator(cur);
      tx.set(ref, { [field]: next }, { merge: true });
      return next;
    });
  } catch (err) {
    console.error(`Firestore transactArrayField(${field}) error:`, err);
    return null;
  }
};

/** Migrate lazy 1 lần: messages[] cũ trên doc -> subcollection messages */
const migrateLegacyMessages = async (coupleCode, legacyArr, guardRef) => {
  if (!db || !coupleCode || !Array.isArray(legacyArr) || legacyArr.length === 0) return;
  if (guardRef.current === coupleCode) return;
  guardRef.current = coupleCode;
  try {
    const msgsRef = getMessagesRef(coupleCode);
    const probe = await getDocs(query(msgsRef, limit(1)));
    if (!probe.empty) {
      // Subcollection đã có dữ liệu -> chỉ dọn mảng cũ
      try {
        await updateDoc(getCoupleRef(coupleCode), {
          messages: [],
          messagesMigratedAt: serverTimestamp(),
        });
      } catch {}
      return;
    }
    for (const m of legacyArr.slice(-MESSAGES_LIMIT)) {
      if (!m || m.id == null) continue;
      try {
        await setDoc(doc(db, "couples", coupleCode, "messages", String(m.id)), {
          id: m.id,
          sender: m.sender === "user2" ? "user2" : "user1",
          text: typeof m.text === "string" ? m.text.slice(0, 1000) : "",
          emoji: m.emoji || null,
          isSticker: Boolean(m.isSticker),
          createdAt: m.createdAt || new Date(Number(m.id) || Date.now()).toISOString(),
        });
      } catch {}
    }
    try {
      await updateDoc(getCoupleRef(coupleCode), {
        messages: [],
        messagesMigratedAt: serverTimestamp(),
      });
    } catch {}
  } catch (err) {
    console.warn("migrateLegacyMessages skipped:", err?.message || err);
    guardRef.current = null;
  }
};

/** Lấy document couple từ Firestore (one-time) */
export const fetchCoupleFromFirestore = async (coupleCode) => {
  try {
    const snap = await getDoc(getCoupleRef(coupleCode));
    if (snap.exists()) return sanitizeCoupleData(snap.data());
    return null;
  } catch (err) {
    console.error("Firestore fetchCouple error:", err);
    return null;
  }
};

/** Tạo phòng mới trên Firestore */
export const createCoupleOnFirestore = async (coupleCode, coupleData) => {
  try {
    await setDoc(getCoupleRef(coupleCode), {
      ...coupleData,
      coupleCode,
      createdAt: serverTimestamp(),
      places: [],
      dates: [],
      blindSwipes: {},
    });
    return true;
  } catch (err) {
    console.error("Firestore createCouple error:", err);
    return false;
  }
};

/** Cập nhật partial fields trên Firestore */
const updateCoupleOnFirestore = async (coupleCode, updates) => {
  if (!coupleCode) return;
  try {
    await updateDoc(getCoupleRef(coupleCode), updates);
  } catch (err) {
    // Nếu document chưa tồn tại thì dùng setDoc merge
    try {
      await setDoc(getCoupleRef(coupleCode), updates, { merge: true });
    } catch (err2) {
      console.error("Firestore updateCouple error:", err2);
    }
  }
};

// ─── Main Hook ────────────────────────────────────────────────────────────────
export const useAppState = () => {
  const [couple, setCouple] = useState(null);
  const [places, setPlaces] = useState([]);
  const [dates, setDates] = useState([]);
  const [blindSwipes, setBlindSwipes] = useState({});
  const [availability, setAvailability] = useState({ user1: [], user2: [] });
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState(() => getSavedNotifications());
  const [partnerLocations, setPartnerLocations] = useState({
    user1: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
    user2: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
  });
  const [liveTouch, setLiveTouch] = useState(null);
  const [incomingHeartbeat, setIncomingHeartbeat] = useState(null);
  const [incomingMood, setIncomingMood] = useState(null);
  const [activeUser, setActiveUser] = useState(() => getSavedDeviceRole());
  const [isLoaded, setIsLoaded] = useState(false);
  const [coupleCode, setCoupleCode] = useState(null);
  const [syncStatus, setSyncStatus] = useState("offline"); // "realtime" | "offline" | "connecting"
  const [offlineWarning, setOfflineWarning] = useState(false);

  const activeUserRef = useRef(activeUser);
  activeUserRef.current = activeUser;

  const lastHandledTouchTimeRef = useRef(Date.now());
  const lastHeartbeatSentRef = useRef(0);
  const lastHandledMsgIdRef = useRef(Date.now());
  const knownDateIdsRef = useRef(null);

  // Track previous matched count for confetti on new matches
  const prevMatchedCountRef = useRef(0);

  // ── Notification Action Handlers ────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    const newEntry = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: notif.type || "system", // "heartbeat" | "date" | "chat" | "place"
      title: notif.title || "DateWhere",
      content: notif.content || "",
      timestamp: notif.timestamp || new Date().toISOString(),
      read: false,
      metadata: notif.metadata || {},
    };

    setNotifications((prev) => {
      const updated = [newEntry, ...prev.filter((n) => n.id !== newEntry.id)].slice(0, 60);
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Save notification error:", e);
      }
      return updated;
    });
    return newEntry;
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch {}
  }, []);

  // Nhận thông báo chat từ messages listener (tránh stale closure)
  useEffect(() => {
    const handler = (e) => {
      const entry = e?.detail;
      if (!entry) return;
      setNotifications((prev) => [entry, ...prev.filter((n) => n.id !== entry.id)].slice(0, 60));
    };
    window.addEventListener("dw-notification", handler);
    return () => window.removeEventListener("dw-notification", handler);
  }, []);

  // Ref for watchPosition cleanup
  const watchIdRef = useRef(null);

  // Ref để tránh vòng lặp khi nhận onSnapshot update
  const unsubscribeRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);
  const migrationGuardRef = useRef(null);
  const coupleNamesRef = useRef({ user1: "Người ấy", user2: "Người ấy" });
  const coupleCodeRef = useRef(null);
  coupleCodeRef.current = coupleCode;

  // Thông báo cho tin nhắn mới (dùng chung cho messages subcollection listener)
  const notifyIncomingMessage = useCallback((lastMsg) => {
    const currentRole =
      activeUserRef.current === "user1" || activeUserRef.current === "userA"
        ? "user1"
        : "user2";
    if (!lastMsg || lastMsg.sender === currentRole) return;
    if (lastMsg.id <= lastHandledMsgIdRef.current) return;
    lastHandledMsgIdRef.current = lastMsg.id;
    triggerLightTap();
    const isHidden = typeof document === "undefined" || document.hidden;
    if (isHidden) {
      playMessageSound();
      triggerMessageVibrate();
    }
    const senderName =
      lastMsg.sender === "user1"
        ? coupleNamesRef.current.user1 || "Người ấy"
        : coupleNamesRef.current.user2 || "Người ấy";
    const textPreview = lastMsg.emoji
      ? `${lastMsg.emoji} ${lastMsg.text || ""}`.trim()
      : lastMsg.text || "";
    const baseUrl = import.meta.env.BASE_URL || "/Date_Where/";
    const notifTitle = `💬 ${senderName} đã gửi tin nhắn đến bạn`;
    const notifContent = lastMsg.isSticker
      ? `${lastMsg.emoji || "✨"} [Nhãn dán: ${lastMsg.text}]`
      : textPreview || "Gửi cho bạn một tin nhắn";
    if (typeof document === "undefined" || document.hidden) {
      showNotification({
        title: notifTitle,
        body: notifContent.substring(0, 80),
        tag: `msg-${lastMsg.id}`,
        data: { url: `${baseUrl}?tab=chat` },
      }).catch(() => {});
    }
    // addNotification via functional set to avoid stale closure
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      const entry = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "chat",
        title: notifTitle,
        content: notifContent,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: { msgId: lastMsg.id },
      };
      const updated = [entry, ...prev.filter((n) => n.id !== entry.id)].slice(0, 60);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      // cập nhật state qua event để không phụ thuộc closure
      window.dispatchEvent(new CustomEvent("dw-notification", { detail: entry }));
    } catch {}
  }, []);

  // Lắng nghe subcollection messages với paging (orderBy id + limitToLast 100)
  const subscribeToMessages = useCallback((code) => {
    if (!db || !code) return null;
    const q = query(getMessagesRef(code), orderBy("id", "asc"), limitToLast(MESSAGES_LIMIT));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs
          .map((d) => d.data())
          .filter((m) => m && m.id != null)
          .sort((a, b) => Number(a.id) - Number(b.id));
        setMessages(msgs);
        if (msgs.length > 0) notifyIncomingMessage(msgs[msgs.length - 1]);
      },
      (err) => console.error("messages onSnapshot error:", err)
    );
    return unsub;
  }, [notifyIncomingMessage]);

  // ── FIREBASE MODE ───────────────────────────────────────────────────────────
  const subscribeToFirestore = useCallback((code) => {
    if (!db || !code) return;

    // Hủy listener cũ nếu có (cả doc + messages subcollection)
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }

    setSyncStatus("connecting");

    const ref = getCoupleRef(code);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const rawData = snap.data();
          const sanitizedData = sanitizeCoupleData(rawData);
          const user1Data = sanitizedData.user1 || sanitizedData.userA || INITIAL_COUPLE.userA;
          const user2Data = sanitizedData.user2 || sanitizedData.userB || INITIAL_COUPLE.userB;

          setCouple({
            ...sanitizedData,
            user1: user1Data,
            user2: user2Data,
            userA: user1Data,
            userB: user2Data,
            status: sanitizedData.status || "dating",
            startDate: sanitizedData.startDate || "",
            inviteCode: sanitizedData.coupleCode,
            isConnected: true,
            coupleCode: sanitizedData.coupleCode,
          });
          setPlaces(sanitizedData.places);
          setDates(sanitizedData.dates);
          setBlindSwipes(sanitizedData.blindSwipes);
          setAvailability(sanitizedData.availability);
          setPartnerLocations(sanitizedData.partnerLocations);
          setLiveTouch(sanitizedData.liveTouch);
          // messages giờ là nguồn thật từ subcollection (listener riêng bên dưới).
          // Tương thích ngược: nếu doc cũ còn messages[] thì hiển thị tạm + migrate lazy 1 lần.
          coupleNamesRef.current = {
            user1: user1Data?.name || "Người ấy",
            user2: user2Data?.name || "Người ấy",
          };
          const legacyMsgs = Array.isArray(rawData.messages) ? rawData.messages : [];
          if (legacyMsgs.length > 0) {
            setMessages((prev) => (prev.length === 0 ? legacyMsgs : prev));
            migrateLegacyMessages(code, legacyMsgs, migrationGuardRef);
          }

          // Tự động dọn sạch các quán/lịch hẹn mẫu mặc định cũ trên Firestore nếu phát hiện
          if (
            (rawData.places || []).some(isLegacyMockPlace) ||
            (rawData.dates || []).some(isLegacyMockDate)
          ) {
            updateCoupleOnFirestore(code, {
              places: sanitizedData.places,
              dates: sanitizedData.dates,
            });
          }

          // Xử lý thông báo lịch hẹn mới từ đối phương (không thông báo cho chính người tạo)
          if (!knownDateIdsRef.current) {
            // Lần đầu tải: Ghi nhận tất cả ID lịch hẹn để không spam thông báo lịch cũ
            knownDateIdsRef.current = new Set((sanitizedData.dates || []).map((d) => d.id));
          } else {
            const currentRole =
              activeUserRef.current === "user1" || activeUserRef.current === "userA"
                ? "user1"
                : "user2";
            const newlyAddedDates = (sanitizedData.dates || []).filter(
              (d) => !knownDateIdsRef.current.has(d.id)
            );
            (sanitizedData.dates || []).forEach((d) => knownDateIdsRef.current.add(d.id));

            const baseUrl = import.meta.env.BASE_URL || "/Date_Where/";

            for (const newDate of newlyAddedDates) {
              if (newDate.createdBy && newDate.createdBy !== currentRole) {
                const partnerName =
                  newDate.createdBy === "user1"
                    ? user1Data?.name || "Người ấy"
                    : user2Data?.name || "Người ấy";
                const placeName = newDate.placeName || "địa điểm bí mật";
                const timeDetail = `${newDate.date || ""}${newDate.time ? ` lúc ${newDate.time}` : ""}`.trim();

                triggerLightTap();
                // Foreground: chỉ bắn Notification HỆ THỐNG khi tab đang ẩn
                // (tab khác/thu nhỏ app). Đang nhìn app → chỉ toast/rung + lịch sử.
                if (typeof document === "undefined" || document.hidden) {
                  showNotification({
                    title: `📅 ${partnerName} đã đặt lịch hẹn`,
                    body: `${partnerName} đã đặt lịch hẹn tại ${placeName}${timeDetail ? ` vào ${timeDetail}` : ""} 💕`,
                    tag: `date-${newDate.id}`,
                    data: { dateId: newDate.id, url: `${baseUrl}?tab=dates` },
                  }).catch(() => {});
                }

                addNotification({
                  type: "date",
                  title: `📅 ${partnerName} đã đặt lịch hẹn`,
                  content: `${partnerName} đã đặt lịch hẹn tại ${placeName}${timeDetail ? ` vào ${timeDetail}` : ""}. Nhớ mở xem nhé! 💕`,
                  metadata: { dateId: newDate.id },
                });
              }
            }
          }

          // Xử lý tín hiệu Live Touch thời gian thực từ đối phương
          if (sanitizedData.liveTouch && sanitizedData.liveTouch.timestamp) {
            const touch = sanitizedData.liveTouch;
            const now = Date.now();
            const currentRole = activeUserRef.current === "user1" || activeUserRef.current === "userA" ? "user1" : "user2";

            // Kiểm tra nếu tín hiệu từ đối phương và gửi cách đây chưa đầy 8 giây
            if (
              touch?.sender !== currentRole &&
              now - touch.timestamp < 8000 &&
              touch.timestamp > lastHandledTouchTimeRef.current
            ) {
              lastHandledTouchTimeRef.current = touch.timestamp;

              if (touch?.type === "heartbeat") {
                // Tự động rung điện thoại theo nhịp tim, visual pulse & audio
                triggerHeartbeatHaptic();
                setIncomingHeartbeat({
                  timestamp: touch.timestamp,
                  sender: touch.sender,
                  active: true,
                });
                const partnerName =
                  touch.sender === "user1"
                    ? user1Data?.name || "Người ấy"
                    : user2Data?.name || "Người ấy";
                // Chỉ bắn Notification hệ thống khi tab đang ẩn → không double-notify
                // khi user đang nhìn app (lúc đó đã có pulse/toast realtime).
                if (typeof document === "undefined" || document.hidden) {
                  showNotification({
                    title: `💖 ${partnerName} vừa gửi nhịp tim cho bạn!`,
                    body: "Nhấn để mở Date_Where và cảm nhận nhịp đập yêu thương 💕",
                    tag: `heartbeat-${touch.timestamp}`,
                  }).catch(() => {});
                }
                addNotification({
                  type: "heartbeat",
                  title: `💖 Nhịp tim từ ${partnerName}`,
                  content: `${partnerName} vừa gửi nhịp tim yêu thương (thình thịch...) đến bạn!`,
                  metadata: { sender: touch.sender },
                });
                setTimeout(() => {
                  setIncomingHeartbeat(null);
                }, 3500);
              } else if (touch?.type === "mood") {
                // Rung nhẹ và kích hoạt toast lãng mạn
                triggerLightTap();
                setIncomingMood({
                  ...touch,
                  active: true,
                });
              }
            }
          }

          // Tin nhắn mới: xử lý ở messages subcollection listener riêng
          // (giữ doc listener nhẹ, chống race ghi đè mảng messages[]).

          setSyncStatus("realtime");
        } else {
          setSyncStatus("offline");
        }
        setIsLoaded(true);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setSyncStatus("offline");
        setIsLoaded(true);
      }
    );

    unsubscribeRef.current = unsub;
    // Listener riêng cho messages subcollection (paging, không ghi đè mảng)
    try {
      unsubscribeMessagesRef.current = subscribeToMessages(code);
    } catch (err) {
      console.error("subscribeToMessages error:", err);
    }
  }, [subscribeToMessages]);

  // ── Cleanup listener + watchPosition khi unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
      if (watchIdRef.current !== null) {
        stopWatchingLocation(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // ── Khởi tạo app ────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedRole = getSavedDeviceRole();
    setActiveUser(savedRole);

    if (isFirebaseMode) {
      // Đọc trước cache offline từ localStorage để sẵn sàng giao diện ngay lập tức
      const stored = loadFromStorage();
      if (stored) {
        const storedCouple = stored.couple;
        if (storedCouple) {
          const u1 = storedCouple.user1 || storedCouple.userA || INITIAL_COUPLE.userA;
          const u2 = storedCouple.user2 || storedCouple.userB || INITIAL_COUPLE.userB;
          setCouple({
            ...storedCouple,
            user1: u1,
            user2: u2,
            userA: u1,
            userB: u2,
          });
        }
        const filteredPlaces = (stored.places || []).filter((p) => !isLegacyMockPlace(p));
        const filteredDates = (stored.dates || [])
          .filter((d) => !isLegacyMockDate(d))
          .map((d) => ({
            ...d,
            budget: d?.budget || { estimatedCost: 0, actualCost: 0, paidBy: "split" },
            recap: d?.recap || null,
          }));

        setPlaces(filteredPlaces);
        setDates(filteredDates);
        setBlindSwipes(stored.blindSwipes || {});
        setAvailability(stored.availability || { user1: [], user2: [] });
        setPartnerLocations(
          stored.partnerLocations || {
            user1: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
            user2: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
          }
        );
        setLiveTouch(stored.liveTouch || null);
        setMessages(stored.messages || []);

        // Tự động làm sạch cache localStorage nếu còn vướng dữ liệu mẫu cũ
        if (
          (stored.places || []).some(isLegacyMockPlace) ||
          (stored.dates || []).some(isLegacyMockDate)
        ) {
          saveToStorage({
            ...stored,
            places: filteredPlaces,
            dates: filteredDates,
          });
        }
      }

      // FIREBASE MODE: kiểm tra coupleCode đã lưu trong localStorage
      const savedCode = getSavedCoupleCode();
      if (savedCode) {
        setCoupleCode(savedCode);
        subscribeToFirestore(savedCode);

        // Fallback Timeout 3 giây: Nếu mạng chậm hoặc Firestore treo, tự mở khóa giao diện
        const safetyTimer = setTimeout(() => {
          setIsLoaded((loaded) => {
            if (!loaded) {
              console.warn("Firestore initial load timeout (3s) -> displaying cached offline data");
              return true;
            }
            return loaded;
          });
        }, 3000);

        return () => clearTimeout(safetyTimer);
      } else {
        // Chưa ghép đôi → hiện màn hình pairing
        setIsLoaded(true);
      }
    } else {
      // OFFLINE MODE: fallback localStorage
      setOfflineWarning(true);
      setSyncStatus("offline");
      const stored = loadFromStorage();
      if (stored) {
        const storedCouple = stored.couple;
        if (storedCouple) {
          const u1 = storedCouple.user1 || storedCouple.userA || INITIAL_COUPLE.userA;
          const u2 = storedCouple.user2 || storedCouple.userB || INITIAL_COUPLE.userB;
          setCouple({
            ...storedCouple,
            user1: u1,
            user2: u2,
            userA: u1,
            userB: u2,
          });
        }
        const filteredPlaces = (stored.places || []).filter((p) => !isLegacyMockPlace(p));
        const filteredDates = (stored.dates || [])
          .filter((d) => !isLegacyMockDate(d))
          .map((d) => ({
            ...d,
            budget: d?.budget || { estimatedCost: 0, actualCost: 0, paidBy: "split" },
            recap: d?.recap || null,
          }));

        setPlaces(filteredPlaces);
        setDates(filteredDates);
        setBlindSwipes(stored.blindSwipes || {});
        setAvailability(stored.availability || { user1: [], user2: [] });
        setPartnerLocations(
          stored.partnerLocations || {
            user1: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
            user2: { lat: 10.7769, lng: 106.7009, updatedAt: new Date().toISOString() },
          }
        );
        setLiveTouch(stored.liveTouch || null);
        setMessages(stored.messages || []);

        // Tự động làm sạch cache localStorage nếu còn vướng dữ liệu mẫu cũ
        if (
          (stored.places || []).some(isLegacyMockPlace) ||
          (stored.dates || []).some(isLegacyMockDate)
        ) {
          saveToStorage({
            ...stored,
            places: filteredPlaces,
            dates: filteredDates,
          });
        }
      }
      setIsLoaded(true);
    }
  }, [subscribeToFirestore]);

  // ── Persist offline state to localStorage ───────────────────────────────────
  useEffect(() => {
    if (!isLoaded || isFirebaseMode) return;
    saveToStorage({
      couple,
      places,
      dates,
      blindSwipes,
      availability,
      partnerLocations,
      liveTouch,
      messages,
      currentUser: activeUser,
      activeUser,
    });
  }, [couple, places, dates, blindSwipes, availability, partnerLocations, liveTouch, messages, activeUser, isLoaded]);

  // ── Persist device role to localStorage (cả 2 mode) ─────────────────────────
  useEffect(() => {
    if (isLoaded) saveDeviceRole(activeUser);
  }, [activeUser, isLoaded]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  /**
   * Cố định tài khoản trên thiết bị:
   * Mỗi thiết bị chỉ dùng 1 tài khoản của người đó, không có quyền chuyển đổi qua lại.
   */
  const switchUser = useCallback(() => {
    console.warn("Mỗi thiết bị chỉ được sử dụng 1 tài khoản cố định của người đó. Không thể chuyển đổi.");
  }, []);

  /** Cập nhật thông tin couple (nickname, avatar, status, startDate) */
  const updateCouple = useCallback(
    async (updates) => {
      const normalized = { ...updates };
      if (updates.user1) normalized.userA = updates.user1;
      else if (updates.userA) normalized.user1 = updates.userA;

      if (updates.user2) normalized.userB = updates.user2;
      else if (updates.userB) normalized.user2 = updates.userB;

      setCouple((prev) => ({ ...prev, ...normalized }));
      if (isFirebaseMode && coupleCodeRef.current) {
        await updateCoupleOnFirestore(coupleCodeRef.current, normalized);
      }
    },
    []
  );

  /** Thêm địa điểm mới (transaction chống race 2 máy cùng thêm) */
  const addPlace = useCallback(
    async (placeData) => {
      const newPlace = {
        id: `place-${generateId()}`,
        ...placeData,
        addedBy: activeUser,
        addedAt: new Date().toISOString(),
        rating: placeData.rating ?? 0,
        visited: placeData.visited ?? false,
        favorite: placeData.favorite ?? false,
      };

      if (isFirebaseMode && coupleCodeRef.current) {
        const code = coupleCodeRef.current;
        setPlaces((prev) => [newPlace, ...prev].slice(0, 500));
        await transactArrayField(code, "places", (cur) =>
          [newPlace, ...cur.filter((p) => p?.id !== newPlace.id)].slice(0, 500)
        );
      } else {
        setPlaces((prev) => [newPlace, ...prev]);
      }
      return newPlace;
    },
    [activeUser]
  );

  /** Cập nhật một địa điểm (transaction read-modify-write) */
  const updatePlace = useCallback(async (id, updates) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      const code = coupleCodeRef.current;
      setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      await transactArrayField(code, "places", (cur) =>
        cur.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } else {
      setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    }
  }, []);

  /** Xóa một địa điểm (transaction) */
  const deletePlace = useCallback(async (id) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      const code = coupleCodeRef.current;
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      await transactArrayField(code, "places", (cur) => cur.filter((p) => p.id !== id));
    } else {
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  /**
   * Xóa toàn bộ địa điểm (làm sạch kho địa điểm trên cả Firestore và localStorage)
   */
  const clearAllPlaces = useCallback(async () => {
    setPlaces([]);
    setBlindSwipes({});

    if (isFirebaseMode && coupleCodeRef.current) {
      await updateCoupleOnFirestore(coupleCodeRef.current, {
        places: [],
        blindSwipes: {},
      });
    } else {
      const saved = loadFromStorage();
      if (saved) {
        saved.places = [];
        saved.blindSwipes = {};
        saveToStorage(saved);
      }
    }
  }, []);

  /** Thêm lịch hẹn mới: Tự động ký tên createdBy: activeUser của thiết bị đó */
  const addDate = useCallback(
    async (dateData) => {
      const estimated = Number(dateData.estimatedCost) || Number(dateData.budget?.estimatedCost) || 0;
      const newDate = {
        id: `date-${generateId()}`,
        ...dateData,
        status: "upcoming",
        budget: dateData.budget || {
          estimatedCost: estimated,
          actualCost: 0,
          paidBy: dateData.paidBy || "split",
        },
        createdBy: activeUser,
        createdAt: new Date().toISOString(),
      };

      if (isFirebaseMode && coupleCodeRef.current) {
        const code = coupleCodeRef.current;
        setDates((prev) => [newDate, ...prev].slice(0, 500));
        await transactArrayField(code, "dates", (cur) =>
          [newDate, ...cur.filter((d) => d?.id !== newDate.id)].slice(0, 500)
        );
      } else {
        setDates((prev) => {
          const newDates = [newDate, ...prev];
          try {
            localStorage.setItem("date_where_dates", JSON.stringify(newDates));
          } catch (e) {
            console.error(e);
          }
          return newDates;
        });
      }

      // Không gửi thông báo cho chính mình (người tạo lịch)
      if (knownDateIdsRef.current) {
        knownDateIdsRef.current.add(newDate.id);
      }

      // Gửi thông báo từ xa đến ĐỐI PHƯƠNG (ngay cả khi đối phương không mở app)
      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
      const targetRole = roleKey === "user1" ? "user2" : "user1";
      const creatorInfo =
        roleKey === "user1"
          ? couple?.user1 || couple?.userA
          : couple?.user2 || couple?.userB;
      const creatorName = creatorInfo?.name || "Người ấy";
      const placeName = newDate.placeName || "địa điểm bí mật";
      const timeDetail = `${newDate.date || ""}${newDate.time ? ` lúc ${newDate.time}` : ""}`.trim();
      const defaultUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?tab=dates`
          : "/Date_Where/?tab=dates";

      sendRemoteNotification({
        coupleCode: coupleCodeRef.current,
        targetRole,
        sender: roleKey,
        kind: "date",
        title: `📅 ${creatorName} đã đặt lịch hẹn`,
        body: `${creatorName} đã đặt lịch hẹn tại ${placeName}${timeDetail ? ` vào ${timeDetail}` : ""} 💕`,
        url: defaultUrl,
        tag: `date-${newDate.id}`,
        tags: ["calendar", "heart"],
      });

      return newDate;
    },
    [activeUser, couple]
  );

  /** Cập nhật lịch hẹn (transaction) */
  const updateDate = useCallback(async (id, updates) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      const code = coupleCodeRef.current;
      setDates((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      await transactArrayField(code, "dates", (cur) =>
        cur.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
    } else {
      setDates((prev) => {
        const newDates = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
        try {
          localStorage.setItem("date_where_dates", JSON.stringify(newDates));
        } catch (e) {
          console.error("Local storage dates save error:", e);
        }
        return newDates;
      });
    }
  }, []);

  /**
   * Lưu nhật ký & album kỷ niệm sau buổi hẹn (Date Recap)
   * Cập nhật recap, budget chi phí thực tế, chuyển status: 'completed'
   */
  const saveDateRecap = useCallback(
    async (dateId, recapData) => {
      const completedAt = recapData.completedAt || new Date().toISOString();
      const updatedBy = recapData.updatedBy || activeUser || "user1";

      const recapPayload = {
        photos: Array.isArray(recapData.photos) ? recapData.photos : [],
        rating: typeof recapData.rating === "number" ? recapData.rating : 5,
        foodReview: recapData.foodReview || "",
        bestMoment: recapData.bestMoment || "",
        completedAt,
        updatedBy,
      };

      const budgetUpdate = recapData.budget;

      if (isFirebaseMode && coupleCodeRef.current) {
        const code = coupleCodeRef.current;
        const applyRecap = (d) =>
          d.id === dateId
            ? {
                ...d,
                status: "completed",
                recap: recapPayload,
                budget: budgetUpdate
                  ? {
                      estimatedCost: budgetUpdate.estimatedCost ?? d.budget?.estimatedCost ?? 0,
                      actualCost: Number(budgetUpdate.actualCost) >= 0 ? Number(budgetUpdate.actualCost) : (d.budget?.actualCost ?? 0),
                      paidBy: budgetUpdate.paidBy || d.budget?.paidBy || "split",
                    }
                  : d.budget,
              }
            : d;
        setDates((prev) => prev.map(applyRecap));
        await transactArrayField(code, "dates", (cur) => cur.map(applyRecap));
      } else {
        setDates((prev) => {
          const newDates = prev.map((d) =>
            d.id === dateId
              ? {
                  ...d,
                  status: "completed",
                  recap: recapPayload,
                  budget: budgetUpdate
                    ? {
                        estimatedCost: budgetUpdate.estimatedCost ?? d.budget?.estimatedCost ?? 0,
                        actualCost: Number(budgetUpdate.actualCost) >= 0 ? Number(budgetUpdate.actualCost) : (d.budget?.actualCost ?? 0),
                        paidBy: budgetUpdate.paidBy || d.budget?.paidBy || "split",
                      }
                    : d.budget,
                }
              : d
          );
          try {
            localStorage.setItem("date_where_dates", JSON.stringify(newDates));
          } catch (e) {
            console.error("Local storage date recap save error:", e);
          }
          return newDates;
        });
      }
    },
    [activeUser]
  );

  /** Xóa lịch hẹn (transaction) */
  const deleteDate = useCallback(async (id) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      const code = coupleCodeRef.current;
      setDates((prev) => prev.filter((d) => d.id !== id));
      await transactArrayField(code, "dates", (cur) => cur.filter((d) => d.id !== id));
    } else {
      setDates((prev) => prev.filter((d) => d.id !== id));
    }
  }, []);

  /**
   * Quẹt quán bí mật (Blind Matching)
   * action: 'like' | 'pass'
   */
  const swipePlace = useCallback(
    async (placeId, action) => {
      if (!placeId) return { isMatch: false };
      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
      const partnerRoleKey = roleKey === "user1" ? "user2" : "user1";
      const isLike = action === "like";

      const placeSwipe = blindSwipes?.[placeId] || {};
      const partnerLiked = placeSwipe[partnerRoleKey] === true;
      const isMatch = isLike && partnerLiked;

      const updatedPlaceSwipe = {
        ...placeSwipe,
        [roleKey]: isLike,
        matched: isMatch || placeSwipe.matched || false,
        matchedAt: isMatch ? new Date().toISOString() : (placeSwipe.matchedAt || null),
      };

      const newBlindSwipes = {
        ...blindSwipes,
        [placeId]: updatedPlaceSwipe,
      };

      setBlindSwipes(newBlindSwipes);

      // Nếu Match thành công, lập tức kích hoạt pháo hoa
      if (isMatch) {
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          console.log("Confetti trigger:", e);
        }
      }

      if (isFirebaseMode && coupleCodeRef.current) {
        await updateCoupleOnFirestore(coupleCodeRef.current, {
          [`blindSwipes.${placeId}`]: updatedPlaceSwipe,
        });
      }

      return { isMatch, placeId };
    },
    [activeUser, blindSwipes]
  );

  /** Reset toàn bộ lượt quẹt quán để chơi lại từ đầu */
  const resetSwipes = useCallback(async () => {
    setBlindSwipes({});
    if (isFirebaseMode && coupleCodeRef.current) {
      await updateCoupleOnFirestore(coupleCodeRef.current, {
        blindSwipes: {},
      });
    }
  }, []);

  // ─── Availability Management ──────────────────────────────────────────────

  /**
   * Toggle a date+slot entry in the active user's availability.
   * @param {string} dateStr - "YYYY-MM-DD"
   * @param {string} slot - 'all' | 'morning' | 'afternoon' | 'evening'
   */
  const toggleAvailability = useCallback(
    async (dateStr, slot = "all") => {
      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
      const entry = `${dateStr}_${slot}`;

      setAvailability((prev) => {
        const currentEntries = [...(prev[roleKey] || [])];
        const idx = currentEntries.indexOf(entry);
        let newEntries;
        if (idx >= 0) {
          // Remove
          newEntries = currentEntries.filter((e) => e !== entry);
        } else {
          // Add
          newEntries = [...currentEntries, entry];
        }

        const newAvailability = {
          ...prev,
          [roleKey]: newEntries,
          updatedAt: new Date().toISOString(),
        };

        // Persist to Firestore
        if (isFirebaseMode && coupleCodeRef.current) {
          updateCoupleOnFirestore(coupleCodeRef.current, {
            availability: newAvailability,
          });
        }

        return newAvailability;
      });
    },
    [activeUser]
  );

  /**
   * Clear availability for a specific month (for the active user only).
   * @param {string} monthStr - "YYYY-MM"
   */
  const clearAvailability = useCallback(
    async (monthStr) => {
      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";

      setAvailability((prev) => {
        const currentEntries = prev[roleKey] || [];
        const filtered = currentEntries.filter((e) => !e.startsWith(monthStr));

        const newAvailability = {
          ...prev,
          [roleKey]: filtered,
          updatedAt: new Date().toISOString(),
        };

        if (isFirebaseMode && coupleCodeRef.current) {
          updateCoupleOnFirestore(coupleCodeRef.current, {
            availability: newAvailability,
          });
        }

        return newAvailability;
      });
    },
    [activeUser]
  );

  /**
   * Computed matched free days (intersection of user1 & user2 availability)
   * Fires confetti when new matches appear.
   */
  const matchedFreeDays = useMemo(() => {
    const avail1 = Array.isArray(availability?.user1) ? availability.user1 : [];
    const avail2 = Array.isArray(availability?.user2) ? availability.user2 : [];
    if (avail1.length === 0 || avail2.length === 0) return [];

    const map1 = {};
    avail1.forEach((entry) => {
      if (typeof entry !== "string") return;
      const [dateStr, slot] = entry.split("_");
      if (!map1[dateStr]) map1[dateStr] = [];
      map1[dateStr].push(slot);
    });

    const map2 = {};
    avail2.forEach((entry) => {
      if (typeof entry !== "string") return;
      const [dateStr, slot] = entry.split("_");
      if (!map2[dateStr]) map2[dateStr] = [];
      map2[dateStr].push(slot);
    });

    const matched = [];
    const allDates = new Set([...Object.keys(map1), ...Object.keys(map2)]);

    allDates.forEach((dateStr) => {
      const slots1 = map1[dateStr] || [];
      const slots2 = map2[dateStr] || [];
      if (slots1.length === 0 || slots2.length === 0) return;

      for (const s1 of slots1) {
        for (const s2 of slots2) {
          if (s1 === s2 || s1 === "all" || s2 === "all") {
            const matchedSlot = s1 === "all" ? s2 : s1;
            matched.push({ dateStr, slot: matchedSlot });
            return;
          }
        }
      }
    });

    return matched.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [availability]);

  // Fire confetti when new matched days appear
  useEffect(() => {
    if (matchedFreeDays.length > prevMatchedCountRef.current && prevMatchedCountRef.current >= 0) {
      // Only fire after initial load
      if (isLoaded && prevMatchedCountRef.current > 0) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.5 },
            colors: ["#f43f5e", "#ec4899", "#f472b6", "#fda4af", "#fecdd3"],
          });
        } catch (e) {
          console.log("Confetti trigger:", e);
        }
      }
    }
    prevMatchedCountRef.current = matchedFreeDays.length;
  }, [matchedFreeDays, isLoaded]);

  // ─── Partner Location Sharing ─────────────────────────────────────────────

  /**
   * Lấy GPS hiện tại và cập nhật lên Firestore cho activeUser.
   * @returns {Promise<{lat: number, lng: number} | null>}
   */
  const shareCurrentLocation = useCallback(
    async () => {
      try {
        const loc = await getCurrentLocation();
        const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
        const locData = {
          lat: loc.lat,
          lng: loc.lng,
          updatedAt: new Date().toISOString(),
          status: "active",
          addressName: "",
        };

        setPartnerLocations((prev) => ({
          ...prev,
          [roleKey]: locData,
        }));

        if (isFirebaseMode && coupleCodeRef.current) {
          await updateCoupleOnFirestore(coupleCodeRef.current, {
            [`partnerLocations.${roleKey}`]: locData,
          });
        }

        return { lat: loc.lat, lng: loc.lng };
      } catch (err) {
        console.error("shareCurrentLocation error:", err);
        throw err;
      }
    },
    [activeUser]
  );

  /**
   * Bật chế độ watchPosition liên tục — gửi tọa độ khi di chuyển.
   * Đối phương sẽ thấy avatar đang di chuyển tiến về phía quán hẹn.
   */
  const startOnTheWayMode = useCallback(
    () => {
      // Dừng watch cũ nếu có
      if (watchIdRef.current !== null) {
        stopWatchingLocation(watchIdRef.current);
        watchIdRef.current = null;
      }

      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";

      const watchId = startWatchingLocation(
        (loc) => {
          const locData = {
            lat: loc.lat,
            lng: loc.lng,
            updatedAt: new Date().toISOString(),
            status: "on_the_way",
            addressName: "",
          };

          setPartnerLocations((prev) => ({
            ...prev,
            [roleKey]: locData,
          }));

          if (isFirebaseMode && coupleCodeRef.current) {
            updateCoupleOnFirestore(coupleCodeRef.current, {
              [`partnerLocations.${roleKey}`]: locData,
            });
          }
        },
        (err) => {
          console.warn("watchPosition error:", err);
        }
      );

      watchIdRef.current = watchId;
    },
    [activeUser]
  );

  /**
   * Dừng theo dõi GPS (tiết kiệm pin), chuyển status về 'idle'.
   */
  const stopOnTheWayMode = useCallback(
    async () => {
      if (watchIdRef.current !== null) {
        stopWatchingLocation(watchIdRef.current);
        watchIdRef.current = null;
      }

      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";

      setPartnerLocations((prev) => {
        if (!prev[roleKey]) return prev;
        return {
          ...prev,
          [roleKey]: {
            ...prev[roleKey],
            status: "idle",
            updatedAt: new Date().toISOString(),
          },
        };
      });

      if (isFirebaseMode && coupleCodeRef.current) {
        await updateCoupleOnFirestore(coupleCodeRef.current, {
          [`partnerLocations.${roleKey}.status`]: "idle",
          [`partnerLocations.${roleKey}.updatedAt`]: new Date().toISOString(),
        });
      }
    },
    [activeUser]
  );

  /**
   * Gửi tín hiệu nhịp đập tim đến đối phương (Throttled 800ms - 1.2s).
   * Tự rung nhẹ ngay trên máy người gửi và cập nhật Firestore / localStorage.
   * Đồng thời gửi thông báo nền qua Service Worker.
   */
  const sendHeartbeat = useCallback(async () => {
    const now = Date.now();
    // Throttle ít nhất 900ms để tránh spam ghi Firestore
    if (now - lastHeartbeatSentRef.current < 900) {
      return false;
    }
    lastHeartbeatSentRef.current = now;

    const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
    const touchData = {
      sender: roleKey,
      type: "heartbeat",
      timestamp: now,
    };

    // Tự rung nhẹ ngay trên máy người gửi
    triggerHeartbeatHaptic();
    setLiveTouch(touchData);

    // Xác định tên người gửi để hiện trong thông báo
    const senderInfo =
      roleKey === "user1"
        ? couple?.user1 || couple?.userA
        : couple?.user2 || couple?.userB;
    const senderName = senderInfo?.name || "Người ấy";

    const targetRole = roleKey === "user1" ? "user2" : "user1";

    // Gửi thông báo từ xa đến ĐỐI PHƯƠNG (ngay cả khi đối phương không mở app)
    // KHÔNG gọi showNotification hay addNotification trên máy người gửi
    sendRemoteNotification({
      coupleCode: coupleCodeRef.current,
      targetRole,
      sender: roleKey,
      kind: "heartbeat",
      title: `💖 ${senderName} vừa gửi nhịp tim cho bạn!`,
      body: "Nhấn để mở Date_Where và cảm nhận nhịp đập yêu thương 💕",
      tag: `heartbeat-${now}`,
      tags: ["heart", "sparkles"],
    });

    if (isFirebaseMode && coupleCodeRef.current) {
      await updateCoupleOnFirestore(coupleCodeRef.current, {
        liveTouch: touchData,
      });
    } else {
      const saved = loadFromStorage();
      if (saved) {
        saved.liveTouch = touchData;
        saveToStorage(saved);
      }
    }
    return true;
  }, [activeUser, couple]);

  /**
   * Gửi tin nhắn mini chat đến đối phương — Messenger style.
   * Cập nhật lên Firestore và gửi thông báo từ xa đến đối phương.
   */
  const sendMessage = useCallback(
    async (text, emoji = null, isSticker = false) => {
      const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
      const targetRole = roleKey === "user1" ? "user2" : "user1";
      const senderInfo =
        roleKey === "user1"
          ? couple?.user1 || couple?.userA
          : couple?.user2 || couple?.userB;
      const senderName = senderInfo?.name || "Người ấy";

      const newMsg = {
        id: Date.now(),
        sender: roleKey,
        text: text || "",
        emoji: emoji || null,
        isSticker: Boolean(isSticker),
        createdAt: new Date().toISOString(),
      };

      // Ghi nhận ID tin nhắn này để thiết bị người gửi không bao giờ kích hoạt lại thông báo
      lastHandledMsgIdRef.current = newMsg.id;
      triggerLightTap();

      const notifBody = isSticker
        ? `${emoji || "✨"} [Nhãn dán: ${text}]`
        : emoji
        ? `${emoji} ${text || ""}`.trim()
        : text;

      // KHÔNG gọi showNotification hay addNotification cho chính mình!
      // Gửi thông báo từ xa đến ĐỐI PHƯƠNG (ngay cả khi đối phương không mở app)
      const defaultUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?tab=chat`
          : "/Date_Where/?tab=chat";

      sendRemoteNotification({
        coupleCode: coupleCodeRef.current,
        targetRole,
        sender: roleKey,
        kind: "chat",
        title: `💬 ${senderName} đã gửi tin nhắn đến bạn`,
        body: (notifBody || "Gửi cho bạn một tin nhắn").substring(0, 100),
        url: defaultUrl,
        tag: `msg-${newMsg.id}`,
        tags: ["speech_balloon", "love_letter"],
      });

      if (isFirebaseMode && coupleCodeRef.current) {
        // Chat mới: ghi 1 doc riêng vào subcollection (addDoc, không ghi đè mảng).
        // Optimistic update local để hiện ngay, listener paging sẽ chuẩn hóa lại.
        setMessages((prev) => [...prev, newMsg].slice(-MESSAGES_LIMIT));
        try {
          await addDoc(getMessagesRef(coupleCodeRef.current), {
            ...newMsg,
            text: (newMsg.text || "").slice(0, 1000),
            createdAtTs: serverTimestamp(),
          });
        } catch (err) {
          console.error("sendMessage addDoc error:", err);
        }
      } else {
        setMessages((prev) => [...prev, newMsg].slice(-100));
      }
      return newMsg;
    },
    [activeUser, couple]
  );

  /**
   * Gửi trạng thái tâm trạng nhanh đến đối phương
   */
  const sendQuickMood = useCallback(async (moodText, moodIcon) => {
    const now = Date.now();
    const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
    const targetRole = roleKey === "user1" ? "user2" : "user1";
    const touchData = {
      sender: roleKey,
      type: "mood",
      moodText,
      moodIcon,
      timestamp: now,
    };

    triggerLightTap();
    setLiveTouch(touchData);

    const senderInfo =
      roleKey === "user1"
        ? couple?.user1 || couple?.userA
        : couple?.user2 || couple?.userB;
    const senderName = senderInfo?.name || "Người ấy";

    // Gửi thông báo đến đối phương (không hiển thị cho chính mình)
    sendRemoteNotification({
      coupleCode: coupleCodeRef.current,
      targetRole,
      sender: roleKey,
      kind: "mood",
      title: `💌 ${senderName} đã chia sẻ tâm trạng`,
      body: `${moodIcon || "🌸"} "${moodText || "Đang nhớ bạn..."}"`,
      tag: `mood-${now}`,
      tags: ["thought_balloon", "heart"],
    });

    if (isFirebaseMode && coupleCodeRef.current) {
      await updateCoupleOnFirestore(coupleCodeRef.current, {
        liveTouch: touchData,
      });
    } else {
      const saved = loadFromStorage();
      if (saved) {
        saved.liveTouch = touchData;
        saveToStorage(saved);
      }
    }
    return true;
  }, [activeUser, couple]);

  /** Đóng thông báo toast tâm trạng từ đối phương */
  const dismissIncomingMood = useCallback(() => {
    setIncomingMood(null);
  }, []);

  /**
   * Được gọi sau khi ghép đôi thành công.
   * FIREBASE: lưu coupleCode → subscribe onSnapshot.
   * OFFLINE: lưu vào localStorage.
   */
  const completePairing = useCallback(
    (pairingData, code) => {
      if (isFirebaseMode && code) {
        saveCoupleCode(code);
        setCoupleCode(code);
        subscribeToFirestore(code);
      } else if (!isFirebaseMode) {
        // Offline fallback
        const role = getSavedDeviceRole();
        const coupleData = pairingData || INITIAL_COUPLE;
        const u1 = coupleData.user1 || coupleData.userA;
        const u2 = coupleData.user2 || coupleData.userB;
        saveToStorage({
          couple: {
            ...coupleData,
            user1: u1,
            user2: u2,
            userA: u1,
            userB: u2,
            isConnected: true,
          },
          places: [],
          dates: [],
          blindSwipes: {},
          currentUser: role,
          activeUser: role,
        });
        window.location.reload();
      }
    },
    [subscribeToFirestore]
  );

  /** Nạp demo 1 chạm: 6 quán + 2 date mẫu khi kho trống */
  const seedDemoContent = useCallback(async () => {
    const now = new Date().toISOString();
    const demoPlaces = DEMO_PLACES.map((p) => ({
      id: `place-${generateId()}`,
      ...p,
      addedBy: "user1",
      addedAt: now,
    }));
    const demoDates = DEMO_DATES.map((d) => ({
      id: `date-${generateId()}`,
      ...d,
      status: "upcoming",
      createdBy: "user1",
      createdAt: now,
    }));
    setPlaces((prev) => (prev.length > 0 ? prev : demoPlaces));
    setDates((prev) => (prev.length > 0 ? prev : demoDates));
    if (isFirebaseMode && coupleCodeRef.current) {
      const code = coupleCodeRef.current;
      await transactArrayField(code, "places", (cur) => (cur.length > 0 ? cur : demoPlaces));
      await transactArrayField(code, "dates", (cur) => (cur.length > 0 ? cur : demoDates));
    }
    try {
      console.info("[demo_seed]", { places: demoPlaces.length, dates: demoDates.length });
    } catch {}
    return { places: demoPlaces.length, dates: demoDates.length };
  }, []);

  /** Reset toàn bộ - xóa localStorage + unsubscribe Firestore */
  const resetApp = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }
    saveCoupleCode(null);
    localStorage.removeItem(DEVICE_ROLE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    saveToStorage(null);
    setCoupleCode(null);
    setCouple(null);
    setPlaces([]);
    setDates([]);
    setBlindSwipes({});
    setActiveUser("user1");
    setSyncStatus("offline");
    window.location.reload();
  }, []);

  return {
    couple,
    places,
    dates,
    blindSwipes,
    availability,
    matchedFreeDays,
    activeUser,
    currentUser: activeUser, // Backward compatibility alias
    isLoaded,
    coupleCode,
    syncStatus,
    offlineWarning,
    isFirebaseMode,
    // Actions
    switchUser,
    updateCouple,
    addPlace,
    updatePlace,
    deletePlace,
    addDate,
    updateDate,
    deleteDate,
    saveDateRecap,
    swipePlace,
    resetSwipes,
    resetApp,
    completePairing,
    toggleAvailability,
    clearAvailability,
    // Places management
    clearAllPlaces,
    seedDemoContent,
    // Location sharing
    partnerLocations,
    shareCurrentLocation,
    startOnTheWayMode,
    stopOnTheWayMode,
    // Live Touch & Haptic Heartbeat
    liveTouch,
    incomingHeartbeat,
    incomingMood,
    sendHeartbeat,
    sendQuickMood,
    dismissIncomingMood,
    // Mini Chat Messenger
    messages,
    sendMessage,
    // Notifications Center & History
    notifications,
    unreadNotificationsCount: notifications.filter((n) => !n.read).length,
    addNotification,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    clearAllNotifications,
  };
};
