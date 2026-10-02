import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Sparkles, Send } from "lucide-react";
import { generateFloatingHearts, triggerLightTap } from "../utils/hapticService.js";

const QUICK_MOODS = [
  {
    icon: "🥺",
    text: "Hôm nay mệt xíu, cần nạp năng lượng",
    shortLabel: "Cần nạp năng lượng",
  },
  {
    icon: "🧋",
    text: "Đang thèm ăn gì đó ngọt ngọt",
    shortLabel: "Thèm đồ ngọt ngọt",
  },
  {
    icon: "💖",
    text: "Nhớ bạn nhiều lắm",
    shortLabel: "Nhớ bạn nhiều lắm",
  },
];

export const LiveHeartbeatWidget = ({
  couple,
  currentUser,
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
  onSendQuickMood,
}) => {
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const userA = couple?.user1 || couple?.userA || { name: "Bạn" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy" };
  const partnerInfo = isUser1 ? userB : userA;
  const partnerName = partnerInfo?.name || "Người ấy";

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [sentFeedback, setSentFeedback] = useState(null);
  const [activeMoodIdx, setActiveMoodIdx] = useState(null);

  const heartBtnRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(0);
  const heartsIntervalRef = useRef(null);

  // Dừng giữ nhịp tim an toàn
  const stopHolding = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (heartsIntervalRef.current) {
      clearInterval(heartsIntervalRef.current);
      heartsIntervalRef.current = null;
    }

    const holdDuration = Date.now() - holdStartTimeRef.current;
    if (isHolding && holdDuration > 300) {
      // Đã gửi thành công nhịp tim
      setSentFeedback(`${partnerName} đã nhận được tín hiệu của bạn ✨`);
      setTimeout(() => {
        setSentFeedback(null);
      }, 4000);
    }

    setIsHolding(false);
    setHoldProgress(0);
  }, [isHolding, partnerName]);

  // Bắt đầu giữ nhịp tim (Long-press)
  const startHolding = useCallback(
    (e) => {
      // Ngăn chặn context menu hoặc hành vi kéo chuột mặc định
      if (e && e.cancelable && e.type === "touchstart") {
        // Cho phép cảm ứng mượt mà
      }

      setIsHolding(true);
      holdStartTimeRef.current = Date.now();
      setHoldProgress(0);

      // Gửi nhịp đầu tiên ngay lập tức
      onSendHeartbeat?.();

      // Bắn bong bóng tim đầu tiên
      if (heartBtnRef.current) {
        generateFloatingHearts(heartBtnRef.current, 4);
      }

      // Vòng lặp cập nhật thanh tiến độ viền tròn
      const updateInterval = 40;
      const targetDuration = 1200; // 1.2 giây để đạt 100%
      holdIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - holdStartTimeRef.current;
        const pct = Math.min(100, Math.round((elapsed / targetDuration) * 100));
        setHoldProgress(pct);

        // Chu kỳ gửi thêm nhịp tim nếu tiếp tục giữ
        if (elapsed % 950 < updateInterval) {
          onSendHeartbeat?.();
        }
      }, updateInterval);

      // Sinh bong bóng tim liên tục theo nhịp thở khi đang nhấn giữ
      heartsIntervalRef.current = setInterval(() => {
        if (heartBtnRef.current) {
          generateFloatingHearts(heartBtnRef.current, 2);
        }
      }, 260);
    },
    [onSendHeartbeat]
  );

  // Dọn dẹp interval khi unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (heartsIntervalRef.current) clearInterval(heartsIntervalRef.current);
    };
  }, []);

  // Xử lý gửi trạng thái tâm trạng nhanh
  const handleMoodClick = (mood, index, e) => {
    triggerLightTap();
    setActiveMoodIdx(index);
    if (e?.currentTarget) {
      generateFloatingHearts(e.currentTarget, 4);
    }
    onSendQuickMood?.(mood.text, mood.icon);

    setSentFeedback(`Đã gửi: ${mood.icon} "${mood.shortLabel}"`);
    setTimeout(() => {
      setActiveMoodIdx(null);
    }, 450);
    setTimeout(() => {
      setSentFeedback(null);
    }, 3500);
  };

  // Tính toán thời gian tương tác gần nhất
  const formatTime = (ts) => {
    if (!ts) return null;
    const d = new Date(ts);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const lastInteractionTime = liveTouch?.timestamp ? formatTime(liveTouch.timestamp) : null;
  const isLastFromPartner = liveTouch?.sender && liveTouch.sender !== (isUser1 ? "user1" : "user2");

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-rose-50/50 to-pink-50/60 border-2 ${
        incomingHeartbeat
          ? "border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-4 ring-rose-200"
          : "border-rose-100/90 shadow-romantic"
      } p-5 text-stone-800 transition-all duration-300`}
    >
      {/* Nền trang trí hạt ánh sáng */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200/20 rounded-full blur-xl pointer-events-none" />

      {/* Header Widget */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full border border-rose-200/50 backdrop-blur-sm">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            Nhịp đập tức thì & Live Touch
          </span>
        </div>

        {/* Trạng thái kết nối với người ấy */}
        <div className="flex items-center gap-1.5 text-xs text-rose-600/90 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>với {partnerName}</span>
        </div>
      </div>

      {/* ── The Pulse Core: Trái tim tương tác lớn ── */}
      <div className="flex flex-col items-center justify-center my-3 select-none">
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Hào quang khi đối phương đang truyền nhịp tim đến */}
          {incomingHeartbeat && (
            <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-live-glow-ring pointer-events-none" />
          )}

          {/* Vòng hào quang khi đang nhấn giữ */}
          {isHolding && (
            <div className="absolute -inset-3 rounded-full bg-rose-300/30 animate-live-glow-ring pointer-events-none" />
          )}

          {/* Vòng tiến độ SVG xoay tròn bao quanh quả tim */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm"
            viewBox="0 0 120 120"
          >
            {/* Vòng nền mờ */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(244, 63, 94, 0.15)"
              strokeWidth="4"
            />
            {/* Vòng tiến độ thực tế */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#heart-progress-gradient)"
              strokeWidth="5"
              strokeDasharray={326.7}
              strokeDashoffset={326.7 * (1 - holdProgress / 100)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-75 ease-linear"
            />
            <defs>
              <linearGradient id="heart-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>
          </svg>

          {/* Nút quả tim 3D Gradient tương tác */}
          <button
            ref={heartBtnRef}
            type="button"
            id="live-heartbeat-btn"
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            onTouchCancel={stopHolding}
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 ${
              isHolding
                ? "animate-heart-breathing scale-110 shadow-[0_0_40px_rgba(244,63,94,0.8)]"
                : incomingHeartbeat
                ? "animate-heart-breathing scale-110 shadow-[0_0_35px_rgba(244,63,94,0.7)]"
                : "hover:scale-105 shadow-[0_8px_25px_rgba(244,63,94,0.35)]"
            } bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white`}
            aria-label="Nhấn giữ để gửi nhịp tim"
          >
            {/* Lớp bóng gương bóng bẩy */}
            <div className="absolute top-1.5 left-4 right-4 h-5 bg-white/30 rounded-full blur-[1px] pointer-events-none" />

            <Heart
              className={`w-12 h-12 text-white fill-white transition-all duration-200 ${
                isHolding
                  ? "scale-110"
                  : incomingHeartbeat
                  ? "animate-heart-beat scale-115 fill-rose-100"
                  : "animate-pulse"
              }`}
            />
          </button>
        </div>

        {/* Thông báo tương tác dưới quả tim */}
        <div className="mt-3 text-center min-h-[38px] flex flex-col items-center justify-center">
          {isHolding ? (
            <p className="text-xs font-bold text-rose-600 animate-pulse flex items-center gap-1.5">
              <span>💓</span>
              <span>Đang gửi nhịp tim đến {partnerName}...</span>
            </p>
          ) : incomingHeartbeat ? (
            <p className="text-xs font-bold text-rose-600 animate-bounce flex items-center gap-1.5">
              <span>💓</span>
              <span>{partnerName} đang gửi nhịp tim đến bạn!</span>
            </p>
          ) : sentFeedback ? (
            <p className="text-xs font-semibold text-rose-700 animate-fade-in flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{sentFeedback}</span>
            </p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-xs text-stone-600 font-medium">
                Nhấn & giữ tim để gửi nhịp đập yêu thương
              </p>
              {lastInteractionTime && (
                <p className="text-[11px] text-stone-400 font-serif">
                  {isLastFromPartner
                    ? `${partnerName} đã gửi nhịp tim lúc ${lastInteractionTime}`
                    : `Nhịp tim gần nhất lúc ${lastInteractionTime}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Mood Bar: Dải nút thả cảm xúc 1 chạm ── */}
      <div className="mt-3 pt-3 border-t border-rose-100/70">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-rose-700/80 uppercase tracking-wider font-serif">
            Tâm trạng nhanh 1-chạm
          </span>
          <span className="text-[10px] text-stone-400 font-serif">Gửi tức thì</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUICK_MOODS.map((mood, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleMoodClick(mood, idx, e)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activeMoodIdx === idx
                  ? "animate-mood-pop bg-rose-500 text-white border-rose-500 shadow-md"
                  : "bg-white/80 hover:bg-rose-50/90 text-stone-700 border-rose-200/70 hover:border-rose-300 shadow-xs hover:shadow-sm"
              }`}
            >
              <span className="text-base group-hover:scale-125 transition-transform duration-200 shrink-0">
                {mood.icon}
              </span>
              <span className="text-xs font-serif leading-tight font-medium line-clamp-2">
                {mood.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveHeartbeatWidget;
