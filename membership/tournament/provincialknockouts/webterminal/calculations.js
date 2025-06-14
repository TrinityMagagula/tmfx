// Import Firebase and Supabase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

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
const supabase = createClient(
  'https://fepujhdzovzbygczdjxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU'
);

const app = initializeApp(firebaseConfig);
const auth = getAuth();


// Fetch price for specific instrument
async function fetchPriceForInstrument(instrument) {
  if (!instrument) {
    document.getElementById('price').textContent = '0.00';
    return;
  }

  const { data, error } = await supabase
    .from('synthetic_price')
    .select('price')
    .eq('id', instrument)
    .order('server_time', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching price for instrument:', error);
    document.getElementById('price').textContent = '0.00';
    return;
  }

  if (data && data.length > 0) {
    document.getElementById('price').textContent = parseFloat(data[0].price).toFixed(2);
  } else {
    document.getElementById('price').textContent = '0.00';
  }
}

// Real-time subscription
let priceSubscription = null;

function subscribeToPriceUpdates(instrumentId) {
  if (priceSubscription) {
    supabase.removeChannel(priceSubscription);
    priceSubscription = null;
  }

  if (!instrumentId) return;

  priceSubscription = supabase
    .channel(`price-updates-${instrumentId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'synthetic_price',
      filter: `id=eq.${instrumentId}`
    }, async (payload) => {
      const newPrice = payload.new?.price;
      if (newPrice !== undefined) {
        document.getElementById('price').textContent = parseFloat(newPrice).toFixed(2);
      } else {
        // fallback to fetch if real-time value missing
        fetchPriceForInstrument(instrumentId);
      }
    })
    .subscribe();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const uid = user.uid;




  const instrumentSelect = document.getElementById('instruments');

  if (instrumentSelect) {
    const currentInstrument = instrumentSelect.value;
    fetchPriceForInstrument(currentInstrument);
    subscribeToPriceUpdates(currentInstrument);

    instrumentSelect.addEventListener('change', (e) => {
      const newInstrument = e.target.value;
      fetchPriceForInstrument(newInstrument);
      subscribeToPriceUpdates(newInstrument);
    });
  }

});

