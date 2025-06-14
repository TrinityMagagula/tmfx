// Firebase + Supabase Unified Realtime Script
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
  authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
  databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
  projectId: "mt-trading-signup-and-log-in",
  storageBucket: "mt-trading-signup-and-log-in.appspot.com",
  messagingSenderId: "101302422584",
  appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

// ✅ Supabase Config
const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

    // ✅ Wait for DOM before running anything
    document.addEventListener("DOMContentLoaded", () => {
        onAuthStateChanged(auth, async (user) => {
          if (!user) {
            alert("Please login to continue.");
            window.location.href = "../../../login/login.html";
            return;
          }
  
          const uid = user.uid;
          console.log("Logged in as:", uid);
  
          // ✅ Function to update username

  
        // ✅ Calculate credits from completed transactions
        
  
          // ✅ Listen to changes in username
          


        });
      });