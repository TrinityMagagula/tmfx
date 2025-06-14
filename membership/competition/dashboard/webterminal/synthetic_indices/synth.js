const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // optional for environment variables

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let price = 500;
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

const retentionLimits = {
  '1m': 30 * 24 * 60 * 60,
  '5m': 60 * 24 * 60 * 60,
  '15m': 90 * 24 * 60 * 60,
  '30m': 120 * 24 * 60 * 60,
  '1h': 180 * 24 * 60 * 60,
  '4h': 240 * 24 * 60 * 60,
  '1d': 365 * 24 * 60 * 60,
  '1w': 365 * 24 * 60 * 60,
  '1mn': 365 * 24 * 60 * 60,
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
  };
}

async function cleanOldCandles(tf) {
  const cutoffTime = Math.floor(Date.now() / 1000) - retentionLimits[tf];

  await supabase
    .from(`candles_${tf}`)
    .delete()
    .lt('time', cutoffTime);
}

async function updateCandles(price, timestamp) {
  for (const [tf, tracker] of Object.entries(candleTrackers)) {
    const elapsed = timestamp - tracker.start;

    tracker.high = Math.max(tracker.high, price);
    tracker.low = Math.min(tracker.low, price);
    tracker.volume += 1;
    tracker.prices.push(price);

    const timeInSeconds = Math.floor(tracker.start / 1000);

    // Real-time candle for frontend
    await supabase
      .from(`current_candle_${tf}`)
      .upsert([{
        id: 1, // assume a fixed row
        time: timeInSeconds,
        open: parseFloat(tracker.open.toFixed(2)),
        high: parseFloat(tracker.high.toFixed(2)),
        low: parseFloat(tracker.low.toFixed(2)),
        close: parseFloat(price.toFixed(2)),
        volume: tracker.volume
      }]);

    if (elapsed >= timeframes[tf]) {
      const finalizedCandle = {
        time: timeInSeconds,
        open: parseFloat(tracker.open.toFixed(2)),
        high: parseFloat(tracker.high.toFixed(2)),
        low: parseFloat(tracker.low.toFixed(2)),
        close: parseFloat(price.toFixed(2)),
        volume: tracker.volume
      };

      await supabase
        .from(`candles_${tf}`)
        .insert([finalizedCandle]);

      await cleanOldCandles(tf);

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

setInterval(async () => {
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

  await supabase
    .from('synthetic_price')
    .upsert([{ id: 1, price: priceRounded, server_time: timestamp }]);

  await updateCandles(priceRounded, timestamp);

  console.log(`[${new Date().toISOString()}] Price: ${priceRounded}`);
}, 100);
