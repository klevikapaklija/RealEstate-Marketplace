// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate that required Firebase config is present
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.warn(`⚠️ Missing required Firebase environment variables: ${missingKeys.join(', ')}. Authentication will not work. Please set these in your .env file: ${missingKeys.map(k => `REACT_APP_FIREBASE_${k.toUpperCase()}`).join(', ')}`);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set custom action code settings to use your custom domain
auth.useDeviceLanguage(); // Use device language for emails

// Configure action code settings for email verification, password reset, etc.
// Use environment variable for URL, fallback to current origin in development
const actionCodeUrl = process.env.REACT_APP_ACTION_CODE_URL || window.location.origin;
export const actionCodeSettings = {
  url: actionCodeUrl,
  handleCodeInApp: true,
};


