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
    <div className="card-secondary p-3 sm:p-4 space-y-3">
      <h3 className="font-display font-bold text-stone-800 dark:text-zinc-100 text-[15px] flex items-center gap-1.5">
        💞 Hành trình yêu <span className="text-rose-500 dark:text-rose-300">({items.length})</span>
      </h3>
      <div className="relative pl-6">
        <div aria-hidden="true" className="absolute left-[8px] top-2 bottom-2 w-0.5 bg-rose-200 dark:bg-rose-500/30 rounded-full" />
        <ol className="space-y-2.5">
          {items.map((d) => {
            const photos = d.recap?.photos || [];
            const isOpen = expandedId === d.id;
            const caption = d.recap?.bestMoment || d.notes || `${"❤".repeat(Math.min(5, d.recap?.rating || 5))} ${d.recap?.rating || 5}/5`;
            return (
              <li key={d.id} className="relative">
                <span aria-hidden="true" className="absolute -left-6 top-2 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-rose-400 flex items-center justify-center text-[8px] shadow-sm">
                  💖
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : d.id)}
                  aria-expanded={isOpen}
                  className="w-full min-h-[44px] text-left bg-white dark:bg-zinc-900/80 border border-rose-100 dark:border-white/10 rounded-2xl p-3 hover:border-rose-300 dark:hover:border-rose-400/40 transition-all active:scale-[0.99] touch-manipulation"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-stone-800 dark:text-zinc-100 leading-snug break-words min-w-0 flex-1 line-clamp-2">
                      {d.placeName || "Buổi hẹn bí mật"}
                    </p>
                    <time className="text-[11px] text-stone-400 dark:text-zinc-400 shrink-0 whitespace-nowrap tabular-nums pt-0.5">
                      {formatDate(d.date)}
                    </time>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 min-w-0">
                    {photos.length > 0 && (
                      <img
                        src={photos[0]}
                        alt=""
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                        className="w-10 h-10 rounded-xl object-cover border border-rose-100 dark:border-white/10 shrink-0 bg-rose-50"
                      />
                    )}
                    <p className="text-xs text-stone-500 dark:text-zinc-400 font-serif italic leading-relaxed break-words min-w-0 flex-1 line-clamp-2">
                      {caption}
                    </p>
                    {photos.length > 1 && (
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap">
                        +{photos.length - 1} ảnh
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <div className="mt-2 pt-2 border-t border-rose-100/70 dark:border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {photos.map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt={`Kỷ niệm ${i + 1}`}
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                              onClick={() => setLightbox(p)}
                              className="w-full aspect-square rounded-xl object-cover cursor-pointer hover:scale-[1.03] transition-transform border border-rose-100 dark:border-white/10 bg-rose-50 touch-manipulation"
                            />
                          ))}
                        </div>
                      )}
                      {d.recap?.foodReview && (
                        <p className="text-xs text-stone-600 dark:text-zinc-300 font-serif leading-relaxed break-words">🍽️ “{d.recap.foodReview}”</p>
                      )}
                      {d.recap?.bestMoment && (
                        <p className="text-xs text-stone-600 dark:text-zinc-300 font-serif leading-relaxed break-words">✨ “{d.recap.bestMoment}”</p>
                      )}
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500 break-words">
                        {d.time ? `⏰ ${d.time} • ` : ""}{"❤".repeat(Math.min(5, d.recap?.rating || 5))} • {formatDate(d.date)}
                      </p>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Xem ảnh kỷ niệm"
        >
          <img src={lightbox} alt="Ảnh kỷ niệm phóng to" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      )}
    </div>
  );
};

export default LoveTimeline;
