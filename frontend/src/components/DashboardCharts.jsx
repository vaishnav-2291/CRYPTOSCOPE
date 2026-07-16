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

import RiskGauge from "./RiskGauge";


ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);



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


      <div
        className="
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-2xl
        p-6
        flex
        items-center
        justify-center
        "
      >


        <RiskGauge
          score={stats.averageRiskScore}
        />


      </div>








      {/* Pie Chart */}


      <div
        className="
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-2xl
        p-6
        "
      >



        <h2
          className="
          text-white
          text-2xl
          font-bold
          mb-6
          text-center
          "
        >

          Wallet Risk Distribution

        </h2>





        <Pie data={pieData} />



      </div>








      {/* Bar Chart */}


      <div
        className="
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-2xl
        p-6
        "
      >



        <h2
          className="
          text-white
          text-2xl
          font-bold
          mb-6
          text-center
          "
        >

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