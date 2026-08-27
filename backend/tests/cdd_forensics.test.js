const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../app");
const coinDaysDestroyedDetector = require("../services/forensics/coinDaysDestroyedDetector");
const explainabilityService = require("../services/forensics/explainabilityService");

test("CryptoScope AI — Feature #14 Coin Days Destroyed (CDD) Test Suite", async (t) => {
    const testAddress = "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo";

    // 1. Direct Service Call
    await t.test("1. Computes live Coin Days Destroyed metrics for address", async () => {
        const result = await coinDaysDestroyedDetector.analyzeCoinDaysDestroyed(testAddress);
        assert.strictEqual(result.address, testAddress);
        assert.ok(typeof result.metrics.totalCoinDaysDestroyed === "number");
        assert.ok(typeof result.metrics.maxSingleTxCdd === "number");
        assert.ok(typeof result.metrics.averageCoinAgeDays === "number");
        assert.ok(result.dormancyClassification.reactivationSignal);
        assert.ok(result.heuristicDisclaimer.includes("Heuristic indicator"));
    });

    // 2. Integration with Explainability Service
    await t.test("2. Explainability Service integrates CDD dormancy signals", async () => {
        const result = await explainabilityService.generateExplainabilityReport(testAddress);
        assert.strictEqual(result.address, testAddress);
        assert.ok(Array.isArray(result.triggeredRules));
        assert.ok(result.totalRulesEvaluated >= 14);
    });

    // 3. REST API: GET /api/forensics/cdd/:address
    await t.test("3. REST API - /api/forensics/cdd/:address returns 200 with live CDD telemetry", async () => {
        const server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, resolve));
        const port = server.address().port;
        const baseUrl = `http://localhost:${port}`;

        try {
            const res = await fetch(`${baseUrl}/api/forensics/cdd/${testAddress}`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.address, testAddress);
            assert.ok(data.metrics);
            assert.ok(data.dormancyClassification);
        } finally {
            server.close();
            setTimeout(() => process.exit(0), 100);
        }
    });
});
