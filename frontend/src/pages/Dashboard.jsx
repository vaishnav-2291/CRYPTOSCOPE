import Navbar from "../components/Navbar";
import DashboardStats from "../components/DashboardStats";
import WalletAnalyzer from "../components/WalletAnalyzer";
import WalletHistory from "../components/WalletHistory";

function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950">

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-gray-400 mt-3">
            Analyze blockchain wallets and monitor your previous scans.
          </p>
        </div>

        {/* Dashboard Statistics */}
        <DashboardStats />

        {/* Wallet Analyzer */}
        <WalletAnalyzer />

        {/* Wallet History */}
        <WalletHistory />

      </div>

    </div>
  );
}

export default Dashboard;