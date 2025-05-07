// ✅ Firebase Setup
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
  authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
  projectId: "mt-trading-signup-and-log-in",
  storageBucket: "mt-trading-signup-and-log-in.appspot.com",
  messagingSenderId: "101302422584",
  appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Login form logic
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      alert("Please verify your email before logging in.");
      return;
    }

    alert("Login successful!");
    window.location.href = '../membership/membership.html';
  } catch (error) {
    console.error("Login failed:", error.message);
    alert("Login failed: " + error.message);
  }
});