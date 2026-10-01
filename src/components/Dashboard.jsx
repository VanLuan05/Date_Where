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
  PiggyBank,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Coins,
} from "lucide-react";
import {
  getDaysTogether,
  getMilestoneMessage,
  getNextMilestone,
  formatDate,
  formatCurrency,
  calculateMonthlyBudget,
} from "../utils/helpers.js";
import { MILESTONE_MESSAGES } from "../data/mockData.js";

const Dashboard = ({
  couple,
  currentUser,
  onUpdateCouple,
  placesCount,
  datesCount,
  dates = [],
  onOpenSettings,
  onOpenBlindMatch,
  blindSwipes,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState(couple?.status || "exploring");
  const [editDate, setEditDate] = useState(couple?.startDate || "");
  const [days, setDays] = useState(0);

  // Month selector for budget widget
  const [budgetMonth, setBudgetMonth] = useState(() => new Date().getMonth());
  const [budgetYear, setBudgetYear] = useState(() => new Date().getFullYear());

  const matchedCount = useMemo(() => {
    return Object.values(blindSwipes || {}).filter((s) => s.matched).length;
  }, [blindSwipes]);

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

  const handlePrevMonth = () => {
    if (budgetMonth === 0) {
      setBudgetMonth(11);
      setBudgetYear((y) => y - 1);
    } else {
      setBudgetMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (budgetMonth === 11) {
      setBudgetMonth(0);
      setBudgetYear((y) => y + 1);
    } else {
      setBudgetMonth((m) => m + 1);
    }
  };

  const monthlyBudget = useMemo(() => {
    return calculateMonthlyBudget(dates || [], budgetMonth, budgetYear);
  }, [dates, budgetMonth, budgetYear]);

  const u1Pct =
    monthlyBudget.totalActual > 0
      ? Math.round((monthlyBudget.paidByUser1 / monthlyBudget.totalActual) * 100)
      : 50;
  const u2Pct = 100 - u1Pct;

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

      {/* Edit Panel */}
      {editMode && (
        <div className="card-static p-5 space-y-4 animate-slide-up border-2 border-rose-200">
          <h3 className="font-semibold text-rose-700 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Cai dat moi quan he
          </h3>
          <div>
            <label className="label">Trang thai</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "exploring", label: "?? Dang tim hieu", desc: "Chung ta dang tim hieu nhau" },
                { val: "dating", label: "?? Dang hen ho", desc: "Chinh thuc la nguoi yeu" },
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
            <label className="label"><Calendar className="w-3 h-3 inline mr-1" />Ngay bat dau</label>
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
              <Check className="w-4 h-4" /> Luu lai
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
            <span className="text-sm font-semibold uppercase tracking-wide text-rose-600">Chung ta da ben nhau</span>
            <Star className="w-4 h-4 fill-rose-400" />
          </div>

          <div className="flex items-end justify-center gap-2 py-2">
            <span className="font-display text-8xl font-bold text-gradient-rose leading-none">{days}</span>
            <div className="text-left mb-3">
              <span className="text-rose-500 font-bold text-xl block">ngay</span>
              <span className="text-xs text-gray-400">{Math.floor(days / 7)} tuan</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 italic px-4 bg-rose-50 rounded-2xl py-3">{milestoneMsg}</p>

          {nextMilestone && (
            <div className="mt-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span className="font-medium text-rose-600">{days} ngay</span>
                <span className="font-medium">?? {nextMilestone.days} ngay</span>
              </div>
              <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="absolute right-0 top-0 h-full w-1 bg-white/50 rounded-full" />
                </div>
              </div>
              <p className="text-xs text-rose-500 mt-2 font-medium">Con {nextMilestone.days - days} ngay nua den moc tiep theo!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-static p-6 text-center border-2 border-dashed border-rose-200">
          <div className="text-5xl mb-3">??</div>
          <p className="text-rose-700 font-semibold text-lg">Chua co ngay ky niem</p>
          <p className="text-sm text-gray-500 mt-1 px-4">Thiet lap ngay bat dau de bam biet da ben nhau bao lau!</p>
          <button
            id="set-date-btn"
            onClick={() => setEditMode(true)}
            className="btn-primary mt-4 text-sm"
          >
            Thiet lap ngay
          </button>
        </div>
      )}

      {/* ── WIDGET HŨ CHI TIÊU HẸN HÒ THÁNG NÀY ── */}
      <div className="card-static p-5 sm:p-6 bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 border-2 border-rose-100 rounded-3xl shadow-card space-y-4">
        {/* Header with Title & Month Selector */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-800 text-base leading-tight">
                Hũ chi tiêu hẹn hò
              </h3>
              <p className="text-xs text-stone-500 font-serif">Ngân sách ngọt ngào của đôi mình</p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-white/95 border border-rose-200/80 p-1 rounded-2xl shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-xl hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-stone-700 px-2 min-w-[85px] text-center font-serif">
              Tháng {budgetMonth + 1}/{budgetYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-xl hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Prominent Number */}
        <div className="pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block font-serif">
            Tổng chi tiêu thực tế trong tháng
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display text-3xl sm:text-4xl font-bold text-rose-600 tracking-tight">
              {formatCurrency(monthlyBudget.totalActual)}
            </span>
          </div>
        </div>

        {/* Progress: Actual vs Estimated */}
        <div className="space-y-1.5 font-serif text-xs">
          <div className="flex items-center justify-between text-stone-600">
            <span className="flex items-center gap-1 font-medium">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              So với dự tính ({formatCurrency(monthlyBudget.totalEstimated)})
            </span>
            <span className="font-bold text-stone-800">
              {monthlyBudget.totalEstimated > 0
                ? `${Math.round((monthlyBudget.totalActual / monthlyBudget.totalEstimated) * 100)}%`
                : "100%"}
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                monthlyBudget.totalActual > monthlyBudget.totalEstimated && monthlyBudget.totalEstimated > 0
                  ? "bg-gradient-to-r from-amber-400 to-rose-500"
                  : "bg-gradient-to-r from-rose-400 to-pink-500"
              }`}
              style={{
                width: `${
                  monthlyBudget.totalEstimated > 0
                    ? Math.min(100, Math.round((monthlyBudget.totalActual / monthlyBudget.totalEstimated) * 100))
                    : monthlyBudget.totalActual > 0
                    ? 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Contribution / Split Breakdown */}
        {monthlyBudget.totalActual > 0 && (
          <div className="pt-2 border-t border-rose-100/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-serif">
              <span>Đóng góp của hai đứa:</span>
              <span className="font-medium text-stone-700">
                {userA.name}: {u1Pct}% • {userB.name}: {u2Pct}%
              </span>
            </div>
            {/* Split Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-stone-100">
              <div
                className="bg-rose-400 h-full transition-all duration-500"
                style={{ width: `${u1Pct}%` }}
                title={`${userA.name}: ${formatCurrency(monthlyBudget.paidByUser1)}`}
              />
              <div
                className="bg-pink-300 h-full transition-all duration-500"
                style={{ width: `${u2Pct}%` }}
                title={`${userB.name}: ${formatCurrency(monthlyBudget.paidByUser2)}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-serif">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                {userA.name}: {formatCurrency(monthlyBudget.paidByUser1)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-300" />
                {userB.name}: {formatCurrency(monthlyBudget.paidByUser2)}
              </span>
            </div>
          </div>
        )}

        {/* Cute note */}
        <div className="p-3 bg-rose-50/60 border border-rose-100/60 rounded-2xl text-xs text-rose-700 italic font-serif text-center">
          {monthlyBudget.completedDatesCount > 0
            ? `Hai đứa đã cùng nhau trải qua ${monthlyBudget.completedDatesCount} buổi hẹn ấm áp trong tháng này 💕`
            : "Chưa có buổi hẹn nào hoàn thành trong tháng này. Hãy cùng lên kế hoạch nhé! ☕"}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "??", label: "Dia diem", value: placesCount || 0, color: "from-amber-400 to-orange-400" },
          { icon: "??", label: "Lich hen", value: datesCount || 0, color: "from-blue-400 to-cyan-400" },
          { icon: "??", label: "Ngay ben nhau", value: days, color: "from-rose-400 to-pink-400" },
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
