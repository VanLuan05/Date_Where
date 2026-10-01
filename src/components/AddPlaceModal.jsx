import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  MapPin,
  Image,
  ChefHat,
  StickyNote,
  Camera,
  Upload,
  Link2,
  Loader2,
} from "lucide-react";
import { CATEGORY_CONFIG } from "../data/mockData.js";
import { compressImage, getBase64SizeInKB } from "../utils/imageCompressor.js";

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
  const [imageMode, setImageMode] = useState("upload"); // "upload" | "link"
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionError, setCompressionError] = useState("");
  const fileInputRef = useRef(null);

  // Sync editPlace when modal opens or editPlace changes
  useEffect(() => {
    if (isOpen) {
      if (editPlace) {
        setForm({ ...editPlace });
        setImageMode(
          editPlace.imageUrl && editPlace.imageUrl.startsWith("http")
            ? "link"
            : "upload"
        );
      } else {
        setForm(EMPTY_FORM);
        setImageMode("upload");
      }
      setMenuInput("");
      setErrors({});
      setCompressionError("");
      setIsCompressing(false);
    }
  }, [isOpen, editPlace]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên địa điểm";
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onSave(form);
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const handleAddMenu = () => {
    if (!menuInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      menuItems: [...(prev.menuItems || []), menuInput.trim()],
    }));
    setMenuInput("");
  };

  const handleRemoveMenu = (i) => {
    setForm((prev) => ({
      ...prev,
      menuItems: prev.menuItems.filter((_, idx) => idx !== i),
    }));
  };

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressionError("");
    setIsCompressing(true);

    try {
      // Nén ảnh tự động: tối đa 800px width, quality 0.7 cho ra ~40KB - 80KB Base64
      const compressedBase64 = await compressImage(file, 800, 0.7);
      set("imageUrl", compressedBase64);
    } catch (err) {
      console.error("Lỗi nén ảnh:", err);
      setCompressionError(
        "Không thể đọc hoặc nén ảnh này. Vui lòng thử chọn ảnh khác."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="font-display text-xl font-bold text-rose-800">
              {editPlace ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Lưu địa điểm đẹp để không bao giờ quên!
            </p>
          </div>
          <button
            id="close-add-place"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl hover:bg-rose-50 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div>
            <label className="label">Tên địa điểm *</label>
            <input
              id="place-name"
              className={`input-field ${errors.name ? "border-red-400" : ""}`}
              placeholder="VD: The Workshop Coffee"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="label">Thể loại</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                <button
                  key={key}
                  id={`cat-${key}`}
                  type="button"
                  onClick={() => set("category", key)}
                  className={`p-2.5 rounded-2xl border-2 text-center transition-all duration-200 text-sm ${
                    form.category === key
                      ? "border-rose-400 bg-rose-50"
                      : "border-gray-200 bg-white hover:border-rose-200"
                  }`}
                >
                  <div className="text-xl">{val.emoji}</div>
                  <div className="text-xs font-medium text-gray-700 mt-0.5">
                    {val.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label">
              <MapPin className="w-3 h-3 inline mr-1" />
              Địa chỉ *
            </label>
            <input
              id="place-address"
              className={`input-field ${
                errors.address ? "border-red-400" : ""
              }`}
              placeholder="VD: 27 Ngô Đức Kế, Quận 1"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          {/* Google Maps URL */}
          <div>
            <label className="label">Link Google Maps</label>
            <input
              id="place-maps"
              className="input-field"
              placeholder="https://maps.google.com/..."
              value={form.googleMapsUrl}
              onChange={(e) => set("googleMapsUrl", e.target.value)}
            />
          </div>

          {/* Image Selection (Upload or Link) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">
                <Image className="w-3.5 h-3.5 inline mr-1 text-rose-500" />
                Hình ảnh địa điểm
              </label>
              {/* Toggle chế độ ảnh */}
              <div className="flex bg-rose-50 p-0.5 rounded-xl border border-rose-100 text-xs">
                <button
                  type="button"
                  id="tab-upload-image"
                  onClick={() => setImageMode("upload")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    imageMode === "upload"
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Camera className="w-3 h-3 inline mr-1" />
                  Tải từ máy
                </button>
                <button
                  type="button"
                  id="tab-link-image"
                  onClick={() => setImageMode("link")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    imageMode === "link"
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Link2 className="w-3 h-3 inline mr-1" />
                  Dán link
                </button>
              </div>
            </div>

            {imageMode === "upload" ? (
              <div className="space-y-2">
                <input
                  type="file"
                  id="place-file-input"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  id="btn-choose-file"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-50 rounded-2xl py-4 px-4 flex flex-col items-center justify-center gap-1.5 transition-all text-sm group cursor-pointer disabled:opacity-50"
                >
                  {isCompressing ? (
                    <div className="flex items-center gap-2 text-rose-600 font-medium">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang nén ảnh tự động...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-rose-700">
                        Chọn ảnh từ thiết bị hoặc chụp ảnh
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Tự động nén Base64 tối ưu cho Firestore (~40KB - 80KB)
                      </span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <input
                  id="place-image"
                  className="input-field"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                />
              </div>
            )}

            {compressionError && (
              <p className="text-xs text-red-500 mt-1.5 bg-red-50 p-2 rounded-xl border border-red-200">
                {compressionError}
              </p>
            )}

            {form.imageUrl && (
              <div className="relative mt-2.5 rounded-2xl overflow-hidden h-36 bg-rose-50 border border-rose-100 group">
                <img
                  src={form.imageUrl}
                  alt="Bản xem trước địa điểm"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                  <span className="text-white text-xs font-medium drop-shadow-sm">
                    {form.imageUrl.startsWith("data:")
                      ? `Đã nén tối ưu (~${getBase64SizeInKB(
                          form.imageUrl
                        )} KB)`
                      : "Link ảnh từ Web"}
                  </span>
                  <button
                    type="button"
                    id="remove-place-image"
                    onClick={() => {
                      set("imageUrl", "");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="bg-red-500/80 hover:bg-red-600 text-white px-2.5 py-1 rounded-xl text-xs backdrop-blur-sm transition-colors flex items-center gap-1 shadow-sm"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div>
            <label className="label">
              <ChefHat className="w-3 h-3 inline mr-1" />
              Món gợi ý / Menu
            </label>
            <div className="flex gap-2">
              <input
                id="menu-item-input"
                className="input-field flex-1"
                placeholder="VD: Cà phê phin truyền thống"
                value={menuInput}
                onChange={(e) => setMenuInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMenu();
                  }
                }}
              />
              <button
                id="add-menu-btn"
                type="button"
                onClick={handleAddMenu}
                className="btn-primary px-4 py-3 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.menuItems && form.menuItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.menuItems.map((item, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-rose-100 text-rose-700 text-xs px-2.5 py-1.5 rounded-full"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveMenu(i)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              <StickyNote className="w-3 h-3 inline mr-1" />
              Ghi chú
            </label>
            <textarea
              id="place-notes"
              className="input-field resize-none"
              rows={3}
              placeholder="Ghi chú về địa điểm, lưu ý khi đến..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            id="save-place-btn"
            onClick={handleSave}
            className="btn-primary flex-1"
          >
            {editPlace ? "Lưu thay đổi" : "Thêm địa điểm"}
          </button>
          <button
            id="cancel-place-btn"
            onClick={onClose}
            className="btn-secondary px-6"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;
