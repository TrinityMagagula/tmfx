// Firebase + Supabase Unified Realtime Script
import { getFirebaseAuth } from './init-services.js';
import { getSupabaseClient } from './init-services.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Get the singleton instances
const auth = getFirebaseAuth();
const supabase = getSupabaseClient();

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
        .eq('Status', 'Completed')
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
