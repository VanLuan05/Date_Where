import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Compass, QrCode, History, Clapperboard } from "lucide-react";
import ConciergeCard from "./ConciergeCard.jsx";
import ReviewPrompt from "./ReviewPrompt.jsx";
import { isUpcoming } from "../utils/helpers.js";
import { getWeatherForecastForDate, fetchWeatherForecastData } from "../utils/weatherService.js";
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
 * Layout P0 (gọn 8 khối → 3 viewport đầu + tab phụ):
 *  1. CoupleHeroCard     — hero gradient DUY NHẤT trên màn hình
 *  2. CoupleQuickActions — 4 nút tiện ích (card trắng, icon màu đặc)
 *  3. NextAppointmentCard — Buổi hẹn tiếp theo
 *  4. JourneyStatsRow    — 3 thống kê hành trình
 *  5. Invite/Demo        — dạng secondary (card thường, icon đặc, không gradient)
 *  6. LiveTouchCard      — Nhịp đập (gọn)
 *  7. Tabs Khám phá / Hành trình — Concierge | YearRecap + LoveTimeline
 *  8. ReviewPrompt       — giữ nguyên, dạng secondary
 *
 * Giữ nguyên 100% State, Controller, Handler sự kiện cũ.
 * BottomNav 4 tab không đổi, không thêm dark-mode.
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
  onOpenInvite,
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
  // Concierge (Cụm 7): 1-tap prefill sang tab Lịch hẹn
  onQuickSchedule,
}) => {
  const [nextWeather, setNextWeather] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [forecastMap, setForecastMap] = useState({});
  const [exploreTab, setExploreTab] = useState("discover");
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

  // Forecast map 16 ngày cho Concierge (Cụm 7) — cache sẵn trong weatherService
  useEffect(() => {
    let isMounted = true;
    import("../utils/weatherService.js").then(({ fetchWeatherForecastData, getWeatherCondition }) => {
      fetchWeatherForecastData().then((daily) => {
        if (!daily || !isMounted) return;
        const map = {};
        daily.time.forEach((dateStr, idx) => {
          const code = daily.weather_code[idx];
          const tempMax = Math.round(daily.temperature_2m_max[idx]);
          const tempMin = Math.round(daily.temperature_2m_min[idx]);
          const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0;
          map[dateStr] = { date: dateStr, tempMax, tempMin, rainProb, ...getWeatherCondition(code, rainProb) };
        });
        setForecastMap(map);
      }).catch(() => {});
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

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

      {/* ── 5. INVITE + DEMO SEED (secondary — card thường, không gradient/border màu) ── */}
      {(onOpenInvite || (isEmpty && onSeedDemo)) && (
        <div className="grid grid-cols-1 gap-2">
          {onOpenInvite && (
            <button
              id="dashboard-invite-btn"
              onClick={onOpenInvite}
              className="card-static p-4 flex items-center gap-3 text-left"
            >
              <span className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-rose-700">Mời người ấy vào app 💌</span>
                <span className="block text-xs text-gray-600">
                  Mã {couple?.coupleCode || couple?.inviteCode || ""} — quét QR hoặc gửi link là vào ngay
                </span>
              </span>
            </button>
          )}
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
        </div>
      )}

      {/* ── 6. LIVE TOUCH HEARTBEAT (gọn — chat ở tab "Nhắn tin") ── */}
      <LiveTouchCard
        couple={couple}
        currentUser={currentUser}
        liveTouch={liveTouch}
        incomingHeartbeat={incomingHeartbeat}
        onSendHeartbeat={onSendHeartbeat}
      />

      {/* ── 7. TABS PHỤ: Khám phá (Concierge) / Hành trình (YearRecap + Timeline) ── */}
      <div className="card-static p-3 space-y-3">
        <div className="flex gap-2" role="tablist" aria-label="Khám phá thêm">
          <button
            role="tab"
            aria-selected={exploreTab === "discover"}
            onClick={() => setExploreTab("discover")}
            className={`tab-btn flex-1 ${exploreTab === "discover" ? "tab-btn-active" : "tab-btn-inactive"}`}
          >
            ✨ Khám phá
          </button>
          <button
            role="tab"
            aria-selected={exploreTab === "journey"}
            onClick={() => setExploreTab("journey")}
            className={`tab-btn flex-1 ${exploreTab === "journey" ? "tab-btn-active" : "tab-btn-inactive"}`}
          >
            💕 Hành trình
          </button>
        </div>

        {exploreTab === "discover" && (
          <ConciergeCard
            places={places}
            matchedFreeDays={matchedFreeDays}
            forecastMap={forecastMap}
            dates={dates}
            couple={couple}
            partnerLocations={partnerLocations}
            onQuickSchedule={onQuickSchedule}
          />
        )}

        {exploreTab === "journey" && (
          <div className="space-y-2">
            <button
              onClick={() => setShowRecap(true)}
              className="w-full card-static p-4 flex items-center gap-3 text-left"
            >
              <span className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center shrink-0">
                <Clapperboard className="w-5 h-5 text-white" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-violet-700">Xem lại năm qua 🎬</span>
                <span className="block text-xs text-gray-600">Slideshow 9:16 + nhạc waltz từ kỷ niệm có sẵn</span>
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
          </div>
        )}
      </div>

      {/* ── 8. REVIEW PROMPT (Cụm 8: sau date thứ 3) ── */}
      <ReviewPrompt dates={dates} />
    </div>
  );
};

export default Dashboard;
