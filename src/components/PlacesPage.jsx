import { useState, useMemo } from "react";
import { Plus, Search, MapPin, Heart } from "lucide-react";
import PlaceCard from "./PlaceCard.jsx";
import AddPlaceModal from "./AddPlaceModal.jsx";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const FILTERS = [
  { key: "all", label: "Tất cả", emoji: "🗺️" },
  { key: "cafe", label: "Cafe", emoji: "☕" },
  { key: "restaurant", label: "Ăn uống", emoji: "🍜" },
  { key: "entertainment", label: "Giải trí", emoji: "🎮" },
  { key: "nature", label: "Thiên nhiên", emoji: "🌿" },
];

const PlacesPage = ({ places, couple, currentUser, onAddPlace, onEditPlace, onDeletePlace, onVisitToggle, onFavoriteToggle }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const filtered = useMemo(() => {
    return places.filter(p => {
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchAuthor = authorFilter === "all" || p.addedBy === authorFilter;
      const matchSearch = !searchQuery
        || p.name.toLowerCase().includes(searchQuery.toLowerCase())
        || p.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFav = !favOnly || p.favorite;
      return matchCat && matchAuthor && matchSearch && matchFav;
    });
  }, [places, categoryFilter, authorFilter, searchQuery, favOnly]);

  const favCount = useMemo(() => places.filter(p => p.favorite).length, [places]);

  const handleEdit = (place) => {
    setEditingPlace(place);
    setShowAddModal(true);
  };

  const handleSave = (form) => {
    if (editingPlace) {
      onEditPlace(editingPlace.id, form);
    } else {
      onAddPlace(form);
    }
    setEditingPlace(null);
  };

  const handleClose = () => {
    setShowAddModal(false);
    setEditingPlace(null);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Kho địa điểm 🗺️</h2>
          <p className="text-sm text-gray-500 mt-0.5">{places.length} địa điểm đã lưu</p>
        </div>
        <button
          id="open-add-place-btn"
          onClick={() => { setEditingPlace(null); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="search-places"
          className="input-field pl-10"
          placeholder="Tìm kiếm địa điểm..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category filter + Favorites toggle */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            onClick={() => setCategoryFilter(f.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
              categoryFilter === f.key
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-romantic"
                : "bg-white/70 text-gray-600 border border-rose-100 hover:border-rose-300"
            }`}
          >
            <span>{f.emoji}</span> {f.label}
          </button>
        ))}
        <button
          id="filter-favorites"
          onClick={() => setFavOnly(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
            favOnly
              ? "bg-gradient-to-r from-rose-400 to-pink-400 text-white shadow-romantic"
              : "bg-white/70 text-gray-600 border border-rose-100 hover:border-rose-300"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favOnly ? "fill-white" : ""}`} />
          Yêu thích {favCount > 0 && `(${favCount})`}
        </button>
      </div>

      {/* Author filter */}
      {couple && (
        <div className="flex gap-2">
          {[
            { key: "all", label: "Cả hai" },
            { key: "userA", label: couple.userA?.name || "Người A" },
            { key: "userB", label: couple.userB?.name || "Người B" },
          ].map(f => (
            <button
              key={f.key}
              id={`author-filter-${f.key}`}
              onClick={() => setAuthorFilter(f.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                authorFilter === f.key
                  ? "bg-rose-100 border-rose-400 text-rose-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-rose-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Places list */}
      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              couple={couple}
              currentUser={currentUser}
              onDelete={onDeletePlace}
              onEdit={handleEdit}
              onVisitToggle={onVisitToggle}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏙️</div>
          <p className="font-semibold text-gray-600">Chưa có địa điểm nào!</p>
          <p className="text-sm text-gray-400 mt-1">Hãy thêm địa điểm đầu tiên của đôi mình</p>
          <button
            id="empty-add-place-btn"
            onClick={() => setShowAddModal(true)}
            className="btn-primary mt-4"
          >
            Thêm ngay
          </button>
        </div>
      )}

      <AddPlaceModal
        isOpen={showAddModal}
        onClose={handleClose}
        onSave={handleSave}
        editPlace={editingPlace}
      />
    </div>
  );
};

export default PlacesPage;
