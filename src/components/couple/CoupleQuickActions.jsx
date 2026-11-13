import { CalendarHeart, Shuffle, QrCode, CalendarPlus } from "lucide-react";

/**
 * CoupleQuickActions
 * ─────────────────────────────────────────────────
 * Hàng 4 nút tiện ích lãng mạn & hữu dụng cho đôi mình:
 *  1. 🗓️ Lịch rảnh     → onOpenAvailability (tìm ngày chung đôi)
 *  2. 🎲 Quay quán     → onOpenRandomPicker ("Hôm nay đi đâu?")
 *  3. 💌 Mời đôi       → onOpenInvite (QR & mã kết nối)
 *  4. ✨ Lên lịch hẹn   → onNavigateDates (tạo lịch hẹn mới)
 */
const CoupleQuickActions = ({
  onOpenAvailability,
  onOpenRandomPicker,
  onOpenInvite,
  onNavigateDates,
  matchedFreeDays = [],
  placesCount = 0,
  couple,
}) => {
  const coupleCode = couple?.coupleCode || couple?.inviteCode;

  const actions = [
    {
      id: "quick-availability-btn",
      emoji: "🗓️",
      icon: CalendarHeart,
      label: "Lịch rảnh",
      sublabel: matchedFreeDays.length > 0 ? `${matchedFreeDays.length} ngày` : null,
      gradient: "from-violet-500 to-fuchsia-500",
      badgeColor: "bg-fuchsia-500",
      onClick: onOpenAvailability,
    },
    {
      id: "quick-random-picker-btn",
      emoji: "🎲",
      icon: Shuffle,
      label: "Quay quán",
      sublabel: placesCount > 0 ? `${placesCount} quán` : null,
      gradient: "from-amber-400 to-rose-400",
      badgeColor: "bg-amber-500",
      onClick: onOpenRandomPicker,
    },
    {
      id: "quick-invite-btn",
      emoji: "💌",
      icon: QrCode,
      label: "Mời đôi",
      sublabel: coupleCode ? coupleCode : null,
      gradient: "from-rose-400 to-pink-500",
      badgeColor: "bg-rose-500",
      onClick: onOpenInvite,
    },
    {
      id: "quick-schedule-btn",
      emoji: "✨",
      icon: CalendarPlus,
      label: "Lên lịch",
      sublabel: null,
      gradient: "from-pink-500 to-rose-600",
      badgeColor: "bg-pink-500",
      onClick: onNavigateDates,
    },
  ];

  return (
    <div className="quick-actions-row">
      <div className="grid grid-cols-4 gap-2.5">
        {actions.map((action) => (
          <button
            key={action.id}
            id={action.id}
            type="button"
            onClick={action.onClick}
            className="quick-action-pill group relative flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-2xl bg-white/85 dark:bg-zinc-800/80 backdrop-blur-sm border border-rose-100/80 dark:border-white/10 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {/* Icon circle */}
            <div
              className={`w-11 h-11 rounded-[14px] bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200 text-white`}
            >
              <span className="text-xl leading-none select-none">{action.emoji}</span>
            </div>

            {/* Badge */}
            {action.sublabel && (
              <span
                className={`absolute top-1.5 right-1.5 ${action.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm max-w-[54px] truncate`}
              >
                {action.sublabel}
              </span>
            )}

            {/* Label */}
            <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoupleQuickActions;
