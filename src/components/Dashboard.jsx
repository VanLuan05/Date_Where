import { useState, useMemo, lazy, Suspense } from "react";
import { Clapperboard } from "lucide-react";
import ReviewPrompt from "./ReviewPrompt.jsx";
import { isUpcoming } from "../utils/helpers.js";
import RandomPickerModal from "./RandomPickerModal.jsx";

// ── Component con (refactored) ──
import CoupleHeroCard from "./couple/CoupleHeroCard.jsx";
import CoupleQuickActions from "./couple/CoupleQuickActions.jsx";
import LiveTouchCard from "./couple/LiveTouchCard.jsx";
import NextAppointmentCard from "./couple/NextAppointmentCard.jsx";
import JourneyStatsRow from "./couple/JourneyStatsRow.jsx";
import EmptyState from "./EmptyState.jsx";
import { HeroSkeleton, NextDateSkeleton, TimelineSkeleton } from "./Skeleton.jsx";

// Cụm 6: lazy để không phình bundle initial (timeline + slideshow 9:16)
const LoveTimeline = lazy(() => import("./LoveTimeline.jsx"));
const YearRecapModal = lazy(() => import("./YearRecapModal.jsx"));

/**
 * Dashboard (Đôi mình tab)
 * ─────────────────────────────────────────────────
 * Layout tinh tế, lãng mạn & thanh thoát:
 *  1. CoupleHeroCard      — hero gradient DUY NHẤT trên màn hình
 *  2. CoupleQuickActions  — 4 nút tiện ích (Lịch rảnh, Quay quán, Mời đôi, Lên lịch)
 *  3. NextAppointmentCard  — Buổi hẹn tiếp theo + đếm ngược
 *  4. JourneyStatsRow     — Streak, điểm yêu & huy hiệu
 *  5. Demo seed           — Nạp demo khi chưa có dữ liệu
 *  6. LiveTouchCard       — Nhịp tim yêu thương
 *  7. Hành trình          — Xem lại năm qua + LoveTimeline
 *  8. ReviewPrompt        — Kỷ niệm sau buổi hẹn
 */
