import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';

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

// Firebase Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Reference
const tbody = document.getElementById('pendingTradesBody');

// Format decimal
const round2 = (n) => parseFloat(Number(n).toFixed(2));

// Load Pending Trades
async function loadPendingTrades(uid) {
  const { data: trades, error } = await supabase
    .from('pending-tradesnk')
    .select('*')
    .eq('id', uid);

  if (error) {
    alert('Error fetching pending trades');
    console.error(error);
    return;
  }

  tbody.innerHTML = '';

  trades.forEach(trade => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trade.symbol}</td>
      <td>${trade.type}</td>
      <td>${round2(trade.volume)}</td>
      <td>${round2(trade.entry)}</td>
    `;

    const tpVal = trade.tp ?? '';
    const slVal = trade.sl ?? '';

    // Create styled Modify button
    const modifyBtn = document.createElement('button');
    modifyBtn.textContent = 'Modify';
    modifyBtn.onclick = () => modifyTrade(trade.tradeid, trade.id, trade.entry, trade.type);
    modifyBtn.style.padding = '8px 12px';
    modifyBtn.style.fontSize = '14px';
    modifyBtn.style.borderRadius = '4px';
    modifyBtn.style.marginRight = '10px';
    modifyBtn.style.border = 'none';
    modifyBtn.style.backgroundColor = '#007bff';
    modifyBtn.style.color = 'white';
    modifyBtn.style.cursor = 'pointer';

    // Create styled Cancel (X) button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✖';
    cancelBtn.onclick = () => cancelTrade(trade.tradeid, trade.id);
    cancelBtn.style.padding = '8px 12px';
    cancelBtn.style.fontSize = '14px';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.border = 'none';
    cancelBtn.style.backgroundColor = '#dc3545';
    cancelBtn.style.color = 'white';
    cancelBtn.style.cursor = 'pointer';

    // Create details row
    const detailsRow = document.createElement('tr');
    detailsRow.style.display = 'none';
    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 4;
    detailsCell.innerHTML = `
      <strong>Time:</strong> ${new Date(trade.time).toLocaleString()}<br>
      <strong>TP:</strong> <input type="number" step="0.0001" value="${tpVal}" id="tp-${trade.tradeid}" /><br>
      <strong>SL:</strong> <input type="number" step="0.0001" value="${slVal}" id="sl-${trade.tradeid}" /><br>
    `;
    detailsCell.appendChild(modifyBtn);
    detailsCell.appendChild(cancelBtn);
    detailsRow.appendChild(detailsCell);

    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
    });

    tbody.appendChild(row);
    tbody.appendChild(detailsRow);
  });
}


// Auth and Load
onAuthStateChanged(auth, (user) => {
  if (user) loadPendingTrades(user.uid);
});

// Modify Trade
window.modifyTrade = async function (tradeid, uid, entry, type) {
  const tpInput = document.getElementById(`tp-${tradeid}`).value;
  const slInput = document.getElementById(`sl-${tradeid}`).value;

  let tp = tpInput !== '0' ? parseFloat(tpInput) : null;
  let sl = slInput !== '0' ? parseFloat(slInput) : null;
  entry = parseFloat(entry);

  const isBuy = type.includes('buy');
  const isSell = type.includes('sell');

  if (
    (isBuy && ((tp !== null && tp <= entry) || (sl !== null && sl >= entry))) ||
    (isSell && ((tp !== null && tp >= entry) || (sl !== null && sl <= entry)))
  ) {
    return alert('Invalid TP and SL');
  }

  const updates = {};
  if (tpInput === '0') updates.tp = null;
  else if (!isNaN(tp)) updates.tp = tp;

  if (slInput === '0') updates.sl = null;
  else if (!isNaN(sl)) updates.sl = sl;

  const { error } = await supabase
    .from('pending-tradesnk')
    .update(updates)
    .eq('tradeid', tradeid)
    .eq('id', uid);

  if (error) {
    alert('Update failed');
    console.error(error);
  } else {
    alert('TP/SL updated');
    loadPendingTrades(uid); // Refresh the table
  }
};

// Cancel Trade
window.cancelTrade = async function (tradeid, uid) {
  const { data, error } = await supabase
    .from('pending-tradesnk')
    .select('*')
    .eq('tradeid', tradeid)
    .eq('id', uid)
    .single();

  if (error) return alert('Fetch failed');

  const insertData = { ...data, reason: 'cancelled' };
  delete insertData.id;

  const { error: insertError } = await supabase
    .from('past-tradesnk')
    .insert([{ ...insertData, id: uid }]);

  if (insertError) return alert('Insert failed');

  const { error: deleteError } = await supabase
    .from('pending-tradesnk')
    .delete()
    .eq('tradeid', tradeid)
    .eq('id', uid);

  if (deleteError) return console.error('Delete error:', deleteError);

  // Refresh table only, no full reload
  loadPendingTrades(uid);
};
