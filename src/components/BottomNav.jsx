import { Home, MapPin, Calendar, Heart } from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", icon: Home, label: "Doi minh" },
  { id: "places", icon: MapPin, label: "Dia diem" },
  { id: "dates", icon: Calendar, label: "Lich hen" },
];

const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-rose-100/60 shadow-lg">
      <div className="max-w-2xl mx-auto px-2 py-2 flex items-center justify-around">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "" : ""}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
