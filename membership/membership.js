import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
    authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
    projectId: "mt-trading-signup-and-log-in",
    storageBucket: "mt-trading-signup-and-log-in.appspot.com",
    messagingSenderId: "101302422584",
    appId: "1:101302422584:web:07d472b05e81a6930beacd",
    databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


  // Check if user is authenticated
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Not a Member, please signup/login");
      window.location.href = "../login/login.html";
    }
  });




  