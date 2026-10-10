import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Send } from "lucide-react";
import EmptyState from "./EmptyState.jsx";

/**
 * ChatScreen — Màn hình chat full-screen kiểu Messenger thật.
 * ─────────────────────────────────────────────────
 * - Header: nút back `<` góc trái trên cùng + avatar + tên đối phương + trạng thái online.
 * - Vùng tin nhắn full-height, bubble phân biệt mình/đối phương + timestamp.
 * - Input dưới cùng chỉ còn text + nút gửi (Send), Enter để gửi.
 * - Không emoji picker, không sticker, không nút icon thừa.
 * - Tương thích ngược: tin nhắn sticker/emoji cũ vẫn hiển thị text + emoji.
 */
const ChatScreen = ({
  couple,
  currentUser,
  messages = [],
  onSendMessage,
  onBack,
}) => {
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const userA = couple?.user1 || couple?.userA || { name: "Bạn", avatar: "" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy", avatar: "" };
  const partnerInfo = isUser1 ? userB : userA;
  const myInfo = isUser1 ? userA : userB;
  const partnerName = partnerInfo?.name || "Người ấy";
  const myRole = isUser1 ? "user1" : "user2";

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll khi có tin mới ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input khi mở ──
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  // ── Nút Esc cũng thoát chat (tiện cho desktop) ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onBack?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const handleSendText = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
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
    <div
      id="chat-screen"
      role="dialog"
      aria-label={`Đoạn chat với ${partnerName}`}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 sm:max-w-2xl sm:mx-auto sm:shadow-2xl sm:border-x sm:border-rose-100 dark:sm:border-white/10"
    >
      {/* ── Header kiểu Messenger: back `<` + avatar + tên + online ── */}
      <div className="flex items-center gap-2 px-2 py-2.5 bg-white dark:bg-zinc-950 border-b border-rose-100 dark:border-white/10 shadow-sm shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400"
          title="Quay lại"
          aria-label="Quay lại (thoát đoạn chat)"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="relative shrink-0">
          <img
            src={
              partnerInfo?.avatar ||
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            }
            alt={partnerName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-200 bg-rose-50"
          />
          <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"
            title="Đang hoạt động"
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[15px] font-bold leading-tight truncate text-stone-900 dark:text-zinc-100">
            {partnerName}
          </p>
          <p className="text-xs text-emerald-600 leading-tight flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </p>
        </div>
      </div>

      {/* ── Vùng tin nhắn full-height ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gradient-to-b from-white to-rose-50/40 dark:from-zinc-950 dark:to-rose-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-8">
            <EmptyState
              illustration="💌"
              title={`Bắt đầu trò chuyện với ${partnerName}`}
              desc="Gửi lời nhắn yêu thương đầu tiên — đồng bộ realtime trên cả 2 máy."
              actionLabel="Gửi lời nhắn đầu tiên 💕"
              onAction={() => inputRef.current?.focus()}
            />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === myRole;
            const avatar = isMe ? myInfo?.avatar : partnerInfo?.avatar;
            const name = isMe ? "Bạn" : partnerName;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isMe && (
                  <img
                    src={
                      avatar ||
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                    }
                    alt={name}
                    title={name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-rose-200 shrink-0 bg-rose-50"
                  />
                )}
                <div className={`flex flex-col gap-0.5 max-w-[78%] ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-[14px] leading-relaxed shadow-xs break-words ${
                      isMe
                        ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-sm"
                        : "bg-stone-100 text-stone-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.emoji && <span className="mr-1">{msg.emoji}</span>}
                    {msg.text && <span>{msg.text}</span>}
                  </div>
                  <span className="text-[10px] text-stone-400 px-1">
                    {formatDay(msg.createdAt)} · {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input dưới cùng: chỉ text + nút gửi ── */}
      <div className="p-2.5 border-t border-rose-100 dark:border-white/10 bg-white dark:bg-zinc-950 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-zinc-800 rounded-full pl-4 pr-1.5 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Nhắn tin cho ${partnerName}...`}
            className="flex-1 text-sm bg-transparent outline-none text-stone-800 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-400 min-w-0 focus-visible:ring-2 focus-visible:ring-rose-400 rounded-full"
            aria-label="Soạn tin nhắn"
            maxLength={1000}
          />
          <button
            type="button"
            onClick={handleSendText}
            disabled={!inputText.trim()}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 hover:shadow-romantic cursor-pointer shrink-0 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="Gửi tin nhắn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
