import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Sparkles } from "lucide-react";
import { generateFloatingHearts } from "../../utils/hapticService.js";

/**
 * LiveTouchCard — Nhịp tim chạm yêu thương (Live Heartbeat).
 * Nhấn giữ để gửi nhịp đập tức thì đến đối phương.
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
    () => {
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
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border ${
        incomingHeartbeat
          ? "border-rose-400 shadow-md ring-4 ring-rose-200/60 dark:ring-rose-950/60"
          : "border-stone-200/80 dark:border-zinc-800 shadow-xs"
      } p-4 sm:p-5 transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          Nhịp đập yêu thương
        </span>
        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>với {partnerName}</span>
        </div>
      </div>

      {/* Heart button + status */}
      <div className="flex items-center gap-4 relative z-10 select-none">
        <div className="relative flex items-center justify-center w-[72px] h-[72px] shrink-0">
          {incomingHeartbeat && (
            <div className="absolute inset-0 rounded-full bg-rose-400/25 animate-ping pointer-events-none" />
          )}

          {/* SVG progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(225, 29, 72, 0.12)" strokeWidth="3" />
            <circle
              cx="36" cy="36" r="30" fill="none"
              stroke="#E11D48" strokeWidth="3"
              strokeDasharray={188.5}
              strokeDashoffset={188.5 * (1 - holdProgress / 100)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-75 ease-linear"
            />
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
            className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90 ${
              isHolding
                ? "scale-110 shadow-lg shadow-rose-500/40"
                : incomingHeartbeat
                ? "scale-110 shadow-lg shadow-rose-500/40"
                : "hover:scale-105 shadow-sm"
            } bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-500 text-white`}
            aria-label="Nhấn giữ để gửi nhịp tim"
          >
            <Heart
              className={`w-6 h-6 text-white fill-white transition-all duration-200 ${
                isHolding ? "scale-115" : incomingHeartbeat ? "animate-bounce scale-110" : "animate-pulse"
              }`}
            />
          </button>
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          {isHolding ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse flex items-center gap-1">
              <span>💓</span>
              <span>Đang gửi đến {partnerName}...</span>
            </p>
          ) : incomingHeartbeat ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-bounce flex items-center gap-1">
              <span>💓</span>
              <span>{partnerName} đang gửi nhịp tim!</span>
            </p>
          ) : sentFeedback ? (
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{sentFeedback}</span>
            </p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-snug">
                Nhấn &amp; giữ để gửi nhịp tim yêu thương
              </p>
              {lastInteractionTime && (
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  {isLastFromPartner
                    ? `${partnerName} đã chạm lúc ${lastInteractionTime}`
                    : `Nhịp tim gần nhất lúc ${lastInteractionTime}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTouchCard;
