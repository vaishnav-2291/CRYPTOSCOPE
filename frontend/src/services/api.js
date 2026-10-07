import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// Request Interceptor: Attach Bearer JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          if (res.data?.accessToken) {
            localStorage.setItem("token", res.data.accessToken);
            if (res.data.refreshToken) {
              localStorage.setItem("refreshToken", res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// API Service Methods
// =============================================================================

export const scanWallet = async (address) => {
  const res = await api.get(`/wallet/${encodeURIComponent(address.trim())}`);
  return res.data;
};

export const batchScanWallets = async (addresses) => {
  const res = await api.post("/wallet/batch-scan", { addresses });
  return res.data;
};

export const getWalletTransactions = async (address, afterTxid = null) => {
  const url = afterTxid
    ? `/wallet/${encodeURIComponent(address.trim())}/transactions?after=${afterTxid}`
    : `/wallet/${encodeURIComponent(address.trim())}/transactions`;
  const res = await api.get(url);
  return res.data;
};

export const getWalletGraph = async (address) => {
  const res = await api.get(`/wallet/${encodeURIComponent(address.trim())}/graph`);
  return res.data;
};

export const getWalletTrend = async (address) => {
  const res = await api.get(`/wallet/${encodeURIComponent(address.trim())}/trend`);
  return res.data;
};

export const getPublicReport = async (identifier) => {
  const res = await api.get(`/wallet/report/${encodeURIComponent(identifier)}`);
  return res.data;
};

export const getDashboardStats = async () => {
  const res = await api.get("/wallet/dashboard/stats");
  return res.data;
};

export const getScanHistory = async () => {
  const res = await api.get("/wallet/history/all");
  return res.data;
};

export const getUserActivities = async () => {
  const res = await api.get("/wallet/activities");
  return res.data;
};

export const getSecurityAlerts = async () => {
  const res = await api.get("/wallet/alerts");
  return res.data;
};

export const simulateSecurityAlert = async () => {
  const res = await api.post("/wallet/alerts/simulate");
  return res.data;
};

export const getWatchlist = async () => {
  const res = await api.get("/wallet/watchlist");
  return res.data;
};

export const addToWatchlist = async (address, label) => {
  const res = await api.post("/wallet/watchlist", { address, label });
  return res.data;
};

export const removeFromWatchlist = async (address) => {
  const res = await api.delete(`/wallet/watchlist/${encodeURIComponent(address.trim())}`);
  return res.data;
};

export const rescanWatchlist = async () => {
  const res = await api.post("/wallet/watchlist/rescan");
  return res.data;
};

const TRACKED_COINS_META = [
  { id: "bitcoin", symbol: "BTC", binancePair: "BTCUSDT", gatePair: "BTC_USDT", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", binancePair: "ETHUSDT", gatePair: "ETH_USDT", name: "Ethereum" },
  { id: "solana", symbol: "SOL", binancePair: "SOLUSDT", gatePair: "SOL_USDT", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", binancePair: "BNBUSDT", gatePair: "BNB_USDT", name: "BNB" },
  { id: "ripple", symbol: "XRP", binancePair: "XRPUSDT", gatePair: "XRP_USDT", name: "XRP" },
  { id: "cardano", symbol: "ADA", binancePair: "ADAUSDT", gatePair: "ADA_USDT", name: "Cardano" },
];

function buildSparkline(currentPrice, priceChangePercent, high24h, low24h) {
  const basePrice = currentPrice / (1 + (priceChangePercent || 0) / 100);
  const low = low24h || currentPrice * 0.98;
  const high = high24h || currentPrice * 1.02;
  return [
    Number((basePrice * 0.98).toFixed(2)),
    Number((basePrice * 0.99).toFixed(2)),
    Number((low * 0.995).toFixed(2)),
    Number((basePrice * 1.005).toFixed(2)),
    Number((high * 0.995).toFixed(2)),
    Number((currentPrice * 0.998).toFixed(2)),
    currentPrice,
  ];
}

/**
 * Fetch genuine real-time live market rates directly from public exchanges (Client failover)
 */
async function fetchDirectLiveMarketFallback() {
  // Strategy A: Binance.US public ticker (CORS allowed, real live data)
  try {
    const symbolsParam = JSON.stringify(TRACKED_COINS_META.map((c) => c.binancePair));
    const res = await fetch(`https://api.binance.us/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const tickerMap = new Map();
        data.forEach((t) => tickerMap.set(t.symbol, t));
        const formatted = {};
        TRACKED_COINS_META.forEach((coin) => {
          const tick = tickerMap.get(coin.binancePair);
          if (tick) {
            const currentPrice = Number(parseFloat(tick.lastPrice).toFixed(coin.symbol === "XRP" || coin.symbol === "ADA" ? 4 : 2));
            const priceChangePercent = Number(parseFloat(tick.priceChangePercent).toFixed(2));
            const high24h = Number(parseFloat(tick.highPrice).toFixed(2));
            const low24h = Number(parseFloat(tick.lowPrice).toFixed(2));
            const volume24h = Number(parseFloat(tick.quoteVolume).toFixed(0));

            formatted[coin.id] = {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              usd: currentPrice,
              usd_24h_change: priceChangePercent,
              usd_market_cap: null,
              market_cap_status: "UNAVAILABLE_BINANCE",
              usd_24h_vol: volume24h,
              high_24h: high24h,
              low_24h: low24h,
              sparkline_in_7d: { price: buildSparkline(currentPrice, priceChangePercent, high24h, low24h) },
              source: "Binance.US Live Exchange API",
              status: "LIVE",
              lastUpdated: new Date().toISOString(),
            };
          }
        });
        if (Object.keys(formatted).length === TRACKED_COINS_META.length) {
          return { success: true, data: formatted, source: "Binance.US Live Exchange API", status: "LIVE", lastUpdated: new Date().toISOString() };
        }
      }
    }
  } catch {
    // continue to next provider
  }

  // Strategy B: Gate.io public spot tickers (CORS allowed, 0 geoblocking, real live data)
  try {
    const res = await fetch("https://api.gateio.ws/api/v4/spot/tickers", {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const tickerMap = new Map(data.map((t) => [t.currency_pair, t]));
        const formatted = {};
        TRACKED_COINS_META.forEach((coin) => {
          const tick = tickerMap.get(coin.gatePair);
          if (tick) {
            const currentPrice = Number(parseFloat(tick.last).toFixed(coin.symbol === "XRP" || coin.symbol === "ADA" ? 4 : 2));
            const priceChangePercent = Number(parseFloat(tick.change_percentage).toFixed(2));
            const high24h = Number(parseFloat(tick.high_24h).toFixed(2));
            const low24h = Number(parseFloat(tick.low_24h).toFixed(2));
            const volume24h = Number(parseFloat(tick.quote_volume).toFixed(0));

            formatted[coin.id] = {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              usd: currentPrice,
              usd_24h_change: priceChangePercent,
              usd_market_cap: null,
              market_cap_status: "UNAVAILABLE_GATEIO",
              usd_24h_vol: volume24h,
              high_24h: high24h,
              low_24h: low24h,
              sparkline_in_7d: { price: buildSparkline(currentPrice, priceChangePercent, high24h, low24h) },
              source: "Gate.io Live Exchange API",
              status: "LIVE",
              lastUpdated: new Date().toISOString(),
            };
          }
        });
        if (Object.keys(formatted).length === TRACKED_COINS_META.length) {
          return { success: true, data: formatted, source: "Gate.io Live Exchange API", status: "LIVE", lastUpdated: new Date().toISOString() };
        }
      }
    }
  } catch {
    // continue to next provider
  }

  // Strategy C: Binance Global public 24hr ticker (CORS allowed, non-US regions, real live data)
  try {
    const symbolsParam = JSON.stringify(TRACKED_COINS_META.map((c) => c.binancePair));
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const tickerMap = new Map();
        data.forEach((t) => tickerMap.set(t.symbol, t));
        const formatted = {};
        TRACKED_COINS_META.forEach((coin) => {
          const tick = tickerMap.get(coin.binancePair);
          if (tick) {
            const currentPrice = Number(parseFloat(tick.lastPrice).toFixed(coin.symbol === "XRP" || coin.symbol === "ADA" ? 4 : 2));
            const priceChangePercent = Number(parseFloat(tick.priceChangePercent).toFixed(2));
            const high24h = Number(parseFloat(tick.highPrice).toFixed(2));
            const low24h = Number(parseFloat(tick.lowPrice).toFixed(2));
            const volume24h = Number(parseFloat(tick.quoteVolume).toFixed(0));

            formatted[coin.id] = {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              usd: currentPrice,
              usd_24h_change: priceChangePercent,
              usd_market_cap: null,
              market_cap_status: "UNAVAILABLE_BINANCE",
              usd_24h_vol: volume24h,
              high_24h: high24h,
              low_24h: low24h,
              sparkline_in_7d: { price: buildSparkline(currentPrice, priceChangePercent, high24h, low24h) },
              source: "Binance Live Public API",
              status: "LIVE",
              lastUpdated: new Date().toISOString(),
            };
          }
        });
        if (Object.keys(formatted).length === TRACKED_COINS_META.length) {
          return { success: true, data: formatted, source: "Binance Live Public API", status: "LIVE", lastUpdated: new Date().toISOString() };
        }
      }
    }
  } catch {
    // exhausted
  }

  return null;
}

export const getMarketPrices = async (options = {}) => {
  const timeoutMs = options.timeout || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Primary: CryptoLens Production Backend (/api/crypto/market)
    const res = await api.get("/crypto/market", { signal: controller.signal });
    clearTimeout(timer);
    if (res.data?.success && res.data?.data) {
      return res.data;
    }
  } catch (backendErr) {
    clearTimeout(timer);
    console.warn("[getMarketPrices] Backend endpoint slow or unavailable, checking direct exchange failover:", backendErr.message);
  }

  // 2. Client fallback directly to genuine public live exchange feeds
  const directData = await fetchDirectLiveMarketFallback();
  if (directData?.data) {
    return directData;
  }

  throw new Error("Live market data feeds are temporarily unreachable. Retrying on next cycle.");
};

export const getMempoolTelemetry = async () => {
  try {
    let [feesRes, tipRes] = await Promise.all([
      fetch("https://mempool.space/api/v1/fees/recommended", { signal: AbortSignal.timeout(6000) })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("https://mempool.space/api/blocks/tip/height", { signal: AbortSignal.timeout(6000) })
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null),
    ]);

    // Fallback to Blockstream if mempool.space is rate-limited or unreachable
    if (!feesRes) {
      feesRes = await fetch("https://blockstream.info/api/fee-estimates", { signal: AbortSignal.timeout(6000) })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => (data ? { fastestFee: Math.round(data["1"] || data["2"] || data["6"] || 1) } : null))
        .catch(() => null);
    }
    if (!tipRes) {
      tipRes = await fetch("https://blockstream.info/api/blocks/tip/height", { signal: AbortSignal.timeout(6000) })
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null);
    }

    return {
      recommendedFee: feesRes?.fastestFee || feesRes?.halfHourFee || null,
      blockHeight: tipRes ? parseInt(tipRes.trim(), 10) : null,
    };
  } catch {
    return { recommendedFee: null, blockHeight: null };
  }
};

export const getCryptoNews = async (options = {}) => {
  const timeoutMs = options.timeout || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await api.get("/crypto/news", { signal: controller.signal });
    clearTimeout(timer);
    return res.data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

export const getAdminStats = async () => {
  const res = await api.get("/admin/stats");
  return res.data;
};

export const getAdminEntities = async () => {
  const res = await api.get("/admin/entities");
  return res.data;
};

export const getAdminScans = async () => {
  const res = await api.get("/admin/scans");
  return res.data;
};

export const getAdminActivities = async () => {
  const res = await api.get("/admin/activities");
  return res.data;
};

/**
 * Connect to live Real-time SSE Stream
 */
export const subscribeToRealtimeStream = (onMessage) => {
  const token = localStorage.getItem("token");
  const url = token ? `${API_BASE}/realtime/events?token=${token}` : `${API_BASE}/realtime/events`;

  const eventSource = new EventSource(url);

  eventSource.addEventListener("connected", (e) => {
    onMessage({ type: "connected", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("scan_completed", (e) => {
    onMessage({ type: "scan_completed", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("watchlist_updated", (e) => {
    onMessage({ type: "watchlist_updated", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("alert_triggered", (e) => {
    onMessage({ type: "alert_triggered", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("market_update", (e) => {
    onMessage({ type: "market_update", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("news_update", (e) => {
    onMessage({ type: "news_update", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("activity_logged", (e) => {
    onMessage({ type: "activity_logged", data: JSON.parse(e.data) });
  });

  eventSource.addEventListener("password_changed", (e) => {
    onMessage({ type: "password_changed", data: JSON.parse(e.data) });
  });

  eventSource.onerror = (err) => {
    onMessage({ type: "error", error: err });
  };

  return () => {
    eventSource.close();
  };
};

export default api;
