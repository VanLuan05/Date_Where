import { useEffect, useState } from "react";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { formatDate } from "../../utils/helpers.js";
import { countdownTo } from "../../utils/journey.js";

/**
 * NextAppointmentCard
 * ─────────────────────────────────────────────────
 * Hiển thị buổi hẹn tiếp theo tối giản & hiện đại:
 *  • Tên địa điểm, ngày giờ hẹn
 *  • Chi phí & ghi chú
 *  • Bộ đếm ngược thời gian thực
 */
const NextAppointmentCard = ({ nextDate }) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!nextDate) return null;
  const cd = countdownTo(nextDate.date, nextDate.time, nowMs);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Top row: Label + Date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 px-2.5 py-1 rounded-lg">
          <Calendar className="w-3.5 h-3.5" /> Buổi hẹn tiếp theo
        </span>
        <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
          {formatDate(nextDate.date)}{nextDate.time ? ` • ${nextDate.time}` : ""}
        </span>
      </div>

      {/* Place name & notes */}
      <div>
        <h4 className="font-semibold text-stone-900 dark:text-zinc-100 text-base leading-snug">
          {nextDate?.placeName}
        </h4>
        {nextDate?.notes && (
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 line-clamp-2">
            "{nextDate.notes}"
          </p>
        )}
        {((nextDate?.budget?.actualCost ?? 0) > 0 ||
          (nextDate?.budget?.estimatedCost ?? 0) > 0) && (
          <p className="text-xs text-stone-600 dark:text-zinc-300 mt-1.5 font-medium">
            💰 Dự tính:{" "}
            <span className="text-stone-900 dark:text-stone-100 font-semibold">
              {new Intl.NumberFormat("vi-VN").format(
                nextDate?.budget?.actualCost > 0
                  ? nextDate.budget.actualCost
                  : nextDate.budget.estimatedCost
              )}đ
            </span>
          </p>
        )}
      </div>

      {/* Realtime countdown */}
      {cd && !cd.overdue && (
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { v: cd.d, l: "ngày" },
            { v: pad(cd.h), l: "giờ" },
            { v: pad(cd.m), l: "phút" },
            { v: pad(cd.s), l: "giây" },
          ].map((u, i) => (
            <div
              key={i}
              className="bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/60 dark:border-zinc-700/60 rounded-xl py-2 text-center"
            >
              <div className="font-sans text-base sm:text-lg font-bold text-stone-900 dark:text-zinc-100 tabular-nums leading-none">
                {u.v}
              </div>
              <div className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5 leading-none font-medium">
                {u.l}
              </div>
            </div>
          ))}
        </div>
      )}

      {cd?.overdue && (
        <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium py-1">
          ✨ Đang diễn ra buổi hẹn — chúc hai bạn thật vui vẻ!
        </p>
      )}
    </div>
  );
};

export default NextAppointmentCard;
