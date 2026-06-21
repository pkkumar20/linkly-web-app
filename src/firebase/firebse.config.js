// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI8Ry_i7IG-P_GTuDmSjQU3vL8L52Xr_I",
  authDomain: "linkly-6143d.firebaseapp.com",
  projectId: "linkly-6143d",
  storageBucket: "linkly-6143d.firebasestorage.app",
  messagingSenderId: "1097621319695",
  appId: "1:1097621319695:web:a3bef8a55c8649df42337a",
  measurementId: "G-27PY1YR80Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
