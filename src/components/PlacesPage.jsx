import { useState, useMemo } from "react";
import { Plus, Search, MapPin, Heart, Sparkles, Compass, Coffee, Trash2 } from "lucide-react";
import PlaceCard from "./PlaceCard.jsx";
import AddPlaceModal from "./AddPlaceModal.jsx";
import EmptyState from "./EmptyState.jsx";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const FILTERS = [
  { key: "all", label: "Tất cả", emoji: "🗺️" },
  { key: "cafe", label: "Cafe", emoji: "☕" },
  { key: "restaurant", label: "Ăn uống", emoji: "🍽️" },
  { key: "entertainment", label: "Giải trí", emoji: "🎬" },
  { key: "nature", label: "Thiên nhiên", emoji: "🌿" },
];

const PlacesPage = ({
  places = [],
  couple,
  currentUser,
  onAddPlace,
  onEditPlace,
  onDeletePlace,
  onVisitToggle,
  onFavoriteToggle,
  onOpenBlindMatch,
  onOpenLoveMap,
  blindSwipes,
  onClearAllPlaces,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const matchedCount = useMemo(() => {
    return Object.values(blindSwipes || {}).filter((s) => s.matched).length;
  }, [blindSwipes]);

  const filtered = useMemo(() => {
    return places.filter(p => {
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const isUser1Match = (authorFilter === "userA" || authorFilter === "user1") && (p.addedBy === "user1" || p.addedBy === "userA");
      const isUser2Match = (authorFilter === "userB" || authorFilter === "user2") && (p.addedBy === "user2" || p.addedBy === "userB");
      const matchAuthor = authorFilter === "all" || p.addedBy === authorFilter || isUser1Match || isUser2Match;
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
        <div className="flex items-center gap-2">
          {places.length > 0 && (
            <button
              id="clear-places-header-btn"
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs text-stone-500 hover:text-red-600 border-stone-200 hover:border-red-200 font-semibold transition-colors"
              title="Làm trống danh sách địa điểm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm trống</span>
            </button>
          )}

          <button
            id="open-love-map-places-btn"
            type="button"
            onClick={onOpenLoveMap}
            className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 font-semibold"
            title="Mở bản đồ dấu chân hẹn hò"
          >
            <Compass className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Bản đồ</span>
          </button>

          <button
            id="open-blind-match-places-btn"
            type="button"
            onClick={onOpenBlindMatch}
            className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 font-semibold"
            title="Quẹt quán bí mật để tìm quán cả hai cùng thích"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Quẹt quán</span>
            {matchedCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {matchedCount}
              </span>
            )}
          </button>

          <button
            id="open-add-place-btn"
            onClick={() => { setEditingPlace(null); setShowAddModal(true); }}
            className="btn-primary flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm mới
          </button>
        </div>
      </div>

      {/* Search & Filters chỉ hiện khi đã có ít nhất 1 địa điểm */}
      {places.length > 0 && (
        <>
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
                { key: "userA", label: couple.user1?.name || couple.userA?.name || "Bạn thứ nhất" },
                { key: "userB", label: couple.user2?.name || couple.userB?.name || "Bạn thứ hai" },
              ].map(f => (
                <button
                  key={f.key}
                  id={`author-filter-${f.key}`}
                  onClick={() => setAuthorFilter(f.key)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                    authorFilter === f.key
                      ? "bg-rose-100 border-rose-400 text-rose-700 font-semibold"
                      : "bg-white border-gray-200 text-gray-500 hover:border-rose-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Places list & Empty States (P2: EmptyState minh họa + 1 CTA) */}
      {places.length === 0 ? (
        <EmptyState
          illustration="🗺️"
          title="Chưa có địa điểm nào trong kho kỷ niệm"
          desc="Hãy bắt đầu cùng nhau lưu lại những quán ăn ngon, góc cafe chill mà hai đứa muốn đến nhé 💕"
          actionLabel="+ Thêm địa điểm đầu tiên"
          onAction={() => { setEditingPlace(null); setShowAddModal(true); }}
          actionId="empty-add-first-place-btn"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          illustration="🔍"
          title="Không tìm thấy địa điểm phù hợp"
          desc="Không có quán nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại."
          actionLabel="Đặt lại bộ lọc"
          onAction={() => {
            setSearchQuery("");
            setCategoryFilter("all");
            setAuthorFilter("all");
            setFavOnly(false);
          }}
          variant="secondary"
        />
      ) : (
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
      )}

      {/* Modal xác nhận làm trống toàn bộ địa điểm */}
      {showConfirmClear && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmClear(false); }}
        >
          <div className="modal-box max-w-sm p-6 text-center space-y-4 animate-scale-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 text-red-500 flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-stone-800">
                Làm trống danh sách quán?
              </h3>
              <p className="text-xs text-stone-500 font-serif leading-relaxed">
                Bạn có chắc chắn muốn xóa toàn bộ địa điểm để bắt đầu danh sách mới từ đầu không?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                id="confirm-clear-places-page-btn"
                onClick={async () => {
                  await onClearAllPlaces?.();
                  setShowConfirmClear(false);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                Đồng ý làm trống
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
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

