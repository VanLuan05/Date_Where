import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { trackEvent } from "../utils/analytics.js";

const KEY = "dw_review_prompt_seen";

/**
 * ReviewPrompt (Cụm 8) — gợi ý đánh giá sau date thứ 3.
 * Hiện 1 lần duy nhất, không chặn UI.
 */
const ReviewPrompt = ({ dates = [] }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = (dates || []).filter((d) => d?.status === "completed").length;
    if (done < 3) return;
    try {
      if (localStorage.getItem(KEY) === "1") return;
    } catch {}
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [dates]);

  if (!visible) return null;

  const dismiss = (rated) => {
    try {
      localStorage.setItem(KEY, "1");
      if (rated) trackEvent("review_prompt_accept");
      else trackEvent("review_prompt_dismiss");
    } catch {}
    setVisible(false);
  };

  return (
    <div className="card-static p-4 border-2 border-amber-200 rounded-[22px] bg-gradient-to-br from-amber-50 to-orange-50/60 flex items-start gap-3 animate-fade-in">
      <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0">
        <Star className="w-5 h-5 text-white" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-800">Đôi mình đã có 3 buổi hẹn rồi! 🎉</p>
        <p className="text-xs text-stone-500 mt-0.5">
          Thấy app hữu ích chứ? Đánh giá 5 sao để team có động lực nhé — chỉ mất 10 giây!
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => dismiss(true)}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-2 rounded-xl active:scale-95"
          >
            ⭐ Đánh giá ngay
          </button>
          <button
            onClick={() => dismiss(false)}
            className="px-3 py-2 text-xs text-stone-400 hover:text-stone-600"
          >
            Để sau
          </button>
        </div>
      </div>
      <button onClick={() => dismiss(false)} className="text-stone-300 hover:text-stone-500" aria-label="Đóng">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ReviewPrompt;
