import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { WifiOff, X } from "lucide-react";
import { useAppState } from "./hooks/useAppState.js";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ChatScreen from "./components/ChatScreen.jsx";
import PairingScreen from "./components/PairingScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PlacesPage from "./components/PlacesPage.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import CinematicIntro from "./components/CinematicIntro.jsx";
import CoupleSettingsModal from "./components/CoupleSettingsModal.jsx";
import MemorySidePanel from "./components/MemorySidePanel.jsx";
import LiveTouchToast from "./components/LiveTouchToast.jsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";
import NotificationCenterModal from "./components/NotificationCenterModal.jsx";
import InviteCenterModal from "./components/InviteCenterModal.jsx";
import { DateReminderToast } from "./components/DateReminderToast.jsx";
import { useDateReminders } from "./hooks/useDateReminders.js";
import { usePushNotifications } from "./hooks/usePushNotifications.js";
import {
  playMessageSound,
  triggerMessageVibrate,
} from "./utils/notificationService.js";
import { saveToStorage } from "./utils/helpers.js";
import { initAnalytics, trackPageView, trackEvent } from "./utils/analytics.js";
import { normalizeInviteCode, isValidInviteCode } from "./utils/helpers.js";
import { INITIAL_COUPLE } from "./data/mockData.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// ─── Lazy (code-split) các modal/tab nặng — giảm bundle initial ──────────────
// Leaflet (LoveFootprint) + các modal ít dùng ngay được tách chunk riêng.
// Map invalidateSize(200ms) vẫn chạy trong LoveFootprintModal sau khi lazy mount.
const DateScheduler = lazy(() => import("./components/DateScheduler.jsx"));
const BlindMatchModal = lazy(() => import("./components/BlindMatchModal.jsx"));
const LoveFootprintModal = lazy(() => import("./components/LoveFootprintModal.jsx"));
const AvailabilitySyncModal = lazy(() => import("./components/AvailabilitySyncModal.jsx"));

const ModalFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
    <div className="bg-white/90 rounded-3xl px-6 py-4 shadow-card text-sm text-rose-500 font-medium animate-pulse">
      Đang mở... 💕
    </div>
  </div>
);

// ─── Offline Warning Banner ──────────────────────────────────────────────────
const OfflineBanner = ({ onDismiss }) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2
                  bg-amber-500/95 backdrop-blur-sm text-white px-4 py-2.5 text-xs font-medium
                  shadow-lg animate-slide-down">
    <div className="flex items-center gap-2 flex-1">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        <strong>Chế độ Offline (localStorage).</strong> Cấu hình Firebase trong{" "}
        <code className="bg-white/20 px-1 rounded">.env</code> để đồng bộ 2 thiết bị theo thời gian thực.
      </span>
    </div>
    <button
      onClick={onDismiss}
      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0"
      aria-label="Đóng thông báo"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
