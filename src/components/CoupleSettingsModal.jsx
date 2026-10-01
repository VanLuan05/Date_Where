import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Heart,
  Calendar,
  RefreshCw,
  AlertTriangle,
  User,
  Link,
  Camera,
  Upload,
  Loader2,
} from "lucide-react";
import { compressImage, getBase64SizeInKB } from "../utils/imageCompressor.js";

const AVATAR_PRESETS = [
  { label: "Blossom", url: "https://api.dicebear.com/9.x/notionists/svg?seed=Blossom&backgroundColor=fecdd3&radius=50" },
  { label: "Luna",    url: "https://api.dicebear.com/9.x/notionists/svg?seed=Luna&backgroundColor=e9d5ff&radius=50" },
  { label: "Sunny",   url: "https://api.dicebear.com/9.x/notionists/svg?seed=Sunny&backgroundColor=fef08a&radius=50" },
  { label: "Sky",     url: "https://api.dicebear.com/9.x/notionists/svg?seed=Sky&backgroundColor=bfdbfe&radius=50" },
  { label: "Rose",    url: "https://api.dicebear.com/9.x/notionists/svg?seed=Rose&backgroundColor=fda4af&radius=50" },
  { label: "Mint",    url: "https://api.dicebear.com/9.x/notionists/svg?seed=Mint&backgroundColor=a7f3d0&radius=50" },
  { label: "Peach",   url: "https://api.dicebear.com/9.x/notionists/svg?seed=Peach&backgroundColor=fed7aa&radius=50" },
  { label: "Violet",  url: "https://api.dicebear.com/9.x/notionists/svg?seed=Violet&backgroundColor=c4b5fd&radius=50" },
];

