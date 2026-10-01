import { Heart, RefreshCw, Settings, Wifi, WifiOff, Loader2 } from "lucide-react";

/**
 * Header component
 * syncStatus: "realtime" | "offline" | "connecting"
 */
const Header = ({ couple, currentUser, onSwitchUser, onOpenSettings, syncStatus }) => {
  if (!couple) return null;
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const user = couple[currentUser] || (isUser1 ? (couple.user1 || couple.userA) : (couple.user2 || couple.userB));
  const other = isUser1 ? (couple.user2 || couple.userB) : (couple.user1 || couple.userA);

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
          {/* Settings button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-2xl bg-white/80 border border-rose-100 flex items-center justify-center hover:border-rose-300 hover:bg-rose-50 transition-all duration-200"
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
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src={other.avatar}
                alt={other.name}
                className="w-7 h-7 rounded-full ring-2 ring-white object-cover opacity-50"
              />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 leading-none">Đang là</p>
              <p className="text-xs font-semibold text-rose-700 leading-none">{user.name}</p>
            </div>
            <RefreshCw className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
