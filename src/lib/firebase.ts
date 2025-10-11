import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// TEMP: config check (masked)
(() => {
  const mask = (v?: string) => (v ? v.slice(0, 4) + "\u2026" + v.slice(-4) : "MISSING");
  console.log("[Firebase config]", {
    apiKey: mask(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "MISSING",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "MISSING",
    appId: mask(import.meta.env.VITE_FIREBASE_APP_ID),
    env: import.meta.env.MODE,
  });
})();