const CoupleSettingsModal = ({ isOpen, onClose, couple, onUpdateCouple, onReset }) => {
  const [tab, setTab] = useState("profile"); // "profile" | "relationship" | "danger"
  const [formA, setFormA] = useState({ name: "", avatar: "" });
  const [formB, setFormB] = useState({ name: "", avatar: "" });
  const [status, setStatus] = useState("dating");
  const [startDate, setStartDate] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const [compressingA, setCompressingA] = useState(false);
  const [compressingB, setCompressingB] = useState(false);
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);

  useEffect(() => {
    if (couple && isOpen) {
      const userAData = couple.user1 || couple.userA || {};
      const userBData = couple.user2 || couple.userB || {};
      setFormA({ name: userAData.name || "", avatar: userAData.avatar || "" });
      setFormB({ name: userBData.name || "", avatar: userBData.avatar || "" });
      setStatus(couple.status || "dating");
      setStartDate(couple.startDate || "");
      setErrorA("");
      setErrorB("");
      setCompressingA(false);
      setCompressingB(false);
    }
  }, [couple, isOpen]);

  const handleAvatarUploadA = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorA("");
    setCompressingA(true);
    try {
      // Co kích thước chuẩn chân dung 400px, quality 0.7 -> ~20KB - 40KB
      const base64 = await compressImage(file, 400, 0.7);
      setFormA((p) => ({ ...p, avatar: base64 }));
    } catch (err) {
      console.error("Lỗi nén avatar A:", err);
      setErrorA("Không thể xử lý ảnh này. Thử chọn ảnh khác.");
    } finally {
      setCompressingA(false);
    }
  };

  const handleAvatarUploadB = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorB("");
    setCompressingB(true);
    try {
      const base64 = await compressImage(file, 400, 0.7);
      setFormB((p) => ({ ...p, avatar: base64 }));
    } catch (err) {
      console.error("Lỗi nén avatar B:", err);
      setErrorB("Không thể xử lý ảnh này. Thử chọn ảnh khác.");
    } finally {
      setCompressingB(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const currentA = couple?.user1 || couple?.userA || {};
    const currentB = couple?.user2 || couple?.userB || {};

    const updatedA = {
      ...currentA,
      name: formA.name.trim() || currentA.name || "User 1",
      avatar: formA.avatar || currentA.avatar,
    };
    const updatedB = {
      ...currentB,
      name: formB.name.trim() || currentB.name || "User 2",
      avatar: formB.avatar || currentB.avatar,
    };

    onUpdateCouple({
      userA: updatedA,
      userB: updatedB,
      user1: updatedA,
      user2: updatedB,
      status,
      startDate,
    });
    onClose();
  };

  const handleReset = () => {
    onReset();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-800 text-base">Cài đặt cặp đôi</h2>
              <p className="text-xs text-gray-400">Tuỳ chỉnh hồ sơ của hai người</p>
            </div>
          </div>
          <button id="close-settings-modal" onClick={onClose} className="w-9 h-9 rounded-2xl hover:bg-rose-50 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 bg-rose-50">
          {[
            { key: "profile",      label: "Hồ sơ",     icon: User },
            { key: "relationship", label: "Quan hệ",   icon: Heart },
            { key: "danger",       label: "Nguy hiểm", icon: AlertTriangle },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                id={`settings-tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  tab === t.key
                    ? t.key === "danger"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-white text-rose-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* PROFILE TAB */}
          {tab === "profile" && (
            <>
              {/* Người thứ nhất */}
              <div className="space-y-3 bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {formA.name || couple?.user1?.name || couple?.userA?.name || "Bạn thứ nhất"}
                    </h3>
                  </div>
                  {formA.avatar?.startsWith("data:") && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                      Ảnh thiết bị (~{getBase64SizeInKB(formA.avatar)} KB)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={formA.avatar || couple?.user1?.avatar || couple?.userA?.avatar}
                      alt={formA.name || "Ảnh đại diện"}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-300 shadow-sm bg-rose-100"
                    />
                    <button
                      type="button"
                      id="upload-avatar-a-btn"
                      onClick={() => fileInputARef.current?.click()}
                      disabled={compressingA}
                      className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div>
                      <label className="label mb-1">Tên / Biệt danh</label>
                      <input
                        id="name-a"
                        className="input-field py-2"
                        placeholder={couple?.user1?.name || couple?.userA?.name || "VD: Thanh Tiên"}
                        value={formA.name}
                        onChange={(e) => setFormA((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Button from device */}
                <input
                  type="file"
                  id="avatar-file-a"
                  ref={fileInputARef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUploadA}
                />
                <button
                  type="button"
                  id="btn-pick-avatar-a"
                  onClick={() => fileInputARef.current?.click()}
                  disabled={compressingA}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-rose-100/70 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {compressingA ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang nén ảnh chân dung...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Chọn ảnh chân dung từ máy (Album / Chụp ảnh)</span>
                    </>
                  )}
                </button>

                {errorA && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded-xl border border-red-200">
                    {errorA}
                  </p>
                )}

                {/* Avatar URL Option */}
                <div>
                  <label className="label mb-1">
                    <Link className="w-3 h-3 inline mr-1" />
                    Hoặc dán Link Avatar (URL)
                  </label>
                  <input
                    id="avatar-url-a"
                    className="input-field text-xs py-2"
                    placeholder="https://..."
                    value={formA.avatar?.startsWith("data:") ? "" : formA.avatar}
                    onChange={(e) => setFormA((p) => ({ ...p, avatar: e.target.value }))}
                  />
                </div>

                {/* Avatar presets */}
                <div>
                  <label className="label mb-1 text-[11px] text-gray-400">Chọn Avatar minh họa có sẵn</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVATAR_PRESETS.map((av) => (
                      <button
                        key={av.label}
                        id={`avatar-a-${av.label}`}
                        type="button"
                        onClick={() => setFormA((p) => ({ ...p, avatar: av.url }))}
                        title={av.label}
                        className={`w-8 h-8 rounded-xl overflow-hidden ring-2 transition-all duration-200 ${
                          formA.avatar === av.url ? "ring-rose-500 scale-110 shadow-sm" : "ring-transparent hover:ring-rose-300"
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-rose-100" />

              {/* Người thứ hai */}
              <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {formB.name || couple?.user2?.name || couple?.userB?.name || "Bạn thứ hai"}
                    </h3>
                  </div>
                  {formB.avatar?.startsWith("data:") && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Ảnh thiết bị (~{getBase64SizeInKB(formB.avatar)} KB)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={formB.avatar || couple?.user2?.avatar || couple?.userB?.avatar}
                      alt={formB.name || "Ảnh đại diện"}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-300 shadow-sm bg-blue-100"
                    />
                    <button
                      type="button"
                      id="upload-avatar-b-btn"
                      onClick={() => fileInputBRef.current?.click()}
                      disabled={compressingB}
                      className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div>
                      <label className="label mb-1">Tên / Biệt danh</label>
                      <input
                        id="name-b"
                        className="input-field py-2"
                        placeholder={couple?.user2?.name || couple?.userB?.name || "VD: Bảo Nam"}
                        value={formB.name}
                        onChange={(e) => setFormB((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Button from device */}
                <input
                  type="file"
                  id="avatar-file-b"
                  ref={fileInputBRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUploadB}
                />
                <button
                  type="button"
                  id="btn-pick-avatar-b"
                  onClick={() => fileInputBRef.current?.click()}
                  disabled={compressingB}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-blue-100/70 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {compressingB ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang nén ảnh chân dung...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Chọn ảnh chân dung từ máy (Album / Chụp ảnh)</span>
                    </>
                  )}
                </button>

                {errorB && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded-xl border border-red-200">
                    {errorB}
                  </p>
                )}

                {/* Avatar URL Option */}
                <div>
                  <label className="label mb-1">
                    <Link className="w-3 h-3 inline mr-1" />
                    Hoặc dán Link Avatar (URL)
                  </label>
                  <input
                    id="avatar-url-b"
                    className="input-field text-xs py-2"
                    placeholder="https://..."
                    value={formB.avatar?.startsWith("data:") ? "" : formB.avatar}
                    onChange={(e) => setFormB((p) => ({ ...p, avatar: e.target.value }))}
                  />
                </div>

                {/* Avatar presets */}
                <div>
                  <label className="label mb-1 text-[11px] text-gray-400">Chọn Avatar minh họa có sẵn</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVATAR_PRESETS.map((av) => (
                      <button
                        key={av.label}
                        id={`avatar-b-${av.label}`}
                        type="button"
                        onClick={() => setFormB((p) => ({ ...p, avatar: av.url }))}
                        title={av.label}
                        className={`w-8 h-8 rounded-xl overflow-hidden ring-2 transition-all duration-200 ${
                          formB.avatar === av.url ? "ring-blue-500 scale-110 shadow-sm" : "ring-transparent hover:ring-blue-300"
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RELATIONSHIP TAB */}
          {tab === "relationship" && (
            <>
              <div>
                <label className="label">Trạng thái mối quan hệ</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "exploring", label: "🌸 Đang tìm hiểu", desc: "Chúng ta đang tìm hiểu nhau" },
                    { val: "dating",    label: "💑 Đang hẹn hò",    desc: "Chính thức là người yêu" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      id={`status-${opt.val}-btn`}
                      onClick={() => setStatus(opt.val)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                        status === opt.val
                          ? "border-rose-400 bg-rose-50"
                          : "border-gray-200 bg-white hover:border-rose-200"
                      }`}
                    >
                      <div className="font-semibold text-sm text-rose-700">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label"><Calendar className="w-3 h-3 inline mr-1" />Ngày bắt đầu</label>
                <input
                  id="settings-start-date"
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </>
          )}

          {/* DANGER TAB */}
          {tab === "danger" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-red-700 text-sm">Vùng nguy hiểm</h3>
                </div>
                <p className="text-xs text-red-500 leading-relaxed">
                  Hành động bên dưới sẽ <strong>xóa toàn bộ dữ liệu</strong> (địa điểm, lịch hẹn, cài đặt cặp đôi) và đưa ứng dụng về trạng thái ban đầu. Không thể hoàn tác!
                </p>
              </div>

              {!confirmReset ? (
                <button
                  id="reset-app-btn"
                  onClick={() => setConfirmReset(true)}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border-2 border-red-200 font-semibold py-3 rounded-2xl hover:bg-red-100 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" /> Hủy ghép đôi & Reset dữ liệu
                </button>
              ) : (
                <div className="space-y-3 animate-slide-up">
                  <p className="text-sm text-center font-semibold text-red-600">Bạn thật sự chắc chắn không?</p>
                  <div className="flex gap-3">
                    <button
                      id="confirm-reset-btn"
                      onClick={handleReset}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold py-2.5 rounded-2xl hover:shadow-lg transition-all duration-200 active:scale-95"
                    >
                      Xác nhận Reset
                    </button>
                    <button
                      id="cancel-reset-btn"
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-2xl hover:bg-gray-200 transition-all duration-200"
                    >
                      Thôi không
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab !== "danger" && (
          <div className="p-5 border-t border-rose-100 flex gap-3">
            <button id="save-settings-btn" onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              <Check className="w-4 h-4" /> Lưu thay đổi
            </button>
            <button id="cancel-settings-btn" onClick={onClose} className="btn-secondary px-6 py-3">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoupleSettingsModal;
