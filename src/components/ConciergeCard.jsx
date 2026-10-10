import { useMemo, useState } from "react";
import { Sparkles, MapPin, CalendarHeart, Gift, Wand2, Loader2 } from "lucide-react";
import { getAIPlan } from "../utils/loveConcierge.js";
import { trackEvent } from "../utils/analytics.js";

/**
 * ConciergeCard (Cụm 7) — Love Concierge rule-based trong Dashboard.
 * Top 3 quán + top 3 slot + gợi ý dịp. Nút 1-Tap tạo date prefill từ gợi ý.
 */
const ConciergeCard = ({
  places = [],
  matchedFreeDays = [],
  forecastMap = {},
  dates = [],
  couple,
  partnerLocations,
  onQuickSchedule, // (prefill) => void — App chuyển sang tab Lịch hẹn + prefill form
}) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const preview = useMemo(() => {
    if (plan) return plan;
    return null;
  }, [plan]);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const p = await getAIPlan({ places, matchedFreeDays, forecastMap, dates, couple, partnerLocations });
      setPlan(p);
      try { trackEvent("concierge_ask"); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-secondary p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display font-semibold text-title text-stone-800 flex items-center gap-1.5">
          <Wand2 className="w-4 h-4 text-fuchsia-500" /> Love Concierge ✨
        </h3>
        <span className="badge bg-fuchsia-100 text-fuchsia-700">
          rule-based • offline OK
        </span>
      </div>

      {!preview ? (
        <div>
          <p className="text-xs text-stone-500 font-serif leading-relaxed">
            Gợi ý quán chưa đi + khung giờ cùng rảnh, không mưa, gần hai đứa — kèm quà & dress-code theo dịp.
          </p>
          <button
            onClick={handleAsk}
            disabled={loading}
            className="btn-primary w-full mt-2 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Đang xem sao hộ đôi mình..." : "Xin gợi ý hôm nay 💡"}
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {/* Top 3 quán */}
          <div>
            <p className="text-xs font-bold text-stone-700 flex items-center gap-1 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Top 3 quán nên đi
            </p>
            <div className="space-y-1.5">
              {preview.topPlaces.length === 0 && (
                <p className="text-xs text-gray-600">Chưa có quán nào — thêm ở tab Địa điểm nhé!</p>
              )}
              {preview.topPlaces.map((s, i) => (
                <div key={s.place.id || i} className="flex items-center gap-2 bg-white border border-rose-100 rounded-2xl p-2">
                  <span className="text-lg">{["🥇", "🥈", "🥉"][i] || "💗"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">{s.place.name}</p>
                    <p className="text-xs text-gray-600 truncate">{s.reasons.join(" • ")}</p>
                  </div>
                  <button
                    onClick={() => onQuickSchedule?.({ place: s.place })}
                    className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl hover:bg-rose-100 active:scale-95 shrink-0"
                  >
                    1-Tap hẹn
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 slot */}
          <div>
            <p className="text-xs font-bold text-stone-700 flex items-center gap-1 mb-1.5">
              <CalendarHeart className="w-3.5 h-3.5 text-violet-500" /> Top 3 khung giờ đẹp
            </p>
            <div className="space-y-1.5">
              {preview.topSlots.length === 0 && (
                <p className="text-xs text-gray-600">Hai đứa chưa có ngày cùng rảnh — mở “Tìm ngày cùng rảnh” nhé!</p>
              )}
              {preview.topSlots.map((s, i) => (
                <div key={`${s.dateStr}-${s.slot}-${i}`} className="flex items-center gap-2 bg-white border border-violet-100 rounded-2xl p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800">📅 {s.dateStr} • {s.time}</p>
                    <p className="text-xs text-gray-600 truncate">{s.reasons.join(" • ")}</p>
                  </div>
                  <button
                    onClick={() => onQuickSchedule?.({ dateStr: s.dateStr, time: s.time })}
                    className="text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1.5 rounded-xl hover:bg-violet-100 active:scale-95 shrink-0"
                  >
                    Chốt slot
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
            <p className="font-bold text-amber-800 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Gợi ý theo dịp ({preview.occasion.kind})
            </p>
            <p className="text-stone-600">🎁 Quà: {preview.occasion.gift}</p>
            <p className="text-stone-600">👗 Dress-code: {preview.occasion.dress}</p>
            <p className="text-stone-600">🗺️ Plan: {preview.occasion.plan}</p>
          </div>

          <button onClick={() => setPlan(null)} className="text-xs text-gray-600 hover:text-stone-800 mx-auto block">
            ↺ Gợi ý lại
          </button>
        </div>
      )}
    </div>
  );
};

export default ConciergeCard;
