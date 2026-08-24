import React from "react";
import { useNavigate } from "react-router-dom";
import BatchScanner from "../components/BatchScanner";

const BatchScan = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in">
      <BatchScanner onSelectAddress={(addr) => navigate(`/scan?address=${encodeURIComponent(addr)}`)} />
    </div>
  );
};

export default BatchScan;
