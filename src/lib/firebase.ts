// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "ecohub-2tdq2",
  appId: "1:108982846115:web:d21500091ca4f78f0cb516",
  storageBucket: "ecohub-2tdq2.appspot.com",
  apiKey: "AIzaSyCipKel1jdNh_JDnV82BNWr8kPkxHIFyYA",
  authDomain: "ecohub-2tdq2.firebaseapp.com",
  messagingSenderId: "108982846115",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth, app };
