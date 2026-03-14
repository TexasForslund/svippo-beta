import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTKMTGi_GycTP86OqjPiY2Y1Coghe6NO4",
  authDomain: "svippo-beta.firebaseapp.com",
  projectId: "svippo-beta",
  storageBucket: "svippo-beta.firebasestorage.app",
  messagingSenderId: "1022782055047",
  appId: "1:1022782055047:web:d4460e4f0d295032d38e22"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
