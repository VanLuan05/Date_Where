import { Heart, Settings, Wifi, WifiOff, Loader2, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme.js";

/**
 * Header component
 * syncStatus: "realtime" | "offline" | "connecting"
 */
const Header = ({
  couple,
  currentUser,
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  syncStatus,
}) => {
  const { toggleTheme, isDark } = useTheme();
  if (!couple) return null;
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const user =
    couple?.[currentUser] ||
    (isUser1 ? couple?.user1 || couple?.userA : couple?.user2 || couple?.userB) || {
      name: isUser1 ? "Bạn" : "Người ấy",
      avatar: "",
    };

  const syncBadge = {
    realtime: {
      icon: <Wifi className="w-3 h-3" />,
      label: "Đồng bộ",
      cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40",
      dot: "bg-emerald-500",
    },
    connecting: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Đang kết nối...",
      cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40",
      dot: "bg-amber-400",
    },
    offline: {
      icon: <WifiOff className="w-3 h-3" />,
      label: "Offline",
      cls: "bg-stone-200/60 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-300/60",
      dot: "bg-stone-400",
    },
  }[syncStatus] || {
    icon: <WifiOff className="w-3 h-3" />,
    label: "Offline",
    cls: "bg-stone-200/60 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-300/60",
    dot: "bg-stone-400",
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-stone-200/70 dark:border-zinc-800/80 shadow-xs">
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Sync Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center shadow-xs">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-stone-900 dark:text-stone-100 text-[15px] leading-tight tracking-tight">
              DateWhere
            </h1>
            {syncStatus !== "realtime" && (
              <div className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${syncBadge.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${syncBadge.dot}`} />
                {syncBadge.icon}
                <span>{syncBadge.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={isDark ? "Giao diện sáng" : "Giao diện tối (Dark romantic)"}
            className="w-9 h-9 rounded-xl bg-stone-100/80 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800 flex items-center justify-center hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95 text-stone-600 dark:text-stone-300"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Notification Center */}
          <button
            id="open-notifications-btn"
            onClick={onOpenNotifications}
            aria-label={unreadNotificationsCount > 0 ? `Hộp thông báo, ${unreadNotificationsCount} chưa đọc` : "Hộp thông báo"}
            className="relative w-9 h-9 rounded-xl bg-stone-100/80 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800 flex items-center justify-center hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95 text-stone-600 dark:text-stone-300"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            aria-label="Cài đặt cặp đôi"
            className="w-9 h-9 rounded-xl bg-stone-100/80 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800 flex items-center justify-center hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95 text-stone-600 dark:text-stone-300"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Badge */}
          <div
            id="current-user-badge"
            className="flex items-center gap-2 bg-stone-100/80 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800 rounded-xl px-2.5 py-1 select-none"
            title={`Tài khoản trên thiết bị này: ${user?.name || "Bạn"}`}
          >
            <div className="relative">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={user?.name || "User"}
                className="w-6 h-6 rounded-full object-cover bg-stone-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-zinc-900 rounded-full" />
            </div>
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 max-w-[80px] truncate hidden sm:inline">
              {user?.name || "Bạn"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
