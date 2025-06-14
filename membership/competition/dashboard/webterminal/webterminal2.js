



import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, remove, push, get, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL, uploadBytes } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";





// Firebase Init
firebase.initializeApp({
    apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
    authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
    databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
    projectId: "mt-trading-signup-and-log-in",
    storageBucket: "mt-trading-signup-and-log-in.appspot.com",
    messagingSenderId: "101302422584",
    appId: "1:101302422584:web:07d472b05e81a6930beacd"
  });
  
  const db = firebase.database();
  const auth = firebase.auth();
  const storage = firebase.storage();
  let currentUser;
  
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      const uid = user.uid;
      db.ref(`users/${uid}/loginID`).once('value').then(snap => {
        if (!snap.exists()) location.href = 'membership.html';
        else initUser(uid);
      });
    } else {
      location.href = 'signup.html';
    }
  });
  
  function initUser(uid) {
    db.ref(`users/${uid}/name`).once('value').then(snap => {
      document.getElementById('userName').innerText = snap.val();
    });
  
    const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/mt-trading-signup-and-log-in.appspot.com/o/tm%20fx.png?alt=media&token=4e6aded3-2796-4487-82d4-987b75ca18c1"; // Replace with your actual default pic URL
    
    storage.ref(`profile_pictures/${uid}`).getDownloadURL()
      .then(url => {
        document.getElementById('profilePic').src = url;
      })
      .catch(error => {
        // If the profile picture doesn't exist or there's an error, use the default
        document.getElementById('profilePic').src = defaultProfilePic;
      });
  
    const balanceRef = db.ref(`users/${uid}/webtrade/balance/`);
    balanceRef.once('value').then(snap => {
      if (!snap.exists()) balanceRef.set(0);
      document.getElementById('balance').innerText = snap.val() + ' ZAR';
    });
  
    const equityRef = db.ref(`users/${uid}/webtrade/equity/`);
    equityRef.once('value').then(snap => {
      if (!snap.exists()) equityRef.set(0);
      document.getElementById('equity').innerText = snap.val() + ' ZAR';
    });
  
    const marginRef = db.ref(`users/${uid}/webtrade/margin/`);
    marginRef.once('value').then(snap => {
      if (!snap.exists()) marginRef.set(0);
      document.getElementById('margin').innerText = snap.val();
    });
  
    const pnlRef = db.ref(`users/${uid}/webtrade/pnl`);
    pnlRef.once('value').then(snap => {
      if (!snap.exists()) pnlRef.set(0);
      document.getElementById('pnl').innerText = snap.val() + ' ZAR';
    });
  
    const priceRef = db.ref(`syntheticIndex/price/`);
    priceRef.once('value').then(snap => {
      if (!snap.exists()) priceRef.set(0);
      document.getElementById('price').innerText = snap.val() + ' ZAR';
    });
  
    loadOpenTrades();
    loadTradeHistory();
    startAccountPanelRealtimeUpdates(uid);
    calculateRealtimeBalance(uid);
  
  
  }
  
  function calculateRealtimeBalance(uid) {
    const balanceRef = db.ref(`users/${uid}/webtrade/balance`);
    const pastTradesRef = db.ref(`users/${uid}/past-trades`);
  
    pastTradesRef.on('value', snap => {
      let totalProfit = 0;
      snap.forEach(trade => {
        const profit = parseFloat(trade.val().profit || 0);
        totalProfit += profit;
      });
  
      balanceRef.set(totalProfit.toFixed(2));
    });
  }
  
  
  function startAccountPanelRealtimeUpdates(uid) {
    const balanceRef = db.ref(`users/${uid}/webtrade/balance`);
    const pnlRef = db.ref(`users/${uid}/webtrade/pnl`);
    const marginRef = db.ref(`users/${uid}/webtrade/margin`);
    const equityRef = db.ref(`users/${uid}/webtrade/equity`);
    const openTradesRef = db.ref(`users/${uid}/open-trades`);
    const priceRef = db.ref('syntheticIndex/price');
  
    let currentPrice = 0;
    let openTrades = [];
  
    // Realtime Balance
    balanceRef.on('value', snap => {
      const balance = parseFloat(snap.val() || 0);
      document.getElementById('balance').innerText = balance.toFixed(2) + ' ZAR';
    });
  
    // Realtime PnL
    pnlRef.on('value', snap => {
      const pnl = parseFloat(snap.val() || 0);
      const pnlEl = document.getElementById('pnl');
      pnlEl.innerText = pnl.toFixed(2) + ' ZAR';
      pnlEl.style.color = pnl >= 0 ? 'green' : 'red';
    });
  
    // Realtime Equity
    equityRef.on('value', snap => {
      const equity = parseFloat(snap.val() || 0);
      document.getElementById('equity').innerText = equity.toFixed(2) + ' ZAR';
    });
  
    // Realtime Margin
    marginRef.on('value', snap => {
      const margin = parseFloat(snap.val() || 0);
      document.getElementById('margin').innerText = margin.toFixed(2);
    });
  
    // Get all open trades once and update if changed
    openTradesRef.on('value', snap => {
      openTrades = [];
      snap.forEach(tradeSnap => {
        openTrades.push(tradeSnap.val());
      });
      updateTradeStats(); // recalculate based on currentPrice
    });
  
    // Realtime Price
    priceRef.on('value', snap => {
      currentPrice = parseFloat(snap.val());
      document.getElementById('price').innerText = currentPrice.toFixed(2) + ' ZAR';
      updateTradeStats();
    });
  
    // Calculate PnL, Margin, and Equity
    function updateTradeStats() {
      let totalPnL = 0;
      let totalMargin = 0;
  
      openTrades.forEach(trade => {
        const volume = parseFloat(trade.volume || 0);
        const entry = parseFloat(trade.entry || 0);
        const type = trade.type.toLowerCase();
  
        let profit = 0;
        if (type === 'buy') profit = (currentPrice - entry) * volume;
        else profit = (entry - currentPrice) * volume;
  
        totalPnL += profit;
        totalMargin += volume;
      });
  
      totalPnL = parseFloat(totalPnL.toFixed(2));
      totalMargin = parseFloat((totalMargin * 100).toFixed(2)); // Margin = volume * 100
  
      pnlRef.set(totalPnL);
      marginRef.set(totalMargin);
  
      // Equity = Balance + PnL
      balanceRef.once('value').then(balSnap => {
        const balance = parseFloat(balSnap.val() || 0);
        const equity = parseFloat((balance + totalPnL).toFixed(2));
        equityRef.set(equity);
      });
    }
  }
  
  
  // ✅ Realtime Listener: Only update 'current' in DOM and auto-close on SL/TP
  function startRealtimePriceListener() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const uid = user.uid;
        db.ref('syntheticIndex/price/').on('value', snapshot => {
          const price = snapshot.val();
          const container = document.getElementById('openTrades');
          const rows = container.getElementsByTagName('tr');
          for (let row of rows) {
            const tradeIdMatch = row.querySelector('td button.modify-btn')?.getAttribute('onclick')?.match(/'([^']+)'/);
            if (tradeIdMatch && tradeIdMatch[1]) {
              const id = tradeIdMatch[1];
              const currentCell = document.getElementById(`current-${id}`);
              const entryCell = document.getElementById(`entry-${id}`);
              const profitCell = document.getElementById(`profit-${id}`);
  
              if (currentCell && entryCell && profitCell) {
                currentCell.innerText = price;
  
                const entry = parseFloat(entryCell.innerText);
                const type = row.cells[2].innerText.toLowerCase();
                const volume = parseFloat(row.cells[3].innerText);
  
                let profit = 0;
                if (type === 'buy') {
                  profit = (price - entry) * volume;
                } else {
                  profit = (entry - price) * volume;
                }
  
                profit = parseFloat(profit.toFixed(2));
                profitCell.innerText = profit;
                profitCell.style.color = profit < 0 ? 'red' : 'green';
  
                // ✅ Read SL/TP from Firebase instead of input field
                db.ref(`users/${uid}/open-trades/${id}`).once('value').then(tradeSnap => {
                  const trade = tradeSnap.val();
                  if (!trade) return;
  
                  const tp = parseFloat(trade.tp);
                  const sl = parseFloat(trade.sl);
  
                  if (type === 'buy') {
                    if (price >= tp && tp !== 0) {
                      closeTrade(id, 'TP Hit');
                    } else if (price <= sl && sl !== 0) {
                      closeTrade(id, 'SL Hit');
                    }
                  } else if (type === 'sell') {
                    if (price <= tp && tp !== 0) {
                      closeTrade(id, 'TP Hit');
                    } else if (price >= sl && sl !== 0) {
                      closeTrade(id, 'SL Hit');
                    }
                  }
                });
              }
            }
          }
        });
      }
    });
  }
  
  
  // ✅ Trade Execution Function
  function trade(type) {
    const uid = currentUser.uid;
    const lot = parseFloat(document.getElementById('lot').value);
    const sl = parseFloat(document.getElementById('sl').value);
    const tp = parseFloat(document.getElementById('tp').value);
  
    db.ref('syntheticIndex/price/').once('value').then(snap => {
      const price = snap.val();
  
      const validBuy = type === 'buy' && (tp >= price || tp === 0) && (sl <= price || sl === 0) && (lot > 0 && lot < 1.01);
      const validSell = type === 'sell' && (tp <= price || tp === 0) && (sl >= price || sl === 0) && (lot > 0 && lot < 1.01);
  
      if (validBuy || validSell) {
        const tradeData = {
          symbol: 'TM FX Index',
          time: new Date().toLocaleString(),
          volume: lot * 100,
          entry: price,
          sl,
          tp,
          type,
          current: price,
          profit: 0
        };
  
        db.ref(`users/${uid}/open-trades/${Date.now()}`).set(tradeData).then(() => {
          loadOpenTrades(); // Initial UI rendering
        });
      } else {
        alert("Invalid SL/TP for this trade type. min lot = 0.01, max lot = 1.00");
      }
  
  
  
    });
  }
  
  // ✅ Load once on page load
  window.addEventListener('load', () => {
    startRealtimePriceListener();
    loadOpenTrades();
    loadTradeHistory();
  });
  
  // ✅ Close single trade
  function closeTrade(tradeId, reason = 'Manual Close') {
    const uid = currentUser.uid;
    const closeBtn = document.querySelector(`button.close-btn-small[onclick="closeTrade('${tradeId}')"]`);
    if (closeBtn) {
      closeBtn.disabled = true;
      closeBtn.style.backgroundColor = 'grey';
      closeBtn.style.cursor = 'not-allowed';
    }
  
    db.ref(`users/${uid}/open-trades/${tradeId}`).once('value').then(async tradeSnap => {
      const trade = tradeSnap.val();
  
      const priceSnap = await db.ref('syntheticIndex/price/').once('value');
      const currentPrice = priceSnap.val();
  
      let profit = 0;
      if (trade.type === 'buy') {
        profit = (currentPrice - trade.entry) * trade.volume;
      } else {
        profit = (trade.entry - currentPrice) * trade.volume;
      }
  
      profit = parseFloat(profit.toFixed(2));
  
      const closedTrade = {
        ...trade,
        current: currentPrice,
        profit,
        reason
      };
  
      await db.ref(`users/${uid}/past-trades/${tradeId}`).set(closedTrade);
      await db.ref(`users/${uid}/open-trades/${tradeId}`).remove();
  
      loadOpenTrades();
      loadTradeHistory();
    });
  }
  
  
  // ✅ Close all trades
  function closeAllTrades() {
    const uid = currentUser.uid;
    db.ref(`users/${uid}/open-trades`).once('value').then(async snapshot => {
      const priceSnap = await db.ref('syntheticIndex/price/').once('value');
      const currentPrice = priceSnap.val();
  
      const updates = {};
      snapshot.forEach(tradeSnap => {
        const trade = tradeSnap.val();
        const id = tradeSnap.key;
  
        let profit = 0;
        if (trade.type === 'buy') {
          profit = (currentPrice - trade.entry) * trade.volume;
        } else {
          profit = (trade.entry - currentPrice) * trade.volume;
        }
  
        profit = parseFloat(profit.toFixed(2));
  
        updates[`users/${uid}/past-trades/${id}`] = {
          ...trade,
          current: currentPrice,
          profit,
          reason: "Manual Close"
        };
        updates[`users/${uid}/open-trades/${id}`] = null;
      });
  
      db.ref().update(updates).then(() => {
        loadOpenTrades();
        loadTradeHistory();
      });
    });
  }
  
  
  // ✅ Modify trade TP/SL with validation
  function modifyTrade(tradeId) {
    const uid = currentUser.uid;
    const tp = parseFloat(document.getElementById(`tp-${tradeId}`).value);
    const sl = parseFloat(document.getElementById(`sl-${tradeId}`).value);
    const type = document.querySelector(`#current-${tradeId}`).parentElement.children[2].innerText.toLowerCase();
    const current = parseFloat(document.getElementById(`current-${tradeId}`).innerText);
  
    if (type === 'buy') {
      if ((tp >= current || tp === 0) && (sl <= current || sl === 0)) {
        db.ref(`users/${uid}/open-trades/${tradeId}`).update({ tp, sl });
      } else {
        alert("Invalid TP/SL for Buy. TP must be >= current or 0, SL <= current or 0.");
      }
    } else {
      if ((tp <= current || tp === 0) && (sl >= current || sl === 0)) {
        db.ref(`users/${uid}/open-trades/${tradeId}`).update({ tp, sl });
      } else {
        alert("Invalid TP/SL for Sell. TP must be <= current or 0, SL >= current or 0.");
      }
    }
  }
  
  // ✅ Load open trades
  function loadOpenTrades() {
    const uid = currentUser.uid;
    db.ref(`users/${uid}/open-trades`).once('value').then(snapshot => {
      const container = document.getElementById('openTrades');
      container.innerHTML = '';
      snapshot.forEach(child => {
        const trade = child.val();
  
        let profit = 0;
        if (trade.type === 'buy') {
          profit = (trade.current - trade.entry) * trade.volume;
        } else {
          profit = (trade.entry - trade.current) * trade.volume;
        }
  
        profit = parseFloat(profit.toFixed(2));
        const profitLossColor = profit < 0 ? 'red' : 'green';
  
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${trade.symbol}</td>
          <td>${trade.time}</td>
          <td>${trade.type}</td>
          <td>${trade.volume}</td>
          <td id="entry-${child.key}">${trade.entry}</td>
          <td><input type="number" id="tp-${child.key}" class="tp1" value="${trade.tp}" /></td>
          <td><input type="number" id="sl-${child.key}" class="tp1" value="${trade.sl}" /></td>
          <td id="current-${child.key}">${trade.current}</td>
          <td id="profit-${child.key}" style="color:${profitLossColor}">${profit}</td>
          <td><button class="modify-btn" onclick="modifyTrade('${child.key}')">Modify</button></td>
          <td><button class="close-btn-small" onclick="closeTrade('${child.key}')">X</button></td>
        `;
        container.appendChild(row);
      });
    });
  }
  
  // ✅ Load past trades
  function loadTradeHistory() {
    const uid = currentUser.uid;
    db.ref(`users/${uid}/past-trades`).on('value', snapshot => {
      const container = document.getElementById('tradeHistory');
      container.innerHTML = '';
      snapshot.forEach(child => {
        const trade = child.val();
        const profitLossColor = trade.profit < 0 ? 'red' : 'green';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${trade.symbol}</td>
          <td>${trade.time}</td>
          <td>${trade.type}</td>
          <td>${trade.volume}</td>
          <td>${trade.entry}</td>
          <td>${trade.current}</td>
          <td>${trade.tp}</td>
          <td>${trade.sl}</td>
          <td style="color:${profitLossColor}">${trade.profit}</td>
          <td>${trade.reason || ''}</td>
        `;
  
        container.appendChild(row);
      });
    });
  }
  
  
  