import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get as dbGet } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
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
const db = getDatabase(app);
const storage = getStorage(app);

// Initialize Supabase
const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

// Function to check if user has access
async function checkUserAccess(uid) {
    try {
        const [mcs, dmc] = await Promise.all([
            supabase.from('MCS').select('id').eq('id', uid),
            supabase.from('DMC').select('id').eq('id', uid),
        ]);

        return (
            (mcs.data && mcs.data.length > 0) ||
            (dmc.data && dmc.data.length > 0)
        );
    } catch (error) {
        console.error('Error checking user access:', error);
        return false;
    }
}

// Function to load profile picture
async function loadProfilePicture(uid) {
    try {
        const picRef = storageRef(storage, `profile_pictures/${uid}`);
        const url = await getDownloadURL(picRef);
        document.getElementById('profilePic').src = url;
    } catch (error) {
        console.warn('User profile picture not found, using default.');
        try {
            const defaultRef = storageRef(storage, 'tm fx.png');
            const defaultUrl = await getDownloadURL(defaultRef);
            document.getElementById('profilePic').src = defaultUrl;
        } catch (defaultError) {
            console.error('Failed to load default profile picture:', defaultError);
        }
    }
}



// Function to load user name from Realtime DB
async function loadUserName(uid) {
    try {
        const nameRef = dbRef(db, `users/${uid}/name`);
        const snapshot = await dbGet(nameRef);
        if (snapshot.exists()) {
            document.getElementById('userName').textContent = snapshot.val();
        } else {
            document.getElementById('userName').textContent = "Unknown User";
        }
    } catch (error) {
        console.error('Error loading user name:', error);
        document.getElementById('userName').textContent = "Error";
    }
}

// Main auth listener
function initAccessControl() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert('You do not have access. Please Sign up or log in');
            window.location.href = '../../../../signup/signup.html';
            return;
        }

        const hasAccess = await checkUserAccess(user.uid);
        if (!hasAccess) {
            alert('You do not have access, please subscribe');
            window.location.href = '../../../cashier/transact/subscriptions.html';
            return;
        }

        // Load name and profile picture after access is confirmed
        await loadUserName(user.uid);
        await loadProfilePicture(user.uid);
    });
}

// Start process
initAccessControl();
