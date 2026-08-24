import React from "react";
import { useSearchParams } from "react-router-dom";
import WalletAnalyzer from "../components/WalletAnalyzer";

const WalletScan = () => {
  const [searchParams] = useSearchParams();
  const addressParam = searchParams.get("address") || searchParams.get("scan") || "";

  return (
    <div className="space-y-6 animate-in fade-in">
      <WalletAnalyzer initialAddress={addressParam} />
    </div>
  );
};

export default WalletScan;
