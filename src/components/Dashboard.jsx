import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Compass, QrCode, Sparkles, History, Clapperboard } from "lucide-react";
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

// Cụm 6: lazy để không phình bundle initial (timeline + slideshow 9:16)
const LoveTimeline = lazy(() => import("./LoveTimeline.jsx"));
const YearRecapModal = lazy(() => import("./YearRecapModal.jsx"));

/**
 * Dashboard (Đôi mình tab)
 * ─────────────────────────────────────────────────
 * Layout mới (Modern Romantic Minimalism):
 *  1. CoupleHeroCard     — Avatar + Ngày + Progress bar
 *  2. CoupleQuickActions — 4 nút tiện ích (thay 2 banner cũ)
 *  3. LiveTouchCard      — Nhịp đập + Tâm trạng nhanh
 *  4. NextAppointmentCard — Buổi hẹn tiếp theo + thời tiết + nhắc hẹn
 *  5. JourneyStatsRow    — 3 thống kê hành trình
 *
 * Giữ nguyên 100% State, Controller, Handler sự kiện cũ.
 */
const Dashboard = ({
  couple,
  currentUser,
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

  return (
    <div className="space-y-4 animate-fade-in pb-2">
      {/* ── 1. HERO CARD: Avatar + Day Counter + Progress ── */}
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

      {/* ── 2b. INVITE + DEMO SEED ── */}
      {(onOpenInvite || (isEmpty && onSeedDemo)) && (
        <div className="grid grid-cols-1 gap-2">
          {onOpenInvite && (
            <button
              id="dashboard-invite-btn"
              onClick={onOpenInvite}
              className="card-static p-4 flex items-center gap-3 text-left bg-gradient-to-br from-rose-50 to-pink-50/60 border-2 border-rose-100 hover:border-rose-300 transition-all active:scale-[0.99]"
            >
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-rose-700">Mời người ấy vào app 💌</span>
                <span className="block text-[11px] text-gray-500">
                  Mã {couple?.coupleCode || couple?.inviteCode || ""} — quét QR hoặc gửi link là vào ngay
                </span>
              </span>
            </button>
          )}
          {isEmpty && onSeedDemo && (
            <button
              id="demo-seed-btn"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="card-static p-4 flex items-center gap-3 text-left bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-200 hover:border-amber-400 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-amber-700">
                  {seeding ? "Đang nạp demo..." : "Dùng thử demo 1 chạm ✨"}
                </span>
                <span className="block text-[11px] text-gray-500">Nạp ngay 6 quán + 2 lịch hẹn mẫu đẹp để khám phá app</span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── 3. LIVE TOUCH HEARTBEAT (chat nằm ở tab "Nhắn tin" dưới thanh điều hướng) ── */}
      <LiveTouchCard
        couple={couple}
        currentUser={currentUser}
        liveTouch={liveTouch}
        incomingHeartbeat={incomingHeartbeat}
        onSendHeartbeat={onSendHeartbeat}
      />

      {/* ── 4. NEXT APPOINTMENT CARD ── */}
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
        <div className="card-static p-4 bg-gradient-to-br from-rose-50 to-pink-50/40 border-2 border-rose-100 rounded-[22px] text-center space-y-2">
          <p className="text-sm text-stone-500 font-serif">
            📅 Chưa có buổi hẹn tiếp theo
          </p>
          <p className="text-xs text-stone-400 font-serif">
            Thêm buổi hẹn trong tab <strong>Lịch hẹn</strong> nhé!
          </p>
        </div>
      )}

      {/* ── 5. JOURNEY STATS ROW (Cụm 5: streak + points + badge + quà surprise) ── */}
      <JourneyStatsRow
        stats={stats || couple?.stats}
        pendingMilestone={pendingMilestone}
        onDismissMilestone={onDismissMilestone}
        placesCount={placesCount || 0}
        datesCount={datesCount || 0}
        visitedPlacesCount={visitedPlacesCount}
      />

      {/* ── 6. LOVE TIMELINE + YEAR RECAP (Cụm 6 — section trong Dashboard, giữ nguyên BottomNav 4 tab) ── */}
      <div className="space-y-2">
        <button
          onClick={() => setShowRecap(true)}
          className="w-full card-static p-4 flex items-center gap-3 text-left bg-gradient-to-br from-violet-50 to-fuchsia-50/60 border-2 border-violet-200 hover:border-violet-400 transition-all active:scale-[0.99]"
        >
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Clapperboard className="w-5 h-5 text-white" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-violet-700">Xem lại năm qua 🎬</span>
            <span className="block text-[11px] text-gray-500">Slideshow 9:16 + nhạc waltz từ kỷ niệm có sẵn</span>
          </span>
        </button>
        <Suspense fallback={<div className="text-center text-xs text-stone-400 py-2">Đang tải timeline... 💕</div>}>
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

      {/* ── 7. LOVE CONCIERGE (Cụm 7: rule-based, 1-tap prefill sang Lịch hẹn) ── */}
      <ConciergeCard
        places={places}
        matchedFreeDays={matchedFreeDays}
        forecastMap={forecastMap}
        dates={dates}
        couple={couple}
        partnerLocations={partnerLocations}
        onQuickSchedule={onQuickSchedule}
      />

      {/* ── 8. REVIEW PROMPT (Cụm 8: sau date thứ 3) ── */}
      <ReviewPrompt dates={dates} />
    </div>
  );
};

export default Dashboard;
