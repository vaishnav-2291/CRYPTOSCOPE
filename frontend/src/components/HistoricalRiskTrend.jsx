import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getWalletTrend } from "../services/api";
import { TrendingUp, History } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HistoricalRiskTrend = ({ address = "", currentRiskScore = 0 }) => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    const fetchTrend = async () => {
      try {
        setLoading(true);
        const res = await getWalletTrend(address);
        if (res?.trend && res.trend.length > 0) {
          setTrendData(res.trend);
        } else {
          // Fallback single current point
          setTrendData([
            {
              date: new Date().toISOString(),
              riskScore: currentRiskScore,
            },
          ]);
        }
      } catch (err) {
        setTrendData([
          {
            date: new Date().toISOString(),
            riskScore: currentRiskScore,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [address, currentRiskScore]);

  const labels = trendData.map((item, idx) => {
    const d = new Date(item.date);
    return isNaN(d.getTime()) ? `Scan #${idx + 1}` : d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  });

  const scores = trendData.map((item) => item.riskScore);

  const data = {
    labels: labels.length > 1 ? labels : ["Prior Baseline", "Current Scan"],
    datasets: [
      {
        label: "Risk Score",
        data: scores.length > 1 ? scores : [scores[0], scores[0]],
        borderColor: "#00F2FE",
        backgroundColor: "rgba(6, 182, 212, 0.15)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: "#00F2FE",
        pointBorderColor: "#fff",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(13, 21, 39, 0.95)",
        titleColor: "#00F2FE",
        bodyColor: "#F1F5F9",
        borderColor: "rgba(6, 182, 212, 0.3)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => `Risk Score: ${context.raw}/100`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748B", font: { size: 10, family: "JetBrains Mono" } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748B", stepSize: 25, font: { size: 10, family: "JetBrains Mono" } },
      },
    },
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold font-heading text-white">Historical Risk Score Trajectory</h3>
        </div>
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          {trendData.length} Stored Scans
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Track how this address's deterministic risk score evolved over time from repeated monitoring audits.
      </p>

      <div className="h-56 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default HistoricalRiskTrend;
