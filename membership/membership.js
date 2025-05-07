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
      window.location.href = "login.html";
    }
  });

  // Supabase import
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";



async function goToMentorshipPage() {
    const user = auth.currentUser;
    if (!user) {
      alert("Not a Member, please signup/login");
      window.location.href = "login.html";
      return;
    }

    const uid = user.uid;

    // Insert Supabase JS library
    const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if UID exists
    const { data: existing, error: fetchError } = await supabase
      .from("Access")
      .select("*")
      .eq("id", uid)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error(fetchError.message);
      alert("An error occurred while checking access.");
      return;
    }

    // If user doesn't exist, insert row
    if (!existing) {
      const { error: insertError } = await supabase
        .from("Access")
        .insert([{ id: uid,}]); // default to false

      if (insertError) {
        console.error(insertError.message);
        alert("Failed to create access record.");
        return;
      }
    }

    // Now re-fetch to check Mentorship status
    const { data: accessData, error: finalFetchError } = await supabase
      .from("Access")
      .select("Mentorship")
      .eq("id", uid)
      .single();

    if (finalFetchError) {
      console.error(finalFetchError.message);
      alert("Could not verify mentorship status.");
      return;
    }

    if (accessData.Mentorship === true) {
      window.location.href = "mentorship/mentorship.html";
    } else {
      alert("Please subscribe to mentorship");
      window.location.href = "cashier/cashier.html";
    }
  }

  // Expose function to global scope
  window.goToMentorshipPage = goToMentorshipPage;






  //signals access

  async function goToSignalsPage() {

    const user = auth.currentUser;
    if (!user) {
      alert("Not a Member, please signup/login");
      window.location.href = "login.html";
      return;
    }

    const uid = user.uid;

    // Insert Supabase JS library
    const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';
    const supabase = createClient(supabaseUrl, supabaseKey);
    

    // Check if UID exists
    const { data: existing, error: fetchError } = await supabase
      .from("Access")
      .select("*")
      .eq("id", uid)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error(fetchError.message);
      alert("An error occurred while checking access.");
      return;
    }

    // If user doesn't exist, insert row
    if (!existing) {
      const { error: insertError } = await supabase
        .from("Access")
        .insert([{ id: uid,}]); // default to false

      if (insertError) {
        console.error(insertError.message);
        alert("Failed to create access record.");
        return;
      }
    }

    // Now re-fetch to check Signals status
    const { data: accessData, error: finalFetchError } = await supabase
      .from("Access")
      .select("Signals")
      .eq("id", uid)
      .single();

    if (finalFetchError) {
      console.error(finalFetchError.message);
      alert("Could not verify signals status.");
      return;
    }

    if (accessData.Signals === true) {
      window.location.href = "signals/signals.html";
    } else {
      alert("Please subscribe to signals");
      window.location.href = "cashier/cashier.html";
    }
  }

  // Expose function to global scope
  window.goToSignalsPage = goToSignalsPage;






  //strategy access

  async function goToStrategyPage() {

    const user = auth.currentUser;
    if (!user) {
      alert("Not a Member, please signup/login");
      window.location.href = "login.html";
      return;
    }

    const uid = user.uid;

    // Insert Supabase JS library
    const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';
    const supabase = createClient(supabaseUrl, supabaseKey);
    

    // Check if UID exists
    const { data: existing, error: fetchError } = await supabase
      .from("Access")
      .select("*")
      .eq("id", uid)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error(fetchError.message);
      alert("An error occurred while checking access.");
      return;
    }

    // If user doesn't exist, insert row
    if (!existing) {
      const { error: insertError } = await supabase
        .from("Access")
        .insert([{ id: uid,}]); // default to false

      if (insertError) {
        console.error(insertError.message);
        alert("Failed to create access record.");
        return;
      }
    }

    // Now re-fetch to check Signals status
    const { data: accessData, error: finalFetchError } = await supabase
      .from("Access")
      .select("Strategy")
      .eq("id", uid)
      .single();

    if (finalFetchError) {
      console.error(finalFetchError.message);
      alert("Could not verify access status.");
      return;
    }

    if (accessData.Strategy === true) {
      window.location.href = "strategy/strategy.html";
    } else {
      alert("Please subscribe to strategy");
      window.location.href = "cashier/cashier.html";
    }
  }

  // Expose function to global scope
  window.goToStrategyPage = goToStrategyPage;