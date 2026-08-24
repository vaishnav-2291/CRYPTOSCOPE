import React, { useState, useEffect } from "react";
import { getMarketPrices, getCryptoNews, subscribeToRealtimeStream } from "../services/api";
import { formatUsd } from "../utils/constants";
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  ExternalLink,
  RefreshCw,
  Radio,
  Clock,
  ShieldAlert,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const MarketPage = () => {
  const [market, setMarket] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [marketSource, setMarketSource] = useState("Binance Live Public API");
  const [marketStatus, setMarketStatus] = useState("LIVE");

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const [marketRes, newsRes] = await Promise.all([
        getMarketPrices().catch(() => null),
        getCryptoNews().catch(() => null),
      ]);

      if (marketRes?.data) {
        setMarket(marketRes.data);
        if (marketRes.source) setMarketSource(marketRes.source);
        if (marketRes.status) setMarketStatus(marketRes.status);
      }
      if (newsRes?.articles) setNews(newsRes.articles);
      setLastRefreshed(new Date());
      setSecondsLeft(30);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Subscribe to SSE stream for live market ticks and genuine crypto news
    const unsubscribe = subscribeToRealtimeStream((event) => {
      if (event.type === "connected") {
        setRealtimeActive(true);
      } else if (event.type === "market_update" && event.data?.data) {
        setMarket(event.data.data);
        if (event.data.source) setMarketSource(event.data.source);
        if (event.data.status) setMarketStatus(event.data.status);
        setLastRefreshed(new Date());
        setSecondsLeft(30);
      } else if (event.type === "news_update" && event.data?.articles) {
        setNews((prev) => {
          const newFingerprints = new Set(event.data.articles.map((a) => a.fingerprint));
          const filteredPrev = prev.filter((p) => !newFingerprints.has(p.fingerprint));
          return [...event.data.articles, ...filteredPrev];
        });
      } else if (event.type === "error") {
        setRealtimeActive(false);
      }
    });

    const timerInterval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timerInterval);
    };
  }, []);

  const categories = ["ALL", "Security & Exploits", "Regulatory & OFAC", "Whale Activity", "Market Trends"];

  const filteredNews = news.filter((item) => {
    if (selectedCategory === "ALL") return true;
    return item.category === selectedCategory || item.title.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const getSeverityBadge = (severity) => {
    if (severity === "CRITICAL") return "bg-rose-500/20 text-rose-300 border-rose-500/50";
    if (severity === "HIGH") return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    if (severity === "MEDIUM") return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  };

  const coinsList = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano"];

  return (
    <div className="space-y-8 animate-in fade-in select-none">
      {/* Breaking News Marquee Banner */}
      <div className="cyber-card rounded-2xl p-3.5 border border-cyan-500/30 flex items-center justify-between gap-4 overflow-hidden relative group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-br" />

        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-extrabold uppercase flex items-center gap-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <Radio className="w-3 h-3 animate-ping text-rose-400" />
            LIVE INTEL DISPATCH
          </span>

          <div className="marquee-container flex-1 overflow-hidden relative">
            <div className="marquee-content whitespace-nowrap text-xs font-mono text-cyan-300 flex items-center gap-8">
              {news.slice(0, 4).map((item, idx) => (
                <span key={item._id || item.id || idx} className="flex items-center gap-2">
                  <span className="text-white font-bold">{item.title}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-cyan-400 font-bold">{item.source?.name || "News"}</span>
                  <span className="text-slate-500">[{item.category}]</span>
                  <span className="text-slate-600">|</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${realtimeActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
          <span>{realtimeActive ? "SSE STREAM ONLINE" : "AUTO-SYNC"}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-white">
              Real-Time <span className="text-gradient-cyan">Crypto Intelligence & Markets</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {marketStatus === "LIVE" ? "100% GENUINE LIVE" : "STALE CACHED"}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real prices from {marketSource} and live RSS news feed with instant SSE push updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next Refresh: <strong className="text-white">{secondsLeft}s</strong></span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-white border border-white/10 transition shadow-inner"
            title="Force Live Update"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 6-Asset Live Cryptocurrency Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {coinsList.map((coinId) => {
          const coin = market ? market[coinId] : null;
          if (!coin) {
            return (
              <div key={coinId} className="cyber-card rounded-2xl p-6 border border-white/5 animate-pulse h-48 flex items-center justify-center font-mono text-xs text-slate-500">
                Fetching live quote for {coinId.toUpperCase()}...
              </div>
            );
          }

          const isPositive = coin.usd_24h_change >= 0;
          const sparklineData = coin.sparkline_in_7d?.price || [coin.usd, coin.usd, coin.usd];

          const chartData = {
            labels: sparklineData.map((_, i) => i),
            datasets: [
              {
                data: sparklineData,
                borderColor: isPositive ? "#34d399" : "#f87171",
                backgroundColor: isPositive ? "rgba(52, 211, 153, 0.08)" : "rgba(248, 113, 113, 0.08)",
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
              },
            ],
          };

          const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
          };

          return (
            <div
              key={coin.id}
              className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 space-y-4 relative group"
            >
              <span className="hud-bracket-tl" />
              <span className="hud-bracket-tr" />
              <span className="hud-bracket-bl" />
              <span className="hud-bracket-br" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-heading">{coin.name}</span>
                    <span className="text-xs font-mono text-slate-400 uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                      {coin.symbol}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {formatUsd(coin.usd)}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                    isPositive
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isPositive ? "+" : ""}{coin.usd_24h_change}%</span>
                </div>
              </div>

              {/* Sparkline Visual Curve */}
              <div className="h-14 w-full relative">
                <Line data={chartData} options={chartOptions} />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">24h High / Low</span>
                  <span className="text-slate-300 font-bold">
                    ${coin.high_24h?.toLocaleString()} / ${coin.low_24h?.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">24h Volume</span>
                  <span className="text-slate-300 font-bold">
                    ${(coin.usd_24h_vol / 1e9).toFixed(2)}B
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* News & Intelligence Section */}
      <div className="space-y-5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-heading text-white">Genuine Crypto Intelligence & News Feed</h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
                  selectedCategory === cat
                    ? "bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25"
                    : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Cards Grid */}
        {filteredNews.length === 0 ? (
          <div className="cyber-card rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
            No news articles found for selected filter category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map((article) => (
              <div
                key={article.fingerprint || article.id || article.url}
                className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between space-y-4 group relative"
              >
                <span className="hud-bracket-tl" />
                <span className="hud-bracket-br" />

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="text-cyan-400 font-bold">{article.source?.name || "Crypto Wire"}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(article.severity)}`}>
                      {article.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition font-heading leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 font-mono text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(article.publishedAt || Date.now()).toLocaleDateString()}</span>
                  </span>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 transition"
                  >
                    <span>Read Dispatch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;
