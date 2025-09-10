// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXeZSAgreSkuDAey3njBkpcMqkpNW12go",
  authDomain: "lmvs-86b43.firebaseapp.com",
  databaseURL: "https://lmvs-86b43-default-rtdb.firebaseio.com",
  projectId: "lmvs-86b43",
  storageBucket: "lmvs-86b43.firebasestorage.app",
  messagingSenderId: "398663269859",
  appId: "1:398663269859:web:8a49cbc3615b4add0474d6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
