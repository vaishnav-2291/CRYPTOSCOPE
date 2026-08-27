/**
 * CryptoScope AI — Round 3 Analyst-Grade Upgrades Test Suite
 * Tests Features 15 (Threat Radar), 16 (Case Workspace), 17 (Rule Config Engine), 18 (Alert Triage Queue)
 */

const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../app");
const connectDB = require("../config/db");
const threatRadarService = require("../services/forensics/threatRadarService");
const caseService = require("../services/forensics/caseService");
const ruleConfigService = require("../services/forensics/ruleConfigService");
const alertTriageService = require("../services/forensics/alertTriageService");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

test("CryptoScope AI — Round 3 Analyst-Grade Upgrades Test Suite", async (t) => {
    let mockUserId;
    let authHeader;
    let server;
    let baseUrl;

    // Connect to database
    await connectDB();

    // Setup HTTP test server and authenticated analyst user
    const testEmail = `analyst_test_${Date.now()}@cryptoscope.ai`;
    const testUser = await User.create({
        name: "Test Analyst",
        email: testEmail,
        password: "Password123!",
        role: "user",
    });
    mockUserId = testUser._id;

    const token = jwt.sign({ id: mockUserId, email: testUser.email, role: testUser.role }, process.env.JWT_SECRET || "default_jwt_secret_for_cryptoscope_ai_2026", { expiresIn: "1h" });
    authHeader = `Bearer ${token}`;

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // =========================================================================
    // 15. LIVE NETWORK-WIDE THREAT RADAR
    // =========================================================================
    await t.test("15. Threat Radar - Maintains live buffer and provides network stream telemetry", async () => {
        const feed = threatRadarService.getRecentThreats(10);
        assert.ok(Array.isArray(feed.threats));
        assert.ok(feed.stats);
        assert.ok(feed.streamSource.includes("mempool.space"));

        // API Endpoint
        const res = await fetch(`${baseUrl}/api/forensics/radar/feed`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.threats));
    });

    // =========================================================================
    // 16. INVESTIGATION CASE WORKSPACE & LIVE DOSSIER
    // =========================================================================
    let createdCaseId;

    await t.test("16. Investigation Case Workspace - Creates case and aggregates live multi-wallet dossier", async () => {
        // Create Case
        const caseRes = await fetch(`${baseUrl}/api/cases`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: authHeader },
            body: JSON.stringify({
                title: "Test On-Chain Fraud Case",
                description: "Investigating potential mixer cluster links",
                priority: "HIGH",
                caseTags: ["Lazarus Link", "Mixer"],
                initialAddresses: [{ address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", customLabel: "Primary Target" }],
            }),
        });

        assert.strictEqual(caseRes.status, 201);
        const caseData = await caseRes.json();
        assert.strictEqual(caseData.success, true);
        assert.strictEqual(caseData.case.title, "Test On-Chain Fraud Case");
        createdCaseId = caseData.case._id;

        // Add note to case
        const noteRes = await fetch(`${baseUrl}/api/cases/${createdCaseId}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: authHeader },
            body: JSON.stringify({
                content: "Identified initial funding link to cold storage.",
                category: "HYPOTHESIS",
            }),
        });
        assert.strictEqual(noteRes.status, 200);

        // Fetch Live Multi-Wallet Dossier (RE-FETCHES FRESH ON-CHAIN DATA)
        const dossierRes = await fetch(`${baseUrl}/api/cases/${createdCaseId}/live-dossier`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(dossierRes.status, 200);
        const dossierData = await dossierRes.json();
        assert.strictEqual(dossierData.success, true);
        assert.ok(dossierData.dossier.aggregatedCaseMetrics);
        assert.strictEqual(dossierData.dossier.aggregatedCaseMetrics.totalAddressesTracked, 1);
        assert.ok(Array.isArray(dossierData.dossier.wallets));
        assert.strictEqual(dossierData.dossier.wallets[0].address, "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(typeof dossierData.dossier.wallets[0].liveMetrics.riskScore === "number");
    });

    // =========================================================================
    // 17. CONFIGURABLE RISK RULE ENGINE
    // =========================================================================
    await t.test("17. Configurable Risk Rule Engine - Stores analyst thresholds and simulates dynamic score", async () => {
        // Fetch Config
        const getRes = await fetch(`${baseUrl}/api/risk-rules/config`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(getRes.status, 200);
        const getConfig = await getRes.json();
        assert.strictEqual(getConfig.success, true);
        assert.ok(getConfig.config.dustThresholdSat >= 100);

        // Update to Strict Compliance
        const updateRes = await fetch(`${baseUrl}/api/risk-rules/config`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: authHeader },
            body: JSON.stringify({
                presetName: "STRICT_COMPLIANCE",
            }),
        });
        assert.strictEqual(updateRes.status, 200);
        const updatedConfig = await updateRes.json();
        assert.strictEqual(updatedConfig.config.presetName, "STRICT_COMPLIANCE");
        assert.strictEqual(updatedConfig.config.maxPropagationHops, 3);
    });

    // =========================================================================
    // 18. ALERT TRIAGE / SEVERITY QUEUE
    // =========================================================================
    await t.test("18. Alert Triage Queue - Ranks by composite severity and allows 1-click case escalation", async () => {
        // Log an incoming triage alert
        const loggedAlert = await alertTriageService.logAlert(mockUserId, {
            address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
            alertType: "DUSTING_ATTACK",
            dustingHazard: "HIGH",
            cddSpike: 120,
            title: "Severe Dusting Micro-Deposit Wave",
            summary: "Multiple unsolicited dust outputs detected.",
        });

        assert.ok(loggedAlert._id);
        assert.ok(loggedAlert.severityScore >= 40);

        // Query Triage Queue via API
        const queueRes = await fetch(`${baseUrl}/api/forensics/triage/queue`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(queueRes.status, 200);
        const queueData = await queueRes.json();
        assert.strictEqual(queueData.success, true);
        assert.ok(queueData.queue.length >= 1);
        assert.ok(queueData.metrics.unreadCount >= 1);

        // Escalate Alert to Case in 1 click
        const escalateRes = await fetch(`${baseUrl}/api/forensics/triage/${loggedAlert._id}/escalate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: authHeader },
            body: JSON.stringify({
                caseTitle: "Escalated Dusting Investigation",
            }),
        });
        assert.strictEqual(escalateRes.status, 201);
        const escalateData = await escalateRes.json();
        assert.strictEqual(escalateData.success, true);
        assert.strictEqual(escalateData.alert.triageStatus, "ESCALATED_TO_CASE");
        assert.ok(escalateData.createdCase._id);

        // Cleanup
        if (createdCaseId) await caseService.deleteCase(createdCaseId, mockUserId).catch(() => {});
        if (escalateData.createdCase._id) await caseService.deleteCase(escalateData.createdCase._id, mockUserId).catch(() => {});
    });

    await new Promise((resolve) => server.close(resolve));
});
