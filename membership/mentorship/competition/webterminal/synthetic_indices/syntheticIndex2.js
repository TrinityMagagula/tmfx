const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com"
});

const db = admin.database();

let price = 454.90;
const volatility = 1.2;
const meanReversionStrength = 0.02;
const momentumFactor = 0.1;
let priceHistoryWindow = [];
const maxHistory = 100;

const timeframes = {
  '1m': 60000,
  '5m': 5 * 60000,
  '15m': 15 * 60000,
  '30m': 30 * 60000,
  '1h': 60 * 60000,
  '4h': 4 * 60 * 60000,
  '1d': 24 * 60 * 60000,
  '1w': 7 * 24 * 60 * 60000,
  '1mn': 30 * 24 * 60 * 60000,
};

const candleTrackers = {};
for (const tf in timeframes) {
  candleTrackers[tf] = {
    prices: [],
    start: Date.now(),
    open: price,
    high: price,
    low: price,
    volume: 0,
    ref: db.ref(`syntheticIndex/candles/${tf}`),
    currentRef: db.ref(`syntheticIndex/currentCandle/${tf}`)
  };
}

function updateCandles(price, timestamp) {
  for (const [tf, tracker] of Object.entries(candleTrackers)) {
    const elapsed = timestamp - tracker.start;

    tracker.high = Math.max(tracker.high, price);
    tracker.low = Math.min(tracker.low, price);
    tracker.volume += 1;
    tracker.prices.push(price);

    const timeInSeconds = Math.floor(tracker.start / 1000);

    // Real-time candle for front-end updates
    tracker.currentRef.set({
      time: timeInSeconds,
      open: parseFloat(tracker.open.toFixed(2)),
      high: parseFloat(tracker.high.toFixed(2)),
      low: parseFloat(tracker.low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: tracker.volume,
    });

    if (elapsed >= timeframes[tf]) {
      const finalizedCandle = {
        time: timeInSeconds,
        open: parseFloat(tracker.open.toFixed(2)),
        high: parseFloat(tracker.high.toFixed(2)),
        low: parseFloat(tracker.low.toFixed(2)),
        close: parseFloat(price.toFixed(2)),
        volume: tracker.volume
      };

      tracker.ref.push(finalizedCandle);

      // Reset for next candle
      tracker.prices = [];
      tracker.volume = 0;
      tracker.open = price;
      tracker.high = price;
      tracker.low = price;
      tracker.start = timestamp;
    }
  }
}

let lastPriceChange = 0;

setInterval(() => {
  priceHistoryWindow.push(price);
  if (priceHistoryWindow.length > maxHistory) priceHistoryWindow.shift();

  const meanPrice = priceHistoryWindow.reduce((a, b) => a + b) / priceHistoryWindow.length;
  const randomShock = (Math.random() * 2 - 1) * volatility;
  const directionBias = Math.random() < 0.005 ? (Math.random() * 10 - 5) : 0;

  const change =
    randomShock +
    meanReversionStrength * (meanPrice - price) +
    momentumFactor * lastPriceChange +
    directionBias;

  lastPriceChange = change;
  price += change;

  const priceRounded = parseFloat(price.toFixed(2));
  const timestamp = Date.now();

  db.ref("syntheticIndex/price").set(priceRounded);
  db.ref("syntheticIndex/serverTime").set(timestamp);

  db.ref("syntheticIndex/ticks").push({
    price: priceRounded,
    time: Math.floor(timestamp / 1000) // seconds for chart compatibility
  });

  db.ref("syntheticIndex/priceHistory").push({
    price: priceRounded,
    time: Math.floor(timestamp / 1000)
  });

  updateCandles(priceRounded, timestamp);

  console.log(`[${new Date().toISOString()}] Price: ${priceRounded}`);
}, 100);