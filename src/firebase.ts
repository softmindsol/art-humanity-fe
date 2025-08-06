// Import core functions
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: "art-humanity-fe.firebaseapp.com",
  projectId: "art-humanity-fe",
  storageBucket: "art-humanity-fe.appspot.com", // ✅ fixed typo (was missing .com)
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
  measurementId: import.meta.env.VITE_measurementId,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Initialize Auth and Google provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, analytics };
