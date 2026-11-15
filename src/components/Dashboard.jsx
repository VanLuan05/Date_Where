import { useState, useMemo } from "react";
import ReviewPrompt from "./ReviewPrompt.jsx";
import { isUpcoming } from "../utils/helpers.js";
import CoupleHeroCard from "./couple/CoupleHeroCard.jsx";
import LiveTouchCard from "./couple/LiveTouchCard.jsx";
import NextAppointmentCard from "./couple/NextAppointmentCard.jsx";
import JourneyStatsRow from "./couple/JourneyStatsRow.jsx";
import EmptyState from "./EmptyState.jsx";
import { HeroSkeleton, NextDateSkeleton } from "./Skeleton.jsx";

/**
 * Dashboard (Tab "Đôi mình")
 * ─────────────────────────────────────────────────
 * Giao diện tối giản, thanh lịch, tập trung vào tình yêu đôi bạn:
 *  1. CoupleHeroCard     — Ngày bên nhau & tên đôi
 *  2. JourneyStatsRow    — Chuỗi streak ngày đăng nhập 🔥
 *  3. NextAppointmentCard — Buổi hẹn tiếp theo & đếm ngược
 *  4. LiveTouchCard      — Nhịp tim chạm yêu thương
 *  5. ReviewPrompt       — Nhắc viết nhật ký sau hẹn hò
 */
const Dashboard = ({
  couple,
  currentUser,
  isLoading = false,
  onUpdateCouple,
  dates = [],
  places = [],
  onSeedDemo,
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
  stats,
  onNavigateTab,
}) => {
  const [seeding, setSeeding] = useState(false);
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
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-2">
      {/* ── 1. HERO CARD ── */}
      <CoupleHeroCard
        couple={couple}
        currentUser={currentUser}
        onUpdateCouple={onUpdateCouple}
      />

      {/* ── 2. STREAK NGÀY (Chỉ giữ lại chuỗi ngày, mở app là tăng) ── */}
      <JourneyStatsRow stats={stats || couple?.stats} />

      {/* ── 3. BUỔI HẸN TIẾP THEO ── */}
      {nextDate ? (
        <NextAppointmentCard nextDate={nextDate} />
      ) : (
        <div className="bg-white dark:bg-zinc-800/80 border border-rose-100 dark:border-white/10 rounded-2xl p-5 text-center space-y-2 shadow-xs">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            📅 Chưa có buổi hẹn tiếp theo
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cùng người ấy lên kế hoạch cho buổi hẹn tiếp theo nhé
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab?.("dates")}
            className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            + Lên lịch hẹn mới
          </button>
        </div>
      )}

      {/* ── 4. LIVE TOUCH (Nhịp tim yêu thương) ── */}
      <LiveTouchCard
        couple={couple}
        currentUser={currentUser}
        liveTouch={liveTouch}
        incomingHeartbeat={incomingHeartbeat}
        onSendHeartbeat={onSendHeartbeat}
      />

      {/* ── 5. REVIEW PROMPT (sau buổi hẹn) ── */}
      <ReviewPrompt dates={dates} />

      {/* ── 6. DEMO SEED (khi chưa có dữ liệu) ── */}
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
  );
};

export default Dashboard;
