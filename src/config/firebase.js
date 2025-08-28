// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCFXqNXatWnPnZeSwhtSBn-tkHQFBelLUk",
  authDomain: "government-document-bb52f.firebaseapp.com",
  projectId: "government-document-bb52f",
  storageBucket: "government-document-bb52f.firebasestorage.app",
  messagingSenderId: "503997814033",
  appId: "1:503997814033:web:3b773e78c259e6e23a68b0",
  measurementId: "G-KR3YTWQ96V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;