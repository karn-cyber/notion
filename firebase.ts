// Import the functions you need from the SDKs you need
import { initializeApp,getApps, getApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { Firestore, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-Cx_jL24e7VmS2wZYOEltH-0Kfo1nfcc",
  authDomain: "notion-clone-c8751.firebaseapp.com",
  projectId: "notion-clone-c8751",
  storageBucket: "notion-clone-c8751.firebasestorage.app",
  messagingSenderId: "656251168833",
  appId: "1:656251168833:web:e78d9162a9ac2d506ffec0",
  measurementId: "G-1QNLLG0L6W"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig):getApp();
const db = getFirestore(app);

export {db};