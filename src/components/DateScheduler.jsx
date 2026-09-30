import { useState, useMemo } from "react";
import {
  Plus, Calendar, Clock, MapPin, X, Check, Trash2, Edit3,
  Shuffle, ChevronRight, StickyNote, Shirt, Sun, Cloud, Moon,
  CheckCircle2, XCircle, ChevronDown,
} from "lucide-react";
import { isUpcoming, formatDate, formatDateTime } from "../utils/helpers.js";
import RandomPickerModal from "./RandomPickerModal.jsx";

const EMPTY_DATE_FORM = {
  placeId: "",
  placeName: "",
  date: "",
  time: "",
  notes: "",
  dressCode: "",
  weather: "",
};

const WEATHER_OPTIONS = [
  { key: "sunny",  label: "Nắng ấm",    icon: Sun,   color: "text-amber-500",  bg: "bg-amber-50 border-amber-200" },
  { key: "cool",   label: "Mát mẻ",     icon: Cloud, color: "text-sky-500",    bg: "bg-sky-50 border-sky-200" },
  { key: "night",  label: "Trăng thanh", icon: Moon,  color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
];

const STATUS_CONFIG = {
  upcoming:  { label: "Sắp tới",      color: "bg-rose-100 text-rose-700 border-rose-200" },
  completed: { label: "Đã hoàn thành", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Đã hủy",       color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const DateScheduler = ({ dates, places, couple, currentUser, onAddDate, onUpdateDate, onDeleteDate }) => {
  const [showForm, setShowForm] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [form, setForm] = useState(EMPTY_DATE_FORM);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const upcoming = useMemo(() =>
    dates
      .filter(d => d.status !== "cancelled" && isUpcoming(d.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [dates]
  );
  const past = useMemo(() =>
    dates
      .filter(d => d.status === "completed" || (!isUpcoming(d.date) && d.status !== "cancelled"))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [dates]
  );
  const cancelled = useMemo(() =>
    dates.filter(d => d.status === "cancelled"),
    [dates]
  );

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleSelectPlace = (placeId) => {
    const place = places.find(p => p.id === placeId);
    setForm(prev => ({ ...prev, placeId, placeName: place?.name || "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.date) e.date = "Vui lòng chọn ngày";
    if (!form.placeId) e.placeId = "Vui lòng chọn địa điểm";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (editingDate) {
      onUpdateDate(editingDate.id, form);
    } else {
      onAddDate(form);
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
    });
    setShowForm(true);
    setActiveTab("upcoming");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = (id, newStatus) => {
    onUpdateDate(id, { status: newStatus });
  };

  const handleDelete = (id) => {
    onDeleteDate(id);
    setConfirmDeleteId(null);
  };

  const displayedDates =
    activeTab === "upcoming" ? upcoming :
    activeTab === "past"     ? past     : cancelled;

  const createdByUser = (dateItem) => couple?.[dateItem.createdBy];

  const getWeatherInfo = (key) => WEATHER_OPTIONS.find(w => w.key === key);

  return (
    <div className="space-y-5 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Lịch hẹn 💑</h2>
          <p className="text-sm text-gray-500 mt-0.5">{upcoming.length} lịch sắp tới</p>
        </div>
        <div className="flex gap-2">
          <button
            id="random-picker-btn"
            onClick={() => setShowRandom(true)}
            className="btn-secondary flex items-center gap-2 py-2.5 px-4 text-sm"
            title="Chưa biết đi đâu?"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Ngẫu nhiên</span>
          </button>
          <button
            id="add-date-btn"
            onClick={() => { setEditingDate(null); setForm(EMPTY_DATE_FORM); setShowForm(!showForm); }}
            className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo lịch hẹn</span>
          </button>
        </div>
      </div>

      {/* Random picker promo */}
      <button
        onClick={() => setShowRandom(true)}
        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 text-left hover:border-purple-300 hover:shadow-sm transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <Shuffle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-purple-800 text-sm">Chưa biết đi đâu? 🎲</p>
            <p className="text-xs text-purple-500 mt-0.5">Nhấn vào đây để may mắn chọn giúp mình!</p>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </button>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card-static p-5 space-y-4 border-2 border-rose-200 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-rose-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {editingDate ? "Chỉnh sửa lịch hẹn" : "Tạo lịch hẹn mới"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingDate(null); }} className="btn-ghost p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ngày *</label>
              <input
                id="date-picker"
                type="date"
                className={`input-field ${errors.date ? "border-red-400" : ""}`}
                value={form.date}
                onChange={e => set("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Giờ</label>
              <input
                id="time-picker"
                type="time"
                className="input-field"
                value={form.time}
                onChange={e => set("time", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label"><MapPin className="w-3 h-3 inline mr-1" />Địa điểm *</label>
            <select
              id="place-select"
              className={`select-field ${errors.placeId ? "border-red-400" : ""}`}
              value={form.placeId}
              onChange={e => handleSelectPlace(e.target.value)}
            >
              <option value="">-- Chọn địa điểm --</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.placeId && <p className="text-xs text-red-500 mt-1">{errors.placeId}</p>}
          </div>

          {/* Dress Code */}
          <div>
            <label className="label"><Shirt className="w-3 h-3 inline mr-1" />Trang phục gợi ý (Dress code)</label>
            <input
              id="dress-code"
              className="input-field"
              placeholder="VD: Trắng giản dị, thoải mái"
              value={form.dressCode}
              onChange={e => set("dressCode", e.target.value)}
            />
          </div>

          {/* Weather */}
          <div>
            <label className="label">Thời tiết dự kiến</label>
            <div className="flex gap-2">
              {WEATHER_OPTIONS.map(w => {
                const Icon = w.icon;
                const selected = form.weather === w.key;
                return (
                  <button
                    key={w.key}
                    id={`weather-${w.key}`}
                    onClick={() => set("weather", selected ? "" : w.key)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border-2 text-xs font-medium transition-all duration-200 ${
                      selected
                        ? `${w.bg} border-current ${w.color}`
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

          <div>
            <label className="label"><StickyNote className="w-3 h-3 inline mr-1" />Ghi chú</label>
            <textarea
              id="date-notes"
              className="input-field resize-none"
              rows={2}
              placeholder="Lưu ý, kế hoạch, điều cần chuẩn bị..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button id="save-date-btn" onClick={handleSave} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> {editingDate ? "Lưu thay đổi" : "Tạo lịch hẹn"}
            </button>
            <button id="cancel-date-btn" onClick={() => { setShowForm(false); setEditingDate(null); }} className="btn-secondary px-5 py-2.5">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-rose-50 p-1 rounded-2xl">
        <button
          id="tab-upcoming"
          onClick={() => setActiveTab("upcoming")}
          className={`tab-btn flex-1 ${activeTab === "upcoming" ? "tab-btn-active" : "tab-btn-inactive"}`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          id="tab-past"
          onClick={() => setActiveTab("past")}
          className={`tab-btn flex-1 ${activeTab === "past" ? "tab-btn-active" : "tab-btn-inactive"}`}
        >
          Lịch sử ({past.length})
        </button>
        <button
          id="tab-cancelled"
          onClick={() => setActiveTab("cancelled")}
          className={`tab-btn flex-1 ${activeTab === "cancelled" ? "tab-btn-active" : "tab-btn-inactive"}`}
        >
          Đã hủy ({cancelled.length})
        </button>
      </div>

      {/* Date list */}
      {displayedDates.length > 0 ? (
        <div className="space-y-3">
          {displayedDates.map(dateItem => {
            const creator = createdByUser(dateItem);
            const statusCfg = STATUS_CONFIG[dateItem.status] || STATUS_CONFIG.upcoming;
            const weatherInfo = getWeatherInfo(dateItem.weather);
            const WeatherIcon = weatherInfo?.icon;
            const isExpanded = expandedId === dateItem.id;
            return (
              <div
                key={dateItem.id}
                className={`card p-4 transition-all duration-200 ${
                  dateItem.status === "cancelled" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Date block */}
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                    activeTab === "upcoming" ? "bg-gradient-to-br from-rose-500 to-pink-500" : "bg-gray-200"
                  }`}>
                    <span className={`text-xs font-bold ${activeTab === "upcoming" ? "text-white" : "text-gray-500"}`}>
                      {dateItem.date ? new Date(dateItem.date + "T00:00:00").toLocaleDateString("vi-VN", { month: "short" }).toUpperCase() : "?"}
                    </span>
                    <span className={`text-lg font-display font-bold leading-none ${activeTab === "upcoming" ? "text-white" : "text-gray-600"}`}>
                      {dateItem.date ? new Date(dateItem.date + "T00:00:00").getDate() : "?"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-800 text-sm leading-tight">{dateItem.placeName}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {dateItem.time && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" /> {dateItem.time}
                            </span>
                          )}
                          {creator && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <img src={creator.avatar} alt={creator.name} className="w-3.5 h-3.5 rounded-full" />
                              {creator.name}
                            </span>
                          )}
                          {weatherInfo && WeatherIcon && (
                            <span className={`flex items-center gap-1 text-xs font-medium ${weatherInfo.color}`}>
                              <WeatherIcon className="w-3 h-3" /> {weatherInfo.label}
                            </span>
                          )}
                        </div>
                        {dateItem.dressCode && (
                          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full mt-1.5">
                            <Shirt className="w-3 h-3" /> {dateItem.dressCode}
                          </span>
                        )}
                        {dateItem.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dateItem.notes}</p>
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
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Status actions (expanded) */}
                    {isExpanded && dateItem.status !== "cancelled" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap animate-fade-in">
                        <p className="text-xs text-gray-400 w-full font-medium">Cập nhật trạng thái:</p>
                        {dateItem.status !== "completed" && (
                          <button
                            id={`complete-date-${dateItem.id}`}
                            onClick={() => handleStatusChange(dateItem.id, "completed")}
                            className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đánh dấu Đã hoàn thành
                          </button>
                        )}
                        {dateItem.status !== "upcoming" && (
                          <button
                            id={`restore-date-${dateItem.id}`}
                            onClick={() => handleStatusChange(dateItem.id, "upcoming")}
                            className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors font-medium"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Khôi phục Sắp tới
                          </button>
                        )}
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
        <div className="text-center py-12">
          <div className="text-5xl mb-4">{activeTab === "upcoming" ? "📅" : activeTab === "past" ? "📖" : "🚫"}</div>
          <p className="font-semibold text-gray-600">
            {activeTab === "upcoming"
              ? "Chưa có lịch hẹn nào sắp tới!"
              : activeTab === "past"
              ? "Chưa có lịch sử lịch hẹn"
              : "Không có lịch hẹn đã hủy"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === "upcoming"
              ? "Hãy lão kế hoạch buổi hẹn đầu tiên nào!"
              : activeTab === "past"
              ? "Các buổi hẹn đã hoàn thành sẽ hiển thị ở đây"
              : "Các buổi hẹn bị hủy sẽ hiển thị ở đây"}
          </p>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full space-y-4 animate-slide-up">
            <div className="text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="font-display font-bold text-gray-800 text-lg">Xóa lịch hẹn?</h3>
              <p className="text-sm text-gray-500 mt-1.5">
                Bạn có chắc muốn xóa lịch hẹn này không?
              </p>
            </div>
            <div className="flex gap-3">
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

      <RandomPickerModal isOpen={showRandom} onClose={() => setShowRandom(false)} places={places} />
    </div>
  );
};

export default DateScheduler;
