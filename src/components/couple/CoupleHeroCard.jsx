import { useState, useEffect } from "react";
import {
  Heart,
  Edit3,
  Calendar,
  Settings,
  Check,
  X,
  QrCode,
} from "lucide-react";
import {
  getDaysTogether,
  getMilestoneMessage,
  getNextMilestone,
  formatDate,
} from "../../utils/helpers.js";
import { nextLoveAnniversary } from "../../utils/journey.js";
import { MILESTONE_MESSAGES } from "../../data/mockData.js";

/**
 * CoupleHeroCard
 * ─────────────────────────────────────────────────
 * Phần trên cùng của tab "Đôi mình":
 *  • Profile lồng avatar + tên đôi + ngày bắt đầu
 *  • Bộ đếm ngày (số lớn + tuần)
 *  • Progress bar mốc tiếp theo (mỏng, tinh tế)
 *  • Inline edit panel (giữ nguyên logic cũ)
 */
const CoupleHeroCard = ({ couple, currentUser, onUpdateCouple, onOpenInvite }) => {
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState(couple?.status || "exploring");
  const [editDate, setEditDate] = useState(couple?.startDate || "");
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const days = getDaysTogether(couple?.startDate);

  // P2 — count-up số ngày yêu khi mount (tôn trọng prefers-reduced-motion)
  const [displayDays, setDisplayDays] = useState(days);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplayDays(days);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplayDays(Math.round(days * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [days]);

  // P2 — hero parallax nhẹ: avatar/cover dịch theo scroll (CSS transform)
  const [parallaxY, setParallaxY] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setParallaxY(Math.min(36, Math.max(0, window.scrollY * 0.06)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!couple) return null;

  const userA = couple?.user1 || couple?.userA || { name: "Bạn", avatar: "" };
  const userB = couple?.user2 || couple?.userB || { name: "Người ấy", avatar: "" };
  const isCurrentUserA = currentUser === "userA" || currentUser === "user1";
  const isCurrentUserB = currentUser === "userB" || currentUser === "user2";

  const weeks = Math.floor(days / 7);
  const milestoneMsg = getMilestoneMessage(days, MILESTONE_MESSAGES);
  const nextMilestone = getNextMilestone(days, MILESTONE_MESSAGES);
  const progressPct =
    nextMilestone && days > 0
      ? Math.min(100, Math.round((days / nextMilestone.days) * 100))
      : days > 0
      ? 100
      : 0;
  const loveAnniv = nextLoveAnniversary(couple.startDate, [100, 365, 500, 730, 1000], nowMs);

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
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-5 shadow-romantic">
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
            {onOpenInvite && (
              <button
                id="open-invite-btn"
                onClick={onOpenInvite}
                title="Mời người ấy (QR + link)"
                aria-label="Mời người ấy (QR và liên kết)"
                className="h-9 px-3 bg-white/20 hover:bg-white/35 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 text-white text-xs font-bold"
              >
                <QrCode className="w-4 h-4" />
                Mời người ấy
                {(couple?.coupleCode || couple?.inviteCode) && (
                  <span className="font-mono tracking-widest opacity-90">
                    {couple.coupleCode || couple.inviteCode}
                  </span>
                )}
              </button>
            )}
            <button
              id="edit-couple-btn"
              onClick={() => setEditMode(!editMode)}
              className="w-9 h-9 bg-white/20 hover:bg-white/35 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Overlapping avatars (P2: parallax nhẹ theo scroll) */}
        <div
          className="relative flex items-center justify-center mb-3"
          style={{ transform: `translateY(${parallaxY * 0.5}px)` }}
        >
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
          <h2 className="font-display text-title font-semibold text-white leading-tight">
            {userA.name} &amp; {userB.name}
          </h2>
          {couple.startDate && (
            <p className="text-white/80 text-xs mt-0.5">
              Từ ngày {formatDate(couple.startDate)}
            </p>
          )}
        </div>

        {/* ── Inline Day Counter (inside hero, P2: count-up + parallax ngược nhẹ) ── */}
        {couple.startDate && (
          <div
            className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20"
            style={{ transform: `translateY(${parallaxY * -0.3}px)` }}
          >
            {/* Big number */}
            <div className="flex items-end justify-center gap-2">
              <span className="font-display text-5xl font-black text-white leading-none drop-shadow-sm tabular-nums">
                {displayDays}
              </span>
              <div className="text-left mb-1">
                <span className="text-white font-bold text-lg block leading-none">ngày</span>
                <span className="text-white/80 text-xs">{weeks} tuần</span>
              </div>
            </div>

            {/* Milestone message */}
            <p className="text-white/85 text-xs font-serif italic mt-1.5 leading-snug">
              {milestoneMsg}
            </p>

            {/* Progress bar to next milestone */}
            {nextMilestone && (
              <div className="mt-2.5">
                <div className="flex justify-between text-xs text-white/80 mb-1 font-medium">
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
                <p className="text-white/80 text-xs mt-1 font-medium">
                  Còn {nextMilestone.days - days} ngày đến mốc tiếp theo
                </p>
              </div>
            )}
            {/* Countdown kỷ niệm 100/365 ngày yêu (Cụm 5) */}
            {loveAnniv && (
              <div className="mt-2 bg-white/20 border border-white/25 rounded-2xl px-3 py-2 text-white text-center">
                <p className="text-xs font-bold">
                  💍 Còn {loveAnniv.daysLeft} ngày đến kỷ niệm {loveAnniv.milestone} ngày yêu
                </p>
                <p className="text-xs text-white/80 font-serif italic mt-0.5">
                  {loveAnniv.message}
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
        <div className="card-static p-4 mt-3 space-y-4 animate-slide-up">
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
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 ${
                    editStatus === opt.val
                      ? "border-rose-400 bg-rose-50 shadow-inner-rose"
                      : "border-gray-200 bg-white hover:border-rose-200"
                  }`}
                >
                  <div className="font-semibold text-sm text-rose-700">{opt.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{opt.desc}</div>
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

    </div>
  );
};

export default CoupleHeroCard;
