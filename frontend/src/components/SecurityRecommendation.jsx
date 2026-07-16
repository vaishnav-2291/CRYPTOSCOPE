import React from "react";

function SecurityRecommendation({ score = 0, factors = [] }) {


  let status = "Low Risk";
  let color = "text-green-400";
  let threat = "Low";

  let recommendations = [
    "Continue monitoring wallet activity",
    "Verify transactions before interaction",
    "Keep wallet security practices active"
  ];



  if (score >= 70) {


    status = "High Risk";
    color = "text-red-400";
    threat = "High";


    recommendations = [
      "Avoid interacting with unknown addresses",
      "Do not send funds to suspicious wallets",
      "Review recent transaction activity carefully"
    ];



  } else if (score >= 40) {



    status = "Medium Risk";
    color = "text-yellow-400";
    threat = "Medium";


    recommendations = [
      "Monitor unusual transaction patterns",
      "Verify sender addresses before transactions",
      "Check wallet activity regularly"
    ];



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



      <h3 className="
        text-2xl
        font-bold
        text-cyan-400
        mb-6
      ">


        🛡️ Security Recommendation


      </h3>







      <div className="space-y-5">



        <div>


          <p className="text-gray-400">

            Wallet Status

          </p>



          <h2 className={`text-3xl font-bold ${color}`}>

            {status}

          </h2>



        </div>







        <div>


          <p className="text-gray-400">

            AI Suggestions

          </p>




          <div className="
            mt-3
            space-y-2
          ">


            {


              recommendations.map((item,index)=>(


                <div

                  key={index}

                  className="
                    bg-white/5
                    rounded-lg
                    p-3
                    text-gray-300
                  "

                >


                  ✓ {item}


                </div>


              ))


            }


          </div>



        </div>







        {

          factors.length > 0 && (


            <div>


              <p className="text-gray-400">

                Detected Threat Factors

              </p>




              <div className="
                mt-3
                space-y-2
              ">



                {


                  factors.map((factor,index)=>(


                    <div

                      key={index}

                      className="
                        bg-red-500/10
                        rounded-lg
                        p-3
                        text-red-300
                      "

                    >

                      ⚠️ {factor}


                    </div>


                  ))



                }



              </div>


            </div>


          )

        }







        <div className="
          bg-cyan-500/10
          rounded-xl
          p-4
        ">



          <p className="text-gray-400">

            Threat Level

          </p>



          <h2 className="
            text-2xl
            font-bold
            text-white
          ">


            {threat}


          </h2>



        </div>






      </div>





    </div>



  );


}



export default SecurityRecommendation;