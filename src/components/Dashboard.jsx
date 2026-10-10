import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Clapperboard } from "lucide-react";
import ReviewPrompt from "./ReviewPrompt.jsx";
import { isUpcoming } from "../utils/helpers.js";
import { getWeatherForecastForDate } from "../utils/weatherService.js";
import {
  calculateDistance,
  formatDistance,
  formatTimeAgo,
  getStatusDisplay,
} from "../utils/locationService.js";

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
 * Layout gọn:
 *  1. CoupleHeroCard     — hero gradient DUY NHẤT trên màn hình
 *  2. CoupleQuickActions — 4 nút tiện ích (card trắng, icon màu đặc)
 *  3. NextAppointmentCard — Buổi hẹn tiếp theo
 *  4. JourneyStatsRow    — 3 thống kê hành trình
 *  5. Demo seed          — EmptyState khi app trống (không còn invite-card;
 *                         mời người ấy chỉ qua icon QR trên Header + InviteCenterModal)
 *  6. LiveTouchCard      — Nhịp đập (gọn)
 *  7. Hành trình         — Nút "Xem lại năm qua" + LoveTimeline (không tabs)
 *  8. ReviewPrompt       — giữ nguyên, dạng secondary
 *
 * Giữ nguyên State/Controller/Handler cũ. `onQuickSchedule` giữ lại
 * như prop tùy chọn để code gọi cũ không crash (hiện không dùng).
 * BottomNav 4 tab không đổi.
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
  onOpenBlindMatch,
  onOpenLoveMap,
  onOpenAvailability,
  onSeedDemo,
  blindSwipes,
  matchedFreeDays = [],
  partnerLocations = {},
  onShareLocation,
  onStartOnTheWay,
  onStopOnTheWay,
  notifPermission,
  onEnableNotifications,
  onTestNotification,
  // Live Touch & Haptic Heartbeat (chat nằm ở tab "Nhắn tin" trên BottomNav)
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
  // Journey (Cụm 5)
  stats,
  pendingMilestone,
  onDismissMilestone,
  // Giữ để tương thích ngược — hiện không dùng (đã bỏ Concierge).
  onQuickSchedule,
}) => {
  void onQuickSchedule;
  const [nextWeather, setNextWeather] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
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

  // Fetch weather for next date
  useEffect(() => {
    if (!nextDate?.date) {
      setNextWeather(null);
      return;
    }
    let isMounted = true;
    getWeatherForecastForDate(nextDate.date)
      .then((res) => { if (isMounted) setNextWeather(res); })
      .catch(() => { if (isMounted) setNextWeather(null); });
    return () => { isMounted = false; };
  }, [nextDate?.date]);

  if (!couple) return null;

  // P2 — khi load chậm: skeleton shimmer thay text "Đang tải...", giữ fetch logic cũ
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
      />

      {/* ── 2. QUICK ACTIONS ROW: 4 icon buttons ── */}
      <CoupleQuickActions
        onOpenBlindMatch={onOpenBlindMatch}
        onOpenAvailability={onOpenAvailability}
        onShareLocation={onShareLocation}
        onOpenLoveMap={onOpenLoveMap}
        blindSwipes={blindSwipes}
        matchedFreeDays={matchedFreeDays}
        partnerLocations={partnerLocations}
        currentUser={currentUser}
        couple={couple}
      />

      {/* ── 3. NEXT APPOINTMENT CARD ── */}
      {nextDate && (
        <NextAppointmentCard
          nextDate={nextDate}
          nextWeather={nextWeather}
          notifPermission={notifPermission}
          onEnableNotifications={onEnableNotifications}
          onTestNotification={onTestNotification}
        />
      )}

      {/* Show notification banner even without next date if permission is needed */}
      {!nextDate && notifPermission && notifPermission !== "granted" && (
        <div className="card-static p-4 text-center space-y-2">
          <p className="text-sm text-gray-700 font-serif">
            📅 Chưa có buổi hẹn tiếp theo
          </p>
          <p className="text-xs text-gray-600 font-serif">
            Thêm buổi hẹn trong tab <strong>Lịch hẹn</strong> nhé!
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

      {/* ── 5. DEMO SEED (chỉ khi app trống; invite-card đã bỏ — mời qua icon QR ở Header) ── */}
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

      {/* ── 6. LIVE TOUCH HEARTBEAT (gọn — chat ở tab "Nhắn tin") ── */}
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
          className="w-full card-static p-4 flex items-center gap-3 text-left min-h-[44px] hover:border-violet-300 transition-colors"
        >
          <span className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center shrink-0">
            <Clapperboard className="w-5 h-5 text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-violet-700 dark:text-violet-300">Xem lại năm qua 🎬</span>
            <span className="block text-xs text-gray-600 dark:text-zinc-400 truncate">Slideshow 9:16 + nhạc waltz từ kỷ niệm có sẵn</span>
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

      {/* ── 8. REVIEW PROMPT (Cụm 8: sau date thứ 3) ── */}
      <ReviewPrompt dates={dates} />
    </div>
  );
};

export default Dashboard;
