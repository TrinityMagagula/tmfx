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

  // Utility to render transaction rows
  function renderTransactions(transactions) {
    const tableBody = document.getElementById('TransactionHistory');
    tableBody.innerHTML = '';

    transactions.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tx.TransactionID || ''}</td>
        <td>${tx.ItemName || ''}</td>
        <td>${new Date(tx.Date).toLocaleString() || ''}</td>
        <td>${tx.Quantity || ''}</td>
        <td>R${(tx.Amount || 0).toFixed(2)}</td>
        <td>R${(tx.OpeningBalance || 0).toFixed(2)}</td>
        <td>R${(tx.ClosingBalance || 0).toFixed(2)}</td>
        <td>${tx.Status || ''}</td>
        <td><button onclick="downloadInvoice('${tx.TransactionID}')">Invoice</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Load + subscribe function
  async function loadAndSubscribe(uid) {
    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from('TransactionHistory')
        .select('*')
        .eq('id', uid)
        .eq('Type', 'Withdrawal')
        .order('Date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error.message);
        return;
      }

      renderTransactions(data);
    };

    await loadTransactions(); // Initial load

    // Subscribe to changes
    supabase
      .channel('realtime:TransactionHistory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'TransactionHistory',
          filter: `id=eq.${uid}`,
        },
        payload => {
          if (payload.new.Type === 'Withdrawal') {
            loadTransactions(); // Refresh when relevant change happens
          }
        }
      )
      .subscribe();
  }

  // Auth listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadAndSubscribe(user.uid);
    } else {
      console.warn('User not authenticated');
    }
  });

  // Optional invoice placeholder
  window.downloadInvoice = function (transactionId) {
    alert(`Invoice download for ${transactionId} not implemented yet.`);
  };