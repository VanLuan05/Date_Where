import { useEffect, useState } from "react";
import { Bell, Calendar } from "lucide-react";
import { formatDate, isUpcoming } from "../../utils/helpers.js";
import { countdownTo } from "../../utils/journey.js";
import { DateReminderPermissionBanner } from "../DateReminderToast.jsx";
import {
  getHoursUntilDate,
  REMINDER_MILESTONES,
  isReminderSent,
} from "../../utils/notificationService.js";

/**
 * NextAppointmentCard
 * ─────────────────────────────────────────────────
 * Hiển thị buổi hẹn tiếp theo:
 *  • Tên địa điểm, ngày giờ
 *  • Đếm ngược (ngày/giờ còn lại)
 *  • Milestone nhắc hẹn tự động (5 chip)
 *  • Banner thông báo (quyền + "Thử gửi" nhỏ gọn)
 *  • Dự báo thời tiết (nếu có)
 *
 * Giữ nguyên toàn bộ logic, tái cấu trúc layout.
 */
const NextAppointmentCard = ({
  nextDate,
  nextWeather,
  notifPermission,
  onEnableNotifications,
  onTestNotification,
}) => {
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
      {/* ── Main appointment card (P1 primary: card + shadow-card-hover) ── */}
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

        {/* Countdown realtime ngày:giờ:phút:giây (Cụm 5) */}
        {cd && !cd.overdue && (
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { v: cd.d, l: "ngày" },
              { v: pad(cd.h), l: "giờ" },
              { v: pad(cd.m), l: "phút" },
              { v: pad(cd.s), l: "giây" },
            ].map((u, i) => (
              <div key={i} className="bg-rose-500 rounded-2xl py-2 text-white shadow-sm">
                <div className="font-display text-lg font-black leading-none tabular-nums">{u.v}</div>
                <div className="text-xs opacity-80 mt-0.5">{u.l}</div>
              </div>
            ))}
          </div>
        )}
        {cd?.overdue && (
          <p className="text-xs text-center text-emerald-600 font-semibold font-serif">
            🎉 Đến giờ hẹn rồi — chúc đôi mình vui vẻ!
          </p>
        )}

        {/* Weather forecast */}
        {nextWeather?.available ? (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 transition-all ${
              nextWeather.isRainy
                ? "bg-blue-50/80 border-blue-200 text-blue-900"
                : "bg-amber-50/70 border-amber-200 text-stone-800"
            }`}
          >
            <span className="text-xl select-none flex-shrink-0">{nextWeather.icon}</span>
            <div className="min-w-0 flex-1 font-serif">
              <p className="font-sans font-bold text-xs text-stone-800">
                {nextWeather.tempMin}° - {nextWeather.tempMax}°C • Xác suất mưa: {nextWeather.rainProb}% • {nextWeather.label}
              </p>
              <p className="text-xs italic text-gray-600 truncate mt-0.5">
                "{nextWeather.advice}"
              </p>
            </div>
          </div>
        ) : nextWeather && !nextWeather.available && nextWeather.tooFar ? (
          <p className="text-xs text-gray-600 font-serif italic">
            ✨ Dự báo thời tiết sẽ sẵn sàng trong vòng 14 ngày trước buổi hẹn
          </p>
        ) : null}

        {/* Reminder milestones */}
        {(() => {
          const remainingHours = getHoursUntilDate(nextDate.date, nextDate.time);
          if (remainingHours === null || remainingHours <= 0) return null;
          return (
            <div className="pt-2 border-t border-rose-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-serif text-gray-600">
                <span className="flex items-center gap-1 font-sans font-semibold text-rose-700">
                  <Bell className="w-3.5 h-3.5 text-rose-500 animate-wiggle" />
                  Nhắc hẹn điện thoại:
                </span>
                <span className="text-gray-600 font-medium">
                  {remainingHours >= 24
                    ? `Còn ~${Math.round(remainingHours / 24)} ngày nữa`
                    : `Còn ~${Math.round(remainingHours)} tiếng nữa`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs text-center font-sans font-semibold">
                {REMINDER_MILESTONES.map((m) => {
                  const isPassed = remainingHours <= m.minHours;
                  const isCurrent =
                    remainingHours > m.minHours && remainingHours <= m.maxHours;
                  const isSent = isReminderSent(nextDate.id, m.id);
                  return (
                    <div
                      key={m.id}
                      className={`py-1 px-0.5 rounded-xl border transition-all ${
                        isSent
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                          : isCurrent
                          ? "bg-rose-500 border-rose-600 text-white shadow-xs font-bold animate-pulse"
                          : isPassed
                          ? "bg-stone-50 border-stone-200 text-stone-400 opacity-60"
                          : "bg-white/90 border-rose-100 text-rose-600"
                      }`}
                      title={`${m.label} (${m.badge})`}
                    >
                      <span className="block truncate">
                        {isSent ? "✓ " : ""}
                        {m.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Notification permission banner (outside main card, more compact) */}
      {notifPermission && (
        <DateReminderPermissionBanner
          permission={notifPermission}
          onEnable={onEnableNotifications}
          onTest={() => onTestNotification?.(nextDate?.placeName || "DateWhere")}
        />
      )}
    </div>
  );
};

export default NextAppointmentCard;
