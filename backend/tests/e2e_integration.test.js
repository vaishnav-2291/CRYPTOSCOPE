const { test, describe, before } = require("node:test");
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
    let authToken = null;
    const testEmail = `e2e_analyst_${Date.now()}@cryptoscope.ai`;
    const testPassword = "StrongPassword@2026";

    before(async () => {
        // Register authentic test analyst
        const regRes = await makeRequest("/api/auth/register", "POST", {
            name: "E2E Analyst",
            email: testEmail,
            password: testPassword,
        });

        if (regRes.status === 201 && regRes.data?.token) {
            authToken = regRes.data.token;
        } else {
            const loginRes = await makeRequest("/api/auth/login", "POST", {
                email: testEmail,
                password: testPassword,
            });
            authToken = loginRes.data?.token;
        }
    });

    test("1. Root & Health Check Endpoint (Public)", async () => {
        const res = await makeRequest("/api/health");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.status.includes("Operational"));
    });

    test("2. Unauthenticated Wallet Scan -> 401 Unauthorized", async () => {
        const res = await makeRequest("/api/wallet/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
    });

    test("3. Authenticated Single Wallet Scan - Binance Cold Storage", async () => {
        assert.ok(authToken, "Auth token must be available");
        const res = await makeRequest("/api/wallet/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", "GET", null, {
            Authorization: `Bearer ${authToken}`,
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.riskScore >= 0 && res.data.riskScore <= 100);
        assert.strictEqual(res.data.entityTag?.name, "Binance Cold Storage");
        assert.ok(res.data.transactions?.length > 0);
        assert.ok(res.data.breakdown?.transactionRisk !== undefined);
    });

    test("4. Authenticated Single Wallet Scan - Satoshi Genesis", async () => {
        assert.ok(authToken, "Auth token must be available");
        const res = await makeRequest("/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "GET", null, {
            Authorization: `Bearer ${authToken}`,
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.riskScore >= 0 && res.data.riskScore <= 100);
        assert.strictEqual(res.data.entityTag?.name, "Satoshi Nakamoto (Genesis Block)");
    });

    test("5. Authenticated Batch Multi-Address Scan", async () => {
        assert.ok(authToken, "Auth token must be available");
        const addresses = [
            "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
            "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            "bc1qa5wkgaew2dkv56kfvj49j0av5nmar2m78mtgggh3txac90gaxuvsgg0wqj",
        ];
        const res = await makeRequest("/api/wallet/batch-scan", "POST", { addresses }, {
            Authorization: `Bearer ${authToken}`,
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.scannedCount, 3);
        assert.strictEqual(res.data.results.length, 3);
    });

    test("6. Authenticated Fund Flow Graph Endpoint", async () => {
        assert.ok(authToken, "Auth token must be available");
        const res = await makeRequest("/api/wallet/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo/graph", "GET", null, {
            Authorization: `Bearer ${authToken}`,
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.graphData?.nodes?.length > 0);
        assert.ok(res.data.graphData?.edges?.length > 0);
    });

    test("7. Public Shared Threat Report -> 200 OK (Unauthenticated Access)", async () => {
        const res = await makeRequest("/api/wallet/report/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.report?.address === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
    });

    test("8. Live Crypto Market & Sparklines Feed (Public)", async () => {
        const res = await makeRequest("/api/crypto/market");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.data?.bitcoin !== undefined);
        assert.ok(res.data.data.bitcoin.usd > 0);
    });

    test("9. Intelligence News Feed (Public)", async () => {
        const res = await makeRequest("/api/crypto/news");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.articles?.length > 0);
    });

    test("10. Authenticated Watchlist Management & Bounded Re-Scan", async () => {
        assert.ok(authToken, "Auth token must be available");
        const addRes = await makeRequest("/api/wallet/watchlist", "POST", {
            address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
            label: "Binance Vault",
        }, {
            Authorization: `Bearer ${authToken}`,
        });
        assert.strictEqual(addRes.status, 200);
        assert.strictEqual(addRes.data.success, true);

        const rescanRes = await makeRequest("/api/wallet/watchlist/rescan", "POST", null, {
            Authorization: `Bearer ${authToken}`,
        });
        assert.strictEqual(rescanRes.status, 200);
        assert.strictEqual(rescanRes.data.success, true);
    });
});
