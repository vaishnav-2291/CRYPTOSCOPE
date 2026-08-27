/**
 * CryptoScope AI — Investigation Case Workspace Controller
 */

const caseService = require("../services/forensics/caseService");

exports.createCase = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const result = await caseService.createCase(userId, req.body);
        return res.status(201).json({ success: true, case: result });
    } catch (err) {
        console.error("[CaseController] Create case error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to create investigation case." });
    }
};

exports.getUserCases = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const result = await caseService.getUserCases(userId);
        return res.status(200).json({ success: true, cases: result });
    } catch (err) {
        console.error("[CaseController] Get cases error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to fetch cases." });
    }
};

exports.getCaseById = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;
        const result = await caseService.getCaseById(id, userId);
        return res.status(200).json({ success: true, case: result });
    } catch (err) {
        console.error("[CaseController] Get case error:", err.message);
        return res.status(404).json({ success: false, message: err.message || "Case not found." });
    }
};

exports.getCaseLiveDossier = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;
        const result = await caseService.getCaseLiveDossier(id, userId);
        return res.status(200).json({ success: true, dossier: result });
    } catch (err) {
        console.error("[CaseController] Live dossier error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to compile live dossier." });
    }
};

exports.updateCase = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;
        const result = await caseService.updateCase(id, userId, req.body);
        return res.status(200).json({ success: true, case: result });
    } catch (err) {
        console.error("[CaseController] Update case error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to update case." });
    }
};

exports.addAddressToCase = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;
        const result = await caseService.addAddressToCase(id, userId, req.body);
        return res.status(200).json({ success: true, case: result });
    } catch (err) {
        console.error("[CaseController] Add address error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to add address to case." });
    }
};

exports.removeAddressFromCase = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id, address } = req.params;
        const result = await caseService.removeAddressFromCase(id, userId, address);
        return res.status(200).json({ success: true, case: result });
    } catch (err) {
        console.error("[CaseController] Remove address error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to remove address." });
    }
};

exports.addTimelineNote = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;
        const result = await caseService.addTimelineNote(id, userId, req.body);
        return res.status(200).json({ success: true, case: result });
    } catch (err) {
        console.error("[CaseController] Add note error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to add timeline note." });
    }
};

exports.deleteCase = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;
        const result = await caseService.deleteCase(id, userId);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[CaseController] Delete case error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to delete case." });
    }
};
