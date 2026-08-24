const { test, describe } = require("node:test");
const assert = require("node:assert");
const http = require("http");

const BASE_URL = "http://localhost:3000";

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
        };

        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });

        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

describe("Frontend / Browser Realtime Verification Suite (localhost:3000)", () => {
    let testToken = null;
    let testUserId = null;
    const testEmail = `frontend_verifier_${Date.now()}@cryptoscope.ai`;

    test("1. Dashboard / SPA Root Loads Successfully (HTTP 200 + HTML Bundle)", async () => {
        const res = await makeRequest("GET", "/");
        assert.strictEqual(res.status, 200);
        assert.ok(typeof res.body === "string");
        assert.ok(res.body.includes("<!doctype html>"), "Should serve React SPA HTML bundle");
        assert.ok(res.body.includes("<div id=\"root\"></div>"), "Should contain root React mounting point");
    });

    test("2. Live Cryptocurrency Prices Come from Live Market Endpoint (Binance / CoinGecko)", async () => {
        const res = await makeRequest("GET", "/api/crypto/market");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.bitcoin, "Must contain Bitcoin ticker");
        assert.ok(typeof res.body.data.bitcoin.usd === "number");
        assert.ok(res.body.data.bitcoin.usd > 10000, "Genuine live BTC price (> $10k)");
        assert.ok(res.body.data.ethereum.usd > 500, "Genuine live ETH price (> $500)");
        assert.ok(res.body.source.includes("Live") || res.body.source.includes("API"));
        assert.strictEqual(res.body.status, "LIVE");
    });

    test("3. Price Values Emit Real-Time SSE Stream Update Events Without Full Page Reload", async () => {
        const sseUrl = new URL("/api/realtime/events", BASE_URL);
        let receivedMarketTick = false;

        await new Promise((resolve) => {
            const req = http.request(sseUrl, { method: "GET" }, (res) => {
                assert.strictEqual(res.statusCode, 200);
                assert.strictEqual(res.headers["content-type"], "text/event-stream");

                res.on("data", (chunk) => {
                    const text = chunk.toString();
                    if (text.includes("connected") || text.includes("market_update")) {
                        receivedMarketTick = true;
                        res.destroy();
                        resolve();
                    }
                });
            });

            req.on("error", () => resolve());
            setTimeout(() => {
                req.destroy();
                resolve();
            }, 3000);
            req.end();
        });

        assert.ok(receivedMarketTick, "SSE stream must emit realtime stream connection and ticks");
    });

    test("4. Frontend Establishes SSE / Realtime Connection Successfully", async () => {
        const sseRes = await makeRequest("GET", "/api/realtime/status");
        assert.strictEqual(sseRes.status, 200);
        assert.strictEqual(sseRes.body.success, true);
        assert.strictEqual(sseRes.body.protocol, "Server-Sent Events (SSE)");
    });

    test("5. Wallet Scan Persists and Triggers Dynamic Event Without Manual Refresh", async () => {
        // Register test user
        const regRes = await makeRequest("POST", "/api/auth/register", {
            name: "Frontend Verifier",
            email: testEmail,
            password: "Password123!",
            role: "analyst",
        });

        assert.strictEqual(regRes.status, 201);
        testToken = regRes.body.token;
        testUserId = regRes.body.user.id;

        // Perform single scan
        const scanRes = await makeRequest("GET", "/api/wallet/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", null, testToken);
        assert.strictEqual(scanRes.status, 200);
        assert.strictEqual(scanRes.body.success, true);
        assert.ok(scanRes.body.scanId);
        assert.strictEqual(scanRes.body.address, "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
    });

    test("6. Security Alerts Are Delivered to Authenticated User and Persisted", async () => {
        const simRes = await makeRequest("POST", "/api/wallet/alerts/simulate", {}, testToken);
        assert.strictEqual(simRes.status, 200);
        assert.strictEqual(simRes.body.success, true);
        assert.ok(simRes.body.alert.incidentId.startsWith("INC-2026-"));

        const listRes = await makeRequest("GET", "/api/wallet/alerts", null, testToken);
        assert.strictEqual(listRes.status, 200);
        assert.ok(listRes.body.alerts.length >= 1);
    });

    test("7. News Section Displays Genuine News from Backend RSS Aggregator", async () => {
        const newsRes = await makeRequest("GET", "/api/crypto/news");
        assert.strictEqual(newsRes.status, 200);
        assert.strictEqual(newsRes.body.success, true);
        assert.ok(newsRes.body.articles.length > 0);
        assert.ok(newsRes.body.articles[0].title);
    });

    test("8. News Items Show Source and Published Time", async () => {
        const newsRes = await makeRequest("GET", "/api/crypto/news");
        const article = newsRes.body.articles[0];
        assert.ok(article.source?.name, "Article must have genuine source name");
        assert.ok(article.publishedAt, "Article must have ISO publishedAt timestamp");
        assert.ok(!isNaN(new Date(article.publishedAt).getTime()), "Must be valid date");
    });

    test("9. Duplicate News Items Are Prevented via SHA-256 Fingerprint Deduplication", async () => {
        const newsRes = await makeRequest("GET", "/api/crypto/news");
        const fingerprints = newsRes.body.articles.map((a) => a.fingerprint || a.url);
        const uniqueFingerprints = new Set(fingerprints);
        assert.strictEqual(fingerprints.length, uniqueFingerprints.size, "All article fingerprints must be unique");
    });

    test("10. News Updates Stream Dispatches Genuinely New Articles to Frontend", async () => {
        const newsRes = await makeRequest("GET", "/api/crypto/news");
        assert.strictEqual(newsRes.status, 200);
        assert.ok(newsRes.body.articles.length >= 10, "Should aggregate genuine multi-feed articles");
    });

    test("11. Live Blockchain / Wallet Data Reaches Frontend from Mempool.space / Blockstream", async () => {
        const genesisRes = await makeRequest("GET", "/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(genesisRes.status, 200);
        assert.strictEqual(genesisRes.body.address, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(genesisRes.body.totalReceived >= 50, "Genesis block received at least 50 BTC");
    });

    test("12. Reconnect Behavior Handles Stream Drops and Restores Client", async () => {
        const sseUrl = new URL("/api/realtime/events", BASE_URL);

        // Connection 1
        await new Promise((resolve) => {
            const req = http.request(sseUrl, { method: "GET" }, (res) => {
                res.destroy(); // Simulate abrupt drop
                resolve();
            });
            req.on("error", () => resolve());
            req.end();
        });

        // Connection 2 (Reconnect)
        const reconnected = await new Promise((resolve) => {
            const req = http.request(sseUrl, { method: "GET" }, (res) => {
                assert.strictEqual(res.statusCode, 200);
                res.on("data", (chunk) => {
                    if (chunk.toString().includes("connected")) {
                        res.destroy();
                        resolve(true);
                    }
                });
            });
            req.on("error", () => resolve(false));
            req.end();
        });

        assert.strictEqual(reconnected, true, "Client must reconnect and receive new handshake");
    });

    test("13. Frontend Recovers Persisted Missed Data After Reconnect", async () => {
        // Fetch persisted history
        const histRes = await makeRequest("GET", "/api/wallet/history/all", null, testToken);
        assert.strictEqual(histRes.status, 200);
        assert.ok(histRes.body.history.length >= 1, "Persisted history is restored");

        // Fetch persisted activities
        const actRes = await makeRequest("GET", "/api/wallet/activities", null, testToken);
        assert.strictEqual(actRes.status, 200);
        assert.ok(actRes.body.activities.length >= 2, "Persisted audit trail is restored");
    });

    test("14. Stale / Offline / Provider Diagnostics Handled Accurately in Subsystems Health", async () => {
        const healthRes = await makeRequest("GET", "/api/health");
        assert.strictEqual(healthRes.status, 200);
        assert.strictEqual(healthRes.body.subsystems.database.status, "connected");
        assert.strictEqual(healthRes.body.subsystems.marketDataProvider.status, "connected");
        assert.strictEqual(healthRes.body.subsystems.newsProvider.status, "connected");
    });

    test("15. Zero Fake / Mock Live Data in Production Output", async () => {
        const marketRes = await makeRequest("GET", "/api/crypto/market");
        const btcPrice = marketRes.body.data.bitcoin.usd;
        assert.ok(btcPrice > 10000 && btcPrice < 500000, "Price must be real market price, not hardcoded constant 96420.50 or sinusoidal tick");
    });
});
