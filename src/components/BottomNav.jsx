import { useState, useEffect, useRef } from "react";
import { Home, MapPin, Calendar, BookHeart } from "lucide-react";

/**
 * Floating Bottom Navigation with Facebook-style Hide/Show on Scroll:
 *  - Vuốt màn hình xuống -> Ẩn thanh tab để mở rộng tối đa không gian màn hình
 *  - Kéo màn hình lên -> Hiện thanh tab trở lại ngay lập tức
 *  - Luôn hiện khi ở đầu trang hoặc khi đổi tab
 */
const BottomNav = ({ activeTab, onTabChange }) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const navItems = [
    { id: "dashboard", icon: Home, label: "Đôi mình" },
    { id: "places", icon: MapPin, label: "Địa điểm" },
    { id: "dates", icon: Calendar, label: "Lịch hẹn" },
    { id: "journey", icon: BookHeart, label: "Hành trình" },
  ];

  // Theo dõi cuộn màn hình kiểu Facebook
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = Math.max(0, window.scrollY);
          const diff = currentScrollY - lastScrollY.current;

          // Luôn hiện khi ở đầu trang (dưới 30px)
          if (currentScrollY <= 30) {
            setIsVisible(true);
          } else if (diff > 12) {
            // Đang cuộn xuống -> Ẩn tab đi
            setIsVisible(false);
          } else if (diff < -12) {
            // Đang cuộn lên -> Hiện tab lại
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Khi chuyển tab, luôn cho tab hiện lại
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = Math.max(0, window.scrollY);
  }, [activeTab]);

  const handleChange = (id) => {
    try {
      navigator.vibrate?.(10);
    } catch {}
    onTabChange(id);
  };

  return (
    <nav
      aria-label="Điều hướng chính"
      className={`fixed bottom-0 left-0 right-0 z-50 px-4 pointer-events-none transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-28 opacity-0 pointer-events-none"
      }`}
      style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-md mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-card px-2.5 py-1.5 flex items-center justify-around pointer-events-auto border border-stone-200/80 dark:border-zinc-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative min-h-[44px] min-w-[70px] px-2 py-1.5 rounded-xl transition-all duration-200 flex flex-col items-center justify-center cursor-pointer select-none ${
                isActive
                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                  : "text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "scale-105" : ""
                }`}
              />
              <span className="text-[11px] mt-0.5 tracking-tight leading-none">{item.label}</span>
              {isActive && (
                <span
                  className="w-1 h-1 rounded-full bg-rose-600 dark:bg-rose-400 mt-1"
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
