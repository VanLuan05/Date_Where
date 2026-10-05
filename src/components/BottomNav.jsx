import { Home, MapPin, Calendar, Compass } from "lucide-react";

const BottomNav = ({ activeTab, onTabChange, onOpenLoveMap }) => {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Đôi mình" },
    { id: "places", icon: MapPin, label: "Địa điểm" },
    { id: "map", icon: Compass, label: "Bản đồ", isAction: true },
    { id: "dates", icon: Calendar, label: "Lịch hẹn" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-rose-100/60 shadow-lg">
      <div className="max-w-2xl mx-auto px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                if (item.isAction) {
                  onOpenLoveMap?.();
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`nav-item ${
                isActive ? "nav-item-active" : "nav-item-inactive"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
