

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onChildAdded, onValue, off } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIRVXFCPBpepPUEZz9aAbF-oVICVxTsec",
  authDomain: "mt-trading-signup-and-log-in.firebaseapp.com",
  databaseURL: "https://mt-trading-signup-and-log-in-default-rtdb.firebaseio.com",
  projectId: "mt-trading-signup-and-log-in",
  storageBucket: "mt-trading-signup-and-log-in.appspot.com",
  messagingSenderId: "101302422584",
  appId: "1:101302422584:web:07d472b05e81a6930beacd"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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


let currentTimeframe = localStorage.getItem("tmfx-timeframe") || "1m";
const timeframeSelect = document.getElementById("timeframe");
timeframeSelect.value = currentTimeframe;

let refCandles = null;
let refLive = null;

function loadCandles(timeframe) {
  candleSeries.setData([]);
  if (refCandles) off(refCandles);
  if (refLive) off(refLive);

  const refPath = `syntheticIndex/candles/${timeframe}`;
  const liveRefPath = `syntheticIndex/currentCandle/${timeframe}`;
  refCandles = ref(db, refPath);
  refLive = ref(db, liveRefPath);

  // Load full historical data
  onChildAdded(refCandles, (snap) => {
    const data = snap.val();
    if (data && data.time && data.open !== undefined) {
      candleSeries.update(data);
    }
  });

  // Live updating candle
  onValue(refLive, (snap) => {
    const data = snap.val();
    if (data && data.time && data.close !== undefined) {
      candleSeries.update(data);
    }
  });
}

timeframeSelect.addEventListener("change", (e) => {
  currentTimeframe = e.target.value;
  localStorage.setItem("tmfx-timeframe", currentTimeframe);
  loadCandles(currentTimeframe);
});

loadCandles(currentTimeframe);


// Create Fullscreen Button
const fullscreenBtn = document.createElement("button");
fullscreenBtn.id = "fullscreenBtn";
fullscreenBtn.innerText = "Fullscreen";
document.getElementById("wholechart").appendChild(fullscreenBtn);

let isFullscreen = false;

fullscreenBtn.addEventListener("click", () => {
const container = document.getElementById("wholechart");

if (!isFullscreen) {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  }
  fullscreenBtn.innerText = "Exit Fullscreen";
} else {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
  fullscreenBtn.innerText = "Fullscreen";
}

isFullscreen = !isFullscreen;
});

// Resize chart when fullscreen or window size changes
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



