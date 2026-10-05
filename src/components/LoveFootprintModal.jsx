import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  X,
  Compass,
  Navigation,
  Heart,
  Star,
  MapPin,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Bookmark,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ensurePlaceCoordinates,
} from "../utils/geoService.js";
import { formatDate } from "../utils/helpers.js";
import {
  calculateDistance,
  formatDistance,
  formatTimeAgo,
  getStatusDisplay,
} from "../utils/locationService.js";

// Helper component to fix tile sizing and fly to target
const MapController = ({ center, zoom, bounds, targetCoord }) => {
  const map = useMap();

  // Invalidate size on mount to ensure no blank tiles
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  // Handle fitBounds or view change
  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, 16, { duration: 1.2 });
    } else if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch {
        map.setView(center || DEFAULT_CENTER, zoom || DEFAULT_ZOOM);
      }
    } else if (center) {
      map.flyTo(center, zoom || DEFAULT_ZOOM, { duration: 1.2 });
    }
  }, [center, zoom, bounds, targetCoord, map]);

  return null;
};

// Create custom Leaflet DivIcons
const createVisitedIcon = (emoji = "💖") =>
  L.divIcon({
    className: "custom-love-marker",
    html: `<div class="marker-love-visited"><span class="marker-inner">${emoji}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });

const createWishlistIcon = (emoji = "📌") =>
  L.divIcon({
    className: "custom-love-marker",
    html: `<div class="marker-love-wishlist"><span class="marker-inner">${emoji}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });

const userLocationIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div class="marker-user-location" title="Vị trí của hai bạn">👫</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

/**
 * Creates a partner avatar marker icon with a radar pulse ring.
 * @param {string} avatarUrl - URL ảnh avatar
 * @param {'rose' | 'sky'} color - Màu viền
 */
