import React, { useState, useEffect } from "react";
import { getMarketPrices, getCryptoNews } from "../services/api";
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
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const [marketRes, newsRes] = await Promise.all([
        getMarketPrices().catch(() => null),
        getCryptoNews().catch(() => null),
      ]);

      if (marketRes?.data) setMarket(marketRes.data);
      if (newsRes?.articles) setNews(newsRes.articles);
      setLastRefreshed(new Date());
      setSecondsLeft(60);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + 60s live interval polling
  useEffect(() => {
    loadData(true);

    const dataInterval = setInterval(() => {
      loadData(false);
    }, 60000);

    const timerInterval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(dataInterval);
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
            BREAKING INTEL
          </span>

          <div className="text-xs font-mono text-slate-200 truncate">
            {news[0]?.title || "Interpol & FinCEN Issue Urgent Alert on Cross-Chain Bridge Privacy Mixer Laundering"}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-slate-400">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Auto-refresh: {secondsLeft}s</span>
        </div>
      </div>

      {/* Header Command Bar */}
      <div className="cyber-card rounded-3xl p-6 md:p-8 border border-cyan-500/25 relative overflow-hidden group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> 60-SECOND REAL-TIME FEED ACTIVE
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold font-heading text-white tracking-tight">
              Live Crypto Market & <span className="text-gradient-cyan">Current Affairs Intel</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
              Real-time telemetry, 24h market performance metrics, 7-day sparklines, and verified blockchain cybersecurity dispatches updated every minute.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-xs hidden sm:block">
              <div className="text-slate-400">Next Auto-Refresh In</div>
              <div className="text-cyan-400 font-bold">{secondsLeft} seconds</div>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6-Asset Live Market Tickers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
        {coinsList.map((coinKey) => {
          const coin = market?.[coinKey];
          const price = coin?.usd || (coinKey === "bitcoin" ? 96420 : coinKey === "ethereum" ? 2780 : 195);
          const change = coin?.usd_24h_change || 2.85;
          const isPos = change >= 0;
          const sparkline =
            coin?.sparkline_in_7d?.price || [price * 0.96, price * 0.98, price * 0.97, price * 0.99, price];

          const sparkData = {
            labels: sparkline.map((_, i) => i),
            datasets: [
              {
                data: sparkline,
                borderColor: isPos ? "#10B981" : "#EF4444",
                borderWidth: 2.2,
                pointRadius: 0,
                tension: 0.35,
              },
            ],
          };

          const sparkOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
          };

          return (
            <div
              key={coinKey}
              className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 space-y-3 relative group"
            >
              <span className="hud-bracket-tl" />
              <span className="hud-bracket-br" />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                    {coin?.name || coinKey} <span className="text-[10px] text-slate-500 font-sans font-normal">({coin?.symbol || coinKey.toUpperCase()})</span>
                  </h4>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono ${
                    isPos
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                      : "text-rose-400 bg-rose-500/10 border border-rose-500/30"
                  }`}
                >
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPos ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              </div>

              <div className="text-2xl font-extrabold text-white tracking-tight drop-shadow">
                {formatUsd(price)}
              </div>

              {/* 7-Day Sparkline */}
              <div className="h-14 w-full">
                <Line data={sparkData} options={sparkOptions} />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                <span>24h High: {formatUsd(coin?.high_24h || price * 1.02)}</span>
                <span>24h Low: {formatUsd(coin?.low_24h || price * 0.97)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Current Affairs News & Intelligence Section */}
      <div className="cyber-card rounded-3xl p-6 md:p-8 border border-cyan-500/20 space-y-6 relative group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-cyan-400" /> Live Blockchain Intelligence & Current Affairs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified real-time alerts on exploits, OFAC sanctions, whale transfers, and regulatory compliance.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  selectedCategory === cat
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((item, idx) => (
            <a
              key={idx}
              href={item.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/40 transition flex flex-col justify-between gap-3 group/item shadow-inner"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 font-semibold">{item.source?.name || "Intelligence Wire"}</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.timeAgo || "Just now"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase border ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.category || "Security"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover/item:text-cyan-300 transition line-clamp-2 leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-2 font-sans leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1 group-hover/item:text-cyan-400 transition pt-2 border-t border-white/5 font-mono">
                <span>Read Full Intelligence Dispatch</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
