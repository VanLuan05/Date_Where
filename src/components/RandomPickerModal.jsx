import { useState, useRef } from "react";
import { X, Shuffle, Navigation2, MapPin } from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const RandomPickerModal = ({ isOpen, onClose, places }) => {
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
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    setPicked(null);
    setSpinning(false);
    setSpinText("");
    onClose();
  };

  const cat = picked ? (CATEGORY_CONFIG[picked.category] || CATEGORY_CONFIG.other) : null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-box max-w-sm text-center">
        <div className="modal-header justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-rose-800">🎲 Chưa biết đi đâu?</h2>
            <p className="text-xs text-gray-500 mt-0.5">Để may mắn quyết định cho đôi mình!</p>
          </div>
          <button onClick={handleClose} className="w-9 h-9 rounded-2xl hover:bg-rose-50 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Slot machine display */}
          <div className={`relative mx-auto w-64 h-24 rounded-3xl border-4 flex items-center justify-center overflow-hidden
            ${spinning ? "border-rose-400 bg-rose-50 shadow-glow-rose" : picked ? "border-green-400 bg-green-50" : "border-dashed border-rose-300 bg-white"}`}>
            {spinning ? (
              <div className="text-center px-4">
                <div className="text-rose-500 font-bold text-sm animate-pulse truncate max-w-full">{spinText}</div>
                <div className="flex justify-center gap-1 mt-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                  ))}
                </div>
              </div>
            ) : picked ? (
              <div className="text-center px-4 animate-slide-up">
                <div className="text-2xl mb-1">{cat?.emoji}</div>
                <div className="font-bold text-green-700 text-sm leading-tight">{picked.name}</div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Shuffle className="w-8 h-8 mx-auto mb-1 opacity-40" />
                <p className="text-xs">Nhan nut de quay!</p>
              </div>
            )}
          </div>

          {/* Spin button */}
          {!picked && (
            <button
              id="spin-btn"
              onClick={handleSpin}
              disabled={spinning || places.length === 0}
              className={`mx-auto flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-200
                ${spinning ? "bg-rose-300 cursor-not-allowed" : "bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-glow-rose hover:scale-105 active:scale-95"}`}
            >
              <Shuffle className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
              {spinning ? "Dang quay..." : "Quay ngay!"}
            </button>
          )}

          {/* Result actions */}
          {picked && (
            <div className="space-y-3 animate-slide-up">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-green-700 font-semibold text-lg">{picked.name}</p>
                <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{picked.address}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  id="go-directions-btn"
                  onClick={() => window.open(picked.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(picked.address)}`, "_blank")}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Navigation2 className="w-4 h-4" /> Di thoi!
                </button>
                <button
                  id="spin-again-btn"
                  onClick={() => { setPicked(null); setSpinText(""); }}
                  className="btn-secondary px-4"
                >
                  Quay lai
                </button>
              </div>
            </div>
          )}

          {places.length === 0 && (
            <p className="text-sm text-gray-500">Chua co dia diem nao. Hay them dia diem truoc!</p>
          )}

          <p className="text-xs text-gray-400">Tong cong {places.length} dia diem trong kho</p>
        </div>
      </div>
    </div>
  );
};

export default RandomPickerModal;
