/**
 * useAppState.js
 * Hook trung tâm quản lý trạng thái toàn ứng dụng DateWhere.
 *
 * Hỗ trợ 2 chế độ:
 *  - FIREBASE MODE: Real-time sync qua Firestore onSnapshot
 *  - OFFLINE MODE : Fallback về localStorage nếu Firebase chưa cấu hình
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
      places: INITIAL_PLACES,
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
  const [activeUser, setActiveUser] = useState(() => getSavedDeviceRole());
  const [isLoaded, setIsLoaded] = useState(false);
  const [coupleCode, setCoupleCode] = useState(null);
  const [syncStatus, setSyncStatus] = useState("offline"); // "realtime" | "offline" | "connecting"
  const [offlineWarning, setOfflineWarning] = useState(false);

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

  // ── Cleanup listener khi unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
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
      currentUser: activeUser,
      activeUser,
    });
  }, [couple, places, dates, blindSwipes, activeUser, isLoaded]);

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

  /** Thêm lịch hẹn mới: Tự động ký tên createdBy: activeUser của thiết bị đó */
  const addDate = useCallback(
    async (dateData) => {
      const newDate = {
        id: `date-${generateId()}`,
        ...dateData,
        status: "upcoming",
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
        setDates((prev) => [newDate, ...prev]);
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
      setDates((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    }
  }, []);

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
          places: INITIAL_PLACES,
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
    swipePlace,
    resetSwipes,
    resetApp,
    completePairing,
  };
};
