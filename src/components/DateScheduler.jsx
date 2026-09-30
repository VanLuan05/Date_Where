import { useState, useMemo } from "react";
import { Plus, Calendar, Clock, MapPin, X, Check, Trash2, Edit3, Shuffle, ChevronRight, StickyNote } from "lucide-react";
import { isUpcoming, formatDate, formatDateTime, generateId } from "../utils/helpers.js";
import RandomPickerModal from "./RandomPickerModal.jsx";

const EMPTY_DATE_FORM = {
  placeId: "",
  placeName: "",
  date: "",
  time: "",
  notes: "",
  dressCode: "",
};

const DateScheduler = ({ dates, places, couple, currentUser, onAddDate, onUpdateDate, onDeleteDate }) => {
  const [showForm, setShowForm] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [form, setForm] = useState(EMPTY_DATE_FORM);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcoming = useMemo(() => dates.filter(d => isUpcoming(d.date)).sort((a, b) => new Date(a.date) - new Date(b.date)), [dates]);
  const past = useMemo(() => dates.filter(d => !isUpcoming(d.date)).sort((a, b) => new Date(b.date) - new Date(a.date)), [dates]);

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
    if (!form.date) e.date = "Vui long chon ngay";
    if (!form.placeId) e.placeId = "Vui long chon dia diem";
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
    });
    setShowForm(true);
    setActiveTab("upcoming");
  };

  const displayedDates = activeTab === "upcoming" ? upcoming : past;
  const createdByUser = (dateItem) => couple?.[dateItem.createdBy];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Lich hen ??</h2>
          <p className="text-sm text-gray-500 mt-0.5">{upcoming.length} lich sap toi</p>
        </div>
        <div className="flex gap-2">
          <button
            id="random-picker-btn"
            onClick={() => setShowRandom(true)}
            className="btn-secondary flex items-center gap-2 py-2.5 px-4 text-sm"
            title="Chua biet di dau?"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Ngau nhien</span>
          </button>
          <button
            id="add-date-btn"
            onClick={() => { setEditingDate(null); setForm(EMPTY_DATE_FORM); setShowForm(!showForm); }}
            className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tao lich hen</span>
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
            <p className="font-semibold text-purple-800 text-sm">Chua biet di dau? ??</p>
            <p className="text-xs text-purple-500 mt-0.5">Nhan vao day de may man chon giup minh!</p>
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
              {editingDate ? "Chinh sua lich hen" : "Tao lich hen moi"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingDate(null); }} className="btn-ghost p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ngay *</label>
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
              <label className="label">Gio</label>
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
            <label className="label"><MapPin className="w-3 h-3 inline mr-1" />Dia diem *</label>
            <select
              id="place-select"
              className={`select-field ${errors.placeId ? "border-red-400" : ""}`}
              value={form.placeId}
              onChange={e => handleSelectPlace(e.target.value)}
            >
              <option value="">-- Chon dia diem --</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.placeId && <p className="text-xs text-red-500 mt-1">{errors.placeId}</p>}
          </div>

          <div>
            <label className="label">Dress code</label>
            <input
              id="dress-code"
              className="input-field"
              placeholder="VD: Trang gian di, thoai mai"
              value={form.dressCode}
              onChange={e => set("dressCode", e.target.value)}
            />
          </div>

          <div>
            <label className="label"><StickyNote className="w-3 h-3 inline mr-1" />Ghi chu</label>
            <textarea
              id="date-notes"
              className="input-field resize-none"
              rows={2}
              placeholder="Luu y, ke hoach, dieu can chuan bi..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button id="save-date-btn" onClick={handleSave} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> {editingDate ? "Luu thay doi" : "Tao lich hen"}
            </button>
            <button id="cancel-date-btn" onClick={() => { setShowForm(false); setEditingDate(null); }} className="btn-secondary px-5 py-2.5">
              Huy
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
          Sap toi ({upcoming.length})
        </button>
        <button
          id="tab-past"
          onClick={() => setActiveTab("past")}
          className={`tab-btn flex-1 ${activeTab === "past" ? "tab-btn-active" : "tab-btn-inactive"}`}
        >
          Lich su ({past.length})
        </button>
      </div>

      {/* Date list */}
      {displayedDates.length > 0 ? (
        <div className="space-y-3">
          {displayedDates.map(dateItem => {
            const creator = createdByUser(dateItem);
            return (
              <div key={dateItem.id} className={`card p-4 ${activeTab === "past" ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${activeTab === "upcoming" ? "bg-gradient-to-br from-rose-500 to-pink-500" : "bg-gray-200"}`}>
                    <span className={`text-xs font-bold ${activeTab === "upcoming" ? "text-white" : "text-gray-500"}`}>
                      {dateItem.date ? new Date(dateItem.date).toLocaleDateString("vi-VN", { month: "short" }).toUpperCase() : "?"}
                    </span>
                    <span className={`text-lg font-display font-bold leading-none ${activeTab === "upcoming" ? "text-white" : "text-gray-600"}`}>
                      {dateItem.date ? new Date(dateItem.date).getDate() : "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight">{dateItem.placeName}</h4>
                        <div className="flex items-center gap-3 mt-0.5">
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
                        </div>
                        {dateItem.dressCode && (
                          <span className="inline-block text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full mt-1">
                            ?? {dateItem.dressCode}
                          </span>
                        )}
                        {dateItem.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dateItem.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          id={`edit-date-${dateItem.id}`}
                          onClick={() => handleEdit(dateItem)}
                          className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                        <button
                          id={`delete-date-${dateItem.id}`}
                          onClick={() => onDeleteDate(dateItem.id)}
                          className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
        <div className="text-center py-12">
          <div className="text-5xl mb-4">{activeTab === "upcoming" ? "??" : "??"}</div>
          <p className="font-semibold text-gray-600">
            {activeTab === "upcoming" ? "Chua co lich hen nao sap toi!" : "Chua co lich su lich hen"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === "upcoming" ? "Hay lao ke hoach buoi hen dau tien nao!" : "Cac buoi hen da qua se hien thi o day"}
          </p>
        </div>
      )}

      <RandomPickerModal isOpen={showRandom} onClose={() => setShowRandom(false)} places={places} />
    </div>
  );
};

export default DateScheduler;
