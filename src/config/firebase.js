// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Demo Firebase configuration - Replace with your actual Firebase config
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemo-Replace-With-Your-Actual-API-Key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "govt-docs-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "govt-docs-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "govt-docs-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789012"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;