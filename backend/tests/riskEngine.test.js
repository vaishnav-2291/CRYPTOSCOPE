const test = require("node:test");
const assert = require("node:assert");
const { calculateRisk } = require("../services/riskEngine");

test("Risk Engine - Low Risk Dormant/Genesis Wallet", () => {
    const data = {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        balance: 50.0,
        totalReceived: 50.0,
        totalSent: 0,
        n_tx: 1,
        transactions: [],
        entityTag: {
            name: "Satoshi Nakamoto Genesis",
            category: "Historic / Genesis",
            riskWeight: 0,
            isSanctioned: false,
            isMixer: false,
        },
    };

    const result = calculateRisk(data);
    assert.strictEqual(result.riskLevel, "Low");
    assert.ok(result.riskScore < 40, `Expected score < 40, got ${result.riskScore}`);
    assert.ok(result.breakdown.transactionRisk <= 25);
    assert.ok(result.breakdown.balanceRisk <= 20);
    assert.ok(result.breakdown.patternRisk <= 25);
    assert.ok(result.breakdown.activityRisk <= 15);
    assert.ok(result.breakdown.entityRisk <= 35);
});

test("Risk Engine - High Risk Sanctioned / Ransomware Wallet", () => {
    const data = {
        address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e",
        balance: 120.0,
        totalReceived: 500.0,
        totalSent: 380.0,
        n_tx: 3500,
        transactions: [],
        entityTag: {
            name: "WannaCry Ransomware",
            category: "Ransomware / Threat Actor",
            riskWeight: 100,
            isSanctioned: true,
            isMixer: false,
            description: "Primary Bitcoin ransom collection address.",
        },
    };

    const result = calculateRisk(data);
    assert.strictEqual(result.riskLevel, "High");
    assert.ok(result.riskScore >= 70, `Expected score >= 70, got ${result.riskScore}`);
    assert.strictEqual(result.breakdown.entityRisk, 35); // Max sanctions penalty
    const hasCriticalRule = result.ruleTriggers.some((r) => r.severity === "CRITICAL");
    assert.strictEqual(hasCriticalRule, true);
});

test("Risk Engine - Pass-Through / Churn Transit Pattern", () => {
    const data = {
        address: "1TransitWalletExampleAddress12345678",
        balance: 0.00005,
        totalReceived: 15.0,
        totalSent: 14.99995, // 99.9% pass-through turnover
        n_tx: 80,
        transactions: [],
    };

    const result = calculateRisk(data);
    const passThroughRule = result.ruleTriggers.find((r) => r.id === "RULE-PAT-01");
    assert.ok(passThroughRule, "Expected RULE-PAT-01 (Pass-Through Pattern) to trigger");
    assert.strictEqual(passThroughRule.severity, "HIGH");
    assert.ok(result.breakdown.patternRisk >= 18);
});

test("Risk Engine - Score is capped between 0 and 100", () => {
    // Over-saturated risk payload
    const maxData = {
        address: "1ExtremeRiskTestAddress1234567890",
        balance: 50000.0,
        totalReceived: 200000.0,
        totalSent: 199999.0,
        n_tx: 50000,
        transactions: [],
        entityTag: {
            name: "Sanctioned Mixer",
            isSanctioned: true,
            isMixer: true,
        },
    };

    const result = calculateRisk(maxData);
    assert.strictEqual(result.riskScore, 100);
    assert.strictEqual(result.riskLevel, "High");
});
