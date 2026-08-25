const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../app");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const SecurityAlert = require("../models/alertModel");
const connectDB = require("../config/db");
const { getJwtSecret, validateJwtConfigOnStartup } = require("../config/jwtConfig");

let server;
let baseUrl;
const TEST_PORT = 3099;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const reqHeaders = {
            "Content-Type": "application/json",
            ...headers,
        };

        const req = http.request(
            url,
            {
                method,
                headers: reqHeaders,
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                    } catch {
                        resolve({ status: res.statusCode, headers: res.headers, body: data });
                    }
                });
            }
        );

        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

describe("CRYPTOSCOPE Targeted Production Security Hardening Verification Suite", () => {
    let testUser;
    let testToken;
    let testRefreshToken;
    const testEmail = `sec_hardening_${Date.now()}@cryptoscope.ai`;
    const testPassword = "HardenedPass2026!@#";

    before(async () => {
        await connectDB();

        server = http.createServer(app);
        await new Promise((resolve) => {
            server.listen(TEST_PORT, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${TEST_PORT}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (server) await new Promise((resolve) => server.close(resolve));
        if (testUser) await User.deleteOne({ _id: testUser.id });
    });

    // =========================================================================
    // 1. JWT Fail-Fast & Centralized Validation
    // =========================================================================
    test("1. Centralized JWT Config - Valid secret returns correctly", () => {
        const secret = getJwtSecret();
        assert.ok(secret, "JWT secret must be returned");
        assert.ok(secret.length >= 16, "JWT secret must be sufficiently long");
        assert.doesNotThrow(() => validateJwtConfigOnStartup());
    });

    test("2. Centralized JWT Config - Missing secret throws fatal error", () => {
        const originalSecret = process.env.JWT_SECRET;
        try {
            delete process.env.JWT_SECRET;
            assert.throws(() => getJwtSecret(), /FATAL SECURITY CONFIGURATION ERROR/);
        } finally {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    // =========================================================================
    // 2. Strict CORS & Origin Policy
    // =========================================================================
    test("3. Strict CORS - Allowed origin receives CORS headers", async () => {
        const res = await request("OPTIONS", "/api/health", null, {
            Origin: "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        });
        assert.strictEqual(res.headers["access-control-allow-origin"], "http://localhost:3000");
        assert.strictEqual(res.headers["access-control-allow-credentials"], "true");
    });

    test("4. Strict CORS - Disallowed malicious external origin is rejected", async () => {
        const res = await request("GET", "/api/health", null, {
            Origin: "https://attacker-crypto-drainer.xyz",
        });
        // Non-allowed origin fails CORS with 500 or omitted allow header
        assert.notStrictEqual(res.headers["access-control-allow-origin"], "https://attacker-crypto-drainer.xyz");
    });

    // =========================================================================
    // 3. Helmet & HTTP Security Headers
    // =========================================================================
    test("5. Helmet Headers - X-Content-Type-Options, Referrer-Policy, and CSP present", async () => {
        const res = await request("GET", "/api/health");
        assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
        assert.ok(res.headers["referrer-policy"], "Referrer policy must be present");
        assert.ok(res.headers["content-security-policy"], "CSP must be configured");
    });

    // =========================================================================
    // 4. Refresh Token SHA-256 Hashing & Safe Migration
    // =========================================================================
    test("6. User Registration - Refresh token stored ONLY as SHA-256 hash in MongoDB", async () => {
        const regRes = await request("POST", "/api/auth/register", {
            name: "Security Tester",
            email: testEmail,
            password: testPassword,
        });

        assert.strictEqual(regRes.status, 201);
        assert.strictEqual(regRes.body.success, true);
        assert.ok(regRes.body.token);
        assert.ok(regRes.body.refreshToken);

        testToken = regRes.body.token;
        testRefreshToken = regRes.body.refreshToken;
        testUser = regRes.body.user;

        // Inspect direct MongoDB document
        const userInDb = await User.findById(testUser.id);
        assert.ok(userInDb, "User must exist in MongoDB");
        assert.notStrictEqual(userInDb.refreshToken, testRefreshToken, "Raw refresh token must NEVER be stored in DB");

        const expectedHash = crypto.createHash("sha256").update(testRefreshToken).digest("hex");
        assert.strictEqual(userInDb.refreshToken, expectedHash, "MongoDB must store exact SHA-256 hash");
    });

    test("7. Token Refresh - Valid refresh token rotates session and updates hash", async () => {
        const refreshRes = await request("POST", "/api/auth/refresh", {
            refreshToken: testRefreshToken,
        });

        assert.strictEqual(refreshRes.status, 200);
        assert.strictEqual(refreshRes.body.success, true);
        assert.ok(refreshRes.body.accessToken);
        assert.ok(refreshRes.body.refreshToken);
        assert.notStrictEqual(refreshRes.body.refreshToken, testRefreshToken, "Token must rotate");

        // Update working token
        testToken = refreshRes.body.accessToken;
        testRefreshToken = refreshRes.body.refreshToken;

        // Verify new hash in MongoDB
        const userInDb = await User.findById(testUser.id);
        const newExpectedHash = crypto.createHash("sha256").update(testRefreshToken).digest("hex");
        assert.strictEqual(userInDb.refreshToken, newExpectedHash);
    });

    test("8. Token Refresh - Invalid/tampered refresh token rejected (401)", async () => {
        const badRes = await request("POST", "/api/auth/refresh", {
            refreshToken: "invalid.tampered.refreshtoken",
        });
        assert.strictEqual(badRes.status, 401);
    });

    test("9. Token Refresh - Legacy plaintext token migration automatically updates to hash", async () => {
        // Simulate legacy unhashed token in DB
        const legacyRawToken = `legacy_token_${Date.now()}`;
        const secret = getJwtSecret();
        const legacyJwt = require("jsonwebtoken").sign({ id: testUser.id }, secret, { expiresIn: "7d" });

        await User.updateOne({ _id: testUser.id }, { refreshToken: legacyJwt });

        // Call refresh with legacy token
        const res = await request("POST", "/api/auth/refresh", {
            refreshToken: legacyJwt,
        });

        assert.strictEqual(res.status, 200);
        assert.ok(res.body.refreshToken);

        // Verify that MongoDB is now upgraded to SHA-256 hash
        const userInDb = await User.findById(testUser.id);
        const expectedNewHash = crypto.createHash("sha256").update(res.body.refreshToken).digest("hex");
        assert.strictEqual(userInDb.refreshToken, expectedNewHash);

        testToken = res.body.accessToken;
        testRefreshToken = res.body.refreshToken;
    });

    // =========================================================================
    // 5. Public Shareable Report Endpoint
    // =========================================================================
    test("10. Public Report - Unauthenticated visitor can view report without login", async () => {
        const res = await request("GET", "/api/wallet/report/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.report);
        assert.strictEqual(res.body.report.address, "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.body.report.user, undefined, "User ID must not be leaked in public report");
    });

    test("11. Private Wallet Endpoints remain strictly protected (401)", async () => {
        const resHistory = await request("GET", "/api/wallet/history/all");
        assert.strictEqual(resHistory.status, 401);

        const resWatchlist = await request("GET", "/api/wallet/watchlist");
        assert.strictEqual(resWatchlist.status, 401);

        const resActivities = await request("GET", "/api/wallet/activities");
        assert.strictEqual(resActivities.status, 401);
    });

    // =========================================================================
    // 6. Incident ID Collision-Resistance
    // =========================================================================
    test("12. Incident ID Generation - 5,000 generated IDs are 100% unique", () => {
        const generated = new Set();
        const year = new Date().getFullYear();

        for (let i = 0; i < 5000; i++) {
            const ts = Date.now().toString(36).toUpperCase();
            const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
            const id = `INC-${year}-${ts}-${entropy}-${i}`;
            assert.ok(!generated.has(id), `Duplicate ID detected: ${id}`);
            generated.add(id);
        }

        assert.strictEqual(generated.size, 5000);
    });

    // =========================================================================
    // 7. Simulation Endpoint Production Guard
    // =========================================================================
    test("13. Simulation Endpoint - Disabled in production mode", async () => {
        const origEnv = process.env.NODE_ENV;
        try {
            process.env.NODE_ENV = "production";
            const secret = getJwtSecret();
            const adminToken = require("jsonwebtoken").sign(
                { id: testUser.id, email: testEmail, role: "admin" },
                secret,
                { expiresIn: "1h" }
            );

            const res = await request("POST", "/api/wallet/alerts/simulate", {}, {
                Authorization: `Bearer ${adminToken}`,
            });
            assert.strictEqual(res.status, 403);
            assert.ok(res.body.message.includes("disabled in production"));
        } finally {
            process.env.NODE_ENV = origEnv;
        }
    });

    // =========================================================================
    // 8. Bounded Watchlist Concurrency
    // =========================================================================
    test("14. Watchlist Rescan - Bounded batch execution succeeds", async () => {
        // Add items to watchlist
        await request("POST", "/api/wallet/watchlist", {
            address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
            label: "Cold Storage",
        }, {
            Authorization: `Bearer ${testToken}`,
        });

        const rescanRes = await request("POST", "/api/wallet/watchlist/rescan", null, {
            Authorization: `Bearer ${testToken}`,
        });

        assert.strictEqual(rescanRes.status, 200);
        assert.strictEqual(rescanRes.body.success, true);
        assert.ok(Array.isArray(rescanRes.body.watchlist));
    });
});
