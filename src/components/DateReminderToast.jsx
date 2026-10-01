import { useEffect } from "react";
import { Bell, Heart, X, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

/**
 * Toast thông báo nổi khi có lịch hẹn đến mốc (24h, 12h, 9h, 3h, 1h)
 */
export const DateReminderToast = ({ alert, onDismiss, onNavigateDates }) => {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 animate-slide-down">
      <div className="bg-white/95 backdrop-blur-md border-2 border-rose-400 rounded-3xl p-4 shadow-romantic flex items-start gap-3 ring-4 ring-rose-200/50">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm flex-shrink-0 animate-bounce-soft">
          <Bell className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 font-serif">
          <div className="flex items-center gap-1.5">
            <h4 className="font-sans font-bold text-xs text-rose-800 uppercase tracking-wider">
              {alert.title}
            </h4>
          </div>
          <p className="text-xs text-stone-700 mt-1 leading-relaxed font-serif">
            {alert.body}
          </p>
          {onNavigateDates && (
            <button
              onClick={() => {
                onDismiss();
                onNavigateDates();
              }}
              className="mt-2 text-[11px] font-sans font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer underline underline-offset-2"
            >
              <span>Xem chi tiết buổi hẹn</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Card gợi ý bật thông báo trên điện thoại (xuất hiện ở Dashboard hoặc DateScheduler)
 */
export const DateReminderPermissionBanner = ({
  permission,
  onEnable,
  onTest,
  isDismissed,
  onDismiss,
}) => {
  if (isDismissed || permission === "unsupported") return null;

  // Nếu chưa cấp quyền
  if (permission === "default") {
    return (
      <div className="card-static p-4 sm:p-5 bg-gradient-to-br from-rose-50 via-pink-50/50 to-amber-50/40 border-2 border-rose-200/80 rounded-3xl shadow-xs space-y-3 animate-fade-in relative">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 p-1"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Bell className="w-5 h-5 animate-wiggle" />
          </div>
          <div className="space-y-1 pr-6 font-serif">
            <h4 className="font-sans font-bold text-sm text-stone-900 leading-tight">
              Bật thông báo nhắc hẹn trên điện thoại 📲
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Date_Where sẽ tự động gửi thông báo nhắc nhở <strong>trước 1 ngày</strong> và khi còn <strong>12, 9, 3, 1 tiếng</strong> để đôi mình chuẩn bị chu đáo nhất 💕
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            id="enable-notifications-btn"
            onClick={onEnable}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Bật thông báo ngay</span>
          </button>
          <button
            type="button"
            onClick={onTest}
            className="btn-secondary py-2 px-3 text-xs text-stone-600 font-serif hover:text-rose-600 active:scale-95"
          >
            <span>Thử thông báo</span>
          </button>
        </div>
      </div>
    );
  }

  // Nếu đã cấp quyền -> hiển thị trạng thái xanh thân thiện
  if (permission === "granted") {
    return (
      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-2 font-serif">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Thông báo nhắc hẹn trên điện thoại đang <strong>hoạt động</strong> (nhắc trước 24h, 12h, 9h, 3h, 1h).
          </span>
        </div>
        <button
          type="button"
          onClick={onTest}
          className="shrink-0 bg-white hover:bg-emerald-100 text-emerald-700 font-sans font-bold text-[11px] px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          Thử gửi 📲
        </button>
      </div>
    );
  }

  return null;
};
