import { useMemo, useState } from "react";
import { formatDate } from "../utils/helpers.js";
import EmptyState from "./EmptyState.jsx";

/**
 * LoveTimeline (Cụm 6)
 * Trục dọc từ dates completed + recap.photos có sẵn, sort theo thời gian.
 * Bấm vào xem chi tiết (inline expand + lightbox ảnh).
 */
const LoveTimeline = ({ dates = [] }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const items = useMemo(() => {
    const done = (dates || []).filter((d) => d && d.status === "completed");
    return [...done].sort(
      (a, b) => new Date(a.recap?.completedAt || a.date || 0) - new Date(b.recap?.completedAt || b.date || 0)
    );
  }, [dates]);

  if (items.length === 0) {
    // P2 — timeline trống: EmptyState minh họa, không CTA để giữ đúng
    // luật P0 "1 gradient/màn hình" (Dashboard đã có hero gradient).
    return (
      <EmptyState
        illustration="💞"
        title="Hành trình yêu của đôi mình"
        desc="Hoàn thành buổi hẹn + viết recap để timeline tự vẽ nên chuyện tình nhé!"
      />
    );
  }

  return (
    <div className="card-secondary p-4 space-y-3">
      <h3 className="font-display font-bold text-stone-800 text-[15px]">
        💞 Hành trình yêu <span className="text-rose-500">({items.length})</span>
      </h3>
      <div className="relative pl-5">
        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-rose-200 rounded-full" />
        <div className="space-y-3">
          {items.map((d) => {
            const photos = d.recap?.photos || [];
            const isOpen = expandedId === d.id;
            return (
              <div key={d.id} className="relative">
                <span className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-white border-2 border-rose-400 flex items-center justify-center text-[8px] shadow-sm">
                  💖
                </span>
                <button
                  onClick={() => setExpandedId(isOpen ? null : d.id)}
                  className="w-full text-left bg-white border border-rose-100 rounded-2xl p-3 hover:border-rose-300 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-stone-800 truncate">{d.placeName}</p>
                    <span className="text-[11px] text-stone-400 shrink-0">{formatDate(d.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {photos.length > 0 && (
                      <img src={photos[0]} alt="" loading="lazy" className="w-10 h-10 rounded-xl object-cover border border-rose-100" />
                    )}
                    <p className="text-xs text-stone-500 font-serif italic truncate">
                      {d.recap?.bestMoment || d.notes || `${"❤".repeat(Math.min(5, d.recap?.rating || 5))} ${d.recap?.rating || 5}/5`}
                    </p>
                    {photos.length > 1 && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                        +{photos.length - 1} ảnh
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <div className="mt-2 pt-2 border-t border-rose-100/70 space-y-2" onClick={(e) => e.stopPropagation()}>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {photos.map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt=""
                              loading="lazy"
                              onClick={() => setLightbox(p)}
                              className="w-full aspect-square rounded-xl object-cover cursor-pointer hover:scale-[1.03] transition-transform border border-rose-100"
                            />
                          ))}
                        </div>
                      )}
                      {d.recap?.foodReview && (
                        <p className="text-xs text-stone-600 font-serif">🍽️ “{d.recap.foodReview}”</p>
                      )}
                      {d.recap?.bestMoment && (
                        <p className="text-xs text-stone-600 font-serif">✨ “{d.recap.bestMoment}”</p>
                      )}
                      <p className="text-[11px] text-stone-400">
                        {d.time ? `⏰ ${d.time} • ` : ""}{"❤".repeat(Math.min(5, d.recap?.rating || 5))} • {formatDate(d.date)}
                      </p>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default LoveTimeline;
