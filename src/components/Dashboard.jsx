import { useState, useEffect, useMemo } from "react";
import { Compass } from "lucide-react";
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
  blindSwipes,
  matchedFreeDays = [],
  partnerLocations = {},
  onShareLocation,
  onStartOnTheWay,
  onStopOnTheWay,
  notifPermission,
  onEnableNotifications,
  onTestNotification,
  // Live Touch & Haptic Heartbeat (chat đã tách ra ChatWidget độc lập)
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
}) => {
  const [nextWeather, setNextWeather] = useState(null);

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

      {/* ── 3. LIVE TOUCH HEARTBEAT (chat nằm ở ChatWidget nổi toàn app) ── */}
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

      {/* ── 5. JOURNEY STATS ROW ── */}
      <JourneyStatsRow
        placesCount={placesCount || 0}
        datesCount={datesCount || 0}
        visitedPlacesCount={visitedPlacesCount}
      />
    </div>
  );
};

export default Dashboard;
