import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { STREAK_BADGES, badgeMessage, normalizeStats } from "../../utils/journey.js";

/**
 * JourneyStatsRow (Cụm 5)
 * ─────────────────────────────────────────────────
 * 🔥 Streak lửa + ⭐ Love Points + 🏅 Badge 7/30/100/365/1000 (tái dùng MILESTONE_MESSAGES).
 * Mở quà surprise (confetti + thư tay) khi chạm mốc via `pendingMilestone`.
 * Tương thích ngược: vẫn nhận placesCount/datesCount/visitedPlacesCount cũ.
 */
const JourneyStatsRow = ({
  stats: rawStats,
  pendingMilestone,
  onDismissMilestone,
  placesCount = 0,
  datesCount = 0,
  visitedPlacesCount = 0,
}) => {
  const stats = normalizeStats(rawStats);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftBadge, setGiftBadge] = useState(null);
  // P2 — streak lửa pop (scale 300ms) khi streak +1 / nhận milestone
  const [streakPop, setStreakPop] = useState(false);
  const prevStreakRef = useRef(stats.streak);

  const popStreak = () => {
    setStreakPop(false);
    requestAnimationFrame(() => {
      setStreakPop(true);
      setTimeout(() => setStreakPop(false), 350);
    });
  };

  useEffect(() => {
    if (stats.streak > (prevStreakRef.current ?? 0)) popStreak();
    prevStreakRef.current = stats.streak;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.streak]);

  useEffect(() => {
    if (pendingMilestone) {
      setGiftBadge(pendingMilestone);
      setGiftOpen(true);
      popStreak();
      try {
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMilestone]);

  const closeGift = () => {
    setGiftOpen(false);
    setGiftBadge(null);
    onDismissMilestone?.();
  };

  const nextBadge = STREAK_BADGES.find((b) => stats.streak < b) || null;

  const cards = [
    {
      icon: "🔥",
      label: "Streak ngày",
      value: stats.streak,
      sub: nextBadge ? `còn ${nextBadge - stats.streak} ngày tới 🏅${nextBadge}` : "max mốc! 🏆",
      gradient: "from-orange-400 to-rose-500",
    },
    {
      icon: "⭐",
      label: "Love Points",
      value: stats.points,
      sub: "date +50 • recap +30",
      gradient: "from-amber-400 to-yellow-500",
    },
    {
      icon: "🏅",
      label: "Huy hiệu",
      value: `${(stats.unlockedBadges || []).length}/${STREAK_BADGES.length}`,
      sub: STREAK_BADGES.map((b) =>
        (stats.unlockedBadges || []).includes(b) || stats.streak >= b ? "●" : "○"
      ).join(" "),
      gradient: "from-violet-400 to-fuchsia-500",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="card-secondary p-4 text-center">
            <div
              className={`w-10 h-10 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-sm ${
                i === 0 && streakPop ? "animate-streak-pop" : ""
              }`}
            >
              <span className="text-lg">{c.icon}</span>
            </div>
            <div className="font-display text-2xl font-bold text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-600 mt-0.5 leading-tight font-semibold">{c.label}</div>
            <div className="text-xs text-gray-600 mt-0.5 leading-tight">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Hàng phụ tương thích ngược: số liệu kho cũ */}
      {(placesCount > 0 || datesCount > 0 || visitedPlacesCount > 0) && (
        <p className="text-center text-xs text-gray-600 font-serif">
          📍 {placesCount} địa điểm • 📅 {datesCount} lịch hẹn • 📸 {visitedPlacesCount} kỷ niệm
        </p>
      )}

      {/* 🎁 Mở quà surprise khi chạm mốc streak */}
      {giftOpen && giftBadge && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeGift(); }}
        >
          <div className="bg-white rounded-sheet max-w-sm w-full p-6 text-center shadow-card-hover animate-slide-up border border-rose-200">
            <div className="text-5xl mb-2">🎁</div>
            <h3 className="font-display text-xl font-bold text-rose-700">
              Chạm mốc {giftBadge} ngày streak! 🔥
            </h3>
            <p className="text-sm text-stone-600 font-serif italic mt-2 leading-relaxed">
              {badgeMessage(giftBadge)}
            </p>
            <div className="mt-3 bg-rose-50 border border-rose-100 rounded-2xl p-3 text-xs text-stone-600 font-serif leading-relaxed">
              💌 <strong>Thư tay gửi đôi mình:</strong> Cảm ơn hai bạn đã mở app, thả tim và hẹn hò
              đều đặn mỗi ngày. Streak này là minh chứng cho tình yêu kiên trì — giữ lửa nhé! 💕
            </div>
            <button onClick={closeGift} className="btn-primary w-full mt-4 py-2.5 text-sm">
              Mở quà xong rồi 💖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyStatsRow;
