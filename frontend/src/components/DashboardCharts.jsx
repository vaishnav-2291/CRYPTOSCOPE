import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// ===============================
// Custom Risk Gauge
// ===============================

function RiskGauge({ score }) {
  const percentage = Math.min(Math.max(score || 0, 0), 100);

  const color =
    percentage >= 70
      ? "#ef4444"
      : percentage >= 40
      ? "#f59e0b"
      : "#22c55e";

  const level =
    percentage >= 70
      ? "High"
      : percentage >= 40
      ? "Medium"
      : "Low";

  return (
    <div className="flex flex-col items-center">

      <div
        className="w-52 h-52 rounded-full flex items-center justify-center transition-all duration-700"
        style={{
          background: `conic-gradient(${color} ${percentage * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
        }}
      >

        <div className="w-40 h-40 rounded-full bg-slate-950 border border-white/10 flex flex-col items-center justify-center">

          <h2 className="text-5xl font-bold text-white">
            {percentage}
          </h2>

          <p className="text-gray-400 text-lg">
            /100
          </p>

          <span
            className="mt-2 px-4 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: color,
              color: "#fff"
            }}
          >
            {level} Risk
          </span>

        </div>

      </div>

      <p className="text-gray-300 mt-5 text-lg font-semibold">
        Average Risk Score
      </p>

    </div>
  );
}

function DashboardCharts({ stats }) {

  const pieData = {

    labels: [
      "High Risk",
      "Medium Risk",
      "Low Risk",
    ],

    datasets: [
      {
        data: [
          stats.highRiskWallets || 0,
          stats.mediumRiskWallets || 0,
          stats.lowRiskWallets || 0,
        ],

        backgroundColor: [
          "#ef4444",
          "#f59e0b",
          "#22c55e",
        ],

        borderWidth: 0,
      },
    ],

  };

  const barData = {

    labels: [
      "Wallet Scans",
      "Transactions",
      "Avg Risk",
    ],

    datasets: [
      {

        label: "Statistics",

        data: [
          stats.totalScans || 0,
          stats.totalTransactions || 0,
          stats.averageRiskScore || 0,
        ],

        backgroundColor: [
          "#06b6d4",
          "#8b5cf6",
          "#f59e0b",
        ],

        borderRadius: 8,

      },
    ],

  };

  return (

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-10">

      {/* Risk Gauge */}

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-center">

        <RiskGauge score={stats.averageRiskScore} />

      </div>

      {/* Pie Chart */}

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">

        <h2 className="text-white text-2xl font-bold mb-6 text-center">
          Wallet Risk Distribution
        </h2>

        <Pie data={pieData} />

      </div>

      {/* Bar Chart */}

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">

        <h2 className="text-white text-2xl font-bold mb-6 text-center">
          Platform Statistics
        </h2>

        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                ticks: {
                  color: "#ffffff",
                },
                grid: {
                  color: "rgba(255,255,255,0.05)",
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: "#ffffff",
                },
                grid: {
                  color: "rgba(255,255,255,0.05)",
                },
              },
            },
          }}
        />

      </div>

    </div>

  );

}

export default DashboardCharts;