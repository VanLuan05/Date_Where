import { useState, useEffect, useCallback } from "react";
import { INITIAL_COUPLE, INITIAL_PLACES, INITIAL_DATES } from "../data/mockData.js";
import { loadFromStorage, saveToStorage, generateId } from "../utils/helpers.js";

export const useAppState = () => {
  const [couple, setCouple] = useState(null);
  const [places, setPlaces] = useState([]);
  const [dates, setDates] = useState([]);
  const [currentUser, setCurrentUser] = useState("userA");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setCouple(stored.couple || INITIAL_COUPLE);
      setPlaces(stored.places || INITIAL_PLACES);
      setDates(stored.dates || INITIAL_DATES);
      setCurrentUser(stored.currentUser || "userA");
    } else {
      setCouple(INITIAL_COUPLE);
      setPlaces(INITIAL_PLACES);
      setDates(INITIAL_DATES);
    }
    setIsLoaded(true);
  }, []);

  // Persist to storage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage({ couple, places, dates, currentUser });
    }
  }, [couple, places, dates, currentUser, isLoaded]);

  const switchUser = useCallback(() => {
    setCurrentUser(prev => prev === "userA" ? "userB" : "userA");
  }, []);

  const updateCouple = useCallback((updates) => {
    setCouple(prev => ({ ...prev, ...updates }));
  }, []);

  const addPlace = useCallback((placeData) => {
    const newPlace = {
      id: `place-${generateId()}`,
      ...placeData,
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
      rating: 0,
      visited: false,
    };
    setPlaces(prev => [newPlace, ...prev]);
    return newPlace;
  }, [currentUser]);

  const updatePlace = useCallback((id, updates) => {
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePlace = useCallback((id) => {
    setPlaces(prev => prev.filter(p => p.id !== id));
  }, []);

  const addDate = useCallback((dateData) => {
    const newDate = {
      id: `date-${generateId()}`,
      ...dateData,
      status: "upcoming",
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };
    setDates(prev => [newDate, ...prev]);
    return newDate;
  }, [currentUser]);

  const updateDate = useCallback((id, updates) => {
    setDates(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDate = useCallback((id) => {
    setDates(prev => prev.filter(d => d.id !== id));
  }, []);

  const resetApp = useCallback(() => {
    setCouple(INITIAL_COUPLE);
    setPlaces(INITIAL_PLACES);
    setDates(INITIAL_DATES);
    setCurrentUser("userA");
  }, []);

  return {
    couple, places, dates, currentUser,
    isLoaded,
    switchUser, updateCouple,
    addPlace, updatePlace, deletePlace,
    addDate, updateDate, deleteDate,
    resetApp,
  };
};
