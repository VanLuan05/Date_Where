import { useState, useCallback, useEffect } from "react";
import { useAppState } from "./hooks/useAppState.js";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import PairingScreen from "./components/PairingScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PlacesPage from "./components/PlacesPage.jsx";
import DateScheduler from "./components/DateScheduler.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import UserSwitchToast from "./components/UserSwitchToast.jsx";
import { INITIAL_COUPLE, INITIAL_PLACES, INITIAL_DATES } from "./data/mockData.js";
import { saveToStorage } from "./utils/helpers.js";

const App = () => {
  const {
    couple, places, dates, currentUser, isLoaded,
    switchUser, updateCouple,
    addPlace, updatePlace, deletePlace,
    addDate, updateDate, deleteDate,
    resetApp,
  } = useAppState();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastUser, setToastUser] = useState(null);

  const handlePairingComplete = useCallback((pairingData) => {
    if (pairingData) {
      saveToStorage({
        couple: { ...pairingData },
        places: INITIAL_PLACES,
        dates: INITIAL_DATES,
        currentUser: "userA",
      });
      window.location.reload();
    } else {
      resetApp();
    }
  }, [resetApp]);

  const handleSwitchUser = useCallback(() => {
    const nextUser = currentUser === "userA" ? "userB" : "userA";
    const nextUserData = couple?.[nextUser];
    switchUser();
    setToastUser(nextUserData);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, [currentUser, couple, switchUser]);

  const handleVisitToggle = useCallback((id, visited) => {
    updatePlace(id, { visited });
  }, [updatePlace]);

  if (!isLoaded) return <LoadingScreen />;

  if (!couple || !couple.isConnected) {
    return <PairingScreen onComplete={handlePairingComplete} />;
  }

  return (
    <div className="min-h-screen bg-romantic">
      <Header couple={couple} currentUser={currentUser} onSwitchUser={handleSwitchUser} />
      
      <UserSwitchToast user={toastUser} visible={toastVisible} />

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-28">
        {activeTab === "dashboard" && (
          <Dashboard
            couple={couple}
            currentUser={currentUser}
            onUpdateCouple={updateCouple}
            placesCount={places.length}
            datesCount={dates.length}
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
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { pos: "top-24 right-6", emoji: "??", delay: "0s" },
          { pos: "top-1/3 left-3", emoji: "??", delay: "1.5s" },
          { pos: "bottom-40 right-4", emoji: "?", delay: "0.8s" },
          { pos: "top-2/3 left-6", emoji: "??", delay: "2s" },
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
  );
};

export default App;
