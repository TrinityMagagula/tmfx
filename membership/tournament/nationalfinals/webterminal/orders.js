
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
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

// Supabase Setup
const { createClient } = supabase;
const supabaseClient = createClient(
    'https://fepujhdzovzbygczdjxe.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU'
);

// Get UID
function getCurrentUserUid() {
    return new Promise((resolve, reject) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            unsubscribe();
            if (user) resolve(user.uid);
            else reject(new Error('No user logged in'));
        });
    });
}

// Execute Trade
async function executeTrade() {
    try {
        const orderType = document.getElementById('orderType').value;
        const instrument = document.getElementById('instruments').value;
        const currentPrice = parseFloat(document.getElementById('price').textContent);
        const tpInput = document.getElementById('tp').value;
        const slInput = document.getElementById('sl').value;
        const lotSizeInput = document.getElementById('lot').value;
        const lotSize = parseFloat(lotSizeInput);
        const pendingPrice = orderType.includes('stop') || orderType.includes('limit') ?
            parseFloat(document.getElementById('pendingPrice').value) : null;

        const balance = parseFloat(document.getElementById('balance').textContent);
        const equity = parseFloat(document.getElementById('equity').textContent);
        const freeMargin = parseFloat(document.getElementById('freemargin').textContent.split(' ')[0]);

        // ✅ Validation for order type
        if (!orderType) {
            alert('Select order type');
            return;
        }

        if (!instrument) {
            alert('No instrument selected');
            return;
        }

        if (balance <= 0 || equity <= 0 || freeMargin <= 0) {
            alert('Not enough funds');
            return;
        }

        if (
            isNaN(lotSize) ||
            lotSize < 0.01 ||
            lotSize > 1.00 ||
            !/^\d+(\.\d{1,2})?$/.test(lotSizeInput)
        ) {
            alert('Invalid lot size. Must be between 0.01 and 1.00 with no more than 2 decimal places');
            return;
        }

        const volume = lotSize * 100;
        const orderMargin = volume * 100;

        if (orderMargin > freeMargin) {
            alert('Invalid order, not enough funds');
            return;
        }

        let entryPrice = currentPrice;

        const tp = parseFloat(tpInput);
        const sl = parseFloat(slInput);

        if (tp !== 0) {
            switch (orderType) {
                case 'buy':
                    if (tp <= currentPrice) {
                        alert('Invalid TP for buy');
                        return;
                    }
                    break;
                case 'sell':
                    if (tp >= currentPrice) {
                        alert('Invalid TP for sell');
                        return;
                    }
                    break;
                case 'buy_stop':
                case 'buy_limit':
                    if (tp <= pendingPrice) {
                        alert('Invalid TP for buy pending');
                        return;
                    }
                    break;
                case 'sell_stop':
                case 'sell_limit':
                    if (tp >= pendingPrice) {
                        alert('Invalid TP for sell pending');
                        return;
                    }
                    break;
            }
        }

        if (sl !== 0) {
            switch (orderType) {
                case 'buy':
                    if (sl >= currentPrice) {
                        alert('Invalid SL for buy');
                        return;
                    }
                    break;
                case 'sell':
                    if (sl <= currentPrice) {
                        alert('Invalid SL for sell');
                        return;
                    }
                    break;
                case 'buy_stop':
                case 'buy_limit':
                    if (sl >= pendingPrice) {
                        alert('Invalid SL for buy pending');
                        return;
                    }
                    break;
                case 'sell_stop':
                case 'sell_limit':
                    if (sl <= pendingPrice) {
                        alert('Invalid SL for sell pending');
                        return;
                    }
                    break;
            }
        }

        if (orderType.includes('stop') || orderType.includes('limit')) {
            if (!pendingPrice || isNaN(pendingPrice)) {
                alert('Invalid pending price');
                return;
            }
            if (orderType === 'buy_stop' && pendingPrice <= currentPrice) {
                alert('Buy stop must be above current price');
                return;
            }
            if (orderType === 'buy_limit' && pendingPrice >= currentPrice) {
                alert('Buy limit must be below current price');
                return;
            }
            if (orderType === 'sell_stop' && pendingPrice >= currentPrice) {
                alert('Sell stop must be below current price');
                return;
            }
            if (orderType === 'sell_limit' && pendingPrice <= currentPrice) {
                alert('Sell limit must be above current price');
                return;
            }
            entryPrice = pendingPrice;
        }

        const uid = await getCurrentUserUid();

        const tradeData = {
            id: uid,
            entry: entryPrice,
            symbol: instrument,
            type: orderType,
            volume: volume,
        };

        if (tp !== 0) tradeData.tp = tp;
        if (sl !== 0) tradeData.sl = sl;

        const pendingOrderTypes = ['buy_stop', 'sell_stop', 'buy_limit', 'sell_limit'];
        const tableName = pendingOrderTypes.includes(orderType) ? 'pending-tradesnf' : 'open-tradesnf';

        const { data, error } = await supabaseClient.from(tableName).insert([tradeData]);

        if (error) throw error;

        alert('Order executed successfully!');
    } catch (error) {
        console.error('Error executing trade:', error);
        alert('Error executing trade: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('executeBtn').addEventListener('click', executeTrade);

    document.getElementById('orderType').addEventListener('change', function () {
        const priceInputContainer = document.getElementById('priceInputContainer');
        priceInputContainer.style.display = (this.value.includes('stop') || this.value.includes('limit')) ? 'block' : 'none';
    });
});

