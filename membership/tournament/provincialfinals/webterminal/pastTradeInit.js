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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Initialize Supabase
const supabaseUrl = 'https://fepujhdzovzbygczdjxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Main logic
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    console.warn('User not authenticated');
    return;
  }

  const uid = user.uid;

  // Check if at least one row exists in past-trades
  const { data: rows, error: checkError } = await supabase
    .from('past-tradespf')
    .select('*')
    .eq('id', uid);

  if (checkError) {
    console.error('Error checking past-tradespf:', checkError);
    return;
  }

  if (!rows || rows.length === 0) {
    // Insert if no existing rows found
    const { error: insertError } = await supabase
      .from('past-tradespf')
      .insert([{
        id: uid,
        profit: 1000,
        type: 'Balance'
      }]);

    if (insertError) {
      
    } else {
      
    }
  } else {
    
  }

  // Set up real-time listener
  const subscription = supabase
    .channel('past-tradespf-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'past-tradespf',
      filter: `id=eq.${uid}`
    }, payload => {
      console.log('past-trades updated:', payload);
      location.reload(); // Reload on change
    })
});
