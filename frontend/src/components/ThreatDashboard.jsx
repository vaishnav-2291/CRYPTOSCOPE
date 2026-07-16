import React from "react";


function ThreatDashboard() {


  const stats = [

    {
      title: "Wallets Analyzed",
      value: "124",
      icon: "🔍"
    },

    {
      title: "High Risk Wallets",
      value: "18",
      icon: "🚨"
    },

    {
      title: "Suspicious Activities",
      value: "42",
      icon: "⚠️"
    },

    {
      title: "AI Accuracy",
      value: "96%",
      icon: "🤖"
    }

  ];




  const threats = [

    "Suspicious Transaction Patterns",

    "High Volume Fund Movement",

    "Unknown Address Interaction",

    "Abnormal Wallet Behaviour"

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


        🧠 AI Threat Intelligence Dashboard


      </h2>







      <p className="
        text-gray-400
        text-center
        mt-3
      ">


        Blockchain security insights generated using AI risk analysis.



      </p>







      <div className="
        mt-8
        grid
        grid-cols-1
        md:grid-cols-4
        gap-5
      ">



        {


          stats.map((item,index)=>(


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



              <h3 className="
                text-gray-400
                mt-3
              ">


                {item.title}


              </h3>




              <h2 className="
                text-3xl
                font-bold
                text-cyan-400
              ">


                {item.value}


              </h2>



            </div>



          ))



        }



      </div>









      <div className="
        mt-8
        grid
        grid-cols-1
        md:grid-cols-2
        gap-6
      ">







        <div className="
          bg-slate-900/50
          rounded-xl
          p-6
        ">




          <h3 className="
            text-xl
            font-bold
            text-cyan-400
          ">


            ⚠️ Common Threats


          </h3>






          <div className="
            mt-4
            space-y-3
          ">



            {


              threats.map((threat,index)=>(


                <div

                  key={index}

                  className="
                    bg-white/5
                    rounded-lg
                    p-3
                    text-gray-300
                  "

                >


                  ⚠️ {threat}


                </div>



              ))



            }



          </div>





        </div>








        <div className="
          bg-slate-900/50
          rounded-xl
          p-6
        ">




          <h3 className="
            text-xl
            font-bold
            text-cyan-400
          ">


            📊 Risk Distribution


          </h3>







          <div className="mt-5 space-y-5">





            <div>


              <p className="text-gray-300">


                Low Risk - 60%


              </p>


              <div className="
                h-3
                bg-green-500/20
                rounded-full
                mt-2
              ">


                <div className="
                  h-3
                  bg-green-500
                  rounded-full
                  w-[60%]
                ">


                </div>


              </div>


            </div>








            <div>


              <p className="text-gray-300">


                Medium Risk - 30%


              </p>



              <div className="
                h-3
                bg-yellow-500/20
                rounded-full
                mt-2
              ">


                <div className="
                  h-3
                  bg-yellow-500
                  rounded-full
                  w-[30%]
                ">


                </div>


              </div>


            </div>








            <div>


              <p className="text-gray-300">


                High Risk - 10%


              </p>




              <div className="
                h-3
                bg-red-500/20
                rounded-full
                mt-2
              ">


                <div className="
                  h-3
                  bg-red-500
                  rounded-full
                  w-[10%]
                ">


                </div>


              </div>


            </div>






          </div>






        </div>








      </div>







    </div>



  );


}



export default ThreatDashboard;