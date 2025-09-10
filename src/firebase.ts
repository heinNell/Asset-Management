// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCjTCWf4QPovnyuGwp809ta3igHwDCmMAo",
  authDomain: "lmvs-86b43.firebaseapp.com",
  projectId: "lmvs-86b43",
  storageBucket: "lmvs-86b43.firebasestorage.app",
  messagingSenderId: "398663269859",
  appId: "1:398663269859:android:b86a1574c49c21540474d6"
};            
    
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;