import { MapPin, Navigation2, Star, Trash2, Edit3, ChefHat, StickyNote, User } from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const PlaceCard = ({ place, couple, currentUser, onDelete, onEdit, onVisitToggle }) => {
  const cat = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.other;
  const addedByUser = couple?.[place.addedBy];
  const isOwner = place.addedBy === currentUser;

  const handleDirections = () => {
    const url = place.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(place.address)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="card overflow-hidden group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-rose-100">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
            <span className="text-5xl opacity-60">{cat.emoji}</span>
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className={`badge ${cat.color}`}>{cat.emoji} {cat.label}</span>
          {place.visited && (
            <span className="badge bg-green-100 text-green-700 border border-green-200">? Da den</span>
          )}
        </div>
        {/* Actions overlay */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isOwner && (
            <>
              <button
                id={`edit-place-${place.id}`}
                onClick={() => onEdit(place)}
                className="w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-rose-600" />
              </button>
              <button
                id={`delete-place-${place.id}`}
                onClick={() => onDelete(place.id)}
                className="w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </>
          )}
        </div>
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
              <ChefHat className="w-3 h-3" /> Mon goi y
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
            <button
              id={`visit-toggle-${place.id}`}
              onClick={() => onVisitToggle(place.id, !place.visited)}
              className={`text-xs px-2.5 py-1 rounded-xl border transition-all duration-200 ${place.visited ? "bg-green-50 border-green-200 text-green-600" : "bg-white border-gray-200 text-gray-500 hover:border-rose-200"}`}
            >
              {place.visited ? "? Da den" : "Chua den"}
            </button>
            <button
              id={`directions-${place.id}`}
              onClick={handleDirections}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:shadow-romantic transition-all duration-200 active:scale-95"
            >
              <Navigation2 className="w-3 h-3" /> Chi duong
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
