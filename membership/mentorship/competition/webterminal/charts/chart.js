const SUPABASE_URL = 'https://fepujhdzovzbygczdjxe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const chart = LightweightCharts.createChart(document.getElementById("chart"), {
    layout: {
      background: { color: "#0e0e0e" },
      textColor: "#ccc",
      fontFamily: 'Segoe UI',
    },
    grid: {
      vertLines: { color: "#1f1f1f" },
      horzLines: { color: "#1f1f1f" },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: "#2a2a2a",
    },
    priceScale: {
      borderColor: "#2a2a2a",
    },
    crosshair: {
      mode: 0,
      vertLine: { color: '#666', style: 1, width: 1 },
      horzLine: { color: '#666', style: 1, width: 1 },
    },
  });

  const candleSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderUpColor: "#26a69a",
    borderDownColor: "#ef5350",
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
  });

  const timeframeSelect = document.getElementById("timeframe");
  let currentTimeframe = localStorage.getItem("tmfx-timeframe") || "1m";
  timeframeSelect.value = currentTimeframe;

  let realtimeInterval = null;

  function isValidCandle(c) {
    if (!c) return false;
    const fields = ['time', 'open', 'high', 'low', 'close'];
    for (const f of fields) {
      if (c[f] === null || c[f] === undefined) return false;
      if (typeof c[f] !== 'number' || isNaN(c[f])) return false;
    }
    if (c.high < c.low) return false;
    if (c.open > c.high || c.open < c.low) return false;
    if (c.close > c.high || c.close < c.low) return false;
    return true;
  }

  function formatCandle(candle) {
    const time = Number(candle.time);
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);

    if (
      !Number.isInteger(time) ||
      [open, high, low, close].some(v => typeof v !== 'number' || isNaN(v))
    ) {
      console.warn("Invalid candle format:", candle);
      return null;
    }

    return { time, open, high, low, close };
  }

  function checkCandleSequence(candles) {
    const seenTimes = new Set();
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (seenTimes.has(c.time)) {
        console.warn(`❌ Duplicate time detected at index ${i}:`, c.time);
        return false;
      }
      if (i > 0 && c.time <= candles[i - 1].time) {
        console.warn(`❌ Non-increasing time at index ${i}:`, c.time);
        return false;
      }
      seenTimes.add(c.time);
    }
    return true;
  }

  async function loadCandles(timeframe) {
    candleSeries.setData([]);
    if (realtimeInterval) {
      clearInterval(realtimeInterval);
      realtimeInterval = null;
    }

    try {
      const { data, error } = await supabase
        .from(`candles_${timeframe}`)
        .select('time, open, high, low, close')
        .order('time', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn('No candle data received.');
        return;
      }

      const validCandles = data
        .map(formatCandle)
        .filter(c => c !== null && isValidCandle(c));

      // Deduplicate: Keep only last entry per timestamp
      const dedupedMap = new Map();
      for (const candle of validCandles) {
        dedupedMap.set(candle.time, candle);  // Overwrites duplicates
      }

      const candles = Array.from(dedupedMap.values()).sort((a, b) => a.time - b.time);

      if (candles.length === 0) {
        console.warn('No valid candles after filtering.');
        return;
      }

      const validSequence = checkCandleSequence(candles);
      if (!validSequence) {
        console.error('Candle time sequence error. Aborting chart render.');
        return;
      }

      candleSeries.setData(candles);
      await updateLiveCandle(timeframe);
      realtimeInterval = setInterval(() => updateLiveCandle(timeframe), 1000);
    } catch (err) {
      console.error('Failed to load candles:', err);
    }
  }

  async function updateLiveCandle(timeframe) {
    try {
      const { data, error } = await supabase
        .from(`current_candle_${timeframe}`)
        .select('time, open, high, low, close')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (!data) return;

      const liveCandle = formatCandle(data);
      if (!liveCandle || !isValidCandle(liveCandle)) {
        console.warn("Live candle rejected due to validation");
        return;
      }

      candleSeries.update(liveCandle);
    } catch (err) {
      console.error('Failed to update live candle:', err);
    }
  }

  timeframeSelect.addEventListener('change', (e) => {
    currentTimeframe = e.target.value;
    localStorage.setItem('tmfx-timeframe', currentTimeframe);
    loadCandles(currentTimeframe);
  });

  loadCandles(currentTimeframe);