/**
 * CryptoScope AI — Forensic Intelligence Controller (Round 1 + Round 2 Extensions)
 */

const dustingDetector = require("../services/forensics/dustingDetector");
const graphExplorer = require("../services/forensics/graphExplorer");
const clusterEngine = require("../services/forensics/clusterEngine");
const feeUrgencyAnalyzer = require("../services/forensics/feeUrgencyAnalyzer");
const sanctionsChecker = require("../services/forensics/sanctionsChecker");
const explainabilityService = require("../services/forensics/explainabilityService");
const riskPropagationEngine = require("../services/forensics/riskPropagationEngine");
const addressReuseDetector = require("../services/forensics/addressReuseDetector");
const mixerDetector = require("../services/forensics/mixerDetector");
const whalePriceCorrelator = require("../services/forensics/whalePriceCorrelator");
const peerPercentileRanker = require("../services/forensics/peerPercentileRanker");

// =============================================================================
// ROUND 1 ENDPOINTS
// =============================================================================

exports.getDustingAnalysis = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await dustingDetector.analyzeAddress(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Dusting analysis error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to analyze dusting attacks." });
    }
};

exports.getFundFlowGraph = async (req, res) => {
    try {
        const { address } = req.params;
        const hops = parseInt(req.query.hops) || 2;
        const limit = parseInt(req.query.limit) || 20;
        const result = await graphExplorer.buildFundFlowGraph(address, Math.min(hops, 2), Math.min(limit, 30));
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Graph analysis error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to build fund flow graph." });
    }
};

exports.getClusteringAnalysis = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await clusterEngine.extractCluster(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Clustering error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to analyze address cluster." });
    }
};

exports.getFeeUrgencyAnalysis = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await feeUrgencyAnalyzer.analyzeFeeUrgency(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Fee urgency error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to analyze fee urgency." });
    }
};

exports.getLiveMempoolCongestion = async (req, res) => {
    try {
        const result = await feeUrgencyAnalyzer.getMempoolCongestion();
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Mempool congestion error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to fetch mempool congestion." });
    }
};

exports.getSanctionsCheck = async (req, res) => {
    try {
        const { address } = req.params;
        const clusterRes = await clusterEngine.extractCluster(address).catch(() => null);
        const clusterAddrs = (clusterRes?.clusteredAddresses || []).map((a) => a.address);

        const result = await sanctionsChecker.checkSanctionsExposure(address, clusterAddrs);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Sanctions check error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to verify sanctions exposure." });
    }
};

exports.getExplainabilityReport = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await explainabilityService.generateExplainabilityReport(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Explainability error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to generate explainability report." });
    }
};

// =============================================================================
// ROUND 2 ENDPOINTS
// =============================================================================

exports.getRiskPropagation = async (req, res) => {
    try {
        const { address } = req.params;
        const hops = parseInt(req.query.hops) || 2;
        const result = await riskPropagationEngine.calculatePropagation(address, hops);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Propagation error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to calculate risk propagation." });
    }
};

exports.getAddressReuse = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await addressReuseDetector.analyzeAddressReuse(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Address reuse error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to analyze address reuse." });
    }
};

exports.getMixerDetection = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await mixerDetector.analyzeMixerExposure(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Mixer detection error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to analyze mixer detection." });
    }
};

exports.getWhaleCorrelations = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await whalePriceCorrelator.correlateWhaleMoves(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Whale correlation error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to correlate whale moves." });
    }
};

exports.getPeerPercentiles = async (req, res) => {
    try {
        const { address } = req.params;
        const result = await peerPercentileRanker.rankAddressPeers(address);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[ForensicsController] Peer percentile error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to rank peer percentiles." });
    }
};

// =============================================================================
// CONSOLIDATED FULL AUDIT (ROUND 1 + ROUND 2)
// =============================================================================

exports.getFullForensicAudit = async (req, res) => {
    try {
        const { address } = req.params;
        const cleanAddr = address.trim();

        const [
            dusting,
            cluster,
            feeUrgency,
            sanctions,
            explainability,
            propagation,
            reuse,
            mixer,
            whale,
            percentile,
        ] = await Promise.all([
            dustingDetector.analyzeAddress(cleanAddr).catch((e) => ({ error: e.message })),
            clusterEngine.extractCluster(cleanAddr).catch((e) => ({ error: e.message })),
            feeUrgencyAnalyzer.analyzeFeeUrgency(cleanAddr).catch((e) => ({ error: e.message })),
            sanctionsChecker.checkSanctionsExposure(cleanAddr).catch((e) => ({ error: e.message })),
            explainabilityService.generateExplainabilityReport(cleanAddr).catch((e) => ({ error: e.message })),
            riskPropagationEngine.calculatePropagation(cleanAddr, 1).catch((e) => ({ error: e.message })),
            addressReuseDetector.analyzeAddressReuse(cleanAddr).catch((e) => ({ error: e.message })),
            mixerDetector.analyzeMixerExposure(cleanAddr).catch((e) => ({ error: e.message })),
            whalePriceCorrelator.correlateWhaleMoves(cleanAddr).catch((e) => ({ error: e.message })),
            peerPercentileRanker.rankAddressPeers(cleanAddr).catch((e) => ({ error: e.message })),
        ]);

        return res.status(200).json({
            success: true,
            address: cleanAddr,
            auditSummary: {
                dustingAttackHazard: dusting.activeHazard || "UNKNOWN",
                clusterSize: cluster.clusterSize || 1,
                feeUrgencyLevel: feeUrgency.urgencyLevel || "NORMAL",
                sanctionsExposure: sanctions.exposureLevel || "CLEAN",
                overallRiskScore: explainability.riskScore || 0,
                propagationExposureScore: propagation.sanctionProximityScore || 0,
                privacyGrade: reuse.privacyGrade || "A",
                mixerExposure: mixer.mixerExposureLevel || "NONE",
                topBalancePercentileTier: percentile.peerPercentiles?.topBalanceTier || "Top 50%",
            },
            dusting,
            cluster,
            feeUrgency,
            sanctions,
            explainability,
            propagation,
            reuse,
            mixer,
            whale,
            percentile,
            auditedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error("[ForensicsController] Full forensic audit error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to execute complete forensic audit." });
    }
};
