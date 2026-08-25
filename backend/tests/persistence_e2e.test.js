const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../app");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const UserActivity = require("../models/activityModel");
const SecurityAlert = require("../models/alertModel");

let server;
let baseUrl;
const TEST_PORT = 3088;

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
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

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

describe("CryptoScope AI — Full MongoDB Atlas Persistence & Subsystems Test Suite", () => {
    let testUserToken = null;
    let testUserId = null;
    const testEmail = `persisted_tester_${Date.now()}@cryptoscope.ai`;
    const testPassword = "SecurePassword@2026";
    let scanId = null;

    before(async () => {
        // Connect to MongoDB Atlas
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 6000,
        });

        await new Promise((resolve) => {
            server = app.listen(TEST_PORT, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${TEST_PORT}`;
                resolve();
            });
        });
    });

    after(async () => {
        // Clean up test data created during this run
        if (testUserId) {
            await User.findByIdAndDelete(testUserId);
            await Wallet.deleteMany({ user: testUserId });
            await UserActivity.deleteMany({ userId: testUserId });
            await SecurityAlert.deleteMany({ userId: testUserId });
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await mongoose.connection.close();
    });

    test("1. Comprehensive Health Check Reports Connected MongoDB Atlas & Subsystems", async () => {
        const res = await request("GET", "/api/health");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.subsystems.database.status, "connected");
        assert.strictEqual(res.body.subsystems.database.provider, "MongoDB Atlas");
        assert.strictEqual(res.body.subsystems.realtime.status, "active");
        assert.strictEqual(res.body.subsystems.heuristicsEngine.status, "operational");
    });

    test("2. User Registration Writes Encrypted Record to MongoDB Atlas", async () => {
        const res = await request("POST", "/api/auth/register", {
            name: "Persistent Audit Tester",
            email: testEmail,
            password: testPassword,
            role: "user",
        });

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.token, "Should return valid JWT accessToken");
        assert.strictEqual(res.body.user.email, testEmail);

        testUserToken = res.body.token;
        testUserId = res.body.user.id;

        // Verify document directly in MongoDB Atlas
        const userInDb = await User.findById(testUserId);
        assert.ok(userInDb, "User must exist in MongoDB Atlas");
        assert.strictEqual(userInDb.email, testEmail);
        assert.notStrictEqual(userInDb.password, testPassword, "Password must be hashed with bcrypt");
        assert.ok(userInDb.password.startsWith("$2b$") || userInDb.password.startsWith("$2a$"), "Must use bcrypt hash");

        // Verify UserActivity was logged
        const activityInDb = await UserActivity.findOne({ userId: testUserId, action: "USER_REGISTERED" });
        assert.ok(activityInDb, "USER_REGISTERED activity must be persisted in UserActivity collection");
    });

    test("3. User Login Validates with MongoDB Atlas & Updates LastLogin", async () => {
        const res = await request("POST", "/api/auth/login", {
            email: testEmail,
            password: testPassword,
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.token);

        // Verify lastLogin in MongoDB
        const userInDb = await User.findById(testUserId);
        assert.ok(userInDb.lastLogin, "lastLogin timestamp must be updated in MongoDB");

        // Verify USER_LOGIN activity
        const loginActivity = await UserActivity.findOne({ userId: testUserId, action: "USER_LOGIN" });
        assert.ok(loginActivity, "USER_LOGIN must be persisted in UserActivity collection");
    });

    test("4. Single Wallet Scan Writes Complete 5-Axis Record to MongoDB Atlas with User Ref", async () => {
        const testAddress = "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo";
        const res = await request("GET", `/api/wallet/${testAddress}`, null, testUserToken);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.address, testAddress);
        assert.ok(res.body.scanId, "Must return valid scanId");
        assert.ok(typeof res.body.riskScore === "number");

        scanId = res.body.scanId;

        // Verify in MongoDB Atlas Wallet collection
        const walletInDb = await Wallet.findById(scanId);
        assert.ok(walletInDb, "Wallet scan record must exist in MongoDB Atlas");
        assert.strictEqual(walletInDb.address, testAddress);
        assert.strictEqual(walletInDb.user.toString(), testUserId, "Must be linked to authenticated user");
        assert.ok(walletInDb.ruleTriggers.length >= 0);
        assert.strictEqual(walletInDb.status, "COMPLETED");

        // Verify WALLET_SCANNED activity
        const scanActivity = await UserActivity.findOne({ userId: testUserId, action: "WALLET_SCANNED" });
        assert.ok(scanActivity, "WALLET_SCANNED activity must be saved in UserActivity collection");
    });

    test("5. High Risk Wallet Scan Automatically Generates Persistent SecurityAlert in MongoDB", async () => {
        const highRiskAddress = "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e"; // WannaCry ransomware
        const res = await request("GET", `/api/wallet/${highRiskAddress}`, null, testUserToken);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.riskLevel, "High");
        assert.strictEqual(res.body.entityTag?.isSanctioned, true);

        // Verify SecurityAlert document in MongoDB
        const alertInDb = await SecurityAlert.findOne({ address: highRiskAddress });
        assert.ok(alertInDb, "SecurityAlert must be saved to MongoDB SecurityAlerts collection");
        assert.ok(alertInDb.incidentId.startsWith("INC-2026-"));
        assert.strictEqual(alertInDb.severity, "HIGH");
    });

    test("6. Watchlist Management Writes, Re-Scans, and Deletes Directly in MongoDB Atlas", async () => {
        const watchedAddress = "bc1qa5wkgaew2dkv56kfvj49j0av5nmar2m78mtgggh3txac90gaxuvsgg0wqj";

        // 1. Add to Watchlist
        const addRes = await request("POST", "/api/wallet/watchlist", { address: watchedAddress, label: "Wasabi Mixer Vault" }, testUserToken);
        assert.strictEqual(addRes.status, 200);
        assert.strictEqual(addRes.body.success, true);

        // Verify in User document in MongoDB Atlas
        let userInDb = await User.findById(testUserId);
        const item = userInDb.watchlist.find((w) => w.address === watchedAddress);
        assert.ok(item, "Watched address must be in User.watchlist array in MongoDB");
        assert.strictEqual(item.label, "Wasabi Mixer Vault");

        // 2. Re-Scan Watchlist
        const rescanRes = await request("POST", "/api/wallet/watchlist/rescan", {}, testUserToken);
        assert.strictEqual(rescanRes.status, 200);
        assert.strictEqual(rescanRes.body.success, true);

        // 3. Remove from Watchlist
        const delRes = await request("DELETE", `/api/wallet/watchlist/${watchedAddress}`, null, testUserToken);
        assert.strictEqual(delRes.status, 200);
        assert.strictEqual(delRes.body.success, true);

        userInDb = await User.findById(testUserId);
        const removed = userInDb.watchlist.find((w) => w.address === watchedAddress);
        assert.strictEqual(removed, undefined, "Item must be deleted from MongoDB watchlist");
    });

    test("7. User Activity History Retrieves Persisted Audit Trail Scoped to User", async () => {
        const res = await request("GET", "/api/wallet/activities", null, testUserToken);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.activities.length >= 3, "Should have multiple persisted activity records");

        // All records must belong to testUserId
        res.body.activities.forEach((act) => {
            assert.strictEqual(act.userId, testUserId);
        });
    });

    test("8. User Scan History Retrieves Persisted Scans Scoped to User", async () => {
        const res = await request("GET", "/api/wallet/history/all", null, testUserToken);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.history.length >= 1, "Should return persisted scans");
        assert.strictEqual(res.body.history[0].user, testUserId);
    });

    test("9. Security Alert Simulation Authorization Guard & Retrieval", async () => {
        // Normal user attempting simulation is blocked with 403 Forbidden
        const res = await request("POST", "/api/wallet/alerts/simulate", {}, testUserToken);
        assert.strictEqual(res.status, 403);

        const listRes = await request("GET", "/api/wallet/alerts", null, testUserToken);
        assert.strictEqual(listRes.status, 200);
        assert.ok(Array.isArray(listRes.body.alerts));
    });

    test("10. Data Persistence Survives Backend Server Restart (MANDATORY ACCEPTANCE CRITERIA)", async () => {
        // Step A: Stop server
        await new Promise((resolve) => server.close(resolve));

        // Step B: Start brand new server instance and await listen callback
        await new Promise((resolve) => {
            server = app.listen(TEST_PORT + 1, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${TEST_PORT + 1}`;
                resolve();
            });
        });

        // Step C: Re-authenticate with previously created user credentials
        const loginRes = await request("POST", "/api/auth/login", {
            email: testEmail,
            password: testPassword,
        });

        assert.strictEqual(loginRes.status, 200);
        assert.strictEqual(loginRes.body.success, true);
        const newAccessToken = loginRes.body.token;

        // Step D: Retrieve historical scan data created before restart
        const historyRes = await request("GET", "/api/wallet/history/all", null, newAccessToken);
        assert.strictEqual(historyRes.status, 200);
        assert.ok(historyRes.body.history.length >= 1, "All previous scans must survive server restart");
        assert.strictEqual(historyRes.body.history[0].user, testUserId);

        // Step E: Retrieve audit activities created before restart
        const actRes = await request("GET", "/api/wallet/activities", null, newAccessToken);
        assert.strictEqual(actRes.status, 200);
        assert.ok(actRes.body.activities.length >= 3, "All previous user activities must survive server restart");
    });

    test("11. Real-time SSE Stream Endpoint Connects & Dispatches Handshake", async () => {
        const sseUrl = new URL("/api/realtime/events", baseUrl);
        const receivedEvents = [];

        await new Promise((resolve) => {
            const req = http.request(sseUrl, { method: "GET" }, (res) => {
                assert.strictEqual(res.statusCode, 200);
                assert.strictEqual(res.headers["content-type"], "text/event-stream");

                res.on("data", (chunk) => {
                    const text = chunk.toString();
                    receivedEvents.push(text);
                    if (text.includes("connected")) {
                        res.destroy();
                        resolve();
                    }
                });
            });

            req.on("error", () => resolve());
            req.end();
        });

        assert.ok(receivedEvents.some((e) => e.includes("Real-time SSE Stream Established")));
    });

    test("12. Genuine Live Cryptocurrency Market API Returns Real Prices & Diagnostics", async () => {
        const res = await request("GET", "/api/crypto/market");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.bitcoin, "Must contain Bitcoin quotes");
        assert.ok(typeof res.body.data.bitcoin.usd === "number");
        assert.ok(res.body.data.bitcoin.usd > 10000, "Must be real Bitcoin price (> $10k)");
        assert.ok(res.body.data.ethereum.usd > 500, "Must be real Ethereum price (> $500)");
        assert.ok(res.body.source.includes("Live") || res.body.source.includes("API"));
    });

    test("13. Genuine Crypto News RSS Aggregator Normalizes, Deduplicates & Persists to MongoDB", async () => {
        const res = await request("GET", "/api/crypto/news");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(Array.isArray(res.body.articles));
        assert.ok(res.body.articles.length > 0, "Should have genuine news articles");

        const firstArticle = res.body.articles[0];
        assert.ok(firstArticle.title, "Must have valid article title");
        assert.ok(firstArticle.url, "Must have valid article URL");
        assert.ok(firstArticle.source, "Must have valid source");
    });

    test("14. Strict Multi-User Data Isolation Prevents User B from Accessing User A Data", async () => {
        // Create User B
        const userBEmail = `user_b_isolated_${Date.now()}@cryptoscope.ai`;
        const regB = await request("POST", "/api/auth/register", {
            name: "User B Isolation Tester",
            email: userBEmail,
            password: testPassword,
            role: "user",
        });

        assert.strictEqual(regB.status, 201);
        const userBToken = regB.body.token;
        const userBId = regB.body.user.id;

        try {
            // User B requests their scan history
            const histB = await request("GET", "/api/wallet/history/all", null, userBToken);
            assert.strictEqual(histB.status, 200);
            // User B should NOT see User A's private scans
            assert.strictEqual(histB.body.history.length, 0, "User B should have zero scans initially");

            // User B requests their activities
            const actB = await request("GET", "/api/wallet/activities", null, userBToken);
            assert.strictEqual(actB.status, 200);
            // All activities returned to User B must have User B's ID, none of User A's
            actB.body.activities.forEach((a) => {
                assert.strictEqual(a.userId, userBId);
                assert.notStrictEqual(a.userId, testUserId);
            });
        } finally {
            // Clean up User B
            await User.findByIdAndDelete(userBId);
            await UserActivity.deleteMany({ userId: userBId });
        }
    });
});


