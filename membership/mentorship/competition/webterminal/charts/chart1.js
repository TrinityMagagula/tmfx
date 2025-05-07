
  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
  import { createChart } from "https://cdn.jsdelivr.net/npm/lightweight-charts@4.1.1/dist/lightweight-charts.esm.production.js";

  const supabase = createClient(
    "https://fepujhdzovzbygczdjxe.supabase.co", // 🔁 REPLACE
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHVqaGR6b3Z6YnlnY3pkanhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODE2MDUsImV4cCI6MjA2MTY1NzYwNX0.mVNDZaHTodnQQ3EGvUS3puaAfTKsiyRCSGldOo_wFmU"                     // 🔁 REPLACE
  );

  const chart = createChart(document.getElementById("chart"), {
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

  let currentTimeframe = localStorage.getItem("tmfx-timeframe") || "1m";
  const timeframeSelect = document.getElementById("timeframe");
  timeframeSelect.value = currentTimeframe;

  let liveChannel = null;

  async function loadCandles(timeframe) {
    candleSeries.setData([]);
    if (liveChannel) await supabase.removeChannel(liveChannel);

    // 🔁 Load historical candles
    const { data, error } = await supabase
      .from(`candles_${timeframe}`)
      .select("*")
      .order("time", { ascending: true });

    if (data) {
      candleSeries.setData(data.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })));
    }

    // 🔁 Listen to live updates on current_candle_<timeframe>
    liveChannel = supabase
      .channel(`realtime:current_candle_${timeframe}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: `current_candle_${timeframe}` },
        payload => {
          const d = payload.new;
          candleSeries.update({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          });
        }
      )
      .subscribe();
  }

  timeframeSelect.addEventListener("change", async (e) => {
    currentTimeframe = e.target.value;
    localStorage.setItem("tmfx-timeframe", currentTimeframe);
    await loadCandles(currentTimeframe);
  });

  await loadCandles(currentTimeframe);

  // Fullscreen button
  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.id = "fullscreenBtn";
  fullscreenBtn.innerText = "Fullscreen";
  document.getElementById("wholechart").appendChild(fullscreenBtn);

  let isFullscreen = false;
  fullscreenBtn.addEventListener("click", () => {
    const container = document.getElementById("wholechart");

    if (!isFullscreen) {
      container.requestFullscreen?.() || container.webkitRequestFullscreen?.() || container.msRequestFullscreen?.();
      fullscreenBtn.innerText = "Exit Fullscreen";
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.msExitFullscreen?.();
      fullscreenBtn.innerText = "Fullscreen";
    }
    isFullscreen = !isFullscreen;
  });

  function resizeChart() {
    chart.resize(
      document.getElementById("wholechart").clientWidth,
      document.getElementById("wholechart").clientHeight
    );
  }

  window.addEventListener("resize", resizeChart);
  document.addEventListener("fullscreenchange", resizeChart);
  document.addEventListener("webkitfullscreenchange", resizeChart);
  document.addEventListener("msfullscreenchange", resizeChart);

