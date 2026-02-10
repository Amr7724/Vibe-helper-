import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAKZf4_-L0Tn7Tb32vMCFHVzsts5sUirn4",
  authDomain: "focus-7x.firebaseapp.com",
  projectId: "focus-7x",
  storageBucket: "focus-7x.firebasestorage.app",
  messagingSenderId: "294687866337",
  appId: "1:294687866337:web:8d1f5918cc86d2c648e6a0",
  measurementId: "G-K1TZHJRN8Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
