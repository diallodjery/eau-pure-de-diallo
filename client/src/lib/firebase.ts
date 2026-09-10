import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA0TBSnxgKwamexTKBfaqFe0unlVxncyyo",
  authDomain: "eau-pure-diallo.firebaseapp.com",
  projectId: "eau-pure-diallo",
  storageBucket: "eau-pure-diallo.firebasestorage.app",
  messagingSenderId: "656329106585",
  appId: "1:656329106585:web:ddcb73d60782fb865ac408",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const firebaseProjectId = firebaseConfig.projectId;
