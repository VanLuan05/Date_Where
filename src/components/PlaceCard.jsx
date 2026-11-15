import { useState } from "react";
import {
  MapPin,
  Navigation2,
  Heart,
  Trash2,
  Edit3,
  ChefHat,
  CheckCircle2,
  Circle,
  CalendarPlus,
} from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";

// Placeholder images per category
const CATEGORY_FALLBACK = {
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=350&fit=crop&q=80",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=350&fit=crop&q=80",
  entertainment: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=350&fit=crop&q=80",
  nature: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=350&fit=crop&q=80",
  other: "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=600&h=350&fit=crop&q=80",
};

const PlaceCard = ({
  place,
  couple,
  currentUser,
  onDelete,
  onEdit,
  onVisitToggle,
  onFavoriteToggle,
  onSchedule,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cat = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.other;
  const isUser1Role = place.addedBy === "user1" || place.addedBy === "userA";
  const addedByUser =
    couple?.[place.addedBy] ||
    (isUser1Role ? couple?.user1 || couple?.userA : couple?.user2 || couple?.userB);
  const isFavorited = place.favorite || false;

  const handleDirections = () => {
    let url = place.googleMapsUrl;
    if (!url || (!url.includes("google.com/maps") && !url.includes("maps.google.com"))) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address || place.name)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = () => {
    onDelete(place.id);
    setConfirmDelete(false);
  };

  const imgSrc =
    !place.imageUrl || imgError
      ? CATEGORY_FALLBACK[place.category] || CATEGORY_FALLBACK.other
      : place.imageUrl;

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xs hover:border-stone-300 dark:hover:border-zinc-700 transition-all overflow-hidden group">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-48 overflow-hidden bg-stone-100 dark:bg-zinc-800">
          <img
            src={imgSrc}
            alt={place.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            onError={() => setImgError(true)}
          />

          {/* Category pill */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-black/45 backdrop-blur-md text-white px-2.5 py-1 rounded-lg">
              {cat.emoji} {cat.label}
            </span>
          </div>

          {/* Top-right action cluster */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              id={`favorite-${place.id}`}
              onClick={() => onFavoriteToggle(place.id, !isFavorited)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                isFavorited
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-black/40 hover:bg-black/60 text-white"
              }`}
              title={isFavorited ? "Bỏ yêu thích" : "Yêu thích"}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-white" : ""}`} />
            </button>
            <button
              id={`edit-place-${place.id}`}
              onClick={() => onEdit(place)}
              className="w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-lg flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`delete-place-${place.id}`}
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 bg-black/40 hover:bg-red-600 text-white rounded-lg flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content details */}
        <div className="p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-zinc-100 text-base sm:text-lg leading-snug">
              {place.name}
            </h3>
            {place.address && (
              <div className="flex items-start gap-1.5 mt-1 text-xs text-stone-500 dark:text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{place.address}</span>
              </div>
            )}
          </div>

          {/* Menu items */}
          {place.menuItems && place.menuItems.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <ChefHat className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              {place.menuItems.slice(0, 3).map((item, i) => (
                <span
                  key={i}
                  className="text-xs bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 px-2 py-0.5 rounded-md"
                >
                  {item}
                </span>
              ))}
              {place.menuItems.length > 3 && (
                <span className="text-[11px] text-stone-400">+{place.menuItems.length - 3}</span>
              )}
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <p className="text-xs text-stone-600 dark:text-zinc-400 bg-stone-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-stone-100 dark:border-zinc-800 line-clamp-2">
              "{place.notes}"
            </p>
          )}

          {/* Action Row */}
          <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {addedByUser && (
                <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-500">
                  <img
                    src={addedByUser.avatar}
                    alt={addedByUser.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[80px]">{addedByUser.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Visit toggle */}
              <button
                id={`visit-toggle-${place.id}`}
                onClick={() => onVisitToggle(place.id, !place.visited)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  place.visited
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-stone-50 hover:bg-stone-100 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300"
                }`}
                title={place.visited ? "Đã đi cùng nhau" : "Chưa đi"}
              >
                {place.visited ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã ghé
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 text-stone-400" /> Chưa ghé
                  </>
                )}
              </button>

              {/* Schedule date CTA */}
              {onSchedule && (
                <button
                  type="button"
                  onClick={() => onSchedule(place)}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 font-medium shadow-xs"
                  title="Lên lịch hẹn quán này"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lên lịch</span>
                </button>
              )}

              {/* Google Maps Directions */}
              <button
                id={`directions-${place.id}`}
                onClick={handleDirections}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Chỉ đường trên Google Maps"
              >
                <Navigation2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(false);
          }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl max-w-xs w-full space-y-4 border border-stone-200 dark:border-zinc-800">
            <div className="text-center">
              <h3 className="font-semibold text-stone-900 dark:text-zinc-100 text-base">Xóa địa điểm này?</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                Địa điểm <strong className="text-stone-800 dark:text-stone-200">{place.name}</strong> sẽ bị xóa khỏi kho lưu trữ.
              </p>
            </div>
            <div className="flex gap-2 font-sans">
              <button
                id={`confirm-delete-${place.id}`}
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Xóa ngay
              </button>
              <button
                id={`cancel-delete-${place.id}`}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaceCard;
