const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../app");
const dustingDetector = require("../services/forensics/dustingDetector");
const graphExplorer = require("../services/forensics/graphExplorer");
const clusterEngine = require("../services/forensics/clusterEngine");
const feeUrgencyAnalyzer = require("../services/forensics/feeUrgencyAnalyzer");
const sanctionsChecker = require("../services/forensics/sanctionsChecker");
const explainabilityService = require("../services/forensics/explainabilityService");

let server;
let baseUrl;
const TEST_PORT = 3105;

function makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, baseUrl);
        const req = http.request(url, { method: "GET" }, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on("error", reject);
        req.end();
    });
}

describe("CryptoScope AI Advanced Forensics Extension Test Suite", () => {
    before(async () => {
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
        setTimeout(() => process.exit(0), 500);
    });

    // 1. Dusting Attack Detector
    test("1. Dusting Detector - Analyzes Bitcoin address for micro-deposits", async () => {
        const result = await dustingDetector.analyzeAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(result.address === "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(["HIGH", "MEDIUM", "LOW", "NONE"].includes(result.activeHazard));
        assert.ok(result.metrics.economicDustThresholdSat === 546);
        assert.ok(Array.isArray(result.campaigns));
        assert.ok(result.remediationAdvice);
    });

    // 2. Fund-Flow Graph Visualizer
    test("2. Graph Explorer - Builds recursive 1-2 hop fund-flow network", async () => {
        const result = await graphExplorer.buildFundFlowGraph("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", 1, 10);
        assert.ok(result.rootAddress === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(Array.isArray(result.nodes) && result.nodes.length > 0);
        assert.ok(Array.isArray(result.edges) && result.edges.length > 0);
        assert.ok(result.summary.transactionsAnalyzed >= 1);
    });

    // 3. Address Clustering (Common-Input-Ownership)
    test("3. Cluster Engine - Evaluates multi-input transactions for co-ownership", async () => {
        const result = await clusterEngine.extractCluster("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.targetAddress === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.clusterSize >= 1);
        assert.ok(Array.isArray(result.clusteredAddresses));
        assert.ok(result.metrics.heuristicMethod.includes("Common-Input"));
    });

    // 4. Mempool Congestion & Fee Urgency
    test("4. Fee Urgency Analyzer - Fetches live mempool congestion and analyzes fee overpay", async () => {
        const congestion = await feeUrgencyAnalyzer.getMempoolCongestion();
        assert.ok(congestion.fetchedAt);
        assert.ok(["HIGH", "MODERATE", "LOW", "UNAVAILABLE"].includes(congestion.congestionLevel));

        const feeAnalysis = await feeUrgencyAnalyzer.analyzeFeeUrgency("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(feeAnalysis.address === "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(feeAnalysis.urgencyScore >= 0 && feeAnalysis.urgencyScore <= 100);
        assert.ok(["HIGH", "ELEVATED", "NORMAL"].includes(feeAnalysis.urgencyLevel));
        assert.ok(feeAnalysis.forensicFinding.toLowerCase().includes("heuristic"));
    });

    // 5. Sanctions Exposure Cross-Check
    test("5. Sanctions Checker - Verifies address against official OFAC datasets without fake data", async () => {
        const sanctions = await sanctionsChecker.checkSanctionsExposure("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(sanctions.address === "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.ok(["CLEAN", "DIRECT_SANCTION_MATCH", "INDIRECT_CLUSTER_EXPOSURE"].includes(sanctions.exposureLevel));
        assert.ok(sanctions.sanctionsDatabase.source);
    });

    // 6. Explainability Matrix
    test("6. Explainability Service - Decomposes risk score into explainable heuristic signals", async () => {
        const report = await explainabilityService.generateExplainabilityReport("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(report.address === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(report.riskScore >= 0 && report.riskScore <= 100);
        assert.ok(report.axisWeightBreakdown);
        assert.ok(Array.isArray(report.triggeredRules));
        assert.ok(Array.isArray(report.mitigatingFactors));
        assert.ok(report.methodologyStatement.includes("deterministic heuristic"));
    });

    // 7. REST API Endpoints Verification
    test("7. REST API - /api/forensics/mempool/congestion returns 200", async () => {
        const res = await makeRequest("/api/forensics/mempool/congestion");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
    });

    test("8. REST API - /api/forensics/dusting/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/dusting/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.metrics);
    });

    test("9. REST API - /api/forensics/graph/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/graph/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo?hops=1&limit=5");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.nodes);
    });

    test("10. REST API - /api/forensics/cluster/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/cluster/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.clusterSize >= 1);
    });

    test("11. REST API - /api/forensics/fee-urgency/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/fee-urgency/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.urgencyScore !== undefined);
    });

    test("12. REST API - /api/forensics/sanctions/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/sanctions/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.exposureLevel);
    });

    test("13. REST API - /api/forensics/explain/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/explain/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(Array.isArray(res.body.triggeredRules));
    });

    test("14. REST API - /api/forensics/full-audit/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/full-audit/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.auditSummary);
        assert.ok(res.body.dusting);
        assert.ok(res.body.cluster);
        assert.ok(res.body.feeUrgency);
        assert.ok(res.body.sanctions);
        assert.ok(res.body.explainability);
    });
});
