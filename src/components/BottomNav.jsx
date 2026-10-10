import { Home, MapPin, Calendar, MessageCircle } from "lucide-react";

const BottomNav = ({ activeTab, onTabChange, chatUnreadCount = 0 }) => {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Đôi mình" },
    { id: "places", icon: MapPin, label: "Địa điểm" },
    { id: "chat", icon: MessageCircle, label: "Nhắn tin" },
    { id: "dates", icon: Calendar, label: "Lịch hẹn" },
  ];

  const handleChange = (id) => {
    try {
      navigator.vibrate?.(10);
    } catch {}
    onTabChange(id);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-3"
      style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-2xl mx-auto glass rounded-2xl shadow-card px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === "chat" && chatUnreadCount > 0 && !isActive;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                handleChange(item.id);
              }}
              aria-current={isActive ? "page" : undefined}
              className={`nav-item relative ${
                isActive ? "nav-item-active" : "nav-item-inactive"
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs border-2 border-white">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </span>
              <span className="nav-label text-[10px]">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-rose-500" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
