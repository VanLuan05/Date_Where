import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Heart,
  Sparkles,
  MapPin,
  ChefHat,
  RotateCcw,
  Calendar,
  Check,
  ChevronRight,
  Navigation2,
  PartyPopper,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const CATEGORY_FALLBACK = {
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&fit=crop&q=80",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&fit=crop&q=80",
  entertainment: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&fit=crop&q=80",
  nature: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&fit=crop&q=80",
  other: "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=500&fit=crop&q=80",
};

const BlindMatchModal = ({
  isOpen,
  onClose,
  places = [],
  couple,
  activeUser,
  blindSwipes = {},
  onSwipe,
  onResetSwipes,
  onScheduleDate,
}) => {
  const [activeTab, setActiveTab] = useState("swipe"); // "swipe" | "matches"
  const [matchedCelebrationPlace, setMatchedCelebrationPlace] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState(null); // 'left' | 'right' | null
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const roleKey = activeUser === "user1" || activeUser === "userA" ? "user1" : "user2";
  const user1Data = couple?.user1 || couple?.userA;
  const user2Data = couple?.user2 || couple?.userB;

  // Lọc các quán mà activeUser CHƯA từng quẹt
  const unswipedPlaces = useMemo(() => {
    return places.filter((p) => {
      const swipeInfo = blindSwipes?.[p.id];
      return swipeInfo?.[roleKey] === undefined;
    });
  }, [places, blindSwipes, roleKey]);

  // Lọc các quán đã Match thành công giữa cả hai
  const matchedPlaces = useMemo(() => {
    return places.filter((p) => {
      return blindSwipes?.[p.id]?.matched === true;
    });
  }, [places, blindSwipes]);

  const currentPlace = unswipedPlaces[0];
  const nextPlace = unswipedPlaces[1];

  // Bắn pháo hoa khi modal mở màn hình Match
  useEffect(() => {
    if (matchedCelebrationPlace) {
      try {
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 },
        });
        const timeout = setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.5 },
          });
        }, 350);
        return () => clearTimeout(timeout);
      } catch (err) {
        console.log("Confetti error:", err);
      }
    }
  }, [matchedCelebrationPlace]);

  if (!isOpen) return null;

  // Xử lý hành động Like / Pass
  const handleAction = async (action) => {
    if (!currentPlace || flyOutDirection) return;

    setFlyOutDirection(action === "like" ? "right" : "left");

    // Đợi hiệu ứng bay hoàn tất
    setTimeout(async () => {
      const placeToSwipe = currentPlace;
      setDragOffset({ x: 0, y: 0 });
      setFlyOutDirection(null);

      const res = await onSwipe(placeToSwipe.id, action);
      if (res?.isMatch) {
        setMatchedCelebrationPlace(placeToSwipe);
      }
    }, 280);
  };

  // ── Drag & Touch Handlers ──────────────────────────────────────────────────
  const handleStart = (clientX, clientY) => {
    if (flyOutDirection) return;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging || flyOutDirection) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging || flyOutDirection) return;
    setIsDragging(false);

    if (dragOffset.x > 100) {
      handleAction("like");
    } else if (dragOffset.x < -100) {
      handleAction("pass");
    } else {
      // Trở về vị trí cũ
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Mouse Events
  const handleMouseDown = (e) => handleStart(e.clientX, e.clientY);
  const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
  const handleMouseUp = () => handleEnd();

  // Touch Events
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const handleTouchEnd = () => handleEnd();

  // Tính toán xoay và độ mờ
  const rotation = dragOffset.x * 0.08;
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / 80));
  const passOpacity = Math.min(1, Math.max(0, -dragOffset.x / 80));

  const cat = currentPlace ? CATEGORY_CONFIG[currentPlace.category] || CATEGORY_CONFIG.other : null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !matchedCelebrationPlace) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-slide-up border border-rose-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-romantic">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-800 text-lg leading-tight">
                Quẹt quán bí mật
              </h2>
              <p className="text-[11px] text-rose-500">Khám phá tâm đầu ý hợp 💕</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab selector */}
            <div className="flex bg-rose-100/70 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("swipe")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "swipe"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Quẹt quán ({unswipedPlaces.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === "matches"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                Đã Match ({matchedPlaces.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-rose-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── CELEBRATION MODAL OVERLAY ── */}
        {matchedCelebrationPlace && (
          <div className="absolute inset-0 z-50 bg-gradient-to-b from-rose-600/95 via-pink-600/95 to-rose-700/95 text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in backdrop-blur-md">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 animate-bounce-soft">
              <PartyPopper className="w-8 h-8 text-yellow-300" />
            </div>

            <span className="text-xs uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full font-bold mb-2">
              Match thành công!
            </span>

            <h3 className="font-display text-3xl font-extrabold mb-1">
              Tâm đầu ý hợp! 💕
            </h3>
            <p className="text-rose-100 text-xs max-w-xs mb-5">
              Cả hai đều đã chọn thích địa điểm này. Cùng lên lịch hẹn hò ngay thôi!
            </p>

            {/* Coupled Avatars */}
            <div className="flex items-center -space-x-3 mb-5">
              <img
                src={user1Data?.avatar}
                alt={user1Data?.name}
                className="w-14 h-14 rounded-full ring-4 ring-white shadow-xl object-cover bg-rose-200"
              />
              <div className="z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg text-rose-500">
                <Heart className="w-5 h-5 fill-rose-500 animate-heart-beat" />
              </div>
              <img
                src={user2Data?.avatar}
                alt={user2Data?.name}
                className="w-14 h-14 rounded-full ring-4 ring-white shadow-xl object-cover bg-blue-200"
              />
            </div>

            {/* Place Card Snapshot */}
            <div className="bg-white text-gray-800 rounded-2xl p-3.5 shadow-2xl max-w-xs w-full mb-6 border border-white/40">
              <div className="h-28 rounded-xl overflow-hidden mb-2 bg-rose-50">
                <img
                  src={
                    matchedCelebrationPlace.imageUrl ||
                    CATEGORY_FALLBACK[matchedCelebrationPlace.category] ||
                    CATEGORY_FALLBACK.other
                  }
                  alt={matchedCelebrationPlace.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-display font-bold text-base text-rose-800 truncate">
                {matchedCelebrationPlace.name}
              </h4>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                {matchedCelebrationPlace.address}
              </p>
            </div>

            {/* Actions */}
            <div className="w-full max-w-xs space-y-2.5">
              <button
                type="button"
                id="btn-schedule-from-match"
                onClick={() => {
                  onScheduleDate?.(matchedCelebrationPlace);
                  setMatchedCelebrationPlace(null);
                  onClose();
                }}
                className="w-full py-3 px-4 bg-white text-rose-600 hover:bg-rose-50 font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
              >
                <Calendar className="w-4 h-4" />
                Lên lịch hẹn ngay
              </button>

              <button
                type="button"
                id="btn-continue-swiping"
                onClick={() => setMatchedCelebrationPlace(null)}
                className="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl transition-all text-xs"
              >
                Tiếp tục quẹt quán
              </button>
            </div>
          </div>
        )}

        {/* ── BODY: SWIPE TAB ── */}
        {activeTab === "swipe" && (
          <div className="flex-1 p-5 flex flex-col items-center justify-between overflow-hidden min-h-[460px]">
            {currentPlace ? (
              <>
                {/* Progress Indicator */}
                <div className="w-full flex items-center justify-between text-xs text-gray-400 mb-2 px-1">
                  <span>
                    Còn <strong>{unswipedPlaces.length}</strong> quán chưa quẹt
                  </span>
                  <span className="text-rose-500 font-medium">Vuốt trái/phải hoặc bấm nút</span>
                </div>

                {/* Card Stack Deck */}
                <div className="relative w-full flex-1 flex items-center justify-center select-none py-1">
                  {/* Next Card in Stack (Underneath preview) */}
                  {nextPlace && (
                    <div className="absolute inset-x-2 top-3 bottom-0 bg-white rounded-3xl border border-rose-100 shadow-md scale-95 opacity-60 pointer-events-none overflow-hidden transition-all duration-300">
                      <div className="h-44 bg-rose-100 overflow-hidden">
                        <img
                          src={
                            nextPlace.imageUrl ||
                            CATEGORY_FALLBACK[nextPlace.category] ||
                            CATEGORY_FALLBACK.other
                          }
                          alt={nextPlace.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-bold text-lg text-gray-800 truncate">
                          {nextPlace.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{nextPlace.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Active Top Card */}
                  <div
                    ref={cardRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      transform: flyOutDirection
                        ? `translateX(${
                            flyOutDirection === "right" ? "120%" : "-120%"
                          }) rotate(${flyOutDirection === "right" ? 25 : -25}deg)`
                        : `translateX(${dragOffset.x}px) translateY(${
                            dragOffset.y * 0.25
                          }px) rotate(${rotation}deg)`,
                      transition: isDragging
                        ? "none"
                        : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    }}
                    className="relative w-full bg-white rounded-3xl border border-rose-200 shadow-card hover:shadow-card-hover overflow-hidden cursor-grab active:cursor-grabbing flex flex-col z-20 transition-shadow"
                  >
                    {/* Visual Stamp Badges when dragging */}
                    <div
                      style={{ opacity: likeOpacity }}
                      className="absolute top-5 left-5 z-30 pointer-events-none border-4 border-rose-500 bg-rose-500/10 text-rose-600 font-extrabold text-xl px-4 py-1.5 rounded-2xl rotate-[-15deg] backdrop-blur-xs tracking-wider"
                    >
                      THÍCH 💕
                    </div>

                    <div
                      style={{ opacity: passOpacity }}
                      className="absolute top-5 right-5 z-30 pointer-events-none border-4 border-gray-500 bg-gray-500/10 text-gray-600 font-extrabold text-xl px-4 py-1.5 rounded-2xl rotate-[15deg] backdrop-blur-xs tracking-wider"
                    >
                      BỎ QUA ❌
                    </div>

                    {/* Image */}
                    <div className="relative h-48 sm:h-52 bg-rose-100 overflow-hidden">
                      <img
                        src={
                          currentPlace.imageUrl ||
                          CATEGORY_FALLBACK[currentPlace.category] ||
                          CATEGORY_FALLBACK.other
                        }
                        alt={currentPlace.name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        <span className={`badge ${cat.color} backdrop-blur-sm shadow-sm`}>
                          {cat.emoji} {cat.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2 bg-gradient-to-b from-white to-rose-50/30 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-xl text-gray-900 leading-snug">
                          {currentPlace.name}
                        </h3>

                        <p className="text-xs text-gray-600 flex items-start gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{currentPlace.address}</span>
                        </p>
                      </div>

                      {/* Menu suggestions */}
                      {currentPlace.menuItems && currentPlace.menuItems.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 mb-1">
                            <ChefHat className="w-3 h-3 text-rose-500" />
                            Gợi ý món:
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                            {currentPlace.menuItems.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="bg-rose-100/70 text-rose-800 text-[10px] px-2 py-0.5 rounded-full"
                              >
                                {item}
                              </span>
                            ))}
                            {currentPlace.menuItems.length > 3 && (
                              <span className="text-[10px] text-gray-400 self-center">
                                +{currentPlace.menuItems.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes if available */}
                      {currentPlace.notes && (
                        <p className="text-[11px] text-gray-500 italic bg-white/70 p-2 rounded-xl border border-rose-100 line-clamp-2">
                          &ldquo;{currentPlace.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-8 pt-3 pb-1 w-full">
                  <button
                    type="button"
                    id="btn-swipe-pass"
                    onClick={() => handleAction("pass")}
                    className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 text-gray-500 border-2 border-gray-200 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
                    title="Bỏ qua (Vuốt trái)"
                  >
                    <X className="w-7 h-7" />
                  </button>

                  <button
                    type="button"
                    id="btn-swipe-like"
                    onClick={() => handleAction("like")}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-romantic flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
                    title="Thích quán này (Vuốt phải)"
                  >
                    <Heart className="w-8 h-8 fill-white" />
                  </button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl shadow-inner-rose animate-bounce-soft">
                  💌
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-gray-800">
                    Bạn đã quẹt hết các địa điểm!
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                    Hãy thêm địa điểm mới vào kho hoặc chờ đối phương vào quẹt để khám phá các quán
                    tâm đầu ý hợp nhé 💕
                  </p>
                </div>

                {matchedPlaces.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl w-full text-xs text-rose-700">
                    ✨ Hiện có <strong>{matchedPlaces.length}</strong> quán cả hai cùng thích!
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full pt-2">
                  {matchedPlaces.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("matches")}
                      className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      Xem các quán đã Match
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-reset-swipes"
                    onClick={onResetSwipes}
                    className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Chơi lại từ đầu (Reset lượt quẹt)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BODY: MATCHES TAB ── */}
        {activeTab === "matches" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-3 max-h-[60vh]">
            {matchedPlaces.length > 0 ? (
              matchedPlaces.map((place) => {
                const pCat = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.other;
                return (
                  <div
                    key={place.id}
                    className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 transition-all flex gap-3 items-center group"
                  >
                    <img
                      src={
                        place.imageUrl ||
                        CATEGORY_FALLBACK[place.category] ||
                        CATEGORY_FALLBACK.other
                      }
                      alt={place.name}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-rose-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold ${pCat.color} px-2 py-0.5 rounded-full`}>
                          {pCat.emoji} {pCat.label}
                        </span>
                        <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Đã Match
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-gray-800 truncate mt-0.5">
                        {place.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate">{place.address}</p>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onScheduleDate?.(place);
                          onClose();
                        }}
                        className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-sm flex items-center justify-center"
                        title="Lên lịch hẹn quán này"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-3xl">
                  💔
                </div>
                <h4 className="font-display font-bold text-base text-gray-700">
                  Chưa có quán nào được Match
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Hãy tiếp tục quẹt quán và gửi lời nhắn để người ấy cùng vào quẹt nhé!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("swipe")}
                  className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1 mt-2"
                >
                  Quay lại quẹt quán <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlindMatchModal;
