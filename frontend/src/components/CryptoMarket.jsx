import React, { useEffect, useState } from "react";
import { getMarketPrices, subscribeToRealtimeStream } from "../services/api";
import { formatUsd } from "../utils/constants";
import { TrendingUp, TrendingDown, Clock, Activity, RefreshCw } from "lucide-react";
import CryptoNews from "./CryptoNews";

function CryptoMarket() {
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [source, setSource] = useState("Binance Live Public API");
  const [isLive, setIsLive] = useState(true);

  const fetchMarket = async () => {
    try {
      setLoading(true);
      const res = await getMarketPrices();
      if (res?.success && res.data) {
        setMarket(res.data);
        if (res.source) setSource(res.source);
        setIsLive(res.status === "LIVE");
        setLastUpdated(new Date(res.lastUpdated || Date.now()).toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();

    // SSE Realtime Subscription
    const unsubscribe = subscribeToRealtimeStream((event) => {
      if (event.type === "market_update" && event.data?.data) {
        setMarket(event.data.data);
        if (event.data.source) setSource(event.data.source);
        setIsLive(event.data.status === "LIVE");
        setLastUpdated(new Date(event.data.lastUpdated || Date.now()).toLocaleTimeString());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!market) {
    return (
      <div className="mt-12 text-center text-cyan-400 font-mono text-xs animate-pulse">
        Connecting to live cryptocurrency market feeds...
      </div>
    );
  }

  const coins = [
    { name: "Bitcoin", symbol: "BTC", icon: "₿", data: market.bitcoin },
    { name: "Ethereum", symbol: "ETH", icon: "Ξ", data: market.ethereum },
    { name: "Solana", symbol: "SOL", icon: "◎", data: market.solana },
  ];

  return (
    <>
      <div className="mt-16 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-heading text-white">
                📈 Live Crypto Markets
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {isLive ? "● LIVE FEED" : "CACHED"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quotes aggregated from {source}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs font-mono">
              Updated: <strong className="text-white">{lastUpdated}</strong>
            </span>
            <button
              onClick={fetchMarket}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {coins.map((coin) => {
            if (!coin.data) return null;
            const isPos = coin.data.usd_24h_change >= 0;

            return (
              <div
                key={coin.symbol}
                className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 space-y-4 relative group"
              >
                <span className="hud-bracket-tl" />
                <span className="hud-bracket-br" />

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl">{coin.icon}</span>
                    <h3 className="text-lg font-bold font-heading text-white mt-1">
                      {coin.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">{coin.symbol}</p>
                  </div>

                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      isPos
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isPos ? "+" : ""}{coin.data.usd_24h_change}%</span>
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-mono block">Current Price</span>
                  <h4 className="text-2xl font-extrabold font-mono text-cyan-300">
                    {formatUsd(coin.data.usd)}
                  </h4>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">24h High</span>
                    <span className="text-white font-semibold">${coin.data.high_24h?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">24h Low</span>
                    <span className="text-white font-semibold">${coin.data.low_24h?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CryptoNews />
    </>
  );
}

export default CryptoMarket;