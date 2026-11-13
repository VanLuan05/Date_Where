import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { formatDate } from "../../utils/helpers.js";
import { countdownTo } from "../../utils/journey.js";

/**
 * NextAppointmentCard
 * ─────────────────────────────────────────────────
 * Hiển thị buổi hẹn tiếp theo tinh gọn & thanh thoát:
 *  • Tên địa điểm, ngày giờ hẹn
 *  • Ghi chú & chi phí dự tính
 *  • Đồng hồ đếm ngược thời gian thực (ngày:giờ:phút:giây)
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
    <div className="space-y-3">
      {/* ── Main appointment card ── */}
      <div className="card p-4 space-y-3">
        {/* Top row: label + date/time */}
        <div className="flex items-center justify-between">
          <span className="badge bg-rose-100 text-rose-700">
            <Calendar className="w-3.5 h-3.5 text-rose-500" /> Buổi hẹn tiếp theo
          </span>
          <span className="text-xs font-serif text-gray-600 font-medium">
            {formatDate(nextDate.date)}{nextDate.time ? ` • ${nextDate.time}` : ""}
          </span>
        </div>

        {/* Place name + notes */}
        <div>
          <h4 className="font-display font-semibold text-title text-stone-800 leading-tight">
            {nextDate?.placeName}
          </h4>
          {nextDate?.notes && (
            <p className="text-xs text-gray-600 font-serif italic mt-0.5 line-clamp-1">
              "{nextDate.notes}"
            </p>
          )}
          {((nextDate?.budget?.actualCost ?? 0) > 0 ||
            (nextDate?.budget?.estimatedCost ?? 0) > 0) && (
            <p className="text-xs text-emerald-700 font-serif mt-1 flex items-center gap-1 font-medium">
              <span>💰</span>
              <span>
                {nextDate?.budget?.actualCost > 0
                  ? `Chi phí thực tế: ${new Intl.NumberFormat("vi-VN").format(nextDate.budget.actualCost)}đ`
                  : `Chi phí dự tính: ${new Intl.NumberFormat("vi-VN").format(nextDate.budget.estimatedCost)}đ`}
              </span>
            </p>
          )}
        </div>

        {/* Countdown realtime ngày:giờ:phút:giây */}
        {cd && !cd.overdue && (
          <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
            {[
              { v: cd.d, l: "ngày" },
              { v: pad(cd.h), l: "giờ" },
              { v: pad(cd.m), l: "phút" },
              { v: pad(cd.s), l: "giây" },
            ].map((u, i) => (
              <div key={i} className="bg-gradient-to-b from-rose-500 to-pink-500 rounded-2xl py-2 text-white shadow-sm">
                <div className="font-display text-lg font-black leading-none tabular-nums">{u.v}</div>
                <div className="text-[11px] opacity-85 mt-0.5">{u.l}</div>
              </div>
            ))}
          </div>
        )}
        {cd?.overdue && (
          <p className="text-xs text-center text-emerald-600 font-semibold font-serif py-1">
            🎉 Đến giờ hẹn rồi — chúc đôi mình vui vẻ!
          </p>
        )}
      </div>
    </div>
  );
};

export default NextAppointmentCard;
