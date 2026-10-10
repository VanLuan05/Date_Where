import { useState } from "react";
import {
  Sparkles,
  CalendarHeart,
  MapPin,
  Map,
  Navigation,
  Loader2,
  Compass,
} from "lucide-react";
import {
  calculateDistance,
  formatDistance,
} from "../../utils/locationService.js";

/**
 * CoupleQuickActions
 * ─────────────────────────────────────────────────
 * Hàng 4 nút tiện ích dạng pill/icon tròn:
 *  1. 💖 Quẹt quán  → onOpenBlindMatch
 *  2. 🗓️ Lịch rảnh  → onOpenAvailability
 *  3. 📍 Vị trí     → onShareLocation / open directions
 *  4. 🗺️ Bản đồ kỷ niệm → onOpenLoveMap
 *
 * Badges: matchedCount (Quẹt quán) & matchedFreeDays (Lịch rảnh) &
 *         distanceText (Vị trí).
 */
const CoupleQuickActions = ({
  onOpenBlindMatch,
  onOpenAvailability,
  onShareLocation,
  onOpenLoveMap,
  blindSwipes,
  matchedFreeDays = [],
  partnerLocations = {},
  currentUser,
  couple,
}) => {
  const [locLoading, setLocLoading] = useState(false);

  const matchedCount = Object.values(blindSwipes || {}).filter((s) => s.matched).length;

  // Tính khoảng cách
  const isUser1 = currentUser === "user1" || currentUser === "userA";
  const myKey = isUser1 ? "user1" : "user2";
  const partnerKey = isUser1 ? "user2" : "user1";
  const myLoc = partnerLocations?.[myKey];
  const partnerLoc = partnerLocations?.[partnerKey];
  let distanceText = null;
  if (myLoc && partnerLoc && myLoc.lat && partnerLoc.lat) {
    const dist = calculateDistance(myLoc.lat, myLoc.lng, partnerLoc.lat, partnerLoc.lng);
    distanceText = formatDistance(dist);
  }

  const handleLocationAction = async () => {
    if (distanceText && partnerLoc?.lat) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${partnerLoc.lat},${partnerLoc.lng}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    setLocLoading(true);
    try {
      await onShareLocation?.();
    } finally {
      setLocLoading(false);
    }
  };

  const actions = [
    {
      id: "quick-blind-match-btn",
      emoji: "💖",
      label: "Quẹt quán",
      sublabel: matchedCount > 0 ? `${matchedCount} match` : null,
      gradient: "from-rose-400 to-pink-500",
      badgeColor: "bg-rose-500",
      onClick: onOpenBlindMatch,
      loading: false,
    },
    {
      id: "quick-availability-btn",
      emoji: "🗓️",
      label: "Lịch rảnh",
      sublabel: matchedFreeDays.length > 0 ? `${matchedFreeDays.length} ngày` : null,
      gradient: "from-violet-400 to-fuchsia-500",
      badgeColor: "bg-fuchsia-500",
      onClick: onOpenAvailability,
      loading: false,
    },
    {
      id: "quick-location-btn",
      emoji: locLoading ? null : "📍",
      label: "Vị trí",
      sublabel: distanceText || null,
      gradient: "from-sky-400 to-indigo-500",
      badgeColor: "bg-sky-500",
      onClick: handleLocationAction,
      loading: locLoading,
      icon: locLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : null,
    },
    {
      id: "quick-love-map-btn",
      emoji: "🗺️",
      label: "Bản đồ",
      sublabel: null,
      gradient: "from-emerald-400 to-teal-500",
      badgeColor: "bg-emerald-500",
      onClick: onOpenLoveMap,
      loading: false,
    },
  ];

  return (
    <div className="quick-actions-row">
      <div className="grid grid-cols-4 gap-2.5">
        {actions.map((action) => (
          <button
            key={action.id}
            id={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.loading}
            className="quick-action-pill group relative flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-card bg-white/80 backdrop-blur-sm border border-rose-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            {/* Icon circle */}
            <div className={`w-11 h-11 rounded-[14px] bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}>
              {action.loading && action.icon
                ? action.icon
                : <span className="text-xl leading-none">{action.emoji}</span>
              }
            </div>

            {/* Badge */}
            {action.sublabel && (
              <span className={`absolute top-1.5 right-1.5 ${action.badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm`}>
                {action.sublabel}
              </span>
            )}

            {/* Label */}
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoupleQuickActions;
