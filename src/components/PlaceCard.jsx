import { useState } from "react";
import { MapPin, Navigation2, Heart, Trash2, Edit3, ChefHat, StickyNote, CheckCircle2, Circle } from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";

// Placeholder images per category from Unsplash
const CATEGORY_FALLBACK = {
  cafe:          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80",
  restaurant:    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop&q=80",
  entertainment: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=250&fit=crop&q=80",
  nature:        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=250&fit=crop&q=80",
  other:         "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=400&h=250&fit=crop&q=80",
};

const PlaceCard = ({ place, couple, currentUser, onDelete, onEdit, onVisitToggle, onFavoriteToggle }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cat = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.other;
  const isUser1Role = place.addedBy === "user1" || place.addedBy === "userA";
  const addedByUser = couple?.[place.addedBy] || (isUser1Role ? (couple?.user1 || couple?.userA) : (couple?.user2 || couple?.userB));
  const isOwner =
    place.addedBy === currentUser ||
    (isUser1Role && (currentUser === "user1" || currentUser === "userA")) ||
    (!isUser1Role && (currentUser === "user2" || currentUser === "userB"));
  const isFavorited = place.favorite || false;

  const handleDirections = () => {
    let url = place.googleMapsUrl;
    // Smart fallback: if url empty or not a valid google maps link
    if (!url || !url.includes("google.com/maps") && !url.includes("maps.google.com")) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = () => {
    onDelete(place.id);
    setConfirmDelete(false);
  };

  const imgSrc = (!place.imageUrl || imgError)
    ? CATEGORY_FALLBACK[place.category] || CATEGORY_FALLBACK.other
    : place.imageUrl;

  return (
    <>
      <div className="card overflow-hidden group">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-rose-100">
          <img
            src={imgSrc}
            alt={place.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <span className={`badge ${cat.color}`}>{cat.emoji} {cat.label}</span>
          </div>

          {/* Favorite button */}
          <button
            id={`favorite-${place.id}`}
            onClick={() => onFavoriteToggle(place.id, !isFavorited)}
            className={`absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 active:scale-90 ${
              isFavorited
                ? "bg-rose-500 text-white"
                : "bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-rose-500"
            }`}
            title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-white" : ""}`} />
          </button>

          {/* Edit/Delete actions (owner only) */}
          {isOwner && (
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                id={`edit-place-${place.id}`}
                onClick={() => onEdit(place)}
                className="w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                title="Sửa địa điểm"
              >
                <Edit3 className="w-3.5 h-3.5 text-rose-600" />
              </button>
              <button
                id={`delete-place-${place.id}`}
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                title="Xóa địa điểm"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display font-bold text-gray-800 text-lg leading-tight">{place.name}</h3>
            <div className="flex items-start gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">{place.address}</p>
            </div>
          </div>

          {/* Menu items */}
          {place.menuItems && place.menuItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 mb-1.5">
                <ChefHat className="w-3 h-3" /> Món gợi ý
              </div>
              <div className="flex flex-wrap gap-1.5">
                {place.menuItems.slice(0, 4).map((item, i) => (
                  <span key={i} className="text-xs bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full">
                    {item}
                  </span>
                ))}
                {place.menuItems.length > 4 && (
                  <span className="text-xs text-gray-400 px-1">+{place.menuItems.length - 4}</span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <div className="flex items-start gap-1.5">
                <StickyNote className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">{place.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {addedByUser && (
                <>
                  <img src={addedByUser.avatar} alt={addedByUser.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-xs text-gray-500">{addedByUser.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Visit toggle badge */}
              <button
                id={`visit-toggle-${place.id}`}
                onClick={() => onVisitToggle(place.id, !place.visited)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl border transition-all duration-200 ${
                  place.visited
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-rose-200"
                }`}
                title={place.visited ? "Đã đi cùng nhau" : "Chưa đi"}
              >
                {place.visited
                  ? <><CheckCircle2 className="w-3 h-3" /> Đã đi</>
                  : <><Circle className="w-3 h-3" /> Chưa đi</>
                }
              </button>

              {/* Directions button */}
              <button
                id={`directions-${place.id}`}
                onClick={handleDirections}
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:shadow-romantic transition-all duration-200 active:scale-95"
              >
                <Navigation2 className="w-3 h-3" /> Chỉ đường
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false); }}
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full space-y-4 animate-slide-up">
            <div className="text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="font-display font-bold text-gray-800 text-lg">Xóa địa điểm?</h3>
              <p className="text-sm text-gray-500 mt-1.5">
                Bạn có chắc muốn xóa <span className="font-semibold text-rose-600">{place.name}</span>?
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                id={`confirm-delete-${place.id}`}
                onClick={handleDelete}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold py-2.5 rounded-2xl hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Xóa ngay
              </button>
              <button
                id={`cancel-delete-${place.id}`}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-2xl hover:bg-gray-200 transition-all duration-200"
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
