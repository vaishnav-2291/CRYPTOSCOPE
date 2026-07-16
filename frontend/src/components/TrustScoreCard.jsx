import React from "react";

function TrustScoreCard({ score = 0 }) {

  let trust = "Trusted Wallet";
  let color = "text-green-400";
  let stars = "⭐⭐⭐⭐⭐";
  let recommendation = "Safe to interact";
  let confidence = 96;

  if (score >= 70) {

    trust = "High Risk Wallet";
    color = "text-red-400";
    stars = "⭐";
    recommendation = "Avoid interacting";
    confidence = 92;

  } else if (score >= 40) {

    trust = "Suspicious Wallet";
    color = "text-yellow-400";
    stars = "⭐⭐⭐";
    recommendation = "Proceed with caution";
    confidence = 94;

  }

  return (

    <div
      className="
        bg-slate-900/40
        border
        border-cyan-500/20
        rounded-2xl
        p-6
      "
    >

      <h3 className="text-2xl font-bold text-cyan-400 mb-6">

        Wallet Trust Score

      </h3>

      <div className="space-y-4">

        <div>

          <p className="text-4xl">

            {stars}

          </p>

        </div>

        <div>

          <h2 className="text-5xl font-bold text-white">

            {100 - score}/100

          </h2>

        </div>

        <div>

          <p className="text-gray-400">

            Trust Level

          </p>

          <h3 className={`text-2xl font-bold ${color}`}>

            {trust}

          </h3>

        </div>

        <div>

          <p className="text-gray-400">

            AI Confidence

          </p>

          <h3 className="text-xl text-cyan-400 font-bold">

            {confidence}%

          </h3>

        </div>

        <div>

          <p className="text-gray-400">

            Recommendation

          </p>

          <h3 className="text-white font-semibold">

            {recommendation}

          </h3>

        </div>

      </div>

    </div>

  );

}

export default TrustScoreCard;