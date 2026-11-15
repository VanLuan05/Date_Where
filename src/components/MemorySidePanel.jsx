import { History, CalendarHeart } from "lucide-react";
import { formatDate, isUpcoming } from "../utils/helpers.js";

/**
 * P3 — Side-panel kỷ niệm (chỉ desktop lg+).
 * Timeline rút gọn (3 mốc gần nhất) + Sắp tới & thống kê quán.
 * Ẩn hoàn toàn trên mobile.
 */
const MemorySidePanel = ({ dates = [], places = [] }) => {
  const done = (dates || [])
    .filter((d) => d && d.status === "completed")
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 3);
  const unvisited = (places || []).filter((p) => !p.visited).length;
  const visited = (places || []).filter((p) => p.visited).length;
  const nextDate = (dates || [])
    .filter((d) => d && d.status === "upcoming" && isUpcoming(d.date))
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))[0] || null;

  return (
    <aside aria-label="Kỷ niệm nổi bật" className="hidden lg:block lg:sticky lg:top-20 space-y-4">
      {/* Timeline rút gọn */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="section-title flex items-center gap-1.5 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
          <History className="w-4 h-4 text-rose-500" /> Kỷ niệm gần đây
        </h3>
        {done.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hoàn thành buổi hẹn + recap để timeline tự lưu giữ nhé 💞
          </p>
        ) : (
          <ol className="space-y-2">
            {done.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 rounded-xl p-2.5"
              >
                <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0 bg-rose-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">{d.placeName}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{formatDate(d.date)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Sắp tới + stats */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-2 shadow-xs">
        <h3 className="section-title flex items-center gap-1.5 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
          <CalendarHeart className="w-4 h-4 text-rose-500" /> Sắp tới của đôi mình
        </h3>
        {nextDate ? (
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
              💕 {nextDate.placeName || "Buổi hẹn bí mật"}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {formatDate(nextDate.date)}{nextDate.time ? ` • ${nextDate.time}` : ""}
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Chưa có buổi hẹn tiếp theo — thêm ở tab Lịch hẹn nhé 📅
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {visited} quán đã đi • {unvisited} quán chưa đi
        </p>
      </section>
    </aside>
  );
};

export default MemorySidePanel;
