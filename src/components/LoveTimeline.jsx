import { useMemo, useState } from "react";
import { formatDate } from "../utils/helpers.js";
import EmptyState from "./EmptyState.jsx";
import { X } from "lucide-react";

/**
 * LoveTimeline
 * Trục thời gian nối các buổi hẹn đã hoàn thành.
 * Nhấn để xem chi tiết ảnh và phóng to.
 */
const LoveTimeline = ({ dates = [] }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const items = useMemo(() => {
    const done = (dates || []).filter((d) => d && d.status === "completed");
    return [...done].sort(
      (a, b) =>
        new Date(b.recap?.completedAt || b.date || 0) -
        new Date(a.recap?.completedAt || a.date || 0)
    );
  }, [dates]);

  if (items.length === 0) {
    return (
      <EmptyState
        illustration="📖"
        title="Dòng thời gian đang chờ đón"
        desc="Sau mỗi buổi hẹn, hãy đánh dấu hoàn thành và tải ảnh kỷ niệm để cùng vẽ nên câu chuyện tình yêu nhé!"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative pl-6">
        {/* Timeline vertical connecting line */}
        <div
          aria-hidden="true"
          className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-stone-200 dark:bg-zinc-800"
        />

        <ol className="space-y-3">
          {items.map((d) => {
            const photos = d.recap?.photos || [];
            const isOpen = expandedId === d.id;
            const caption =
              d.recap?.bestMoment ||
              d.notes ||
              `Đánh giá ${d.recap?.rating || 5}/5 sao`;

            return (
              <li key={d.id} className="relative">
                {/* Timeline node dot */}
                <span
                  aria-hidden="true"
                  className="absolute -left-6 top-3 w-3.5 h-3.5 rounded-full bg-white dark:bg-zinc-900 border-2 border-rose-600 shadow-xs"
                />

                <div
                  onClick={() => setExpandedId(isOpen ? null : d.id)}
                  className="w-full text-left bg-stone-50/80 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 rounded-xl p-3.5 hover:border-stone-300 dark:hover:border-zinc-600 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-stone-900 dark:text-zinc-100 leading-snug">
                      {d.placeName || "Buổi hẹn hò"}
                    </p>
                    <time className="text-[11px] text-stone-400 dark:text-zinc-500 shrink-0 font-medium">
                      {formatDate(d.date)}
                    </time>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2 min-w-0">
                    {photos.length > 0 && (
                      <img
                        src={photos[0]}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        className="w-11 h-11 rounded-lg object-cover border border-stone-200 dark:border-zinc-700 shrink-0 bg-stone-100"
                      />
                    )}
                    <p className="text-xs text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed flex-1">
                      {caption}
                    </p>
                    {photos.length > 1 && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-md font-medium shrink-0">
                        +{photos.length - 1} ảnh
                      </span>
                    )}
                  </div>

                  {isOpen && (
                    <div
                      className="mt-3 pt-3 border-t border-stone-200/60 dark:border-zinc-700/60 space-y-2.5 animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {photos.map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt={`Kỷ niệm ${i + 1}`}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              onClick={() => setLightbox(p)}
                              className="w-full aspect-square rounded-lg object-cover cursor-pointer hover:scale-102 transition-transform border border-stone-200 dark:border-zinc-700"
                            />
                          ))}
                        </div>
                      )}

                      {d.recap?.foodReview && (
                        <p className="text-xs text-stone-700 dark:text-zinc-300 bg-amber-50/80 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-amber-200/60 dark:border-zinc-700">
                          🍽️ <strong>Món ăn:</strong> {d.recap.foodReview}
                        </p>
                      )}

                      {d.recap?.bestMoment && (
                        <p className="text-xs text-stone-700 dark:text-zinc-300 bg-rose-50/80 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-rose-200/60 dark:border-zinc-700">
                          ✨ <strong>Khoảnh khắc:</strong> {d.recap.bestMoment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Lightbox photo modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Xem ảnh kỷ niệm"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightbox}
              alt="Ảnh kỷ niệm phóng to"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoveTimeline;
