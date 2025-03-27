import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnSzwdUInkRp1w8osYBuEIhXw-rlvtLiQ",
  authDomain: "lalathebeadmaker-admin.firebaseapp.com",
  projectId: "lalathebeadmaker-admin",
  storageBucket: "lalathebeadmaker-admin.firebasestorage.app",
  messagingSenderId: "348774121390",
  appId: "1:348774121390:web:f04db5d41a2fe659c4123f",
  measurementId: "G-S12DCNVE6H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 