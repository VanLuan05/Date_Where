import { useState, useEffect, useRef } from "react";
import {
  X,
  Heart,
  Camera,
  Trash2,
  Sparkles,
  UtensilsCrossed,
  Smile,
  Loader2,
  Calendar,
  MapPin,
  Check,
  Coins,
  Wallet,
} from "lucide-react";
import confetti from "canvas-confetti";
import { compressImage, getBase64SizeInKB } from "../utils/imageCompressor.js";
import { formatDate, formatCurrency } from "../utils/helpers.js";

const RATING_DESCRIPTIONS = {
  1: "Cần cải thiện thêm chút 💔",
  2: "Cũng tàm tạm thôi ☕",
  3: "Buổi hẹn ấm áp vừa vặn 🌸",
  4: "Rất vui và ngọt ngào! 💕",
  5: "Tuyệt vời không thể quên! 💖✨",
};

const DateRecapModal = ({
  isOpen,
  onClose,
  dateItem,
  onSave,
  currentUser = "user1",
  couple,
}) => {
  const [photos, setPhotos] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [foodReview, setFoodReview] = useState("");
  const [bestMoment, setBestMoment] = useState("");
  const [actualCost, setActualCost] = useState(0);
  const [paidBy, setPaidBy] = useState("split");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMessage, setCompressionMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  const user1Name = couple?.user1?.name || couple?.userA?.name || "Bạn Nam";
  const user2Name = couple?.user2?.name || couple?.userB?.name || "Bạn Nữ";

  // Initialize form with existing recap data if any
  useEffect(() => {
    if (isOpen && dateItem) {
      const existingRecap = dateItem.recap || {};
      const existingBudget = dateItem.budget || {};

      setPhotos(Array.isArray(existingRecap.photos) ? [...existingRecap.photos] : []);
      setRating(typeof existingRecap.rating === "number" ? existingRecap.rating : 5);
      setFoodReview(existingRecap.foodReview || "");
      setBestMoment(existingRecap.bestMoment || "");

      // Initial actual cost: fallback to estimatedCost if actualCost is 0
      const initialCost =
        existingBudget.actualCost > 0
          ? existingBudget.actualCost
          : existingBudget.estimatedCost || 0;
      setActualCost(initialCost);
      setPaidBy(existingBudget.paidBy || "split");

      setErrorMessage("");
      setIsSaving(false);
      setIsCompressing(false);
    }
  }, [isOpen, dateItem]);

  if (!isOpen || !dateItem) return null;

  const handleFilesChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const availableSlots = 3 - photos.length;
    if (availableSlots <= 0) {
      setErrorMessage("Đã đạt giới hạn tối đa 3 ảnh kỷ niệm.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = rawFiles.slice(0, availableSlots);
    if (rawFiles.length > availableSlots) {
      setErrorMessage(`Chỉ có thể chọn thêm ${availableSlots} ảnh.`);
    } else {
      setErrorMessage("");
    }

    setIsCompressing(true);
    try {
      const compressedResults = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        setCompressionMessage(`Đang nén & tối ưu ảnh ${i + 1}/${filesToProcess.length}... ✨`);
        const b64 = await compressImage(filesToProcess[i], 700, 0.65);
        compressedResults.push(b64);
      }

      setPhotos((prev) => [...prev, ...compressedResults].slice(0, 3));
    } catch (err) {
      console.error("Lỗi nén ảnh:", err);
      setErrorMessage("Không thể xử lý ảnh từ thiết bị. Vui lòng thử lại với ảnh khác!");
    } finally {
      setIsCompressing(false);
      setCompressionMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#fda4af", "#fb7185", "#f43f5e", "#fbcfe8", "#f472b6"],
        });
      } catch (confettiErr) {
        console.log("Confetti trigger:", confettiErr);
      }

      await onSave(dateItem.id, {
        photos,
        rating,
        foodReview: foodReview.trim(),
        bestMoment: bestMoment.trim(),
        completedAt: new Date().toISOString(),
        updatedBy: currentUser,
        budget: {
          estimatedCost: Number(dateItem.budget?.estimatedCost) || 0,
          actualCost: Math.max(0, Number(actualCost) || 0),
          paidBy: paidBy || "split",
        },
      });

      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu kỷ niệm:", err);
      setErrorMessage("Có lỗi xảy ra khi lưu kỷ niệm. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving && !isCompressing) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-rose-100 animate-slide-up">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-rose-100 bg-gradient-to-br from-rose-50/70 via-pink-50/40 to-white">
          <button
            onClick={onClose}
            disabled={isSaving || isCompressing}
            className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Nhật ký & Album kỷ niệm</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-stone-800 mt-1">
            Ghi dấu khoảnh khắc hẹn hò
          </h2>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500 font-serif">
            <span className="flex items-center gap-1 font-medium text-rose-700">
              <MapPin className="w-3.5 h-3.5" />
              {dateItem.placeName}
            </span>
            {dateItem.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(dateItem.date)}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-stone-700 font-serif">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
              {errorMessage}
            </div>
          )}

          {/* 1. Rating */}
          <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100 text-center">
            <label className="block text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2">
              Chấm điểm buổi hẹn hôm nay
            </label>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  id={`rating-heart-${star}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 transition-transform hover:scale-125 active:scale-95 duration-150 focus:outline-none"
                  aria-label={`${star} sao`}
                >
                  <Heart
                    className={`w-8 h-8 transition-colors ${
                      (hoverRating || rating) >= star
                        ? "fill-rose-500 text-rose-500 drop-shadow-sm"
                        : "text-stone-300 hover:text-rose-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-rose-600 mt-2 min-h-[20px] transition-all">
              {RATING_DESCRIPTIONS[hoverRating || rating]}
            </p>
          </div>

          {/* 2. Photo Upload & Preview Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-500" />
                Ảnh kỷ niệm thực tế ({photos.length}/3)
              </label>
              <span className="text-xs text-stone-400 font-sans">Tối đa 3 ảnh • Nén tự động</span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />

            {/* Photos Grid */}
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => {
                const sizeKb = getBase64SizeInKB(photo);
                return (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-rose-100 bg-stone-100 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <img
                      src={photo}
                      alt={`Kỷ niệm ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {sizeKb > 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-xs font-mono">
                        {sizeKb} KB
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {photos.length < 3 && (
                <button
                  type="button"
                  id="add-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="aspect-square rounded-2xl border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-50/70 transition-all flex flex-col items-center justify-center gap-1.5 text-stone-500 hover:text-rose-600 p-2 group"
                >
                  <div className="w-9 h-9 rounded-full bg-rose-100/80 group-hover:bg-rose-200/80 flex items-center justify-center transition-colors">
                    <Camera className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-[11px] font-sans font-medium text-center leading-tight">
                    Chọn ảnh
                    <span className="block text-[10px] text-stone-400">từ máy</span>
                  </span>
                </button>
              )}
            </div>

            {isCompressing && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50/80 p-2.5 rounded-xl animate-pulse font-sans">
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                <span>{compressionMessage || "Đang xử lý ảnh..."}</span>
              </div>
            )}
          </div>

          {/* 3. Chi phí thực tế & Ai thanh toán */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-3 font-serif">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                Chi phí thực tế của buổi hẹn
              </label>
              {(dateItem?.budget?.estimatedCost ?? 0) > 0 && (
                <span className="text-[11px] text-stone-500 font-sans">
                  Dự tính: {formatCurrency(dateItem?.budget?.estimatedCost || 0)}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="recap-actual-cost"
                type="number"
                min="0"
                step="10000"
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-sans transition-all bg-white font-semibold text-stone-800 pr-24"
                placeholder="Nhập số tiền thực tế (VNĐ)"
                value={actualCost || ""}
                onChange={(e) => setActualCost(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 font-sans pointer-events-none">
                {formatCurrency(actualCost)}
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs">
              <span className="text-[11px] text-stone-400 mr-1">Gợi ý nhanh:</span>
              {[100000, 200000, 350000, 500000, 1000000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setActualCost(val)}
                  className={`px-2.5 py-1 rounded-xl border text-xs transition-colors ${
                    actualCost === val
                      ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                      : "bg-white text-stone-600 border-stone-200 hover:border-emerald-300"
                  }`}
                >
                  {val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                </button>
              ))}
            </div>

            {/* Paid By Toggle */}
            <div className="pt-1 space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-stone-500" />
                Ai là người thanh toán?
              </label>
              <div className="grid grid-cols-3 gap-2 font-sans text-xs">
                <button
                  type="button"
                  id="paid-by-user1"
                  onClick={() => setPaidBy("user1")}
                  className={`py-2 px-2 rounded-xl border text-center font-medium transition-all ${
                    paidBy === "user1"
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm font-semibold"
                      : "bg-white text-stone-600 border-stone-200 hover:border-rose-300"
                  }`}
                >
                  👤 {user1Name} trả
                </button>
                <button
                  type="button"
                  id="paid-by-user2"
                  onClick={() => setPaidBy("user2")}
                  className={`py-2 px-2 rounded-xl border text-center font-medium transition-all ${
                    paidBy === "user2"
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm font-semibold"
                      : "bg-white text-stone-600 border-stone-200 hover:border-rose-300"
                  }`}
                >
                  👤 {user2Name} trả
                </button>
                <button
                  type="button"
                  id="paid-by-split"
                  onClick={() => setPaidBy("split")}
                  className={`py-2 px-2 rounded-xl border text-center font-medium transition-all ${
                    paidBy === "split"
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm font-semibold"
                      : "bg-white text-stone-600 border-stone-200 hover:border-rose-300"
                  }`}
                >
                  🤝 Chia đôi (50/50)
                </button>
              </div>
            </div>
          </div>

          {/* 4. Food / Drink Review */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-rose-500" />
              Đồ ăn & Thức uống hôm nay thế nào?
            </label>
            <textarea
              id="recap-food-review"
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm font-sans transition-all placeholder:text-stone-300 resize-none bg-stone-50/40 focus:bg-white"
              placeholder="Món bắp bò siêu ngon, trà sữa hơi ngọt tí..."
              value={foodReview}
              onChange={(e) => setFoodReview(e.target.value)}
            />
          </div>

          {/* 5. Best Moment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-rose-500" />
              Khoảnh khắc đáng nhớ nhất ✨
            </label>
            <textarea
              id="recap-best-moment"
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm font-sans transition-all placeholder:text-stone-300 resize-none bg-stone-50/40 focus:bg-white"
              placeholder="Lúc hai đứa cùng trú mưa dưới hiên quán, chia nhau ly trà nóng..."
              value={bestMoment}
              onChange={(e) => setBestMoment(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3 font-sans">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isCompressing}
              className="btn-secondary flex-1 py-3 text-sm font-medium"
            >
              Để sau
            </button>
            <button
              type="submit"
              id="save-recap-btn"
              disabled={isSaving || isCompressing}
              className="btn-primary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-200/50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Lưu kỷ niệm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DateRecapModal;
