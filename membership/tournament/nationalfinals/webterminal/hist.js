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

  const historyTbody = document.getElementById('tradeHistory');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageIndicator = document.getElementById('pageIndicator');

  const pageSize = 10;
  let currentPage = 1;
  let userId = null;
  let totalRecords = 0;

  const round2 = (num) => parseFloat(Number(num).toFixed(2));

  const loadPage = async (page) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: trades, error } = await supabase
      .from('past-tradesnf')
      .select('*', { count: 'exact' })
      .eq('id', userId)
      .order('time', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error loading trades:', error);
      return;
    }

    historyTbody.innerHTML = '';
    trades.forEach(trade => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${trade.symbol}</td>
        <td>${new Date(trade.time).toLocaleString()}</td>
        <td>${trade.type}</td>
        <td>${round2(trade.volume)}</td>
        <td>${round2(trade.entry)}</td>
        <td>${round2(trade.close)}</td>
        <td>${trade.tp !== null ? round2(trade.tp) : '-'}</td>
        <td>${trade.sl !== null ? round2(trade.sl) : '-'}</td>
        <td style="color: ${trade.profit >= 0 ? 'blue' : 'red'}">${round2(trade.profit)}</td>
        <td>${trade.reason}</td>
      `;
      historyTbody.appendChild(row);
    });

    // Update pagination controls
    pageIndicator.textContent = `Page ${currentPage}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = (currentPage * pageSize >= totalRecords);
  };

  const updateTotalCount = async () => {
    const { count, error } = await supabase
      .from('past-tradesnf')
      .select('*', { count: 'exact', head: true })
      .eq('id', userId);

    if (!error && count !== null) {
      totalRecords = count;
    }
  };

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    userId = user.uid;

    await updateTotalCount();
    await loadPage(currentPage);
  });

  prevBtn.addEventListener('click', async () => {
    if (currentPage > 1) {
      currentPage--;
      await loadPage(currentPage);
    }
  });

  nextBtn.addEventListener('click', async () => {
    if ((currentPage * pageSize) < totalRecords) {
      currentPage++;
      await loadPage(currentPage);
    }
  });