import { useState, useEffect } from "react";
import { Heart, Calendar, Settings, Edit3, Check, X, Star, Gift, TrendingUp } from "lucide-react";
import { getDaysTogether, getMilestoneMessage, getNextMilestone, formatDate } from "../utils/helpers.js";
import { MILESTONE_MESSAGES } from "../data/mockData.js";

const Dashboard = ({ couple, currentUser, onUpdateCouple, placesCount, datesCount, onOpenSettings }) => {
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState(couple?.status || "exploring");
  const [editDate, setEditDate] = useState(couple?.startDate || "");
  const [days, setDays] = useState(0);

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

  const userA = couple.userA;
  const userB = couple.userB;
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Couple Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 text-white/20 text-xl select-none pointer-events-none">
          {"?????".split("").map((c, i) => <span key={i} className="animate-float" style={{animationDelay:`${i*0.3}s`}}>{c}</span>)}
        </div>

        {/* Status badge */}
        <div className="relative flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 bg-white/25 text-white border border-white/30 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            {couple.status === "dating" ? "?? Dang hen ho" : "?? Dang tim hieu"}
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
              {currentUser === "userA" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-sm animate-bounce-soft">
                  ??
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
              {currentUser === "userB" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-sm animate-bounce-soft">
                  ??
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
            <p className="text-white/70 text-xs mt-0.5">Tu {formatDate(couple.startDate)}</p>
          )}
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
