import React from "react";

function RiskGauge({ score = 0 }) {

  const radius = 70;
  const stroke = 12;

  const normalizedRadius = radius - stroke / 2;

  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = Math.min(Math.max(score, 0), 100);

  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  let color = "#22c55e";
  let level = "Low";

  if (progress >= 70) {

    color = "#ef4444";
    level = "High";

  } else if (progress >= 40) {

    color = "#f59e0b";
    level = "Medium";

  }

  return (

    <div className="flex flex-col items-center">

      <div className="relative w-44 h-44">

        <svg
          width="176"
          height="176"
          className="-rotate-90"
        >

          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="88"
            cy="88"
          />

          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            r={normalizedRadius}
            cx="88"
            cy="88"
            style={{
              transition: "stroke-dashoffset 1s ease"
            }}
          />

        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">

          <h2
            className="text-4xl font-bold"
            style={{ color }}
          >
            {progress}
          </h2>

          <p className="text-gray-400 text-sm">
            /100
          </p>

        </div>

      </div>

      <p
        className="mt-4 text-xl font-bold"
        style={{ color }}
      >
        {level} Risk
      </p>

    </div>

  );

}

export default RiskGauge;