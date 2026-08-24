const express = require("express");
const router = express.Router();
const axios = require("axios");
const cacheService = require("../services/cacheService");

/**
 * Fallback static market dataset if CoinGecko is rate-limited
 */
const FALLBACK_MARKET = {
    bitcoin: {
        usd: 96420.5,
        usd_24h_change: 2.85,
        usd_market_cap: 1890000000000,
        usd_24h_vol: 42100000000,
        sparkline_in_7d: {
            price: [92400, 93100, 94200, 93800, 95100, 95900, 96420],
        },
    },
    ethereum: {
        usd: 2780.25,
        usd_24h_change: -0.92,
        usd_market_cap: 334000000000,
        usd_24h_vol: 18500000000,
        sparkline_in_7d: {
            price: [2720, 2750, 2790, 2810, 2770, 2765, 2780],
        },
    },
    solana: {
        usd: 195.4,
        usd_24h_change: 4.15,
        usd_market_cap: 91000000000,
        usd_24h_vol: 6800000000,
        sparkline_in_7d: {
            price: [182, 185, 189, 187, 191, 193, 195.4],
        },
    },
};

/**
 * Fallback crypto news feed
 */
const FALLBACK_NEWS = [
    {
        title: "Bitcoin Network Hashrate Reaches New All-Time High Amid Institutional Custody Expansion",
        description: "Global Bitcoin mining computing power achieved historic milestones this week as institutional adoption deepens across regulated treasury desks.",
        url: "https://bitcoinmagazine.com",
        source: { name: "Bitcoin Magazine" },
        publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
        title: "Global Financial Regulators Unveil Coordinated On-Chain Risk Management Framework",
        description: "New regulatory compliance standards emphasize automated transaction flow tracing, deterministic heuristics, and wallet risk categorization.",
        url: "https://coindesk.com",
        source: { name: "CoinDesk" },
        publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
        title: "On-Chain Intelligence Flags Major Whale Liquidity Rebalancing Across Top Cold Vaults",
        description: "Blockchain monitoring telemetry detected large multi-signature treasury reorganizations totaling over 12,000 BTC.",
        url: "https://cointelegraph.com",
        source: { name: "CoinTelegraph" },
        publishedAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    },
];

// =============================================================================
// LIVE CRYPTO MARKET (Cached 60s)
// =============================================================================
router.get("/market", async (req, res) => {
    const cacheKey = "crypto_market_data";
    const cached = cacheService.get(cacheKey);

    if (cached) {
        return res.json({ success: true, data: cached, source: "cache" });
    }

    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            {
                params: {
                    vs_currency: "usd",
                    ids: "bitcoin,ethereum,solana,binancecoin,ripple",
                    order: "market_cap_desc",
                    per_page: 5,
                    page: 1,
                    sparkline: true,
                    price_change_percentage: "24h,7d",
                },
                timeout: 6000,
            }
        );

        // Format into keyed object
        const formatted = {};
        response.data.forEach((coin) => {
            formatted[coin.id] = {
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                usd: coin.current_price,
                usd_24h_change: coin.price_change_percentage_24h,
                usd_market_cap: coin.market_cap,
                usd_24h_vol: coin.total_volume,
                high_24h: coin.high_24h,
                low_24h: coin.low_24h,
                sparkline_in_7d: coin.sparkline_in_7d,
            };
        });

        cacheService.set(cacheKey, formatted, 60);
        res.json({ success: true, data: formatted, source: "live" });
    } catch (err) {
        // Return structured fallback on 429 or network timeout
        res.json({
            success: true,
            data: FALLBACK_MARKET,
            source: "fallback",
            note: "Using cached intelligence rates due to network provider quota.",
        });
    }
});

// =============================================================================
// LIVE CRYPTO NEWS (Cached 5m)
// =============================================================================
router.get("/news", async (req, res) => {
    const cacheKey = "crypto_news_articles";
    const cached = cacheService.get(cacheKey);

    if (cached) {
        return res.json({ success: true, articles: cached, source: "cache" });
    }

    if (!process.env.GNEWS_API_KEY) {
        return res.json({ success: true, articles: FALLBACK_NEWS, source: "fallback" });
    }

    try {
        const response = await axios.get("https://gnews.io/api/v4/search", {
            params: {
                q: "bitcoin OR cryptocurrency OR blockchain",
                lang: "en",
                max: 8,
                token: process.env.GNEWS_API_KEY,
            },
            timeout: 6000,
        });

        const articles = response.data.articles || FALLBACK_NEWS;
        cacheService.set(cacheKey, articles, 300);
        res.json({ success: true, articles, source: "live" });
    } catch (err) {
        res.json({ success: true, articles: FALLBACK_NEWS, source: "fallback" });
    }
});

module.exports = router;