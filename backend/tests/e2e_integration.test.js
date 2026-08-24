const { test, describe } = require("node:test");
const assert = require("node:assert");
const http = require("http");

function makeRequest(path, method = "GET", body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const reqHeaders = {
            "Content-Type": "application/json",
            ...headers,
        };

        const req = http.request(
            {
                hostname: "localhost",
                port: 3000,
                path,
                method,
                headers: reqHeaders,
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, raw: data });
                    }
                });
            }
        );

        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

describe("CryptoScope AI End-to-End Live API Integration Tests", () => {
    test("1. Root & Health Check Endpoint", async () => {
        const res = await makeRequest("/");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.status.includes("Operational"));
    });

    test("2. Single Wallet Scan - Binance Cold Storage", async () => {
        const res = await makeRequest("/api/wallet/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.riskScore >= 0 && res.data.riskScore <= 100);
        assert.strictEqual(res.data.entityTag.name, "Binance Cold Storage");
        assert.ok(res.data.transactions.length > 0);
        assert.ok(res.data.breakdown.transactionRisk !== undefined);
    });

    test("3. Single Wallet Scan - Satoshi Nakamoto Genesis", async () => {
        const res = await makeRequest("/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.riskScore >= 0 && res.data.riskScore <= 100);
        assert.strictEqual(res.data.entityTag.name, "Satoshi Nakamoto (Genesis Block)");
    });

    test("4. Batch Multi-Address Parallel Scan", async () => {
        const addresses = [
            "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
            "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            "bc1qa5wkgaew2dkv56kfvj49j0av5nmar2m78mtgggh3txac90gaxuvsgg0wqj",
        ];
        const res = await makeRequest("/api/wallet/batch-scan", "POST", { addresses });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.scannedCount, 3);
        assert.strictEqual(res.data.results.length, 3);
    });

    test("5. Fund Flow Graph Endpoint", async () => {
        const res = await makeRequest("/api/wallet/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo/graph");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.graphData.nodes.length > 0);
        assert.ok(res.data.graphData.edges.length > 0);
    });

    test("6. Live Crypto Market & Sparklines Feed", async () => {
        const res = await makeRequest("/api/crypto/market");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.data.bitcoin !== undefined);
        assert.ok(res.data.data.bitcoin.usd > 0);
    });

    test("7. Intelligence News Feed", async () => {
        const res = await makeRequest("/api/crypto/news");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.articles.length > 0);
    });

    test("8. User Authentication - Demo Analyst Login", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {
            email: "analyst@cryptoscope.ai",
            password: "Analyst@2026",
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.token !== undefined);
    });

    test("9. Watchlist Management & Re-Scan", async () => {
        const addRes = await makeRequest("/api/wallet/watchlist", "POST", {
            address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
            label: "Binance Vault",
        });
        assert.strictEqual(addRes.status, 200);
        assert.strictEqual(addRes.data.success, true);

        const rescanRes = await makeRequest("/api/wallet/watchlist/rescan", "POST");
        assert.strictEqual(rescanRes.status, 200);
        assert.strictEqual(rescanRes.data.success, true);
    });

    test("10. Admin Platform Telemetry (with Admin Token)", async () => {
        const loginRes = await makeRequest("/api/auth/login", "POST", {
            email: "admin@cryptoscope.ai",
            password: "Admin@2026",
        });
        assert.strictEqual(loginRes.status, 200);
        const adminToken = loginRes.data.token;

        const res = await makeRequest("/api/admin/stats", "GET", null, {
            Authorization: `Bearer ${adminToken}`,
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.platformStats.cacheDiagnostics !== undefined);
    });
});
