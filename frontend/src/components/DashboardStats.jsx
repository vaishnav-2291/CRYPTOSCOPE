import { useEffect, useState } from "react";
import DashboardCharts from "./DashboardCharts";


function DashboardStats() {


  const [stats, setStats] = useState({

    totalScans: 0,

    highRiskWallets: 0,

    mediumRiskWallets: 0,

    lowRiskWallets: 0,

    averageRiskScore: 0,

    totalTransactions: 0,

  });





  useEffect(() => {

    fetchStats();

  }, []);





  const fetchStats = async () => {


    try {


      const response = await fetch(

        "/api/wallet/dashboard/stats",

        {

          headers: {

            Authorization: localStorage.getItem("token"),

          },

        }

      );



      const data = await response.json();



      if(data.success){

        setStats(data);

      }



    }

    catch(error){


      console.error(error);


    }


  };







  const getRiskLevel = (score) => {


    if(score >= 70){

      return "HIGH RISK";

    }


    else if(score >= 40){

      return "MEDIUM RISK";

    }


    else{

      return "LOW RISK";

    }


  };







  const getRiskColor = (score) => {


    if(score >= 70){

      return "text-red-400";

    }


    else if(score >= 40){

      return "text-yellow-400";

    }


    else{

      return "text-green-400";

    }


  };







  const cards = [


    {

      title:"Total Wallet Scans",

      value:stats.totalScans,

      icon:"📂",

      color:"text-cyan-400"

    },



    {

      title:"High Risk Wallets",

      value:stats.highRiskWallets,

      icon:"⚠️",

      color:"text-red-400"

    },



    {

      title:"Average Risk Score",

      value:`${stats.averageRiskScore}/100`,

      icon:"📈",

      color:"text-yellow-400"

    },



    {

      title:"Transactions Analyzed",

      value:stats.totalTransactions,

      icon:"🔄",

      color:"text-green-400"

    },


  ];






  return (

    <>



      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-6
        mb-10
      ">



        {cards.map((item,index)=>(



          <div

            key={index}

            className="
              bg-white/5
              backdrop-blur-xl
              border
              border-white/10
              rounded-2xl
              p-6
              hover:border-cyan-400/50
              transition
            "

          >



            <div className="flex items-center justify-between">



              <div>



                <p className="text-gray-400 text-sm">

                  {item.title}

                </p>



                <h2 className={`text-3xl font-bold mt-3 ${item.color}`}>

                  {item.value}

                </h2>



              </div>





              <div className="text-5xl">

                {item.icon}

              </div>



            </div>



          </div>



        ))}



      </div>








      {/* RISK GAUGE METER */}



      <div className="
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-2xl
        p-8
        mb-10
      ">



        <h2 className="text-2xl font-bold text-white text-center">

          🛡️ Wallet Risk Score

        </h2>




        <div className="flex flex-col items-center mt-8">





          <div className="
            w-48
            h-48
            rounded-full
            border-8
            border-cyan-400
            flex
            items-center
            justify-center
          ">



            <div className="text-center">



              <h1 className="text-5xl font-bold text-white">

                {stats.averageRiskScore}

              </h1>



              <p className="text-gray-400">

                /100

              </p>



            </div>




          </div>






          <h3 className={`text-2xl font-bold mt-6 ${getRiskColor(stats.averageRiskScore)}`}>

            {getRiskLevel(stats.averageRiskScore)}

          </h3>






        </div>



      </div>






      <DashboardCharts stats={stats} />



    </>

  );

}



export default DashboardStats;