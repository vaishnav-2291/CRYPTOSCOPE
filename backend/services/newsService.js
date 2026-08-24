const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");
const CryptoNews = require("../models/newsModel");
const cacheService = require("./cacheService");
const realtimeService = require("./realtimeService");

function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Reputable Genuine Crypto RSS Feeds
 */
const RSS_FEEDS = [
    {
        name: "CoinTelegraph",
        url: "https://cointelegraph.com/rss",
        category: "General",
    },
    {
        name: "CoinDesk",
        url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
        category: "Market Trends",
    },
    {
        name: "Decrypt",
        url: "https://decrypt.co/feed",
        category: "Security & Exploits",
    },
    {
        name: "Bitcoin Magazine",
        url: "https://bitcoinmagazine.com/feed",
        category: "Market Trends",
    },
];

/**
 * Generate stable deterministic fingerprint for deduplication
 */
function createNewsFingerprint(title, url) {
    const raw = `${(title || "").trim().toLowerCase()}_${(url || "").trim().toLowerCase()}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Categorize article based on headline and description keywords
 */
function determineCategoryAndSeverity(title = "", description = "") {
    const combined = `${title} ${description}`.toLowerCase();

    if (combined.includes("sanction") || combined.includes("ofac") || combined.includes("sec") || combined.includes("fincen") || combined.includes("regulatory") || combined.includes("lawsuit") || combined.includes("mica")) {
        return {
            category: "Regulatory & OFAC",
            severity: combined.includes("sanction") || combined.includes("ofac") ? "CRITICAL" : "HIGH",
        };
    }

    if (combined.includes("hack") || combined.includes("exploit") || combined.includes("stolen") || combined.includes("vulnerability") || combined.includes("drain") || combined.includes("mixer") || combined.includes("ransomware") || combined.includes("phishing") || combined.includes("breach")) {
        return {
            category: "Security & Exploits",
            severity: combined.includes("hack") || combined.includes("ransomware") || combined.includes("drain") ? "CRITICAL" : "HIGH",
        };
    }

    if (combined.includes("whale") || combined.includes("dormant") || combined.includes("transfer") || combined.includes("moved") || combined.includes("billion") || combined.includes("million in btc")) {
        return {
            category: "Whale Activity",
            severity: "MEDIUM",
        };
    }

    if (combined.includes("etf") || combined.includes("all-time high") || combined.includes("rally") || combined.includes("surge") || combined.includes("plunge") || combined.includes("fed") || combined.includes("inflation") || combined.includes("market")) {
        return {
            category: "Market Trends",
            severity: "LOW",
        };
    }

    return {
        category: "General",
        severity: "MEDIUM",
    };
}

/**
 * Fast lightweight XML RSS Parser
 */
function parseRssXml(xmlText, sourceName) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];

        const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/i);
        const title = (titleMatch ? (titleMatch[1] || titleMatch[2]) : "").trim();

        const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/link>/i);
        const url = (linkMatch ? (linkMatch[1] || linkMatch[2]) : "").trim();

        const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/description>/i);
        let rawDesc = (descMatch ? (descMatch[1] || descMatch[2]) : "").trim();
        // Strip HTML tags from description
        const description = rawDesc.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").replace(/&#8217;/g, "'").substring(0, 300);

        const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);
        const pubDateStr = pubDateMatch ? pubDateMatch[1] : null;
        const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date();

        // Optional image / enclosure
        const mediaMatch = itemContent.match(/<media:content[^>]*url=["'](.*?)["']/i) || itemContent.match(/<enclosure[^>]*url=["'](.*?)["']/i);
        const imageUrl = mediaMatch ? mediaMatch[1] : null;

        if (title && url) {
            const { category, severity } = determineCategoryAndSeverity(title, description);
            items.push({
                fingerprint: createNewsFingerprint(title, url),
                title,
                description,
                url,
                source: { name: sourceName, url },
                category,
                severity,
                publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                imageUrl,
            });
        }
    }

    return items;
}

class NewsService {
    constructor() {
        this.client = axios.create({
            timeout: 5000,
            headers: {
                "User-Agent": "CryptoScope-AI-Intelligence/2.0 (Security Aggregator)",
                Accept: "application/rss+xml, application/xml, text/xml, */*",
            },
        });

        // Start background polling every 2 minutes
        this.pollInterval = null;
        this.startBackgroundPoller();
    }

    /**
     * Fetch latest genuine articles from all configured providers
     */
    async fetchLatestFromProviders() {
        const allArticles = [];

        // 1. If GNews API key provided, fetch from GNews
        if (process.env.GNEWS_API_KEY) {
            try {
                const gnewsRes = await axios.get("https://gnews.io/api/v4/search", {
                    params: {
                        q: "bitcoin OR crypto security OR blockchain",
                        lang: "en",
                        max: 10,
                        token: process.env.GNEWS_API_KEY,
                    },
                    timeout: 4000,
                });

                if (gnewsRes.data?.articles) {
                    gnewsRes.data.articles.forEach((item) => {
                        const { category, severity } = determineCategoryAndSeverity(item.title, item.description);
                        allArticles.push({
                            fingerprint: createNewsFingerprint(item.title, item.url),
                            title: item.title,
                            description: item.description || "",
                            url: item.url,
                            source: { name: item.source?.name || "GNews Live", url: item.url },
                            category,
                            severity,
                            publishedAt: new Date(item.publishedAt || Date.now()),
                            imageUrl: item.image || null,
                        });
                    });
                }
            } catch (err) {
                console.warn("[NewsService] GNews API error:", err.message);
            }
        }

        // 2. Fetch from reputable RSS feeds in parallel
        const rssPromises = RSS_FEEDS.map(async (feed) => {
            try {
                const res = await this.client.get(feed.url);
                const parsed = parseRssXml(res.data, feed.name);
                return parsed;
            } catch (err) {
                console.warn(`[NewsService] Failed to fetch RSS from ${feed.name}:`, err.message);
                return [];
            }
        });

        const rssResults = await Promise.all(rssPromises);
        rssResults.forEach((articles) => allArticles.push(...articles));

        // Deduplicate in-memory by fingerprint
        const uniqueMap = new Map();
        allArticles.forEach((art) => {
            if (!uniqueMap.has(art.fingerprint)) {
                uniqueMap.set(art.fingerprint, art);
            }
        });

        return Array.from(uniqueMap.values());
    }

    /**
     * Ingest, normalize, deduplicate, persist to MongoDB, and broadcast realtime events
     */
    async syncNews() {
        try {
            const rawArticles = await this.fetchLatestFromProviders();
            if (!rawArticles || rawArticles.length === 0) return [];

            let newlyInsertedCount = 0;
            const latestInserted = [];

            if (isDbConnected()) {
                for (const article of rawArticles) {
                    try {
                        const existing = await CryptoNews.findOne({ fingerprint: article.fingerprint });
                        if (!existing) {
                            const doc = new CryptoNews(article);
                            const saved = await doc.save();
                            newlyInsertedCount++;
                            latestInserted.push(saved);
                        }
                    } catch (dbErr) {
                        // Duplicate key or write collision
                    }
                }

                // If new articles arrived, emit realtime SSE broadcast
                if (newlyInsertedCount > 0) {
                    console.log(`[NewsService] Ingested ${newlyInsertedCount} new genuine crypto articles into MongoDB.`);
                    realtimeService.broadcast("news_update", {
                        count: newlyInsertedCount,
                        articles: latestInserted.slice(0, 5),
                        timestamp: new Date().toISOString(),
                    });
                }

                // Return sorted recent articles from MongoDB
                const dbArticles = await CryptoNews.find({})
                    .sort({ publishedAt: -1 })
                    .limit(30)
                    .lean();

                if (dbArticles && dbArticles.length > 0) {
                    cacheService.set("crypto_news_cache", dbArticles, 90);
                    return dbArticles;
                }
            }

            // Fallback to raw articles if DB is temporarily disconnected
            cacheService.set("crypto_news_cache", rawArticles.slice(0, 30), 90);
            return rawArticles.slice(0, 30);
        } catch (err) {
            console.error("[NewsService] Sync error:", err.message);
            return cacheService.get("crypto_news_cache") || [];
        }
    }

    /**
     * Get recent articles (cached for performance)
     */
    async getRecentNews(category = null) {
        const cached = cacheService.get("crypto_news_cache");
        let articles = cached;

        if (!articles || articles.length === 0) {
            articles = await this.syncNews();
        }

        if (category && category !== "ALL") {
            return articles.filter((a) => a.category === category || a.title.toLowerCase().includes(category.toLowerCase()));
        }

        return articles;
    }

    startBackgroundPoller() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        // Initial sync on startup
        setTimeout(() => this.syncNews(), 2000);
        // Periodic sync every 2.5 minutes
        this.pollInterval = setInterval(() => this.syncNews(), 150000);
    }
}

module.exports = new NewsService();
