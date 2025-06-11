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

// Function to check if user has access
async function checkUserAccess(uid) {
    try {
        // Check all tables in parallel
        const [yearlyMentorship, monthlyMentorship, weeklyMentorship, mcSpecial] = await Promise.all([
            supabase.from('YearlyMentorship').select('id').eq('id', uid),
            supabase.from('WeeklyMentorship').select('id').eq('id', uid),
            supabase.from('MonthlyMentorship').select('id').eq('id', uid),
            supabase.from('MCS').select('id').eq('id', uid)
        ]);

        // Check if user exists in any of the tables
        const hasAccess = 
            (yearlyMentorship.data && yearlyMentorship.data.length > 0) ||
            (monthlyMentorship.data && monthlyMentorship.data.length > 0) ||
            (weeklyMentorship.data && weeklyMentorship.data.length > 0) ||
            (mcSpecial.data && mcSpecial.data.length > 0);

        return hasAccess;
    } catch (error) {
        console.error('Error checking user access:', error);
        return false;
    }
}

// Main function to handle auth state and access control
function initAccessControl() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // User is not authenticated
            alert('You do not have access. Please Sign up or log in');
            window.location.href = '../../signup/signup.html';
            return;
        }

        // User is authenticated, check access
        const hasAccess = await checkUserAccess(user.uid);
        
        if (!hasAccess) {
            alert('You do not have access, please subscribe');
            window.location.href = '../cashier/transact/subscriptions.html';
        }
        // If user has access, do nothing (let them continue)
    });
}

// Initialize the access control when the script loads
initAccessControl();