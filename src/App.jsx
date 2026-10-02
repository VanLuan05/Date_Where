import { useState, useCallback, useEffect } from "react";
import { WifiOff, X } from "lucide-react";
import { useAppState } from "./hooks/useAppState.js";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import PairingScreen from "./components/PairingScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PlacesPage from "./components/PlacesPage.jsx";
import DateScheduler from "./components/DateScheduler.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import CinematicIntro from "./components/CinematicIntro.jsx";
import UserSwitchToast from "./components/UserSwitchToast.jsx";
import CoupleSettingsModal from "./components/CoupleSettingsModal.jsx";
import BlindMatchModal from "./components/BlindMatchModal.jsx";
import LoveFootprintModal from "./components/LoveFootprintModal.jsx";
import AvailabilitySyncModal from "./components/AvailabilitySyncModal.jsx";
import LiveTouchToast from "./components/LiveTouchToast.jsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";
import { DateReminderToast } from "./components/DateReminderToast.jsx";
import { useDateReminders } from "./hooks/useDateReminders.js";
import { saveToStorage } from "./utils/helpers.js";
import { INITIAL_COUPLE, INITIAL_PLACES, INITIAL_DATES } from "./data/mockData.js";

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
    // Places management
    clearAllPlaces,
    // Live Touch & Haptic Heartbeat
    liveTouch,
    incomingHeartbeat,
    incomingMood,
    sendHeartbeat,
    sendQuickMood,
    dismissIncomingMood,
  } = useAppState();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastUser, setToastUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlindMatch, setShowBlindMatch] = useState(false);
  const [showLoveMap, setShowLoveMap] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
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

  // Khởi tạo hook quản lý thông báo nhắc hẹn 24h, 12h, 9h, 3h, 1h
  const {
    permission: notifPermission,
    enableNotifications,
    triggerTestNotification,
    activeAlert,
    dismissAlert,
  } = useDateReminders(dates);

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

  const handleDismissBanner = useCallback(() => {
    setBannerDismissed(true);
    sessionStorage.setItem("dw_banner_dismissed", "1");
  }, []);

  // ── Pairing callbacks ──────────────────────────────────────────────────────

  /**
   * Offline pairing: lưu localStorage rồi reload
   */
  const handlePairingComplete = useCallback((pairingData) => {
    const coupleToSave = pairingData
      ? { ...pairingData, isConnected: true }
      : { ...INITIAL_COUPLE, isConnected: true };

    const role = localStorage.getItem("date_where_device_role") || "user1";
    saveToStorage({
      couple: coupleToSave,
      places: [],
      dates: INITIAL_DATES,
      currentUser: role,
      activeUser: role,
    });
    window.location.reload();
  }, []);

  /**
   * Firebase pairing: coupleCode đã được tạo/join trên Firestore
   */
  const handleFirebasePairing = useCallback((coupleData, code) => {
    completePairing(coupleData, code);
  }, [completePairing]);

  // ── User switch ────────────────────────────────────────────────────────────
  const handleSwitchUser = useCallback(() => {
    const isUser1 = currentUser === "user1" || currentUser === "userA";
    const nextKey = isUser1 ? "user2" : "user1";
    const nextUserData =
      couple?.[nextKey] ||
      couple?.[nextKey === "user2" ? "userB" : "userA"];
    switchUser();
    setToastUser(nextUserData);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, [currentUser, couple, switchUser]);

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
  if (!isLoaded && !showIntro) return <LoadingScreen />;

  // Nếu intro đã tắt và chưa ghép đôi
  if (!showIntro && (!couple || !couple.isConnected)) {
    return (
      <PairingScreen
        onComplete={handlePairingComplete}
        onFirebasePairing={handleFirebasePairing}
      />
    );
  }

  const showBanner = offlineWarning && !bannerDismissed;
  const isPairingPending = !couple || !couple.isConnected;

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
      {!isLoaded ? (
        <LoadingScreen />
      ) : isPairingPending ? (
        <PairingScreen
          onComplete={handlePairingComplete}
          onFirebasePairing={handleFirebasePairing}
        />
      ) : (
        <div className={`min-h-screen bg-romantic ${showBanner ? "pt-10" : ""}`}>
          {/* Offline warning banner */}
      {showBanner && <OfflineBanner onDismiss={handleDismissBanner} />}

      <Header
        couple={couple}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenSettings={() => setShowSettings(true)}
        syncStatus={syncStatus}
      />

      <UserSwitchToast user={toastUser} visible={toastVisible} />

      {/* Date Reminder Toast Notification */}
      <DateReminderToast
        alert={activeAlert}
        onDismiss={dismissAlert}
        onNavigateDates={() => setActiveTab("dates")}
      />

      {/* Live Touch Romantic Toast & Heartbeat Pulse */}
      <LiveTouchToast
        incomingMood={incomingMood}
        incomingHeartbeat={incomingHeartbeat}
        couple={couple}
        currentUser={currentUser}
        onDismissMood={dismissIncomingMood}
        onReplyMood={sendQuickMood}
      />

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-28">
        {activeTab === "dashboard" && (
          <Dashboard
            couple={couple}
            currentUser={currentUser}
            onUpdateCouple={updateCouple}
            placesCount={places.length}
            datesCount={dates.length}
            dates={dates}
            places={places}
            onOpenSettings={() => setShowSettings(true)}
            onOpenBlindMatch={() => setShowBlindMatch(true)}
            onOpenLoveMap={() => setShowLoveMap(true)}
            onOpenAvailability={() => setShowAvailability(true)}
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
            onSendQuickMood={sendQuickMood}
          />
        )}
        {activeTab === "places" && (
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
        )}
        {activeTab === "dates" && (
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
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenLoveMap={() => setShowLoveMap(true)}
      />

      {/* Couple Settings Modal */}
      <CoupleSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        couple={couple}
        onUpdateCouple={handleSettingsSave}
        onReset={handleReset}
        onClearAllPlaces={clearAllPlaces}
      />

      {/* Blind Match Modal */}
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

      {/* Love Footprint Interactive Map Modal */}
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

      {/* PWA Install Prompt Banner */}
      <PWAInstallPrompt />

      {/* Availability Sync Modal */}
      <AvailabilitySyncModal
        isOpen={showAvailability}
        onClose={() => setShowAvailability(false)}
        couple={couple}
        activeUser={currentUser}
        availability={availability}
        onToggleAvailability={toggleAvailability}
        onClearAvailability={clearAvailability}
        onScheduleDate={handleScheduleFromAvailability}
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
