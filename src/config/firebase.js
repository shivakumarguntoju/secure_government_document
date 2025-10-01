// Firebase Configuration & Initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Validate environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingVars);
  console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
}

// Use Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration before initializing
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.error('Firebase API key is not configured. Please check your .env file.');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw new Error('Firebase configuration error. Please check your environment variables.');
}

// Services
export const auth = getAuth(app);

// Initialize Firestore with proper configuration
let firestoreDb = null;
try {
  firestoreDb = getFirestore(app);
  
  // Enable offline persistence for better reliability
  if (typeof window !== 'undefined') {
    // Only enable in browser environment
    import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
      // Ensure network is enabled
      enableNetwork(firestoreDb).catch(error => {
        console.warn('Failed to enable Firestore network:', error);
      });
    });
  }
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
  firestoreDb = null;
}

export const db = firestoreDb;

// Initialize Storage with proper configuration
let firebaseStorage = null;
try {
  firebaseStorage = getStorage(app);
  
  // Configure storage settings for better CORS handling
  if (typeof window !== 'undefined') {
    // Set custom timeout for uploads
    firebaseStorage.maxUploadRetryTime = 120000; // 2 minutes
    firebaseStorage.maxOperationRetryTime = 120000; // 2 minutes
  }
} catch (error) {
  console.error('Failed to initialize Firebase Storage:', error);
  firebaseStorage = null;
}

export const storage = firebaseStorage;

// Analytics (only if supported in environment)
export const analytics = await isSupported().then(yes => (yes ? getAnalytics(app) : null));

export default app;
