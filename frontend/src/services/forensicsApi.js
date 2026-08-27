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

  // Consolidated Full Audit (All Modules)
  getFullForensicAudit: async (address) => {
    const res = await api.get(`/forensics/full-audit/${address}`);
    return res.data;
  },
};

export default forensicsApi;