const createPartnerAvatarIcon = (avatarUrl, color = "rose") => {
  const ringColor = color === "rose" ? "#f43f5e" : "#0ea5e9";
  return L.divIcon({
    className: "custom-partner-marker",
    html: `
      <div class="marker-partner-avatar" style="--ring-color: ${ringColor}">
        <div class="marker-partner-radar"></div>
        <img src="${avatarUrl}" alt="Partner" class="marker-partner-img" />
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
};

// Các giao diện nền bản đồ chất lượng cao (Google Maps, Vệ tinh, Esri Street, OSM)
const MAP_THEMES = [
  {
    id: "google-roadmap",
    name: "Google Maps",
    icon: "🗺️",
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>',
  },
  {
    id: "google-satellite",
    name: "Vệ tinh",
    icon: "🛰️",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps Satellite</a>',
  },
  {
    id: "esri-street",
    name: "Esri Street",
    icon: "🏙️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    subdomains: "",
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri World Street</a>',
  },
  {
    id: "osm",
    name: "Cổ điển",
    icon: "🌿",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
  },
];

const LoveFootprintModal = ({
  isOpen,
  onClose,
  places = [],
  dates = [],
  couple,
  activeUser,
  partnerLocations = {},
  onShareLocation,
}) => {
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "visited" | "wishlist"
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mapThemeId, setMapThemeId] = useState("google-roadmap");
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [targetFlyCoord, setTargetFlyCoord] = useState(null);

  const currentTheme =
    MAP_THEMES.find((t) => t.id === mapThemeId) || MAP_THEMES[0];
  const [showDrawer, setShowDrawer] = useState(true);
  const [locSharing, setLocSharing] = useState(false);
  const markerRefs = useRef({});

  // Ensure every place has valid coordinates
  const placesWithCoords = useMemo(() => {
    return (places || [])
      .filter((place) => place && typeof place === "object")
      .map((place, index) => {
        const coords =
          place?.coordinates &&
          Array.isArray(place.coordinates) &&
          place.coordinates.length === 2 &&
          !isNaN(place.coordinates[0]) &&
          !isNaN(place.coordinates[1])
            ? place.coordinates
            : ensurePlaceCoordinates(place, index);
        // Link completed date recap if available
        const relatedDate = (dates || []).find(
          (d) =>
            d &&
            (d.placeId === place?.id ||
              (d.placeName &&
                d.placeName.toLowerCase() === (place?.name || "").toLowerCase())) &&
            d.status === "completed"
        );
        return {
          ...place,
          computedCoords: coords,
          relatedDate,
        };
      });
  }, [places, dates]);

  // Counts
  const visitedCount = useMemo(
    () => placesWithCoords.filter((p) => p.visited).length,
    [placesWithCoords]
  );
  const wishlistCount = placesWithCoords.length - visitedCount;

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return placesWithCoords.filter((p) => {
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "visited"
          ? p.visited
          : !p.visited;

      const matchCategory =
        categoryFilter === "all" ? true : p.category === categoryFilter;

      return matchStatus && matchCategory;
    });
  }, [placesWithCoords, statusFilter, categoryFilter]);

  // Compute map bounds for all filtered places
  const mapBounds = useMemo(() => {
    if (!filteredPlaces || filteredPlaces.length === 0) return null;
    const validCoords = filteredPlaces
      .map((p) => p.computedCoords)
      .filter((coord) => Array.isArray(coord) && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1]));
    return validCoords.length > 0 ? validCoords : null;
  }, [filteredPlaces]);

  // Geolocation handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Thiết bị không hỗ trợ định vị GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setTargetFlyCoord(coords);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation warning:", err);
        alert(
          "Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
    setTargetFlyCoord(place.computedCoords);
    const marker = markerRefs.current[place.id];
    if (marker) {
      marker.openPopup();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-40 flex flex-col bg-stone-900/60 backdrop-blur-md animate-fade-in">
      {/* ── HEADER BAR ── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-rose-100/80 px-4 py-3 sm:px-6 shadow-sm z-20 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-romantic flex-shrink-0">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                  Bản đồ dấu chân đôi mình 🗺️💕
                </h2>
                <span className="inline-flex items-center gap-1 bg-rose-100/90 text-rose-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  <Heart className="w-3 h-3 fill-rose-600" />
                  Đã cùng nhau đi qua {visitedCount}/{placesWithCoords.length} địa điểm
                </span>
              </div>
              <p className="text-xs text-stone-500 font-serif hidden sm:block truncate mt-0.5">
                Mỗi góc phố là một kỷ niệm ấm áp của hai đứa ✨
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            title="Đóng bản đồ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── FILTERS BAR ── */}
        <div className="max-w-6xl mx-auto mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {/* Status filters */}
          <div className="flex items-center bg-stone-100/80 p-0.5 rounded-xl flex-shrink-0 border border-stone-200/60 font-serif">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-white text-stone-900 shadow-xs font-semibold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Tất cả ({placesWithCoords.length})
            </button>
            <button
              onClick={() => setStatusFilter("visited")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                statusFilter === "visited"
                  ? "bg-rose-500 text-white shadow-xs font-semibold"
                  : "text-rose-600 hover:text-rose-800"
              }`}
            >
              ✨ Đã thắp sáng ({visitedCount})
            </button>
            <button
              onClick={() => setStatusFilter("wishlist")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                statusFilter === "wishlist"
                  ? "bg-pink-400 text-white shadow-xs font-semibold"
                  : "text-pink-600 hover:text-pink-800"
              }`}
            >
              📌 Dự định đi ({wishlistCount})
            </button>
          </div>

          <div className="h-4 w-px bg-stone-200 flex-shrink-0" />

          {/* Category filters */}
          <div className="flex items-center gap-1.5 flex-shrink-0 font-serif">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-2.5 py-1 rounded-xl text-xs transition-all border ${
                categoryFilter === "all"
                  ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                  : "bg-white border-stone-200 text-stone-500 hover:border-rose-200"
              }`}
            >
              Tất cả thể loại
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-2.5 py-1 rounded-xl text-xs transition-all border flex items-center gap-1 whitespace-nowrap ${
                  categoryFilter === key
                    ? "bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-xs"
                    : "bg-white border-stone-200 text-stone-600 hover:border-rose-200"
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-rose-50/20">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ height: "100%", width: "100%" }}
        >
          {/* Nền bản đồ Google Maps sắc nét & Vệ tinh / Esri Street */}
          <TileLayer
            key={currentTheme.id}
            attribution={currentTheme.attribution}
            url={currentTheme.url}
            subdomains={currentTheme.subdomains || "abc"}
            maxZoom={currentTheme.maxZoom || 20}
          />

          <MapController
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            bounds={targetFlyCoord ? null : mapBounds}
            targetCoord={targetFlyCoord}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div className="p-3 text-center font-serif">
                  <p className="font-sans font-bold text-xs text-indigo-700">
                    👫 Vị trí hiện tại của bạn
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Đang sẵn sàng cho buổi hẹn tiếp theo!
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Place Markers */}
          {filteredPlaces.map((place) => {
            const isVisited = !!place.visited;
            const cat = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.other;
            const markerIcon = isVisited
              ? createVisitedIcon(cat.emoji || "💖")
              : createWishlistIcon(cat.emoji || "📌");

            const displayImage =
              place.relatedDate?.recap?.photos?.[0] ||
              place.imageUrl ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&fit=crop&q=80";

            const displayRating =
              place.relatedDate?.recap?.rating || place.rating || 5;

            const displayReview =
              place.relatedDate?.recap?.bestMoment ||
              place.relatedDate?.recap?.foodReview ||
              place.notes;

            return (
              <Marker
                key={place.id}
                position={place.computedCoords}
                icon={markerIcon}
                ref={(ref) => {
                  if (ref) markerRefs.current[place.id] = ref;
                }}
              >
                <Popup>
                  <div className="w-full text-stone-800">
                    {/* Thumbnail Image */}
                    <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                      <img
                        src={displayImage}
                        alt={place.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Category Tag */}
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 font-serif">
                        <span>{cat.emoji}</span> {cat.label}
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 text-white font-serif ${
                          isVisited
                            ? "bg-rose-500/90"
                            : "bg-pink-500/90"
                        }`}
                      >
                        {isVisited ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" /> Đã thắp sáng
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-2.5 h-2.5" /> Dự định ghé
                          </>
                        )}
                      </span>

                      {/* Rating stars overlay */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-0.5 text-amber-300">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < displayRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-3.5 space-y-2">
                      <div>
                        <h3 className="font-display font-bold text-stone-900 text-sm leading-tight">
                          {place.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 flex items-start gap-1 mt-0.5 font-serif line-clamp-2">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span>{place.address}</span>
                        </p>
                      </div>

                      {/* Check-in Date if visited */}
                      {isVisited && place.relatedDate?.date && (
                        <div className="bg-rose-50/70 border border-rose-100 rounded-xl px-2.5 py-1 text-[11px] text-rose-700 flex items-center gap-1.5 font-serif">
                          <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>Đã ghé ngày: <strong>{formatDate(place.relatedDate.date)}</strong></span>
                        </div>
                      )}

                      {/* Short memory review */}
                      {displayReview && (
                        <p className="text-[11px] text-stone-600 font-serif italic bg-stone-50 p-2 rounded-xl line-clamp-3 border border-stone-100">
                          "{displayReview}"
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const url =
                              place.googleMapsUrl ||
                              `https://maps.google.com/?q=${encodeURIComponent(
                                `${place.name} ${place.address}`
                              )}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className="w-full py-1.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Mở chỉ đường Google Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Partner Location Markers with Radar Pulse */}
          {(() => {
            const isUser1 = activeUser === "user1" || activeUser === "userA";
            const user1Data = couple?.user1 || couple?.userA;
            const user2Data = couple?.user2 || couple?.userB;

            const markers = [];

            // User 1 location
            const loc1 = partnerLocations?.user1;
            if (loc1?.lat && loc1?.lng) {
              const icon1 = createPartnerAvatarIcon(user1Data?.avatar || "", "rose");
              const status1 = getStatusDisplay(loc1.status);
              const dist1 =
                partnerLocations?.user2?.lat &&
                partnerLocations?.user2?.lng &&
                loc1?.lat &&
                loc1?.lng
                  ? formatDistance(
                      calculateDistance(
                        loc1.lat,
                        loc1.lng,
                        partnerLocations.user2.lat,
                        partnerLocations.user2.lng
                      )
                    )
                  : null;

              markers.push(
                <Marker key="partner-loc-1" position={[loc1.lat, loc1.lng]} icon={icon1}>
                  <Popup>
                    <div className="p-3 space-y-2 text-center" style={{ minWidth: "200px" }}>
                      <div className="flex items-center justify-center gap-2">
                        <img src={user1Data?.avatar} alt="" className="w-8 h-8 rounded-full ring-2 ring-rose-300 object-cover" />
                        <div className="text-left">
                          <p className="font-display font-bold text-xs text-stone-900">
                            Vị trí của {user1Data?.name}
                          </p>
                          <p className="text-[10px] text-stone-500 font-serif">
                            {status1.emoji} {status1.label} • {formatTimeAgo(loc1.updatedAt)}
                          </p>
                        </div>
                      </div>
                      {dist1 && !isUser1 && (
                        <p className="text-xs text-sky-700 font-semibold bg-sky-50 rounded-xl py-1 px-2">
                          📡 Đang cách bạn {dist1}
                        </p>
                      )}
                      {!isUser1 && (
                        <button
                          type="button"
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc1.lat},${loc1.lng}`, "_blank", "noopener,noreferrer")}
                          className="w-full py-1.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          Mở Google Maps chỉ đường
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            }

            // User 2 location
            const loc2 = partnerLocations?.user2;
            if (loc2?.lat && loc2?.lng) {
              const icon2 = createPartnerAvatarIcon(user2Data?.avatar || "", "sky");
              const status2 = getStatusDisplay(loc2.status);
              const dist2 =
                partnerLocations?.user1?.lat &&
                partnerLocations?.user1?.lng &&
                loc2?.lat &&
                loc2?.lng
                  ? formatDistance(
                      calculateDistance(
                        loc2.lat,
                        loc2.lng,
                        partnerLocations.user1.lat,
                        partnerLocations.user1.lng
                      )
                    )
                  : null;

              markers.push(
                <Marker key="partner-loc-2" position={[loc2.lat, loc2.lng]} icon={icon2}>
                  <Popup>
                    <div className="p-3 space-y-2 text-center" style={{ minWidth: "200px" }}>
                      <div className="flex items-center justify-center gap-2">
                        <img src={user2Data?.avatar} alt="" className="w-8 h-8 rounded-full ring-2 ring-sky-300 object-cover" />
                        <div className="text-left">
                          <p className="font-display font-bold text-xs text-stone-900">
                            Vị trí của {user2Data?.name}
                          </p>
                          <p className="text-[10px] text-stone-500 font-serif">
                            {status2.emoji} {status2.label} • {formatTimeAgo(loc2.updatedAt)}
                          </p>
                        </div>
                      </div>
                      {dist2 && isUser1 && (
                        <p className="text-xs text-sky-700 font-semibold bg-sky-50 rounded-xl py-1 px-2">
                          📡 Đang cách bạn {dist2}
                        </p>
                      )}
                      {isUser1 && (
                        <button
                          type="button"
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc2.lat},${loc2.lng}`, "_blank", "noopener,noreferrer")}
                          className="w-full py-1.5 px-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          Mở Google Maps chỉ đường
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            }

            return markers;
          })()}
        </MapContainer>

        {/* ── FLOATING CONTROLS (Top Right of Map) ── */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
          {/* Bộ chọn phong cách bản đồ */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-card border border-rose-100 p-1 flex items-center gap-1">
            {MAP_THEMES.map((theme) => {
              const isSelected = mapThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setMapThemeId(theme.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs"
                      : "text-stone-600 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                  title={`Chuyển sang nền ${theme.name}`}
                >
                  <span>{theme.icon}</span>
                  <span className="hidden sm:inline">{theme.name}</span>
                </button>
              );
            })}
          </div>

          {/* Locate Me Button */}
          <button
            type="button"
            id="locate-couple-btn"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-white/95 hover:bg-white text-stone-700 hover:text-rose-600 p-2.5 rounded-2xl shadow-card border border-rose-100 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer backdrop-blur-sm"
            title="Định vị vị trí hiện tại của hai đứa"
          >
            <Navigation
              className={`w-4 h-4 text-rose-500 ${
                isLocating ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isLocating ? "Đang tìm vị trí..." : "Vị trí của hai đứa"}
            </span>
          </button>

          {/* Reset View Button */}
          {mapBounds && (
            <button
              type="button"
              id="fit-all-markers-btn"
              onClick={() => setTargetFlyCoord(null)}
              className="bg-white/95 hover:bg-white text-stone-700 hover:text-rose-600 p-2.5 rounded-2xl shadow-card border border-rose-100 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
              title="Xem toàn bộ các địa điểm"
            >
              <Layers className="w-4 h-4 text-pink-500" />
              <span className="hidden sm:inline">Xem toàn cảnh</span>
            </button>
          )}

          {/* Share My Location Button */}
          <button
            type="button"
            id="share-location-map-btn"
            onClick={async () => {
              if (locSharing) return;
              setLocSharing(true);
              try {
                const loc = await onShareLocation?.();
                if (loc) {
                  setUserLocation([loc.lat, loc.lng]);
                  setTargetFlyCoord([loc.lat, loc.lng]);
                }
              } catch (err) {
                alert(err.message || "Không thể lấy vị trí.");
              } finally {
                setLocSharing(false);
              }
            }}
            disabled={locSharing}
            className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white p-2.5 rounded-2xl shadow-card flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Chia sẻ vị trí của tôi cho người ấy"
          >
            <Navigation
              className={`w-4 h-4 ${locSharing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {locSharing ? "Đang gửi..." : "Gửi vị trí cho người ấy"}
            </span>
          </button>
        </div>

        {/* ── BOTTOM DRAWER / CAROUSEL ── */}
        <div
          className={`absolute bottom-0 inset-x-0 z-10 transition-transform duration-300 ${
            showDrawer ? "translate-y-0" : "translate-y-[calc(100%-36px)]"
          }`}
        >
          {/* Drawer Toggle Handle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowDrawer((v) => !v)}
              className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-t-2xl shadow-md border-t border-x border-rose-100 text-xs text-stone-600 font-serif font-semibold flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <span>{showDrawer ? "Thu gọn danh sách" : "Xem danh sách quán"}</span>
              {showDrawer ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Drawer Content */}
          <div className="bg-white/95 backdrop-blur-md border-t border-rose-100/80 p-3 shadow-2xl">
            <div className="max-w-6xl mx-auto">
              {filteredPlaces.length === 0 ? (
                <p className="text-center text-xs text-stone-500 font-serif py-3">
                  Không tìm thấy địa điểm nào phù hợp với bộ lọc hiện tại.
                </p>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {filteredPlaces.map((place) => {
                    const isSelected = selectedPlaceId === place.id;
                    const cat =
                      CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.other;
                    const thumb =
                      place.relatedDate?.recap?.photos?.[0] ||
                      place.imageUrl ||
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&fit=crop&q=80";

                    return (
                      <div
                        key={place.id}
                        onClick={() => handleSelectPlace(place)}
                        className={`flex-shrink-0 w-52 sm:w-60 bg-white rounded-2xl p-2 border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center gap-2.5 ${
                          isSelected
                            ? "border-rose-400 ring-2 ring-rose-300 bg-rose-50/40"
                            : "border-stone-200/80 hover:border-rose-200"
                        }`}
                      >
                        <img
                          src={thumb}
                          alt={place.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-stone-100"
                        />
                        <div className="min-w-0 flex-1 font-serif">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{cat.emoji}</span>
                            <h4 className="font-display font-bold text-xs text-stone-800 truncate">
                              {place.name}
                            </h4>
                          </div>
                          <p className="text-[10px] text-stone-400 truncate mt-0.5">
                            {place.address}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                place.visited
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {place.visited ? "💖 Đã đến" : "📌 Dự định"}
                            </span>
                            <span className="text-[10px] text-amber-500 font-bold flex items-center">
                              ★ {place.rating || 5}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoveFootprintModal;
