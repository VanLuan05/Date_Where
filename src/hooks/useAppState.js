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
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import confetti from "canvas-confetti";
import { db } from "../firebase/config.js";
import { INITIAL_COUPLE, INITIAL_PLACES, INITIAL_DATES } from "../data/mockData.js";
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

// ─── Firebase helpers ─────────────────────────────────────────────────────────
const getCoupleRef = (coupleCode) => doc(db, "couples", coupleCode);

/** Lấy document couple từ Firestore (one-time) */
export const fetchCoupleFromFirestore = async (coupleCode) => {
  try {
    const snap = await getDoc(getCoupleRef(coupleCode));
    if (snap.exists()) return snap.data();
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
      dates: INITIAL_DATES,
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
  const [availability, setAvailability] = useState({ user1: [], user2: [], updatedAt: null });
  const [partnerLocations, setPartnerLocations] = useState({ user1: null, user2: null });
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

  // Track previous matched count for confetti on new matches
  const prevMatchedCountRef = useRef(0);

  // Ref for watchPosition cleanup
  const watchIdRef = useRef(null);

  // Ref để tránh vòng lặp khi nhận onSnapshot update
  const unsubscribeRef = useRef(null);
  const coupleCodeRef = useRef(null);
  coupleCodeRef.current = coupleCode;

  // ── FIREBASE MODE ───────────────────────────────────────────────────────────
  const subscribeToFirestore = useCallback((code) => {
    if (!db || !code) return;

    // Hủy listener cũ nếu có
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setSyncStatus("connecting");

    const ref = getCoupleRef(code);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const user1Data = data.user1 || data.userA || INITIAL_COUPLE.userA;
          const user2Data = data.user2 || data.userB || INITIAL_COUPLE.userB;

          setCouple({
            ...data,
            user1: user1Data,
            user2: user2Data,
            userA: user1Data,
            userB: user2Data,
            status: data.status || "dating",
            startDate: data.startDate || "",
            inviteCode: data.coupleCode,
            isConnected: true,
            coupleCode: data.coupleCode,
          });
          setPlaces(data.places || []);
          setDates(data.dates || []);
          setBlindSwipes(data.blindSwipes || {});
          setAvailability(data.availability || { user1: [], user2: [], updatedAt: null });
          setPartnerLocations(data.partnerLocations || { user1: null, user2: null });
          setLiveTouch(data.liveTouch || null);

          // Xử lý tín hiệu Live Touch thời gian thực từ đối phương
          if (data.liveTouch && data.liveTouch.timestamp) {
            const touch = data.liveTouch;
            const now = Date.now();
            const currentRole = activeUserRef.current === "user1" || activeUserRef.current === "userA" ? "user1" : "user2";

            // Kiểm tra nếu tín hiệu từ đối phương và gửi cách đây chưa đầy 8 giây
            if (
              touch.sender !== currentRole &&
              now - touch.timestamp < 8000 &&
              touch.timestamp > lastHandledTouchTimeRef.current
            ) {
              lastHandledTouchTimeRef.current = touch.timestamp;

              if (touch.type === "heartbeat") {
                // Tự động rung điện thoại theo nhịp tim, visual pulse & audio
                triggerHeartbeatHaptic();
                setIncomingHeartbeat({
                  timestamp: touch.timestamp,
                  sender: touch.sender,
                  active: true,
                });
                setTimeout(() => {
                  setIncomingHeartbeat(null);
                }, 3500);
              } else if (touch.type === "mood") {
                // Rung nhẹ và kích hoạt toast lãng mạn
                triggerLightTap();
                setIncomingMood({
                  ...touch,
                  active: true,
                });
              }
            }
          }

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
  }, []);

  // ── Cleanup listener + watchPosition khi unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
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
      // FIREBASE MODE: kiểm tra coupleCode đã lưu trong localStorage
      const savedCode = getSavedCoupleCode();
      if (savedCode) {
        setCoupleCode(savedCode);
        subscribeToFirestore(savedCode);
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
        setPlaces(stored.places || []);
        setDates(stored.dates || []);
        setBlindSwipes(stored.blindSwipes || {});
        setAvailability(stored.availability || { user1: [], user2: [], updatedAt: null });
        setPartnerLocations(stored.partnerLocations || { user1: null, user2: null });
        setLiveTouch(stored.liveTouch || null);
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
      currentUser: activeUser,
      activeUser,
    });
  }, [couple, places, dates, blindSwipes, availability, partnerLocations, liveTouch, activeUser, isLoaded]);

  // ── Persist device role to localStorage (cả 2 mode) ─────────────────────────
  useEffect(() => {
    if (isLoaded) saveDeviceRole(activeUser);
  }, [activeUser, isLoaded]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  /** Chuyển đổi giả lập giữa 2 người dùng (tiện lợi khi test trên cùng một máy) */
  const switchUser = useCallback(() => {
    setActiveUser((prev) => {
      const next = prev === "user1" || prev === "userA" ? "user2" : "user1";
      saveDeviceRole(next);
      return next;
    });
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

  /** Thêm địa điểm mới: Tự động ký tên addedBy: activeUser của thiết bị đó */
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
        setPlaces((prev) => {
          const newPlaces = [newPlace, ...prev];
          updateCoupleOnFirestore(coupleCodeRef.current, { places: newPlaces });
          return newPlaces;
        });
      } else {
        setPlaces((prev) => [newPlace, ...prev]);
      }
      return newPlace;
    },
    [activeUser]
  );

  /** Cập nhật một địa điểm */
  const updatePlace = useCallback(async (id, updates) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      setPlaces((prev) => {
        const newPlaces = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        updateCoupleOnFirestore(coupleCodeRef.current, { places: newPlaces });
        return newPlaces;
      });
    } else {
      setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    }
  }, []);

  /** Xóa một địa điểm */
  const deletePlace = useCallback(async (id) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      setPlaces((prev) => {
        const newPlaces = prev.filter((p) => p.id !== id);
        updateCoupleOnFirestore(coupleCodeRef.current, { places: newPlaces });
        return newPlaces;
      });
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
        setDates((prev) => {
          const newDates = [newDate, ...prev];
          updateCoupleOnFirestore(coupleCodeRef.current, { dates: newDates });
          return newDates;
        });
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
      return newDate;
    },
    [activeUser]
  );

  /** Cập nhật lịch hẹn */
  const updateDate = useCallback(async (id, updates) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      setDates((prev) => {
        const newDates = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
        updateCoupleOnFirestore(coupleCodeRef.current, { dates: newDates });
        return newDates;
      });
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
          updateCoupleOnFirestore(coupleCodeRef.current, { dates: newDates });
          return newDates;
        });
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

  /** Xóa lịch hẹn */
  const deleteDate = useCallback(async (id) => {
    if (isFirebaseMode && coupleCodeRef.current) {
      setDates((prev) => {
        const newDates = prev.filter((d) => d.id !== id);
        updateCoupleOnFirestore(coupleCodeRef.current, { dates: newDates });
        return newDates;
      });
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
    const avail1 = availability?.user1 || [];
    const avail2 = availability?.user2 || [];
    if (avail1.length === 0 || avail2.length === 0) return [];

    const map1 = {};
    avail1.forEach((entry) => {
      const [dateStr, slot] = entry.split("_");
      if (!map1[dateStr]) map1[dateStr] = [];
      map1[dateStr].push(slot);
    });

    const map2 = {};
    avail2.forEach((entry) => {
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
  }, [activeUser]);

  /**
   * Gửi trạng thái tâm trạng nhanh:
   * "Hôm nay mệt xíu, cần nạp năng lượng" (Icon: 🥺 / 🔋)
   * "Đang thèm ăn gì đó ngọt ngọt" (Icon: 🧋 / 🍰)
   * "Nhớ bạn nhiều lắm" (Icon: 💖 / 🫂)
   */
  const sendQuickMood = useCallback(async (moodText, moodIcon) => {
    const now = Date.now();
    const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
    const touchData = {
      sender: roleKey,
      type: "mood",
      moodText,
      moodIcon,
      timestamp: now,
    };

    triggerLightTap();
    setLiveTouch(touchData);

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
  }, [activeUser]);

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
          dates: INITIAL_DATES,
          blindSwipes: {},
          currentUser: role,
          activeUser: role,
        });
        window.location.reload();
      }
    },
    [subscribeToFirestore]
  );

  /** Reset toàn bộ - xóa localStorage + unsubscribe Firestore */
  const resetApp = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
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
  };
};
