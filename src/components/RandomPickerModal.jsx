import { useState, useRef } from "react";
import { X, Shuffle, CalendarPlus, Store } from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const RandomPickerModal = ({ isOpen, onClose, places = [], onSchedulePlace }) => {
  const [picked, setPicked] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinText, setSpinText] = useState("");
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning || places.length === 0) return;
    setSpinning(true);
    setPicked(null);
    let count = 0;
    const maxCount = 20 + Math.floor(Math.random() * 15);

    intervalRef.current = setInterval(() => {
      const rand = places[Math.floor(Math.random() * places.length)];
      setSpinText(rand.name);
      count++;
      if (count >= maxCount) {
        clearInterval(intervalRef.current);
        const final = places[Math.floor(Math.random() * places.length)];
        setSpinText(final.name);
        timeoutRef.current = setTimeout(() => {
          setPicked(final);
          setSpinning(false);
        }, 400);
      }
    }, 80);
  };

  const handleClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPicked(null);
    setSpinning(false);
    setSpinText("");
    onClose();
  };

  const handleSchedule = () => {
    if (!picked) return;
    onSchedulePlace?.(picked);
    handleClose();
  };

  const cat = picked ? (CATEGORY_CONFIG[picked.category] || CATEGORY_CONFIG.other) : null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal-box max-w-sm text-center">
        <div className="modal-header justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-rose-800 dark:text-rose-300">
              🎲 Hôm nay đi đâu?
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Để may mắn quyết định cho đôi mình!
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-2xl hover:bg-rose-50 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Slot machine display */}
          <div
            className={`relative mx-auto w-full max-w-xs h-28 rounded-3xl border-4 flex items-center justify-center overflow-hidden transition-all duration-300 ${
              spinning
                ? "border-rose-400 bg-rose-50/90 shadow-glow-rose"
                : picked
                ? "border-emerald-400 bg-emerald-50/90"
                : "border-dashed border-rose-300 bg-white/70"
            }`}
          >
            {spinning ? (
              <div className="text-center px-4">
                <div className="text-rose-600 font-bold text-base animate-pulse truncate max-w-full">
                  {spinText}
                </div>
                <div className="flex justify-center gap-1.5 mt-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : picked ? (
              <div className="text-center px-4 animate-slide-up">
                <div className="text-3xl mb-1">{cat?.emoji || "✨"}</div>
                <div className="font-bold text-emerald-800 text-base leading-tight">
                  {picked.name}
                </div>
              </div>
            ) : places.length === 0 ? (
              <div className="text-center text-gray-400 px-4">
                <Shuffle className="w-8 h-8 mx-auto mb-1 opacity-40 text-rose-400" />
                <p className="text-xs text-rose-600 font-medium font-serif">
                  Kho chưa có địa điểm nào
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-serif">
                  Hãy thêm quán để quay ngẫu nhiên nhé 💕
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Shuffle className="w-8 h-8 mx-auto mb-1 opacity-50 text-rose-500 animate-pulse" />
                <p className="text-xs font-medium text-gray-600">Nhấn nút bên dưới để quay!</p>
              </div>
            )}
          </div>

          {/* Spin button */}
          {!picked && (
            <button
              id="spin-btn"
              onClick={handleSpin}
              disabled={spinning || places.length === 0}
              className={`mx-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white text-base transition-all duration-200 cursor-pointer ${
                spinning || places.length === 0
                  ? "bg-rose-300 cursor-not-allowed opacity-75"
                  : "bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-romantic hover:scale-105 active:scale-95 shadow-md"
              }`}
            >
              <Shuffle className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
              {spinning ? "Đang quay..." : places.length === 0 ? "Kho đang trống" : "Quay ngay! ✨"}
            </button>
          )}

          {/* Result actions */}
          {picked && (
            <div className="space-y-3 animate-slide-up">
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-left">
                <p className="text-emerald-800 font-bold text-base">{picked.name}</p>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-700 text-xs">
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{picked.address}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  id="schedule-picked-place-btn"
                  onClick={handleSchedule}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" /> Lên lịch hẹn quán này!
                </button>
                <button
                  id="spin-again-btn"
                  onClick={() => {
                    setPicked(null);
                    setSpinText("");
                  }}
                  className="btn-secondary px-4 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  Quay lại 🎲
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Tổng cộng <strong>{places.length}</strong> địa điểm trong kho
          </p>
        </div>
      </div>
    </div>
  );
};

export default RandomPickerModal;
