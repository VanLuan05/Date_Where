import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { WifiOff, X } from "lucide-react";
import { useAppState } from "./hooks/useAppState.js";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
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
import { saveToStorage } from "./utils/helpers.js";
import { initAnalytics, trackPageView, trackEvent } from "./utils/analytics.js";
import { normalizeInviteCode, isValidInviteCode } from "./utils/helpers.js";
import { INITIAL_COUPLE } from "./data/mockData.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// ─── Lazy (code-split) các modal/tab nặng — giảm bundle initial ──────────────
const DateScheduler = lazy(() => import("./components/DateScheduler.jsx"));
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
  <div
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2
                  bg-amber-500/95 backdrop-blur-sm text-white px-4 py-2.5 text-xs font-medium
                  shadow-lg animate-slide-down"
  >
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
    currentUser,
    isLoaded,
    syncStatus,
    offlineWarning,
    completePairing,
    updateCouple,
    addPlace,
    updatePlace,
    deletePlace,
    addDate,
    updateDate,
    deleteDate,
    saveDateRecap,
    resetApp,
    availability,
    matchedFreeDays,
    toggleAvailability,
    clearAvailability,
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
    // Journey: streak + points + milestone
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
  const [showAvailability, setShowAvailability] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [preselectedPlace, setPreselectedPlace] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  // Analytics
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    if (!effectiveIsLoaded) return;
    trackPageView(`${window.location.pathname}?tab=${activeTab}`);
  }, [activeTab, effectiveIsLoaded]);

  // Khởi tạo hook quản lý thông báo nhắc hẹn
  const {
    permission: notifPermission,
    enableNotifications,
    triggerTestNotification,
    activeAlert,
    dismissAlert,
  } = useDateReminders(dates);

  // Thông báo đẩy nền
  const push = usePushNotifications(
    couple?.coupleCode || couple?.inviteCode,
    currentUser
  );

  // Invite-link ?code=DW-XXXX → auto-fill + auto-join ở PairingScreen
  const [pendingInviteCode, setPendingInviteCode] = useState("");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("code") || "";
      const clean = normalizeInviteCode(raw);
      if (clean && isValidInviteCode(clean)) {
        setPendingInviteCode(clean);
      }
    } catch {}
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Đọc trạng thái đóng banner từ session
  useEffect(() => {
    setBannerDismissed(sessionStorage.getItem("dw_banner_dismissed") === "1");
  }, []);

  /** Schedule from availability match: receives dateStr + time */
  const handleScheduleFromAvailability = useCallback((dateStr, time) => {
    setPreselectedPlace({ id: "", name: "", prefillDate: dateStr, prefillTime: time });
    setActiveTab("dates");
    setShowAvailability(false);
  }, []);

  /** Schedule with a specific place */
  const handleSchedulePlace = useCallback((place) => {
    setPreselectedPlace({
      id: place?.id || "",
      name: place?.name || "",
      address: place?.address || "",
    });
    setActiveTab("dates");
  }, []);

  const handleDismissBanner = useCallback(() => {
    setBannerDismissed(true);
    sessionStorage.setItem("dw_banner_dismissed", "1");
  }, []);

  // ── Pairing callbacks ──────────────────────────────────────────────────────
  const handlePairingComplete = useCallback((pairingData) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("code")) {
        params.delete("code");
        const clean = `${window.location.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }${window.location.hash}`;
        window.history.replaceState(null, "", clean);
      }
    } catch {}
    try {
      localStorage.setItem("datewhere_is_paired", "1");
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

  const handleFirebasePairing = useCallback(
    (coupleData, code) => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.has("code")) {
          try {
            trackEvent("invite_accept", { code });
          } catch {}
          params.delete("code");
          const clean = `${window.location.pathname}${
            params.toString() ? `?${params.toString()}` : ""
          }${window.location.hash}`;
          window.history.replaceState(null, "", clean);
        }
      } catch {}
      try {
        localStorage.setItem("datewhere_is_paired", "1");
        if (code) localStorage.setItem("datewhere_coupleCode", code);
      } catch {}
      setPendingInviteCode("");
      completePairing(coupleData, code);
    },
    [completePairing]
  );

  // ── Place handlers ─────────────────────────────────────────────────────────
  const handleVisitToggle = useCallback(
    (id, visited) => {
      updatePlace(id, { visited });
    },
    [updatePlace]
  );

  const handleFavoriteToggle = useCallback(
    (id, favorite) => {
      updatePlace(id, { favorite });
    },
    [updatePlace]
  );

  // ── Settings ───────────────────────────────────────────────────────────────
  const handleSettingsSave = useCallback(
    (updates) => {
      updateCouple(updates);
    },
    [updateCouple]
  );

  const handleReset = useCallback(() => {
    resetApp();
  }, [resetApp]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const isPaired = Boolean(
    couple?.isConnected ||
    localStorage.getItem("datewhere_is_paired") === "1" ||
    localStorage.getItem("datewhere_coupleCode")
  );
  const isPairingPending = !isPaired && (!couple || !couple.isConnected);

  // Nếu dữ liệu đang tải và chưa có thông tin couple
  if (!effectiveIsLoaded && !showIntro && !couple) return <LoadingScreen />;

  // CHỈ hiển thị màn hình tạo không gian (PairingScreen) khi CHƯA GHÉP ĐÔI
  if (!showIntro && isPairingPending) {
    return (
      <PairingScreen
        onComplete={handlePairingComplete}
        onFirebasePairing={handleFirebasePairing}
        initialCode={pendingInviteCode}
      />
    );
  }

  const showBanner = offlineWarning && !bannerDismissed;

  return (
    <>
      {/* ── Màn hình mở đầu điện ảnh lãng mạn (Cinematic Romantic Gateway) ── */}
      {showIntro && (
        <CinematicIntro couple={couple} onFinish={() => setShowIntro(false)} />
      )}

      {/* Lớp giao diện chính */}
      {!effectiveIsLoaded && !couple ? (
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

          {/* Main content grid: tab + side-panel (desktop) */}
          <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 pt-5 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:items-start">
            <main>
              <div key={activeTab} className="animate-tab-enter">
                {activeTab === "dashboard" && (
                  <ErrorBoundary name="Bảng điều khiển đôi mình">
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
                      onOpenAvailability={() => setShowAvailability(true)}
                      onOpenInvite={() => setShowInvite(true)}
                      onSeedDemo={seedDemoContent}
                      matchedFreeDays={matchedFreeDays}
                      notifPermission={notifPermission}
                      onEnableNotifications={enableNotifications}
                      onTestNotification={triggerTestNotification}
                      liveTouch={liveTouch}
                      incomingHeartbeat={incomingHeartbeat}
                      onSendHeartbeat={sendHeartbeat}
                      stats={stats}
                      pendingMilestone={pendingMilestone}
                      onDismissMilestone={dismissMilestone}
                      onNavigateTab={handleTabChange}
                      onSchedulePlace={handleSchedulePlace}
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
                      onClearAllPlaces={clearAllPlaces}
                      onSchedulePlace={handleSchedulePlace}
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

          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Couple Settings Modal */}
          <CoupleSettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            couple={couple}
            onUpdateCouple={handleSettingsSave}
            onReset={handleReset}
            onClearAllPlaces={clearAllPlaces}
            onOpenInvite={() => {
              setShowSettings(false);
              setShowInvite(true);
            }}
          />

          {/* PWA Install Prompt Banner */}
          <PWAInstallPrompt />

          {/* Availability Sync Modal */}
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
              currentUser === "user1" || currentUser === "userA"
                ? couple?.user2?.name || couple?.userB?.name || "Người ấy"
                : couple?.user1?.name || couple?.userA?.name || "Người ấy"
            }
            coupleCode={couple?.coupleCode || couple?.inviteCode}
            currentUser={currentUser}
            userName={
              currentUser === "user1" || currentUser === "userA"
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
