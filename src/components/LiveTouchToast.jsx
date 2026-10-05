import { useState, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { generateFloatingHearts, triggerLightTap } from "../utils/hapticService.js";

export const LiveTouchToast = ({
  liveTouch,
  incomingMood,
  incomingHeartbeat,
  couple,
  currentUser,
  onDismissMood,
  onReplyMood,
}) => {
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const userA = couple?.user1 || couple?.userA || { name: "Bạn", avatar: "" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy", avatar: "" };
  const partnerInfo = isUser1 ? userB : userA;
  const partnerName = partnerInfo?.name || "Người ấy";

  // Quản lý hiển thị nhịp tim tự động đóng sau 4 giây (không bị kẹt trên màn hình)
  const [activeHeartbeat, setActiveHeartbeat] = useState(null);

  useEffect(() => {
    if (incomingHeartbeat && incomingHeartbeat.active) {
      setActiveHeartbeat(incomingHeartbeat);
      const timer = setTimeout(() => {
        setActiveHeartbeat(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [incomingHeartbeat]);

  // Tự động đóng toast tâm trạng sau 9 giây nếu người dùng không tương tác
  useEffect(() => {
    if (!incomingMood) return;

    const timer = setTimeout(() => {
      onDismissMood?.();
    }, 9000);

    return () => clearTimeout(timer);
  }, [incomingMood, onDismissMood]);

  const handleReply = (text, icon, e) => {
    triggerLightTap();
    if (e?.currentTarget) {
      generateFloatingHearts(e.currentTarget, 5);
    }
    onReplyMood?.(text, icon);
    onDismissMood?.();
  };

  return (
    <>
      {/* ── Thông báo nhận nhịp tim thời gian thực (Tự động biến mất sau 4 giây) ── */}
      {activeHeartbeat && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm animate-slide-down">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white px-4 py-2.5 rounded-full shadow-[0_4px_25px_rgba(244,63,94,0.5)] flex items-center justify-between gap-2 border border-white/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Heart className="w-5 h-5 text-white fill-white animate-heart-beat shrink-0" />
              <span className="text-xs font-bold font-serif truncate">
                {partnerName} vừa gửi nhịp tim đến bạn! 💕
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveHeartbeat(null)}
              className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors cursor-pointer text-white/80 hover:text-white"
              aria-label="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Lãng mạn: Nhận trạng thái tâm trạng nhanh (Quick Mood) ── */}
      {incomingMood && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9998] w-[92%] max-w-md animate-slide-down">
          <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border-2 border-rose-200 shadow-[0_12px_35px_rgba(244,63,94,0.3)] p-4 text-stone-800">
            {/* Lớp nền hồng nhẹ */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-100/50 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start gap-3 relative z-10">
              {/* Avatar người gửi với hiệu ứng ping */}
              <div className="relative shrink-0 mt-0.5">
                <img
                  src={partnerInfo?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={partnerName}
                  className="w-10 h-10 rounded-full ring-2 ring-rose-400 object-cover bg-rose-100"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white">
                  💖
                </span>
              </div>

              {/* Nội dung lời nhắn */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-700 font-serif">
                    {partnerName} vừa gửi lời nhắn:
                  </h4>
                  <button
                    type="button"
                    onClick={onDismissMood}
                    className="w-6 h-6 rounded-full hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Đóng"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bong bóng tâm trạng */}
                <div className="mt-1.5 p-2.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100/80 flex items-center gap-2">
                  <span className="text-2xl shrink-0 animate-bounce-soft">
                    {incomingMood?.moodIcon}
                  </span>
                  <p className="text-xs font-serif font-medium text-stone-800 leading-snug">
                    {incomingMood?.moodText}
                  </p>
                </div>

                {/* Các nút phản hồi nhanh */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 font-serif shrink-0">
                    Phản hồi nhanh:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleReply("Gửi cái ôm ấm áp 🫂", "🫂", e)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-serif font-medium px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <span>Gửi cái ôm ấm áp</span>
                      <span>🫂</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleReply("Thương thương bạn 💕", "💕", e)}
                      className="bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 hover:border-pink-300 font-serif font-medium px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <span>Thương thương</span>
                      <span>💕</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveTouchToast;
