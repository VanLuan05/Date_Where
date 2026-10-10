import { useState, lazy, Suspense } from "react";
import {
  Heart,
  Edit3,
  Calendar,
  Settings,
  Check,
  X,
  Share2,
} from "lucide-react";
import {
  getDaysTogether,
  getMilestoneMessage,
  getNextMilestone,
  formatDate,
} from "../../utils/helpers.js";
import { MILESTONE_MESSAGES } from "../../data/mockData.js";

const ShareCardModal = lazy(() => import("../ShareCardModal.jsx"));

/**
 * CoupleHeroCard
 * ─────────────────────────────────────────────────
 * Phần trên cùng của tab "Đôi mình":
 *  • Profile lồng avatar + tên đôi + ngày bắt đầu
 *  • Bộ đếm ngày (số lớn + tuần)
 *  • Progress bar mốc tiếp theo (mỏng, tinh tế)
 *  • Inline edit panel (giữ nguyên logic cũ)
 */
const CoupleHeroCard = ({ couple, currentUser, onUpdateCouple }) => {
  const [editMode, setEditMode] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editStatus, setEditStatus] = useState(couple?.status || "exploring");
  const [editDate, setEditDate] = useState(couple?.startDate || "");

  if (!couple) return null;

  const userA = couple?.user1 || couple?.userA || { name: "Bạn", avatar: "" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy", avatar: "" };
  const isCurrentUserA = currentUser === "userA" || currentUser === "user1";
  const isCurrentUserB = currentUser === "userB" || currentUser === "user2";

  const days = getDaysTogether(couple.startDate);
  const weeks = Math.floor(days / 7);
  const milestoneMsg = getMilestoneMessage(days, MILESTONE_MESSAGES);
  const nextMilestone = getNextMilestone(days, MILESTONE_MESSAGES);
  const progressPct =
    nextMilestone && days > 0
      ? Math.min(100, Math.round((days / nextMilestone.days) * 100))
      : days > 0
      ? 100
      : 0;

  const handleSave = () => {
    onUpdateCouple({ status: editStatus, startDate: editDate });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditStatus(couple.status);
    setEditDate(couple.startDate);
    setEditMode(false);
  };

  return (
    <div className="couple-hero-card">
      {/* ── Gradient hero banner ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-5 shadow-[0_0_40px_rgba(244,63,94,0.35)]">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Floating emoji sparkles */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2.5 text-white/20 text-base select-none pointer-events-none">
          {"💕💖🌸💝✨".split("").map((c, i) => (
            <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
              {c}
            </span>
          ))}
        </div>

        {/* Top bar: status badge + edit button */}
        <div className="relative flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 bg-white/25 text-white border border-white/30 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            {couple.status === "dating" ? "💑 Đang hẹn hò" : "🌸 Đang tìm hiểu"}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="share-hero-btn"
              onClick={() => setShowShare(true)}
              title="Khoe cột mốc đôi mình"
              className="h-9 px-3 bg-white/20 hover:bg-white/35 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 text-white text-xs font-bold"
            >
              <Share2 className="w-4 h-4" /> Khoe
            </button>
            <button
              id="edit-couple-btn"
              onClick={() => setEditMode(!editMode)}
              className="w-9 h-9 bg-white/20 hover:bg-white/35 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Overlapping avatars */}
        <div className="relative flex items-center justify-center mb-3">
          <div className="flex items-center -space-x-4">
            <div className="relative">
              <img
                src={userA.avatar}
                alt={userA.name}
                className="w-[72px] h-[72px] rounded-full ring-4 ring-white shadow-xl object-cover bg-rose-200"
              />
              {isCurrentUserA && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] shadow-sm animate-bounce-soft" title="Bạn">
                  👑
                </div>
              )}
            </div>
            <div className="z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-romantic border-2 border-rose-200 -mx-1">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-heart-beat" />
            </div>
            <div className="relative">
              <img
                src={userB.avatar}
                alt={userB.name}
                className="w-[72px] h-[72px] rounded-full ring-4 ring-white shadow-xl object-cover bg-blue-200"
              />
              {isCurrentUserB && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] shadow-sm animate-bounce-soft" title="Bạn">
                  👑
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Names + start date */}
        <div className="text-center mb-4">
          <h2 className="font-display text-[18px] font-bold text-white leading-tight">
            {userA.name} &amp; {userB.name}
          </h2>
          {couple.startDate && (
            <p className="text-white/70 text-[11px] mt-0.5">
              Từ ngày {formatDate(couple.startDate)}
            </p>
          )}
        </div>

        {/* ── Inline Day Counter (inside hero) ── */}
        {couple.startDate && (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
            {/* Big number */}
            <div className="flex items-end justify-center gap-2">
              <span className="font-display text-5xl font-black text-white leading-none drop-shadow-sm">
                {days}
              </span>
              <div className="text-left mb-1">
                <span className="text-white font-bold text-lg block leading-none">ngày</span>
                <span className="text-white/70 text-[11px]">{weeks} tuần</span>
              </div>
            </div>

            {/* Milestone message */}
            <p className="text-white/85 text-[11px] font-serif italic mt-1.5 leading-snug">
              {milestoneMsg}
            </p>

            {/* Progress bar to next milestone */}
            {nextMilestone && (
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-white/70 mb-1 font-medium">
                  <span>{days} ngày</span>
                  <span>🎯 {nextMilestone.days} ngày</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000 relative"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute right-0 top-0 h-full w-0.5 bg-white/60 rounded-full" />
                  </div>
                </div>
                <p className="text-white/75 text-[10px] mt-1 font-medium">
                  Còn {nextMilestone.days - days} ngày đến mốc tiếp theo
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state: no start date */}
        {!couple.startDate && (
          <div className="text-center mt-2">
            <button
              id="set-date-btn"
              onClick={() => setEditMode(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-white/30 transition-all active:scale-95"
            >
              + Thiết lập ngày bắt đầu
            </button>
          </div>
        )}
      </div>

      {/* ── Edit Panel (slide in below hero) ── */}
      {editMode && (
        <div className="card-static p-5 mt-3 space-y-4 animate-slide-up border-2 border-rose-200">
          <h3 className="font-semibold text-rose-700 flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" /> Cài đặt mối quan hệ
          </h3>

          <div>
            <label className="label">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "exploring", label: "🌸 Đang tìm hiểu", desc: "Chúng ta đang tìm hiểu nhau" },
                { val: "dating", label: "💑 Đang hẹn hò", desc: "Chính thức là người yêu" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  id={`status-${opt.val}-btn`}
                  onClick={() => setEditStatus(opt.val)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                    editStatus === opt.val
                      ? "border-rose-400 bg-rose-50 shadow-inner-rose"
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
            <label className="label">
              <Calendar className="w-3 h-3 inline mr-1" />
              Ngày bắt đầu
            </label>
            <input
              id="start-date-input"
              type="date"
              className="input-field"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="flex gap-2">
            <button
              id="save-couple-btn"
              onClick={handleSave}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <Check className="w-4 h-4" /> Lưu lại
            </button>
            <button
              id="cancel-couple-btn"
              onClick={handleCancel}
              className="btn-secondary flex items-center justify-center px-4 py-2.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Share cột mốc (lazy — html2canvas chỉ tải khi bấm Khoe) */}
      {showShare && (
        <Suspense fallback={null}>
          <ShareCardModal
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            kind="hero"
            coupleCode={couple?.coupleCode || couple?.inviteCode}
            data={{
              names: `${userA.name} & ${userB.name}`,
              days,
              message: milestoneMsg,
              avatars: [userA.avatar, userB.avatar],
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default CoupleHeroCard;
