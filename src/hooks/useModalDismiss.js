import { useEffect, useRef, useCallback } from "react";

/**
 * P1 — hành vi đóng modal chuẩn dùng chung: Esc + swipe-down trên mobile.
 * Gắn `swipeHandlers` vào header của modal (kéo header xuống > 90px để đóng).
 * Không gắn swipe vào LoveFootprintModal (bản đồ Leaflet cần pan) — chỉ dùng Esc ở đó.
 */
export const useModalDismiss = (onClose, enabled = true) => {
  useEscapeClose(onClose, enabled);

  const startY = useRef(null);
  const deltaY = useRef(0);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    startY.current = e.touches[0].clientY;
    deltaY.current = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    deltaY.current = e.touches[0].clientY - startY.current;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (deltaY.current > 90) onClose?.();
    startY.current = null;
    deltaY.current = 0;
  }, [onClose]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};

/** Chỉ Esc — dùng cho LoveFootprintModal / YearRecapModal (không swipe để khỏi vỡ pan/map). */
export const useEscapeClose = (onClose, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, onClose]);
};
