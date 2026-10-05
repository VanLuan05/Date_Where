import { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
  StickyNote,
  Shirt,
  Sun,
  Cloud,
  Moon,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Heart,
  Camera,
  Sparkles,
  BookOpen,
  UtensilsCrossed,
  Smile,
  Maximize2,
  Coins,
  Loader2,
  Bell,
  CalendarHeart,
} from "lucide-react";
import { isUpcoming, formatCurrency } from "../utils/helpers.js";
import {
  getWeatherForecastForDate,
  fetchWeatherForecastData,
  getWeatherCondition,
} from "../utils/weatherService.js";
import { DateReminderPermissionBanner } from "./DateReminderToast.jsx";
import {
  getHoursUntilDate,
  REMINDER_MILESTONES,
  isReminderSent,
} from "../utils/notificationService.js";
import RandomPickerModal from "./RandomPickerModal.jsx";
import DateRecapModal from "./DateRecapModal.jsx";

const EMPTY_DATE_FORM = {
  placeId: "",
  placeName: "",
  date: "",
  time: "",
  notes: "",
  dressCode: "",
  weather: "",
  estimatedCost: "",
};

const WEATHER_OPTIONS = [
  { key: "sunny", label: "Nắng ấm", icon: Sun, color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  { key: "cool", label: "Mát mẻ", icon: Cloud, color: "text-sky-500", bg: "bg-sky-50 border-sky-200" },
  { key: "night", label: "Trăng thanh", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
];

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
  notifPermission,
  onEnableNotifications,
  onTestNotification,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [form, setForm] = useState(EMPTY_DATE_FORM);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("all"); // "all" | "upcoming" | "completed" | "cancelled"
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const user1Name = couple?.user1?.name || couple?.userA?.name || "Bạn Nam";
  const user2Name = couple?.user2?.name || couple?.userB?.name || "Bạn Nữ";

  // Date Recap & Lightbox State
  const [recapModalDate, setRecapModalDate] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Smart Weather Forecast State
  const [forecastMap, setForecastMap] = useState({});
  const [formWeather, setFormWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Tải dự báo thời tiết 16 ngày từ Open-Meteo để cache & map theo ngày hẹn
  useEffect(() => {
    let isMounted = true;
    fetchWeatherForecastData().then((daily) => {
      if (!daily || !isMounted) return;
      const map = {};
      daily.time.forEach((dateStr, idx) => {
        const code = daily.weather_code[idx];
        const tempMax = Math.round(daily.temperature_2m_max[idx]);
        const tempMin = Math.round(daily.temperature_2m_min[idx]);
        const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0;
        const condition = getWeatherCondition(code, rainProb);
        map[dateStr] = {
          date: dateStr,
          weatherCode: code,
          tempMax,
          tempMin,
          rainProb,
          ...condition,
        };
      });
      setForecastMap(map);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Lắng nghe form.date để dự báo ngay trong ô nhập
  useEffect(() => {
    let isMounted = true;
    if (!form.date) {
      setFormWeather(null);
      return;
    }
    setLoadingWeather(true);
    getWeatherForecastForDate(form.date)
      .then((res) => {
        if (isMounted) setFormWeather(res);
      })
      .catch(() => {
        if (isMounted) setFormWeather(null);
      })
      .finally(() => {
        if (isMounted) setLoadingWeather(false);
      });
    return () => {
      isMounted = false;
    };
  }, [form.date]);

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
      weather: dateItem.weather || "",
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

  const getWeatherInfo = (key) => WEATHER_OPTIONS.find((w) => w.key === key);

  return (
    <div className="space-y-5 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Lịch hẹn & Nhật ký 💑</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {upcoming.length} buổi hẹn sắp tới • {completed.length} nhật ký kỷ niệm
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            id="availability-match-btn"
            onClick={onOpenAvailability}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white flex items-center gap-2 py-2.5 px-3.5 text-sm font-semibold rounded-2xl shadow-sm transition-all active:scale-95"
            title="Tìm ngày cùng rảnh"
          >
            <CalendarHeart className="w-4 h-4" />
            <span className="hidden sm:inline">Tìm ngày cùng rảnh</span>
            <span className="sm:hidden">💖</span>
          </button>
          <button
            id="random-picker-btn"
            onClick={() => setShowRandom(true)}
            className="btn-secondary flex items-center gap-2 py-2.5 px-3.5 text-sm"
            title="Chưa biết đi đâu?"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Ngẫu nhiên</span>
          </button>
          <button
            id="add-date-btn"
            onClick={() => {
              setEditingDate(null);
              setForm(EMPTY_DATE_FORM);
              setShowForm(!showForm);
            }}
            className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo lịch hẹn</span>
          </button>
        </div>
      </div>

      {/* Random Picker Banner */}
      <button
        onClick={() => setShowRandom(true)}
        className="w-full bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border border-purple-200/80 rounded-2xl p-4 text-left hover:border-purple-300 hover:shadow-sm transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm">
            <Shuffle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-purple-900 text-sm">Chưa biết đi đâu? 🎲</p>
            <p className="text-xs text-purple-600 mt-0.5">
              Nhấn vào đây để chiếc vòng quay may mắn chọn địa điểm cho hai đứa!
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </button>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card-static p-5 space-y-4 border-2 border-rose-200 animate-slide-up bg-white/95">
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
              className="btn-ghost p-1.5"
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
                className={`w-full min-w-0 px-3 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none appearance-none ${errors.date ? "border-red-400" : "border-rose-200"}`}
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

          {/* Dự báo thời tiết thông minh cho ngày hẹn được chọn */}
          {loadingWeather && (
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-rose-600 animate-pulse font-serif">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang kết nối dự báo thời tiết Open-Meteo cho ngày hẹn...</span>
            </div>
          )}

          {formWeather && !loadingWeather && (
            formWeather.available ? (
              <div
                className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  formWeather.isRainy
                    ? "bg-blue-50/80 border-blue-200 text-blue-900 shadow-xs ring-1 ring-blue-300/40"
                    : "bg-gradient-to-r from-amber-50/70 via-rose-50/60 to-pink-50/70 border-rose-200/80 text-stone-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-sans">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-lg select-none">{formWeather.icon}</span>
                    <span>{formWeather.label}</span>
                    <span className="font-normal text-stone-600">
                      ({formWeather.tempMin}°C - {formWeather.tempMax}°C)
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      formWeather.isRainy
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "bg-white/80 text-stone-600 border border-stone-200"
                    }`}
                  >
                    💧 {formWeather.rainProb}% mưa
                  </span>
                </div>
                <p className="text-[11px] font-serif italic text-stone-600 leading-relaxed">
                  "{formWeather.advice}"
                </p>
              </div>
            ) : formWeather.tooFar ? (
              <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] font-serif italic text-stone-500 text-center">
                {formWeather.message}
              </div>
            ) : null
          )}

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

          {/* Weather */}
          <div>
            <label className="label">Thời tiết dự kiến</label>
            <div className="flex gap-2">
              {WEATHER_OPTIONS.map((w) => {
                const Icon = w.icon;
                const selected = form.weather === w.key;
                return (
                  <button
                    key={w.key}
                    type="button"
                    id={`weather-${w.key}`}
                    onClick={() => set("weather", selected ? "" : w.key)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border-2 text-xs font-medium transition-all duration-200 ${
                      selected
                        ? `${w.bg} border-current ${w.color} shadow-xs`
                        : "border-gray-200 bg-white text-gray-500 hover:border-rose-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selected ? w.color : "text-gray-400"}`} />
                    {w.label}
                  </button>
                );
              })}
            </div>
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
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
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

      {/* Gợi ý bật thông báo trên điện thoại */}
      {notifPermission && (
        <DateReminderPermissionBanner
          permission={notifPermission}
          onEnable={onEnableNotifications}
          onTest={() => onTestNotification?.("DateWhere")}
        />
      )}

      {/* Quick Filter Bar (Bộ lọc nhanh 4 tab) */}
      <div className="flex gap-1.5 bg-rose-50/80 p-1.5 rounded-2xl border border-rose-100 overflow-x-auto scrollbar-none">
        <button
          id="tab-all"
          onClick={() => setActiveTab("all")}
          className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 ${
            activeTab === "all" ? "tab-btn-active" : "tab-btn-inactive"
          }`}
        >
          Tất cả ({allDates.length})
        </button>
        <button
          id="tab-upcoming"
          onClick={() => setActiveTab("upcoming")}
          className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 ${
            activeTab === "upcoming" ? "tab-btn-active" : "tab-btn-inactive"
          }`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          id="tab-completed"
          onClick={() => setActiveTab("completed")}
          className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 flex items-center justify-center gap-1.5 ${
            activeTab === "completed" ? "tab-btn-active" : "tab-btn-inactive"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Nhật ký kỷ niệm ({completed.length})
        </button>
        {cancelled.length > 0 && (
          <button
            id="tab-cancelled"
            onClick={() => setActiveTab("cancelled")}
            className={`tab-btn flex-1 whitespace-nowrap text-xs sm:text-sm py-2 px-3 ${
              activeTab === "cancelled" ? "tab-btn-active" : "tab-btn-inactive"
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
            const weatherInfo = getWeatherInfo(dateItem.weather);
            const WeatherIcon = weatherInfo?.icon;
            const isExpanded = expandedId === dateItem.id;

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
                          {weatherInfo && WeatherIcon && (
                            <span className={`flex items-center gap-1 ${weatherInfo.color}`}>
                              <WeatherIcon className="w-3 h-3" /> {weatherInfo.label}
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

                  {/* ── PHOTO ALBUM STRIP (DẢI ẢNH KỶ NIỆM THU NHỎ) ── */}
                  {photos.length > 0 ? (
                    <div className="space-y-1">
                      {photos.length === 1 && (
                        /* 1 ảnh: Banner ngang sang trọng */
                        <div
                          onClick={() => setLightboxPhoto(photos[0])}
                          className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden relative cursor-pointer group/photo border border-rose-100/80 shadow-xs bg-stone-100"
                          title="Bấm để phóng to ảnh"
                        >
                          <img
                            src={photos[0]}
                            alt="Ảnh kỷ niệm"
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
                        /* 2 ảnh: Lưới 2 ảnh song song cân đối */
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
                        /* 3 ảnh: Gallery so le bắt mắt (1 ảnh lớn bên trái, 2 ảnh xếp tầng bên phải) */
                        <div className="grid grid-cols-3 gap-2.5 h-44 sm:h-52">
                          <div
                            onClick={() => setLightboxPhoto(photos[0])}
                            className="col-span-2 h-full rounded-2xl overflow-hidden relative cursor-pointer group/photo border border-rose-100/80 shadow-xs bg-stone-100"
                            title="Bấm để phóng to ảnh"
                          >
                            <img
                              src={photos[0]}
                              alt="Ảnh kỷ niệm nổi bật"
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
                    /* Khi chưa có ảnh */
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

                  {/* ── CẢM NHẬN & KHOẢNH KHẮC ĐÁNG NHỚ ── */}
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

                  {/* Notes / Dress code from original date if any */}
                  {dateItem.notes && !recap?.bestMoment && (
                    <p className="text-xs text-stone-500 font-serif italic bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      Ghi chú: {dateItem.notes}
                    </p>
                  )}

                  {/* ── THÔNG TIN CHI PHÍ TRÊN THẺ KỶ NIỆM ── */}
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

                  {/* ── ACTION FOOTER CỦA THẺ KỶ NIỆM ── */}
                  <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      id={`recap-btn-${dateItem.id}`}
                      onClick={() => setRecapModalDate(dateItem)}
                      className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{recap ? "Xem & Chỉnh sửa kỷ niệm" : "Viết nhật ký ngay"}</span>
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

            // ─── THẺ LỊCH HẸN THƯỜNG (SẮP TỚI HOẶC ĐÃ HỦY) ───
            return (
              <div
                key={dateItem.id}
                className={`card p-4 transition-all duration-200 ${
                  dateItem.status === "cancelled" ? "opacity-60 bg-gray-50/80" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Date block */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                      dateItem.status === "cancelled"
                        ? "bg-gray-200 text-gray-500"
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                            {dateItem.placeName}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {dateItem.time && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" /> {dateItem.time}
                            </span>
                          )}
                          {creator && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <img
                                src={creator.avatar}
                                alt={creator.name}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                              {creator.name}
                            </span>
                          )}
                          {weatherInfo && WeatherIcon && (
                            <span
                              className={`flex items-center gap-1 text-xs font-medium ${weatherInfo.color}`}
                            >
                              <WeatherIcon className="w-3 h-3" /> {weatherInfo.label}
                            </span>
                          )}
                        </div>
                        {dateItem.dressCode && (
                          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full mt-1.5">
                            <Shirt className="w-3 h-3" /> {dateItem.dressCode}
                          </span>
                        )}
                        {/* Chi phí dự tính badge trên thẻ thường */}
                        {(dateItem?.budget?.estimatedCost ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full mt-1.5 ml-2 font-medium">
                            <Coins className="w-3 h-3 text-amber-600" />
                            Dự tính: {formatCurrency(dateItem?.budget?.estimatedCost || 0)}
                          </span>
                        )}
                        {dateItem.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dateItem.notes}</p>
                        )}

                        {/* ── MỐC THÔNG BÁO NHẮC HẸN 24H, 12H, 9H, 3H, 1H ── */}
                        {dateItem.status === "upcoming" && (() => {
                          const remaining = getHoursUntilDate(dateItem.date, dateItem.time);
                          if (remaining === null || remaining <= 0) return null;

                          return (
                            <div className="mt-2.5 pt-2 border-t border-rose-100/70">
                              <div className="flex items-center justify-between text-[11px] text-stone-500 font-serif mb-1">
                                <span className="flex items-center gap-1 text-rose-700 font-semibold font-sans">
                                  <Bell className="w-3 h-3 text-rose-500 animate-wiggle" />
                                  Nhắc hẹn điện thoại:
                                </span>
                                <span>
                                  {remaining >= 24
                                    ? `Còn ~${Math.round(remaining / 24)} ngày`
                                    : `Còn ~${Math.round(remaining)} tiếng`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px] font-sans font-semibold">
                                {REMINDER_MILESTONES.map((m) => {
                                  const isCurrent =
                                    remaining > m.minHours && remaining <= m.maxHours;
                                  const isSent = isReminderSent(dateItem.id, m.id);

                                  return (
                                    <span
                                      key={m.id}
                                      className={`px-2 py-0.5 rounded-lg border whitespace-nowrap transition-all ${
                                        isSent
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                                          : isCurrent
                                          ? "bg-rose-500 text-white border-rose-600 animate-pulse font-bold shadow-xs"
                                          : "bg-white/80 border-stone-200 text-stone-400"
                                      }`}
                                      title={m.label}
                                    >
                                      {isSent ? "✓ " : ""}
                                      {m.badge}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── THỜI TIẾT DỰ BÁO THÔNG MINH CHO BUỔI HẸN ── */}
                        {forecastMap[dateItem.date] && dateItem.status === "upcoming" && (
                          <div
                            className={`mt-2.5 p-3 rounded-2xl border text-xs font-serif space-y-1 transition-all ${
                              forecastMap[dateItem.date].isRainy
                                ? "bg-blue-50/80 border-blue-200/90 text-blue-900 ring-1 ring-blue-300/40"
                                : "bg-rose-50/60 border-rose-100 text-stone-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap font-sans">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="text-base select-none">{forecastMap[dateItem.date].icon}</span>
                                <span>{forecastMap[dateItem.date].label}</span>
                                <span className="font-normal text-stone-600">
                                  ({forecastMap[dateItem.date].tempMin}° - {forecastMap[dateItem.date].tempMax}°C)
                                </span>
                              </div>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  forecastMap[dateItem.date].isRainy
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-white/80 text-stone-600 border border-stone-200"
                                }`}
                              >
                                💧 {forecastMap[dateItem.date].rainProb}% mưa
                              </span>
                            </div>
                            <p className="text-[11px] italic font-serif text-stone-600 leading-relaxed">
                              "{forecastMap[dateItem.date].advice}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <div className="flex gap-1">
                          <button
                            id={`edit-date-${dateItem.id}`}
                            onClick={() => handleEdit(dateItem)}
                            className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                          <button
                            id={`delete-date-${dateItem.id}`}
                            onClick={() => setConfirmDeleteId(dateItem.id)}
                            className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : dateItem.id)}
                          className="w-full flex items-center justify-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Status actions (expanded) */}
                    {isExpanded && dateItem.status !== "cancelled" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap animate-fade-in">
                        <p className="text-xs text-gray-400 w-full font-medium">Cập nhật trạng thái:</p>
                        <button
                          id={`complete-date-${dateItem.id}`}
                          onClick={() => handleStatusChange(dateItem.id, "completed")}
                          className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors font-medium shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Đã hoàn thành (Viết nhật ký)
                        </button>
                        <button
                          id={`cancel-date-status-${dateItem.id}`}
                          onClick={() => handleStatusChange(dateItem.id, "cancelled")}
                          className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Hủy hẹn
                        </button>
                      </div>
                    )}
                    {isExpanded && dateItem.status === "cancelled" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                        <button
                          onClick={() => handleStatusChange(dateItem.id, "upcoming")}
                          className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors font-medium"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Khôi phục lịch hẹn
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white/50 rounded-3xl border border-rose-100/60 p-8">
          <div className="text-5xl mb-3">
            {activeTab === "completed" ? "📖" : activeTab === "upcoming" ? "📅" : "💌"}
          </div>
          <p className="font-display font-bold text-stone-700 text-lg">
            {activeTab === "completed"
              ? "Chưa có trang nhật ký kỷ niệm nào"
              : activeTab === "upcoming"
              ? "Chưa có buổi hẹn nào sắp tới"
              : "Danh sách lịch hẹn đang trống"}
          </p>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto font-serif">
            {activeTab === "completed"
              ? "Sau mỗi buổi hẹn hò, hãy đánh dấu 'Đã hoàn thành' để tải ảnh check-in và viết lại những khoảnh khắc đáng yêu nhé!"
              : "Hãy cùng nhau lên kế hoạch cho buổi hẹn tiếp theo thật ngọt ngào nào!"}
          </p>
          <button
            onClick={() => {
              setEditingDate(null);
              setForm(EMPTY_DATE_FORM);
              setShowForm(true);
            }}
            className="btn-primary mt-4 py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tạo lịch hẹn ngay
          </button>
        </div>
      )}

      {/* ── LIGHTBOX MODAL PHÓNG TO ẢNH RÕ NÉT ── */}
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

      {/* ── MODAL VIẾT / SỬA NHẬT KÝ KỶ NIỆM (DateRecapModal) ── */}
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
