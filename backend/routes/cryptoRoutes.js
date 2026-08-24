const express = require("express");
const router = express.Router();
const marketService = require("../services/marketService");
const newsService = require("../services/newsService");

// =============================================================================
// GET LIVE CRYPTO MARKET RATES (From Genuine Binance / CoinGecko Providers)
// =============================================================================
router.get("/market", async (req, res) => {
    try {
        const result = await marketService.getMarketRates();
        res.json({
            success: true,
            data: result.data,
            source: result.source,
            status: result.status,
            lastUpdated: result.lastUpdated,
        });
    } catch (err) {
        res.status(503).json({
            success: false,
            message: err.message || "Failed to fetch live cryptocurrency market rates.",
            status: "PROVIDER_UNAVAILABLE",
        });
    }
});

// =============================================================================
// GET GENUINE CRYPTO CURRENT AFFAIRS NEWS (From Reputable RSS / GNews)
// =============================================================================
router.get("/news", async (req, res) => {
    try {
        const category = req.query.category || null;
        const articles = await newsService.getRecentNews(category);

        res.json({
            success: true,
            count: articles.length,
            articles,
            source: "Genuine Crypto News Network",
            lastUpdated: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Failed to retrieve cryptocurrency news.",
            articles: [],
        });
    }
});

module.exports = router;