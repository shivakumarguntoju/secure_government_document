// src/firebase.js

// Firebase v9+ Modular SDK
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCFXqNXatWnPnZeSwhtSBn-tkHQFBelLUk",
  authDomain: "government-document-bb52f.firebaseapp.com",
  projectId: "government-document-bb52f",
  storageBucket: "government-document-bb52f.appspot.com", // ✅ FIXED
  messagingSenderId: "503997814033",
  appId: "1:503997814033:web:3b773e78c259e6e23a68b0",
  measurementId: "G-KR3YTWQ96V"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Init Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Ensure auth persists across refreshes
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ✅ Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Persistence failed — multiple tabs open.");
  } else if (err.code === "unimplemented") {
    console.warn("Persistence is not available in this browser.");
  }
});

// ✅ Analytics only if supported (to avoid errors in Node/test envs)
let analytics = null;
isSupported().then((yes) => {
  if (yes) analytics = getAnalytics(app);
});

export { analytics };
export default app;
