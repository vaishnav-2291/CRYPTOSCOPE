import api from "./api";

/**
 * CryptoScope AI — Forensic Intelligence Client API (Round 1 + Round 2)
 */
export const forensicsApi = {
  // ===========================================================================
  // ROUND 1 METHODS
  // ===========================================================================

  getDustingAnalysis: async (address) => {
    const res = await api.get(`/forensics/dusting/${address}`);
    return res.data;
  },

  getFundFlowGraph: async (address, hops = 2, limit = 20) => {
    const res = await api.get(`/forensics/graph/${address}?hops=${hops}&limit=${limit}`);
    return res.data;
  },

  getClusteringAnalysis: async (address) => {
    const res = await api.get(`/forensics/cluster/${address}`);
    return res.data;
  },

  getFeeUrgencyAnalysis: async (address) => {
    const res = await api.get(`/forensics/fee-urgency/${address}`);
    return res.data;
  },

  getMempoolCongestion: async () => {
    const res = await api.get(`/forensics/mempool/congestion`);
    return res.data;
  },

  getSanctionsCheck: async (address) => {
    const res = await api.get(`/forensics/sanctions/${address}`);
    return res.data;
  },

  getExplainabilityReport: async (address) => {
    const res = await api.get(`/forensics/explain/${address}`);
    return res.data;
  },

  // ===========================================================================
  // ROUND 2 METHODS
  // ===========================================================================

  getRiskPropagation: async (address, hops = 2) => {
    const res = await api.get(`/forensics/propagation/${address}?hops=${hops}`);
    return res.data;
  },

  getAddressReuse: async (address) => {
    const res = await api.get(`/forensics/reuse/${address}`);
    return res.data;
  },

  getMixerDetection: async (address) => {
    const res = await api.get(`/forensics/mixer/${address}`);
    return res.data;
  },

  getWhaleCorrelations: async (address) => {
    const res = await api.get(`/forensics/whale-correlations/${address}`);
    return res.data;
  },

  getPeerPercentiles: async (address) => {
    const res = await api.get(`/forensics/peer-percentiles/${address}`);
    return res.data;
  },

  getCoinDaysDestroyed: async (address) => {
    const res = await api.get(`/forensics/cdd/${address}`);
    return res.data;
  },

  // ===========================================================================
  // ROUND 3 METHODS (ANALYST-GRADE UPGRADES)
  // ===========================================================================

  // Threat Radar
  getThreatRadarFeed: async (limit = 30) => {
    const res = await api.get(`/forensics/radar/feed?limit=${limit}`);
    return res.data;
  },

  getThreatRadarStats: async () => {
    const res = await api.get(`/forensics/radar/stats`);
    return res.data;
  },

  // Alert Triage Queue
  getTriageQueue: async ({ status, priority, limit } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);
    if (limit) params.append("limit", limit);
    const res = await api.get(`/forensics/triage/queue?${params.toString()}`);
    return res.data;
  },

  updateTriageStatus: async (alertId, status) => {
    const res = await api.put(`/forensics/triage/${alertId}/status`, { status });
    return res.data;
  },

  escalateTriageAlert: async (alertId, data) => {
    const res = await api.post(`/forensics/triage/${alertId}/escalate`, data);
    return res.data;
  },

  // Configurable Risk Rule Engine
  getRiskRuleConfig: async () => {
    const res = await api.get(`/risk-rules/config`);
    return res.data;
  },

  updateRiskRuleConfig: async (config) => {
    const res = await api.put(`/risk-rules/config`, config);
    return res.data;
  },

  resetRiskRuleConfig: async () => {
    const res = await api.post(`/risk-rules/reset`);
    return res.data;
  },

  // Investigation Case Workspace
  createCase: async (caseData) => {
    const res = await api.post(`/cases`, caseData);
    return res.data;
  },

  getUserCases: async () => {
    const res = await api.get(`/cases`);
    return res.data;
  },

  getCaseById: async (id) => {
    const res = await api.get(`/cases/${id}`);
    return res.data;
  },

  getCaseLiveDossier: async (id) => {
    const res = await api.get(`/cases/${id}/live-dossier`);
    return res.data;
  },

  updateCase: async (id, updates) => {
    const res = await api.put(`/cases/${id}`, updates);
    return res.data;
  },

  addAddressToCase: async (id, addressData) => {
    const res = await api.post(`/cases/${id}/addresses`, addressData);
    return res.data;
  },

  removeAddressFromCase: async (id, address) => {
    const res = await api.delete(`/cases/${id}/addresses/${address}`);
    return res.data;
  },

  addTimelineNote: async (id, noteData) => {
    const res = await api.post(`/cases/${id}/notes`, noteData);
    return res.data;
  },

  deleteCase: async (id) => {
    const res = await api.delete(`/cases/${id}`);
    return res.data;
  },

  // Consolidated Full Audit (All Modules)
  getFullForensicAudit: async (address) => {
    const res = await api.get(`/forensics/full-audit/${address}`);
    return res.data;
  },
};

export default forensicsApi;
