import { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, Music4, VolumeX } from "lucide-react";
import { formatDate } from "../utils/helpers.js";
import { useEscapeClose } from "../hooks/useModalDismiss.js";

/**
 * YearRecapModal (Cụm 6)
 * Slideshow 9:16 auto-slide từ data có sẵn (dates completed + recap.photos),
 * nhạc Web Audio đơn giản (oscillator waltz, không cần file).
 */
const MELODY = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.0];

const useWaltzMusic = (playing) => {
  const ctxRef = useRef(null);
  const timerRef = useRef(null);
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      try { ctxRef.current?.close?.(); } catch {}
      ctxRef.current = null;
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      ctxRef.current = ctx;
      let step = 0;
      const playNote = (freq, t, dur = 0.5) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      };
      timerRef.current = setInterval(() => {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const t = ctx.currentTime;
        playNote(MELODY[step % MELODY.length], t);
        playNote(MELODY[step % MELODY.length] / 2, t, 0.6);
        step += 1;
      }, 600);
    } catch {}
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      try { ctxRef.current?.close?.(); } catch {}
      ctxRef.current = null;
    };
  }, [playing]);
};

const YearRecapModal = ({ isOpen, onClose, dates = [], couple }) => {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [music, setMusic] = useState(false);

  const slides = useMemo(() => {
    const done = (dates || [])
      .filter((d) => d && d.status === "completed")
      .sort((a, b) => new Date(a.recap?.completedAt || a.date || 0) - new Date(b.recap?.completedAt || b.date || 0));
    const yearAgo = Date.now() - 365 * 86400000;
    const inYear = done.filter((d) => {
      const t = new Date(d.recap?.completedAt || d.date || 0).getTime();
      return !isNaN(t) && t >= yearAgo;
    });
    const list = (inYear.length > 0 ? inYear : done).slice(-12);
    return list.map((d) => ({
      id: d.id,
      photo: d.recap?.photos?.[0] || null,
      place: d.placeName || "Buổi hẹn bí mật",
      date: formatDate(d.date),
      quote: d.recap?.bestMoment || d.notes || "Mỗi khoảnh khắc bên nhau đều đáng nhớ 💕",
      rating: d.recap?.rating || 5,
    }));
  }, [dates]);

  useEffect(() => {
    if (!isOpen) {
      setIdx(0);
      setAuto(true);
      setMusic(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !auto || slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [isOpen, auto, slides.length]);

  useWaltzMusic(isOpen && music);
  useEscapeClose(onClose, isOpen);

  if (!isOpen) return null;
  const names = `${couple?.user1?.name || couple?.userA?.name || "Bạn"} & ${couple?.user2?.name || couple?.userB?.name || "Người ấy"}`;
  const cur = slides[idx];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[9/16] max-h-[86vh] max-h-[86dvh] rounded-[28px] overflow-hidden shadow-2xl border-2 border-white/20 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 my-auto">
        {cur?.photo ? (
          <img
            src={cur.photo}
            alt={cur.place}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-7xl">💕</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40" />

        {/* top bar */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex gap-1 mb-3" aria-hidden="true">
            {slides.map((s, i) => (
              <div key={s.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                <div
                  className={`h-full bg-white rounded-full transition-all ${i === idx ? "w-full" : i < idx ? "w-full opacity-60" : "w-0"}`}
                  style={i === idx && auto ? { animation: "recapbar 3s linear" } : undefined}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 text-white">
            <p className="text-xs font-bold opacity-90 truncate min-w-0 flex-1">✨ Nhìn lại năm qua • {names}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng nhìn lại năm qua"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 shrink-0 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
          {slides.length === 0 ? (
            <div className="text-center space-y-1">
              <p className="font-display text-lg font-bold">Chưa có kỷ niệm nào</p>
              <p className="text-xs opacity-80 leading-relaxed">Hoàn thành date + viết recap để có slideshow nhé!</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] opacity-75 whitespace-nowrap overflow-hidden text-ellipsis"> {cur.date} • {"❤".repeat(Math.min(5, cur.rating))}</p>
              <p className="font-display text-xl font-bold leading-tight mt-0.5 break-words line-clamp-2">{cur.place}</p>
              <p className="text-xs font-serif italic opacity-90 mt-1 leading-relaxed break-words line-clamp-3">“{cur.quote}”</p>
              <p className="text-[11px] opacity-70 mt-2 tabular-nums">{idx + 1} / {slides.length}</p>
            </>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + slides.length) % Math.max(1, slides.length))}
              disabled={slides.length <= 1}
              aria-label="Slide trước"
              className="flex-1 min-h-[44px] bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-bold backdrop-blur-sm touch-manipulation disabled:opacity-40"
            >
              ‹ Trước
            </button>
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              aria-label={auto ? "Tạm dừng tự chạy" : "Tự chạy slideshow"}
              aria-pressed={auto}
              className="w-11 min-w-[44px] min-h-[44px] bg-white/20 hover:bg-white/30 rounded-xl py-2 flex items-center justify-center backdrop-blur-sm touch-manipulation"
              title={auto ? "Tạm dừng" : "Tự chạy"}
            >
              {auto ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMusic((m) => !m)}
              aria-label={music ? "Tắt nhạc waltz" : "Bật nhạc waltz"}
              aria-pressed={music}
              className={`w-11 min-w-[44px] min-h-[44px] rounded-xl py-2 flex items-center justify-center backdrop-blur-sm touch-manipulation ${music ? "bg-white text-rose-600" : "bg-white/20 hover:bg-white/30"}`}
              title="Nhạc waltz Web Audio"
            >
              {music ? <Music4 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % Math.max(1, slides.length))}
              disabled={slides.length <= 1}
              aria-label="Slide tiếp theo"
              className="flex-1 min-h-[44px] bg-white text-rose-600 rounded-xl py-2 text-sm font-bold touch-manipulation disabled:opacity-60"
            >
              Tiếp ›
            </button>
          </div>
        </div>
        <style>{`@keyframes recapbar { from { width: 0 } to { width: 100% } }`}</style>
      </div>
    </div>
  );
};

export default YearRecapModal;
