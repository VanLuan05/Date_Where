import { useState, useMemo } from "react";
import {
  Bell,
  Heart,
  Calendar,
  MessageCircle,
  MapPin,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatTimeAgo } from "../utils/locationService.js";
import {
  getNtfyChannelUrl,
  sendRemoteNotification,
} from "../utils/notificationService.js";

const FILTER_TABS = [
  { id: "all", label: "Tất cả", icon: null },
  { id: "heartbeat", label: "Nhịp tim", icon: "💖" },
  { id: "date", label: "Lịch hẹn", icon: "📅" },
  { id: "chat", label: "Tin nhắn", icon: "💬" },
];

export const NotificationCenterModal = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  onSendHeartbeat,
  onNavigateDates,
  partnerName = "Người ấy",
  coupleCode,
  currentUser,
  userName = "Bạn",
  push = null, // usePushNotifications() từ App.jsx (có thể null)
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  const targetRole =
    currentUser === "user1" || currentUser === "userA" ? "user2" : "user1";
  const channelUrl = getNtfyChannelUrl(coupleCode, currentUser);

  const pushPermission = push?.permission || "default";
  const pushSupported = push?.pushSupported !== false;
  const fcmReady = Boolean(push?.fcmReady);
  const fcmTokenSaved = Boolean(push?.fcmToken);

  const handleEnablePush = async () => {
    if (!push || enablingPush) return;
    setEnablingPush(true);
    try {
      await push.enablePush();
    } finally {
      setEnablingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!coupleCode || testSending) return;
    setTestSending(true);
    setTestSuccess(false);
    try {
      await sendRemoteNotification({
        coupleCode,
        targetRole,
        title: `💌 Thông báo thử nghiệm từ ${userName}`,
        body: `${userName} vừa gửi thông báo kiểm tra đến thiết bị của bạn. Chúc đôi mình luôn hạnh phúc! 💕`,
        tags: ["bell", "sparkles"],
      });
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3500);
    } finally {
      setTestSending(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  if (!isOpen) return null;

  const getTypeConfig = (type) => {
    switch (type) {
      case "heartbeat":
        return {
          icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
          bg: "bg-rose-100 text-rose-700 border-rose-200",
          tag: "Nhịp tim",
          actionText: "Đáp lại nhịp tim",
          actionIcon: <Heart className="w-3.5 h-3.5 fill-current" />,
          actionHandler: () => {
            onSendHeartbeat?.();
            onClose();
          },
        };
      case "date":
        return {
          icon: <Calendar className="w-4 h-4 text-purple-500" />,
          bg: "bg-purple-100 text-purple-700 border-purple-200",
          tag: "Lịch hẹn",
          actionText: "Xem lịch hẹn",
          actionIcon: <ArrowRight className="w-3.5 h-3.5" />,
          actionHandler: () => {
            onNavigateDates?.();
            onClose();
          },
        };
      case "chat":
        return {
          icon: <MessageCircle className="w-4 h-4 text-sky-500" />,
          bg: "bg-sky-100 text-sky-700 border-sky-200",
          tag: "Tin nhắn",
        };
      case "place":
        return {
          icon: <MapPin className="w-4 h-4 text-amber-500" />,
          bg: "bg-amber-100 text-amber-700 border-amber-200",
          tag: "Địa điểm",
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-pink-500" />,
          bg: "bg-pink-100 text-pink-700 border-pink-200",
          tag: "Kỷ niệm",
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100/80 flex flex-col max-h-[88vh] overflow-hidden animate-scale-up">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-rose-200/40 via-pink-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-200/30 via-rose-100/20 to-transparent rounded-full blur-xl pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="relative z-10 px-5 pt-4 pb-3 border-b border-rose-100/70 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-romantic">
                <Bell className="w-5 h-5 animate-wiggle" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 border-2 border-white rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 leading-tight">
                  Hộp thông báo đôi mình 💕
                </h3>
                <p className="text-[11px] text-stone-500 font-serif">
                  Lịch sử nhịp đập, lịch hẹn và khoảnh khắc yêu thương
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action row (Mark read / Clear) */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-rose-50 text-xs">
            <span className="text-stone-500 font-serif">
              {unreadCount > 0 ? (
                <span className="text-rose-600 font-medium">
                  Có {unreadCount} thông báo chưa xem
                </span>
              ) : (
                "Đã đọc tất cả thông báo"
              )}
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đã xem hết</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-stone-400 hover:text-red-500 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                  title="Xóa toàn bộ lịch sử thông báo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab.id;
              const count =
                tab.id === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.type === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-rose-50/70 text-stone-600 hover:bg-rose-100/70 hover:text-rose-700"
                  }`}
                >
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/30 text-white"
                          : "bg-rose-200/60 text-rose-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Background Push Channel Card ── */}
        {coupleCode && channelUrl && (
          <div className="mx-3 sm:mx-4 mt-2.5 p-3 bg-gradient-to-r from-rose-50/90 via-pink-50/60 to-purple-50/70 rounded-2xl border border-rose-200/80 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-base select-none mt-0.5">🔔</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-stone-800">
                  Thông báo khi tắt app (Background Push)
                </h4>
                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                  Nhận tin nhắn & lịch hẹn ngay cả khi đã đóng ứng dụng hoặc tắt màn hình.
                </p>

                {/* FCM: đăng ký push nền kiểu Messenger cho thiết bị này */}
                {push && (
                  <div className="mt-2 p-2 rounded-xl bg-white/80 border border-rose-100">
                    {!pushSupported ? (
                      <p className="text-[11px] text-stone-500">
                        ⚠️ Thiết bị/trình duyệt này không hỗ trợ Web Push. Hãy dùng
                        Chrome trên Android hoặc PWA đã cài trên iOS 16.4+.
                      </p>
                    ) : pushPermission === "granted" ? (
                      <p className="text-[11px] leading-snug">
                        <span className="text-emerald-600 font-bold">
                          ✓ Đã bật thông báo nền trên thiết bị này
                        </span>
                        {fcmTokenSaved && fcmReady && (
                          <span className="text-stone-500"> (FCM đã sẵn sàng)</span>
                        )}
                        {!fcmReady && (
                          <span className="text-stone-500">
                            {" "}— đang dùng kênh dự phòng bên dưới. (Để bật FCM đầy đủ,
                            thêm VITE_FIREBASE_VAPID_KEY vào .env)
                          </span>
                        )}
                      </p>
                    ) : pushPermission === "denied" ? (
                      <p className="text-[11px] text-amber-700 leading-snug">
                        ⚠️ Bạn đã chặn thông báo. Mở Cài đặt trình duyệt → Quyền trang web
                        → Cho phép Thông báo, rồi tải lại app.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnablePush}
                        disabled={enablingPush}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-[11px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                      >
                        {enablingPush ? "Đang bật..." : "🔔 Bật thông báo nền (như Messenger)"}
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Mở kênh để nhận thông báo trực tiếp trên thiết bị"
                  >
                    <span>Bật thông báo thiết bị</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleSendTestPush}
                    disabled={testSending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {testSending ? (
                      <span>Đang gửi...</span>
                    ) : testSuccess ? (
                      <span className="text-emerald-600 font-bold">✓ Đã gửi thử tới đối phương!</span>
                    ) : (
                      <span>Gửi thử tới đối phương</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS LIST ── */}
        <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2.5">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 flex items-center justify-center text-2xl select-none">
                💌
              </div>
              <h4 className="font-display font-bold text-sm text-stone-700">
                Chưa có thông báo nào trong mục này
              </h4>
              <p className="text-xs text-stone-400 font-serif max-w-xs mx-auto leading-relaxed">
                Mỗi khi {partnerName} gửi nhịp đập trái tim, đặt tiệc hoặc nhắn tin, lịch sử sẽ xuất hiện tại đây ✨
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const cfg = getTypeConfig(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead?.(notif.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all ${
                    notif.read
                      ? "bg-white/80 border-rose-100/60 hover:border-rose-200 shadow-xs"
                      : "bg-gradient-to-r from-rose-50/90 via-pink-50/60 to-white border-rose-300/80 shadow-romantic ring-1 ring-rose-200/50"
                  }`}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-rose-200" />
                  )}

                  <div className="flex items-start gap-3">
                    {/* Icon tag */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg}`}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100/80 text-rose-700">
                          {cfg.tag}
                        </span>
                        <span className="text-[10px] text-stone-400 flex items-center gap-1 font-serif">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <h5 className="font-display font-bold text-xs sm:text-sm text-stone-900 leading-snug">
                        {notif.title}
                      </h5>

                      <p className="text-xs text-stone-600 font-serif mt-1 leading-relaxed break-words">
                        {notif.content}
                      </p>

                      {/* Quick Action Button */}
                      {cfg.actionText && (
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead?.(notif.id);
                              cfg.actionHandler?.();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs hover:shadow-romantic hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            {cfg.actionIcon}
                            <span>{cfg.actionText}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="relative z-10 px-5 py-3 border-t border-rose-100/70 bg-stone-50/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 font-serif text-[11px]">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>DateWhere • Lưu giữ từng nhịp đập yêu thương</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold bg-white border border-rose-200 text-stone-700 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterModal;
