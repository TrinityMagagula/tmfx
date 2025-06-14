  // Import necessary Firebase and Supabase modules
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

  // Firebase Config
  const firebaseConfig = {
    apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
    authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
    databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
    projectId: "mt-trading-signup-and-log-in",
    storageBucket: "mt-trading-signup-and-log-in.appspot.com",
    messagingSenderId: "101302422584",
    appId: "1:101302422584:web:07d472b05e81a6930beacd"
  };

  // Supabase Config
  const supabaseConfig = {
    url: 'https://fepujhdzovzbygczdjxe.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU'
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Initialize Supabase
  const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

  // Function to check user's subscription status
  async function checkUserSubscription(uid) {
    try {
      // Check all three tables in parallel
      const [ nf] = await Promise.all([

        supabase.from('nf').select('id').eq('id', uid),

      ]);

      // Check if user exists in any of the tables

      const haspk = nf.data && nf.data.length > 0;

      return haspk;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Main function to handle button click
  async function goToNationalFinals() {
    const user = auth.currentUser;
    
    if (!user) {
      alert('Please log in first');
      return;
    }

    const isSubscribed = await checkUserSubscription(user.uid);
    
    if (isSubscribed) {
      window.location.href = 'nationalfinals/natfinal.html';
    } else {
      alert('Please subscribe to access Tournament');
      window.location.href = '../cashier/transact/subscriptions.html';
    }
  }

  // Make the function available globally
  window.goToNationalFinals = goToNationalFinals;

  // Optional: Check auth state to ensure user is logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is logged in:', user.uid);
    } else {
      console.log('No user is logged in');
    }
  });