import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { normalizeStats } from "../../utils/journey.js";

/**
 * JourneyStatsRow (Streak Ngày)
 * ─────────────────────────────────────────────────
 * Giữ lại streak ngày thuần túy, mở app mỗi ngày là lên chuỗi.
 * Bỏ hoàn toàn love points và huy hiệu theo yêu cầu.
 */
const JourneyStatsRow = ({ stats: rawStats }) => {
  const stats = normalizeStats(rawStats);
  const [streakPop, setStreakPop] = useState(false);
  const prevStreakRef = useRef(stats.streak);

  useEffect(() => {
    if (stats.streak > (prevStreakRef.current ?? 0)) {
      setStreakPop(true);
      const timer = setTimeout(() => setStreakPop(false), 500);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = stats.streak;
  }, [stats.streak]);

  return (
    <div
      id="streak-card"
      className="bg-gradient-to-r from-orange-50/90 via-rose-50/80 to-pink-50/90 dark:from-zinc-800/90 dark:to-zinc-800/90 border border-orange-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm ${
              streakPop ? "scale-115 rotate-6 transition-transform duration-300" : ""
            }`}
          >
            <Flame className="w-6 h-6 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">
                Chuỗi {stats.streak} ngày
              </span>
              <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-semibold px-2 py-0.5 rounded-full">
                🔥 Đang giữ lửa
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              Mở app mỗi ngày để tăng chuỗi tình yêu của hai bạn nhé
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-2xl font-bold font-sans text-rose-600 dark:text-rose-400">
            {stats.streak}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block leading-none">
            ngày
          </span>
        </div>
      </div>
    </div>
  );
};

export default JourneyStatsRow;
