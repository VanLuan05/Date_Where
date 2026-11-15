import { useState, lazy, Suspense } from "react";
import { Clapperboard, Sparkles, Heart, Calendar, MapPin } from "lucide-react";
import LoveTimeline from "./LoveTimeline.jsx";
import { TimelineSkeleton } from "./Skeleton.jsx";
import { getDaysTogether } from "../utils/helpers.js";

const YearRecapModal = lazy(() => import("./YearRecapModal.jsx"));

/**
 * JourneyPage ("Hành trình" Tab)
 * ─────────────────────────────────────────────────
 * Tab riêng biệt nhìn lại hành trình yêu thương:
 *  • Thống kê tổng quan: Số ngày bên nhau, số kỷ niệm đã lưu
 *  • "Xem lại năm qua 🎬" slideshow 9:16 + nhạc
 *  • Trục dòng thời gian (LoveTimeline) với ảnh check-in và khoảnh khắc
 */
const JourneyPage = ({ dates = [], couple, places = [] }) => {
  const [showRecap, setShowRecap] = useState(false);

  const completedDates = (dates || []).filter((d) => d && d.status === "completed");
  const totalDays = getDaysTogether(couple?.startDate);
  const visitedPlacesCount = (places || []).filter((p) => p.visited).length;

  return (
    <div className="space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Hành trình yêu
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Dòng thời gian ghi dấu những khoảnh khắc ngọt ngào của đôi bạn
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRecap(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors active:scale-95 cursor-pointer"
        >
          <Clapperboard className="w-4 h-4" />
          <span>Xem lại năm qua 🎬</span>
        </button>
      </div>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
          <div className="text-xl sm:text-2xl font-bold font-display text-rose-600 dark:text-rose-400">
            {totalDays}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Ngày bên nhau
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
          <div className="text-xl sm:text-2xl font-bold font-display text-violet-600 dark:text-violet-400">
            {completedDates.length}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Kỷ niệm đã lưu
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
          <div className="text-xl sm:text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
            {visitedPlacesCount}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Quán đã ghé
          </div>
        </div>
      </div>

      {/* Love Timeline Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs">
        <Suspense fallback={<TimelineSkeleton />}>
          <LoveTimeline dates={dates} />
        </Suspense>
      </div>

      {/* Year Recap Modal */}
      {showRecap && (
        <Suspense fallback={null}>
          <YearRecapModal
            isOpen={showRecap}
            onClose={() => setShowRecap(false)}
            dates={dates}
            couple={couple}
          />
        </Suspense>
      )}
    </div>
  );
};

export default JourneyPage;
