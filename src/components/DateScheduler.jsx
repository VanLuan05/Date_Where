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
} from "lucide-react";
import { isUpcoming, formatCurrency } from "../utils/helpers.js";
import EmptyState from "./EmptyState.jsx";

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
  upcoming: { label: "Sắp tới", color: "bg-rose-50 text-rose-700 border-rose-200/80" },
  completed: { label: "Đã hoàn thành", color: "bg-emerald-50 text-emerald-700 border-emerald-200/80" },
  cancelled: { label: "Đã hủy", color: "bg-zinc-100 text-zinc-600 border-zinc-200" },
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
}) => {
  const [showForm, setShowForm] = useState(false);
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

  // Format date parts
  const getDateParts = (dateStr) => {
    if (!dateStr) return { day: "--", month: "--", weekday: "" };
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return { day: "--", month: "--", weekday: "" };
    const day = String(d.getDate()).padStart(2, "0");
    const month = `Thg ${d.getMonth() + 1}`;
    const weekdays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    const weekday = weekdays[d.getDay()] || "";
    return { day, month, weekday };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Lịch hẹn hò
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {upcoming.length} buổi hẹn sắp tới • {completed.length} kỷ niệm đã lưu
          </p>
        </div>

        <button
          id="add-date-btn"
          onClick={() => {
            setEditingDate(null);
            setForm(EMPTY_DATE_FORM);
            setShowForm(!showForm);
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lên lịch hẹn</span>
        </button>
      </div>

      {/* Modern Add / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 animate-slide-up">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-rose-600" />
              {editingDate ? "Chỉnh sửa buổi hẹn" : "Lên kế hoạch buổi hẹn mới"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingDate(null);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                Ngày hẹn *
              </label>
              <input
                id="date-picker"
                type="date"
                className={`w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all ${
                  errors.date ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"
                }`}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                Giờ hẹn
              </label>
              <input
                id="time-picker"
                type="time"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
              Địa điểm hẹn hò *
            </label>
            <select
              id="place-select"
              className={`w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all ${
                errors.placeId ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"
              }`}
              value={form.placeId}
              onChange={(e) => handleSelectPlace(e.target.value)}
            >
              <option value="">-- Chọn một địa điểm đã lưu --</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.placeId && <p className="text-xs text-red-500 mt-1">{errors.placeId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                Gợi ý trang phục (Dress code)
              </label>
              <input
                id="dress-code"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all"
                placeholder="VD: Trắng pastel, đồ thoải mái..."
                value={form.dressCode}
                onChange={(e) => set("dressCode", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                Chi phí dự tính (VNĐ)
              </label>
              <input
                id="estimated-cost"
                type="number"
                min="0"
                step="10000"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all"
                placeholder="Ví dụ: 300000"
                value={form.estimatedCost}
                onChange={(e) => set("estimatedCost", e.target.value)}
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[100000, 200000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set("estimatedCost", val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      Number(form.estimatedCost) === val
                        ? "bg-rose-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                    }`}
                  >
                    {val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
              Ghi chú & kế hoạch chi tiết
            </label>
            <textarea
              id="date-notes"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all resize-none"
              rows={2}
              placeholder="Ghi chú về việc đặt bàn trước, thời gian di chuyển..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              id="save-date-btn"
              onClick={handleSave}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm flex-1 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingDate ? "Lưu thay đổi" : "Lên lịch hẹn"}
            </button>
            <button
              id="cancel-date-btn"
              onClick={() => {
                setShowForm(false);
                setEditingDate(null);
              }}
              className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Minimalist Segmented Tabs */}
      <div className="bg-zinc-100/90 dark:bg-zinc-800/80 p-1 rounded-xl flex gap-1">
        <button
          id="tab-upcoming"
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-lg font-medium transition-all text-center cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          id="tab-completed"
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-lg font-medium transition-all text-center cursor-pointer ${
            activeTab === "completed"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Kỷ niệm ({completed.length})
        </button>
        <button
          id="tab-all"
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-lg font-medium transition-all text-center cursor-pointer ${
            activeTab === "all"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Tất cả ({allDates.length})
        </button>
        {cancelled.length > 0 && (
          <button
            id="tab-cancelled"
            onClick={() => setActiveTab("cancelled")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-lg font-medium transition-all text-center cursor-pointer ${
              activeTab === "cancelled"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Đã hủy ({cancelled.length})
          </button>
        )}
      </div>

      {/* Date List Container */}
      {displayedDates.length > 0 ? (
        <div className="space-y-3.5">
          {displayedDates.map((dateItem) => {
            const isCompleted = dateItem.status === "completed";
            const recap = dateItem.recap;
            const creator = createdByUser(dateItem);
            const statusCfg = STATUS_CONFIG[dateItem.status] || STATUS_CONFIG.upcoming;
            const { day, month, weekday } = getDateParts(dateItem.date);

            // ── THẺ KỶ NIỆM (ĐÃ HOÀN THÀNH) ──
            if (isCompleted) {
              const photos = recap?.photos || [];
              const rating = recap?.rating || 5;

              return (
                <div
                  key={dateItem.id}
                  id={`memory-card-${dateItem.id}`}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                          {month}
                        </span>
                        <span className="text-base font-bold leading-none">{day}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                            {dateItem.placeName}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                            Đã lưu nhật ký
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {dateItem.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {dateItem.time}
                            </span>
                          )}
                          {weekday && <span>{weekday}</span>}
                          {creator && <span>bởi {creator.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0" title={`Đánh giá: ${rating}/5`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Heart
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rating ? "fill-rose-500 text-rose-500" : "text-zinc-200 dark:text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Photo Strip */}
                  {photos.length > 0 && (
                    <div className="space-y-1">
                      {photos.length === 1 && (
                        <div
                          onClick={() => setLightboxPhoto(photos[0])}
                          className="w-full h-48 sm:h-56 rounded-xl overflow-hidden relative cursor-pointer border border-zinc-200/60 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 group"
                        >
                          <img
                            src={photos[0]}
                            alt="Ảnh kỷ niệm"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {photos.length >= 2 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-36 sm:h-44">
                          {photos.slice(0, 3).map((p, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxPhoto(p)}
                              className="w-full h-full rounded-xl overflow-hidden relative cursor-pointer border border-zinc-200/60 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 group"
                            >
                              <img
                                src={p}
                                alt={`Ảnh kỷ niệm ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Food / Moment notes */}
                  {(recap?.foodReview || recap?.bestMoment) && (
                    <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 pt-1">
                      {recap.foodReview && (
                        <p className="bg-amber-50/80 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700 rounded-xl p-2.5">
                          <strong className="text-amber-900 dark:text-amber-300">🍽️ Món ăn:</strong>{" "}
                          {recap.foodReview}
                        </p>
                      )}
                      {recap.bestMoment && (
                        <p className="bg-rose-50/80 dark:bg-zinc-800/60 border border-rose-200/60 dark:border-zinc-700 rounded-xl p-2.5">
                          <strong className="text-rose-900 dark:text-rose-300">✨ Khoảnh khắc:</strong>{" "}
                          {recap.bestMoment}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Cost & Action bar */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        id={`recap-btn-${dateItem.id}`}
                        onClick={() => setRecapModalDate(dateItem)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {recap ? "Xem lại nhật ký" : "Viết nhật ký"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleStatusChange(dateItem.id, "upcoming")}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Đổi lại trạng thái sắp tới"
                      >
                        Chuyển về Sắp tới
                      </button>
                      <button
                        onClick={() => handleEdit(dateItem)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(dateItem.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // ── THẺ LỊCH HẸN SẮP TỚI (HOẶC ĐÃ HỦY) ──
            return (
              <div
                key={dateItem.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all ${
                  dateItem.status === "cancelled" ? "opacity-60 bg-zinc-50 dark:bg-zinc-900/50" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Minimalist Date Stamp */}
                  <div
                    className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                      dateItem.status === "cancelled"
                        ? "bg-zinc-100 text-zinc-500 border-zinc-200"
                        : "bg-rose-50 text-rose-800 dark:bg-zinc-800 dark:text-zinc-100 border-rose-200/60 dark:border-zinc-700"
                    }`}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wider text-rose-500 dark:text-zinc-400">
                      {month}
                    </span>
                    <span className="text-lg font-bold leading-tight">{day}</span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">{weekday}</span>
                  </div>

                  {/* Date details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                        {dateItem.placeName}
                      </h4>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                      {dateItem.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {dateItem.time}
                        </span>
                      )}
                      {creator && (
                        <span className="flex items-center gap-1">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-3.5 h-3.5 rounded-full object-cover"
                          />
                          {creator.name}
                        </span>
                      )}
                      {dateItem.dressCode && (
                        <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                          <Shirt className="w-3 h-3 text-zinc-500" /> {dateItem.dressCode}
                        </span>
                      )}
                      {(dateItem?.budget?.estimatedCost ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                          <Coins className="w-3 h-3 text-amber-500" />
                          {formatCurrency(dateItem.budget.estimatedCost)}
                        </span>
                      )}
                    </div>

                    {dateItem.notes && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 leading-relaxed">
                        {dateItem.notes}
                      </p>
                    )}

                    {/* Action Row */}
                    <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                      {dateItem.status !== "cancelled" ? (
                        <div className="flex items-center gap-2">
                          <button
                            id={`complete-date-${dateItem.id}`}
                            onClick={() => handleStatusChange(dateItem.id, "completed")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            title="Đánh dấu đã hoàn thành và viết nhật ký"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Đã hoàn thành</span>
                          </button>
                          <button
                            id={`cancel-date-status-${dateItem.id}`}
                            onClick={() => handleStatusChange(dateItem.id, "cancelled")}
                            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Hủy hẹn
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(dateItem.id, "upcoming")}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                        >
                          Khôi phục lịch hẹn
                        </button>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          id={`edit-date-${dateItem.id}`}
                          onClick={() => handleEdit(dateItem)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Chỉnh sửa lịch hẹn"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-date-${dateItem.id}`}
                          onClick={() => setConfirmDeleteId(dateItem.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
              ? "Chưa có kỷ niệm nào"
              : activeTab === "upcoming"
              ? "Chưa có buổi hẹn nào sắp tới"
              : "Danh sách lịch hẹn đang trống"
          }
          desc={
            activeTab === "completed"
              ? "Sau mỗi buổi hẹn hò, bấm 'Đã hoàn thành' để tải ảnh check-in và lưu lại nhật ký nhé!"
              : "Cùng người ấy lên kế hoạch cho buổi hẹn tiếp theo thật ngọt ngào nào!"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxPhoto}
              alt="Ảnh kỷ niệm"
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Modal Viết / Sửa Nhật Ký Kỷ Niệm */}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null);
          }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl max-w-xs w-full space-y-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-center">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Xóa lịch hẹn này?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Lịch hẹn và nhật ký đi kèm sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                id="confirm-delete-date"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Xóa ngay
              </button>
              <button
                id="cancel-delete-date"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateScheduler;