const Dashboard = ({
  couple,
  currentUser,
  isLoading = false,
  onUpdateCouple,
  placesCount,
  datesCount,
  dates = [],
  places = [],
  onOpenSettings,
  onOpenAvailability,
  onOpenInvite,
  onSeedDemo,
  matchedFreeDays = [],
  notifPermission,
  onEnableNotifications,
  onTestNotification,
  // Live Touch & Haptic Heartbeat
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
  // Journey (Cụm 5)
  stats,
  pendingMilestone,
  onDismissMilestone,
  onNavigateTab,
  onSchedulePlace,
}) => {
  const [seeding, setSeeding] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const isEmpty = (places || []).length === 0 && (dates || []).length === 0;

  const handleSeedDemo = async () => {
    if (!onSeedDemo || seeding) return;
    setSeeding(true);
    try {
      await onSeedDemo();
    } finally {
      setSeeding(false);
    }
  };

  // Địa điểm đã ghé thăm (dùng cho JourneyStatsRow)
  const visitedPlacesCount = useMemo(
    () => (places || []).filter((p) => p.visited).length,
    [places]
  );

  // Buổi hẹn tiếp theo
  const nextDate = useMemo(
    () =>
      (dates || [])
        .filter((d) => d && d.status === "upcoming" && isUpcoming(d.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null,
    [dates]
  );

  if (!couple) return null;

  if (isLoading) {
    return (
      <div className="space-y-4 pb-2">
        <HeroSkeleton />
        <NextDateSkeleton />
        <TimelineSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-2">
      {/* ── 1. HERO CARD: gradient duy nhất trên màn hình ── */}
      <CoupleHeroCard
        couple={couple}
        currentUser={currentUser}
        onUpdateCouple={onUpdateCouple}
        onOpenInvite={onOpenInvite}
      />

      {/* ── 2. QUICK ACTIONS ROW: 4 tiện ích hữu ích ── */}
      <CoupleQuickActions
        onOpenAvailability={onOpenAvailability}
        onOpenRandomPicker={() => setShowRandomPicker(true)}
        onOpenInvite={onOpenInvite}
        onNavigateDates={() => onNavigateTab?.("dates")}
        matchedFreeDays={matchedFreeDays}
        placesCount={places.length}
        couple={couple}
      />

      {/* ── 3. NEXT APPOINTMENT CARD ── */}
      {nextDate ? (
        <NextAppointmentCard nextDate={nextDate} />
      ) : (
        <div className="card-static p-4 text-center space-y-1.5 border border-rose-100">
          <p className="text-sm font-semibold text-rose-800 dark:text-zinc-200">
            📅 Chưa có buổi hẹn tiếp theo
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-serif">
            Hãy lên kế hoạch trong tab <strong>Lịch hẹn</strong> nhé 💕
          </p>
        </div>
      )}

      {/* ── 4. JOURNEY STATS ROW (Cụm 5) ── */}
      <JourneyStatsRow
        stats={stats || couple?.stats}
        pendingMilestone={pendingMilestone}
        onDismissMilestone={onDismissMilestone}
        placesCount={placesCount || 0}
        datesCount={datesCount || 0}
        visitedPlacesCount={visitedPlacesCount}
      />

      {/* ── 5. DEMO SEED (khi app trống) ── */}
      {isEmpty && onSeedDemo && (
        <EmptyState
          illustration="✨"
          title="Bắt đầu hành trình yêu 💕"
          desc="Nạp ngay 6 quán + 2 lịch hẹn mẫu đẹp để khám phá app cùng người ấy nhé!"
          actionLabel={seeding ? "Đang nạp demo..." : "Dùng thử demo 1 chạm ✨"}
          onAction={handleSeedDemo}
          actionId="demo-seed-btn"
          disabled={seeding}
        />
      )}

      {/* ── 6. LIVE TOUCH HEARTBEAT (Nhịp tim yêu thương) ── */}
      <LiveTouchCard
        couple={couple}
        currentUser={currentUser}
        liveTouch={liveTouch}
        incomingHeartbeat={incomingHeartbeat}
        onSendHeartbeat={onSendHeartbeat}
      />

      {/* ── 7. HÀNH TRÌNH (YearRecap + Timeline, không tabs) ── */}
      <section aria-label="Hành trình yêu" className="card-static p-3 space-y-3 sm:p-4">
        <button
          type="button"
          onClick={() => setShowRecap(true)}
          className="w-full card-static p-4 flex items-center gap-3 text-left min-h-[44px] hover:border-violet-300 transition-colors cursor-pointer"
        >
          <span className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center shrink-0">
            <Clapperboard className="w-5 h-5 text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-violet-700 dark:text-violet-300">
              Xem lại năm qua 🎬
            </span>
            <span className="block text-xs text-gray-600 dark:text-zinc-400 truncate">
              Slideshow 9:16 + nhạc waltz từ kỷ niệm có sẵn
            </span>
          </span>
        </button>
        <Suspense fallback={<TimelineSkeleton />}>
          <LoveTimeline dates={dates} />
        </Suspense>
        {showRecap && (
          <Suspense fallback={null}>
            <YearRecapModal
              isOpen={showRecap}
              onClose={() => setShowRecap(false)}
              dates={dates}
              couple={couple}
            />
          </Suspense>
        )}
      </section>

      {/* ── 8. REVIEW PROMPT (sau date thứ 3) ── */}
      <ReviewPrompt dates={dates} />

      {/* Random Picker Modal (Hôm nay đi đâu?) */}
      {showRandomPicker && (
        <RandomPickerModal
          isOpen={showRandomPicker}
          onClose={() => setShowRandomPicker(false)}
          places={places}
          onSchedulePlace={(place) => {
            onSchedulePlace?.(place);
            onNavigateTab?.("dates");
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
