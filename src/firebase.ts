// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAyoSNhJAdTdrDtY4rnPb-yTWIzAvckZdU",
  authDomain: "carrybee9999.firebaseapp.com",
  databaseURL: "https://carrybee9999-default-rtdb.firebaseio.com",
  projectId: "carrybee9999",
  storageBucket: "carrybee9999.firebasestorage.app",
  messagingSenderId: "907470959930",
  appId: "1:907470959930:web:f4b7c00ac8f4356f870c03",
  measurementId: "G-W1NNZGQ7G3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
