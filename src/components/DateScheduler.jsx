import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  X,
  Check,
  Trash2,
  Edit3,
  Shuffle,
  StickyNote,
  Shirt,
  Heart,
  Camera,
  Sparkles,
  BookOpen,
  UtensilsCrossed,
  Smile,
  Maximize2,
  Coins,
  CalendarHeart,
} from "lucide-react";
import { isUpcoming, formatCurrency } from "../utils/helpers.js";
import EmptyState from "./EmptyState.jsx";
import RandomPickerModal from "./RandomPickerModal.jsx";

const DateRecapModal = lazy(() => import("./DateRecapModal.jsx"));

const EMPTY_DATE_FORM = {
  placeId: "",
  placeName: "",
  date: "",
  time: "",
  notes: "",
  dressCode: "",
  estimatedCost: "",
};

const STATUS_CONFIG = {
  upcoming: { label: "Sắp tới", color: "bg-rose-100 text-rose-700 border-rose-200" },
  completed: { label: "Đã hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const DateScheduler = ({
  dates = [],
  places = [],
  couple,
  currentUser = "user1",
  onAddDate,
  onUpdateDate,
  onDeleteDate,
  onSaveRecap,
  initialPlace,
  onClearInitialPlace,
  onOpenAvailability,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [form, setForm] = useState(EMPTY_DATE_FORM);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "completed" | "all" | "cancelled"
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const user1Name = couple?.user1?.name || couple?.userA?.name || "Bạn Nam";
  const user2Name = couple?.user2?.name || couple?.userB?.name || "Bạn Nữ";

  // Date Recap & Lightbox State
  const [recapModalDate, setRecapModalDate] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    if (initialPlace) {
      setForm({
        ...EMPTY_DATE_FORM,
        placeId: initialPlace.id || "",
        placeName: initialPlace.name || "",
        date: initialPlace.prefillDate || "",
        time: initialPlace.prefillTime || "",
      });
      setShowForm(true);
      onClearInitialPlace?.();
    }
  }, [initialPlace, onClearInitialPlace]);

  // Derived filter categories
  const upcoming = useMemo(
    () =>
      dates
        .filter((d) => d.status !== "cancelled" && d.status !== "completed" && isUpcoming(d.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [dates]
  );

  const completed = useMemo(
    () =>
      dates
        .filter((d) => d.status === "completed")
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [dates]
  );

  const cancelled = useMemo(
    () => dates.filter((d) => d.status === "cancelled"),
    [dates]
  );

  const allDates = useMemo(
    () =>
      [...dates].sort((a, b) => {
        // Sort upcoming first, then recent
        if (a.status === "upcoming" && b.status !== "upcoming") return -1;
        if (b.status === "upcoming" && a.status !== "upcoming") return 1;
        return new Date(b.date || 0) - new Date(a.date || 0);
      }),
    [dates]
  );

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSelectPlace = (placeId) => {
    const place = places.find((p) => p.id === placeId);
    setForm((prev) => ({ ...prev, placeId, placeName: place?.name || "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.date) e.date = "Vui lòng chọn ngày";
    if (!form.placeId) e.placeId = "Vui lòng chọn địa điểm";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    if (editingDate) {
      onUpdateDate(editingDate.id, {
        ...form,
        budget: {
          estimatedCost: Math.max(0, parseInt(form.estimatedCost) || 0),
          actualCost: editingDate?.budget?.actualCost || 0,
          paidBy: editingDate?.budget?.paidBy || "split",
        },
      });
    } else {
      onAddDate({
        ...form,
        budget: {
          estimatedCost: Math.max(0, parseInt(form.estimatedCost) || 0),
          actualCost: 0,
          paidBy: "split",
        },
      });
    }
    setForm(EMPTY_DATE_FORM);
    setErrors({});
    setShowForm(false);
    setEditingDate(null);
  };

  const handleEdit = (dateItem) => {
    setEditingDate(dateItem);
    setForm({
      placeId: dateItem.placeId,
      placeName: dateItem.placeName,
      date: dateItem.date,
      time: dateItem.time || "",
      notes: dateItem.notes || "",
      dressCode: dateItem.dressCode || "",
      estimatedCost: dateItem?.budget?.estimatedCost || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "completed") {
      // Find date item and open recap modal directly
      const item = dates.find((d) => d.id === id);
      if (item) {
        setRecapModalDate(item);
        return;
      }
    }
    onUpdateDate(id, { status: newStatus });
  };

  const handleDelete = (id) => {
    onDeleteDate(id);
    setConfirmDeleteId(null);
  };

  const displayedDates = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return upcoming;
      case "completed":
        return completed;
      case "cancelled":
        return cancelled;
      case "all":
      default:
        return allDates;
    }
  }, [activeTab, upcoming, completed, cancelled, allDates]);

  const createdByUser = (dateItem) => {
    const creatorKey = dateItem.createdBy;
    return (
      couple?.[creatorKey] ||
      couple?.[creatorKey === "user1" ? "userA" : creatorKey === "user2" ? "userB" : "user1"]
    );
  };

  return (
    <div className="space-y-5 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="section-title">Lịch hẹn & Nhật ký 💑</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {upcoming.length} buổi hẹn sắp tới • {completed.length} nhật ký kỷ niệm
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            id="availability-match-btn"
            onClick={onOpenAvailability}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white flex items-center gap-2 py-2 px-3.5 text-sm font-semibold rounded-2xl shadow-sm transition-all active:scale-95"
            title="Tìm ngày cùng rảnh"
          >
            <CalendarHeart className="w-4 h-4" />
            <span className="hidden sm:inline">Tìm ngày cùng rảnh</span>
            <span className="sm:hidden">Lịch rảnh</span>
          </button>
          <button
            id="random-picker-btn"
            onClick={() => setShowRandom(true)}
            className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm"
            title="Chưa biết đi đâu? Bốc thăm địa điểm ngẫu nhiên"
          >
            <Shuffle className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">Quay quán</span>
          </button>
          <button
            id="add-date-btn"
            onClick={() => {
              setEditingDate(null);
              setForm(EMPTY_DATE_FORM);
              setShowForm(!showForm);
            }}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lịch hẹn</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal/Card */}
      {showForm && (
        <div className="card-static p-5 space-y-4 border-2 border-rose-200 animate-slide-up bg-white/95 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-rose-700 flex items-center gap-2 font-display text-lg">
              <Calendar className="w-4 h-4" />
              {editingDate ? "Chỉnh sửa lịch hẹn" : "Lên kế hoạch hẹn hò mới"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingDate(null);
              }}
              className="btn-ghost p-1.5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-600 mb-1">📅 Ngày hẹn *</label>
              <input
                id="date-picker"
                type="date"
                className={`w-full min-w-0 px-3 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none appearance-none ${
                  errors.date ? "border-red-400" : "border-rose-200"
                }`}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-600 mb-1">⏰ Giờ hẹn</label>
              <input
                id="time-picker"
                type="time"
                className="w-full min-w-0 px-3 py-2.5 text-sm bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none appearance-none"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-500" />
              Địa điểm *
            </label>
            <select
              id="place-select"
              className={`select-field ${errors.placeId ? "border-red-400" : ""}`}
              value={form.placeId}
              onChange={(e) => handleSelectPlace(e.target.value)}
            >
              <option value="">-- Chọn địa điểm từ danh sách --</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.placeId && <p className="text-xs text-red-500 mt-1">{errors.placeId}</p>}
          </div>

          {/* Dress Code */}
          <div>
            <label className="label">
              <Shirt className="w-3.5 h-3.5 inline mr-1 text-purple-500" />
              Trang phục gợi ý (Dress code)
            </label>
            <input
              id="dress-code"
              className="input-field"
              placeholder="VD: Trắng giản dị, váy hoa pastel, thoải mái..."
              value={form.dressCode}
              onChange={(e) => set("dressCode", e.target.value)}
            />
          </div>

          {/* Chi phí dự tính */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0 flex items-center gap-1.5 text-xs">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                Chi phí dự tính (VNĐ)
              </label>
              {Number(form.estimatedCost) > 0 && (
                <span className="text-xs font-semibold text-rose-600 font-sans">
                  {formatCurrency(form.estimatedCost)}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <input
                id="estimated-cost"
                type="number"
                min="0"
                step="10000"
                className="input-field"
                placeholder="Ví dụ: 300000"
                value={form.estimatedCost}
                onChange={(e) => set("estimatedCost", e.target.value)}
              />
              <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs">
                <span className="text-stone-400 text-[11px]">Gợi ý nhanh:</span>
                {[100000, 200000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set("estimatedCost", val)}
                    className={`px-2.5 py-1 rounded-xl border text-xs transition-colors ${
                      Number(form.estimatedCost) === val
                        ? "bg-rose-500 text-white border-rose-500 font-semibold"
                        : "bg-white text-stone-600 border-stone-200 hover:border-rose-300"
                    }`}
                  >
                    {val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">
              <StickyNote className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              Ghi chú & Kế hoạch
            </label>
            <textarea
              id="date-notes"
              className="input-field resize-none"
              rows={2}
              placeholder="Lưu ý đặt bàn trước, mang máy ảnh chụp hình..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              id="save-date-btn"
              onClick={handleSave}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-semibold shadow-sm"
            >
              <Check className="w-4 h-4" />
              {editingDate ? "Lưu thay đổi" : "Lên lịch hẹn ngay"}
            </button>
            <button
              id="cancel-date-btn"
              onClick={() => {
                setShowForm(false);
                setEditingDate(null);
              }}
              className="btn-secondary px-5 py-3"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Quick Filter Bar (Bộ lọc nhanh gọn gàng) */}
      <div className="flex gap-1.5 bg-rose-50/70 p-1.5 rounded-2xl border border-rose-100 overflow-x-auto scrollbar-none">
        <button
          id="tab-upcoming"
          onClick={() => setActiveTab("upcoming")}
          className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 font-medium transition-all ${
            activeTab === "upcoming" ? "tab-btn-active font-semibold shadow-xs" : "tab-btn-inactive"
          }`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          id="tab-completed"
          onClick={() => setActiveTab("completed")}
          className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 flex items-center justify-center gap-1.5 font-medium transition-all ${
            activeTab === "completed" ? "tab-btn-active font-semibold shadow-xs" : "tab-btn-inactive"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Nhật ký kỷ niệm ({completed.length})
        </button>
        <button
          id="tab-all"
          onClick={() => setActiveTab("all")}
          className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 font-medium transition-all ${
            activeTab === "all" ? "tab-btn-active font-semibold shadow-xs" : "tab-btn-inactive"
          }`}
        >
          Tất cả ({allDates.length})
        </button>
        {cancelled.length > 0 && (
          <button
            id="tab-cancelled"
            onClick={() => setActiveTab("cancelled")}
            className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 font-medium transition-all ${
              activeTab === "cancelled" ? "tab-btn-active font-semibold shadow-xs" : "tab-btn-inactive"
            }`}
          >
            Đã hủy ({cancelled.length})
          </button>
        )}
      </div>

      {/* Date List Container */}
      {displayedDates.length > 0 ? (
        <div className="space-y-4">
          {displayedDates.map((dateItem) => {
            const isCompleted = dateItem.status === "completed";
            const recap = dateItem.recap;
            const creator = createdByUser(dateItem);
            const statusCfg = STATUS_CONFIG[dateItem.status] || STATUS_CONFIG.upcoming;

            // ─── THẺ KỶ NIỆM (POLAROID / MEMORY CARD) CHO BUỔI HẸN ĐÃ HOÀN THÀNH ───
            if (isCompleted) {
              const photos = recap?.photos || [];
              const rating = recap?.rating || 5;

              return (
                <div
                  key={dateItem.id}
                  id={`memory-card-${dateItem.id}`}
                  className="bg-white rounded-3xl border-2 border-rose-100 shadow-card hover:shadow-card-hover transition-all duration-300 p-5 space-y-4 animate-fade-in group"
                >
                  {/* Top Bar: Title, Place, Date & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Date Badge */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex flex-col items-center justify-center flex-shrink-0 text-white shadow-sm">
                        <span className="text-[10px] font-bold tracking-wider uppercase leading-none">
                          {dateItem.date
                            ? new Date(dateItem.date + "T00:00:00").toLocaleDateString("vi-VN", {
                                month: "short",
                              })
                            : "--"}
                        </span>
                        <span className="text-lg font-display font-bold leading-none mt-0.5">
                          {dateItem.date ? new Date(dateItem.date + "T00:00:00").getDate() : "--"}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-stone-800 text-base leading-snug">
                            {dateItem.placeName}
                          </h4>
                          {recap ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3 text-rose-500" />
                              Đã lưu vào nhật ký
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              Chờ viết nhật ký ✍️
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-stone-500 font-serif flex-wrap">
                          {dateItem.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" /> {dateItem.time}
                            </span>
                          )}
                          {creator && (
                            <span className="flex items-center gap-1">
                              <img
                                src={creator.avatar}
                                alt={creator.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              {creator.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5-Heart Rating Display */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-0.5" title={`Đánh giá: ${rating}/5 tim`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Heart
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rating
                                ? "fill-rose-500 text-rose-500"
                                : "text-stone-200 fill-stone-100"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400 font-serif mt-0.5">
                        {rating}/5 điểm ngọt ngào
                      </span>
                    </div>
                  </div>

                  {/* Photo Album Strip */}
                  {photos.length > 0 ? (
                    <div className="space-y-1">
                      {photos.length === 1 && (
                        <div
                          onClick={() => setLightboxPhoto(photos[0])}
                          className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden relative cursor-pointer group/photo border border-rose-100/80 shadow-xs bg-stone-100"
                          title="Bấm để phóng to ảnh"
                        >
                          <img
                            src={photos[0]}
                            alt="Ảnh kỷ niệm"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-stone-900/0 group-hover/photo:bg-stone-900/20 transition-colors flex items-center justify-center">
                            <span className="bg-black/50 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center gap-1.5 font-sans">
                              <Maximize2 className="w-3.5 h-3.5" /> Xem rõ nét
                            </span>
                          </div>
                        </div>
                      )}

                      {photos.length === 2 && (
                        <div className="grid grid-cols-2 gap-2.5 h-40 sm:h-48">
                          {photos.map((p, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxPhoto(p)}
                              className="w-full h-full rounded-2xl overflow-hidden relative cursor-pointer group/photo border border-rose-100/80 shadow-xs bg-stone-100"
                              title="Bấm để phóng to ảnh"
                            >
                              <img
                                src={p}
                                alt={`Ảnh kỷ niệm ${idx + 1}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-stone-900/0 group-hover/photo:bg-stone-900/20 transition-colors flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {photos.length >= 3 && (
                        <div className="grid grid-cols-3 gap-2.5 h-44 sm:h-52">
                          <div
                            onClick={() => setLightboxPhoto(photos[0])}
                            className="col-span-2 h-full rounded-2xl overflow-hidden relative cursor-pointer group/photo border border-rose-100/80 shadow-xs bg-stone-100"
                            title="Bấm để phóng to ảnh"
                          >
                            <img
                              src={photos[0]}
                              alt="Ảnh kỷ niệm nổi bật"
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-stone-900/0 group-hover/photo:bg-stone-900/20 transition-colors flex items-center justify-center">
                              <span className="bg-black/50 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center gap-1 font-sans">
                                <Maximize2 className="w-3.5 h-3.5" /> Xem ảnh
                              </span>
                            </div>
                          </div>

                          <div className="col-span-1 grid grid-rows-2 gap-2.5 h-full">
                            {photos.slice(1, 3).map((p, idx) => (
                              <div
                                key={idx}
                                onClick={() => setLightboxPhoto(p)}
                                className="w-full h-full rounded-2xl overflow-hidden relative cursor-pointer group/photo border border-rose-100/80 shadow-xs bg-stone-100"
                                title="Bấm để phóng to ảnh"
                              >
                                <img
                                  src={p}
                                  alt={`Ảnh kỷ niệm ${idx + 2}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-stone-900/0 group-hover/photo:bg-stone-900/20 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => setRecapModalDate(dateItem)}
                      className="border border-dashed border-rose-200 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                    >
                      <Camera className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                      <p className="text-xs text-rose-700 font-medium">Chưa có ảnh check-in thực tế</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Nhấn để thêm 1 - 3 tấm ảnh lưu giữ khoảnh khắc này nhé!
                      </p>
                    </div>
                  )}

                  {/* Cảm nhận & Khoảnh khắc đáng nhớ */}
                  {(recap?.foodReview || recap?.bestMoment) && (
                    <div className="space-y-2 pt-1 font-serif">
                      {recap.foodReview && (
                        <div className="bg-amber-50/70 border border-amber-100/90 rounded-2xl p-3 text-xs text-stone-700 leading-relaxed">
                          <span className="font-semibold text-amber-900 flex items-center gap-1.5 mb-0.5 not-italic">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                            Đồ ăn & Thức uống:
                          </span>
                          <p className="italic text-stone-700 pl-5">"{recap.foodReview}"</p>
                        </div>
                      )}

                      {recap.bestMoment && (
                        <div className="bg-rose-50/70 border border-rose-100/90 rounded-2xl p-3 text-xs text-stone-700 leading-relaxed">
                          <span className="font-semibold text-rose-900 flex items-center gap-1.5 mb-0.5 not-italic">
                            <Smile className="w-3.5 h-3.5 text-rose-600" />
                            Khoảnh khắc đáng nhớ nhất:
                          </span>
                          <p className="italic text-stone-700 pl-5">"{recap.bestMoment}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {dateItem.notes && !recap?.bestMoment && (
                    <p className="text-xs text-stone-500 font-serif italic bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      Ghi chú: {dateItem.notes}
                    </p>
                  )}

                  {/* Thông tin chi phí */}
                  {((dateItem?.budget?.actualCost ?? 0) > 0 || (dateItem?.budget?.estimatedCost ?? 0) > 0) && (
                    <div className="flex items-center gap-2 flex-wrap text-xs font-serif pt-1">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl font-medium">
                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                        <strong>Thực tế:</strong> {formatCurrency(dateItem?.budget?.actualCost || dateItem?.budget?.estimatedCost || 0)}
                      </span>
                      {dateItem?.budget?.paidBy && (
                        <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200 text-[11px] font-sans">
                          {dateItem.budget.paidBy === "user1"
                            ? `👤 ${user1Name} trả`
                            : dateItem.budget.paidBy === "user2"
                            ? `👤 ${user2Name} trả`
                            : "🤝 Chia đôi 50/50"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      id={`recap-btn-${dateItem.id}`}
                      onClick={() => setRecapModalDate(dateItem)}
                      className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{recap ? "Xem & Sửa nhật ký" : "Viết nhật ký ngay"}</span>
                    </button>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleStatusChange(dateItem.id, "upcoming")}
                        className="text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-colors"
                        title="Đổi lại trạng thái sắp tới"
                      >
                        Chuyển về Sắp tới
                      </button>
                      <button
                        onClick={() => handleEdit(dateItem)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Chỉnh sửa thông tin buổi hẹn"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(dateItem.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa kỷ niệm này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // ─── THẺ LỊCH HẸN GỌN GÀNG (SẮP TỚI HOẶC ĐÃ HỦY) ───
            return (
              <div
                key={dateItem.id}
                className={`bg-white rounded-3xl border border-rose-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                  dateItem.status === "cancelled" ? "opacity-60 bg-stone-50/80" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Date Block */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                      dateItem.status === "cancelled"
                        ? "bg-stone-200 text-stone-500"
                        : "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {dateItem.date
                        ? new Date(dateItem.date + "T00:00:00").toLocaleDateString("vi-VN", {
                            month: "short",
                          })
                        : "--"}
                    </span>
                    <span className="text-lg font-display font-bold leading-none mt-0.5">
                      {dateItem.date ? new Date(dateItem.date + "T00:00:00").getDate() : "--"}
                    </span>
                  </div>

                  {/* Date Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-stone-800 text-base leading-snug">
                        {dateItem.placeName}
                      </h4>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-stone-500 font-serif">
                      {dateItem.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" /> {dateItem.time}
                        </span>
                      )}
                      {creator && (
                        <span className="flex items-center gap-1.5">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          {creator.name}
                        </span>
                      )}
                      {dateItem.dressCode && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-full font-sans text-xs">
                          <Shirt className="w-3 h-3 text-purple-500" /> {dateItem.dressCode}
                        </span>
                      )}
                      {(dateItem?.budget?.estimatedCost ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-sans text-xs font-medium">
                          <Coins className="w-3 h-3 text-amber-600" />
                          Dự tính: {formatCurrency(dateItem?.budget?.estimatedCost || 0)}
                        </span>
                      )}
                    </div>

                    {dateItem.notes && (
                      <p className="text-xs text-stone-600 font-serif mt-2 bg-stone-50/80 px-3 py-2 rounded-xl border border-stone-100">
                        {dateItem.notes}
                      </p>
                    )}

                    {/* Direct Action Row on Card */}
                    <div className="mt-3.5 pt-3 border-t border-rose-100/60 flex items-center justify-between gap-2 flex-wrap">
                      {dateItem.status !== "cancelled" ? (
                        <div className="flex items-center gap-2">
                          <button
                            id={`complete-date-${dateItem.id}`}
                            onClick={() => handleStatusChange(dateItem.id, "completed")}
                            className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                            title="Hoàn thành buổi hẹn & tải ảnh lưu nhật ký"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Viết nhật ký ✨</span>
                          </button>
                          <button
                            id={`cancel-date-status-${dateItem.id}`}
                            onClick={() => handleStatusChange(dateItem.id, "cancelled")}
                            className="text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-100 px-2.5 py-1.5 rounded-xl transition-colors font-sans"
                            title="Hủy hẹn"
                          >
                            Hủy hẹn
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(dateItem.id, "upcoming")}
                          className="text-xs text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors font-medium font-sans"
                        >
                          Khôi phục lịch hẹn
                        </button>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          id={`edit-date-${dateItem.id}`}
                          onClick={() => handleEdit(dateItem)}
                          className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Chỉnh sửa lịch hẹn"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-date-${dateItem.id}`}
                          onClick={() => setConfirmDeleteId(dateItem.id)}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa lịch hẹn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          illustration={activeTab === "completed" ? "📖" : activeTab === "upcoming" ? "📅" : "💌"}
          title={
            activeTab === "completed"
              ? "Chưa có trang nhật ký kỷ niệm nào"
              : activeTab === "upcoming"
              ? "Chưa có buổi hẹn nào sắp tới"
              : "Danh sách lịch hẹn đang trống"
          }
          desc={
            activeTab === "completed"
              ? "Sau mỗi buổi hẹn hò, hãy bấm 'Viết nhật ký' để tải ảnh check-in và lưu lại những khoảnh khắc ngọt ngào nhé!"
              : "Hãy cùng nhau lên kế hoạch cho buổi hẹn tiếp theo thật ngọt ngào nào!"
          }
          actionLabel="+ Tạo lịch hẹn ngay"
          onAction={() => {
            setEditingDate(null);
            setForm(EMPTY_DATE_FORM);
            setShowForm(true);
          }}
        />
      )}

      {/* Lightbox Modal Phóng To Ảnh */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-12 right-0 sm:right-2 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
              <img
                src={lightboxPhoto}
                alt="Ảnh kỷ niệm phóng to"
                className="max-h-[82vh] max-w-full object-contain rounded-2xl"
              />
            </div>
            <p className="text-white/60 text-xs mt-3 font-serif">Nhấp vào vùng ngoài ảnh để đóng</p>
          </div>
        </div>
      )}

      {/* Modal Viết / Sửa Nhật Ký Kỷ Niệm (DateRecapModal, lazy) */}
      {recapModalDate && (
        <Suspense fallback={null}>
          <DateRecapModal
            isOpen={Boolean(recapModalDate)}
            onClose={() => setRecapModalDate(null)}
            dateItem={recapModalDate}
            currentUser={currentUser}
            couple={couple}
            onSave={async (dateId, recapData) => {
              if (onSaveRecap) {
                await onSaveRecap(dateId, recapData);
              } else {
                onUpdateDate(dateId, {
                  status: "completed",
                  recap: recapData,
                  budget: recapData.budget,
                });
              }
              setRecapModalDate(null);
            }}
          />
        </Suspense>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full space-y-4 animate-slide-up">
            <div className="text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="font-display font-bold text-gray-800 text-lg">Xóa lịch hẹn?</h3>
              <p className="text-sm text-gray-500 mt-1.5 font-serif">
                Bạn có chắc muốn xóa buổi hẹn / trang kỷ niệm này không?
              </p>
            </div>
            <div className="flex gap-3 font-sans">
              <button
                id="confirm-delete-date"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold py-2.5 rounded-2xl hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Xóa ngay
              </button>
              <button
                id="cancel-delete-date"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-2xl hover:bg-gray-200 transition-all duration-200"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Random Picker Modal */}
      <RandomPickerModal
        isOpen={showRandom}
        onClose={() => setShowRandom(false)}
        places={places}
      />
    </div>
  );
};

export default DateScheduler;
