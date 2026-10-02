import { useState, useEffect, useMemo } from "react";
import {
  Heart,
  Calendar,
  Settings,
  Edit3,
  Check,
  X,
  Star,
  Gift,
  TrendingUp,
  Sparkles,
  Compass,
  Bell,
  Clock,
  CalendarHeart,
} from "lucide-react";
import {
  getDaysTogether,
  getMilestoneMessage,
  getNextMilestone,
  formatDate,
  isUpcoming,
} from "../utils/helpers.js";
import { getWeatherForecastForDate } from "../utils/weatherService.js";
import { MILESTONE_MESSAGES } from "../data/mockData.js";
import { DateReminderPermissionBanner } from "./DateReminderToast.jsx";
import {
  getHoursUntilDate,
  REMINDER_MILESTONES,
  isReminderSent,
} from "../utils/notificationService.js";

const Dashboard = ({
  couple,
  currentUser,
  onUpdateCouple,
  placesCount,
  datesCount,
  dates = [],
  places = [],
  onOpenSettings,
  onOpenBlindMatch,
  onOpenLoveMap,
  onOpenAvailability,
  blindSwipes,
  matchedFreeDays = [],
  notifPermission,
  onEnableNotifications,
  onTestNotification,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState(couple?.status || "exploring");
  const [editDate, setEditDate] = useState(couple?.startDate || "");
  const [days, setDays] = useState(0);

  const matchedCount = useMemo(() => {
    return Object.values(blindSwipes || {}).filter((s) => s.matched).length;
  }, [blindSwipes]);

  const visitedPlacesCount = useMemo(() => {
    return (places || []).filter((p) => p.visited).length;
  }, [places]);

  useEffect(() => {
    if (couple?.startDate) {
      setDays(getDaysTogether(couple.startDate));
    }
    const timer = setInterval(() => {
      if (couple?.startDate) setDays(getDaysTogether(couple.startDate));
    }, 60000);
    return () => clearInterval(timer);
  }, [couple?.startDate]);

  if (!couple) return null;

  const userA = couple.user1 || couple.userA;
  const userB = couple.user2 || couple.userB;
  const isCurrentUserA = currentUser === "userA" || currentUser === "user1";
  const isCurrentUserB = currentUser === "userB" || currentUser === "user2";
  const milestoneMsg = getMilestoneMessage(days, MILESTONE_MESSAGES);
  const nextMilestone = getNextMilestone(days, MILESTONE_MESSAGES);

  const handleSave = () => {
    onUpdateCouple({ status: editStatus, startDate: editDate });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditStatus(couple.status);
    setEditDate(couple.startDate);
    setEditMode(false);
  };

  const progressPct = nextMilestone && days > 0
    ? Math.min(100, Math.round((days / nextMilestone.days) * 100))
    : (days > 0 ? 100 : 0);


  // Buổi hẹn tiếp theo gần nhất
  const nextDate = useMemo(() => {
    return (
      (dates || [])
        .filter((d) => d.status === "upcoming" && isUpcoming(d.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null
    );
  }, [dates]);

  const [nextWeather, setNextWeather] = useState(null);

  useEffect(() => {
    if (!nextDate?.date) {
      setNextWeather(null);
      return;
    }
    let isMounted = true;
    getWeatherForecastForDate(nextDate.date)
      .then((res) => {
        if (isMounted) setNextWeather(res);
      })
      .catch(() => {
        if (isMounted) setNextWeather(null);
      });
    return () => {
      isMounted = false;
    };
  }, [nextDate?.date]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Couple Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 text-white/20 text-xl select-none pointer-events-none">
          {"💕💖🌸💝✨".split("").map((c, i) => <span key={i} className="animate-float" style={{animationDelay:`${i*0.3}s`}}>{c}</span>)}
        </div>

        {/* Status badge */}
        <div className="relative flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 bg-white/25 text-white border border-white/30 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            {couple.status === "dating" ? "💑 Đang hẹn hò" : "🌸 Đang tìm hiểu"}
          </span>
          <button
            id="edit-couple-btn"
            onClick={() => setEditMode(!editMode)}
            className="w-9 h-9 bg-white/20 hover:bg-white/35 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <Edit3 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Avatars */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="flex items-center -space-x-4">
            <div className="relative">
              <img
                src={userA.avatar}
                alt={userA.name}
                className="w-20 h-20 rounded-full ring-4 ring-white shadow-xl object-cover bg-rose-200"
              />
              {isCurrentUserA && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-sm animate-bounce-soft" title="Bạn là người này">
                  👑
                </div>
              )}
            </div>
            <div className="z-10 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-romantic border-2 border-rose-200 -mx-1.5">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-heart-beat" />
            </div>
            <div className="relative">
              <img
                src={userB.avatar}
                alt={userB.name}
                className="w-20 h-20 rounded-full ring-4 ring-white shadow-xl object-cover bg-blue-200"
              />
              {isCurrentUserB && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-sm animate-bounce-soft" title="Bạn là người này">
                  👑
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Names */}
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-white">
            {userA.name} & {userB.name}
          </h2>
          {couple.startDate && (
            <p className="text-white/70 text-xs mt-0.5">Từ ngày {formatDate(couple.startDate)}</p>
          )}
        </div>
      </div>

      {/* ── Blind Match Banner Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-5 text-white shadow-romantic group hover:shadow-card-hover transition-all duration-300">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">✨</span>
              <h3 className="font-display font-bold text-lg leading-tight text-white">
                Quẹt quán bí mật (Blind Match)
              </h3>
              {matchedCount > 0 && (
                <span className="bg-white text-rose-600 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm animate-bounce-soft inline-flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-600" /> {matchedCount} quán đã Match!
                </span>
              )}
            </div>
            <p className="text-xs text-rose-100 max-w-md leading-relaxed">
              Khám phá xem hôm nay hai đứa cùng muốn đi đâu 💕 Cả hai cùng thích quán nào thì tự động Match ngay!
            </p>
          </div>

          <button
            type="button"
            id="open-blind-match-dashboard-btn"
            onClick={onOpenBlindMatch}
            className="self-start sm:self-auto shrink-0 bg-white text-rose-600 hover:bg-rose-50 font-bold px-4 py-2.5 rounded-2xl shadow-md text-xs flex items-center gap-1.5 transition-all active:scale-95 group-hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Bắt đầu quẹt</span>
          </button>
        </div>
      </div>

      {/* ── Availability Matcher Widget Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 p-5 text-white shadow-romantic group hover:shadow-card-hover transition-all duration-300">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">📅</span>
              <h3 className="font-display font-bold text-lg leading-tight text-white">
                Lịch rảnh đôi mình
              </h3>
              {matchedFreeDays.length > 0 && (
                <span className="bg-white text-fuchsia-600 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm animate-bounce-soft inline-flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-fuchsia-600" /> {matchedFreeDays.length} ngày trùng!
                </span>
              )}
            </div>
            <p className="text-xs text-fuchsia-100 max-w-md leading-relaxed">
              {(() => {
                if (matchedFreeDays.length === 0) {
                  return "Cập nhật ngày rảnh của bạn để tìm ngày hẹn hò chung 💕";
                }
                // Find upcoming matched date
                const todayStr = new Date().toISOString().split("T")[0];
                const upcoming = matchedFreeDays.find((m) => m.dateStr >= todayStr);
                if (upcoming) {
                  const d = new Date(upcoming.dateStr + "T00:00:00");
                  const dayOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][d.getDay()];
                  const dateLabel = `${dayOfWeek}, ${d.getDate()}/${d.getMonth() + 1}`;
                  return `${dateLabel} hai đứa mình đều rảnh nè, đi date thôi! 💖`;
                }
                return `Có ${matchedFreeDays.length} ngày hai đứa cùng rảnh, hẹn hò thôi! ✨`;
              })()}
            </p>
          </div>

          <button
            type="button"
            id="open-availability-dashboard-btn"
            onClick={onOpenAvailability}
            className="self-start sm:self-auto shrink-0 bg-white text-fuchsia-600 hover:bg-fuchsia-50 font-bold px-4 py-2.5 rounded-2xl shadow-md text-xs flex items-center gap-1.5 transition-all active:scale-95 group-hover:scale-105 cursor-pointer"
          >
            <CalendarHeart className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>Xem lịch</span>
          </button>
        </div>
      </div>

      {/* Edit Panel */}
      {editMode && (
        <div className="card-static p-5 space-y-4 animate-slide-up border-2 border-rose-200">
          <h3 className="font-semibold text-rose-700 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Cài đặt mối quan hệ
          </h3>
          <div>
            <label className="label">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "exploring", label: "🌸 Đang tìm hiểu", desc: "Chúng ta đang tìm hiểu nhau" },
                { val: "dating", label: "💑 Đang hẹn hò", desc: "Chính thức là người yêu" },
              ].map(opt => (
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
            <label className="label"><Calendar className="w-3 h-3 inline mr-1" />Ngày bắt đầu</label>
            <input
              id="start-date-input"
              type="date"
              className="input-field"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="flex gap-2">
            <button id="save-couple-btn" onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5">
              <Check className="w-4 h-4" /> Lưu lại
            </button>
            <button id="cancel-couple-btn" onClick={handleCancel} className="btn-secondary flex items-center justify-center px-4 py-2.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Anniversary Counter */}
      {couple.startDate ? (
        <div className="card-static p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-rose-500">
            <Star className="w-4 h-4 fill-rose-400" />
            <span className="text-sm font-semibold uppercase tracking-wide text-rose-600">Chúng ta đã bên nhau</span>
            <Star className="w-4 h-4 fill-rose-400" />
          </div>

          <div className="flex items-end justify-center gap-2 py-2">
            <span className="font-display text-8xl font-bold text-gradient-rose leading-none">{days}</span>
            <div className="text-left mb-3">
              <span className="text-rose-500 font-bold text-xl block">ngày</span>
              <span className="text-xs text-gray-400">{Math.floor(days / 7)} tuần</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 italic px-4 bg-rose-50 rounded-2xl py-3">{milestoneMsg}</p>

          {nextMilestone && (
            <div className="mt-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span className="font-medium text-rose-600">{days} ngày</span>
                <span className="font-medium">🎯 {nextMilestone.days} ngày</span>
              </div>
              <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="absolute right-0 top-0 h-full w-1 bg-white/50 rounded-full" />
                </div>
              </div>
              <p className="text-xs text-rose-500 mt-2 font-medium">Còn {nextMilestone.days - days} ngày nữa đến mốc tiếp theo!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-static p-6 text-center border-2 border-dashed border-rose-200">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-rose-700 font-semibold text-lg">Chưa có ngày kỷ niệm</p>
          <p className="text-sm text-gray-500 mt-1 px-4">Thiết lập ngày bắt đầu để biết đã bên nhau bao lâu!</p>
          <button
            id="set-date-btn"
            onClick={() => setEditMode(true)}
            className="btn-primary mt-4 text-sm"
          >
            Thiết lập ngày
          </button>
        </div>
      )}

      {/* ── CARD BUỔI HẸN TIẾP THEO & DỰ BÁO THỜI TIẾT ── */}
      {nextDate && (
        <div className="card-static p-5 bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 border-2 border-rose-100 rounded-3xl shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-rose-500" /> Buổi hẹn tiếp theo
            </span>
            <span className="text-xs font-serif text-stone-500 font-medium">
              {formatDate(nextDate.date)} {nextDate.time ? `• ${nextDate.time}` : ""}
            </span>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg text-stone-800">
              {nextDate.placeName}
            </h4>
            {nextDate.notes && (
              <p className="text-xs text-stone-500 font-serif italic mt-0.5 line-clamp-1">
                "{nextDate.notes}"
              </p>
            )}
          </div>

          {/* Dòng trạng thái dự báo thời tiết Open-Meteo */}
          {nextWeather?.available ? (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 transition-all ${
                nextWeather.isRainy
                  ? "bg-blue-50/80 border-blue-200 text-blue-900 shadow-xs ring-1 ring-blue-300/40"
                  : "bg-gradient-to-r from-amber-50/70 via-rose-50/60 to-pink-50/70 border-rose-200/80 text-stone-800"
              }`}
            >
              <span className="text-xl select-none flex-shrink-0">{nextWeather.icon}</span>
              <div className="min-w-0 flex-1 font-serif">
                <p className="font-sans font-bold text-xs text-stone-800">
                  {nextWeather.tempMin}° - {nextWeather.tempMax}°C • Xác suất mưa: {nextWeather.rainProb}% • {nextWeather.label}
                </p>
                <p className="text-[11px] italic text-stone-600 truncate mt-0.5">
                  "{nextWeather.advice}"
                </p>
              </div>
            </div>
          ) : nextWeather && !nextWeather.available && nextWeather.tooFar ? (
            <p className="text-[11px] text-stone-400 font-serif italic">
              ✨ Dự báo thời tiết sẽ sẵn sàng trong vòng 14 ngày trước buổi hẹn
            </p>
          ) : null}

          {/* Dòng thông báo nhắc hẹn tự động theo mốc (24h, 12h, 9h, 3h, 1h) */}
          {(() => {
            const remainingHours = getHoursUntilDate(nextDate.date, nextDate.time);
            if (remainingHours === null || remainingHours <= 0) return null;

            return (
              <div className="pt-2 border-t border-rose-100/70 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-serif text-stone-600">
                  <span className="flex items-center gap-1 font-sans font-semibold text-rose-700">
                    <Bell className="w-3.5 h-3.5 text-rose-500 animate-wiggle" />
                    Nhắc hẹn điện thoại:
                  </span>
                  <span className="text-stone-500 font-medium">
                    {remainingHours >= 24
                      ? `Còn ~${Math.round(remainingHours / 24)} ngày nữa`
                      : `Còn ~${Math.round(remainingHours)} tiếng nữa`}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-sans font-semibold">
                  {REMINDER_MILESTONES.map((m) => {
                    const isPassed = remainingHours <= m.minHours;
                    const isCurrent =
                      remainingHours > m.minHours && remainingHours <= m.maxHours;
                    const isSent = isReminderSent(nextDate.id, m.id);

                    return (
                      <div
                        key={m.id}
                        className={`py-1 px-0.5 rounded-xl border transition-all ${
                          isSent
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                            : isCurrent
                            ? "bg-rose-500 border-rose-600 text-white shadow-xs font-bold animate-pulse"
                            : isPassed
                            ? "bg-stone-50 border-stone-200 text-stone-400 opacity-60"
                            : "bg-white/90 border-rose-100 text-rose-600"
                        }`}
                        title={`${m.label} (${m.badge})`}
                      >
                        <span className="block truncate">
                          {isSent ? "✓ " : ""}
                          {m.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Gợi ý bật thông báo trên điện thoại nếu chưa cấp quyền */}
      {notifPermission && (
        <DateReminderPermissionBanner
          permission={notifPermission}
          onEnable={onEnableNotifications}
          onTest={() =>
            onTestNotification?.(nextDate?.placeName || "The Workshop Coffee")
          }
        />
      )}

      {/* ── CARD BẢN ĐỒ KỶ NIỆM (LOVE FOOTPRINT WIDGET) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-white p-5 sm:p-6 shadow-card group hover:shadow-card-hover transition-all duration-300 border border-rose-900/40">
        {/* Stylized Map Grid & Heart Glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-rose-500/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        
        {/* Floating Mini Pins Preview (Illustrative Map Graphic) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 opacity-80 pointer-events-none">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-rose-300 text-sm shadow-sm animate-bounce-soft">
            💖
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-pink-300 text-xs shadow-sm" style={{ animationDelay: "0.5s" }}>
            📍
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl select-none">🗺️</span>
              <h3 className="font-display font-bold text-lg text-white tracking-wide">
                Bản đồ kỷ niệm
              </h3>
              <span className="bg-rose-500/30 text-rose-300 border border-rose-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-serif">
                Footprint Map
              </span>
            </div>
            <p className="text-xs text-rose-100/90 font-serif leading-relaxed">
              Hai bạn đã thắp sáng{" "}
              <strong className="text-white font-sans text-sm underline decoration-rose-400 decoration-2 underline-offset-2">
                {visitedPlacesCount}
              </strong>{" "}
              góc phố cùng nhau ✨
            </p>
          </div>

          <button
            type="button"
            id="open-love-map-dashboard-btn"
            onClick={onOpenLoveMap}
            className="self-start sm:self-auto shrink-0 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-romantic text-xs flex items-center gap-2 transition-all active:scale-95 group-hover:scale-105 cursor-pointer"
          >
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>Mở toàn bộ bản đồ</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "📍", label: "Địa điểm", value: placesCount || 0, color: "from-amber-400 to-orange-400" },
          { icon: "📅", label: "Lịch hẹn", value: datesCount || 0, color: "from-blue-400 to-cyan-400" },
          { icon: "💖", label: "Ngày bên nhau", value: days, color: "from-rose-400 to-pink-400" },
        ].map((stat, i) => (
          <div key={i} className="card p-4 text-center">
            <div className={`w-10 h-10 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="font-display text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
