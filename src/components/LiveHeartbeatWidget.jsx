import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Sparkles, Send, Smile, X } from "lucide-react";
import { generateFloatingHearts, triggerLightTap } from "../utils/hapticService.js";
import { COUPLE_STICKERS, QUICK_EMOJIS } from "../data/stickers.js";

/**
 * LiveHeartbeatWidget — Full-size version (trang chủ Dashboard)
 * Kết hợp nút tim Live Heartbeat + Khung chat mini Messenger style + Kho nhãn dán
 */
export const LiveHeartbeatWidget = ({
  couple,
  currentUser,
  liveTouch,
  incomingHeartbeat,
  onSendHeartbeat,
  onSendMessage,
  messages = [],
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
  const [inputText, setInputText] = useState("");
  const [flyingEmoji, setFlyingEmoji] = useState(null);
  const [flyingPos, setFlyingPos] = useState({ x: 0, y: 0 });
  const [showStickers, setShowStickers] = useState(false);

  const heartBtnRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(0);
  const heartsIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setSentFeedback(`${partnerName} đã nhận được tín hiệu của bạn ✨`);
      setTimeout(() => setSentFeedback(null), 4000);
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

  // Chèn icon emoji trực tiếp vào đoạn văn bản đang soạn thảo
  const handleInsertEmoji = (emojiChar) => {
    triggerLightTap();
    setInputText((prev) => prev + emojiChar);
    inputRef.current?.focus();
  };

  // Gửi nhãn dán sticker cặp đôi nhanh 1 chạm chuẩn Messenger
  const handleSendSticker = (sticker, e) => {
    triggerLightTap();
    const rect = e?.currentTarget?.getBoundingClientRect();
    if (rect) {
      setFlyingPos({ x: rect.left + rect.width / 2, y: rect.top });
      setFlyingEmoji(sticker.emoji);
      setTimeout(() => setFlyingEmoji(null), 900);
    }
    onSendMessage?.(sticker.title, sticker.emoji, true);
    setSentFeedback(`Đã gửi: ${sticker.title}`);
    setTimeout(() => setSentFeedback(null), 2500);
    setShowStickers(false);
  };

  const handleSendText = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed, null, false);
    setInputText("");
    inputRef.current?.focus();
  }, [inputText, onSendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const recentMessages = (messages || []).slice(-12);
  const lastInteractionTime = liveTouch?.timestamp ? formatTime(liveTouch?.timestamp) : null;
  const isLastFromPartner = liveTouch?.sender
    ? liveTouch?.sender !== myRole
    : false;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-rose-50/50 to-pink-50/60 border-2 ${
        incomingHeartbeat
          ? "border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-4 ring-rose-200"
          : "border-rose-100/90 shadow-romantic"
      } p-5 text-stone-800 transition-all duration-300`}
    >
      {/* Nền trang trí */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200/20 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full border border-rose-200/50 backdrop-blur-sm">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          Nhịp đập & Tin nhắn
        </span>
        <div className="flex items-center gap-1.5 text-xs text-rose-600/90 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>với {partnerName}</span>
        </div>
      </div>

      {/* Heart button — large center */}
      <div className="flex flex-col items-center justify-center my-2 select-none relative z-10">
        <div className="relative flex items-center justify-center w-36 h-36">
          {incomingHeartbeat && (
            <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-live-glow-ring pointer-events-none" />
          )}
          {isHolding && (
            <div className="absolute -inset-3 rounded-full bg-rose-300/30 animate-live-glow-ring pointer-events-none" />
          )}

          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(244, 63, 94, 0.15)" strokeWidth="4" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#heart-progress-gradient)" strokeWidth="5"
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

        {/* Status text */}
        <div className="mt-2 text-center min-h-[30px] flex flex-col items-center justify-center">
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
                Nhấn &amp; giữ tim để gửi nhịp đập yêu thương
              </p>
              {lastInteractionTime && (
                <p className="text-[11px] text-stone-400 font-serif">
                  {isLastFromPartner
                    ? `${partnerName} gửi nhịp tim lúc ${lastInteractionTime}`
                    : `Nhịp tim gần nhất lúc ${lastInteractionTime}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MESSENGER CHAT AREA ── */}
      <div className="mt-2 pt-3 border-t border-rose-100/70 relative z-10">
        {/* Reaction Emoji Bar */}
        {/* Dải Emoji chèn vào Text & Nút mở Nhãn dán */}
        <div className="flex items-center justify-between gap-1 mb-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            <span className="text-xs text-stone-400 font-serif shrink-0 mr-0.5">Icon:</span>
            {QUICK_EMOJIS.slice(0, 10).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-8 h-8 rounded-xl hover:bg-rose-100/80 active:scale-90 transition-all flex items-center justify-center text-lg cursor-pointer shrink-0"
                title={`Chèn ${emoji} vào tin nhắn`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowStickers(!showStickers)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              showStickers
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-rose-100/80 hover:bg-rose-200/80 text-rose-700"
            }`}
            title="Mở kho nhãn dán dễ thương"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nhãn dán 💕</span>
          </button>
        </div>

        {/* ── KHO NHÃN DÁN CẶP ĐÔI (COUPLE STICKERS DRAWER) ── */}
        {showStickers && (
          <div className="mb-3 p-2.5 rounded-2xl bg-white/95 border border-rose-200 shadow-romantic animate-scale-up">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-rose-700 font-serif flex items-center gap-1">
                <span>🎁</span>
                <span>Nhãn dán gửi nhanh 1 chạm</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStickers(false)}
                className="text-stone-400 hover:text-rose-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto p-1">
              {COUPLE_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={(e) => handleSendSticker(stk, e)}
                  className="p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100 text-center transition-all hover:scale-105 active:scale-95 border border-rose-100 cursor-pointer flex flex-col items-center gap-1"
                >
                  <span className="text-3xl select-none">{stk.emoji}</span>
                  <span className="text-[10px] font-bold text-stone-700 font-serif truncate w-full">
                    {stk.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Bubbles */}
        {recentMessages.length > 0 && (
          <div
            className="mb-3 max-h-[130px] overflow-y-auto space-y-1.5 pr-1"
            style={{ scrollbarWidth: "none" }}
          >
            {recentMessages.map((msg) => {
              const isMe = msg.sender === myRole;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.isSticker ? (
                    <div
                      className={`p-2.5 rounded-2xl text-left shadow-xs border flex items-center gap-2.5 max-w-[80%] ${
                        isMe
                          ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white border-white/20"
                          : "bg-white/95 text-stone-800 border-rose-200"
                      }`}
                    >
                      <span className="text-3xl select-none animate-bounce-soft shrink-0">{msg.emoji}</span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold font-serif leading-tight">{msg.text}</span>
                        <span className={`text-[8px] uppercase tracking-wider font-semibold ${isMe ? "text-rose-100" : "text-rose-500"}`}>
                          Nhãn dán 💕
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-sm"
                          : "bg-white/90 text-stone-700 border border-rose-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.emoji && <span className="mr-1 text-sm">{msg.emoji}</span>}
                      {msg.text && <span>{msg.text}</span>}
                    </div>
                  )}
                  <span className="text-[9px] text-stone-400 shrink-0 mb-0.5">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-200/70 px-3 py-2 shadow-xs">
          <button
            type="button"
            onClick={() => handleInsertEmoji("💖")}
            className="text-lg text-rose-500 hover:scale-110 active:scale-95 transition-transform cursor-pointer shrink-0"
            title="Chèn trái tim"
          >
            💖
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Nhắn gì đó cho ${partnerName}...`}
            className="flex-1 text-xs bg-transparent outline-none text-stone-700 placeholder:text-stone-400 min-w-0"
          />
          <button
            type="button"
            onClick={handleSendText}
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer shrink-0 shadow-sm"
            aria-label="Gửi tin nhắn"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating emoji animation */}
      {flyingEmoji && (
        <div
          className="fixed pointer-events-none z-[9999] text-4xl animate-bounce"
          style={{ left: flyingPos.x, top: flyingPos.y, transform: "translate(-50%, -100%)" }}
        >
          {flyingEmoji}
        </div>
      )}
    </div>
  );
};

export default LiveHeartbeatWidget;
