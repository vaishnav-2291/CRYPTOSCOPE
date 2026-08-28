import React from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

// Register ChartJS modules
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RiskRadarChart = ({ breakdown = {}, riskScore = 0 }) => {
  const transactionRisk = breakdown.transactionRisk || 0; // max 20
  const balanceRisk = breakdown.balanceRisk || 0;         // max 15
  const patternRisk = breakdown.patternRisk || 0;         // max 20
  const activityRisk = breakdown.activityRisk || 0;       // max 15
  const entityRisk = breakdown.entityRisk || 0;           // max 30

  // Normalize all 5 dimensions to a 0-100% scale for balanced radar representation
  const normalizedData = [
    Math.round((transactionRisk / 20) * 100),
    Math.round((balanceRisk / 15) * 100),
    Math.round((patternRisk / 20) * 100),
    Math.round((activityRisk / 15) * 100),
    Math.round((entityRisk / 30) * 100),
  ];

  const rawValues = [
    `${transactionRisk}/20 pts`,
    `${balanceRisk}/15 pts`,
    `${patternRisk}/20 pts`,
    `${activityRisk}/15 pts`,
    `${entityRisk}/30 pts`,
  ];

  const isHighRisk = riskScore >= 70;
  const isMedRisk = riskScore >= 40 && riskScore < 70;

  const primaryColor = isHighRisk
    ? "rgba(239, 68, 68, 0.85)"
    : isMedRisk
    ? "rgba(245, 158, 11, 0.85)"
    : "rgba(6, 182, 212, 0.85)";

  const fillColor = isHighRisk
    ? "rgba(239, 68, 68, 0.25)"
    : isMedRisk
    ? "rgba(245, 158, 11, 0.25)"
    : "rgba(6, 182, 212, 0.25)";

  const data = {
    labels: [
      "Transaction Velocity",
      "Balance Exposure",
      "Transit Pattern",
      "Activity Consistency",
      "Entity & Sanctions",
    ],
    datasets: [
      {
        label: "Risk Exposure (%)",
        data: normalizedData,
        backgroundColor: fillColor,
        borderColor: primaryColor,
        borderWidth: 2,
        pointBackgroundColor: primaryColor,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: primaryColor,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.08)",
        },
        pointLabels: {
          color: "#94A3B8",
          font: {
            family: "'Inter', sans-serif",
            size: 11,
            weight: "500",
          },
        },
        ticks: {
          display: false,
          min: 0,
          max: 100,
          stepSize: 25,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(13, 21, 39, 0.95)",
        titleColor: "#00F2FE",
        bodyColor: "#F1F5F9",
        borderColor: "rgba(6, 182, 212, 0.3)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            return `Exposure: ${context.raw}% (${rawValues[idx]})`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-64 md:h-72 flex items-center justify-center">
      <Radar data={data} options={options} />
    </div>
  );
};

export default RiskRadarChart;
