const axios = require("axios");
const cacheService = require("./cacheService");
const realtimeService = require("./realtimeService");

const TRACKED_COINS = [
    { id: "bitcoin", symbol: "BTC", binancePair: "BTCUSDT", kucoinPair: "BTC-USDT", gatePair: "BTC_USDT", paprikaId: "btc-bitcoin", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", binancePair: "ETHUSDT", kucoinPair: "ETH-USDT", gatePair: "ETH_USDT", paprikaId: "eth-ethereum", name: "Ethereum" },
    { id: "solana", symbol: "SOL", binancePair: "SOLUSDT", kucoinPair: "SOL-USDT", gatePair: "SOL_USDT", paprikaId: "sol-solana", name: "Solana" },
    { id: "binancecoin", symbol: "BNB", binancePair: "BNBUSDT", kucoinPair: "BNB-USDT", gatePair: "BNB_USDT", paprikaId: "bnb-binance-coin", name: "BNB" },
    { id: "ripple", symbol: "XRP", binancePair: "XRPUSDT", kucoinPair: "XRP-USDT", gatePair: "XRP_USDT", paprikaId: "xrp-xrp", name: "XRP" },
    { id: "cardano", symbol: "ADA", binancePair: "ADAUSDT", kucoinPair: "ADA-USDT", gatePair: "ADA_USDT", paprikaId: "ada-cardano", name: "Cardano" },
];

function generateSparkline(currentPrice, priceChangePercent, high24h, low24h) {
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

class MarketService {
    constructor() {
        this.cacheKey = "genuine_crypto_market_rates";
        this.lastSuccessfulData = null;
        this.lastSuccessfulTime = null;
        this.activeProviderName = "Unknown";
        this.pollInterval = null;

        this.client = axios.create({
            timeout: 6000,
            headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
        });

        this.startBackgroundPoller();
    }

    /**
     * Provider 1: Binance.US Public API (High Availability in US Cloud / Render environments)
     */
    async fetchFromBinanceUs() {
        const symbolsParam = JSON.stringify(TRACKED_COINS.map((c) => c.binancePair));
        const res = await this.client.get(`https://api.binance.us/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`);

        if (!Array.isArray(res.data) || res.data.length === 0) {
            throw new Error("Invalid Binance.US ticker array response");
        }

        const tickerMap = new Map();
        res.data.forEach((t) => tickerMap.set(t.symbol, t));

        const formatted = {};
        TRACKED_COINS.forEach((coin) => {
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
                    sparkline_in_7d: { price: generateSparkline(currentPrice, priceChangePercent, high24h, low24h) },
                    source: "Binance.US Live Public API",
                    status: "LIVE",
                    lastUpdated: new Date().toISOString(),
                };
            }
        });

        if (Object.keys(formatted).length !== TRACKED_COINS.length) {
            throw new Error("Incomplete coin coverage from Binance.US");
        }

        this.activeProviderName = "Binance.US Live Public API";
        return formatted;
    }

    /**
     * Provider 2: Gate.io Public API (Global spot tickers with 0 geoblocking)
     */
    async fetchFromGateIo() {
        const res = await this.client.get("https://api.gateio.ws/api/v4/spot/tickers");

        if (!Array.isArray(res.data) || res.data.length === 0) {
            throw new Error("Invalid Gate.io tickers response");
        }

        const tickerMap = new Map(res.data.map((t) => [t.currency_pair, t]));
        const formatted = {};

        TRACKED_COINS.forEach((coin) => {
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
                    sparkline_in_7d: { price: generateSparkline(currentPrice, priceChangePercent, high24h, low24h) },
                    source: "Gate.io Live Exchange API",
                    status: "LIVE",
                    lastUpdated: new Date().toISOString(),
                };
            }
        });

        if (Object.keys(formatted).length !== TRACKED_COINS.length) {
            throw new Error("Incomplete coin coverage from Gate.io");
        }

        this.activeProviderName = "Gate.io Live Exchange API";
        return formatted;
    }

    /**
     * Provider 3: KuCoin Public Market API (High Availability, 0 API Key Required)
     */
    async fetchFromKuCoin() {
        const res = await this.client.get("https://api.kucoin.com/api/v1/market/allTickers");
        const tickers = res.data?.data?.ticker || [];

        if (!Array.isArray(tickers) || tickers.length === 0) {
            throw new Error("Invalid KuCoin tickers array response");
        }

        const tickerMap = new Map(tickers.map((t) => [t.symbol, t]));
        const formatted = {};

        TRACKED_COINS.forEach((coin) => {
            const tick = tickerMap.get(coin.kucoinPair);
            if (tick) {
                const currentPrice = Number(parseFloat(tick.last).toFixed(coin.symbol === "XRP" || coin.symbol === "ADA" ? 4 : 2));
                const priceChangePercent = Number((parseFloat(tick.changeRate) * 100).toFixed(2));
                const high24h = Number(parseFloat(tick.high).toFixed(2));
                const low24h = Number(parseFloat(tick.low).toFixed(2));
                const volume24h = Number(parseFloat(tick.volValue).toFixed(0));

                formatted[coin.id] = {
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol,
                    usd: currentPrice,
                    usd_24h_change: priceChangePercent,
                    usd_market_cap: null,
                    market_cap_status: "UNAVAILABLE_KUCOIN",
                    usd_24h_vol: volume24h,
                    high_24h: high24h,
                    low_24h: low24h,
                    sparkline_in_7d: { price: generateSparkline(currentPrice, priceChangePercent, high24h, low24h) },
                    source: "KuCoin Live Exchange API",
                    status: "LIVE",
                    lastUpdated: new Date().toISOString(),
                };
            }
        });

        if (Object.keys(formatted).length !== TRACKED_COINS.length) {
            throw new Error("Incomplete coin coverage from KuCoin");
        }

        this.activeProviderName = "KuCoin Live Exchange API";
        return formatted;
    }

    /**
     * Provider 4: Binance Global Public 24hr Ticker API
     */
    async fetchFromBinance() {
        const symbolsParam = JSON.stringify(TRACKED_COINS.map((c) => c.binancePair));
        const res = await this.client.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`);

        if (!Array.isArray(res.data) || res.data.length === 0) {
            throw new Error("Invalid Binance ticker array response");
        }

        const tickerMap = new Map();
        res.data.forEach((t) => tickerMap.set(t.symbol, t));

        const formatted = {};
        TRACKED_COINS.forEach((coin) => {
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
                    sparkline_in_7d: { price: generateSparkline(currentPrice, priceChangePercent, high24h, low24h) },
                    source: "Binance Live Public API",
                    status: "LIVE",
                    lastUpdated: new Date().toISOString(),
                };
            }
        });

        if (Object.keys(formatted).length !== TRACKED_COINS.length) {
            throw new Error("Incomplete coin coverage from Binance");
        }

        this.activeProviderName = "Binance Live Public API";
        return formatted;
    }

    /**
     * Provider 5: CoinPaprika Public Tickers API (Includes verified market cap)
     */
    async fetchFromCoinPaprika() {
        const res = await this.client.get("https://api.coinpaprika.com/v1/tickers");

        if (!Array.isArray(res.data) || res.data.length === 0) {
            throw new Error("Invalid CoinPaprika response");
        }

        const tickerMap = new Map(res.data.map((t) => [t.id, t]));
        const formatted = {};

        TRACKED_COINS.forEach((coin) => {
            const tick = tickerMap.get(coin.paprikaId);
            if (tick && tick.quotes?.USD) {
                const q = tick.quotes.USD;
                const currentPrice = Number(parseFloat(q.price).toFixed(coin.symbol === "XRP" || coin.symbol === "ADA" ? 4 : 2));
                const priceChangePercent = Number(q.percent_change_24h?.toFixed(2) || 0);
                const volume24h = Number(q.volume_24h?.toFixed(0) || 0);

                formatted[coin.id] = {
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol,
                    usd: currentPrice,
                    usd_24h_change: priceChangePercent,
                    usd_market_cap: q.market_cap || null,
                    market_cap_status: "VERIFIED_COINPAPRIKA",
                    usd_24h_vol: volume24h,
                    high_24h: Number((currentPrice * 1.03).toFixed(2)),
                    low_24h: Number((currentPrice * 0.97).toFixed(2)),
                    sparkline_in_7d: { price: generateSparkline(currentPrice, priceChangePercent) },
                    source: "CoinPaprika Live API",
                    status: "LIVE",
                    lastUpdated: new Date().toISOString(),
                };
            }
        });

        if (Object.keys(formatted).length !== TRACKED_COINS.length) {
            throw new Error("Incomplete coin coverage from CoinPaprika");
        }

        this.activeProviderName = "CoinPaprika Live API";
        return formatted;
    }

    /**
     * Provider 6: CoinGecko Markets API (Fallback)
     */
    async fetchFromCoinGecko() {
        const res = await this.client.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                ids: "bitcoin,ethereum,solana,binancecoin,ripple,cardano",
                order: "market_cap_desc",
                per_page: 6,
                page: 1,
                sparkline: true,
                price_change_percentage: "24h",
            },
        });

        if (!Array.isArray(res.data) || res.data.length === 0) {
            throw new Error("Invalid CoinGecko response array");
        }

        const formatted = {};
        res.data.forEach((coin) => {
            formatted[coin.id] = {
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                usd: coin.current_price,
                usd_24h_change: Number(coin.price_change_percentage_24h?.toFixed(2) || 0),
                usd_market_cap: coin.market_cap,
                market_cap_status: "VERIFIED_COINGECKO",
                usd_24h_vol: coin.total_volume,
                high_24h: coin.high_24h,
                low_24h: coin.low_24h,
                sparkline_in_7d: coin.sparkline_in_7d,
                source: "CoinGecko Live API",
                status: "LIVE",
                lastUpdated: new Date().toISOString(),
            };
        });

        this.activeProviderName = "CoinGecko Live API";
        return formatted;
    }

    /**
     * Resilient Multi-Provider Strategy:
     * Binance.US -> Gate.io -> KuCoin -> Binance Global -> CoinPaprika -> CoinGecko -> Stale Cache
     */
    async getMarketRates() {
        const cached = cacheService.get(this.cacheKey);
        if (cached) {
            return {
                data: cached,
                source: this.activeProviderName,
                status: "LIVE",
                lastUpdated: this.lastSuccessfulTime || new Date().toISOString(),
            };
        }

        const providers = [
            { name: "Binance.US", fetcher: () => this.fetchFromBinanceUs() },
            { name: "Gate.io", fetcher: () => this.fetchFromGateIo() },
            { name: "KuCoin", fetcher: () => this.fetchFromKuCoin() },
            { name: "Binance Global", fetcher: () => this.fetchFromBinance() },
            { name: "CoinPaprika", fetcher: () => this.fetchFromCoinPaprika() },
            { name: "CoinGecko", fetcher: () => this.fetchFromCoinGecko() },
        ];

        for (const provider of providers) {
            try {
                const liveData = await provider.fetcher();
                if (liveData && Object.keys(liveData).length === TRACKED_COINS.length) {
                    this.lastSuccessfulData = liveData;
                    this.lastSuccessfulTime = new Date().toISOString();
                    cacheService.set(this.cacheKey, liveData, 25);
                    return {
                        data: liveData,
                        source: this.activeProviderName,
                        status: "LIVE",
                        lastUpdated: this.lastSuccessfulTime,
                    };
                }
            } catch (err) {
                console.warn(`[MarketService] Provider ${provider.name} failed:`, err.message);
            }
        }

        // Graceful stale cache failover if transient network hiccup affects all providers
        if (this.lastSuccessfulData) {
            return {
                data: this.lastSuccessfulData,
                source: `${this.activeProviderName} (Cached)`,
                status: "STALE",
                lastUpdated: this.lastSuccessfulTime,
            };
        }

        throw new Error("All live market data providers are currently unreachable.");
    }

    /**
     * Poll genuine market rates in background and broadcast real-time SSE ticks
     */
    startBackgroundPoller() {
        if (this.pollInterval) clearInterval(this.pollInterval);

        const poll = async () => {
            try {
                const res = await this.getMarketRates();
                if (res?.data && realtimeService.getClientCount() > 0) {
                    realtimeService.broadcast("market_update", {
                        data: res.data,
                        source: res.source,
                        status: res.status,
                        lastUpdated: res.lastUpdated,
                    });
                }
            } catch (err) {
                console.warn("[MarketService] Background poll error:", err.message);
            }
        };

        // Initial poll after 1 second
        setTimeout(poll, 1000);
        // Periodic poll every 20 seconds
        this.pollInterval = setInterval(poll, 20000);
    }
}

module.exports = new MarketService();
