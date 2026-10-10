import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Heart,
  Sparkles,
  CalendarHeart,
  Trash2,
} from "lucide-react";

import { useModalDismiss } from "../hooks/useModalDismiss.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const SLOT_OPTIONS = [
  { key: "all", label: "Cả ngày", emoji: "🌈" },
  { key: "morning", label: "Buổi sáng", emoji: "☀️" },
  { key: "afternoon", label: "Buổi chiều", emoji: "⛅" },
  { key: "evening", label: "Buổi tối", emoji: "🌙" },
];

const SLOT_TIME_MAP = {
  morning: "08:00",
  afternoon: "14:00",
  evening: "19:00",
  all: "10:00",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get number of days in a month (handles leap year) */
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

/** Get day of week for the 1st of a month (0=Sun → mapped to Mon-first) */
const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // Convert to Mon=0
};

/** Format "YYYY-MM-DD" */
const toDateKey = (year, month, day) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

/** Format month label in Vietnamese */
const formatMonthLabel = (year, month) => {
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];
  return `${monthNames[month]}, ${year}`;
};

/** Format date for display */
const formatDateVi = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][d.getDay()];
  return `${dayOfWeek}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

/**
 * Check if two slot entries match (both free on same day & compatible slots).
 * Compatible means: same slot, or at least one is "all" (full day).
 */
const slotsMatch = (slot1, slot2) => {
  return slot1 === slot2 || slot1 === "all" || slot2 === "all";
};

/**
 * Compute matched free days from two availability arrays.
 * Returns array of { dateStr, slot, slots1, slots2 }
 */
const computeMatchedDays = (avail1 = [], avail2 = []) => {
  const safeAvail1 = Array.isArray(avail1) ? avail1 : [];
  const safeAvail2 = Array.isArray(avail2) ? avail2 : [];
  const map1 = {};
  safeAvail1.forEach((entry) => {
    if (typeof entry !== "string") return;
    const [dateStr, slot] = entry.split("_");
    if (!map1[dateStr]) map1[dateStr] = [];
    map1[dateStr].push(slot);
  });

  const map2 = {};
  safeAvail2.forEach((entry) => {
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
        if (slotsMatch(s1, s2)) {
          // Use the more specific slot as the matched slot
          const matchedSlot = s1 === "all" ? s2 : s1;
          matched.push({
            dateStr,
            slot: matchedSlot,
            slots1,
            slots2,
          });
          return; // Only count once per date
        }
      }
    }
  });

  return matched.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
};

// ─── Component ────────────────────────────────────────────────────────────────
const AvailabilitySyncModal = ({
  isOpen,
  onClose,
  couple,
  coupleData,
  activeUser,
  availability = {},
  onToggleAvailability,
  onClearAvailability,
  onScheduleDate,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null); // Day popup open
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState(null); // Matched day selected
  const popupRef = useRef(null);
  const swipeHandlers = useModalDismiss(onClose, isOpen);

  // Reset view to current month when opened
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setSelectedDay(null);
      setSelectedDateForSchedule(null);
    }
  }, [isOpen]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSelectedDay(null);
      }
    };
    if (selectedDay !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedDay]);

  // ── Determine active user role key ──
  const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
  const partnerKey = roleKey === "user1" ? "user2" : "user1";

  const effectiveCouple = coupleData || couple;
  const user1Data = effectiveCouple?.user1 || effectiveCouple?.userA;
  const user2Data = effectiveCouple?.user2 || effectiveCouple?.userB;
  const myData = roleKey === "user1" ? user1Data : user2Data;
  const partnerData = roleKey === "user1" ? user2Data : user1Data;

  const user1Avail = effectiveCouple?.availability?.user1 || availability?.user1 || [];
  const user2Avail = effectiveCouple?.availability?.user2 || availability?.user2 || [];

  const myAvail = (roleKey === "user1" ? user1Avail : user2Avail) || [];
  const partnerAvail = (roleKey === "user1" ? user2Avail : user1Avail) || [];

  // ── Matched days computation ──
  const matchedDays = useMemo(
    () =>
      computeMatchedDays(
        effectiveCouple?.availability?.user1 || availability?.user1 || [],
        effectiveCouple?.availability?.user2 || availability?.user2 || []
      ),
    [availability, effectiveCouple]
  );

  // ── Days in current view month that are matched ──
  const matchedInMonth = useMemo(() => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return matchedDays.filter((m) => m.dateStr.startsWith(monthStr));
  }, [matchedDays, viewYear, viewMonth]);

  // ── Calendar grid data ──
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const grid = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: null, key: `empty-${i}` });
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateKey(viewYear, viewMonth, d);
      grid.push({ day: d, dateStr, key: dateStr });
    }

    return grid;
  }, [viewYear, viewMonth]);

  // ── Get day state ──
  const getDayState = useCallback(
    (dateStr) => {
      const mySlots = myAvail.filter((e) => e.startsWith(dateStr + "_")).map((e) => e.split("_")[1]);
      const partnerSlots = partnerAvail.filter((e) => e.startsWith(dateStr + "_")).map((e) => e.split("_")[1]);
      const isMatched = matchedDays.some((m) => m.dateStr === dateStr);
      const isPast = new Date(dateStr + "T23:59:59") < new Date(new Date().toDateString());

      return {
        mySlots,
        partnerSlots,
        hasMe: mySlots.length > 0,
        hasPartner: partnerSlots.length > 0,
        isMatched,
        isPast,
      };
    },
    [myAvail, partnerAvail, matchedDays]
  );

  // ── Navigation ──
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  // ── Handle slot toggle ──
  const handleSlotToggle = (dateStr, slot) => {
    onToggleAvailability?.(dateStr, slot);
  };

  // ── Handle schedule from matched day ──
  const handleScheduleFromMatch = (dateStr, slot) => {
    const time = SLOT_TIME_MAP[slot] || "10:00";
    onScheduleDate?.(dateStr, time);
    onClose?.();
  };

  // ── Handle clear month availability ──
  const handleClearMonth = () => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    onClearAvailability?.(monthStr);
  };

  if (!isOpen) return null;

  const todayStr = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="modal-box sm:max-w-lg max-h-[92vh] max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header (sticky theo chuẩn modal P1) ── */}
        <div className="modal-header" {...swipeHandlers}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shrink-0">
              <CalendarHeart className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base text-stone-800 dark:text-zinc-100 leading-tight">
                Lịch rảnh đôi mình
              </h2>
              <p className="text-xs text-gray-400 dark:text-zinc-400 truncate">
                {matchedInMonth.length > 0 ? (
                  <>Có <strong className="text-rose-600 dark:text-rose-300">{matchedInMonth.length}</strong> ngày cùng rảnh tháng này ✨</>
                ) : (
                  "Cập nhật ngày rảnh để tìm ngày hẹn chung 💕"
                )}
              </p>
            </div>
          </div>
          <button
            id="close-availability-modal"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl hover:bg-rose-50 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-zinc-300" />
          </button>
        </div>

        {/* ── Calendar Content (scroll giữa, không scroll ngang) ── */}
        <div className="modal-body flex-1 overflow-y-auto overflow-x-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between gap-2">
            <button
              id="prev-month-btn"
              onClick={goToPrevMonth}
              aria-label="Tháng trước"
              className="w-11 h-11 min-w-[44px] min-h-[44px] bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-display font-bold text-stone-800 dark:text-zinc-100 text-base truncate">
              {formatMonthLabel(viewYear, viewMonth)}
            </h3>
            <button
              id="next-month-btn"
              onClick={goToNextMonth}
              aria-label="Tháng sau"
              className="w-11 h-11 min-w-[44px] min-h-[44px] bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-[10px] font-semibold text-stone-500 dark:text-zinc-400 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl px-3 py-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-sky-400 inline-block border border-sky-500" /> {myData?.name || "Bạn"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-400 inline-block border border-orange-500" /> {partnerData?.name || "Người ấy"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 inline-block border border-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" /> Cùng rảnh 💖
            </span>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Calendar Grid — gọn, vừa màn hình mobile, không scroll ngang */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 relative min-w-0">
            {calendarDays.map((cell) => {
              if (!cell.day) {
                return <div key={cell.key} className="aspect-square" />;
              }

              const state = getDayState(cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isPopupOpen = selectedDay === cell.dateStr;

              // Determine cell styling — matched highlight rõ (viền + glow + ring)
              let cellClass = "aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 cursor-pointer relative select-none border-2 touch-manipulation min-w-0 ";

              if (state.isPast) {
                cellClass += "bg-stone-50 dark:bg-zinc-800/40 text-stone-300 dark:text-zinc-600 border-transparent cursor-default ";
              } else if (state.isMatched) {
                cellClass += "bg-gradient-to-br from-rose-100 via-pink-100 to-rose-100 dark:from-rose-500/25 dark:via-pink-500/20 dark:to-rose-500/25 text-rose-700 dark:text-rose-200 border-rose-400 dark:border-rose-400/70 ring-2 ring-rose-300/60 dark:ring-rose-400/30 shadow-[0_0_12px_rgba(244,63,94,0.35)] ";
              } else if (state.hasMe && state.hasPartner) {
                // Both have entries but no matching slot
                cellClass += "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-400/30 hover:border-purple-300 ";
              } else if (state.hasMe) {
                cellClass += "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-400/30 hover:border-sky-300 ";
              } else if (state.hasPartner) {
                cellClass += "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-400/30 hover:border-orange-300 ";
              } else {
                cellClass += "bg-white dark:bg-zinc-900/60 text-stone-600 dark:text-zinc-300 border-stone-100 dark:border-white/10 hover:border-rose-200 hover:bg-rose-50/30 ";
              }

              return (
                <div key={cell.key} className="relative min-w-0">
                  <button
                    type="button"
                    id={`day-cell-${cell.dateStr}`}
                    aria-label={`${cell.day} — ${state.isMatched ? "cùng rảnh, bấm để chốt lịch" : state.isPast ? "ngày đã qua" : "chọn khung giờ rảnh"}`}
                    aria-pressed={state.isMatched && selectedDateForSchedule === cell.dateStr}
                    className={cellClass}
                    onClick={() => {
                      if (state.isPast) return;
                      if (state.isMatched) {
                        setSelectedDateForSchedule(cell.dateStr);
                        setSelectedDay(null);
                      } else {
                        setSelectedDay(isPopupOpen ? null : cell.dateStr);
                        setSelectedDateForSchedule(null);
                      }
                    }}
                  >
                    {/* Today indicator ring */}
                    {isToday && (
                      <div className="absolute inset-0 rounded-2xl ring-2 ring-rose-400 ring-offset-1 pointer-events-none" />
                    )}

                    {/* Day number */}
                    <span className="leading-none">{cell.day}</span>

                    {/* Slot dots */}
                    {!state.isPast && (state.hasMe || state.hasPartner) && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {state.hasMe && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        )}
                        {state.hasPartner && (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        )}
                      </div>
                    )}

                    {/* Match heart */}
                    {state.isMatched && (
                      <span className="text-[10px] leading-none mt-0.5 animate-bounce-soft">💖</span>
                    )}
                  </button>

                  {/* ── Slot Selection Popup — gọn, vừa màn hình ── */}
                  {isPopupOpen && !state.isPast && (
                    <div
                      ref={popupRef}
                      role="dialog"
                      aria-label={`Chọn khung giờ ngày ${formatDateVi(cell.dateStr)}`}
                      className="absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1 w-44 max-w-[calc(100vw-3rem)] max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-2 border-rose-200 dark:border-white/15 p-2 space-y-1 animate-scale-in"
                    >
                      <p className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 text-center mb-1 truncate">
                        {formatDateVi(cell.dateStr)}
                      </p>
                      {SLOT_OPTIONS.map((opt) => {
                        const entryKey = `${cell.dateStr}_${opt.key}`;
                        const isActive = myAvail.includes(entryKey);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            id={`slot-${cell.dateStr}-${opt.key}`}
                            aria-pressed={isActive}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlotToggle(cell.dateStr, opt.key);
                            }}
                            className={`w-full min-h-[40px] flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 touch-manipulation ${
                              isActive
                                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm"
                                : "bg-stone-50 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-zinc-700 hover:text-rose-700 dark:hover:text-rose-300"
                            }`}
                          >
                            <span className="text-sm" aria-hidden="true">{opt.emoji}</span>
                            <span className="truncate">{opt.label}</span>
                            {isActive && <span className="ml-auto text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Schedule Action for Matched Day — CTA 1-tap rõ ràng ── */}
          {selectedDateForSchedule && (() => {
            const matchInfo = matchedDays.find((m) => m.dateStr === selectedDateForSchedule);
            if (!matchInfo) return null;
            return (
              <div className="bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-300 dark:border-rose-400/40 rounded-2xl p-4 space-y-2.5 animate-slide-up">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-heart-beat shrink-0" />
                  <p className="font-display font-bold text-rose-800 dark:text-rose-200 text-sm">
                    Cả hai cùng rảnh!
                  </p>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-serif break-words">
                  {formatDateVi(selectedDateForSchedule)} — {
                    SLOT_OPTIONS.find((s) => s.key === matchInfo.slot)?.label || "Cả ngày"
                  } {SLOT_OPTIONS.find((s) => s.key === matchInfo.slot)?.emoji || "🌈"}
                </p>
                <button
                  id="schedule-from-match-btn"
                  type="button"
                  onClick={() => handleScheduleFromMatch(selectedDateForSchedule, matchInfo.slot)}
                  className="w-full min-h-[48px] bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-3 rounded-2xl shadow-romantic text-sm flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation"
                >
                  <Calendar className="w-4 h-4" />
                  Chốt lịch hẹn ngày này 1 chạm!
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDateForSchedule(null)}
                  className="w-full min-h-[44px] text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200 py-1.5 transition-colors"
                >
                  Để sau
                </button>
              </div>
            );
          })()}

          {/* ── Matched Days Summary List ── */}
          {matchedDays.length > 0 && (
            <div className="space-y-2 min-w-0">
              <h4 className="font-display font-bold text-stone-700 dark:text-zinc-200 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                Ngày hai đứa cùng rảnh ({matchedDays.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto overflow-x-hidden pr-0.5">
                {matchedDays.map((m) => {
                  const slotInfo = SLOT_OPTIONS.find((s) => s.key === m.slot);
                  const isSelected = selectedDateForSchedule === m.dateStr;
                  return (
                    <button
                      key={m.dateStr}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedDateForSchedule(m.dateStr);
                        // Navigate to that month if different
                        const [y, mo] = m.dateStr.split("-").map(Number);
                        if (y !== viewYear || mo - 1 !== viewMonth) {
                          setViewYear(y);
                          setViewMonth(mo - 1);
                        }
                      }}
                      className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 py-2 transition-colors group text-left touch-manipulation min-w-0 ${isSelected
                        ? "bg-rose-100 dark:bg-rose-500/20 border-2 border-rose-400 dark:border-rose-400/60"
                        : "bg-rose-50/80 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-white/10"
                      }`}
                    >
                      <span className="text-base group-hover:scale-125 transition-transform shrink-0" aria-hidden="true">💖</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold text-rose-800 dark:text-rose-200 truncate">{formatDateVi(m.dateStr)}</p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-300 truncate">{slotInfo?.emoji} {slotInfo?.label}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Clear month button ── */}
          <div className="pt-2 border-t border-stone-100 dark:border-white/10">
            <button
              id="clear-month-availability-btn"
              type="button"
              onClick={handleClearMonth}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 text-xs text-stone-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 py-2 rounded-xl transition-colors touch-manipulation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa lịch rảnh tháng này (của bạn)
            </button>
          </div>
        </div>

        {/* ── Footer sticky (chuẩn modal P1): CTA theo ngày đang chọn ── */}
        <div className="modal-footer">
          {selectedDateForSchedule ? (
            <button
              type="button"
              onClick={() => {
                const m = matchedDays.find((x) => x.dateStr === selectedDateForSchedule);
                handleScheduleFromMatch(selectedDateForSchedule, m?.slot || "all");
              }}
              className="btn-primary flex-1 py-3 text-sm min-h-[48px] flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Chốt {formatDateVi(selectedDateForSchedule)}
            </button>
          ) : (
            <p className="flex-1 text-center text-xs text-stone-500 dark:text-zinc-400 py-1 leading-relaxed">
              {matchedDays.length > 0
                ? `💖 ${matchedDays.length} ngày cùng rảnh — bấm ngày hồng để chốt 1 chạm`
                : "Bấm vào từng ngày để tick khung giờ rảnh của bạn"}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-3 px-5 text-sm min-h-[48px] shrink-0"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySyncModal;
