// src/firebase/config.js
// Firebase App + Firestore initialization with smart offline fallback

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Kiểm tra xem tất cả biến môi trường Firebase đã được cấu hình chưa
const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const isFirebaseConfigured = REQUIRED_VARS.every((key) => {
  const val = import.meta.env[key];
  return val && val.trim() !== "" && !val.includes("your_");
});

let db = null;
let firebaseApp = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  try {
    // Tránh khởi tạo lại khi hot-reload
    firebaseApp = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    db = getFirestore(firebaseApp);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    db = null;
  }
}

/**
 * `db` sẽ là Firestore instance nếu Firebase đã cấu hình,
 * hoặc `null` nếu chưa cấu hình → app sẽ fallback về localStorage.
 */
export { db, isFirebaseConfigured };
