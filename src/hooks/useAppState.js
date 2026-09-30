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
import { db } from "../firebase/config.js";
import { INITIAL_COUPLE, INITIAL_PLACES, INITIAL_DATES } from "../data/mockData.js";
import {
  loadFromStorage,
  saveToStorage,
  generateId,
  LOCAL_STORAGE_KEY,
} from "../utils/helpers.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const COUPLE_CODE_KEY = "datewhere_coupleCode";
const CURRENT_USER_KEY = "datewhere_currentUser";

const isFirebaseMode = db !== null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Lấy coupleCode đang dùng từ localStorage */
const getSavedCoupleCode = () => localStorage.getItem(COUPLE_CODE_KEY) || null;
const saveCoupleCode = (code) => {
  if (code) localStorage.setItem(COUPLE_CODE_KEY, code);
  else localStorage.removeItem(COUPLE_CODE_KEY);
};

/** Đọc currentUser từ localStorage */
const getSavedCurrentUser = () => localStorage.getItem(CURRENT_USER_KEY) || "userA";
const saveCurrentUser = (user) => localStorage.setItem(CURRENT_USER_KEY, user);

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
  const [currentUser, setCurrentUser] = useState("userA");
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
          setCouple({
            userA: data.userA,
            userB: data.userB,
            status: data.status,
            startDate: data.startDate || "",
            inviteCode: data.coupleCode,
            isConnected: true,
            coupleCode: data.coupleCode,
          });
          setPlaces(data.places || []);
          setDates(data.dates || []);
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
    const savedUser = getSavedCurrentUser();
    setCurrentUser(savedUser);

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
        setCouple(stored.couple || null);
        setPlaces(stored.places || []);
        setDates(stored.dates || []);
      }
      setIsLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist offline state to localStorage ───────────────────────────────────
  useEffect(() => {
    if (!isLoaded || isFirebaseMode) return;
    saveToStorage({ couple, places, dates, currentUser });
  }, [couple, places, dates, currentUser, isLoaded]);

  // ── Persist currentUser to localStorage (cả 2 mode) ─────────────────────────
  useEffect(() => {
    if (isLoaded) saveCurrentUser(currentUser);
  }, [currentUser, isLoaded]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const switchUser = useCallback(() => {
    setCurrentUser((prev) => (prev === "userA" ? "userB" : "userA"));
  }, []);

  /** Cập nhật thông tin couple (nickname, avatar, status, startDate) */
  const updateCouple = useCallback(
    async (updates) => {
      setCouple((prev) => ({ ...prev, ...updates }));
      if (isFirebaseMode && coupleCodeRef.current) {
        await updateCoupleOnFirestore(coupleCodeRef.current, updates);
      }
    },
    []
  );

  /** Thêm địa điểm mới */
  const addPlace = useCallback(
    async (placeData) => {
      const newPlace = {
        id: `place-${generateId()}`,
        ...placeData,
        addedBy: currentUser,
        addedAt: new Date().toISOString(),
        rating: placeData.rating ?? 0,
        visited: placeData.visited ?? false,
        favorite: placeData.favorite ?? false,
      };

      if (isFirebaseMode && coupleCodeRef.current) {
        // Lấy places hiện tại từ Firestore rồi append
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
    [currentUser]
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

  /** Thêm lịch hẹn mới */
  const addDate = useCallback(
    async (dateData) => {
      const newDate = {
        id: `date-${generateId()}`,
        ...dateData,
        status: "upcoming",
        createdBy: currentUser,
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
    [currentUser]
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
        const coupleData = pairingData || INITIAL_COUPLE;
        saveToStorage({
          couple: { ...coupleData, isConnected: true },
          places: INITIAL_PLACES,
          dates: INITIAL_DATES,
          currentUser: "userA",
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
    saveCurrentUser("userA");
    saveToStorage(null);
    setCoupleCode(null);
    setCouple(null);
    setPlaces([]);
    setDates([]);
    setCurrentUser("userA");
    setSyncStatus("offline");
    window.location.reload();
  }, []);

  return {
    couple,
    places,
    dates,
    currentUser,
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
    resetApp,
    completePairing,
  };
};
