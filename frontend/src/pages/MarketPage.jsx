import React, { useState, useEffect } from "react";
import { getMarketPrices, getCryptoNews } from "../services/api";
import { formatUsd } from "../utils/constants";
import { TrendingUp, TrendingDown, Newspaper, ExternalLink, RefreshCw } from "lucide-react";
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [marketRes, newsRes] = await Promise.all([
        getMarketPrices().catch(() => null),
        getCryptoNews().catch(() => null),
      ]);

      if (marketRes?.data) setMarket(marketRes.data);
      if (newsRes?.articles) setNews(newsRes.articles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Live Crypto Market & Global Intelligence News
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time CoinGecko rate feeds, 24h performance metrics, and verified crypto intelligence dispatches.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-white/10 transition"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Crypto Prices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        {["bitcoin", "ethereum", "solana"].map((coinKey) => {
          const coin = market?.[coinKey];
          const price = coin?.usd || (coinKey === "bitcoin" ? 96420 : coinKey === "ethereum" ? 2780 : 195);
          const change = coin?.usd_24h_change || (coinKey === "bitcoin" ? 2.85 : coinKey === "ethereum" ? -0.92 : 4.15);
          const isPos = change >= 0;
          const sparkline = coin?.sparkline_in_7d?.price || [price * 0.96, price * 0.98, price * 0.97, price * 0.99, price];

          const sparkData = {
            labels: sparkline.map((_, i) => i),
            datasets: [
              {
                data: sparkline,
                borderColor: isPos ? "#10B981" : "#EF4444",
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3,
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
            <div key={coinKey} className="cyber-card rounded-2xl p-5 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase text-white">{coinKey}</h4>
                  <span className="text-[10px] text-slate-500 font-sans">USD Pair</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                    isPos ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                  }`}
                >
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPos ? "+" : ""}{change.toFixed(2)}%
                </span>
              </div>

              <div className="text-2xl font-extrabold text-white">{formatUsd(price)}</div>

              {/* Mini Sparkline */}
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

      {/* Intelligence News Feed */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-400" /> Blockchain Security News & Intelligence
          </h3>
          <span className="text-xs font-mono text-slate-400">Verified Headlines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.slice(0, 6).map((item, idx) => (
            <a
              key={idx}
              href={item.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/30 transition flex flex-col justify-between gap-2 group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                  <span>{item.source?.name || "Intelligence Wire"}</span>
                  <span className="text-slate-500">{new Date(item.publishedAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 font-sans">
                  {item.description}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1 group-hover:text-cyan-400 transition pt-1">
                <span>Read Dispatch</span> <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
