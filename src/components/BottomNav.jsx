import { Home, MapPin, Calendar, BookHeart } from "lucide-react";

const BottomNav = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Đôi mình" },
    { id: "places", icon: MapPin, label: "Địa điểm" },
    { id: "dates", icon: Calendar, label: "Lịch hẹn" },
    { id: "journey", icon: BookHeart, label: "Hành trình" },
  ];

  const handleChange = (id) => {
    try {
      navigator.vibrate?.(10);
    } catch {}
    onTabChange(id);
  };

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed bottom-0 left-0 right-0 z-50 mx-3 pointer-events-none"
      style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-md mx-auto glass dark:bg-zinc-900/85 dark:border-white/10 rounded-2xl shadow-card px-4 py-2 flex items-center justify-around pointer-events-auto border border-rose-100/70">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                handleChange(item.id);
              }}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`nav-item relative min-h-[44px] min-w-[72px] px-3 py-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer ${
                isActive
                  ? "nav-item-active text-rose-600 dark:text-rose-400 font-bold"
                  : "nav-item-inactive text-gray-500 dark:text-zinc-400 hover:text-rose-500"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span className="nav-label text-[11px] mt-0.5">{item.label}</span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5 animate-pulse"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
