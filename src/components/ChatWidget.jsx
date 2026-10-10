import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Minus } from "lucide-react";
import { triggerLightTap } from "../utils/hapticService.js";
import { COUPLE_STICKERS, QUICK_EMOJIS } from "../data/stickers.js";

/**
 * ChatWidget — Tiện ích chat Messenger nổi, ngang hàng với các menu khác.
 * ─────────────────────────────────────────────────
 * - Mount 1 lần duy nhất ở App.jsx root (ngang cấp Header/BottomNav).
 * - Hiển thị ở mọi tab (dashboard/places/dates), không phụ thuộc Dashboard.
 * - FAB góc phải dưới (nằm trên BottomNav) + badge tin chưa đọc.
 * - Panel responsive: mobile = bottom-sheet, desktop = popup 360-380px.
 */
const ChatWidget = ({
  couple,
  currentUser,
  messages = [],
  onSendMessage,
}) => {
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const userA = couple?.user1 || couple?.userA || { name: "Bạn", avatar: "" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy", avatar: "" };
  const partnerInfo = isUser1 ? userB : userA;
  const myInfo = isUser1 ? userA : userB;
  const partnerName = partnerInfo?.name || "Người ấy";
  const myRole = isUser1 ? "user1" : "user2";

  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [inputText, setInputText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const lastSeenRef = useRef(null);
  const initializedRef = useRef(false);

  // ── Unread badge: khởi tạo mốc đã xem, sau đó đếm tin đối phương khi widget đóng ──
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!initializedRef.current) {
      lastSeenRef.current = last.id;
      initializedRef.current = true;
      return;
    }
    if (isOpen) {
      lastSeenRef.current = last.id;
      setUnread(0);
    } else if (last.sender !== myRole && last.id !== lastSeenRef.current) {
      const seenId = lastSeenRef.current ?? 0;
      const count = messages.filter(
        (m) => m.id > seenId && m.sender !== myRole
      ).length;
      setUnread(count);
    }
  }, [messages, isOpen, myRole]);

  // ── Auto-scroll khi mở panel hoặc có tin mới ──
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // ── Focus input khi mở ──
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, isMinimized]);

  // ── Esc để đóng ──
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    triggerLightTap();
    setIsOpen((prev) => {
      if (!prev) {
        // Chuẩn bị mở: reset badge, bỏ minimize
        setUnread(0);
        setIsMinimized(false);
        if (messages && messages.length > 0) {
          lastSeenRef.current = messages[messages.length - 1].id;
        }
      }
      return !prev;
    });
  }, [messages]);

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

  const handleInsertEmoji = (emojiChar) => {
    triggerLightTap();
    setInputText((prev) => prev + emojiChar);
    inputRef.current?.focus();
  };

  const handleSendSticker = (sticker) => {
    triggerLightTap();
    onSendMessage?.(sticker.title, sticker.emoji, true);
    setShowStickers(false);
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatDay = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      const today = new Date();
      const sameDay =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      if (sameDay) return "Hôm nay";
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* ── Chat panel (Messenger popup) ── */}
      {isOpen && !isMinimized && (
        <div
          id="chat-widget-panel"
          role="dialog"
          aria-label={`Chat với ${partnerName}`}
          className="fixed z-[60] inset-x-3 bottom-[86px] h-[62vh]
                     sm:inset-x-auto sm:right-4 sm:bottom-24 sm:w-[372px] sm:h-[540px] sm:max-h-[72vh]
                     flex flex-col overflow-hidden rounded-[24px] bg-white/95 backdrop-blur-md
                     border-2 border-rose-100 shadow-[0_20px_60px_-12px_rgba(244,63,94,0.35)]
                     animate-slide-up"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white shrink-0">
            <div className="relative shrink-0">
              <img
                src={
                  partnerInfo?.avatar ||
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                }
                alt={partnerName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/70 bg-white/20"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"
                title="Đang hoạt động"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold leading-tight truncate">{partnerName}</p>
              <p className="text-[11px] text-white/85 leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Đang hoạt động
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
              title="Thu nhỏ"
              aria-label="Thu nhỏ cửa sổ chat"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
              title="Đóng chat"
              aria-label="Đóng cửa sổ chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick emoji strip */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-rose-100/70 bg-rose-50/50 shrink-0">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 py-0.5">
              {QUICK_EMOJIS.slice(0, 10).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="w-7 h-7 rounded-lg hover:bg-white active:scale-90 transition-all flex items-center justify-center text-base cursor-pointer shrink-0"
                  title={`Chèn ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowStickers((v) => !v)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                showStickers
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-white hover:bg-rose-100 text-rose-700 border border-rose-200"
              }`}
              title="Mở kho nhãn dán"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">Dán</span>
            </button>
          </div>

          {/* Sticker drawer */}
          {showStickers && (
            <div className="px-3 pt-2 shrink-0">
              <div className="p-2 rounded-2xl bg-rose-50/80 border border-rose-200 animate-fade-in">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[11px] font-bold text-rose-700">
                    🎁 Nhãn dán gửi nhanh 1 chạm
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStickers(false)}
                    className="text-stone-400 hover:text-rose-500 cursor-pointer"
                    aria-label="Đóng kho nhãn dán"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-[132px] overflow-y-auto p-0.5">
                  {COUPLE_STICKERS.map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      onClick={() => handleSendSticker(stk)}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-100 text-center transition-all hover:scale-105 active:scale-95 border border-rose-100 cursor-pointer flex flex-col items-center gap-0.5"
                    >
                      <span className="text-2xl select-none">{stk.emoji}</span>
                      <span className="text-[10px] font-bold text-stone-700 truncate w-full">
                        {stk.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gradient-to-b from-white to-rose-50/40"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-8">
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-rose-400" />
                </div>
                <p className="text-sm font-bold text-stone-600">
                  Bắt đầu trò chuyện với {partnerName} 💕
                </p>
                <p className="text-xs text-stone-400 max-w-[220px]">
                  Gửi lời nhắn yêu thương đầu tiên — đồng bộ realtime trên cả 2 máy.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === myRole;
                const avatar = isMe
                  ? myInfo?.avatar
                  : partnerInfo?.avatar;
                const name = isMe ? "Bạn" : partnerName;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <img
                      src={
                        avatar ||
                        (isMe
                          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                          : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150")
                      }
                      alt={name}
                      title={name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-rose-200 shrink-0 bg-rose-50"
                    />
                    {msg.isSticker ? (
                      <div
                        className={`p-2 rounded-2xl text-left shadow-xs border flex items-center gap-2 max-w-[78%] ${
                          isMe
                            ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white border-white/20 rounded-br-sm"
                            : "bg-white text-stone-800 border-rose-200 rounded-bl-sm"
                        }`}
                      >
                        <span className="text-2xl select-none shrink-0">{msg.emoji}</span>
                        <div className="min-w-0">
                          <span className="block text-[11px] font-bold leading-tight">
                            {msg.text}
                          </span>
                          <span
                            className={`text-[8px] uppercase tracking-wider font-semibold ${
                              isMe ? "text-rose-100" : "text-rose-500"
                            }`}
                          >
                            Nhãn dán 💕 · {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col max-w-[78%] gap-0.5">
                        <div
                          className={`px-3 py-1.5 rounded-2xl text-[13px] leading-relaxed shadow-xs break-words ${
                            isMe
                              ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-sm"
                              : "bg-white text-stone-700 border border-rose-100 rounded-bl-sm"
                          }`}
                        >
                          {msg.emoji && <span className="mr-1">{msg.emoji}</span>}
                          {msg.text && <span>{msg.text}</span>}
                        </div>
                        <span
                          className={`text-[9px] text-stone-400 px-1 ${
                            isMe ? "text-right" : "text-left"
                          }`}
                        >
                          {formatDay(msg.createdAt)} · {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-2.5 border-t border-rose-100 bg-white shrink-0">
            <div className="flex items-center gap-2 bg-rose-50/70 rounded-2xl border border-rose-200/70 px-3 py-1.5">
              <button
                type="button"
                onClick={() => handleInsertEmoji("💖")}
                className="text-base hover:scale-110 active:scale-95 transition-transform cursor-pointer shrink-0"
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
                className="flex-1 text-[13px] bg-transparent outline-none text-stone-700 placeholder:text-stone-400 min-w-0"
                aria-label="Soạn tin nhắn"
              />
              <button
                type="button"
                onClick={handleSendText}
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 hover:shadow-romantic cursor-pointer shrink-0 shadow-sm"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Minimized pill (khi thu nhỏ) ── */}
      {isOpen && isMinimized && (
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false);
            setUnread(0);
            if (messages && messages.length > 0) {
              lastSeenRef.current = messages[messages.length - 1].id;
            }
          }}
          className="fixed z-[60] right-4 bottom-[86px] sm:bottom-24 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white border-2 border-rose-200 shadow-romantic hover:shadow-card-hover active:scale-95 transition-all cursor-pointer animate-slide-up"
        >
          <img
            src={
              partnerInfo?.avatar ||
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            }
            alt={partnerName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-200"
          />
          <span className="text-xs font-bold text-rose-700 max-w-[120px] truncate">
            {partnerName}
          </span>
          {unread > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* ── FAB kiểu Messenger (luôn nổi trên mọi tab, nằm trên BottomNav) ── */}
      <button
        type="button"
        id="chat-widget-fab"
        onClick={isOpen && isMinimized ? () => setIsMinimized(false) : handleToggle}
        className={`fixed z-40 right-4 bottom-[86px] sm:bottom-24 w-14 h-14 rounded-full flex items-center justify-center
                    bg-gradient-to-br from-rose-500 to-pink-500 text-white
                    shadow-romantic hover:shadow-card-hover hover:scale-105 active:scale-95
                    transition-all duration-200 cursor-pointer
                    ${isOpen && !isMinimized ? "rotate-90 scale-95" : "animate-bounce-soft"}`}
        title={isOpen ? "Đóng chat" : `Chat với ${partnerName}`}
        aria-label={isOpen ? "Đóng cửa sổ chat" : "Mở cửa sổ chat"}
      >
        {isOpen && !isMinimized ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 fill-white/20" />
        )}
        {unread > 0 && (!isOpen || isMinimized) && (
          <span className="absolute -top-1 -left-1 min-w-[22px] h-[22px] px-1.5 bg-white text-rose-600 border-2 border-rose-500 rounded-full text-[11px] font-bold flex items-center justify-center animate-pulse shadow-xs">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
};

export default ChatWidget;
