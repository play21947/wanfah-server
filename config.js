// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyBKV4CqTg78DhozcUFu_et4lp711GoTNuA",
  authDomain: "wanfah-lottery.firebaseapp.com",
  databaseURL: "https://wanfah-lottery-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wanfah-lottery",
  storageBucket: "wanfah-lottery.appspot.com",
  messagingSenderId: "761993847576",
  appId: "1:761993847576:web:1169870a8f60114af7746d",
  measurementId: "G-YW5FKN3ZT1"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)