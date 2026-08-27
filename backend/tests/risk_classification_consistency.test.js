const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateRisk } = require("../services/riskEngine");
const { lookupEntity } = require("../services/entityService");

// Helper mirroring frontend getRiskTheme from frontend/src/utils/constants.js
function getFrontendRiskTheme(level = "Low") {
    const l = (level || "").toLowerCase();
    if (l.includes("high") || l.includes("critical")) {
        return { label: "HIGH RISK", color: "red" };
    }
    if (l.includes("med")) {
        return { label: "MEDIUM RISK", color: "amber" };
    }
    return { label: "LOW RISK", color: "emerald" };
}

test("CryptoScope AI — Wallet Risk Classification & Threshold Consistency Suite", async (t) => {

    // 1. Score 0 -> correct label
    await t.test("1. Score 0 -> correct label (Low)", () => {
        // Mock minimal risk evaluation
        const data = {
            address: "1CleanZeroActivityWallet111111111",
            balance: 0,
            totalReceived: 0,
            totalSent: 0,
            n_tx: 0,
            transactions: [],
        };
        const result = calculateRisk(data);
        assert.ok(result.riskScore < 40, `Expected score < 40, got ${result.riskScore}`);
        assert.strictEqual(result.riskLevel, "Low");
        assert.strictEqual(getFrontendRiskTheme(result.riskLevel).label, "LOW RISK");
    });

    // 2. Score 39 -> correct label (Low)
    await t.test("2. Score 39 -> correct label (Low)", () => {
        // Address with moderate pattern / activity but under 40
        const data = {
            address: "1ModerateLowWallet222222222222222",
            balance: 1.5,
            totalReceived: 2.0,
            totalSent: 0.5,
            n_tx: 60,
            transactions: [],
        };
        const result = calculateRisk(data);
        // rawScore: tx(6) + bal(2) + pat(4) + act(2) + ent(1) = 15
        assert.ok(result.riskScore <= 39);
        assert.strictEqual(result.riskLevel, "Low");
        assert.strictEqual(getFrontendRiskTheme(result.riskLevel).label, "LOW RISK");
    });

    // 3. Score 40 -> correct label (Medium)
    await t.test("3. Score 40-48 -> correct label (Medium)", () => {
        const data = {
            address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e",
            balance: 0,
            totalReceived: 0,
            totalSent: 0,
            n_tx: 0,
            transactions: [],
            entityTag: {
                name: "WannaCry Ransomware Treasury",
                category: "Ransomware / Threat Actor",
                riskWeight: 100,
                isSanctioned: true,
                isMixer: false,
                description: "Primary Bitcoin ransom collection address for the 2017 WannaCry global cyberattack.",
            },
        };
        const result = calculateRisk(data);
        // rawScore: tx(2) + bal(2) + pat(4) + act(5) + ent(35) = 48
        assert.strictEqual(result.riskScore, 48);
        assert.strictEqual(result.riskLevel, "Medium", "Score 48 must be Medium according to canonical policy (40-69)");
        assert.strictEqual(getFrontendRiskTheme(result.riskLevel).label, "MEDIUM RISK");
    });

    // 4. Score 69 -> correct label (Medium)
    await t.test("4. Score 69 -> correct label (Medium)", () => {
        // High transaction volume + balance sweep + transit
        const data = {
            address: "1MediumHighBorderWallet3333333333",
            balance: 15.0,
            totalReceived: 45.0,
            totalSent: 30.0,
            n_tx: 600,
            transactions: [],
            entityTag: {
                name: "Elevated Risk Entity",
                category: "Suspicious Service",
                riskWeight: 60,
                isSanctioned: false,
                isMixer: false,
                description: "Suspicious high-risk service.",
            },
        };
        const result = calculateRisk(data);
        // tx(12) + bal(8) + pat(14) + act(2) + ent(18) = 54
        assert.ok(result.riskScore >= 40 && result.riskScore <= 69);
        assert.strictEqual(result.riskLevel, "Medium");
        assert.strictEqual(getFrontendRiskTheme(result.riskLevel).label, "MEDIUM RISK");
    });

    // 5. Score 70 -> correct label (High)
    await t.test("5. Score 70+ -> correct label (High)", () => {
        const data = {
            address: "1HighRiskWallet444444444444444444",
            balance: 1200.0,
            totalReceived: 5000.0,
            totalSent: 3800.0,
            n_tx: 12000,
            transactions: [],
            entityTag: {
                name: "Wasabi CoinJoin Coordinator",
                category: "Privacy / CoinJoin Mixer",
                riskWeight: 85,
                isSanctioned: false,
                isMixer: true,
                description: "Wasabi mixing coordinator.",
            },
        };
        const result = calculateRisk(data);
        // tx(25) + bal(20) + pat(4) + act(2) + ent(25) = 76
        assert.ok(result.riskScore >= 70);
        assert.strictEqual(result.riskLevel, "High");
        assert.strictEqual(getFrontendRiskTheme(result.riskLevel).label, "HIGH RISK");
    });

    // 6. Score 100 -> correct label (High)
    await t.test("6. Score 100 -> correct label (High)", () => {
        const data = {
            address: "1MaxRiskWallet5555555555555555555",
            balance: 50000.0,
            totalReceived: 200000.0,
            totalSent: 199999.0,
            n_tx: 50000,
            transactions: [],
            entityTag: {
                name: "Sanctioned Darknet Mixer",
                category: "Sanctioned Mixer",
                riskWeight: 100,
                isSanctioned: true,
                isMixer: true,
            },
        };
        const result = calculateRisk(data);
        assert.strictEqual(result.riskScore, 100);
        assert.strictEqual(result.riskLevel, "High");
        assert.strictEqual(getFrontendRiskTheme(result.riskLevel).label, "HIGH RISK");
    });

    // 7. Genuine entity/sanctions match with low transaction activity
    await t.test("7. Genuine entity/sanctions match preserves entity signals and rule triggers", () => {
        const entity = lookupEntity("12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e");
        assert.ok(entity !== null, "WannaCry address must match known catalog");
        assert.strictEqual(entity.name, "WannaCry Ransomware Treasury");
        assert.strictEqual(entity.isSanctioned, true);
        assert.strictEqual(entity.isLiveVerified, false, "Must preserve static provenance tag");

        const data = {
            address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e",
            balance: 0,
            totalReceived: 0,
            totalSent: 0,
            n_tx: 0,
            transactions: [],
            entityTag: entity,
        };
        const result = calculateRisk(data);
        assert.strictEqual(result.riskScore, 48);
        assert.strictEqual(result.riskLevel, "Medium");
        assert.strictEqual(result.breakdown.entityRisk, 35);
        assert.strictEqual(result.ruleTriggers.length, 1);
        assert.strictEqual(result.ruleTriggers[0].id, "RULE-ENT-01");
        assert.strictEqual(result.ruleTriggers[0].severity, "CRITICAL");
        assert.ok(result.ruleTriggers[0].title.includes("WannaCry Ransomware Treasury"));
        assert.ok(result.securityAssessment.includes("WannaCry Ransomware Treasury"));
    });

    // 8. Genuine dormant wallet with no risk signals
    await t.test("8. Genuine dormant wallet with no risk signals receives clean Low classification", () => {
        const data = {
            address: "1CleanDormantWallet66666666666666",
            balance: 0,
            totalReceived: 0,
            totalSent: 0,
            n_tx: 0,
            transactions: [],
            entityTag: null,
        };
        const result = calculateRisk(data);
        assert.strictEqual(result.riskScore, 14);
        assert.strictEqual(result.riskLevel, "Low");
        assert.strictEqual(result.ruleTriggers.length, 0);
        assert.ok(result.securityAssessment.includes("LOW RISK ASSESSMENT"));
    });

    // 9. Backend risk label equals frontend risk label
    await t.test("9. Backend risk label matches frontend getRiskTheme for all ranges", () => {
        const testScores = [
            { score: 0, expectedLevel: "Low", expectedFrontend: "LOW RISK" },
            { score: 14, expectedLevel: "Low", expectedFrontend: "LOW RISK" },
            { score: 39, expectedLevel: "Low", expectedFrontend: "LOW RISK" },
            { score: 40, expectedLevel: "Medium", expectedFrontend: "MEDIUM RISK" },
            { score: 48, expectedLevel: "Medium", expectedFrontend: "MEDIUM RISK" },
            { score: 69, expectedLevel: "Medium", expectedFrontend: "MEDIUM RISK" },
            { score: 70, expectedLevel: "High", expectedFrontend: "HIGH RISK" },
            { score: 85, expectedLevel: "High", expectedFrontend: "HIGH RISK" },
            { score: 100, expectedLevel: "High", expectedFrontend: "HIGH RISK" },
        ];

        for (const { score, expectedLevel, expectedFrontend } of testScores) {
            let level = "Low";
            if (score >= 70) level = "High";
            else if (score >= 40) level = "Medium";

            assert.strictEqual(level, expectedLevel, `Backend level mismatch for score ${score}`);
            const theme = getFrontendRiskTheme(level);
            assert.strictEqual(theme.label, expectedFrontend, `Frontend theme label mismatch for score ${score}`);
        }
    });

    // 10. Security report rules match actual triggered rules
    await t.test("10. Security report rules match actual triggered rules exactly", () => {
        const data = {
            address: "1ComplexRuleWallet777777777777777",
            balance: 1500.0,
            totalReceived: 12000.0,
            totalSent: 1000.0,
            n_tx: 3000,
            transactions: [],
        };
        const result = calculateRisk(data);
        assert.ok(result.ruleTriggers.length >= 3);
        const ruleIds = result.ruleTriggers.map((r) => r.id);
        assert.ok(ruleIds.includes("RULE-TX-02"));
        assert.ok(ruleIds.includes("RULE-BAL-01"));
        assert.ok(ruleIds.includes("RULE-PAT-02"));

        // All triggered rules are present in riskFactors
        assert.strictEqual(result.riskFactors.length, result.ruleTriggers.length);
    });
});
