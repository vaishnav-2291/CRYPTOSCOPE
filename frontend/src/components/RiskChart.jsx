import { useEffect, useState } from "react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function RiskChart() {

  const [chartData, setChartData] = useState({

    labels: ["High", "Medium", "Low"],

    datasets: [

      {
        data: [0, 0, 0],

        backgroundColor: [

          "#ef4444",
          "#f59e0b",
          "#22c55e",

        ],

        borderWidth: 0,

      },

    ],

  });

  useEffect(() => {

    fetchChart();

  }, []);

  const fetchChart = async () => {

    try {

      const response = await fetch("/api/wallet/history/all", {

        headers: {

          Authorization: localStorage.getItem("token"),

        },

      });

      const data = await response.json();

      if (!data.success) return;

      let high = 0;
      let medium = 0;
      let low = 0;

      data.history.forEach((wallet) => {

        if (wallet.riskLevel === "High") high++;

        else if (wallet.riskLevel === "Medium") medium++;

        else low++;

      });

      setChartData({

        labels: ["High", "Medium", "Low"],

        datasets: [

          {

            data: [high, medium, low],

            backgroundColor: [

              "#ef4444",
              "#f59e0b",
              "#22c55e",

            ],

            borderWidth: 0,

          },

        ],

      });

    }

    catch (err) {

      console.log(err);

    }

  };

  return (

    <div className="mt-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

      <h2 className="text-3xl font-bold text-white mb-8 text-center">

        Wallet Risk Distribution

      </h2>

      <div className="max-w-md mx-auto">

        <Pie data={chartData} />

      </div>

    </div>

  );

}

export default RiskChart;