const App = () => {
  const {
    couple,
    places,
    dates,
    blindSwipes,
    currentUser,
    activeUser,
    isLoaded,
    syncStatus,
    offlineWarning,
    completePairing,
    switchUser,
    updateCouple,
    addPlace,
    updatePlace,
    deletePlace,
    addDate,
    updateDate,
    deleteDate,
    saveDateRecap,
    swipePlace,
    resetSwipes,
    resetApp,
    availability,
    matchedFreeDays,
    toggleAvailability,
    clearAvailability,
    // Location
    partnerLocations,
    shareCurrentLocation,
    startOnTheWayMode,
    stopOnTheWayMode,
    // Places management
    clearAllPlaces,
    seedDemoContent,
    // Live Touch & Haptic Heartbeat
    liveTouch,
    incomingHeartbeat,
    incomingMood,
    sendHeartbeat,
    sendQuickMood,
    dismissIncomingMood,
    // Mini Chat
    messages,
    sendMessage,
    // Journey (Cụm 5): streak + points + milestone
    stats,
    pendingMilestone,
    dismissMilestone,
    // Notifications Center & History
    notifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    clearAllNotifications,
  } = useAppState();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBlindMatch, setShowBlindMatch] = useState(false);
  const [showLoveMap, setShowLoveMap] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [preselectedPlace, setPreselectedPlace] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Badge tin nhắn chưa đọc cho tab "Nhắn tin" (thay FAB ChatWidget cũ).
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  // Tab đứng trước khi vào chat — nút back `<` sẽ quay về đây.
  const prevTabRef = useRef("dashboard");
  const chatLastSeenRef = useRef(null);
  const chatInitRef = useRef(false);

  // Quản lý hiển thị Cinematic Intro (chỉ chiếu 1 lần đầu mỗi session)
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem("date_where_intro_seen") !== "1";
    } catch (_) {
      return true;
    }
  });

  // Cơ chế thoát an toàn: Timeout 3 giây nếu loading bị kẹt do mạng hoặc Firebase reconnect
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      console.warn("App isLoading timeout 3s -> forcing UI display with offline cache");
      setLoadTimeout(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const effectiveIsLoaded = isLoaded || loadTimeout;

  // GA4 (Cụm 8): page_view theo tab, bỏ qua khi chưa cấu hình VITE_GA_ID
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => {
    if (!effectiveIsLoaded) return;
    trackPageView(`${window.location.pathname}?tab=${activeTab}`);
  }, [activeTab, effectiveIsLoaded]);

  // Khởi tạo hook quản lý thông báo nhắc hẹn 24h, 12h, 9h, 3h, 1h
  const {
    permission: notifPermission,
    enableNotifications,
    triggerTestNotification,
    activeAlert,
    dismissAlert,
  } = useDateReminders(dates);

  // Thông báo đẩy nền kiểu Messenger: đăng ký FCM token + nghe pushQueue.
  // coupleCode lấy từ couple đã ghép đôi (coupleCode hoặc inviteCode).
  const push = usePushNotifications(
    couple?.coupleCode || couple?.inviteCode,
    currentUser
  );

  // Invite-link ?code=DW-XXXX → auto-fill + auto-join ở PairingScreen.
  // Giữ ?tab= hiện tại không gãy: parse code riêng, chỉ dọn ?code= sau khi đã ghép đôi.
  const [pendingInviteCode, setPendingInviteCode] = useState("");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("code") || "";
      const clean = normalizeInviteCode(raw);
      if (clean && isValidInviteCode(clean)) {
        setPendingInviteCode(clean);
        try {
          console.info("[invite_open]", { code: clean, at: new Date().toISOString() });
        } catch {}
      }
    } catch {}
  }, []);

  // Deep-link từ notification hệ thống (?tab=chat) → mở tab chat full-screen.
  useEffect(() => {
    if (!effectiveIsLoaded) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "chat") {
        if (activeTab !== "chat") prevTabRef.current = activeTab;
        setActiveTab("chat");
        // Tương thích ngược với listener cũ (nếu còn): báo đã mở chat.
        window.dispatchEvent(new CustomEvent("dw-open-chat"));
        params.delete("tab");
        const clean = `${window.location.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }${window.location.hash}`;
        window.history.replaceState(null, "", clean);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIsLoaded]);

  // ── Badge chưa đọc cho tab chat: đếm tin của đối phương khi KHÔNG ở tab chat ──
  const myChatRole =
    currentUser === "user1" || currentUser === "userA" ? "user1" : "user2";
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    // Khởi tạo mốc đã xem để không badge tin cũ khi vừa load app.
    if (!chatInitRef.current) {
      try {
        const saved = localStorage.getItem("dw_chat_last_seen");
        chatLastSeenRef.current = saved ? Number(saved) : last.id;
      } catch {
        chatLastSeenRef.current = last.id;
      }
      chatInitRef.current = true;
      setChatUnreadCount(0);
      return;
    }
    if (activeTab === "chat") {
      // Đang xem chat → reset badge, lưu mốc đã xem.
      chatLastSeenRef.current = last.id;
      setChatUnreadCount(0);
      try {
        localStorage.setItem("dw_chat_last_seen", String(last.id));
      } catch {}
    } else if (last.sender !== myChatRole && last.id !== chatLastSeenRef.current) {
      const seenId = chatLastSeenRef.current ?? 0;
      const count = messages.filter(
        (m) => m.id > seenId && m.sender !== myChatRole
      ).length;
      setChatUnreadCount(count);
      // Kiểu Messenger: đang nhìn app nhưng không ở tab chat → "pop-ding" + rung.
      // (Tab ẨN → useAppState/pushQueue lo âm thanh + Notification hệ thống.)
      if (typeof document === "undefined" || !document.hidden) {
        playMessageSound();
        triggerMessageVibrate();
      }
    }
  }, [messages, activeTab, myChatRole]);

  // Chuyển tab: vào chat thì nhớ tab trước đó; rời chat thì tắt mốc đọc dần dần ở effect trên.
  const handleTabChange = useCallback(
    (tabId) => {
      if (tabId === "chat" && activeTab !== "chat") {
        prevTabRef.current = activeTab;
      }
      if (tabId !== "chat") setShowLoveMap(false);
      setActiveTab(tabId);
    },
    [activeTab]
  );

  // Nút back `<` trong ChatScreen: quay về tab trước đó.
  const handleBackFromChat = useCallback(() => {
    setActiveTab(prevTabRef.current || "dashboard");
  }, []);

  // Đọc trạng thái đóng banner từ session
  useEffect(() => {
    setBannerDismissed(sessionStorage.getItem("dw_banner_dismissed") === "1");
  }, []);

  const handleScheduleFromMatch = useCallback((place) => {
    setPreselectedPlace(place);
    setActiveTab("dates");
  }, []);

  /** Schedule from availability match: receives dateStr + time */
  const handleScheduleFromAvailability = useCallback((dateStr, time) => {
    // Create a synthetic preselected state with date+time pre-filled
    setPreselectedPlace({ id: "", name: "", prefillDate: dateStr, prefillTime: time });
    setActiveTab("dates");
    setShowAvailability(false);
  }, []);

  /** Concierge 1-Tap (Cụm 7): prefill quán и/hoặc slot đẹp nhất sang tab Lịch hẹn */
  const handleConciergeSchedule = useCallback((prefill = {}) => {
    const { place, dateStr, time } = prefill;
    setPreselectedPlace({
      id: place?.id || "",
      name: place?.name || "",
      prefillDate: dateStr || "",
      prefillTime: time || "",
    });
    setActiveTab("dates");
  }, []);

  const handleDismissBanner = useCallback(() => {
    setBannerDismissed(true);
    sessionStorage.setItem("dw_banner_dismissed", "1");
  }, []);

  // ── Pairing callbacks ──────────────────────────────────────────────────────

  /**
   * Offline pairing: lưu localStorage rồi reload
   */
  const handlePairingComplete = useCallback((pairingData) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("code")) {
        params.delete("code");
        const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", clean);
      }
    } catch {}
    const coupleToSave = pairingData
      ? { ...pairingData, isConnected: true }
      : { ...INITIAL_COUPLE, isConnected: true };

    const role = localStorage.getItem("date_where_device_role") || "user1";
    saveToStorage({
      couple: coupleToSave,
      places: [],
      dates: [],
      currentUser: role,
      activeUser: role,
    });
    window.location.reload();
  }, []);

  /**
   * Firebase pairing: coupleCode đã được tạo/join trên Firestore
   */
  const handleFirebasePairing = useCallback((coupleData, code) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("code")) {
        try { trackEvent("invite_accept", { code }); } catch {}
        params.delete("code");
        const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", clean);
      }
    } catch {}
    setPendingInviteCode("");
    completePairing(coupleData, code);
  }, [completePairing]);

  // ── Place handlers ─────────────────────────────────────────────────────────
  const handleVisitToggle = useCallback((id, visited) => {
    updatePlace(id, { visited });
  }, [updatePlace]);

  const handleFavoriteToggle = useCallback((id, favorite) => {
    updatePlace(id, { favorite });
  }, [updatePlace]);

  // ── Settings ───────────────────────────────────────────────────────────────
  const handleSettingsSave = useCallback((updates) => {
    updateCouple(updates);
  }, [updateCouple]);

  const handleReset = useCallback(() => {
    resetApp();
  }, [resetApp]);

  // ── Render ─────────────────────────────────────────────────────────────────
  // Nếu đã xem intro trong session và dữ liệu đang tải
  if (!effectiveIsLoaded && !showIntro) return <LoadingScreen />;

  // Nếu intro đã tắt và chưa ghép đôi
  if (!showIntro && (!couple || !couple.isConnected)) {
    return (
      <PairingScreen
        onComplete={handlePairingComplete}
        onFirebasePairing={handleFirebasePairing}
        initialCode={pendingInviteCode}
      />
    );
  }

  const showBanner = offlineWarning && !bannerDismissed;
  const isPairingPending = !couple || !couple.isConnected;
  // Ở tab chat: full-screen kiểu Messenger — ẩn Header/BottomNav, chỉ giữ header của chat.
  const isChatOpen = activeTab === "chat";

  return (
    <>
      {/* ── Màn hình mở đầu điện ảnh lãng mạn (Cinematic Romantic Gateway) ── */}
      {showIntro && (
        <CinematicIntro
          couple={couple}
          onFinish={() => setShowIntro(false)}
        />
      )}

      {/* Lớp giao diện bên dưới (sẵn sàng khi intro tan chảy ra) */}
      {!effectiveIsLoaded ? (
        <LoadingScreen />
      ) : isPairingPending ? (
        <PairingScreen
          onComplete={handlePairingComplete}
          onFirebasePairing={handleFirebasePairing}
          initialCode={pendingInviteCode}
        />
      ) : (
        <div className={`min-h-screen bg-romantic ${showBanner ? "pt-10" : ""}`}>
          {/* Offline warning banner */}
      {showBanner && <OfflineBanner onDismiss={handleDismissBanner} />}

      {/* ── Tab chat full-screen: không Header, không BottomNav, không main ── */}
      {isChatOpen ? (
        <ErrorBoundary name="Nhắn tin">
          <ChatScreen
            couple={couple}
            currentUser={currentUser}
            messages={messages}
            onSendMessage={sendMessage}
            onBack={handleBackFromChat}
          />
        </ErrorBoundary>
      ) : (
        <>
          <Header
            couple={couple}
            currentUser={currentUser}
            onOpenSettings={() => setShowSettings(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            unreadNotificationsCount={unreadNotificationsCount}
            syncStatus={syncStatus}
          />

          {/* Date Reminder Toast Notification */}
          <DateReminderToast
            alert={activeAlert}
            onDismiss={dismissAlert}
            onNavigateDates={() => setActiveTab("dates")}
          />

          {/* Live Touch Romantic Toast & Heartbeat Pulse */}
          <LiveTouchToast
            liveTouch={liveTouch}
            incomingMood={incomingMood}
            incomingHeartbeat={incomingHeartbeat}
            couple={couple}
            currentUser={currentUser}
            onDismissMood={dismissIncomingMood}
            onReplyMood={sendQuickMood}
          />

          {/* P2 — transition khi đổi tab: fade + slide nhẹ 180ms, key theo activeTab, CSS only */}
          {/* P3 — mobile giữ max-w-2xl; lg: mở 2 cột (chính + side-panel kỷ niệm). Chat full-screen/modal/Leaflet không đổi. */}
          <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 pt-5 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:items-start">
          <main>
          <div key={activeTab} className="animate-tab-enter">
        {activeTab === "dashboard" && (
          <ErrorBoundary name="Bảng điều khiển & Tiện ích">
            <Dashboard
              couple={couple}
              currentUser={currentUser}
              isLoading={!effectiveIsLoaded}
              onUpdateCouple={updateCouple}
              placesCount={places.length}
              datesCount={dates.length}
              dates={dates}
              places={places}
              onOpenSettings={() => setShowSettings(true)}
              onOpenBlindMatch={() => setShowBlindMatch(true)}
              onOpenLoveMap={() => setShowLoveMap(true)}
              onOpenAvailability={() => setShowAvailability(true)}
              onOpenInvite={() => setShowInvite(true)}
              onSeedDemo={seedDemoContent}
              blindSwipes={blindSwipes}
              matchedFreeDays={matchedFreeDays}
              partnerLocations={partnerLocations}
              onShareLocation={shareCurrentLocation}
              onStartOnTheWay={startOnTheWayMode}
              onStopOnTheWay={stopOnTheWayMode}
              notifPermission={notifPermission}
              onEnableNotifications={enableNotifications}
              onTestNotification={triggerTestNotification}
              liveTouch={liveTouch}
              incomingHeartbeat={incomingHeartbeat}
              onSendHeartbeat={sendHeartbeat}
              stats={stats}
              pendingMilestone={pendingMilestone}
              onDismissMilestone={dismissMilestone}
              onQuickSchedule={handleConciergeSchedule}
            />
          </ErrorBoundary>
        )}
        {activeTab === "places" && (
          <ErrorBoundary name="Kho địa điểm">
            <PlacesPage
              places={places}
              couple={couple}
              currentUser={currentUser}
              onAddPlace={addPlace}
              onEditPlace={updatePlace}
              onDeletePlace={deletePlace}
              onVisitToggle={handleVisitToggle}
              onFavoriteToggle={handleFavoriteToggle}
              onOpenBlindMatch={() => setShowBlindMatch(true)}
              onOpenLoveMap={() => setShowLoveMap(true)}
              blindSwipes={blindSwipes}
              onClearAllPlaces={clearAllPlaces}
            />
          </ErrorBoundary>
        )}
        {activeTab === "dates" && (
          <ErrorBoundary name="Lịch hẹn hò">
            <Suspense fallback={<LoadingScreen />}>
              <DateScheduler
                dates={dates}
                places={places}
                couple={couple}
                currentUser={currentUser}
                onAddDate={addDate}
                onUpdateDate={updateDate}
                onDeleteDate={deleteDate}
                onSaveRecap={saveDateRecap}
                initialPlace={preselectedPlace}
                onClearInitialPlace={() => setPreselectedPlace(null)}
                onOpenAvailability={() => setShowAvailability(true)}
                notifPermission={notifPermission}
                onEnableNotifications={enableNotifications}
                onTestNotification={triggerTestNotification}
              />
            </Suspense>
          </ErrorBoundary>
        )}
          </div>
          </main>
          <MemorySidePanel
            dates={dates}
            places={places}
            couple={couple}
            matchedFreeDays={matchedFreeDays}
            onOpenInvite={() => setShowInvite(true)}
          />
          </div>

      <BottomNav
        activeTab={activeTab}
        chatUnreadCount={chatUnreadCount}
        onTabChange={handleTabChange}
      />
        </>
      )}

      {/* Couple Settings Modal */}
      <CoupleSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        couple={couple}
        onUpdateCouple={handleSettingsSave}
        onReset={handleReset}
        onClearAllPlaces={clearAllPlaces}
        onOpenInvite={() => { setShowSettings(false); setShowInvite(true); }}
      />

      {/* Blind Match Modal (lazy) */}
      {showBlindMatch && (
        <Suspense fallback={<ModalFallback />}>
          <BlindMatchModal
            isOpen={showBlindMatch}
            onClose={() => setShowBlindMatch(false)}
            places={places}
            couple={couple}
            activeUser={currentUser}
            blindSwipes={blindSwipes}
            onSwipe={swipePlace}
            onResetSwipes={resetSwipes}
            onScheduleDate={handleScheduleFromMatch}
          />
        </Suspense>
      )}

      {/* Love Footprint Interactive Map Modal (lazy Leaflet) */}
      {showLoveMap && (
        <Suspense fallback={<ModalFallback />}>
          <LoveFootprintModal
            isOpen={showLoveMap}
            onClose={() => setShowLoveMap(false)}
            places={places}
            dates={dates}
            couple={couple}
            activeUser={currentUser}
            partnerLocations={partnerLocations}
            onShareLocation={shareCurrentLocation}
          />
        </Suspense>
      )}

      {/* PWA Install Prompt Banner */}
      <PWAInstallPrompt />

      {/* Availability Sync Modal (lazy) */}
      {showAvailability && (
        <Suspense fallback={<ModalFallback />}>
          <AvailabilitySyncModal
            isOpen={showAvailability}
            onClose={() => setShowAvailability(false)}
            couple={couple}
            coupleData={couple}
            activeUser={currentUser}
            availability={availability}
            onToggleAvailability={toggleAvailability}
            onClearAvailability={clearAvailability}
            onScheduleDate={handleScheduleFromAvailability}
          />
        </Suspense>
      )}

      {/* Invite Center: QR + link ?code= */}
      <InviteCenterModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        coupleCode={couple?.coupleCode || couple?.inviteCode}
      />

      {/* Couple Notifications Center Modal */}
      <NotificationCenterModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onClearAll={clearAllNotifications}
        onMarkAsRead={markNotificationAsRead}
        onSendHeartbeat={sendHeartbeat}
        push={push}
        onNavigateDates={() => {
          setActiveTab("dates");
          setShowNotifications(false);
        }}
        partnerName={
          (currentUser === "user1" || currentUser === "userA")
            ? couple?.user2?.name || couple?.userB?.name || "Người ấy"
            : couple?.user1?.name || couple?.userA?.name || "Người ấy"
        }
        coupleCode={couple?.coupleCode || couple?.inviteCode}
        currentUser={currentUser}
        userName={
          (currentUser === "user1" || currentUser === "userA")
            ? couple?.user1?.name || couple?.userA?.name || "Bạn"
            : couple?.user2?.name || couple?.userB?.name || "Bạn"
        }
      />

      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { pos: "top-24 right-6", emoji: "🌸", delay: "0s" },
          { pos: "top-1/3 left-3", emoji: "💫", delay: "1.5s" },
          { pos: "bottom-40 right-4", emoji: "❤", delay: "0.8s" },
          { pos: "top-2/3 left-6", emoji: "🌙", delay: "2s" },
        ].map((item, i) => (
          <span
            key={i}
            className={`absolute ${item.pos} text-xl opacity-15 animate-float select-none`}
            style={{ animationDelay: item.delay }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
        </div>
      )}
    </>
  );
};

export default App;
