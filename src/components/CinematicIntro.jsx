import { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles, Heart } from "lucide-react";
import { getDaysTogether } from "../utils/helpers.js";

// Danh sách các hạt cánh hoa và bụi sao lấp lánh trong không gian chiều sâu
const PETAL_ITEMS = [
  { char: "🌸", x: 8, delay: 0.1, duration: 4.8, size: 22 },
  { char: "✨", x: 18, delay: 1.2, duration: 3.8, size: 16 },
  { char: "💮", x: 28, delay: 0.6, duration: 5.4, size: 20 },
  { char: "💖", x: 38, delay: 2.1, duration: 4.2, size: 18 },
  { char: "🌸", x: 50, delay: 0.3, duration: 5.0, size: 24 },
  { char: "✧", x: 62, delay: 1.6, duration: 3.6, size: 15 },
  { char: "💮", x: 72, delay: 0.8, duration: 5.2, size: 21 },
  { char: "✨", x: 82, delay: 1.9, duration: 4.0, size: 17 },
  { char: "🌸", x: 92, delay: 0.4, duration: 4.6, size: 23 },
  { char: "✦", x: 14, delay: 2.3, duration: 4.4, size: 14 },
  { char: "💕", x: 45, delay: 1.5, duration: 4.9, size: 19 },
  { char: "🌸", x: 78, delay: 2.0, duration: 5.3, size: 22 },
  { char: "✨", x: 88, delay: 0.9, duration: 3.9, size: 16 },
];

export const CinematicIntro = ({
  couple,
  onFinish,
  autoDuration = 2200,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const exitedRef = useRef(false);

  // Xử lý chuyển cảnh mượt mà thoát khỏi intro (Cinematic Exit)
  const triggerExit = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    setIsExiting(true);

    try {
      sessionStorage.setItem("date_where_intro_seen", "1");
    } catch (_) {}

    // Sau khi hiệu ứng bung tỏa ánh sáng và mờ dần (650ms), hoàn tất mở giao diện
    setTimeout(() => {
      onFinish?.();
    }, 650);
  };

  // Tự động chuyển cảnh sau 2.2 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerExit();
    }, autoDuration);

    return () => clearTimeout(timer);
  }, [autoDuration]);

  // Thông tin cá nhân hóa
  const userA = couple?.user1 || couple?.userA;
  const userB = couple?.user2 || couple?.userB;
  const isPaired = Boolean(couple?.isConnected && userA?.name && userB?.name);
  const daysTogether = couple?.startDate ? getDaysTogether(couple.startDate) : 0;

  return (
    <div
      onClick={triggerExit}
      onTouchStart={triggerExit}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer bg-gradient-to-b from-[#fff5f5] via-[#ffe8ec] to-[#ffd6de] transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-110 pointer-events-none filter blur-sm"
          : "opacity-100 scale-100 pointer-events-auto"
      }`}
      aria-label="Chạm để vào app"
    >
      {/* ── Cơn mưa cánh hoa bay & bụi sao lãng mạn ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {PETAL_ITEMS.map((item, idx) => (
          <span
            key={idx}
            className="absolute select-none pointer-events-none opacity-0"
            style={{
              left: `${item.x}%`,
              top: `-30px`,
              fontSize: `${item.size}px`,
              animation: `floatPetal ${item.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${item.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          >
            {item.char}
          </span>
        ))}
      </div>

      {/* ── Vòng hào quang bung tỏa ánh sáng ở trung tâm ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-md w-full">
        {/* Hào quang nền mềm mại */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-rose-400/30 via-pink-300/25 to-rose-200/20 blur-3xl animate-portal-radiance pointer-events-none" />

          {/* ── Hiệu ứng vẽ viền trái tim SVG đôi (Self-drawing Double Heart) ── */}
          <svg
            className="w-28 h-28 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.45)]"
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <linearGradient id="heartIntroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>

            {/* Trái tim bên trái */}
            <path
              d="M30 40 C15 20, 0 45, 30 70 C60 45, 45 20, 30 40 Z"
              stroke="url(#heartIntroGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-heart"
            />

            {/* Trái tim bên phải lồng vào */}
            <path
              d="M70 40 C55 20, 40 45, 70 70 C100 45, 85 20, 70 40 Z"
              stroke="url(#heartIntroGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-heart-delayed"
            />
          </svg>
        </div>

        {/* ── Chữ ánh kim lướt sáng (Rose Gold Shimmer Typography) ── */}
        <div className="space-y-1.5 animate-slide-up">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight shimmer-text leading-tight drop-shadow-xs">
            DateWhere
          </h1>
          <p className="text-xs sm:text-sm font-serif text-rose-800/80 tracking-wide font-medium">
            Kế hoạch hẹn hò của đôi mình
          </p>
        </div>

        {/* ── Dấu ấn cá nhân hóa ── */}
        <div className="mt-5 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {isPaired ? (
            <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-rose-200/90 shadow-romantic text-xs sm:text-sm text-rose-800 font-medium flex items-center justify-center gap-2">
              <span className="font-semibold text-rose-900">
                Chào mừng {userA.name} & {userB.name}
              </span>
              {daysTogether > 0 && (
                <>
                  <span className="text-rose-400">•</span>
                  <span className="text-rose-600 font-bold">
                    Ngày thứ {daysTogether} bên nhau 💕
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-rose-200/90 shadow-romantic text-xs sm:text-sm text-rose-700 font-medium flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Nơi tình yêu tìm thấy chỗ dừng chân ✨</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chỉ dẫn UX: Chạm để vào app ── */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-serif text-rose-500/80 bg-white/50 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-rose-200/50 shadow-xs animate-pulse">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>Chạm nhẹ bất kỳ đâu để vào app</span>
        </span>
      </div>
    </div>
  );
};

export default CinematicIntro;
