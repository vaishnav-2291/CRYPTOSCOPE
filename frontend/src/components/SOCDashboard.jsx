import React from "react";


function SOCDashboard() {


  const metrics = [

    {
      title: "Total Wallets Analysed",
      value: "1240",
      icon: "🔍"
    },

    {
      title: "High Risk Alerts",
      value: "85",
      icon: "🔴"
    },

    {
      title: "Medium Risk Alerts",
      value: "210",
      icon: "🟡"
    },

    {
      title: "Threat Activity",
      value: "Active",
      icon: "🚨"
    }

  ];




  const alerts = [

    {
      level: "HIGH",
      message: "Abnormal wallet transaction behaviour detected"
    },

    {
      level: "MEDIUM",
      message: "High transaction frequency detected"
    },

    {
      level: "LOW",
      message: "Wallet behaviour appears normal"
    }

  ];







  return (



    <div
      className="
        mt-10
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-3xl
        p-8
      "
    >






      <h2 className="
        text-3xl
        font-bold
        text-white
        text-center
      ">


        🛡️ SOC Monitoring Dashboard


      </h2>







      <p className="
        text-gray-400
        text-center
        mt-3
      ">


        Security Operations Center view for blockchain threat monitoring.



      </p>









      <div className="
        mt-8
        grid
        grid-cols-1
        md:grid-cols-4
        gap-5
      ">



        {


          metrics.map((item,index)=>(


            <div

              key={index}

              className="
                bg-slate-900/50
                rounded-xl
                p-5
              "

            >



              <p className="text-3xl">

                {item.icon}

              </p>



              <p className="
                text-gray-400
                mt-3
              ">


                {item.title}


              </p>





              <h3 className="
                text-3xl
                font-bold
                text-cyan-400
              ">


                {item.value}


              </h3>




            </div>



          ))



        }



      </div>









      <div className="
        mt-8
        bg-slate-900/50
        rounded-xl
        p-6
      ">






        <h3 className="
          text-xl
          font-bold
          text-cyan-400
        ">


          🚨 Recent Security Alerts


        </h3>







        <div className="
          mt-5
          space-y-4
        ">




          {


            alerts.map((alert,index)=>(



              <div

                key={index}

                className="
                  bg-white/5
                  rounded-xl
                  p-4
                  flex
                  flex-col
                  md:flex-row
                  md:items-center
                  md:justify-between
                  gap-3
                "

              >





                <span
                  className={`
                    font-bold
                    ${
                      alert.level === "HIGH"
                      ? "text-red-400"
                      :
                      alert.level === "MEDIUM"
                      ? "text-yellow-400"
                      :
                      "text-green-400"
                    }
                  `}
                >



                  {alert.level}



                </span>







                <p className="text-gray-300">


                  {alert.message}


                </p>






              </div>



            ))



          }






        </div>






      </div>







    </div>



  );


}



export default SOCDashboard;