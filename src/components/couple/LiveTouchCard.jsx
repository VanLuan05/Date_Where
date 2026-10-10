import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Sparkles } from "lucide-react";
import { generateFloatingHearts } from "../../utils/hapticService.js";

/**
 * LiveTouchCard — Nút nhịp tim Live Heartbeat (giữ để gửi).
 * ─────────────────────────────────────────────────
 * Chat nằm ở tab "Nhắn tin" (ChatScreen full-screen) trên BottomNav,
 * mount ở App root nên card này chỉ giữ nhịp đập + tâm trạng.
 */
const LiveTouchCard = ({
  couple,
  currentUser,
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
}) => {
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const userA = couple?.user1 || couple?.userA || { name: "Bạn" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy" };
  const partnerInfo = isUser1 ? userB : userA;
  const partnerName = partnerInfo?.name || "Người ấy";
  const myRole = isUser1 ? "user1" : "user2";

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [sentFeedback, setSentFeedback] = useState(null);

  const heartBtnRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(0);
  const heartsIntervalRef = useRef(null);

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
      setSentFeedback(`${partnerName} đã nhận nhịp tim ✨`);
      setTimeout(() => setSentFeedback(null), 3000);
    }
    setIsHolding(false);
    setHoldProgress(0);
  }, [isHolding, partnerName]);

  const startHolding = useCallback(
    (e) => {
      setIsHolding(true);
      holdStartTimeRef.current = Date.now();
      setHoldProgress(0);
      onSendHeartbeat?.();
      if (heartBtnRef.current) generateFloatingHearts(heartBtnRef.current, 4);

      const updateInterval = 40;
      const targetDuration = 1200;
      holdIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - holdStartTimeRef.current;
        const pct = Math.min(100, Math.round((elapsed / targetDuration) * 100));
        setHoldProgress(pct);
        if (elapsed % 950 < updateInterval) onSendHeartbeat?.();
      }, updateInterval);

      heartsIntervalRef.current = setInterval(() => {
        if (heartBtnRef.current) generateFloatingHearts(heartBtnRef.current, 2);
      }, 260);
    },
    [onSendHeartbeat]
  );

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (heartsIntervalRef.current) clearInterval(heartsIntervalRef.current);
    };
  }, []);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const lastInteractionTime = liveTouch?.timestamp ? formatTime(liveTouch?.timestamp) : null;
  const isLastFromPartner = liveTouch?.sender
    ? liveTouch?.sender !== myRole
    : false;

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-rose-50/50 to-pink-50/60 border-2 ${
        incomingHeartbeat
          ? "border-rose-400 shadow-[0_0_28px_rgba(244,63,94,0.4)] ring-4 ring-rose-200"
          : "border-rose-100/90 shadow-romantic"
      } p-4 transition-all duration-300`}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-rose-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-pink-200/20 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full border border-rose-200/50">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          Nhịp đập yêu thương
        </span>
        <div className="flex items-center gap-1.5 text-xs text-rose-600/90 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>với {partnerName}</span>
        </div>
      </div>

      {/* Heart button + status row */}
      <div className="flex items-center gap-3 relative z-10 select-none">
        {/* Heart button — compact */}
        <div className="relative flex items-center justify-center w-[80px] h-[80px] shrink-0">
          {incomingHeartbeat && (
            <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-live-glow-ring pointer-events-none" />
          )}
          {isHolding && (
            <div className="absolute -inset-2 rounded-full bg-rose-300/30 animate-live-glow-ring pointer-events-none" />
          )}

          {/* SVG progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(244,63,94,0.15)" strokeWidth="3" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="url(#hpg-card)" strokeWidth="3.5"
              strokeDasharray={213.6}
              strokeDashoffset={213.6 * (1 - holdProgress / 100)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-75 ease-linear"
            />
            <defs>
              <linearGradient id="hpg-card" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>
          </svg>

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
            className={`relative z-10 w-[56px] h-[56px] rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 ${
              isHolding
                ? "animate-heart-breathing scale-110 shadow-[0_0_30px_rgba(244,63,94,0.75)]"
                : incomingHeartbeat
                ? "animate-heart-breathing scale-110 shadow-[0_0_28px_rgba(244,63,94,0.65)]"
                : "hover:scale-105 shadow-[0_6px_18px_rgba(244,63,94,0.32)]"
            } bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white`}
            aria-label="Nhấn giữ để gửi nhịp tim"
          >
            <div className="absolute top-1 left-3 right-3 h-3 bg-white/30 rounded-full blur-[1px] pointer-events-none" />
            <Heart
              className={`w-7 h-7 text-white fill-white transition-all duration-200 ${
                isHolding ? "scale-110" : incomingHeartbeat ? "animate-heart-beat scale-115 fill-rose-100" : "animate-pulse"
              }`}
            />
          </button>
        </div>

        {/* Status text beside button */}
        <div className="flex-1 min-w-0">
          {isHolding ? (
            <p className="text-xs font-bold text-rose-600 animate-pulse flex items-center gap-1">
              <span>💓</span>
              <span>Đang gửi đến {partnerName}...</span>
            </p>
          ) : incomingHeartbeat ? (
            <p className="text-xs font-bold text-rose-600 animate-bounce flex items-center gap-1">
              <span>💓</span>
              <span>{partnerName} đang gửi nhịp tim!</span>
            </p>
          ) : sentFeedback ? (
            <p className="text-xs font-semibold text-rose-700 animate-fade-in flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>{sentFeedback}</span>
            </p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-xs text-stone-600 font-medium leading-snug">
                Nhấn &amp; giữ tim để gửi nhịp đập yêu thương
              </p>
              {lastInteractionTime && (
                <p className="text-[11px] text-stone-400 font-serif">
                  {isLastFromPartner
                    ? `${partnerName} gửi lúc ${lastInteractionTime}`
                    : `Nhịp tim gần nhất lúc ${lastInteractionTime}`}
                </p>
              )}
              <p className="text-[11px] text-rose-400 font-medium">
                💬 Nhắn tin ở tab "Nhắn tin" dưới thanh điều hướng nhé
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTouchCard;
