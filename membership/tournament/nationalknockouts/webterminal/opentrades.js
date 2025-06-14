
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
  authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
  databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
  projectId: "mt-trading-signup-and-log-in",
  storageBucket: "mt-trading-signup-and-log-in.appspot.com",
  messagingSenderId: "101302422584",
  appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

const supabase = createClient(
  'https://fepujhdzovzbygczdjxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU'
);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const tbody = document.getElementById('openTrades');

let balance = 0, margin = 0, equity = 0, currentPL = 0, uid = '';
const round2 = (num) => parseFloat(Number(num).toFixed(2));

const updateUI = () => {
  document.getElementById('balance').textContent = balance.toFixed(2);
  document.getElementById('margin').textContent = margin.toFixed(2);
  document.getElementById('equity').textContent = equity.toFixed(2);
  document.getElementById('freemargin').textContent = (equity - margin).toFixed(2);
};

const updateAccountMetrics = async () => {
  const { data: past } = await supabase.from('past-tradesnk').select('profit').eq('id', uid);
  if (past) balance = round2(past.reduce((sum, row) => sum + Number(row.profit || 0), 0));

  const { data: open } = await supabase.from('open-tradesnk').select('volume').eq('id', uid);
  if (open) margin = round2(open.reduce((sum, row) => sum + Number(row.volume || 0), 0) * 100);

  if (open && open.length > 0) {
    equity = round2(balance + currentPL);
  } else {
    equity = balance;
    margin = 0;
    currentPL = 0;
  }

  updateUI();
};

const updatePL = async () => {
  const { data: prices } = await supabase.from('synthetic_price').select('id, price');
  if (!prices) return;

  const priceMap = {};
  prices.forEach(p => priceMap[p.id] = parseFloat(p.price));

  let totalPL = 0;
  document.querySelectorAll('.pl-cell').forEach(cell => {
    const entry = parseFloat(cell.getAttribute('data-entry'));
    const type = cell.getAttribute('data-type');
    const symbol = cell.getAttribute('data-symbol');
    const currentPrice = priceMap[symbol];

    if (currentPrice === undefined || isNaN(entry)) {
      cell.textContent = 'N/A';
      return;
    }

    const pl = type === 'buy' ? currentPrice - entry : entry - currentPrice;
    totalPL += pl;
    cell.textContent = pl.toFixed(2);
    cell.style.color = pl < 0 ? 'red' : 'blue';
  });

  currentPL = round2(totalPL);
  const pnlEl = document.getElementById('pnl');
  pnlEl.textContent = currentPL.toFixed(2);
  pnlEl.style.color = currentPL < 0 ? 'red' : 'blue';

  await updateAccountMetrics();
};

const loadOpenTrades = async () => {
  const { data: trades } = await supabase.from('open-tradesnk').select('*').eq('id', uid);
  if (!trades) return;

  tbody.innerHTML = '';
  trades.forEach(trade => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trade.symbol}</td>
      <td>${trade.type}</td>
      <td>${round2(trade.volume)}</td>
      <td>${round2(trade.entry)}</td>
      <td class="pl-cell" data-type="${trade.type}" data-entry="${trade.entry}" data-symbol="${trade.symbol}"></td>
    `;

    const tpVal = trade.tp ?? 0;
    const slVal = trade.sl ?? 0;

    // Create styled buttons
    const modifyBtn = document.createElement('button');
    modifyBtn.textContent = 'Modify';
    modifyBtn.onclick = () => modifyTrade(trade.tradeid, trade.type, trade.entry);
    modifyBtn.style.padding = '8px 12px';
    modifyBtn.style.fontSize = '14px';
    modifyBtn.style.borderRadius = '4px';
    modifyBtn.style.marginRight = '10px';
    modifyBtn.style.border = 'none';
    modifyBtn.style.backgroundColor = '#007bff';
    modifyBtn.style.color = 'white';
    modifyBtn.style.cursor = 'pointer';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.onclick = () => closeTrade(trade.tradeid);
    closeBtn.style.padding = '8px 12px';
    closeBtn.style.fontSize = '14px';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.border = 'none';
    closeBtn.style.backgroundColor = '#dc3545';
    closeBtn.style.color = 'white';
    closeBtn.style.cursor = 'pointer';

    const detailsRow = document.createElement('tr');
    detailsRow.classList.add('details-row');
    detailsRow.style.display = 'none';
    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 5;
    detailsCell.innerHTML = `
      <strong>Time:</strong> ${new Date(trade.time).toLocaleString()}<br>
      <strong>TP:</strong> <input type="number" step="0.01" id="tp-${trade.tradeid}" value="${tpVal}"><br>
      <strong>SL:</strong> <input type="number" step="0.01" id="sl-${trade.tradeid}" value="${slVal}"><br>
    `;
    detailsCell.appendChild(modifyBtn);
    detailsCell.appendChild(closeBtn);
    detailsRow.appendChild(detailsCell);

    row.addEventListener('click', () => {
      detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
    });

    tbody.appendChild(row);
    tbody.appendChild(detailsRow);
  });

  updatePL();
};


onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  uid = user.uid;
  await loadOpenTrades();
  await updateAccountMetrics();

  setInterval(async () => {

    await updatePL();
  }, 1000);
});

window.modifyTrade = async (tradeid, type, entry) => {
  const tpVal = parseFloat(document.getElementById(`tp-${tradeid}`).value);
  const slVal = parseFloat(document.getElementById(`sl-${tradeid}`).value);

  let tp = isNaN(tpVal) ? null : round2(tpVal);
  let sl = isNaN(slVal) ? null : round2(slVal);

  if ((type === 'buy' && ((tp && tp <= entry) || (sl && sl >= entry))) ||
      (type === 'sell' && ((tp && tp >= entry) || (sl && sl <= entry)))) {
    return alert('Invalid TP and SL');
  }

  const { error } = await supabase
    .from('open-tradesnk')
    .update({ tp: tp || null, sl: sl || null })
    .eq('tradeid', tradeid);

  if (error) return console.error('Update error:', error);
  alert('done');
};

window.closeTrade = async (tradeid) => {
  const { data: tradeData } = await supabase
    .from('open-tradesnk')
    .select('*')
    .eq('tradeid', tradeid)
    .single();

  if (!tradeData) return;

  const { data: priceData } = await supabase
    .from('synthetic_price')
    .select('price')
    .eq('id', tradeData.symbol)
    .single();

  if (!priceData) return;

  const closePrice = round2(parseFloat(priceData.price));
  const entryPrice = round2(parseFloat(tradeData.entry));

  const profit = round2(tradeData.type === 'buy'
    ? closePrice - entryPrice
    : entryPrice - closePrice);

  const { tradeid: tid, symbol, time, entry, tp, sl, type, volume, id } = tradeData;

  await supabase.from('past-tradesnk').insert([{
    tradeid: tid,
    symbol,
    time,
    entry: round2(entry),
    tp: round2(tp),
    sl: round2(sl),
    type,
    volume: round2(volume),
    id,
    reason: 'Manual Close',
    close: closePrice,
    profit: profit
  }]);

  await supabase.from('open-tradesnk').delete().eq('tradeid', tradeid);

  loadOpenTrades();
};

