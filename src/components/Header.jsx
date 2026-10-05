import { Heart, RefreshCw, Settings, Wifi, WifiOff, Loader2, Bell } from "lucide-react";

/**
 * Header component
 * syncStatus: "realtime" | "offline" | "connecting"
 */
const Header = ({
  couple,
  currentUser,
  onSwitchUser,
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  syncStatus,
}) => {
  if (!couple) return null;
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const user =
    couple?.[currentUser] ||
    (isUser1 ? couple?.user1 || couple?.userA : couple?.user2 || couple?.userB) || {
      name: isUser1 ? "Bạn" : "Người ấy",
      avatar: "",
    };
  const other =
    (isUser1 ? couple?.user2 || couple?.userB : couple?.user1 || couple?.userA) || {
      name: isUser1 ? "Người ấy" : "Bạn",
      avatar: "",
    };

  const syncBadge = {
    realtime: {
      icon: <Wifi className="w-3 h-3" />,
      label: "Realtime",
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-300/60",
      dot: "bg-emerald-500",
    },
    connecting: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Đang kết nối...",
      cls: "bg-amber-500/15 text-amber-700 border-amber-300/60",
      dot: "bg-amber-400",
    },
    offline: {
      icon: <WifiOff className="w-3 h-3" />,
      label: "Offline",
      cls: "bg-gray-200/70 text-gray-600 border-gray-300/60",
      dot: "bg-gray-400",
    },
  }[syncStatus] || {
    icon: <WifiOff className="w-3 h-3" />,
    label: "Offline",
    cls: "bg-gray-200/70 text-gray-600 border-gray-300/60",
    dot: "bg-gray-400",
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-rose-100/60 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + sync badge */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-romantic">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-rose-700 text-base leading-none">DateWhere</h1>
            {/* Sync status badge - only shown if connecting or offline */}
            {syncStatus !== "realtime" && (
              <div className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5 ${syncBadge.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${syncBadge.dot}`} />
                {syncBadge.icon}
                {syncBadge.label}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell button */}
          <button
            id="open-notifications-btn"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-2xl bg-white/80 border border-rose-100 flex items-center justify-center hover:border-rose-300 hover:bg-rose-50 transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            title="Hộp thông báo & Lịch sử đôi mình"
          >
            <Bell className="w-4 h-4 text-rose-500" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs border border-white">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-2xl bg-white/80 border border-rose-100 flex items-center justify-center hover:border-rose-300 hover:bg-rose-50 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Cài đặt cặp đôi"
          >
            <Settings className="w-4 h-4 text-rose-500" />
          </button>

          {/* Switch User */}
          <button
            id="switch-user-btn"
            onClick={onSwitchUser}
            className="flex items-center gap-2 bg-white/90 border border-rose-200 rounded-2xl px-3 py-2 
                       hover:border-rose-400 hover:shadow-romantic transition-all duration-200 group"
            title="Đổi người dùng"
          >
            <div className="flex items-center -space-x-2">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={user?.name || "User"}
                className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src={other?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                alt={other?.name || "Partner"}
                className="w-7 h-7 rounded-full ring-2 ring-white object-cover opacity-50"
              />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 leading-none">Đang là</p>
              <p className="text-xs font-semibold text-rose-700 leading-none">{user?.name || "Bạn"}</p>
            </div>
            <RefreshCw className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
