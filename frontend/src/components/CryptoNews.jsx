import React, { useEffect, useState } from "react";
import { getCryptoNews, subscribeToRealtimeStream } from "../services/api";
import { Newspaper, ExternalLink, Clock, Radio, RefreshCw } from "lucide-react";

function CryptoNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await getCryptoNews();
      if (res?.success && res.articles) {
        setArticles(res.articles);
      }
    } catch (err) {
      console.error("Crypto News Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    // SSE Realtime Subscription for live incoming news articles
    const unsubscribe = subscribeToRealtimeStream((event) => {
      if (event.type === "news_update" && event.data?.articles) {
        setArticles((prev) => {
          const newFingerprints = new Set(event.data.articles.map((a) => a.fingerprint));
          const filteredPrev = prev.filter((p) => !newFingerprints.has(p.fingerprint));
          return [...event.data.articles, ...filteredPrev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getSeverityBadge = (severity) => {
    if (severity === "CRITICAL") return "bg-rose-500/20 text-rose-300 border-rose-500/50";
    if (severity === "HIGH") return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    if (severity === "MEDIUM") return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  };

  return (
    <div className="mt-16 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-heading text-white">
              📰 Live Crypto News & Security Dispatches
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              GENUINE RSS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated and deduplicated from CoinTelegraph, CoinDesk, Decrypt, and Bitcoin Magazine.
          </p>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-cyan-400 hover:text-white transition"
          title="Refresh News"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && articles.length === 0 ? (
        <div className="py-12 text-center text-cyan-400 font-mono text-xs animate-pulse">
          Ingesting latest cryptocurrency news articles...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.slice(0, 6).map((article) => (
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
                    {article.category || "General"}
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
                  <span>Read Article</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CryptoNews;