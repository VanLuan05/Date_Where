import { Home, MapPin, Calendar, MessageCircle } from "lucide-react";

const BottomNav = ({ activeTab, onTabChange, chatUnreadCount = 0 }) => {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Đôi mình" },
    { id: "places", icon: MapPin, label: "Địa điểm" },
    { id: "chat", icon: MessageCircle, label: "Nhắn tin" },
    { id: "dates", icon: Calendar, label: "Lịch hẹn" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-rose-100/60 shadow-lg">
      <div className="max-w-2xl mx-auto px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === "chat" && chatUnreadCount > 0 && !isActive;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                onTabChange(item.id);
              }}
              className={`nav-item relative ${
                isActive ? "nav-item-active" : "nav-item-inactive"
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs border border-white">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
