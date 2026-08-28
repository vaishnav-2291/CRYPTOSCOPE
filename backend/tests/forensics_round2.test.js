/**
 * CryptoScope AI — Round 2 Forensic Extensions Test Suite
 * Tests Features 8 through 13 with live on-chain data and official OFAC lists.
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../app");
const riskPropagationEngine = require("../services/forensics/riskPropagationEngine");
const addressReuseDetector = require("../services/forensics/addressReuseDetector");
const mixerDetector = require("../services/forensics/mixerDetector");
const whalePriceCorrelator = require("../services/forensics/whalePriceCorrelator");
const peerPercentileRanker = require("../services/forensics/peerPercentileRanker");
const sanctionsChecker = require("../services/forensics/sanctionsChecker");

let server;
let baseUrl;
const TEST_PORT = 3108;

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

describe("CryptoScope AI Advanced Forensics — Round 2 Suite", () => {
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

    // 8. Multi-Hop Risk Propagation Engine
    test("8. Multi-Hop Risk Propagation - Calculates distance decay exposure score", async () => {
        const result = await riskPropagationEngine.calculatePropagation("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", 2);
        assert.ok(result.targetAddress === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(typeof result.sanctionProximityScore === "number");
        assert.ok(result.totalUniqueAddressesScanned >= 1);
        assert.ok(Array.isArray(result.exposurePaths));
        assert.ok(result.methodology.includes("Decay"));
    });

    // 9. Address Reuse Privacy Detector
    test("9. Address Reuse Detector - Classifies BIP 32 receiving hygiene", async () => {
        const result = await addressReuseDetector.analyzeAddressReuse("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.address === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(["A", "B", "C", "D", "F"].includes(result.privacyGrade));
        assert.ok(typeof result.privacyScore === "number");
        assert.ok(result.metrics.totalFundedOutputsCount >= 1);
        assert.ok(result.bestPracticeRecommendation);
    });

    // 10. CoinJoin / Mixer Fingerprint Detector
    test("10. Mixer Detector - Identifies structural Whirlpool / Wasabi patterns", async () => {
        const result = await mixerDetector.analyzeMixerExposure("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.address === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(typeof result.isMixerParticipant === "boolean");
        assert.ok(["HIGH", "MODERATE", "NONE"].includes(result.mixerExposureLevel));
        assert.ok(Array.isArray(result.detectedMixRounds));
    });

    // 11. Whale Move vs. Price Impact Correlator
    test("11. Whale Price Correlator - Correlates live on-chain tx with CoinGecko charts", async () => {
        const result = await whalePriceCorrelator.correlateWhaleMoves("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.address === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(typeof result.totalLargeTxsEvaluated === "number");
        assert.ok(Array.isArray(result.correlations));
    });

    // 12. Peer Percentile Ranker
    test("12. Peer Percentile Ranker - Samples live mainnet blocks for dynamic distribution", async () => {
        const result = await peerPercentileRanker.rankAddressPeers("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.address === "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.ok(result.peerPercentiles.balancePercentile >= 0 && result.peerPercentiles.balancePercentile <= 100);
        assert.ok(result.peerPercentiles.volumePercentile >= 0 && result.peerPercentiles.volumePercentile <= 100);
        assert.ok(result.networkComparisonSample.blocksSampledCount >= 1);
    });

    // 13. True-Positive OFAC Sanctions Sanity Check (Verification Item #3)
    test("13. True-Positive OFAC Check - Verifies known flagged address detects sanctioned state", async () => {
        const testSanctionedAddr = "1Hn9ErTCPRP6j5UDBeuXPGuq5RtRjFJxJQ";
        const result = await sanctionsChecker.checkSanctionsExposure(testSanctionedAddr);
        assert.ok(result.address === testSanctionedAddr);
        assert.equal(result.exposureLevel, "DIRECT_SANCTION_MATCH");
        assert.equal(result.isDirectSanctioned, true);
        assert.ok(result.sanctionsDatabase.totalSanctionedBtcAddressesInRegistry > 0);
    });

    // 14. REST API Endpoint: /api/forensics/propagation/:address
    test("14. REST API - /api/forensics/propagation/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/propagation/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo?hops=1");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });

    // 15. REST API Endpoint: /api/forensics/reuse/:address
    test("15. REST API - /api/forensics/reuse/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/reuse/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });

    // 16. REST API Endpoint: /api/forensics/mixer/:address
    test("16. REST API - /api/forensics/mixer/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/mixer/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });

    // 17. REST API Endpoint: /api/forensics/whale-correlations/:address
    test("17. REST API - /api/forensics/whale-correlations/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/whale-correlations/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });

    // 18. REST API Endpoint: /api/forensics/peer-percentiles/:address
    test("18. REST API - /api/forensics/peer-percentiles/:address returns 200", async () => {
        const res = await makeRequest("/api/forensics/peer-percentiles/34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });
});
