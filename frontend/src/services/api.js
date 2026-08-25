import axios from "axios";

const API_BASE = "/api";

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

export const getMarketPrices = async () => {
  const res = await api.get("/crypto/market");
  return res.data;
};

export const getCryptoNews = async () => {
  const res = await api.get("/crypto/news");
  return res.data;
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
