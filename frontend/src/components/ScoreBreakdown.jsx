import React from "react";

function ScoreBreakdown({
  breakdown = {},
  riskScore = 0,
  riskLevel = "Low",
  riskFactors = [],
}) {
  const items = [
    {
      title: "Transaction Risk",
      value: breakdown.transactionRisk || 0,
      max: 40,
      color: "bg-red-500",
      description:
        "Measures the overall transaction volume and frequency of the wallet.",
    },
    {
      title: "Balance Risk",
      value: breakdown.balanceRisk || 0,
      max: 25,
      color: "bg-orange-500",
      description:
        "Evaluates how much cryptocurrency is currently held by the wallet.",
    },
    {
      title: "Transaction Pattern Risk",
      value: breakdown.transactionPatternRisk || 0,
      max: 15,
      color: "bg-yellow-500",
      description:
        "Analyzes unusual transaction behaviour and transfer patterns.",
    },
    {
      title: "Activity Risk",
      value: breakdown.activityRisk || 0,
      max: 5,
      color: "bg-cyan-500",
      description:
        "Checks wallet activity level and account usage consistency.",
    },
  ];

  const getRiskColor = (level) => {
    switch ((level || "").toLowerCase()) {
      case "high":
        return "text-red-400 border-red-500/30 bg-red-500/10";
      case "medium":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      default:
        return "text-green-400 border-green-500/30 bg-green-500/10";
    }
  };

  const scoreColor =
    riskScore >= 70
      ? "text-red-400"
      : riskScore >= 40
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div
      className="
        mt-8
        bg-slate-900/50
        border
        border-cyan-500/20
        rounded-2xl
        p-6
        backdrop-blur-md
      "
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">
            📊 AI Risk Score Breakdown
          </h2>

          <p className="text-gray-400 mt-2">
            AI-generated explanation of how the wallet's final risk score was
            calculated.
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end">
          <span className={`text-5xl font-extrabold ${scoreColor}`}>
            {riskScore}
            <span className="text-2xl text-white">/100</span>
          </span>

          <span
            className={`mt-3 px-4 py-1 rounded-full border text-sm font-semibold ${getRiskColor(
              riskLevel
            )}`}
          >
            {riskLevel} Risk
          </span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-gray-300 font-medium">
            Overall Risk Score
          </span>

          <span className={`font-bold ${scoreColor}`}>
            {riskScore}/100
          </span>
        </div>

        <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-4 transition-all duration-1000 ${
              riskScore >= 70
                ? "bg-red-500"
                : riskScore >= 40
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{
              width: `${Math.min(riskScore, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-7">
        {items.map((item, index) => {
          const percentage = (item.value / item.max) * 100;

          return (
            <div
              key={index}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-white font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>

                <span className="text-white font-bold">
                  +{item.value}/{item.max}
                </span>
              </div>

              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`${item.color} h-3 rounded-full transition-all duration-700`}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {riskFactors.length > 0 && (
        <div className="mt-10">
          <h3 className="text-cyan-400 text-xl font-bold mb-5">
            🚨 Detected Risk Factors
          </h3>

          <div className="space-y-4">
            {riskFactors.map((factor, index) => (
              <div
                key={index}
                className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-red-500/20
                  bg-red-500/5
                  p-4
                "
              >
                <div className="text-red-400 text-xl mt-1">⚠️</div>

                <div>
                  <p className="text-white font-medium">
                    {factor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="
          mt-10
          rounded-xl
          bg-cyan-500/10
          border
          border-cyan-500/20
          p-5
        "
      >
        <h3 className="text-cyan-400 font-bold mb-3 text-lg">
          🧠 AI Explanation
        </h3>

        <p className="text-gray-300 leading-8">
          CryptoScope AI evaluates wallet behaviour using multiple weighted risk
          indicators including transaction volume, wallet balance, behavioural
          patterns, and overall activity. Each category contributes a predefined
          score to the final AI Risk Score, helping analysts understand why a
          wallet has been classified as Low, Medium, or High Risk. This
          transparent breakdown enables faster investigations and improves
          decision-making during blockchain threat analysis.
        </p>
      </div>
    </div>
  );
}

export default ScoreBreakdown;