import { useState } from "react";
import { X, Plus, Trash2, MapPin, Image, ChefHat, StickyNote } from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";

const EMPTY_FORM = {
  name: "",
  category: "cafe",
  address: "",
  googleMapsUrl: "",
  imageUrl: "",
  menuItems: [],
  notes: "",
};

const AddPlaceModal = ({ isOpen, onClose, onSave, editPlace }) => {
  const [form, setForm] = useState(editPlace || EMPTY_FORM);
  const [menuInput, setMenuInput] = useState("");
  const [errors, setErrors] = useState({});

  // Sync editPlace
  useState(() => {
    if (editPlace) setForm(editPlace);
    else setForm(EMPTY_FORM);
  });

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui long nhap ten dia diem";
    if (!form.address.trim()) e.address = "Vui long nhap dia chi";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave(form);
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const handleAddMenu = () => {
    if (!menuInput.trim()) return;
    setForm(prev => ({ ...prev, menuItems: [...(prev.menuItems || []), menuInput.trim()] }));
    setMenuInput("");
  };

  const handleRemoveMenu = (i) => {
    setForm(prev => ({ ...prev, menuItems: prev.menuItems.filter((_, idx) => idx !== i) }));
  };

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="font-display text-xl font-bold text-rose-800">
              {editPlace ? "Chinh sua dia diem" : "Them dia diem moi"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Luu dia diem dep de khong bao gio quen!</p>
          </div>
          <button id="close-add-place" onClick={onClose} className="w-9 h-9 rounded-2xl hover:bg-rose-50 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div>
            <label className="label">Ten dia diem *</label>
            <input id="place-name" className={`input-field ${errors.name ? "border-red-400" : ""}`} placeholder="VD: The Workshop Coffee" value={form.name} onChange={e => set("name", e.target.value)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">The loai</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                <button
                  key={key}
                  id={`cat-${key}`}
                  onClick={() => set("category", key)}
                  className={`p-2.5 rounded-2xl border-2 text-center transition-all duration-200 text-sm ${form.category === key ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-white hover:border-rose-200"}`}
                >
                  <div className="text-xl">{val.emoji}</div>
                  <div className="text-xs font-medium text-gray-700 mt-0.5">{val.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label"><MapPin className="w-3 h-3 inline mr-1" />Dia chi *</label>
            <input id="place-address" className={`input-field ${errors.address ? "border-red-400" : ""}`} placeholder="VD: 27 Ngo Duc Ke, Quan 1" value={form.address} onChange={e => set("address", e.target.value)} />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          {/* Google Maps URL */}
          <div>
            <label className="label">Link Google Maps</label>
            <input id="place-maps" className="input-field" placeholder="https://maps.google.com/..." value={form.googleMapsUrl} onChange={e => set("googleMapsUrl", e.target.value)} />
          </div>

          {/* Image URL */}
          <div>
            <label className="label"><Image className="w-3 h-3 inline mr-1" />URL anh minh hoa</label>
            <input id="place-image" className="input-field" placeholder="https://..." value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} />
            {form.imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden h-32 bg-rose-50">
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
              </div>
            )}
          </div>

          {/* Menu items */}
          <div>
            <label className="label"><ChefHat className="w-3 h-3 inline mr-1" />Mon goi y / Menu</label>
            <div className="flex gap-2">
              <input
                id="menu-item-input"
                className="input-field flex-1"
                placeholder="VD: Ca phe phin truyen thong"
                value={menuInput}
                onChange={e => setMenuInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddMenu(); } }}
              />
              <button id="add-menu-btn" onClick={handleAddMenu} className="btn-primary px-4 py-3 text-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.menuItems && form.menuItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.menuItems.map((item, i) => (
                  <span key={i} className="flex items-center gap-1 bg-rose-100 text-rose-700 text-xs px-2.5 py-1.5 rounded-full">
                    {item}
                    <button onClick={() => handleRemoveMenu(i)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label"><StickyNote className="w-3 h-3 inline mr-1" />Ghi chu</label>
            <textarea
              id="place-notes"
              className="input-field resize-none"
              rows={3}
              placeholder="Ghi chu ve dia diem, luu y khi den..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button id="save-place-btn" onClick={handleSave} className="btn-primary flex-1">
            {editPlace ? "Luu thay doi" : "Them dia diem"}
          </button>
          <button id="cancel-place-btn" onClick={onClose} className="btn-secondary px-6">Huy</button>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;
